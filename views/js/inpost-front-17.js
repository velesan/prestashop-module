/**
 * 2007-2026 PrestaShop.
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License 3.0 (AFL-3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/AFL-3.0
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@prestashop.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade PrestaShop to newer
 * versions in the future. If you wish to customize PrestaShop for your
 * needs please refer to http://www.prestashop.com for more information.
 *
 * @author    PrestaShop SA <contact@prestashop.com>
 * @copyright 2007-2026 PrestaShop SA
 * @license   https://opensource.org/licenses/AFL-3.0 Academic Free License 3.0 (AFL-3.0)
 * International Registered Trademark & Property of PrestaShop SA
 */

// Removed performAutoSearch - no longer needed as we don't auto-search

// Helper function to get config value from namespace or data attributes
(function() {
    'use strict';

    // Create GlobKurier namespace if it doesn't exist
    if (typeof window.GlobKurier === 'undefined') {
        window.GlobKurier = {};
    }

    // Helper to get config value with fallback to data attributes
    window.GlobKurier.getConfig = function(key, defaultValue) {
        const container = document.getElementById('pickup-terminal-container');

        // Try namespace first
        if (window.GlobKurier.config && window.GlobKurier.config[key] !== undefined) {
            return window.GlobKurier.config[key];
        }

        // Fallback to data attributes
        if (container) {
            const dataKey = 'gk-' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
            const dataValue = container.getAttribute('data-' + dataKey);
            if (dataValue !== null) {
                return dataValue;
            }
        }

        return defaultValue !== undefined ? defaultValue : null;
    };

    // Helper to get nested config value (e.g., 'carriers.inpost')
    window.GlobKurier.get = function(path, defaultValue) {
        if (!window.GlobKurier.config) {
            return defaultValue !== undefined ? defaultValue : null;
        }

        const keys = path.split('.');
        let value = window.GlobKurier.config;

        for (let i = 0; i < keys.length; i++) {
            if (value === null || value === undefined || typeof value !== 'object') {
                return defaultValue !== undefined ? defaultValue : null;
            }
            value = value[keys[i]];
        }

        return value !== undefined ? value : (defaultValue !== undefined ? defaultValue : null);
    };
})();

