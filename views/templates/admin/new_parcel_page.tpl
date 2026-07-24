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
{if empty($config->defaultCountryCode) || !isset($config->defaultCountryCode)}
<div class="alert alert-danger">
    <p>{l s='Complete all data in the module configuration.' mod='globkuriermodule'}</p>
</div>
{else}

<link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
<style type="text/css">
    [ng\:cloak], [ng-cloak], .ng-cloak {
        display: none !important;
    }
    .gk-field-error {
        border-color: #e74c3c !important;
        box-shadow: 0 0 4px rgba(231, 76, 60, 0.4) !important;
    }
</style>

<div class="panel" id="gk-parcel-app">
    <div class="panel-heading">
        <i class="icon-cogs"></i> {l s='Ship parcel with Globkurier' mod='globkuriermodule'}
        {if $orderId}{l s='Based on order' mod='globkuriermodule'} #{$orderId|escape:'htmlall':'UTF-8'}{/if}
    </div>

    <div class="bootstrap" id="orderErrorBox" style="display:none;">
        <div class="alert alert-danger">
            <h4>{l s='We\'ve try to send you request but there was an error' mod='globkuriermodule'}</h4>
            <ul id="orderErrorList"></ul>
            <button type="button" class="close" id="orderErrorClose">×</button>
        </div>
    </div>

    <div class="bootstrap" id="validationErrorBox" style="display:none;">
        <div class="alert alert-danger">
            <h4>{l s='There is some validation errors. Please fix them before you can continue' mod='globkuriermodule'}</h4>
            <span id="valErrSenderPhone" style="display:none;">{l s='Please provide sender phone number' mod='globkuriermodule'}</span>
            <span id="valErrReceiverPhone" style="display:none;">{l s='Please provide receiver phone number' mod='globkuriermodule'}</span>
            <span id="valErrNoPickupMethod" style="display:none;">{l s='Please select a courier pickup method' mod='globkuriermodule'}</span>
            <button type="button" class="close" id="validationErrorClose">×</button>
        </div>
    </div>

    <div class="panel-body" id="processingBox" style="display:none;">
        <div class="page-loader" style="text-align: center; font-size: 25px!important; color: #ccc;">
            <i class="icon-cog icon-spin"></i>
        </div>
    </div>
    <div class="panel-body order-placed" id="orderPlacedBox" style="display:none;">
        <div class="col-lg-12" style="text-align: center;">
            <h2><i class="icon-check" style="font-size: 50px!important; color:#96c21f;"></i></h2>
            <h2>Zamówienie zostało złożone pomyślnie</h2>
            <p>{l s='Parcel No' mod='globkuriermodule'}: <span id="orderPlacedNumber"></span></p>
            <p id="orderPlacedTrackingRow" style="display:none;">
                <span id="orderPlacedTrackingLabel" style="display:none;">{l s='Tracking No' mod='globkuriermodule'}: <strong><span id="orderPlacedTracking"></span></strong></span>
                <span id="orderPlacedTrackingSpinner" style="display:none;"><i class="icon-cog icon-spin"></i> Oczekiwanie na kod śledzenia...</span>
                <span id="orderPlacedTrackingTimeout" style="display:none; color:#c0392b;">Nie udało się pobrać kodu śledzenia. Sprawdź panel GlobKurier.</span>
            </p>
            <button class="btn btn-warning" onclick="location.reload();">{l s='Ship next' mod='globkuriermodule'}</button>
            <button class="btn btn-primary" id="downloadLabelBtn" style="display:none; margin-left:8px;">Pobierz etykietę</button>
        </div>
    </div>
    <div class="panel-body" id="mainFormBox">
        <div class="col-lg-4">
            <div class="row">
                <div class="col-lg-6" id="senderBox">
                    <div class="panel">
                        <div class="panel-heading">{l s='Sender' mod='globkuriermodule'} <button class="btn btn-primary btn-gk-primary btn-xs pull-right" href="#" id="senderChangeLink">{l s='change' mod='globkuriermodule'}</button></div>
                        <div class="panel-body">
                            <div id="senderDisplay">
                                <div><strong id="sender_display_name"></strong></div>
                                <div><span id="sender_display_street"></span> / <span id="sender_display_houseNumber"></span></div>
                                <div><span id="sender_display_postalCode"></span> <span id="sender_display_city"></span></div>
                                <div>(<span id="sender_display_countryIso"></span>)</div>
                                <br/>
                                <div><a href="#">{l s='Contact person' mod='globkuriermodule'}</a></div>
                                <div id="sender_display_contact"></div>
                                <div id="sender_display_phone"></div>
                                <div id="sender_display_email"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6 receiverAddressBox" id="receiverBox">
                    <div class="panel">
                        <div class="panel-heading">{l s='Receiver' mod='globkuriermodule'} <button class="btn btn-primary btn-gk-primary btn-xs pull-right" href="#" id="receiverChangeLink">{l s='change' mod='globkuriermodule'}</button></div>
                        <div class="panel-body">
                            <div id="receiverDisplay">
                                <div><strong id="receiver_display_name"></strong></div>
                                <div><span id="receiver_display_street"></span> / <span id="receiver_display_houseNumber"></span></div>
                                <div><span id="receiver_display_postalCode"></span> <span id="receiver_display_city"></span></div>
                                <div>(<span id="receiver_display_countryIso"></span>)</div>
                                <br/>
                                <div><a href="#">{l s='Contact person' mod='globkuriermodule'}</a></div>
                                <div id="receiver_display_contact"></div>
                                <div id="receiver_display_phone"></div>
                                <div id="receiver_display_email"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row" id="terminalInfo" style="margin-top: 10px;" data-service="{$service|escape:'htmlall':'UTF-8'}">
                <div class="col-lg-12">
                    <div class="panel" style="border: 3px dashed #79a600;">
                        <div class="panel-body">
                            {l s='Your customer has chosen to have the parcel delivered by a courier' mod='globkuriermodule'} <strong>{if $presta_carrier_name}{$presta_carrier_name|escape:'htmlall':'UTF-8'}{/if}</strong>
                            {if isset($terminalCode) && $terminalCode}{l s='with pickup point' mod='globkuriermodule'}[<strong id="terminalCode"></strong>]{/if}

                            <br/><br/>
                            {l s='If the client selected a carrier mapped in the module configuration, only services matched to the selected carrier will be considered in the quote.' mod='globkuriermodule'}
                            {l s='If you want to get all services anyway, please click button below' mod='globkuriermodule'}

                            <div class="form-group">
                                <label class="col-lg-4 control-label" style="margin-bottom: 0;
                                    padding-top: 7px; text-align: right; width: 34%;">
                                    {l s='Show all carriers' mod='globkuriermodule'}</label>
                                <div class="col-lg-4">
                                    <span class="switch prestashop-switch prestashop-switch-gk fixed-width-lg">
                                        <input name="service_filters" id="service_filters_on" value="1" type="radio">
                                        <label for="service_filters_on" class="radioCheck" id="disableServiceFilters">
                                            <i class="color_success"></i> {l s='Yes' mod='globkuriermodule'}
                                        </label>
                                        <input name="service_filters" id="service_filters_off" value="0" checked="checked" type="radio">
                                        <label for="service_filters_off" class="radioCheck" id="enableServiceFilters">
                                            <i class="color_danger"></i> {l s='No' mod='globkuriermodule'}
                                        </label>
                                        <a class="slide-button btn"></a>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-4">
            <div class="col-lg-12" id="servicesContainer" data-initial-product-symbol="{$config->defaultServiceCode|escape:'htmlall':'UTF-8'}">
                <div class="panel">
                    <div class="panel-heading">
                        {l s='Choose delivery' mod='globkuriermodule'}
                        <button type="button" class="btn btn-primary btn-gk-primary btn-xs pull-right" id="openServicesModal" style="display: none;">{l s='Change' mod='globkuriermodule'}</button></div>
                    <div class="panel-body">
                        <div class="row">
                            <div class="col-lg-2"><img id="chosenServiceLogo" src="" alt="" style="max-width:100%; display:none;"></div>
                            <div class="col-lg-8"><strong id="chosenServiceCarrier"></strong><br/><span id="chosenServiceName"></span></div>
                        </div>
                        <div class="row">
                            <div class="col-lg-12"><div id="chosenServiceSummary" style="margin-top: 10px;"></div></div>
                        </div>
                        <hr/>
                        <div class="row">
                            <div class="col-lg-4">
                                <div class="form-group"><label>{l s='Height (cm)' mod='globkuriermodule'}</label><input id="pkg-height" type="number" step="1" class="form-control"></div>
                            </div>
                            <div class="col-lg-4">
                                <div class="form-group"><label>{l s='Length (cm)' mod='globkuriermodule'}</label><input id="pkg-length" type="number" step="1" class="form-control"></div>
                            </div>
                            <div class="col-lg-4">
                                <div class="form-group"><label>{l s='Width (cm)' mod='globkuriermodule'}</label><input id="pkg-width" type="number" step="1" class="form-control"></div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-lg-6">
                                <div class="form-group"><label>{l s='Quantity' mod='globkuriermodule'}</label><input id="pkg-count" type="number" step="1" class="form-control" value="1"></div>
                            </div>
                            <div class="col-lg-6">
                                <div class="form-group"><label>{l s='Weight (kg)' mod='globkuriermodule'}</label><input id="pkg-weight" type="number" step="0.01" class="form-control"></div>
                            </div>
                        </div>
                        {if isset($order_products_weight) && ($order_products_weight > 0 || (isset($catalog_products_weight) && $catalog_products_weight > 0))}
                        <div class="row">
                            <div class="col-lg-12">
                                {if $order_products_weight > 0}
                                <p class="text-muted" style="font-size:12px; margin-bottom:6px;">{l s='Total product weight from order' mod='globkuriermodule'}: <strong>{$order_products_weight|floatval} kg</strong></p>
                                {else}
                                <p class="text-muted" style="font-size:12px; margin-bottom:6px;">{l s='Total product weight from order' mod='globkuriermodule'}: <strong>0 kg</strong> &nbsp;·&nbsp; {l s='Sum of product weights from catalog' mod='globkuriermodule'}: <strong>{$catalog_products_weight|floatval} kg</strong></p>
                                {/if}
                            </div>
                        </div>
                        {/if}
                        <div id="carrierLimitsWarning" class="alert alert-warning" style="display:none; margin-bottom: 10px;">
                            {l s='Some values exceed the maximum limits of the carrier.' mod='globkuriermodule'}
                        </div>
                        <button type="button" id="getServicesBtn" class="btn btn-primary btn-gk-primary">{l s='Get services' mod='globkuriermodule'}</button>
                    </div>
                </div>
            </div>
            <div class="col-lg-12 row" id="addonsListContainer" style="display:none;">
                <div class="panel">
                    <div class="panel-heading">{l s='Additional options' mod='globkuriermodule'}</div>
                    <div class="panel-body" id="addonsListBody">
                        <div id="serviceLabels" class="well" style="display:none; margin-bottom:10px;"></div>
                        <div id="addonsList" class="row" style="margin-bottom:10px;"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-lg-4">
            <div class="col-lg-12" id="servicesListContainer" style="display:none;">
                <div class="panel">
                    <div class="panel-heading">{l s='Shipping' mod='globkuriermodule'}</div>
                    <div class="panel-body form-horizontal" id="serviceOptionsBody" style="margin-left:20px;">
                        <div class="form-group deliverySending">
                            <label class="radio"><input type="radio" name="pickup_type" id="pickup" value="PICKUP" checked> {l s='The parcel will be picked up by a courier' mod='globkuriermodule'}</label>
                            <label class="radio"><input type="radio" name="pickup_type" id="point" value="POINT"> {l s='I will send the shipment at the terminal' mod='globkuriermodule'}</label>
                        </div>
                        <div id="pickupMethodAddons" style="display:none; margin-top:4px;"></div>
                    </div>
                </div>
            </div>
            <div class="col-lg-12" id="serviceOptionsContainer" style="display:none;">
                <div class="panel">
                    <div class="panel-heading">{l s='Service options' mod='globkuriermodule'}</div>
                    <div class="panel-body additionalInfo" id="serviceOptionsBody">
                        <div class="form-group row receiverAddressPointId receiverAddressPointIdinpost" style="display:none;">
                            <label class="col-sm-4 col-form-label">{l s='InPost' mod='globkuriermodule'}<br/>{l s='pickup point' mod='globkuriermodule'}</label>
                            <div class="col-sm-8"><div class="well" style="padding:6px;">
                                <span id="inpostReceiverLabel"></span>
                                <button class="btn btn-primary btn-gk-primary btn-xs open-terminal-picker" data-target="inPostReceiverPoint">{l s='Choose/Change' mod='globkuriermodule'}</button>
                            </div></div>
                        </div>
                        <div class="row" id="pickupMeta" style="margin-bottom:10px;">
                            <div class="col-lg-6"><label>{l s='Date sending' mod='globkuriermodule'}</label><input type="text" id="sendDateInput" class="form-control" placeholder="YYYY-MM-DD"></div>
                            <div class="col-lg-6"><label>{l s='Pickup time' mod='globkuriermodule'}</label><select id="pickupTimeSelect" class="form-control"><option value="">-- {l s='select' mod='globkuriermodule'} --</option></select></div>
                        </div>
                        <div class="form-group row senderAddressPointId senderAddressPointIdUnified" style="display:none;">
                            <label class="col-sm-4 col-form-label">{l s='Sending point' mod='globkuriermodule'}</label>
                            <div class="col-sm-8"><div class="well" style="padding:6px;">
                                <span id="senderPointLabel"></span>
                                <button class="btn btn-primary btn-gk-primary btn-xs open-terminal-picker" data-role="sender">{l s='Choose/Change' mod='globkuriermodule'}</button>
                            </div></div>
                        </div>
                        <div class="form-group row receiverAddressPointId receiverAddressPointIdorlen" style="display:none;">
                            <label class="col-sm-4 col-form-label">{l s='ORLEN Paczka' mod='globkuriermodule'}<br/>{l s='pickup point' mod='globkuriermodule'}</label>
                            <div class="col-sm-8"><div class="well" style="padding:6px;">
                                <span id="orlenReceiverLabel"></span>
                                <button class="btn btn-primary btn-gk-primary btn-xs open-terminal-picker" data-target="paczkaRuchReceiverPoint">{l s='Choose/Change' mod='globkuriermodule'}</button>
                            </div></div>
                        </div>
                        <div class="form-group row receiverAddressPointId receiverAddressPointIdpocztex48" style="display:none;">
                            <label class="col-sm-4 col-form-label">{l s='Pocztex48 OWP' mod='globkuriermodule'}<br/>{l s='pickup point' mod='globkuriermodule'}</label>
                            <div class="col-sm-8"><div class="well" style="padding:6px;">
                                <span id="pocztexReceiverLabel"></span>
                                <button class="btn btn-primary btn-gk-primary btn-xs open-terminal-picker" data-target="pocztex48owpReceiverPoint">{l s='Choose/Change' mod='globkuriermodule'}</button>
                            </div></div>
                        </div>
                        <div class="form-group row receiverAddressPointId receiverAddressPointIddhl" style="display:none;">
                            <label class="col-sm-4 col-form-label">{l s='DHL ParcelShop' mod='globkuriermodule'}<br/>{l s='pickup point' mod='globkuriermodule'}</label>
                            <div class="col-sm-8"><div class="well" style="padding:6px;">
                                <span id="dhlReceiverLabel"></span>
                                <button class="btn btn-primary btn-gk-primary btn-xs open-terminal-picker" data-target="dhlparcelReceiverPoint">{l s='Choose/Change' mod='globkuriermodule'}</button>
                            </div></div>
                        </div>
                        <div class="form-group row receiverAddressPointId receiverAddressPointIdfedex" style="display:none;">
                            <label class="col-sm-4 col-form-label">{l s='FedEx' mod='globkuriermodule'}<br/>{l s='pickup point' mod='globkuriermodule'}</label>
                            <div class="col-sm-8"><div class="well" style="padding:6px;">
                                <span id="fedexReceiverLabel"></span>
                                <button class="btn btn-primary btn-gk-primary btn-xs open-terminal-picker" data-target="fedexReceiverPoint">{l s='Choose/Change' mod='globkuriermodule'}</button>
                            </div></div>
                        </div>
                        <div class="form-group row receiverAddressPointId receiverAddressPointIddpd" style="display:none;">
                            <label class="col-sm-4 col-form-label">{l s='DPD Pickup' mod='globkuriermodule'}<br/>{l s='pickup point' mod='globkuriermodule'}</label>
                            <div class="col-sm-8"><div class="well" style="padding:6px;">
                                <span id="dpdReceiverLabel"></span>
                                <button class="btn btn-primary btn-gk-primary btn-xs open-terminal-picker" data-target="dpdpickupReceiverPoint">{l s='Choose/Change' mod='globkuriermodule'}</button>
                            </div></div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">{l s='Content' mod='globkuriermodule'}</label>
                            <div class="col-sm-8">
                                <select id="pkg-content-select" class="form-control">
                                    <option value="">-- {l s='select' mod='globkuriermodule'} --</option>
                                </select>
                                <input id="pkg-content" type="text" class="form-control" style="margin-top:4px; display:none;" placeholder="{l s='Enter content' mod='globkuriermodule'}">
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">{l s='Payment' mod='globkuriermodule'}</label>
                            <div class="col-sm-8"><select id="paymentSelect" class="form-control"></select></div>
                        </div>

                        <div class="form-group row" id="codAmountGroup" style="display:none;">
                            <label class="col-sm-4 col-form-label">{l s='COD amount' mod='globkuriermodule'}</label>
                            <div class="col-sm-8"><input type="text" id="codAmountInput" class="form-control" /></div>
                        </div>
                        <div class="form-group row" id="codAccountGroup" style="display:none;">
                            <label class="col-sm-4 col-form-label">{l s='Account number to COD' mod='globkuriermodule'}</label>
                            <div class="col-sm-8"><input type="text" id="codAccountInput" class="form-control" /></div>
                        </div>
                        <div class="form-group row" id="codAccountHolderGroup" style="display:none;">
                            <label class="col-sm-4 col-form-label">{l s='Name of account owner' mod='globkuriermodule'}</label>
                            <div class="col-sm-8"><input type="text" id="codAccountHolderInput" class="form-control" /></div>
                        </div>
                        <div class="form-group row" id="codAccountAddr1Group" style="display:none;">
                            <label class="col-sm-4 col-form-label">{l s='Street of the account owner' mod='globkuriermodule'}</label>
                            <div class="col-sm-8"><input type="text" id="codAccountAddr1Input" class="form-control" placeholder="ulica i nr" /></div>
                        </div>
                        <div class="form-group row" id="codAccountAddr2Group" style="display:none;">
                            <label class="col-sm-4 col-form-label">{l s='Postcode and city account owner' mod='globkuriermodule'}</label>
                            <div class="col-sm-8"><input type="text" id="codAccountAddr2Input" class="form-control" placeholder="00-000 Miasto" /></div>
                        </div>
                        <div class="form-group row" id="insuranceAmountGroup" style="display:none;">
                            <label class="col-sm-4 col-form-label">{l s='Insurance amount' mod='globkuriermodule'}</label>
                            <div class="col-sm-8"><input type="text" id="insuranceAmountInput" class="form-control" /></div>
                        </div>
                        <div class="form-group row" id="declaredValueGroup" style="display:none;">
                            <label class="col-sm-4 col-form-label">{l s='Declared value' mod='globkuriermodule'}</label>
                            <div class="col-sm-8"><input type="text" id="declaredValueInput" class="form-control" /></div>
                        </div>
                        <div class="form-group row" id="purposeGroup" style="display:none;">
                            <label class="col-sm-4 col-form-label">{l s='Purpose of the shipment' mod='globkuriermodule'}</label>
                            <div class="col-sm-8">
                                <select id="purposeSelect" class="form-control">
                                    <option value="SOLD">SOLD</option>
                                    <option value="GIFT">GIFT</option>
                                    <option value="SAMPLE">SAMPLE</option>
                                    <option value="NOT_SOLD">NOT_SOLD</option>
                                    <option value="PERSONAL_EFFECTS">PERSONAL_EFFECTS</option>
                                    <option value="REPAIR_AND_RETURN">REPAIR_AND_RETURN</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group row" id="statesGroup" style="display:none;">
                            <label class="col-sm-4 col-form-label">{l s='States/Regions' mod='globkuriermodule'}</label>
                            <div class="col-sm-8"><select id="statesSelect" class="form-control"></select></div>
                        </div>
                        <div class="form-group row" id="senderStatesGroup" style="display:none;">
                            <label class="col-sm-4 col-form-label">{l s='Sender states/regions' mod='globkuriermodule'}</label>
                            <div class="col-sm-8"><select id="senderStatesSelect" class="form-control"></select></div>
                        </div>
                        <div class="form-group row" id="commentsGroup">
                            <label class="col-sm-4 col-form-label">{l s='Comments' mod='globkuriermodule'}</label>
                            <div class="col-sm-8"><textarea id="commentsInput" class="form-control" rows="2"></textarea></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>



        <!-- Section discount code and summary -->
        <div class="col-lg-12" id="summaryContainer" style="display:none; margin-top: 20px;">
           <div class="panel">
                <div class="panel-heading">Podsumowanie zamówienia</div>
                <div class="panel-body">
                    <div id="discountAndSummary">
                        <div class="row">
                            <div class="col-sm-6">
                                <div class="form-group">
                                    <label class="control-label">{l s='Selected service' mod='globkuriermodule'}</label>
                                    <div id="summaryServiceName" class="form-control-static lead"></div>
                                </div>
                                <div id="summaryServiceLabels" class="well" style="display:none; margin-top:10px;"></div>
                            </div>
                            <div class="col-sm-6">
                                <div class="form-group">
                                    <label class="control-label">{l s='Discount code' mod='globkuriermodule'}</label>
                                    <div class="row">
                                        <div class="col-sm-7"><input type="text" id="discountCodeInput" class="form-control" /></div>
                                        <div class="col-sm-5">
                                            <button class="btn btn-primary btn-gk-primary" id="applyDiscountBtn" type="button" style="margin-right:8px;">{l s='Apply' mod='globkuriermodule'}</button>
                                            <button class="btn btn-default" id="clearDiscountBtn" type="button">{l s='Clear' mod='globkuriermodule'}</button>
                                        </div>
                                    </div>
                                </div>
                                <div id="priceErrorBox" class="alert alert-warning" style="display:none;"></div>
                                <div id="orderSummaryBox" class="well" style="margin-top:10px;">
                                    <div id="summaryRowBaseNet"><strong>{l s='Base price net' mod='globkuriermodule'}</strong>: <span id="summaryBaseNet">-</span></div>
                                    <div id="summaryRowAddons"><strong>{l s='Additional services selected' mod='globkuriermodule'}</strong>: <span id="summaryAddonsNet">-</span></div>
                                    <div id="summaryRowDiscount"><strong>{l s='Discount net' mod='globkuriermodule'}</strong>: <span id="summaryDiscount">-</span></div>
                                    <div id="summaryRowNetWithFuel"><strong>{l s='Total net + fuel' mod='globkuriermodule'}</strong>: <span id="summaryNetWithFuel">-</span></div>
                                    <div id="summaryRowGross"><strong>{l s='Total gross' mod='globkuriermodule'}</strong>: <span id="summaryGross">-</span></div>
                                    <div id="summaryRowFuel" class="text-muted" style="font-size:12px;">{l s='incl. fuel surcharge' mod='globkuriermodule'}: <span id="summaryFuel">-</span></div>
                                    <div id="summaryRowVat" class="text-muted" style="font-size:12px;">{l s='incl. VAT' mod='globkuriermodule'} <span id="summaryVatLabel"></span>: <span id="summaryVat">-</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class=" col-lg-12 panel-footer" style="text-align: center;">
            <button
                type="button"
                id="sendOrderBtn"
                disabled
                class="btn btn-success btn-gk-success"
                style="padding: 12px 40px;"
            >
                <i class="icon-send" id="sendIcon"></i>
                <i class="icon-cog icon-spin" id="processingIcon" style="display:none;"></i>
                {l s='Send' mod='globkuriermodule'}
            </button>
        </div>
    </div>


    <div class="modal fade" id="servicesPickModal" tabindex="-1" role="dialog">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h4 class="modal-title">{l s='Select carrier' mod='globkuriermodule'}</h4>
          </div>
          <div class="modal-body">
            <div id="servicesModalEmpty" class="alert alert-info" style="display:none;">
              {l s='No services found' mod='globkuriermodule'}
            </div>
            <div class="row" id="servicesModalList" style="display:flex;flex-wrap:wrap;"></div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-default" data-dismiss="modal">{l s='Cancel' mod='globkuriermodule'}</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="terminalPickerModal" tabindex="-1" role="dialog">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h4 class="modal-title">{l s='Find a point' mod='globkuriermodule'}</h4>
          </div>
          <div class="modal-body form-horizontal">
            <div class="form-group">
              <label class="col-lg-4 control-label">{l s='City, postcode' mod='globkuriermodule'}</label>
              <div class="col-lg-6"><input type="text" id="terminalQuery" class="form-control" placeholder="e.g. Berlin, 12587"></div>
              <div class="col-lg-2"><button class="btn btn-primary btn-gk-primary" id="terminalSearchBtn">{l s='Search' mod='globkuriermodule'}</button></div>
            </div>
            <div class="form-group">
              <label class="col-lg-4 control-label">{l s='Point' mod='globkuriermodule'}</label>
              <div class="col-lg-6">
                <select id="terminalSelect" class="form-control"></select>
                <span id="terminalHint" style="display:none;">{l s='Use the search above to find a point' mod='globkuriermodule'}</span>
                <div id="terminalErrorBox" class="alert alert-warning" style="display:none; margin-top:10px;"></div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-default" data-dismiss="modal">{l s='Cancel' mod='globkuriermodule'}</button>
            <button type="button" class="btn btn-primary btn-gk-primary" id="terminalSaveBtn" data-dismiss="modal">{l s='Save' mod='globkuriermodule'}</button>
          </div>
        </div>
      </div>
    </div>
    <!-- Edit Sender Modal -->
    <div class="modal fade" id="senderEditModal" tabindex="-1" role="dialog">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h4 class="modal-title">{l s='Edit sender' mod='globkuriermodule'}</h4>
          </div>
          <div class="modal-body form-horizontal">
            <div class="form-group"><label class="col-lg-4 control-label">{l s='Name' mod='globkuriermodule'}</label><div class="col-lg-6"><input type="text" id="sender_edit_name" class="form-control"></div></div>
            <div class="form-group"><label class="col-lg-4 control-label">{l s='Street' mod='globkuriermodule'}</label><div class="col-lg-6"><input type="text" id="sender_edit_street" class="form-control"></div></div>
            <div class="form-group"><label class="col-lg-4 control-label">{l s='House number' mod='globkuriermodule'}</label><div class="col-lg-6"><input type="text" id="sender_edit_houseNumber" class="form-control"></div></div>
            <div class="form-group"><label class="col-lg-4 control-label">{l s='Postcode' mod='globkuriermodule'}</label><div class="col-lg-6"><input type="text" id="sender_edit_postalCode" class="form-control"></div></div>
            <div class="form-group"><label class="col-lg-4 control-label">{l s='City' mod='globkuriermodule'}</label><div class="col-lg-6"><input type="text" id="sender_edit_city" class="form-control"></div></div>
            <div class="form-group"><label class="col-lg-4 control-label">{l s='Contact person' mod='globkuriermodule'}</label><div class="col-lg-6"><input type="text" id="sender_edit_contact" class="form-control"></div></div>
            <div class="form-group"><label class="col-lg-4 control-label">{l s='Phone' mod='globkuriermodule'}</label><div class="col-lg-6"><input type="text" id="sender_edit_phone" class="form-control"></div></div>
            <div class="form-group"><label class="col-lg-4 control-label">{l s='E-mail' mod='globkuriermodule'}</label><div class="col-lg-6"><input type="email" id="sender_edit_email" class="form-control"></div></div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-default" data-dismiss="modal">{l s='Cancel' mod='globkuriermodule'}</button>
            <button type="button" class="btn btn-primary btn-gk-primary" id="saveSenderEdit" data-dismiss="modal">{l s='Save' mod='globkuriermodule'}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Receiver Modal -->
    <div class="modal fade" id="receiverEditModal" tabindex="-1" role="dialog">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h4 class="modal-title">{l s='Edit receiver' mod='globkuriermodule'}</h4>
          </div>
          <div class="modal-body form-horizontal">
            <div class="form-group"><label class="col-lg-4 control-label">{l s='Name' mod='globkuriermodule'}</label><div class="col-lg-6"><input type="text" id="receiver_edit_name" class="form-control"></div></div>
            <div class="form-group"><label class="col-lg-4 control-label">{l s='Street' mod='globkuriermodule'}</label><div class="col-lg-6"><input type="text" id="receiver_edit_street" class="form-control"></div></div>
            <div class="form-group"><label class="col-lg-4 control-label">{l s='House number' mod='globkuriermodule'}</label><div class="col-lg-6"><input type="text" id="receiver_edit_houseNumber" class="form-control"></div></div>
            <div class="form-group"><label class="col-lg-4 control-label">{l s='Postcode' mod='globkuriermodule'}</label><div class="col-lg-6"><input type="text" id="receiver_edit_postalCode" class="form-control"></div></div>
            <div class="form-group"><label class="col-lg-4 control-label">{l s='City' mod='globkuriermodule'}</label><div class="col-lg-6"><input type="text" id="receiver_edit_city" class="form-control"></div></div>
            <div class="form-group"><label class="col-lg-4 control-label">{l s='Contact person' mod='globkuriermodule'}</label><div class="col-lg-6"><input type="text" id="receiver_edit_contact" class="form-control"></div></div>
            <div class="form-group"><label class="col-lg-4 control-label">{l s='Phone' mod='globkuriermodule'}</label><div class="col-lg-6"><input type="text" id="receiver_edit_phone" class="form-control"></div></div>
            <div class="form-group"><label class="col-lg-4 control-label">{l s='E-mail' mod='globkuriermodule'}</label><div class="col-lg-6"><input type="email" id="receiver_edit_email" class="form-control"></div></div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-default" data-dismiss="modal">{l s='Cancel' mod='globkuriermodule'}</button>
            <button type="button" class="btn btn-primary btn-gk-primary" id="saveReceiverEdit" data-dismiss="modal">{l s='Save' mod='globkuriermodule'}</button>
          </div>
        </div>
        </div>
    </div>

    <script type="text/javascript">
        // Note: These will be mapped to Globkurier country IDs in JavaScript via ISO codes
        let package = [];
        let urlRedirect = '{$urlRedirect|escape:'javascript':'UTF-8'}';

        window.InitialValues = {
            sender : {
                name: '{$config->defaultSenderName|escape:'javascript':'UTF-8'}',
                personName: '{$config->defaultSenderPersonName|escape:'javascript':'UTF-8'}',
                street: '{$config->defaultSenderStreet|escape:'javascript':'UTF-8'}',
                houseNumber: '{$config->defaultSenderHouseNumber|escape:'javascript':'UTF-8'}',
                apartmentNumber: '{$config->defaultSenderApartmentNumber|escape:'javascript':'UTF-8'}',
                postCode: '{$config->defaultSenderPostCode|escape:'javascript':'UTF-8'}',
                city: '{$config->defaultSenderCity|escape:'javascript':'UTF-8'}',
                countryCode: '{$sender_country_iso|escape:'javascript':'UTF-8'}',
                countryId: null, // Will be set by JavaScript from ISO code
                phone: '{$config->defaultSenderPhoneNumber|escape:'javascript':'UTF-8'}',
                email: '{$config->defaultSenderEmail|escape:'javascript':'UTF-8'}',
            },
            {if isset($adress) && !empty($adress)}
            receiver : {
                personName: '{$adress->firstname|escape:'javascript':'UTF-8'} {$adress->lastname|escape:'javascript':'UTF-8'}',
                {if $splitedAddress != null}
                street: '{$splitedAddress.street|escape:'javascript':'UTF-8'}',
                houseNumber: '{$splitedAddress.houseNumber|escape:'javascript':'UTF-8'}',
                apartmentNumber: '{$splitedAddress.apartmentNumber|escape:'javascript':'UTF-8'}',
                {else}
                street: '{$adress->address1|escape:'javascript':'UTF-8'}',
                houseNumber: null,
                apartmentNumber: null,
                {/if}
                postCode: '{$adress->postcode|escape:'javascript':'UTF-8'}',
                city: '{$adress->city|escape:'javascript':'UTF-8'}',
                countryCode: '{$receiver_country_iso|escape:'javascript':'UTF-8'}',
                countryId: null, // Will be set by JavaScript from ISO code
                phone: '{if $adress->phone}{$adress->phone|escape:'javascript':'UTF-8'}{else}{$adress->phone_mobile|escape:'javascript':'UTF-8'}{/if}',
                email: '{if isset($customer->email)}{$customer->email|escape:'javascript':'UTF-8'}{else}null{/if}',
                stateId: {$adress->id_state|escape:'javascript':'UTF-8'},
            },
            {else}
            receiver : {},
            {/if}
            prestaCarrier : {
                id: {if $presta_carrier_id}{$presta_carrier_id|escape:'javascript':'UTF-8'}{else}null{/if},
                name: '{if $presta_carrier_name}{$presta_carrier_name|escape:'javascript':'UTF-8'}{/if}',
                limits: {
                    maxWeight: {$carrier_limits.max_weight|floatval},
                    maxWidth:  {$carrier_limits.max_width|floatval},
                    maxHeight: {$carrier_limits.max_height|floatval},
                    maxDepth:  {$carrier_limits.max_depth|floatval}
                }
            },
            defaultPackageInfo : {
                content: '{$config->defaultContent|escape:'javascript':'UTF-8'  }',
                length : {if $config->defaultDepth}{$config->defaultDepth|escape:'javascript':'UTF-8'}{else}null{/if},
                width  : {if $config->defaultWidth}{$config->defaultWidth|escape:'javascript':'UTF-8'}{else}null{/if},
                height : {if $config->defaultHeight}{$config->defaultHeight|escape:'javascript':'UTF-8'}{else}null{/if},
                weight : {if $effective_products_weight > 0}{$effective_products_weight|floatval}{elseif $config->defaultWeight}{$config->defaultWeight|escape:'javascript':'UTF-8'}{else}null{/if},
                count  : 1,
            },
            defaultPaymentType : '{$config->defaultPaymentType|escape:'javascript':'UTF-8'}',
            defaultCodAccount : '{$config->defaultCodAccount|escape:'javascript':'UTF-8'}',
            defaultCodAccountHolderName : '{$config->defaultCodAccountHolderName|escape:'javascript':'UTF-8'}',
            defaultCodAccountHolderAddr1 : '{$config->defaultCodAccountHolderAddr1|escape:'javascript':'UTF-8'}',
            defaultCodAccountHolderAddr2 : '{$config->defaultCodAccountHolderAddr2|escape:'javascript':'UTF-8'}',
            defaultServiceCode : '{$config->defaultServiceCode|escape:'javascript':'UTF-8'}',
            moduleName : 'globkuriermodule',
            partialsPath : '../modules/globkuriermodule/views/templates/partials/',
            moduleApiUrl : '{$moduleApiUrl|escape:'javascript':'UTF-8'}',
            login : '{$config->login|escape:'javascript':'UTF-8'}',
            password : '{$config->password|escape:'javascript':'UTF-8'}',
            apiKey : '{$config->apiKey|escape:'javascript':'UTF-8'}',
            token : '{$token|escape:'javascript':'UTF-8'}',
            clientId : '{$globClientId|escape:'javascript':'UTF-8'}',
            todayDate : '{date("Y-m-d")|escape:'javascript':'UTF-8'}',
            terminalCode : {if isset($terminalCode)}'{$terminalCode|escape:'javascript':'UTF-8'}'{else}null{/if},
            terminalType : {if isset($terminalType)}'{$terminalType|escape:'javascript':'UTF-8'}'{else}null{/if},
            terminalType2 : {if isset($terminalType)}'{$terminalType|escape:'javascript':'UTF-8'}'{else}'none'{/if},
            defaultInPostPoint : {if $config->defaultInPostPoint}'{$config->defaultInPostPoint|escape:'javascript':'UTF-8'}'{else}null{/if},
            prestaOrderId : '{$orderId|escape:'javascript':'UTF-8'}',
            collectionTypes: '',
            isoCode: '{$iso_code|escape:'javascript':'UTF-8'}',
            lang1: '{l s='Parameter' mod='globkuriermodule'}',
            lang2: '{l s='is required!' mod='globkuriermodule'}',
            lang3: '{l s='Contact person' mod='globkuriermodule'}',
            lang4: '{l s='Change address' mod='globkuriermodule'}',
            lang5: '{l s='Name' mod='globkuriermodule'}',
            lang6: '{l s='Street' mod='globkuriermodule'}',
            lang7: '{l s='House number' mod='globkuriermodule'}',
            lang8: '{l s='Apartment number' mod='globkuriermodule'}',
            lang9: '{l s='Postcode' mod='globkuriermodule'}',
            lang10: '{l s='City' mod='globkuriermodule'}',
            lang11: '{l s='Country' mod='globkuriermodule'}',
            lang12: '{l s='change' mod='globkuriermodule'}',
            lang13: '{l s='Phone' mod='globkuriermodule'}',
            lang14: '{l s='E-mail' mod='globkuriermodule'}',
            lang15: '{l s='Cancel' mod='globkuriermodule'}',
            lang16: '{l s='Save' mod='globkuriermodule'}',
            lang17: '{l s='Complete the recipients address before quoting' mod='globkuriermodule'}',
            langContentCustom: '{l s='Custom value' mod='globkuriermodule'}',
        };

        $(document).ready(function() {
            $(document).on('click', '.searchTerminals', function() {
                setTimeout(function() {
                    $('.select2').select2();
                }, 2500)
                $('.select2').select2();
            });
            $('.select2').select2();
        });
    </script>
    {/if}
