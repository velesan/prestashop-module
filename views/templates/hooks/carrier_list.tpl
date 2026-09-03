{*
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
 *}
<div id="pickup-terminal-container"
     class=""
     data-gk-cart-id="{$cart_id|escape:'html':'UTF-8'}"
     data-gk-token="{$gk_token|escape:'html':'UTF-8'}"
     data-gk-rest-endpoint="{$rest_endpoint|escape:'html':'UTF-8'}">
    <div>
        <table class="resume table table-bordered">
            <tbody>
                <tr>
                    <td style="width: 30%">
                        {l s='Type a name of your city and select parcel point closest to you' mod='globkuriermodule'}<br/>
                        <div class="input-group">
                            <input type="text" name="pickup_town" class="form-control" />
                            <div class="input-group-btn">
                                <button class="btn btn-default search-button">{l s='Search' mod='globkuriermodule'}</button>
                            </div>
                        </div>
                    </td>
                    <td style="width: 70%">
                        {l s='Found inPost parcel points' mod='globkuriermodule'}<br/>
                        <select class="" name="pickup_point">
                            <option value="0">{l s='Please use the search' mod='globkuriermodule'}</option>
                        </select>
                        <div class="no_pickup_point" style="display: none;">
                            <i class="icon-warning"></i> {l s='Unfortunately, we did not find any parcel machines in given city' mod='globkuriermodule'}
                        </div>
                        <img class="ajax-loader" src="img/loader.gif" style="display: none;" />
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <div class="no_pickup_point_selected" style="display: none;">
        <p><i class="icon-warning"></i> {l s='Please pick parcel point' mod='globkuriermodule'}</p>
    </div>

</div>

<script type="text/javascript">
(function() {
    'use strict';

    // Namespace pattern - create GlobKurier namespace if it doesn't exist
    if (typeof window.GlobKurier === 'undefined') {
        window.GlobKurier = {};
    }

    // Configuration object with all module data
    window.GlobKurier.config = {
        carriers: {
            inpost: {if $globConfig->inPostEnabled}{$globConfig->inPostCarrier|escape:'javascript':'UTF-8'}{else}null{/if},
            inpostCod: {if $globConfig->inPostCODEnabled}{$globConfig->inPostCODCarrier|escape:'javascript':'UTF-8'}{else}null{/if},
            paczkaruch: {if $globConfig->paczkaRuchEnabled}{$globConfig->paczkaRuchCarrier|escape:'javascript':'UTF-8'}{else}null{/if},
            pocztex48owp: {if $globConfig->pocztex48owpEnabled}{$globConfig->pocztex48owpCarrier|escape:'javascript':'UTF-8'}{else}null{/if},
            dhlparcel: null,{* {if $globConfig->dhlparcelEnabled}{$globConfig->dhlparcelCarrier|escape:'javascript':'UTF-8'}{else}null{/if} *}
            dpdpickup: {if $globConfig->dpdpickupEnabled}{$globConfig->dpdpickupCarrier|escape:'javascript':'UTF-8'}{else}null{/if}
        },
        cart: {
            id: {$cart_id|escape:'javascript':'UTF-8'},
            token: '{$gk_token|escape:'javascript':'UTF-8'}'
        },
        api: {
            endpoint: '{$rest_endpoint|escape:'javascript':'UTF-8'}'
        }
    };

    // Backward compatibility - keep old window.* variables for PS 1.6 compatibility
    const inpost_carrier_id = window.GlobKurier.config.carriers.inpost;
    const inpost_cod_carrier_id = window.GlobKurier.config.carriers.inpostCod;
    const paczkaruch_carrier_id = window.GlobKurier.config.carriers.paczkaruch;
    const pocztex48owp_carrier_id = window.GlobKurier.config.carriers.pocztex48owp;
    const dhlparcel_carrier_id = window.GlobKurier.config.carriers.dhlparcel;
    const cart_id = window.GlobKurier.config.cart.id;
    const gk_token = window.GlobKurier.config.cart.token;
    const rest_endpoint = window.GlobKurier.config.api.endpoint;

    // Legacy variables for backward compatibility with inpost-front.js
    window.gk_cart_id = cart_id;
    window.gk_token = gk_token;
    window.gk_rest_endpoint = rest_endpoint;
    window.gk_inpost_carrier_id = inpost_carrier_id;
    window.gk_inpost_cod_carrier_id = inpost_cod_carrier_id;
    window.gk_paczkaruch_carrier_id = paczkaruch_carrier_id;
    window.gk_pocztex48owp_carrier_id = pocztex48owp_carrier_id;
    window.gk_dhlparcel_carrier_id = dhlparcel_carrier_id;
})();

$(function(){
    /**
     * If InPost is the default carrier, show the point picker.
     * This must run here because PrestaShop reloads this entire template
     * every time the carrier selection changes.
     */
    const inpostCODSelected = ($('input[value="' + window.gk_inpost_cod_carrier_id + ',"') && $('input[value="' + window.gk_inpost_cod_carrier_id + ',"').attr('checked')) ? true : false;
    const inpostSelected = ($('input[value="' + window.gk_inpost_carrier_id + ',"') && $('input[value="' + window.gk_inpost_carrier_id + ',"').attr('checked')) ? true : false;
    const ruchSelected = ($('input[value="' + window.gk_paczkaruch_carrier_id + ',"').length && $('input[value="' + window.gk_paczkaruch_carrier_id + ',"').attr('checked')) ? true : false;
    const pocztexSelected = ($('input[value="' + window.gk_pocztex48owp_carrier_id + ',"').length && $('input[value="' + window.gk_pocztex48owp_carrier_id + ',"').attr('checked')) ? true : false;
    const dhlparcelSelected = ($('input[value="' + window.gk_dhlparcel_carrier_id + ',"').length && $('input[value="' + window.gk_dhlparcel_carrier_id + ',"').attr('checked')) ? true : false;

    if (inpostCODSelected || inpostSelected || ruchSelected || pocztexSelected || dhlparcelSelected) {
        $('#pickup-terminal-container').show();
        const serviceCode = (ruchSelected ? "ORLEN PACZKA" : "PACZKOMAT");
        $('input[name="pickup_town"]').data("service-code", serviceCode);
    } else {
        $('#pickup-terminal-container').hide();
    }
});
</script>