$(function () {
    // const baseApiUrl = 'http://test.api.globkurier.pl/v1/';
    const baseApiUrl = 'https://api.globkurier.pl/v1/';
    const mainContainer = $('#pickup-terminal-container');
    const searchTownInput = $('input[name="pickup_town"]');
    let cachedPoints = [];
    let leafletMap = null;
    let leafletMarkers = [];
    let isMapInitializing = false;
    let mapInitRetries = 0;
    const maxMapInitRetries = 10;
    let markerClusterGroup = null;
    let selectedMarker = null;
    let allCachedPoints = []; // All points loaded at startup
    let autoSearchPerformed = false; // Flag whether automatic search was performed
    const _self = this;

    if (mainContainer.length === 0 || searchTownInput.length === 0) {
        return;
    }

    function positionPickupContainer() {
        const $cont = $('#pickup-terminal-container');
        if ($cont.length === 0) return;

        // PS 8/9 Hummingbird + PS 1.7/8 Classic with <ul>: place after the list element
        const $list = $('.delivery-options__list');
        if ($list.length > 0) {
            $cont.insertAfter($list);
            return;
        }

        // PS 1.7 Classic: carriers are direct divs inside .delivery-options (no <ul>)
        const $deliveryOptions = $('.delivery-options');
        if ($deliveryOptions.length > 0) {
            $cont.appendTo($deliveryOptions);
            return;
        }

        // Hummingbird without list fallback
        const $hbContainer = $('.delivery-options__container');
        if ($hbContainer.length > 0) {
            $cont.appendTo($hbContainer);
            return;
        }

        // Last resort: before the submit button, not at the end of the form
        const $btn = $('button[name="confirmDeliveryOption"]');
        if ($btn.length > 0) {
            $cont.insertBefore($btn);
        }
    }

    positionPickupContainer();

    // Re-position after PS 1.7/8/9 AJAX refresh of the delivery step
    if (window.prestashop && window.prestashop.on) {
        window.prestashop.on('updatedDeliveryForm', positionPickupContainer);
    }

    $('img.ajax-loader').hide();
    if (isAnyCarrierSelected()) {
        mainContainer.show();
        const serviceCode = (isRuchCarrierSelected() ? "ORLEN PACZKA" : (isPocztex48owpCarrierSelected() ? "POCZTA POLSKA" : (isDhlParcelCarrierSelected() ? "DHL ParcelShop" : (isDpdPickupCarrierSelected() ? "DPD PICKUP" : "PACZKOMAT"))));
        searchTownInput.data("service-code", serviceCode);

        // Don't load points automatically - wait for user search
        // loadCachedPoints(serviceCode);

        // Pre-fill search field with delivery city if available
        setTimeout(function() {
            const deliveryCity = window.GlobKurier.get('address.city');
            if (deliveryCity) {
                searchTownInput.val(deliveryCity);
            }
        }, 100);
    } else {
        mainContainer.hide();
    }

    /**
     * Shows/hides pickup point selection window
     * removes any information about selected pickup point when e.g. client
     * changes mind and after selecting pickup point chooses another carrier
     */
    // $('input.delivery_option_radio').change(function() {
    // Support both Classic (.delivery-option) and Hummingbird (.delivery-options__item) themes
    $(document).on('click', '.delivery-option input[type=radio], .delivery-options__item input[type=radio], .js-delivery-option input[type=radio]', function () {
        // Always use fresh DOM reference — PS 8 AJAX may have replaced the container
        const $cont = $('#pickup-terminal-container');
        const $searchInput = $cont.find('input[name="pickup_town"]');

        // If config was not set by template script (PS 8 v-html/AJAX injection), init from data attributes
        const contEl = $cont[0];
        if (contEl && !window.GlobKurier.config) {
            window.GlobKurier.config = {
                carriers: {
                    inpost: contEl.getAttribute('data-gk-carrier-inpost') || null,
                    inpostCod: contEl.getAttribute('data-gk-carrier-inpost-cod') || null,
                    paczkaruch: contEl.getAttribute('data-gk-carrier-paczkaruch') || null,
                    pocztex48owp: contEl.getAttribute('data-gk-carrier-pocztex48owp') || null,
                    dhlparcel: null,
                    dpdpickup: contEl.getAttribute('data-gk-carrier-dpdpickup') || null
                },
                cart: {
                    id: parseInt(contEl.getAttribute('data-gk-cart-id'), 10) || null,
                    token: contEl.getAttribute('data-gk-token') || null
                },
                api: {
                    endpoint: contEl.getAttribute('data-gk-rest-endpoint') || null,
                    baseUrl: contEl.getAttribute('data-gk-base-url') || null
                },
                address: {
                    city: contEl.getAttribute('data-gk-delivery-city') || '',
                    postcode: contEl.getAttribute('data-gk-delivery-postcode') || ''
                },
                i18n: { mainText: '', mainText2: '' }
            };
        }

        $cont.hide();
        $('.pickup-result').hide();
        $('#containerForMapOfTerminals').hide();
        deletePickupPoint();
        _self.inpostCarrierSelected = false;

        // Clear cached points when switching carriers
        cachedPoints = [];
        allCachedPoints = [];

        // Clear dropdown
        $('select[name="pickup_point"]').empty().append('<option value="0">Proszę wybrać</option>');

        // Clear map markers
        if (markerClusterGroup && leafletMap) {
            leafletMap.removeLayer(markerClusterGroup);
            markerClusterGroup = null;
        }

        // Reset selected marker
        selectedMarker = null;

        // Get i18n strings from namespace
        const mainTextLang = window.GlobKurier.get('i18n.mainText', '');
        const mainTextLang2 = window.GlobKurier.get('i18n.mainText2', '');

        let carrierName = '',
            all_text = '';

        // Read carrier IDs: namespace config first, data attributes as fallback
        const inpostId = window.GlobKurier.get('carriers.inpost') || (contEl && contEl.getAttribute('data-gk-carrier-inpost')) || null;
        const inpostCodId = window.GlobKurier.get('carriers.inpostCod') || (contEl && contEl.getAttribute('data-gk-carrier-inpost-cod')) || null;
        const paczkaruchId = window.GlobKurier.get('carriers.paczkaruch') || (contEl && contEl.getAttribute('data-gk-carrier-paczkaruch')) || null;
        const pocztexId = window.GlobKurier.get('carriers.pocztex48owp') || (contEl && contEl.getAttribute('data-gk-carrier-pocztex48owp')) || null;
        const dhlparcelId = window.GlobKurier.get('carriers.dhlparcel') || null;
        const dpdpickupId = window.GlobKurier.get('carriers.dpdpickup') || (contEl && contEl.getAttribute('data-gk-carrier-dpdpickup')) || null;

        if (inpostId && $(this).val() == (inpostId + ',')) {
            $cont.show();
            $searchInput.data("service-code", "PACZKOMAT");
            carrierName = 'Paczkomatów InPost';
            all_text = mainTextLang+' '+mainTextLang2+' '+carrierName;
            setTimeout(function() {
                const deliveryCity = window.GlobKurier.get('address.city') || (contEl && contEl.getAttribute('data-gk-delivery-city')) || '';
                if (deliveryCity) { $searchInput.val(deliveryCity); }
            }, 50);
        } else if (inpostCodId && $(this).val() == (inpostCodId + ',')) {
            $cont.show();
            $searchInput.data("service-code", "PACZKOMAT");
            carrierName = 'Paczkomatów InPost (COD)';
            all_text = mainTextLang+' '+mainTextLang2+' '+carrierName;
            setTimeout(function() {
                const deliveryCity = window.GlobKurier.get('address.city') || (contEl && contEl.getAttribute('data-gk-delivery-city')) || '';
                if (deliveryCity) { $searchInput.val(deliveryCity); }
            }, 50);
        } else if (paczkaruchId && $(this).val() == (paczkaruchId + ',')) {
            $cont.show();
            $searchInput.data("service-code", "ORLEN PACZKA");
            carrierName = 'ORLEN Paczki';
            all_text = mainTextLang+' '+mainTextLang2+' '+carrierName;
            setTimeout(function() {
                const deliveryCity = window.GlobKurier.get('address.city') || (contEl && contEl.getAttribute('data-gk-delivery-city')) || '';
                if (deliveryCity) { $searchInput.val(deliveryCity); }
            }, 50);
        } else if (pocztexId && $(this).val() == (pocztexId + ',')) {
            $cont.show();
            $searchInput.data("service-code", "POCZTA POLSKA");
            carrierName = 'Pocztex48';
            all_text = mainTextLang+' '+mainTextLang2+' '+carrierName;
            setTimeout(function() {
                const deliveryCity = window.GlobKurier.get('address.city') || (contEl && contEl.getAttribute('data-gk-delivery-city')) || '';
                if (deliveryCity) { $searchInput.val(deliveryCity); }
            }, 50);
        } else if (dhlparcelId && $(this).val() == (dhlparcelId + ',')) {
            $cont.show();
            $searchInput.data("service-code", "DHL PARCEL");
            carrierName = 'DHL ParcelShop';
            all_text = mainTextLang+' '+mainTextLang2+' '+carrierName;
            setTimeout(function() {
                const deliveryCity = window.GlobKurier.get('address.city') || (contEl && contEl.getAttribute('data-gk-delivery-city')) || '';
                if (deliveryCity) { $searchInput.val(deliveryCity); }
            }, 50);
        } else if (dpdpickupId && $(this).val() == (dpdpickupId + ',')) {
            $cont.show();
            $searchInput.data("service-code", "DPD PICKUP");
            carrierName = 'DPD Pickup';
            all_text = mainTextLang+' '+mainTextLang2+' '+carrierName;
            setTimeout(function() {
                const deliveryCity = window.GlobKurier.get('address.city') || (contEl && contEl.getAttribute('data-gk-delivery-city')) || '';
                if (deliveryCity) { $searchInput.val(deliveryCity); }
            }, 50);
        }
        $('.pickup-search span').text(all_text);
        return true;
    });

    function deletePickupPoint()
    {
        const el = document.getElementById('pickup-terminal-container');
        const cartId = window.GlobKurier.get('cart.id') || (el && el.getAttribute('data-gk-cart-id'));
        const token = window.GlobKurier.get('cart.token') || (el && el.getAttribute('data-gk-token'));
        const endpoint = window.GlobKurier.get('api.endpoint') || (el && el.getAttribute('data-gk-rest-endpoint'));

        if (!cartId || !token || !endpoint) {
            console.error('GlobKurier Module: Missing required variables (cart_id, gk_token, or rest_endpoint)');
            return;
        }

        const postData = {
            id_cart: cartId,
            ajax: 1,
            action: 'deletePickupPoint',
            token: token,
        };
        const url = endpoint.replaceAll("&amp;", "&");
        $.getJSON(url, postData);
    }

    $(document).on('click', '#containerForMapOfTerminals .marker-info .marker-info-link', function (e) {
        e.preventDefault();
        const terminalId = $(this).attr("data-terminalId");
        const options = $('select[name="pickup_point"]').find('option');
        for (let i = 0; i < options.length; i++) {
            if (options[i].value == terminalId) {
                options[i].selected = true;
                // Trigger change event which will also highlight the marker
                $('select[name="pickup_point"]').trigger("change");
                break;
            }
        }
        // Close Leaflet popup
        if (leafletMap) {
            leafletMap.closePopup();
        }
    });

    // Handle Enter key in search field
    $(document).on('keypress', 'input[name="pickup_town"]', function (e) {
        if (e.which === 13) { // Enter key
            e.preventDefault();
            $('button.search-button').trigger('click');
        }
    });

    /**
     * Fetches pickup points list from globkurier.pl server
     */
    $(document).on('click', 'button.search-button', function (e) {
        e.preventDefault();
        // var url = 'https://www.webservices.globkurier.pl/services/terminal/';

        let value = searchTownInput.val().trim();

        // If field is empty, show all points
        if (!value) {
            cachedPoints = allCachedPoints;
            fillDropdownWithTerminals();
            $('.pickup-result').show();
            $('.pickup-loader .lds-ripple').hide();
            // Ensure map is drawn after result is shown
            setTimeout(function() {
                drawMap();
            }, 100);
            return;
        }

        // Parse input to separate city and postcode
        let town = value;
        let postcode = '';

        if( value.indexOf(',') != -1 ){
            let parts = value.split(',');
            town = parts[0].trim();
            postcode = parts[1] ? parts[1].trim() : '';
        }

        let url = baseApiUrl + 'points',
            productCode = searchTownInput.data("service-code");

        // If searching with delivery city, also include postcode for better results
        // if (typeof window.delivery_city !== 'undefined' && town === window.delivery_city &&
        //     typeof window.delivery_postcode !== 'undefined' && window.delivery_postcode && !postcode) {
        //     postcode = window.delivery_postcode;
        // }

        $('div.no_results').hide();
        // $('img.ajax-loader').show();
        $('.pickup-result').hide();
        $('.pickup-loader .lds-ripple').show();

        getProductId(productCode, function (err, productId) {
            if (err) {
                console.error('Error getting product ID:', err);
                $('img.ajax-loader').hide();
                $('.pickup-loader .lds-ripple').hide();
                $('.pickup-result').show();
                $('div.no_results').show();
                $('select[name="pickup_point"]').html('<option value="0">Nie znaleziono punktów - ' + err + '</option>');
                return;
            }

            // Build API parameters - use city/postCode instead of filter for better precision
            let apiParams = {
                productId: productId,
                isCashOnDeliveryAddonSelected: isInpostCODCarrierSelected()
            };

            if (town) {
                apiParams.city = town;
            }
            if (postcode) {
                apiParams.postCode = postcode;
            }

            // Fallback to filter if no city specified
            if (!town && !postcode) {
                apiParams.filter = value;
            }

            $.getJSON(url, apiParams).done(function (r) {
                 $('img.ajax-loader').hide();
                 $('.pickup-loader .lds-ripple').hide();
                 $('.pickup-result').show();
                 updateTerminalPoints(r, town || value);
             }).fail(function(xhr, status, error) {
                console.error('Error fetching points:', error);
                $('img.ajax-loader').hide();
                $('.pickup-loader .lds-ripple').hide();
                $('.pickup-result').show();
                $('div.no_results').show();
                $('select[name="pickup_point"]').html('<option value="0">Błąd pobierania punktów</option>');
            });
        });
    });

    $(document).on('input', 'input[name="pickup_town"]', function () {
        $('#gk-pickup-error').removeClass('is-visible');
    });

    $(document).on('change', 'select[name="pickup_point"]', function () {
        const selected_point = $('select[name="pickup_point"]').val();
        if (selected_point !== '0' && selected_point) {
            $('#gk-pickup-error').removeClass('is-visible');
            $('select[name="pickup_point"]').removeClass('gk-field-error');
        }
        if (selected_point === 0 || selected_point == '0') {
            // Remove highlighting when no point is selected
            if (selectedMarker) {
                selectedMarker.setIcon(L.icon({
                    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                }));
                selectedMarker = null;
            }
            return true;
        }
        const el = document.getElementById('pickup-terminal-container');
        const cartId = window.GlobKurier.get('cart.id') || (el && el.getAttribute('data-gk-cart-id'));
        const token = window.GlobKurier.get('cart.token') || (el && el.getAttribute('data-gk-token'));
        const endpoint = window.GlobKurier.get('api.endpoint') || (el && el.getAttribute('data-gk-rest-endpoint'));

        if (!cartId || !token || !endpoint) {
            console.error('GlobKurier Module: Missing required variables (cart_id, gk_token, or rest_endpoint)');
            return;
        }

        // Always read service-code from the current container's input (stale reference fix for PS 8)
        const productCode = el
            ? ($(el).find('input[name="pickup_town"]').data("service-code") || searchTownInput.data("service-code"))
            : searchTownInput.data("service-code");
        const url = endpoint.replaceAll("&amp;", "&");
        let a = '';
        switch (productCode) {
            case 'PACZKOMAT':a = 'saveInPostPoint';break;
            case 'ORLEN Paczka':a = 'savePaczkaRuchPoint';break;
            case 'ORLEN PACZKA':a = 'savePaczkaRuchPoint';break;
            case 'DHL PARCEL':a = 'saveDhlParcelPoint';break;
            case 'DHL ParcelShop':a = 'saveDhlParcelPoint';break;
            case 'DPD PICKUP':a = 'saveDpdPickupPoint';break;
            case 'DPD':a = 'saveDpdPickupPoint';break;
            case 'POCZTA POLSKA':a = 'savePocztex48owpPoint';break;
        }

        const postData = {
            id_cart: cartId,
            ajax: 1,
            action: a,
            token: token,
            point: selected_point
        };
        $('.pickup-point-selected').empty()
        let point_name = $('select[name="pickup_point"] option:selected').text();
        // $('img.ajax-loader').show();
        $('.pickup-loader .lds-ripple').show();

        $.getJSON(url, postData)
            .done(function (r) {
                // $('img.ajax-loader').hide();
                $('.pickup-loader .lds-ripple').hide();
                if (!r.success) {
                    alert(r.message);
                    return false;
                }
                $('.pickup-point-selected').append('<p>Wybrany punkt: <b>'+selected_point+'</b><br />'+point_name+'</p>');

                highlightSelectedPointOnMap(selected_point);

                // Dodajemy mechanizm odblokowywania checkout
                enableCheckoutStep();
            });
        return true;
    });


    /**
     * Saves selected pickup point before proceeding to next step
     */
    $(document).on('submit', '#js-delivery', function () {
        const selected_point = $('select[name="pickup_point"]').val();
        if ((!selected_point || selected_point == '0') && isAnyCarrierSelected()) {
            const $container = $('#pickup-terminal-container');
            const $select = $container.find('select[name="pickup_point"]');
            const $search = $container.find('input[name="pickup_town"]');

            $('#gk-pickup-error').addClass('is-visible');

            if ($select.closest('.pickup-result').is(':visible')) {
                $select.addClass('gk-field-error');
                setTimeout(function () { $select.removeClass('gk-field-error'); }, 600);
            } else {
                $container.addClass('gk-field-error');
                $search.addClass('gk-field-error');
                setTimeout(function () {
                    $container.removeClass('gk-field-error');
                    $search.removeClass('gk-field-error');
                }, 600);
            }

            $container[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            return false;
        }
        return true;
    });

    function getProductId(carrierType, callback)
    {
        if (carrierType == 'DPD') {
            carrierType = 'DPD PICKUP';
        }
        if (carrierType == 'DHL ParcelShop') {
            carrierType = 'DHL PARCEL';
        }
        if (['PACZKOMAT', 'ORLEN PACZKA', 'POCZTA POLSKA', 'DHL PARCEL', 'DPD PICKUP'].indexOf(carrierType) == -1) {
            return callback("Invalid carrier type");
        }
        const url = baseApiUrl + 'products';
        const dummyParams = {
            length: 10,
            width: 10,
            height: 10,
            weight: 2,
            quantity: 1,
            senderCountryId: 1,
            receiverCountryId: 1,
        };
        $.getJSON(url, dummyParams).done(function (r) {
            for (let i = r.standard.length - 1; i >= 0; i--) {
                let product = r.standard[i],
                    carrierName = product.carrierName.toUpperCase();

                if (carrierType == 'POCZTA POLSKA') {
                    if (carrierName.indexOf(carrierType) != -1) {
                        let productName = product.name.toUpperCase();
                        // Check for both Polish and English product names
                        if (productName.indexOf('DOSTAWA DO PUNKTU') != -1 || productName.indexOf('PUDO') != -1) {
                            return callback(null, product.id);
                        }
                    }
                } else if (carrierType == 'DPD PICKUP') {
                    if (carrierName.indexOf('DPD') != -1) {
                        let productName = product.name.toUpperCase();
                        // Check for both Polish and English product names
                        if (productName.indexOf('DPD PICKUP') != -1 || productName.indexOf('PICKUP') != -1) {
                            return callback(null, product.id);
                        }
                    }
                } else {
                    if (carrierName.indexOf(carrierType) != -1) {
                        return callback(null, product.id);
                    }
                }
            }
            // If no product found, call callback with error
            return callback("Product not found for carrier type: " + carrierType);
        }).fail(function (r) {
            return callback("API error: " + (r.statusText || "Unknown error"));
        });
    }

    /**
     * check carrier selected
     * @returns {boolean|boolean}
     */
    function isAnyCarrierSelected()
    {
        return (isInpostCODCarrierSelected() || isInpostCarrierSelected() || isRuchCarrierSelected() || isPocztex48owpCarrierSelected() || isDhlParcelCarrierSelected() || isDpdPickupCarrierSelected());
    }

    function isInpostCODCarrierSelected()
    {
        const inpostCodId = window.GlobKurier.get('carriers.inpostCod');
        if (inpostCodId === null || inpostCodId === undefined) {
            return false;
        }
        return ($('input[value="' + inpostCodId + ',"]').length > 0 && $('input[value="' + inpostCodId + ',"]').is(':checked')) ? true : false;
    }

    function isInpostCarrierSelected()
    {
        const inpostId = window.GlobKurier.get('carriers.inpost');
        if (inpostId === null || inpostId === undefined) {
            return false;
        }
        return ($('input[value="' + inpostId + ',"]').length > 0 && $('input[value="' + inpostId + ',"]').is(':checked')) ? true : false;
    }

    function isRuchCarrierSelected()
    {
        const paczkaruchId = window.GlobKurier.get('carriers.paczkaruch');
        if (paczkaruchId === null || paczkaruchId === undefined) {
            return false;
        }
        return ($('input[value="' + paczkaruchId + ',"]').length > 0 && $('input[value="' + paczkaruchId + ',"]').is(':checked')) ? true : false;
    }

    function isPocztex48owpCarrierSelected()
    {
        const pocztexId = window.GlobKurier.get('carriers.pocztex48owp');
        if (pocztexId === null || pocztexId === undefined) {
            return false;
        }
        return ($('input[value="' + pocztexId + ',"]').length > 0 && $('input[value="' + pocztexId + ',"]').is(':checked')) ? true : false;
    }

    function isDhlParcelCarrierSelected()
    {
        const dhlparcelId = window.GlobKurier.get('carriers.dhlparcel');
        if (dhlparcelId === null || dhlparcelId === undefined) {
            return false;
        }
        return ($('input[value="' + dhlparcelId + ',"]').length > 0 && $('input[value="' + dhlparcelId + ',"]').is(':checked')) ? true : false;
    }

    function isDpdPickupCarrierSelected()
    {
        const dpdpickupId = window.GlobKurier.get('carriers.dpdpickup');
        if (dpdpickupId === null || dpdpickupId === undefined) {
            return false;
        }
        return ($('input[value="' + dpdpickupId + ',"]').length > 0 && $('input[value="' + dpdpickupId + ',"]').is(':checked')) ? true : false;
    }

    function loadCachedPoints(serviceCode)
    {
        // Use namespace pattern with fallback to data attributes
        const cartId = window.GlobKurier.get('cart.id');
        const token = window.GlobKurier.get('cart.token');
        const endpoint = window.GlobKurier.get('api.endpoint');

        if (!cartId || !token || !endpoint) {
            console.error('GlobKurier Module: Missing required variables (cart_id, gk_token, or rest_endpoint)');
            return;
        }

        const url = endpoint.replaceAll("&amp;", "&");
        const postData = {
            id_cart: cartId,
            ajax: 1,
            action: 'cachedTerminalPoints',
            serviceCode: serviceCode,
            token: token,
        };
        // Don't show loader for cached points - they should load quickly
        // $('.pickup-loader .lds-ripple').show();
        $.getJSON(url, postData).done(function (r) {
            if (!r.success) {
                return;
            }
            cachedPoints = r.data;
            allCachedPoints = r.data; // Zachowaj wszystkie punkty
            fillDropdownWithTerminals();
            $('img.ajax-loader').hide();
            $('.pickup-loader .lds-ripple').hide();

            // Show pickup-result but don't draw map automatically on page load
            $('.pickup-result').show();
            // Map will be drawn only when user searches
            // setTimeout(function() {
            //     drawMap();
            // }, 100);
        }).fail(function (r) {
            $('img.ajax-loader').hide();
            $('.pickup-loader .lds-ripple').hide();
            // Hide map on error
            $('#containerForMapOfTerminals').hide();
        });
    }

    function updateTerminalPoints(r, town)
    {
        // Replace cachedPoints with search results
        cachedPoints = r;
        fillDropdownWithTerminals();

        // Ensure map is drawn after a short delay to allow DOM updates
        setTimeout(function() {
            drawMap();
            if (r.length === 0) {
                $('div.no_results b').text(town);
                $('div.no_results').show();
            } else {
                // For search results, center on the town first, then fitMapToPoints will adjust
                setTimeout(function() {
                    centerMapToTown(town);
                }, 300);
            }
        }, 150);
    }

    function drawMap() {
        const mapContainer = $("#containerForMapOfTerminals");

        // Prevent multiple simultaneous initializations
        if (isMapInitializing) {
            return;
        }

        // Don't show container until we have points to display
        // mapContainer.show(); // Moved to addMarkersToMap()

        // Only initialize Leaflet map once
        if (!leafletMap) {
            isMapInitializing = true;
            // Use setTimeout to ensure DOM is ready and container is visible
            setTimeout(function() {
                try {
                    // Check if Leaflet library is loaded
                    if (typeof L === 'undefined') {
                        mapInitRetries++;
                        if (mapInitRetries >= maxMapInitRetries) {
                            console.error('Leaflet library failed to load after ' + maxMapInitRetries + ' attempts');
                            isMapInitializing = false;
                            mapContainer.html('<div style="padding: 20px; text-align: center; color: red;">Błąd ładowania mapy. Odśwież stronę.</div>');
                            return;
                        }
                        console.warn('Leaflet library not loaded yet, retrying... (attempt ' + mapInitRetries + '/' + maxMapInitRetries + ')');
                        isMapInitializing = false;
                        // Retry after a delay
                        setTimeout(function() {
                            drawMap();
                        }, 500);
                        return;
                    }

                    // Reset retry counter on success
                    mapInitRetries = 0;

                    // Double-check map doesn't exist (race condition protection)
                    if (leafletMap) {
                        isMapInitializing = false;
                        leafletMap.invalidateSize();
                        addMarkersToMap();
                        return;
                    }

                    // Verify container exists and is visible
                    const container = document.getElementById('containerForMapOfTerminals');
                    if (!container) {
                        console.error('Map container not found');
                        isMapInitializing = false;
                        return;
                    }

                    leafletMap = L.map('containerForMapOfTerminals', {
                        center: [51.9194, 19.1451],
                        zoom: 6,
                        scrollWheelZoom: true,
                        zoomControl: true,
                        preferCanvas: false,
                        attributionControl: true
                    });

                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap contributors',
                        maxZoom: 19,
                        minZoom: 3,
                        tileSize: 256,
                        updateWhenIdle: false,
                        keepBuffer: 2
                    }).addTo(leafletMap);

                    isMapInitializing = false;

                    // Force size recalculation after initialization
                    setTimeout(function() {
                        if (leafletMap) {
                            leafletMap.invalidateSize(true);
                        }
                    }, 100);

                    // Add markers after map is initialized
                    addMarkersToMap();
                } catch (e) {
                    console.error('Error initializing Leaflet map:', e);
                    isMapInitializing = false;
                    // Try to clean up if initialization failed
                    if (leafletMap) {
                        try {
                            leafletMap.remove();
                        } catch (cleanupError) {
                            console.error('Error cleaning up failed map:', cleanupError);
                        }
                        leafletMap = null;
                    }
                }
            }, 200);
        } else {
            // Map already exists, just update it
            setTimeout(function() {
                if (leafletMap) {
                    try {
                        leafletMap.invalidateSize();
                        addMarkersToMap();
                    } catch (e) {
                        console.error('Error updating map:', e);
                    }
                }
            }, 50);
        }
    }

    function addMarkersToMap() {
        if (!leafletMap || typeof L === 'undefined') {
            console.warn('Cannot add markers: map or Leaflet not initialized');
            return;
        }

        // Show map container only when we have markers to display
        const mapContainer = $("#containerForMapOfTerminals");
        if (cachedPoints && cachedPoints.length > 0) {
            mapContainer.show();

            // Force map size recalculation after showing
            setTimeout(function() {
                if (leafletMap) {
                    leafletMap.invalidateSize(true);
                }
            }, 50);
        } else {
            mapContainer.hide();
        }

        // Remove old cluster group
        if (markerClusterGroup) {
            leafletMap.removeLayer(markerClusterGroup);
        }

        // Create new cluster group
        markerClusterGroup = L.markerClusterGroup({
            maxClusterRadius: 80,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: true,
            zoomToBoundsOnClick: true
        });

        leafletMarkers = [];

        // Limit markers for performance
        let pointsToShow = cachedPoints;
        // const maxMarkers = 1000;

        // Limit markers for performance if needed
        // if (cachedPoints.length > maxMarkers) {
        //     pointsToShow = cachedPoints.slice(0, maxMarkers);
        // }

        // Add markers to cluster group
        let validPointsCount = 0;
        pointsToShow.forEach(function(item) {
            if (item.latitude && item.longitude &&
                !isNaN(parseFloat(item.latitude)) && !isNaN(parseFloat(item.longitude))) {
                try {
                    const lat = parseFloat(item.latitude);
                    const lng = parseFloat(item.longitude);

                    const marker = L.marker([lat, lng])
                        .bindPopup(`<div class="marker-info">
                            <p><strong>${item.name || ''}</strong></p>
                            <p>${item.address || ''}</p>
                            <p>${item.city || ''} ${item.postCode || ''}</p>
                            <p><a data-terminalId="${item.id}" class="marker-info-link btn btn-primary btn-gk-primary">Wybierz</a></p>
                        </div>`);

                    // Add click handler for marker (highlighting)
                    marker.on('click', function() {
                        // Find corresponding option in select and choose it
                        const selectElement = $('select[name="pickup_point"]');
                        selectElement.val(item.id);
                        selectElement.trigger('change');
                    });

                    // Add marker to cluster group instead of directly to map
                    markerClusterGroup.addLayer(marker);
                    leafletMarkers.push(marker);
                    validPointsCount++;
                } catch (e) {
                    console.error('Error adding marker for point:', item.id, e);
                }
            } else {
                console.warn('Invalid coordinates for point:', item.id, 'lat:', item.latitude, 'lng:', item.longitude);
            }
        });

        // Add entire cluster group to map
        leafletMap.addLayer(markerClusterGroup);

        // Automatically adjust zoom to all points (only if no active search)
        if (validPointsCount > 0) {
            setTimeout(function() {
                // Check if this is initial load (all cached points) or search result
                const isInitialLoad = cachedPoints.length === allCachedPoints.length;
                if (isInitialLoad) {
                    // Add extra delay to ensure map is fully initialized
                    setTimeout(function() {
                        fitMapToPoints();
                    }, 500);
                }
            }, 200);
        }
    }

    function centerMapToTown(town) {
        if (!leafletMap) {
            return;
        }
        // Use Nominatim to geocode the town name
        $.getJSON('https://nominatim.openstreetmap.org/search', {
            q: town,
            format: 'json',
            addressdetails: 1,
            limit: 1
        }, function(data) {
            if (data && data.length > 0) {
                leafletMap.setView([data[0].lat, data[0].lon], 12);
            }
        });
    }

    function fitMapToPoints() {
        if (!leafletMap || !markerClusterGroup) {
            console.warn('Cannot fit map to points: map or markers not initialized');
            return;
        }

        try {
            // Get bounds of all markers
            const group = new L.featureGroup();
            let validMarkers = 0;

            markerClusterGroup.eachLayer(function(marker) {
                const latLng = marker.getLatLng();

                // Check if coordinates are valid (within reasonable bounds for Europe/Poland)
                if (latLng.lat >= 40 && latLng.lat <= 70 && latLng.lng >= -10 && latLng.lng <= 40) {
                    group.addLayer(marker);
                    validMarkers++;
                }
            });

            if (group.getLayers().length > 0) {
                const bounds = group.getBounds();

                // Fit map to bounds with padding
                leafletMap.fitBounds(bounds, {
                    padding: [20, 20], // 20px padding on all sides
                    maxZoom: 15 // Don't zoom in too much for single points
                });
            } else {
                console.warn('No valid markers found for fitting bounds');
                // Fallback to Poland center
                leafletMap.setView([52.0693, 19.4803], 6);
            }
        } catch (e) {
            console.error('Error fitting map to points:', e);
        }
    }

    function fillDropdownWithTerminals()
    {
        const selectElement = $('select[name="pickup_point"]');
        selectElement.find('option').remove();
        if (cachedPoints && cachedPoints.length) {
            $('div.no_inpost_point').hide();
            const options = cachedPoints.map((v, i) => { return `<option value="${v.id}">${v.city} - ${v.address} [${v.id} -  ${v.name}]</option>` });
            options.unshift('<option value="0" selected>Proszę wybrać</option>');
            selectElement.append(options);
            selectElement.show();
            selectElement.val("0");
            selectElement.select2();
        } else {
            selectElement.hide();
            $('div.no_inpost_point').show();
        }
    }
    // Function to highlight selected point on map
    function highlightSelectedPointOnMap(pointId) {
        if (!leafletMap || !markerClusterGroup) {
            console.warn('Map or marker cluster not initialized');
            return;
        }

        // Remove previous highlighting
        if (selectedMarker) {
            selectedMarker.setIcon(L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            }));
            selectedMarker = null;
        }

        // Find and highlight new point
        markerClusterGroup.eachLayer(function(marker) {
            const popup = marker.getPopup();
            if (popup && popup.getContent().includes('data-terminalId="' + pointId + '"')) {
                // Change icon to green for selected point
                marker.setIcon(L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                }));
                selectedMarker = marker;

                // Smooth centering and zoom on selected point
                const targetZoom = Math.max(leafletMap.getZoom(), 18);
                leafletMap.flyTo(marker.getLatLng(), targetZoom, {
                    animate: true,
                    duration: 1.5, // 1.5 seconds animation
                    easeLinearity: 0.25
                });
            }
        });
    }

    // Initialize on page load if carrier is already selected
    $(document).ready(function () {
        // Clear any previous data on page load
        cachedPoints = [];
        allCachedPoints = [];

        // Get i18n strings from namespace
        const mainTextLang = window.GlobKurier.get('i18n.mainText', '');
        const mainTextLang2 = window.GlobKurier.get('i18n.mainText2', '');

        let delivery_select = 0,
            carrierName = '',
            all_text = '';
        // Support both Classic and Hummingbird themes
        $('.delivery-option input[type=radio], .delivery-options__item input[type=radio], .js-delivery-option input[type=radio]').each(function() {
            if ($(this).is(':checked')) {
                delivery_select = parseInt($(this).val());
            }
        });
        // Use namespace for carrier IDs
        const inpostId = window.GlobKurier.get('carriers.inpost');
        const paczkaruchId = window.GlobKurier.get('carriers.paczkaruch');
        const pocztexId = window.GlobKurier.get('carriers.pocztex48owp');
        const dhlparcelId = window.GlobKurier.get('carriers.dhlparcel');
        const dpdpickupId = window.GlobKurier.get('carriers.dpdpickup');

        if (delivery_select > 0) {
            if (inpostId && delivery_select == inpostId) {
                mainContainer.show();
                searchTownInput.data("service-code", "PACZKOMAT");
                carrierName = 'Paczkomatów InPost';
                all_text = mainTextLang+' '+mainTextLang2+' '+carrierName;
            } else if (paczkaruchId && delivery_select == paczkaruchId) {
                mainContainer.show();
                searchTownInput.data("service-code", "ORLEN PACZKA");
                carrierName = 'ORLEN Paczki';
                all_text = mainTextLang+' '+mainTextLang2+' '+carrierName;
            } else if (pocztexId && delivery_select == pocztexId) {
                mainContainer.show();
                searchTownInput.data("service-code", "POCZTA POLSKA");
                carrierName = 'Pocztex48';
                all_text = mainTextLang+' '+mainTextLang2+' '+carrierName;
            } else if (dhlparcelId && delivery_select == dhlparcelId) {
                mainContainer.show();
                searchTownInput.data("service-code", "DHL PARCEL");
                carrierName = 'DHL ParcelShop';
                all_text = mainTextLang+' '+mainTextLang2+' '+carrierName;
            } else if (dpdpickupId && delivery_select == dpdpickupId) {
                mainContainer.show();
                searchTownInput.data("service-code", "DPD PICKUP");
                carrierName = 'DPD Pickup';
                all_text = mainTextLang+' '+mainTextLang2+' '+carrierName;
            }
            $('.pickup-search span').text(all_text);

            // Pre-fill search field with delivery city but don't auto-search
            setTimeout(function() {
                const deliveryCity = window.GlobKurier.get('address.city');
                if (deliveryCity) {
                    searchTownInput.val(deliveryCity);
                }
            }, 50);
        }
    });

});

// Function to enable checkout after selecting pickup point
function enableCheckoutStep() {

    // Hide message about missing selected point
    $('.no_inpost_point_selected').hide();

    // Show delivery step if it was hidden
    $('#checkout-delivery-step .content').show();

    // Enable continue button if it exists
    $('button[name="confirmDeliveryOption"]').prop('disabled', false);
    $('button[name="confirmDeliveryOption"]').removeClass('disabled');

    // Do NOT remove the submit handler — the delegated handler on $(document)
    // re-checks the selected value on every submit, so it remains effective
    // even after the user changes carrier back to a pickup operator.
}
