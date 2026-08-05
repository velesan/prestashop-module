{*
 * 2007-2026 PrestaShop.
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License 3.0 (AFL-3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/AFL-3.0
 *
 * @author    PrestaShop SA <contact@prestashop.com>
 * @copyright 2007-2026 PrestaShop SA
 * @license   https://opensource.org/licenses/AFL-3.0 Academic Free License 3.0 (AFL-3.0)
 *}

<form method="post" id="gk-config-form">
<div class="panel" id="gk-config-app">
    <div class="panel-heading">
        <i class="icon-cogs"></i> {l s='Settings' mod='globkuriermodule'}
        <span class="panel-heading-action">
            <a class="list-toolbar-btn" target="_blank" href="{$newParcelPageLink|escape:'url':'UTF-8'}&ajax=1&action=getLogs">
                <span title="{l s='Get logs' mod='globkuriermodule'}" data-toggle="tooltip" class="label-tooltip" data-placement="top">
                    <i class="process-icon-export"></i>
                </span>
            </a>
        </span>
    </div>
    <div class="panel-body">
        {if isset($success)}
        <div class="alert alert-success">{$success|escape:'htmlall':'UTF-8'}</div>
        {/if}
        {if isset($error_info)}
        <div class="alert alert-danger">{$error_info|escape:'htmlall':'UTF-8'}</div>
        {/if}
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

        {* ── TAB NAVIGATION ── *}
        <ul class="gk-tabs-nav" role="tablist">
            <li class="gk-tab-item gk-tab-active" data-tab="tab-nadawca">
                <span class="gk-tab-btn">{l s='Sender' mod='globkuriermodule'}</span>
            </li>
            <li class="gk-tab-item" data-tab="tab-wysylka">
                <span class="gk-tab-btn">{l s='Shipment settings' mod='globkuriermodule'}</span>
            </li>
            <li class="gk-tab-item" data-tab="tab-operatorzy">
                <span class="gk-tab-btn">{l s='Operators' mod='globkuriermodule'}</span>
            </li>
            <li class="gk-tab-item" data-tab="tab-szablony">
                <span class="gk-tab-btn">
                    {l s='Templates' mod='globkuriermodule'}
                    {if $gk_template_count > 0}<span class="badge">{$gk_template_count|intval}</span>{/if}
                    <span class="gk-badge-new">{l s='New' mod='globkuriermodule'}</span>
                </span>
            </li>
        </ul>

        {* ══════════════════════════════════════
           TAB 1: NADAWCA
        ══════════════════════════════════════ *}
        <div class="gk-tab-pane gk-active" id="tab-nadawca">
            <div class="row">
                <div class="col-lg-6">
                    <div class="form-horizontal">
                        <h4 class="text-muted" style="margin:0 0 18px; font-size:13px; text-transform:uppercase; letter-spacing:.05em;">{l s='Default sender address' mod='globkuriermodule'}</h4>
                        <div class="form-group">
                            <label class="col-lg-4 control-label">{l s='Name' mod='globkuriermodule'}:<sup>*</sup></label>
                            <div class="col-lg-7"><input type="text" class="form-control" name="config_defaultSenderName" value="{$config->defaultSenderName|escape:'htmlall':'UTF-8'}" required="required" /></div>
                        </div>
                        <div class="form-group">
                            <label class="col-lg-4 control-label">{l s='First and lastname' mod='globkuriermodule'}:<sup>*</sup></label>
                            <div class="col-lg-7"><input type="text" class="form-control" name="config_defaultSenderPersonName" value="{$config->defaultSenderPersonName|escape:'htmlall':'UTF-8'}" required="required" /></div>
                        </div>
                        <div class="form-group">
                            <label class="col-lg-4 control-label">{l s='Street' mod='globkuriermodule'}:<sup>*</sup></label>
                            <div class="col-lg-7"><input type="text" class="form-control" name="config_defaultSenderStreet" value="{$config->defaultSenderStreet|escape:'htmlall':'UTF-8'}" required="required" /></div>
                        </div>
                        <div class="form-group">
                            <label class="col-lg-4 control-label">{l s='House number' mod='globkuriermodule'}:<sup>*</sup></label>
                            <div class="col-lg-3"><input type="text" class="form-control" name="config_defaultSenderHouseNumber" value="{$config->defaultSenderHouseNumber|escape:'htmlall':'UTF-8'}" required="required" /></div>
                            <label class="col-lg-2 control-label" style="text-align:left">{l s='Local number' mod='globkuriermodule'}:</label>
                            <div class="col-lg-2"><input type="number" class="form-control" name="config_defaultSenderApartmentNumber" value="{$config->defaultSenderApartmentNumber|escape:'htmlall':'UTF-8'}" /></div>
                        </div>
                        <div class="form-group">
                            <label class="col-lg-4 control-label">{l s='Post code' mod='globkuriermodule'}:<sup>*</sup></label>
                            <div class="col-lg-3"><input type="text" class="form-control" name="config_defaultSenderPostCode" value="{$config->defaultSenderPostCode|escape:'htmlall':'UTF-8'}" required="required" /></div>
                        </div>
                        <div class="form-group">
                            <label class="col-lg-4 control-label">{l s='City' mod='globkuriermodule'}:<sup>*</sup></label>
                            <div class="col-lg-7"><input type="text" class="form-control" name="config_defaultSenderCity" value="{$config->defaultSenderCity|escape:'htmlall':'UTF-8'}" required="required" /></div>
                        </div>
                        <div class="form-group">
                            <label class="col-lg-4 control-label">{l s='Country' mod='globkuriermodule'}:<sup>*</sup></label>
                            <div class="col-lg-7">
                                <select class="form-control" name="config_defaultCountryCode" required="required">
                                {foreach from=$countries key=k item=country}
                                <option value="{$country.isoCode|escape:'htmlall':'UTF-8'}" {if $config->defaultCountryCode == $country.isoCode}selected="true"{/if}>{$country.name|escape:'htmlall':'UTF-8'}</option>
                                {/foreach}
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="col-lg-4 control-label">{l s='Email' mod='globkuriermodule'}:<sup>*</sup></label>
                            <div class="col-lg-7"><input type="email" class="form-control" name="config_defaultSenderEmail" value="{$config->defaultSenderEmail|escape:'htmlall':'UTF-8'}" required="required" /></div>
                        </div>
                        <div class="form-group">
                            <label class="col-lg-4 control-label">{l s='Phone no' mod='globkuriermodule'}:<sup>*</sup></label>
                            <div class="col-lg-7"><input type="text" class="form-control" name="config_defaultSenderPhoneNumber" value="{$config->defaultSenderPhoneNumber|escape:'htmlall':'UTF-8'}" required="required" /></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {* ══════════════════════════════════════
           TAB 2: USTAWIENIA WYSYŁKI
        ══════════════════════════════════════ *}
        <div class="gk-tab-pane" id="tab-wysylka">
            <div class="row">
                <div class="col-lg-6">
                    <div class="form-horizontal">
                        <h4 class="text-muted" style="margin:0 0 18px; font-size:13px; text-transform:uppercase; letter-spacing:.05em;">{l s='Default parcel parameters' mod='globkuriermodule'}</h4>
                        <div class="form-group">
                            <label class="col-lg-4 control-label">{l s='Weight (kg)' mod='globkuriermodule'}:<sup>*</sup></label>
                            <div class="col-lg-3"><input class="form-control" type="number" step="0.01" name="config_defaultWeight" value="{$config->defaultWeight|escape:'htmlall':'UTF-8'}" required="required" /></div>
                        </div>
                        <div class="form-group">
                            <label class="col-lg-4 control-label">{l s='Width' mod='globkuriermodule'} [cm]:<sup>*</sup></label>
                            <div class="col-lg-3"><input class="form-control" type="number" name="config_defaultWidth" value="{$config->defaultWidth|escape:'htmlall':'UTF-8'}" required="required" /></div>
                        </div>
                        <div class="form-group">
                            <label class="col-lg-4 control-label">{l s='Height' mod='globkuriermodule'} [cm]:<sup>*</sup></label>
                            <div class="col-lg-3"><input class="form-control" type="number" name="config_defaultHeight" value="{$config->defaultHeight|escape:'htmlall':'UTF-8'}" required="required" /></div>
                        </div>
                        <div class="form-group">
                            <label class="col-lg-4 control-label">{l s='Depth' mod='globkuriermodule'} [cm]:<sup>*</sup></label>
                            <div class="col-lg-3"><input class="form-control" type="number" name="config_defaultDepth" value="{$config->defaultDepth|escape:'htmlall':'UTF-8'}" required="required" /></div>
                        </div>
                        <div class="form-group">
                            <label class="col-lg-4 control-label">{l s='Content' mod='globkuriermodule'}:<sup>*</sup></label>
                            <div class="col-lg-7"><input type="text" class="form-control" name="config_defaultContent" value="{$config->defaultContent|escape:'htmlall':'UTF-8'}" required="required" /></div>
                        </div>
                        <div class="form-group">
                            <label class="col-lg-4 control-label">{l s='Carrier' mod='globkuriermodule'}:</label>
                            <div class="col-lg-7" style="text-align:left;">
                                <button type="button" id="openServicesModal" class="btn btn-default">{l s='Choose' mod='globkuriermodule'}</button>
                                <span id="selectedServiceName" style="margin-left:10px; font-weight:bold;">{$config->defaultServiceName|escape:'htmlall':'UTF-8'}</span>
                            </div>
                            <input type="hidden" name="config_defaultServiceCode" value="{$config->defaultServiceCode|escape:'htmlall':'UTF-8'}" />
                            <input type="hidden" name="config_defaultServiceName" value="{$config->defaultServiceName|escape:'htmlall':'UTF-8'}" />
                        </div>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="form-horizontal">
                        <h4 class="text-muted" style="margin:0 0 18px; font-size:13px; text-transform:uppercase; letter-spacing:.05em;">{l s='Payment & COD' mod='globkuriermodule'}</h4>
                        <div class="form-group">
                            <label class="col-lg-4 control-label">{l s='Payment' mod='globkuriermodule'}:</label>
                            <div class="col-lg-7">
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
                                <p class="help-block">{l s='Auto-selected during shipment. Overridden by template setting.' mod='globkuriermodule'}</p>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="col-lg-4 control-label">{l s='Account number for COD purpose' mod='globkuriermodule'}:</label>
                            <div class="col-lg-7"><input type="text" class="form-control" name="config_defaultCodAccount" value="{$config->defaultCodAccount|escape:'htmlall':'UTF-8'}" /></div>
                        </div>
                        <div class="form-group">
                            <label class="col-lg-4 control-label">{l s='Account holder name' mod='globkuriermodule'}:</label>
                            <div class="col-lg-7"><input type="text" class="form-control" name="config_defaultCodAccountHolderName" value="{$config->defaultCodAccountHolderName|escape:'htmlall':'UTF-8'}" /></div>
                        </div>
                        <div class="form-group">
                            <label class="col-lg-4 control-label">{l s='Account holder address' mod='globkuriermodule'}:</label>
                            <div class="col-lg-7"><input type="text" class="form-control" name="config_defaultCodAccountHolderAddr1" value="{$config->defaultCodAccountHolderAddr1|escape:'htmlall':'UTF-8'}" /></div>
                        </div>
                        <div class="form-group">
                            <label class="col-lg-4 control-label">{l s='Account holder post code and city' mod='globkuriermodule'}:</label>
                            <div class="col-lg-7"><input type="text" class="form-control" name="config_defaultCodAccountHolderAddr2" value="{$config->defaultCodAccountHolderAddr2|escape:'htmlall':'UTF-8'}" /></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {* ══════════════════════════════════════
           TAB 3: OPERATORZY
        ══════════════════════════════════════ *}
        <div class="gk-tab-pane" id="tab-operatorzy">
            <div class="row">
                <div class="col-lg-10">
                    <div class="form-horizontal">
                        <h4 class="text-muted" style="margin:0 0 18px; font-size:13px; text-transform:uppercase; letter-spacing:.05em;">{l s='Pickup point operators' mod='globkuriermodule'}</h4>

                        {* InPost *}
                        <div class="gk-operator-row">
                            <span class="gk-operator-label">InPost Paczkomat</span>
                            <span class="switch prestashop-switch">
                                <input name="config_inPostEnabled" id="inPostEnabled_on" value="1" {if $config->inPostEnabled == 1}checked="checked"{/if} type="radio">
                                <label for="inPostEnabled_on" class="radioCheck"><i class="color_success"></i> {l s='Yes' mod='globkuriermodule'}</label>
                                <input name="config_inPostEnabled" id="inPostEnabled_off" value="0" {if $config->inPostEnabled == 0}checked="checked"{/if} type="radio">
                                <label for="inPostEnabled_off" class="radioCheck"><i class="color_danger"></i> {l s='No' mod='globkuriermodule'}</label>
                                <a class="slide-button btn"></a>
                            </span>
                            <div class="gk-operator-select">
                                <select class="form-control" name="config_inPostCarrier">
                                    <option value="0">-- {l s='None' mod='globkuriermodule'} --</option>
                                    {foreach from=$carriers item=carrier}
                                    <option value="{$carrier['id_carrier']|escape:'htmlall':'UTF-8'}" {if $config->inPostCarrier == $carrier['id_carrier']}selected="true"{/if}>{$carrier['name']|escape:'htmlall':'UTF-8'}</option>
                                    {/foreach}
                                </select>
                            </div>
                            <div style="min-width:200px">
                                <input type="text" class="form-control" name="config_defaultInPostPoint" value="{$config->defaultInPostPoint|escape:'htmlall':'UTF-8'}" placeholder="{l s='Default sender point code' mod='globkuriermodule'}" />
                            </div>
                        </div>

                        {* InPost COD *}
                        <div class="gk-operator-row">
                            <span class="gk-operator-label">InPost Kurier COD</span>
                            <span class="switch prestashop-switch">
                                <input name="config_inPostCODEnabled" id="inPostCODEnabled_on" value="1" {if $config->inPostCODEnabled == 1}checked="checked"{/if} type="radio">
                                <label for="inPostCODEnabled_on" class="radioCheck"><i class="color_success"></i> {l s='Yes' mod='globkuriermodule'}</label>
                                <input name="config_inPostCODEnabled" id="inPostCODEnabled_off" value="0" {if $config->inPostCODEnabled == 0}checked="checked"{/if} type="radio">
                                <label for="inPostCODEnabled_off" class="radioCheck"><i class="color_danger"></i> {l s='No' mod='globkuriermodule'}</label>
                                <a class="slide-button btn"></a>
                            </span>
                            <div class="gk-operator-select">
                                <select class="form-control" name="config_inPostCODCarrier">
                                    <option value="0">-- {l s='None' mod='globkuriermodule'} --</option>
                                    {foreach from=$carriers item=carrier}
                                    <option value="{$carrier['id_carrier']|escape:'htmlall':'UTF-8'}" {if $config->inPostCODCarrier == $carrier['id_carrier']}selected="true"{/if}>{$carrier['name']|escape:'htmlall':'UTF-8'}</option>
                                    {/foreach}
                                </select>
                            </div>
                        </div>

                        {* Paczka w Ruchu *}
                        <div class="gk-operator-row">
                            <span class="gk-operator-label">PaczkaRUCH</span>
                            <span class="switch prestashop-switch">
                                <input name="config_paczkaRuchEnabled" id="paczkaRuchEnabled_on" value="1" {if $config->paczkaRuchEnabled == 1}checked="checked"{/if} type="radio">
                                <label for="paczkaRuchEnabled_on" class="radioCheck"><i class="color_success"></i> {l s='Yes' mod='globkuriermodule'}</label>
                                <input name="config_paczkaRuchEnabled" id="paczkaRuchEnabled_off" value="0" {if $config->paczkaRuchEnabled == 0}checked="checked"{/if} type="radio">
                                <label for="paczkaRuchEnabled_off" class="radioCheck"><i class="color_danger"></i> {l s='No' mod='globkuriermodule'}</label>
                                <a class="slide-button btn"></a>
                            </span>
                            <div class="gk-operator-select">
                                <select class="form-control" name="config_paczkaRuchCarrier">
                                    <option value="0">-- {l s='None' mod='globkuriermodule'} --</option>
                                    {foreach from=$carriers item=carrier}
                                    <option value="{$carrier['id_carrier']|escape:'htmlall':'UTF-8'}" {if $config->paczkaRuchCarrier == $carrier['id_carrier']}selected="true"{/if}>{$carrier['name']|escape:'htmlall':'UTF-8'}</option>
                                    {/foreach}
                                </select>
                            </div>
                        </div>

                        {* Pocztex 48 OWP *}
                        <div class="gk-operator-row">
                            <span class="gk-operator-label">Pocztex Kurier48 OWP</span>
                            <span class="switch prestashop-switch">
                                <input name="config_pocztex48owpEnabled" id="pocztex48owpEnabled_on" value="1" {if $config->pocztex48owpEnabled == 1}checked="checked"{/if} type="radio">
                                <label for="pocztex48owpEnabled_on" class="radioCheck"><i class="color_success"></i> {l s='Yes' mod='globkuriermodule'}</label>
                                <input name="config_pocztex48owpEnabled" id="pocztex48owpEnabled_off" value="0" {if $config->pocztex48owpEnabled == 0}checked="checked"{/if} type="radio">
                                <label for="pocztex48owpEnabled_off" class="radioCheck"><i class="color_danger"></i> {l s='No' mod='globkuriermodule'}</label>
                                <a class="slide-button btn"></a>
                            </span>
                            <div class="gk-operator-select">
                                <select class="form-control" name="config_pocztex48owpCarrier">
                                    <option value="0">-- {l s='None' mod='globkuriermodule'} --</option>
                                    {foreach from=$carriers item=carrier}
                                    <option value="{$carrier['id_carrier']|escape:'htmlall':'UTF-8'}" {if $config->pocztex48owpCarrier == $carrier['id_carrier']}selected="true"{/if}>{$carrier['name']|escape:'htmlall':'UTF-8'}</option>
                                    {/foreach}
                                </select>
                            </div>
                        </div>

                        {* DPD Pickup *}
                        <div class="gk-operator-row">
                            <span class="gk-operator-label">DPD Pickup</span>
                            <span class="switch prestashop-switch">
                                <input name="config_dpdpickupEnabled" id="dpdpickupEnabled_on" value="1" {if $config->dpdpickupEnabled == 1}checked="checked"{/if} type="radio">
                                <label for="dpdpickupEnabled_on" class="radioCheck"><i class="color_success"></i> {l s='Yes' mod='globkuriermodule'}</label>
                                <input name="config_dpdpickupEnabled" id="dpdpickupEnabled_off" value="0" {if $config->dpdpickupEnabled == 0}checked="checked"{/if} type="radio">
                                <label for="dpdpickupEnabled_off" class="radioCheck"><i class="color_danger"></i> {l s='No' mod='globkuriermodule'}</label>
                                <a class="slide-button btn"></a>
                            </span>
                            <div class="gk-operator-select">
                                <select class="form-control" name="config_dpdpickupCarrier">
                                    <option value="0">-- {l s='None' mod='globkuriermodule'} --</option>
                                    {foreach from=$carriers item=carrier}
                                    <option value="{$carrier['id_carrier']|escape:'htmlall':'UTF-8'}" {if $config->dpdpickupCarrier == $carrier['id_carrier']}selected="true"{/if}>{$carrier['name']|escape:'htmlall':'UTF-8'}</option>
                                    {/foreach}
                                </select>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            <div class="row" style="margin-top:20px;">
                <div class="col-lg-12">
                    <button type="button" id="updateCacheBtn" data-url="{html_entity_decode($getCachePointsLink|escape:'htmlall':'UTF-8')}" class="btn btn-default">
                        {l s='Cache points for whole country' mod='globkuriermodule'}
                    </button>
                    <span id="cacheLoading" style="display:none;"><i class="icon-cog icon-spin"></i></span>
                </div>
            </div>
        </div>

        {* ══════════════════════════════════════
           TAB 4: SZABLONY
        ══════════════════════════════════════ *}
        <div class="gk-tab-pane" id="tab-szablony">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
                <div>
                    <strong style="font-size:14px;">{l s='Shipment templates' mod='globkuriermodule'}</strong>
                    <span class="text-muted" style="font-size:12px; margin-left:8px;" id="gk-tmpl-count-label">{$gk_template_count|intval} {l s='templates' mod='globkuriermodule'}</span>
                </div>
                <div style="display:flex; gap:8px;">
                    <button type="button" class="btn btn-success btn-sm" id="gk-tmpl-sync-btn">
                        <i class="icon-refresh"></i> {l s='Import from GlobKurier' mod='globkuriermodule'}
                    </button>
                    <button type="button" class="btn btn-primary btn-sm" id="gk-tmpl-new-btn">
                        <i class="icon-plus"></i> {l s='New template' mod='globkuriermodule'}
                    </button>
                </div>
            </div>

            <div class="gk-tmpl-layout">
                <div class="gk-tmpl-list" id="gk-tmpl-list">
                    <div style="padding:20px; text-align:center; color:#8a9db0; font-size:13px;" id="gk-tmpl-empty">
                        {l s='No templates yet. Click New template to add one.' mod='globkuriermodule'}
                    </div>
                </div>

                <div class="gk-tmpl-editor" id="gk-tmpl-editor">
                    <div class="gk-tmpl-placeholder" id="gk-tmpl-placeholder">
                        <svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                        <p style="margin-top:12px;">{l s='Select a template from the list or create a new one.' mod='globkuriermodule'}</p>
                    </div>
                    <div id="gk-tmpl-form-wrap" style="display:none; flex-direction:column; height:100%;">
                        <div class="gk-tmpl-editor-head">
                            <span class="gk-tmpl-editor-title" id="gk-tmpl-editor-title">{l s='Template' mod='globkuriermodule'}</span>
                            <button type="button" class="btn btn-default btn-xs" id="gk-tmpl-star-btn" title="{l s='Set as default' mod='globkuriermodule'}">
                                ★ {l s='Default' mod='globkuriermodule'}
                            </button>
                        </div>
                        <div class="gk-tmpl-editor-body">
                            <input type="hidden" id="gk-f-id" />
                            <div class="form-horizontal">
                                <div class="form-group">
                                    <label class="col-sm-4 control-label">{l s='Name' mod='globkuriermodule'} <span class="text-danger">*</span></label>
                                    <div class="col-sm-8"><input type="text" class="form-control" id="gk-f-name" /></div>
                                </div>
                                <div class="form-group">
                                    <label class="col-sm-4 control-label">{l s='PS carrier (auto-select)' mod='globkuriermodule'}</label>
                                    <div class="col-sm-8">
                                        <select class="form-control" id="gk-f-carrier">
                                            <option value="">{l s='-- no binding --' mod='globkuriermodule'}</option>
                                            {foreach from=$carriers item=carrier}
                                            <option value="{$carrier['id_carrier']|escape:'htmlall':'UTF-8'}">{$carrier['name']|escape:'htmlall':'UTF-8'}</option>
                                            {/foreach}
                                        </select>
                                        <p class="help-block">{l s='Template selected automatically when this carrier is used in the order.' mod='globkuriermodule'}</p>
                                    </div>
                                </div>
                                <div class="gk-tmpl-subheading">{l s='Route' mod='globkuriermodule'}</div>
                                <div class="form-group">
                                    <label class="col-sm-4 control-label">{l s='Sender country' mod='globkuriermodule'}</label>
                                    <div class="col-sm-8">
                                        <select class="form-control" id="gk-f-sender-country">
                                            {foreach from=$countries item=country}
                                            <option value="{$country.isoCode|escape:'htmlall':'UTF-8'}">{$country.name|escape:'htmlall':'UTF-8'}</option>
                                            {/foreach}
                                        </select>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-sm-4 control-label">{l s='Recipient country' mod='globkuriermodule'}</label>
                                    <div class="col-sm-8">
                                        <select class="form-control" id="gk-f-recipient-country">
                                            {foreach from=$countries item=country}
                                            <option value="{$country.isoCode|escape:'htmlall':'UTF-8'}">{$country.name|escape:'htmlall':'UTF-8'}</option>
                                            {/foreach}
                                        </select>
                                    </div>
                                </div>
                                <div class="gk-tmpl-subheading">{l s='Package dimensions' mod='globkuriermodule'}</div>
                                <div class="form-group">
                                    <label class="col-sm-4 control-label">{l s='Length (cm)' mod='globkuriermodule'}</label>
                                    <div class="col-sm-3"><input type="number" step="0.1" class="form-control" id="gk-f-length" /></div>
                                    <label class="col-sm-2 control-label">{l s='Width' mod='globkuriermodule'}</label>
                                    <div class="col-sm-3"><input type="number" step="0.1" class="form-control" id="gk-f-width" /></div>
                                </div>
                                <div class="form-group">
                                    <label class="col-sm-4 control-label">{l s='Height (cm)' mod='globkuriermodule'}</label>
                                    <div class="col-sm-3"><input type="number" step="0.1" class="form-control" id="gk-f-height" /></div>
                                    <label class="col-sm-2 control-label">{l s='Weight (kg)' mod='globkuriermodule'}</label>
                                    <div class="col-sm-3"><input type="number" step="0.01" class="form-control" id="gk-f-weight" /></div>
                                </div>
                                <div class="form-group">
                                    <label class="col-sm-4 control-label">{l s='Quantity' mod='globkuriermodule'}</label>
                                    <div class="col-sm-3"><input type="number" min="1" class="form-control" id="gk-f-quantity" value="1" /></div>
                                </div>
                                <div class="gk-tmpl-subheading">{l s='GlobKurier service' mod='globkuriermodule'}</div>
                                <div class="form-group">
                                    <label class="col-sm-4 control-label">{l s='Service' mod='globkuriermodule'}</label>
                                    <div class="col-sm-8">
                                        <select class="form-control" id="gk-f-product-select">
                                            <option value="">{l s='-- fill in dimensions and country --' mod='globkuriermodule'}</option>
                                        </select>
                                        <small id="gk-f-product-spinner" class="text-muted" style="display:none;"><i class="icon-refresh icon-spin"></i> {l s='Loading services…' mod='globkuriermodule'}</small>
                                        <input type="hidden" id="gk-f-product-id" />
                                        <input type="hidden" id="gk-f-addons" />
                                    </div>
                                </div>
                                <div id="gk-f-addons-wrap" style="display:none;">
                                    <div class="gk-tmpl-subheading">{l s='Additional services' mod='globkuriermodule'}</div>
                                    <div class="form-group">
                                        <div class="col-sm-offset-4 col-sm-8" id="gk-f-addons-list"></div>
                                    </div>
                                </div>
                                <div class="gk-tmpl-subheading">{l s='Content & payment' mod='globkuriermodule'}</div>
                                <div class="form-group">
                                    <label class="col-sm-4 control-label">{l s='Content' mod='globkuriermodule'}</label>
                                    <div class="col-sm-8">
                                        <select class="form-control" id="gk-f-contents-select">
                                            <option value="">{l s='-- select content --' mod='globkuriermodule'}</option>
                                        </select>
                                        <input type="text" class="form-control" id="gk-f-contents" style="margin-top:6px;display:none" placeholder="{l s='Enter custom content…' mod='globkuriermodule'}" />
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-sm-4 control-label">{l s='Payment type' mod='globkuriermodule'}</label>
                                    <div class="col-sm-8">
                                        <select class="form-control" id="gk-f-payment">
                                            <option value="">{l s='-- use global default --' mod='globkuriermodule'}</option>
                                            {if isset($gk_payments) && $gk_payments}
                                                {foreach from=$gk_payments item=gkp}
                                                <option value="{$gkp.id|intval}">{$gkp.name|escape:'htmlall':'UTF-8'}</option>
                                                {/foreach}
                                            {else}
                                                <option value="1">{l s='Bank transfer' mod='globkuriermodule'}</option>
                                                <option value="2">{l s='Online payment' mod='globkuriermodule'}</option>
                                                <option value="4">{l s='Collective invoice (delayed)' mod='globkuriermodule'}</option>
                                                <option value="9">{l s='Pre-paid account' mod='globkuriermodule'}</option>
                                                <option value="6">{l s='Cash on delivery' mod='globkuriermodule'}</option>
                                            {/if}
                                        </select>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <div class="col-sm-offset-4 col-sm-8">
                                        <div class="checkbox">
                                            <label><input type="checkbox" id="gk-f-default"> {l s='Set as default template' mod='globkuriermodule'}</label>
                                        </div>
                                    </div>
                                </div>
                                <div id="gk-f-sync-info" style="display:none;" class="form-group">
                                    <div class="col-sm-offset-4 col-sm-8">
                                        <span class="label label-info" style="font-size:11px;">{l s='Synced with GlobKurier' mod='globkuriermodule'}</span>
                                        <span class="gk-sync-info" id="gk-f-sync-date"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="gk-tmpl-editor-footer">
                            <button type="button" class="btn btn-primary btn-sm" id="gk-tmpl-save-btn">{l s='Save' mod='globkuriermodule'}</button>
                            <button type="button" class="btn btn-default btn-sm" id="gk-tmpl-cancel-btn">{l s='Cancel' mod='globkuriermodule'}</button>
                            <button type="button" class="btn btn-danger btn-sm pull-right" id="gk-tmpl-delete-btn" style="margin-left:auto; display:none;">{l s='Delete' mod='globkuriermodule'}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>{* /panel-body *}
    <div class="panel-footer">
        <input type="hidden" name="action" value="updateConfig"/>
        <button type="submit" class="btn btn-default pull-left" id="gk-config-save-btn">
            <i class="process-icon-save"></i> {l s='Save' mod='globkuriermodule'}
        </button>
        <span class="text-muted" style="line-height:34px; margin-left:12px; font-size:12px;" id="gk-save-hint">{l s='Saves tabs: Sender, Shipment settings, Operators.' mod='globkuriermodule'}</span>
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
    <h3 class="globkurier-returns-banner__title">Szybkie i tanie zwroty na jedno kliknięcie<br>w Twoim sklepie</h3>
    <ul class="globkurier-returns-banner__list">
        <li>Darmowe uruchomienie i korzystanie z narzędzia</li>
        <li>Szybki i prosty proces aktywacji</li>
        <li>Lepsza kontrola nad procesami i raportowaniem</li>
    </ul>
    <a href="https://zwroty.globkurier.pl/pl/zwroty-dla-sklepow-internetowych" target="_blank" rel="noopener noreferrer" class="globkurier-returns-banner__btn">
        DOWIEDZ SIĘ WIĘCEJ
    </a>
</div>
<div class="modal fade" id="servicesModal" tabindex="-1" role="dialog">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h4 class="modal-title">{l s='Select carrier' mod='globkuriermodule'}</h4>
      </div>
      <div class="modal-body row" id="servicesList" style="display:flex;flex-wrap:wrap;">
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-default" data-dismiss="modal">{l s='Cancel' mod='globkuriermodule'}</button>
      </div>
    </div>
  </div>
</div>

<script>
    document.querySelector('.globkurier-returns-banner__close')?.addEventListener('click', function() {
        document.getElementById('globkurier-returns-banner').style.display = 'none';
    });
</script>

<script type="text/javascript">
    var tokenAPI       = '{$tokenAPI|escape:'javascript':'UTF-8'}';
    var gkConfigAjaxUrl = '{$configAjaxUrl|escape:'javascript':'UTF-8'}';
    var gkTemplatesData = {$gk_templates_json};
    var lang_change = '{l s='Change' mod='globkuriermodule'}';
    var lang_choose = '{l s='Choose' mod='globkuriermodule'}';
    var lang_delete = '{l s='Delete' mod='globkuriermodule'}';
    var lang_choose_delivery = '{l s='Choose delivery' mod='globkuriermodule'}';
    var lang_choosen = '{l s='Confirm' mod='globkuriermodule'}';
    var lang_cancel = '{l s='Cancel' mod='globkuriermodule'}';
    var lang_error1 = '{l s='No services matching your criteria were found' mod='globkuriermodule'}';
    var window_tokenAPI = tokenAPI;
</script>
