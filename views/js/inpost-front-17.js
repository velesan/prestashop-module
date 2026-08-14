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

// GlobKurier namespace helpers
(function() {
    'use strict';

    if (typeof window.GlobKurier === 'undefined') {
        window.GlobKurier = {};
    }

    // Get nested config value (e.g. 'address.city')
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
    const baseApiUrl = window.gkApiBaseUrl;

    // Shared state — represents the currently active pickup widget
    let cachedPoints = [];
    let allCachedPoints = [];
    let leafletMap = null;
    let leafletMarkers = [];
    let isMapInitializing = false;
    let mapInitRetries = 0;
    const maxMapInitRetries = 10;
    let markerClusterGroup = null;
    let selectedMarker = null;

    // Maps JS service codes to GK API carrierName for the /points endpoint
    const GK_CARRIER_NAME = {
        'PACZKOMAT':      'inPost-Paczkomaty',
        'ORLEN PACZKA':   'ORLEN Paczka',
        'POCZTA POLSKA':  'Poczta Polska',
        'DHL ParcelShop': 'DHL',
        'DHL PARCEL':     'DHL',
        'DPD PICKUP':     'DPD'
    };

    // Maps carrier type (from data-gk-carrier-type) to the REST save action
    const CARRIER_TYPE_TO_ACTION = {
        'inpost':       'saveInPostPoint',
        'ruch':         'savePaczkaRuchPoint',
        'pocztex48owp': 'savePocztex48owpPoint',
        'dhlparcel':    'saveDhlParcelPoint',
        'dpdpickup':    'saveDpdPickupPoint'
    };

    // --- Helpers ---

    // Returns the pickup widget for the currently selected carrier radio.
    // Avoids :visible — PS may wrap extra content in a collapsed div (height:0).
    function getActiveWidget() {
        const $checked = $(
            '.delivery-option input[type=radio]:checked,' +
            '.delivery-options__item input[type=radio]:checked,' +
            '.js-delivery-option input[type=radio]:checked'
        ).first();
        if (!$checked.length) return $();
        // PS carrier radio value format: "{carrierId},"
        const carrierId = parseInt($checked.val(), 10);
        if (!carrierId) return $();
        return $('.gk-pickup-widget[data-gk-carrier-id="' + carrierId + '"]').first();
    }

    // Resets all shared map/points state — call when switching carriers
    function resetPickupState() {
        cachedPoints = [];
        allCachedPoints = [];
        if (leafletMap) {
            try { leafletMap.remove(); } catch (e) {}
            leafletMap = null;
        }
        markerClusterGroup = null;
        selectedMarker = null;
        leafletMarkers = [];
        isMapInitializing = false;
        mapInitRetries = 0;
    }

    // Moves each pickup widget from the displayAfterCarrier area into the matching carrier row
    // so it appears above the submit button. PS 9 Hummingbird uses .delivery-option__extra;
    // PS 1.7 Classic uses .carrier-extra-content or falls back to inserting after the row.
    function moveWidgetsToCarrierRows() {
        $('.gk-pickup-widget').each(function() {
            const $widget = $(this);
            const carrierId = parseInt($widget.attr('data-gk-carrier-id'), 10);
            if (!carrierId) return;

            const $radio = $('input[type="radio"]').filter(function() {
                return parseInt($(this).val(), 10) === carrierId;
            });
            if (!$radio.length) return;

            // PS 9 Hummingbird: .delivery-option__extra / .js-carrier-extra inside item wrapper
            const $ps9Extra = $radio
                .closest('.delivery-options__item')
                .find('.delivery-option__extra, .js-carrier-extra')
                .first();
            if ($ps9Extra.length) {
                $widget.appendTo($ps9Extra);
                return;
            }

            // PS 1.7 Classic: .carrier-extra-content next sibling of the carrier row
            const $row17 = $radio.closest('.js-delivery-option, .delivery-option');
            if (!$row17.length) return;

            const $ps17Extra = $row17.nextAll('.carrier-extra-content, .js-carrier-extra-content').first();
            if ($ps17Extra.length) {
                $widget.appendTo($ps17Extra);
            } else {
                // No designated container — insert after the carrier row (above next carrier / submit)
                $widget.insertAfter($row17);
            }
        });
    }

    // Shows the active pickup widget and hides others
    function syncWidgetVisibility() {
        const $active = getActiveWidget();
        $('.gk-pickup-widget').not($active).hide();
        if ($active.length) {
            $active.show();
        }
    }

    // Fills address from config, restores saved pickup or triggers auto-search
    function triggerAutoSearch() {
        moveWidgetsToCarrierRows();
        syncWidgetVisibility();
        const $widget = getActiveWidget();
        if (!$widget.length) {
            return;
        }

        const city     = window.GlobKurier.get('address.city')     || $widget.attr('data-gk-delivery-city')     || '';
        const postcode = window.GlobKurier.get('address.postcode')  || $widget.attr('data-gk-delivery-postcode') || '';

        if (city) {
            $widget.find('input[name="pickup_town"]').val(postcode ? city + ', ' + postcode : city);
        }

        fetchAndRestoreSavedPickup($widget, function() {
            // No saved pickup — auto-search using delivery address
            setTimeout(function() {
                $widget.find('button.search-button').trigger('click');
            }, 100);
        });
    }

    // --- Pickup point persistence ---

    function deletePickupPoint() {
        const $widget = $('.gk-pickup-widget').first();
        const el = $widget[0];
        const cartId  = window.GlobKurier.get('cart.id')    || (el && el.getAttribute('data-gk-cart-id'));
        const token   = window.GlobKurier.get('cart.token') || (el && el.getAttribute('data-gk-token'));
        const endpoint = (window.GlobKurier.get('api.endpoint') || (el && el.getAttribute('data-gk-rest-endpoint')) || '').replace(/&amp;/g, '&');

        if (!cartId || !token || !endpoint) {
            return;
        }

        $.getJSON(endpoint, {
            id_cart: cartId,
            ajax: 1,
            action: 'deletePickupPoint',
            token: token
        });
    }

    function fetchAndRestoreSavedPickup($widget, onNoPickup) {
        const el = $widget[0];
        if (!el) {
            if (onNoPickup) onNoPickup();
            return;
        }

        const cartId   = window.GlobKurier.get('cart.id')    || el.getAttribute('data-gk-cart-id');
        const token    = window.GlobKurier.get('cart.token') || el.getAttribute('data-gk-token');
        const endpoint = (window.GlobKurier.get('api.endpoint') || el.getAttribute('data-gk-rest-endpoint') || '').replace(/&amp;/g, '&');

        if (!cartId || !token || !endpoint) {
            if (onNoPickup) onNoPickup();
            return;
        }

        $.ajax({
            url: endpoint,
            method: 'POST',
            data: { id_cart: cartId, ajax: 1, action: 'getPickupPoint', token: token },
            dataType: 'json'
        }).done(function(r) {
            if (!r.success || !r.pickup) { if (onNoPickup) onNoPickup(); return; }

            const savedType = r.pickup.type;
            const savedCode = r.pickup.code;
            if (!savedType || !savedCode) { if (onNoPickup) onNoPickup(); return; }

            // Check if the saved pickup type matches this widget's carrier type
            const widgetType = el.getAttribute('data-gk-carrier-type');
            if (savedType !== widgetType) { if (onNoPickup) onNoPickup(); return; }

            const $select = $widget.find('select[name="pickup_point"]');
            $select.empty();
            $select.append('<option value="' + savedCode + '">' + savedCode + '</option>');
            $select.val(savedCode);
            $select.hide();

            const $result = $widget.find('.pickup-result');
            $result.find('> span').hide();
            $result.show();
            $widget.find('.pickup-point-selected').html('<p>Wybrany punkt: <b>' + savedCode + '</b></p>');
            $widget.find('.gk-pickup-error-banner').removeClass('is-visible');
        }).fail(function() {
            if (onNoPickup) onNoPickup();
        });
    }

    // --- Event handlers ---

    // On carrier switch: reset state, delete saved pickup
    // PS (hookDisplayCarrierExtraContent) handles show/hide of each widget
    $(document).on('click', '.delivery-option input[type=radio], .delivery-options__item input[type=radio], .js-delivery-option input[type=radio]', function() {
        resetPickupState();

        // Reset all pickup widgets (clear results, map)
        $('.gk-pickup-widget').each(function() {
            $(this).find('select[name="pickup_point"]').empty().append('<option value="0">Proszę wybrać</option>');
            $(this).find('.pickup-result').hide();
            $(this).find('.gk-map-container').hide();
            $(this).find('.pickup-point-selected').empty();
            $(this).find('.gk-pickup-error-banner').removeClass('is-visible');
        });

        deletePickupPoint();
        return true;
    });

    // Map popup: select a point by clicking its link on the map
    $(document).on('click', '.gk-pickup-widget .gk-map-container .marker-info .marker-info-link', function(e) {
        e.preventDefault();
        const terminalId = $(this).attr('data-terminalId');
        const $select = $(this).closest('.gk-pickup-widget').find('select[name="pickup_point"]');
        $select.find('option').each(function() {
            if (this.value === terminalId) {
                $select.val(terminalId).trigger('change');
                return false;
            }
        });
        if (leafletMap) {
            leafletMap.closePopup();
        }
    });

    // Enter key in search field
    $(document).on('keypress', 'input[name="pickup_town"]', function(e) {
        if (e.which === 13) {
            e.preventDefault();
            $(this).closest('.gk-pickup-widget').find('button.search-button').trigger('click');
        }
    });

    // Clear error on input
    $(document).on('input', 'input[name="pickup_town"]', function() {
        $(this).closest('.gk-pickup-widget').find('.gk-pickup-error-banner').removeClass('is-visible');
    });

    // Search button: fetch pickup points from GK API
    $(document).on('click', 'button.search-button', function(e) {
        e.preventDefault();
        const $widget = $(this).closest('.gk-pickup-widget');
        const $input  = $widget.find('input[name="pickup_town"]');
        const value   = $input.val().trim();

        if (!value) {
            // Show all cached points without re-fetching
            cachedPoints = allCachedPoints;
            fillDropdownWithTerminals($widget);
            $widget.find('.pickup-result').show();
            $widget.find('.pickup-loader .lds-ripple').hide();
            setTimeout(function() { drawMap($widget); }, 100);
            return;
        }

        const serviceCode = $input.data('service-code') || $widget.attr('data-gk-service-code');
        const carrierName = GK_CARRIER_NAME[serviceCode];
        if (!carrierName) {
            console.error('GlobKurier: unknown service code:', serviceCode);
            return;
        }

        const countryIso = (
            window.GlobKurier.get('address.countryIso') ||
            $widget.attr('data-gk-delivery-country-iso') ||
            'PL'
        ).toUpperCase();

        $widget.find('.no_results').hide();
        $widget.find('.pickup-result').hide();
        $widget.find('.pickup-loader .lds-ripple').show();

        const isCod = $widget.attr('data-gk-is-cod') === 'true';

        resolveGkCountryId(countryIso, function(err, countryId) {
            const apiParams = {
                carrierName: carrierName,
                filter: value,
                isCashOnDeliveryAddonSelected: isCod
            };
            if (countryId) {
                apiParams.countryId = countryId;
            }

            $.getJSON(baseApiUrl + 'points', apiParams).done(function(r) {
                $widget.find('.pickup-loader .lds-ripple').hide();
                $widget.find('.pickup-result').show();
                updateTerminalPoints($widget, r, value);
            }).fail(function(xhr, status, error) {
                console.error('GlobKurier: error fetching points:', error);
                $widget.find('.pickup-loader .lds-ripple').hide();
                $widget.find('.pickup-result').show();
                $widget.find('.no_results').show();
                $widget.find('select[name="pickup_point"]').html('<option value="0">Błąd pobierania punktów</option>');
            });
        });
    });

    // Pickup point selected: save to cart
    $(document).on('change', 'select[name="pickup_point"]', function() {
        const $widget = $(this).closest('.gk-pickup-widget');
        const selected = $(this).val();

        if (!selected || selected === '0') {
            // Remove marker highlight on deselect
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
            $widget.find('.gk-pickup-error-banner').removeClass('is-visible');
            $widget.find('select[name="pickup_point"]').removeClass('gk-field-error');
            return true;
        }

        $widget.find('.gk-pickup-error-banner').removeClass('is-visible');
        $widget.find('select[name="pickup_point"]').removeClass('gk-field-error');

        const el       = $widget[0];
        const cartId   = window.GlobKurier.get('cart.id')    || el.getAttribute('data-gk-cart-id');
        const token    = window.GlobKurier.get('cart.token') || el.getAttribute('data-gk-token');
        const endpoint = (window.GlobKurier.get('api.endpoint') || el.getAttribute('data-gk-rest-endpoint') || '').replace(/&amp;/g, '&');

        if (!cartId || !token || !endpoint) {
            console.error('GlobKurier: missing cart/token/endpoint');
            return;
        }

        const action = CARRIER_TYPE_TO_ACTION[el.getAttribute('data-gk-carrier-type')];
        if (!action) {
            console.error('GlobKurier: unknown carrier type:', el.getAttribute('data-gk-carrier-type'));
            return;
        }

        const pointName = $widget.find('select[name="pickup_point"] option:selected').text();
        $widget.find('.pickup-point-selected').empty();
        $widget.find('.pickup-loader .lds-ripple').show();

        $.getJSON(endpoint, {
            id_cart: cartId,
            ajax: 1,
            action: action,
            token: token,
            point: selected
        }).done(function(r) {
            $widget.find('.pickup-loader .lds-ripple').hide();
            if (!r.success) {
                alert(r.message);
                return false;
            }
            $widget.find('.pickup-point-selected').append('<p>Wybrany punkt: <b>' + selected + '</b><br />' + pointName + '</p>');
            highlightSelectedPointOnMap(selected);
            enableCheckoutStep();
        });

        return true;
    });

    // --- Validation ---

    function gkValidateDeliverySubmit(e) {
        const $widget = getActiveWidget();
        if (!$widget.length) {
            return; // no pickup carrier selected — nothing to validate
        }

        const selected = $widget.find('select[name="pickup_point"]').val();
        if (!selected || selected === '0') {
            e.stopImmediatePropagation();
            e.preventDefault();

            const $select = $widget.find('select[name="pickup_point"]');
            const $search = $widget.find('input[name="pickup_town"]');

            $widget.find('.gk-pickup-error-banner').addClass('is-visible');

            if ($select.closest('.pickup-result').is(':visible')) {
                $select.addClass('gk-field-error');
                setTimeout(function() { $select.removeClass('gk-field-error'); }, 600);
            } else {
                $widget.addClass('gk-field-error');
                $search.addClass('gk-field-error');
                setTimeout(function() {
                    $widget.removeClass('gk-field-error');
                    $search.removeClass('gk-field-error');
                }, 600);
            }

            $widget[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    function bindDeliveryValidation() {
        const form = document.getElementById('js-delivery');
        if (!form || form._gkValidationBound) return;
        // Capture phase fires before PS's bubble-phase submit handler
        form.addEventListener('submit', gkValidateDeliverySubmit, true);
        form._gkValidationBound = true;
    }

    // --- PS events ---

    if (window.prestashop && window.prestashop.on) {
        window.prestashop.on('updatedDeliveryForm', function() {
            const form = document.getElementById('js-delivery');
            if (form) form._gkValidationBound = false;
            bindDeliveryValidation();
            resetPickupState();
            // Small delay lets PS finish injecting the carrier extra content
            setTimeout(triggerAutoSearch, 50);
        });
    }

    // --- Countries map / country ID resolution ---

    function resolveGkCountryId(isoCode, callback) {
        const iso = (isoCode || '').toUpperCase();
        if (!iso) { return callback(null, null); }

        const map = window.GlobKurier.get('countriesMap');
        if (map && typeof map === 'object' && !Array.isArray(map) && map[iso]) {
            return callback(null, map[iso]);
        }

        $.getJSON(baseApiUrl + 'countries').done(function(list) {
            const fetched = {};
            if (Array.isArray(list)) {
                list.forEach(function(c) {
                    if (c && c.isoCode) { fetched[c.isoCode.toUpperCase()] = c.id; }
                });
            }
            callback(null, fetched[iso] || null);
        }).fail(function() {
            callback(null, null);
        });
    }

    // --- Terminal list helpers ---

    function updateTerminalPoints($widget, r, town) {
        cachedPoints = r;
        fillDropdownWithTerminals($widget);
        setTimeout(function() {
            drawMap($widget);
            if (r.length === 0) {
                $widget.find('.no_results b').text(town);
                $widget.find('.no_results').show();
            } else {
                setTimeout(function() { centerMapToTown(town); }, 300);
            }
        }, 150);
    }

    function fillDropdownWithTerminals($widget) {
        const $select = $widget.find('select[name="pickup_point"]');
        $select.find('option').remove();
        $widget.find('.pickup-result > span').show();

        if (cachedPoints && cachedPoints.length) {
            $widget.find('.no_inpost_point').hide();
            const options = cachedPoints.map(function(v) {
                return '<option value="' + v.id + '">' + v.city + ' - ' + v.address + ' [' + v.id + ' - ' + v.name + ']</option>';
            });
            options.unshift('<option value="0" selected>Proszę wybrać</option>');
            $select.append(options);
            $select.show();
            $select.val('0');
            $select.select2({ width: '100%' });
        } else {
            $select.hide();
            $widget.find('.no_inpost_point').show();
        }
    }

    // --- Map ---

    function drawMap($widget) {
        const $mapContainer = $widget.find('.gk-map-container');
        const mapEl = $mapContainer[0];
        if (!mapEl || isMapInitializing) return;

        if (!leafletMap) {
            isMapInitializing = true;
            setTimeout(function() {
                try {
                    if (typeof L === 'undefined') {
                        mapInitRetries++;
                        isMapInitializing = false;
                        if (mapInitRetries >= maxMapInitRetries) {
                            console.error('GlobKurier: Leaflet failed to load after ' + maxMapInitRetries + ' attempts');
                            $mapContainer.html('<div style="padding:20px;text-align:center;color:red;">Błąd ładowania mapy. Odśwież stronę.</div>');
                            return;
                        }
                        setTimeout(function() { drawMap($widget); }, 500);
                        return;
                    }

                    mapInitRetries = 0;

                    if (leafletMap) {
                        isMapInitializing = false;
                        leafletMap.invalidateSize();
                        addMarkersToMap($widget);
                        return;
                    }

                    // Guard: Leaflet marks already-initialized containers with _leaflet_id
                    if (mapEl._leaflet_id) {
                        isMapInitializing = false;
                        addMarkersToMap($widget);
                        return;
                    }

                    leafletMap = L.map(mapEl, {
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

                    setTimeout(function() {
                        if (leafletMap) leafletMap.invalidateSize(true);
                    }, 100);

                    addMarkersToMap($widget);
                } catch (e) {
                    console.error('GlobKurier: error initializing map:', e);
                    isMapInitializing = false;
                    if (leafletMap) {
                        try { leafletMap.remove(); } catch (ce) {}
                        leafletMap = null;
                    }
                }
            }, 200);
        } else {
            setTimeout(function() {
                if (leafletMap) {
                    try {
                        leafletMap.invalidateSize();
                        addMarkersToMap($widget);
                    } catch (e) {
                        console.error('GlobKurier: error updating map:', e);
                    }
                }
            }, 50);
        }
    }

    function addMarkersToMap($widget) {
        if (!leafletMap || typeof L === 'undefined') return;

        const $mapContainer = $widget.find('.gk-map-container');
        if (cachedPoints && cachedPoints.length > 0) {
            $mapContainer.show();
            setTimeout(function() {
                if (leafletMap) leafletMap.invalidateSize(true);
            }, 50);
        } else {
            $mapContainer.hide();
        }

        if (markerClusterGroup) {
            leafletMap.removeLayer(markerClusterGroup);
        }

        markerClusterGroup = L.markerClusterGroup({
            maxClusterRadius: 80,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: true,
            zoomToBoundsOnClick: true
        });

        leafletMarkers = [];
        let validCount = 0;

        (cachedPoints || []).forEach(function(item) {
            const lat = parseFloat(item.latitude);
            const lng = parseFloat(item.longitude);
            if (isNaN(lat) || isNaN(lng)) return;

            try {
                const marker = L.marker([lat, lng]).bindPopup(
                    '<div class="marker-info">' +
                    '<p><strong>' + (item.name || '') + '</strong></p>' +
                    '<p>' + (item.address || '') + '</p>' +
                    '<p>' + (item.city || '') + ' ' + (item.postCode || '') + '</p>' +
                    '<p><a data-terminalId="' + item.id + '" class="marker-info-link btn btn-primary btn-gk-primary">Wybierz</a></p>' +
                    '</div>'
                );

                marker.on('click', function() {
                    $widget.find('select[name="pickup_point"]').val(item.id).trigger('change');
                });

                markerClusterGroup.addLayer(marker);
                leafletMarkers.push(marker);
                validCount++;
            } catch (e) {
                console.error('GlobKurier: error adding marker for point:', item.id, e);
            }
        });

        leafletMap.addLayer(markerClusterGroup);

        if (validCount > 0) {
            setTimeout(function() {
                const isInitialLoad = cachedPoints.length === allCachedPoints.length;
                if (isInitialLoad) {
                    setTimeout(fitMapToPoints, 500);
                }
            }, 200);
        }
    }

    function centerMapToTown(town) {
        if (!leafletMap) return;
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
        if (!leafletMap || !markerClusterGroup) return;
        try {
            const group = new L.featureGroup();
            let valid = 0;
            markerClusterGroup.eachLayer(function(marker) {
                const ll = marker.getLatLng();
                if (ll.lat >= 40 && ll.lat <= 70 && ll.lng >= -10 && ll.lng <= 40) {
                    group.addLayer(marker);
                    valid++;
                }
            });
            if (valid > 0) {
                leafletMap.fitBounds(group.getBounds(), { padding: [20, 20], maxZoom: 15 });
            } else {
                leafletMap.setView([52.0693, 19.4803], 6);
            }
        } catch (e) {
            console.error('GlobKurier: error fitting map to points:', e);
        }
    }

    function highlightSelectedPointOnMap(pointId) {
        if (!leafletMap || !markerClusterGroup) return;

        if (selectedMarker) {
            selectedMarker.setIcon(L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
            }));
            selectedMarker = null;
        }

        markerClusterGroup.eachLayer(function(marker) {
            const popup = marker.getPopup();
            if (popup && popup.getContent().includes('data-terminalId="' + pointId + '"')) {
                marker.setIcon(L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
                }));
                selectedMarker = marker;
                const targetZoom = Math.max(leafletMap.getZoom(), 18);
                leafletMap.flyTo(marker.getLatLng(), targetZoom, { animate: true, duration: 1.5, easeLinearity: 0.25 });
            }
        });
    }

    // --- Init ---

    bindDeliveryValidation();
    // Trigger auto-search for the carrier that is already selected on page load
    setTimeout(triggerAutoSearch, 50);
});

// Unlocks the delivery step continue button after a pickup point is saved
function enableCheckoutStep() {
    $('.no_inpost_point_selected').hide();
    $('#checkout-delivery-step .content').show();
    $('button[name="confirmDeliveryOption"]').prop('disabled', false).removeClass('disabled');
}
