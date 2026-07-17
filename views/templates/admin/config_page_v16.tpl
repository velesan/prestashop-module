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
<style type="text/css">
    .glob-product-block {
        text-align: center;
        padding: 10px 10px;
    }

    .glob-product-block:hover {
        background-color: #e1e1e1;
    }

    .modal-body.row {
        display: flex;
        flex-wrap: wrap;
    }
</style>

<form method="post">
<div class="panel" id="gk-config-app">
    <div class="panel-heading">
        <i class="icon-cogs"></i> {l s='Settings' mod='globkuriermodule'}
        <span class="panel-heading-action">
            <a id="desc-order-export" class="list-toolbar-btn" target="_blank" href="{$newParcelPageLink|escape:'url':'UTF-8'}&ajax=1&action=getLogs">
                <span title="" data-toggle="tooltip" class="label-tooltip" data-original-title="{l s='Get logs' mod='globkuriermodule'}" data-html="true" data-placement="top">
                    <i class="process-icon-export"></i>
                </span>
            </a>
        </span>

    </div>
    <div class="panel-body">
        <div class="row">
            {if isset($success)}
            <div class="col-lg-12">
                <div class="alert alert-success">
                    {$success|escape:'htmlall':'UTF-8'}
                </div>
            </div>
            {/if}
            {if isset($error_info)}
            <div class="col-lg-12">
                <div class="alert alert-danger">
                    {$error_info|escape:'htmlall':'UTF-8'}
                </div>
            </div>
            {/if}
            <div class="col-lg-12">
                {if $gk_updateAvailable}
                <div class="alert alert-warning">
                    {l s='Your current version of the module is' mod='globkuriermodule'}: <b>{$moduleVersion|escape:'htmlall':'UTF-8'}</b>.
                    ({l s='current version' mod='globkuriermodule'} <b>{$gk_latestVersion|escape:'htmlall':'UTF-8'}</b>).
                    &nbsp;<a href="{$gk_githubReleaseUrl|escape:'html':'UTF-8'}" target="_blank" rel="noopener noreferrer">{l s='Download from GitHub' mod='globkuriermodule'}</a>
                </div>
                {else}
                <div class="alert alert-info">
                    {l s='Your current version of the module is' mod='globkuriermodule'}: <b>{$moduleVersion|escape:'htmlall':'UTF-8'}</b>
                </div>
                {/if}
            </div>
            <div class="col-lg-5">
                <div class="form-horizontal">
                    <div class="form-group">
                        <label class="col-lg-4 control-label"></label>
                        <label class="col-lg-6 control-label">
                            <p class="text-left">
                                {l s='Default sender address' mod='globkuriermodule'}
                            </p>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="col-lg-4 control-label">{l s='Name' mod='globkuriermodule'}:<sup>*</sup></label>
                        <div class="col-lg-6">
                            <input type="text" name="config_defaultSenderName" value="{$config->defaultSenderName|escape:'htmlall':'UTF-8'}" required="required" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-lg-4 control-label">{l s='First and lastname' mod='globkuriermodule'}:<sup>*</sup></label>
                        <div class="col-lg-6">
                            <input type="text" name="config_defaultSenderPersonName" value="{$config->defaultSenderPersonName|escape:'htmlall':'UTF-8'}" required="required" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-lg-4 control-label">{l s='Street' mod='globkuriermodule'}:<sup>*</sup></label>
                        <div class="col-lg-6">
                            <input type="text" name="config_defaultSenderStreet" value="{$config->defaultSenderStreet|escape:'htmlall':'UTF-8'}" required="required" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-lg-4 control-label">{l s='House number' mod='globkuriermodule'}:<sup>*</sup></label>
                        <div class="col-lg-6">
                            <input type="text" class="form-control" name="config_defaultSenderHouseNumber" value="{$config->defaultSenderHouseNumber|escape:'htmlall':'UTF-8'}" required="required" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-lg-4 control-label">{l s='Local number' mod='globkuriermodule'}:</label>
                        <div class="col-lg-6">
                            <input type="number" class="form-control" name="config_defaultSenderApartmentNumber" value="{$config->defaultSenderApartmentNumber|escape:'htmlall':'UTF-8'}" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-lg-4 control-label">{l s='City' mod='globkuriermodule'}:<sup>*</sup></label>
                        <div class="col-lg-6">
                            <input type="text" name="config_defaultSenderCity" value="{$config->defaultSenderCity|escape:'htmlall':'UTF-8'}" required="required" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-lg-4 control-label">{l s='Post code' mod='globkuriermodule'}:<sup>*</sup></label>
                        <div class="col-lg-6">
                            <input type="text" name="config_defaultSenderPostCode" value="{$config->defaultSenderPostCode|escape:'htmlall':'UTF-8'}" required="required" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-lg-4 control-label">{l s='Country' mod='globkuriermodule'}:<sup>*</sup></label>
                        <div class="col-lg-6">
                            <select class="form-control" name="config_defaultCountryCode" required="required">
                            {foreach from=$countries key=k item=country}
                            <option value="{$country.isoCode|escape:'htmlall':'UTF-8'}" {if $config->defaultCountryCode == $country.isoCode}selected="true"{/if}>{$country.name|escape:'htmlall':'UTF-8'}</option>
                            {/foreach}
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-lg-4 control-label">{l s='Email' mod='globkuriermodule'}:<sup>*</sup></label>
                        <div class="col-lg-6">
                            <input type="email" class="form-control" name="config_defaultSenderEmail" value="{$config->defaultSenderEmail|escape:'htmlall':'UTF-8'}" required="required" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-lg-4 control-label">{l s='Phone no' mod='globkuriermodule'}:<sup>*</sup></label>
                        <div class="col-lg-6">
                            <input type="text" name="config_defaultSenderPhoneNumber" value="{$config->defaultSenderPhoneNumber|escape:'htmlall':'UTF-8'}" required="required" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-lg-5">
                <div class="form-horizontal">
                    <div class="form-group">
                        <label class="col-lg-4 control-label"></label>
                        <label class="col-lg-6 control-label">
                            <p class="text-left">
                                {l s='Default parcel parameters' mod='globkuriermodule'}
                            </p>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="col-lg-4 control-label">{l s='Weight (kg)' mod='globkuriermodule'}:<sup>*</sup></label>
                        <div class="col-lg-6">
                            <input class="form-control" type="number" name="config_defaultWeight" value="{$config->defaultWeight|escape:'htmlall':'UTF-8'}" required="required" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-lg-4 control-label">{l s='Width' mod='globkuriermodule'} [cm]:<sup>*</sup></label>
                        <div class="col-lg-6">
                            <input class="form-control" type="number" name="config_defaultWidth" value="{$config->defaultWidth|escape:'htmlall':'UTF-8'}" required="required" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-lg-4 control-label">{l s='Height' mod='globkuriermodule'} [cm]:<sup>*</sup></label>
                        <div class="col-lg-6">
                            <input class="form-control" type="number" name="config_defaultHeight" value="{$config->defaultHeight|escape:'htmlall':'UTF-8'}" required="required" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-lg-4 control-label">{l s='Depth' mod='globkuriermodule'} [cm]:<sup>*</sup></label>
                        <div class="col-lg-6">
                            <input class="form-control" type="number" name="config_defaultDepth" value="{$config->defaultDepth|escape:'htmlall':'UTF-8'}" required="required" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-lg-4 control-label">{l s='Content' mod='globkuriermodule'}:<sup>*</sup></label>
                        <div class="col-lg-6">
                            <input type="text" name="config_defaultContent" value="{$config->defaultContent|escape:'htmlall':'UTF-8'}" required="required" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-lg-4 control-label">{l s='Carrier' mod='globkuriermodule'}:</label>
                        <div class="col-lg-6" style="text-align: right;">
                            <button type="button" id="openServicesModal" class="btn btn-default">{l s='Choose' mod='globkuriermodule'}</button>
                            <span id="selectedServiceName" style="margin-left:10px; font-weight:bold;">{$config->defaultServiceName|escape:'htmlall':'UTF-8'}</span>
                        </div>
                        <input type="hidden" name="config_defaultServiceCode" value="{$config->defaultServiceCode|escape:'htmlall':'UTF-8'}" />
                        <input type="hidden" name="config_defaultServiceName" value="{$config->defaultServiceName|escape:'htmlall':'UTF-8'}" />
                    </div>

                    <div class="form-group">
                        <label class="col-lg-4 control-label">{l s='Account number for COD purpose' mod='globkuriermodule'}:</label>
                        <div class="col-lg-6">
                            <input type="text" name="config_defaultCodAccount" value="{$config->defaultCodAccount|escape:'htmlall':'UTF-8'}" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-lg-4 control-label">{l s='Account holder name' mod='globkuriermodule'}:</label>
                        <div class="col-lg-6">
                            <input type="text" name="config_defaultCodAccountHolderName" value="{$config->defaultCodAccountHolderName|escape:'htmlall':'UTF-8'}" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-lg-4 control-label">{l s='Account holder address' mod='globkuriermodule'}:</label>
                        <div class="col-lg-6">
                            <input type="text" name="config_defaultCodAccountHolderAddr1" value="{$config->defaultCodAccountHolderAddr1|escape:'htmlall':'UTF-8'}" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-lg-4 control-label">{l s='Account holder post code and city' mod='globkuriermodule'}:</label>
                        <div class="col-lg-6">
                            <input type="text" name="config_defaultCodAccountHolderAddr2" value="{$config->defaultCodAccountHolderAddr2|escape:'htmlall':'UTF-8'}" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-lg-4 control-label">{l s='Payment' mod='globkuriermodule'}:<sup>*</sup></label>
                        <div class="col-lg-6">
                            <select class="form-control" name="config_defaultPaymentType">
                                <option value="">{l s='-- none (manual selection) --' mod='globkuriermodule'}</option>
                                {if isset($gk_payments) && $gk_payments}
                                    {foreach from=$gk_payments item=gkp}
                                    <option value="{$gkp.id|intval}" {if $gk_currentPaymentId == $gkp.id}selected="selected"{/if}>
                                        {$gkp.name|escape:'htmlall':'UTF-8'}{if $gkp.price} (+{$gkp.price|floatval}){/if}
                                    </option>
                                    {/foreach}
                                {else}
                                    <option value="1" {if $gk_currentPaymentId == 1}selected="selected"{/if}>{l s='Bank transfer' mod='globkuriermodule'}</option>
                                    <option value="2" {if $gk_currentPaymentId == 2}selected="selected"{/if}>{l s='Online payment' mod='globkuriermodule'}</option>
                                    <option value="4" {if $gk_currentPaymentId == 4}selected="selected"{/if}>{l s='Collective invoice (delayed)' mod='globkuriermodule'}</option>
                                    <option value="9" {if $gk_currentPaymentId == 9}selected="selected"{/if}>{l s='Pre-paid account' mod='globkuriermodule'}</option>
                                    <option value="6" {if $gk_currentPaymentId == 6}selected="selected"{/if}>{l s='Cash on delivery' mod='globkuriermodule'}</option>
                                {/if}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row form-group text-center" style="margin-top:10px">
            <button type="button" id="updateCacheBtn" data-url="{html_entity_decode($getCachePointsLink|escape:'htmlall':'UTF-8')}" class="btn btn-primary">
            {l s='Cache points for whole country' mod='globkuriermodule'}</button>
          <span id="cacheLoading" style="display:none;"><i class="icon-cog icon-spin"></i></span>
        </div>

        <div class="row" style="margin-top: 50px;">
            <div class="form-group">
                <label class="col-lg-4 control-label" style="margin-bottom: 0;
                padding-top: 7px; text-align: right; width: 34%;">
                {l s='Enable inPost carrier' mod='globkuriermodule'}</label>
                 <div class="col-lg-4">
                     <span class="switch prestashop-switch fixed-width-lg">
                        <input name="config_inPostEnabled" id="ps_layered_filter_price_rounding_on" value="1" {if $config->inPostEnabled == 1}checked="checked"{/if} type="radio">
                        <label for="ps_layered_filter_price_rounding_on" class="radioCheck">
                            <i class="color_success"></i> {l s='Yes' mod='globkuriermodule'}
                        </label>
                        <input name="config_inPostEnabled" id="ps_layered_filter_price_rounding_off" value="0" {if $config->inPostEnabled == 0}checked="checked"{/if} type="radio">
                        <label for="ps_layered_filter_price_rounding_off" class="radioCheck">
                            <i class="color_danger"></i> {l s='No' mod='globkuriermodule'}
                        </label>
                        <a class="slide-button btn"></a>
                     </span>
                 </div>
            </div>
        </div>
        <div class="row" style="margin-top: 20px;">
            <div class="form-group">
                <label class="col-lg-4 control-label" style="margin-bottom: 0;
                padding-top: 7px; text-align: right; width: 34%;">
                {l s='Select inPost carrier' mod='globkuriermodule'}</label>
                <div class="col-lg-4">
                    <select class="form-control" name="config_inPostCarrier" value="{$config->inPostCarrier|escape:'htmlall':'UTF-8'}">
                        <option value="0">-- Brak --</option>
                        {foreach from=$carriers item=carrier}
                        <option value="{$carrier['id_carrier']|escape:'htmlall':'UTF-8'}" {if $config->inPostCarrier == $carrier['id_carrier']}selected="true"{/if}>{$carrier['name']|escape:'htmlall':'UTF-8'}</option>
                        {/foreach}
                    </select>
                </div>
            </div>
        </div>

        {* InPostCOD *}
        <div class="row" style="margin-top: 50px;">
            <div class="form-group">
                <label class="col-lg-4 control-label" style="margin-bottom: 0;
                padding-top: 7px; text-align: right; width: 34%;">
                {l s='Enable inPost COD carrier' mod='globkuriermodule'}</label>
                 <div class="col-lg-4">
                     <span class="switch prestashop-switch fixed-width-lg">
                        <input name="config_inPostCODEnabled" id="inPostCODEnabled_on" value="1" {if $config->inPostCODEnabled == 1}checked="checked"{/if} type="radio">
                        <label for="inPostCODEnabled_on" class="radioCheck">
                            <i class="color_success"></i> {l s='Yes' mod='globkuriermodule'}
                        </label>
                        <input name="config_inPostCODEnabled" id="inPostCODEnabled_off" value="0" {if $config->inPostCODEnabled == 0}checked="checked"{/if} type="radio">
                        <label for="inPostCODEnabled_off" class="radioCheck">
                            <i class="color_danger"></i> {l s='No' mod='globkuriermodule'}
                        </label>
                        <a class="slide-button btn"></a>
                     </span>
                 </div>
            </div>
        </div>
        <div class="row" style="margin-top: 20px;">
            <div class="form-group">
                <label class="col-lg-4 control-label" style="margin-bottom: 0;
                padding-top: 7px; text-align: right; width: 34%;">
                {l s='Select inPost COD carrier' mod='globkuriermodule'}</label>
                <div class="col-lg-4">
                    <select class="form-control" name="config_inPostCODCarrier" value="{$config->inPostCODCarrier|escape:'htmlall':'UTF-8'}">
                        <option value="0">-- Brak --</option>
                        {foreach from=$carriers item=carrier}
                        <option value="{$carrier['id_carrier']|escape:'htmlall':'UTF-8'}" {if $config->inPostCODCarrier == $carrier['id_carrier']}selected="true"{/if}>{$carrier['name']|escape:'htmlall':'UTF-8'}</option>
                        {/foreach}
                    </select>
                </div>
            </div>
        </div>

        <div class="row" style="margin-top: 20px;">
            <div class="form-group">
                <label class="col-lg-4 control-label" style="margin-bottom: 0;
                padding-top: 7px; text-align: right; width: 34%;">
                {l s='Provide default inPost sender point code' mod='globkuriermodule'}</label>
                <div class="col-lg-4">
                    <input type="text" name="config_defaultInPostPoint" value="{$config->defaultInPostPoint|escape:'htmlall':'UTF-8'}" />
                    {*<select class="form-control" name="config_defaultInPostPoint">
                        {foreach from=$terminals key=k item=terminal}
                        <option value="{$terminal.departmentId|escape:'htmlall':'UTF-8'}" {if $config->defaultInPostPoint == $terminal.departmentId}selected="true"{/if}>[{$terminal.departmentId|escape:'htmlall':'UTF-8'}] {$terminal.address|escape:'htmlall':'UTF-8'}, {$terminal.town|escape:'htmlall':'UTF-8'}</option>
                        {/foreach}
                    </select>*}
                </div>
            </div>
        </div>
        <div class="row hidden" style="margin-top: 60px;">
            <div class="form-group">
                <label class="col-lg-4 control-label" style="margin-bottom: 0;
                padding-top: 7px; text-align: right; width: 34%;">
                    {l s='Enable GlobBox point-of-sale pickup service' mod='globkuriermodule'}
                </label>
                 <div class="col-lg-4">
                     <span class="switch prestashop-switch fixed-width-lg">
                        <input name="config_globboxEnabled" id="1" value="1"
                        {if $config->globboxEnabled == 1}checked="checked"{/if} type="radio">
                        <label for="1" class="radioCheck">
                            <i class="color_success"></i> Tak
                        </label>
                        <input name="config_globboxEnabled" id="2" value="0" {if $config->globboxEnabled == 0}checked="checked"{/if} type="radio">
                        <label for="2" class="radioCheck">
                            <i class="color_danger"></i> Nie
                        </label>
                        <a class="slide-button btn"></a>
                     </span>
                 </div>
            </div>
        </div>

        {* Paczka w Ruchu *}
        <div class="row" style="margin-top: 50px;">
            <div class="form-group">
                <label class="col-lg-4 control-label" style="margin-bottom: 0;
                padding-top: 7px; text-align: right; width: 34%;">
                {l s='Enable PaczkaRUCH carrier' mod='globkuriermodule'}</label>
                 <div class="col-lg-4">
                     <span class="switch prestashop-switch fixed-width-lg">
                        <input name="config_paczkaRuchEnabled" id="config_paczkaRuchEnabled_on" value="1" {if $config->paczkaRuchEnabled == 1}checked="checked"{/if} type="radio">
                        <label for="config_paczkaRuchEnabled_on" class="radioCheck">
                            <i class="color_success"></i> {l s='Yes' mod='globkuriermodule'}
                        </label>
                        <input name="config_paczkaRuchEnabled" id="config_paczkaRuchEnabled_off" value="0" {if $config->paczkaRuchEnabled == 0}checked="checked"{/if} type="radio">
                        <label for="config_paczkaRuchEnabled_off" class="radioCheck">
                            <i class="color_danger"></i> {l s='No' mod='globkuriermodule'}
                        </label>
                        <a class="slide-button btn"></a>
                     </span>
                 </div>
            </div>
        </div>
        <div class="row" style="margin-top: 20px;">
            <div class="form-group">
                <label class="col-lg-4 control-label" style="margin-bottom: 0;
                padding-top: 7px; text-align: right; width: 34%;">
                {l s='Select PaczkaRUCH carrier' mod='globkuriermodule'}</label>
                <div class="col-lg-4">
                    <select class="form-control" name="config_paczkaRuchCarrier" value="{$config->paczkaRuchCarrier|escape:'htmlall':'UTF-8'}">
                        <option value="0">-- Brak --</option>
                        {foreach from=$carriers item=carrier}
                        <option value="{$carrier['id_carrier']|escape:'htmlall':'UTF-8'}" {if $config->paczkaRuchCarrier == $carrier['id_carrier']}selected="true"{/if}>{$carrier['name']|escape:'htmlall':'UTF-8'}</option>
                        {/foreach}
                    </select>
                </div>
            </div>
        </div>
        {* End of paczka w Ruchu *}

        {* Pocztex Kurier48 odbiór w punkcie *}
        <div class="row" style="margin-top: 50px;">
            <div class="form-group">
                <label class="col-lg-4 control-label" style="margin-bottom: 0;
                padding-top: 7px; text-align: right; width: 34%;">
                    {l s='Enable Pocztex Kurier48 Odbiór w Punkcie carrier' mod='globkuriermodule'}</label>
                <div class="col-lg-4">
                     <span class="switch prestashop-switch fixed-width-lg">
                        <input name="config_pocztex48owpEnabled" id="config_pocztex48owpEnabled_on" value="1" {if $config->pocztex48owpEnabled == 1}checked="checked"{/if} type="radio">
                        <label for="config_pocztex48owpEnabled_on" class="radioCheck">
                            <i class="color_success"></i> {l s='Yes' mod='globkuriermodule'}
                        </label>
                        <input name="config_pocztex48owpEnabled" id="config_pocztex48owpEnabled_off" value="0" {if $config->pocztex48owpEnabled == 0}checked="checked"{/if} type="radio">
                        <label for="config_pocztex48owpEnabled_off" class="radioCheck">
                            <i class="color_danger"></i> {l s='No' mod='globkuriermodule'}
                        </label>
                        <a class="slide-button btn"></a>
                     </span>
                </div>
            </div>
        </div>
        <div class="row" style="margin-top: 20px;">
            <div class="form-group">
                <label class="col-lg-4 control-label" style="margin-bottom: 0;
                padding-top: 7px; text-align: right; width: 34%;">
                    {l s='Select Pocztex Kurier48 Odbiór w Punkcie carrier' mod='globkuriermodule'}</label>
                <div class="col-lg-4">
                    <select class="form-control" name="config_pocztex48owpCarrier" value="{$config->pocztex48owpCarrier|escape:'htmlall':'UTF-8'}">
                        <option value="0">-- Brak --</option>
                        {foreach from=$carriers item=carrier}
                            <option value="{$carrier['id_carrier']|escape:'htmlall':'UTF-8'}" {if $config->pocztex48owpCarrier == $carrier['id_carrier']}selected="true"{/if}>{$carrier['name']|escape:'htmlall':'UTF-8'}</option>
                        {/foreach}
                    </select>
                </div>
            </div>
        </div>
        {* End of Pocztex Kurier48 odbiór w punkcie *}
        {* Paczka DHL Parcel *}
{*        <div class="row" style="margin-top: 50px;">*}
{*            <div class="form-group">*}
{*                <label class="col-lg-4 control-label" style="margin-bottom: 0;*}
{*                padding-top: 7px; text-align: right; width: 34%;">*}
{*                    {l s='Enable DHL Parcel carrier' mod='globkuriermodule'}*}
{*                </label>*}
{*                <div class="col-lg-4">*}
{*                     <span class="switch prestashop-switch fixed-width-lg">*}
{*                        <input name="config_dhlparcelEnabled" id="config_dhlparcelEnabled_on" value="1" {if $config->dhlparcelEnabled == 1}checked="checked"{/if} type="radio">*}
{*                        <label for="config_dhlparcelEnabled_on" class="radioCheck">*}
{*                            <i class="color_success"></i> {l s='Yes' mod='globkuriermodule'}*}
{*                        </label>*}
{*                        <input name="config_dhlparcelEnabled" id="config_dhlparcelEnabled_off" value="0" {if $config->dhlparcelEnabled == 0}checked="checked"{/if} type="radio">*}
{*                        <label for="config_dhlparcelEnabled_off" class="radioCheck">*}
{*                            <i class="color_danger"></i> {l s='No' mod='globkuriermodule'}*}
{*                        </label>*}
{*                        <a class="slide-button btn"></a>*}
{*                     </span>*}
{*                </div>*}
{*            </div>*}
{*        </div>*}
{*        <div class="row" style="margin-top: 20px;">*}
{*            <div class="form-group">*}
{*                <label class="col-lg-4 control-label" style="margin-bottom: 0;*}
{*                padding-top: 7px; text-align: right; width: 34%;">*}
{*                    {l s='Select DHL Parcel carrier' mod='globkuriermodule'}*}
{*                </label>*}
{*                <div class="col-lg-4">*}
{*                    <select class="form-control" name="config_dhlparcelCarrier" value="{$config->dhlparcelCarrier|escape:'htmlall':'UTF-8'}">*}
{*                        <option value="0">-- Brak --</option>*}
{*                        {foreach from=$carriers item=carrier}*}
{*                            <option value="{$carrier['id_carrier']|escape:'htmlall':'UTF-8'}" {if $config->dhlparcelCarrier == $carrier['id_carrier']}selected="true"{/if}>{$carrier['name']|escape:'htmlall':'UTF-8'}</option>*}
{*                        {/foreach}*}
{*                    </select>*}
{*                </div>*}
{*            </div>*}
{*        </div>*}
        {* End of Paczka DHL Parcel *}

        {* Paczka DPD Pickup *}
        <div class="row" style="margin-top: 50px;">
            <div class="form-group">
                <label class="col-lg-4 control-label" style="margin-bottom: 0;
                padding-top: 7px; text-align: right; width: 34%;">
                    {l s='Enable DPD Pickup carrier' mod='globkuriermodule'}
                </label>
                <div class="col-lg-4">
                     <span class="switch prestashop-switch fixed-width-lg">
                        <input name="config_dpdpickupEnabled" id="config_dpdpickupEnabled_on" value="1" {if $config->dpdpickupEnabled == 1}checked="checked"{/if} type="radio">
                        <label for="config_dpdpickupEnabled_on" class="radioCheck">
                            <i class="color_success"></i> {l s='Yes' mod='globkuriermodule'}
                        </label>
                        <input name="config_dpdpickupEnabled" id="config_dpdpickupEnabled_off" value="0" {if $config->dpdpickupEnabled == 0}checked="checked"{/if} type="radio">
                        <label for="config_dpdpickupEnabled_off" class="radioCheck">
                            <i class="color_danger"></i> {l s='No' mod='globkuriermodule'}
                        </label>
                        <a class="slide-button btn"></a>
                     </span>
                </div>
            </div>
        </div>
        <div class="row" style="margin-top: 20px;">
            <div class="form-group">
                <label class="col-lg-4 control-label" style="margin-bottom: 0;
                padding-top: 7px; text-align: right; width: 34%;">
                    {l s='Select DPD Pickup carrier' mod='globkuriermodule'}
                </label>
                <div class="col-lg-4">
                    <select class="form-control" name="config_dpdpickupCarrier" value="{$config->dpdpickupCarrier|escape:'htmlall':'UTF-8'}">
                        <option value="0">-- Brak --</option>
                        {foreach from=$carriers item=carrier}
                            <option value="{$carrier['id_carrier']|escape:'htmlall':'UTF-8'}" {if $config->dpdpickupCarrier == $carrier['id_carrier']}selected="true"{/if}>{$carrier['name']|escape:'htmlall':'UTF-8'}</option>
                        {/foreach}
                    </select>
                </div>
            </div>
        </div>
        {* End of DPD Pickupl *}
    </div>
    <div class="panel-footer">
        <input type="hidden" name="action" value="updateConfig"/>
        <button type="submit" class="btn btn-default pull-left">
            <i class="process-icon-save"></i> {l s='Save' mod='globkuriermodule'}
        </button>
    </div>
</div>
</form>

<div id="globkurier-returns-banner">
    <button type="button" class="globkurier-returns-banner__close" aria-label="Zamknij">×</button>
    <div class="globkurier-returns-banner__icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 14l-4-4 4-4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M5 10h11a4 4 0 0 1 0 8h-1" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
    </div>
    <h3 class="globkurier-returns-banner__title">
        Szybkie i tanie zwroty na jedno kliknięcie				<br>
        w Twoim sklepie			</h3>
    <ul class="globkurier-returns-banner__list">
        <li>Darmowe uruchomienie i korzystanie z narzędzia</li>
        <li>Szybki i prosty proces aktywacji</li>
        <li>Lepsza kontrola nad procesami i raportowaniem</li>
    </ul>
    <a href="https://zwroty.globkurier.pl/pl/zwroty-dla-sklepow-internetowych" target="_blank" rel="noopener noreferrer" class="globkurier-returns-banner__btn">
        DOWIEDZ SIĘ WIĘCEJ			</a>
</div>
{literal}
<div class="modal fade" id="servicesModal" tabindex="-1" role="dialog">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h4 class="modal-title">{l s='Select carrier' mod='globkuriermodule'}</h4>
      </div>
      <div class="modal-body row" id="servicesList" style="display: flex;flex-wrap: wrap;">
        <!-- Filled dynamically by JS -->
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-default" data-dismiss="modal">{l s='Cancel' mod='globkuriermodule'}</button>
      </div>
    </div>
  </div>
</div>
{/literal}

<script>
    document.querySelector('.globkurier-returns-banner__close')?.addEventListener('click', function() {
        document.getElementById('globkurier-returns-banner').style.display = 'none';
    });
</script>

<script type="text/javascript">
    let tokenAPI = '{$tokenAPI|escape:'javascript':'UTF-8'}';
    let lang_change = '{l s='Change' mod='globkuriermodule'}';
    let lang_choose = '{l s='Choose' mod='globkuriermodule'}';
    let lang_delete = '{l s='Delete' mod='globkuriermodule'}';
    let lang_choose_delivery = '{l s='Choose delivery' mod='globkuriermodule'}';
    let lang_choosen = '{l s='Confirm' mod='globkuriermodule'}';
    let lang_cancel = '{l s='Cancel' mod='globkuriermodule'}';
    let lang_error1 = '{l s='No services matching your criteria were found' mod='globkuriermodule'}';
</script>
