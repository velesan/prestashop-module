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
    <div class="panel-body" style="padding:0">

        {* ── Alerts ── *}
        <div id="gk-alerts" style="padding:16px 20px 0">
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
        </div>

        {* ── APP LAYOUT: SIDEBAR + CONTENT ── *}
        <div class="gk-app-layout">

            {* ═══ SIDEBAR ═══ *}
            <aside class="gk-sidebar" id="gkSidebar">
                <div class="gk-sidebar-header">
                    <img src="{$baseurl|escape:'html':'UTF-8'}views/img/logo.png" class="gk-sidebar-logo" alt="GlobKurier">
                    <button type="button" class="gk-sidebar-close" id="gkSidebarClose" aria-label="Zamknij menu">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                {* Group: Account *}
                <div class="gk-sidebar-group">
                    <div class="gk-sidebar-label">{l s='Account' mod='globkuriermodule'}</div>
                    <ul class="gk-sidebar-nav">
                        <li><button type="button" class="gk-sidebar-btn" data-tab="tab-konto" data-title="{l s='Account & login' mod='globkuriermodule'}">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            {l s='Account & login' mod='globkuriermodule'}
                            {if !$gkIsAuthenticated}<span class="gk-sidebar-badge">!</span>{/if}
                        </button></li>
                        <li><button type="button" class="gk-sidebar-btn" data-tab="tab-nadawca" data-title="{l s='Sender' mod='globkuriermodule'}">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            {l s='Sender address' mod='globkuriermodule'}
                        </button></li>
                    </ul>
                </div>

                {* Group: Shipments *}
                <div class="gk-sidebar-group">
                    <div class="gk-sidebar-label">{l s='Shipments' mod='globkuriermodule'}</div>
                    <ul class="gk-sidebar-nav">
                        <li><button type="button" class="gk-sidebar-btn" data-tab="tab-wysylka" data-title="{l s='Shipment settings' mod='globkuriermodule'}">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                            {l s='Shipment settings' mod='globkuriermodule'}
                        </button></li>
                        <li><button type="button" class="gk-sidebar-btn" data-tab="tab-operatorzy" data-title="{l s='Operators' mod='globkuriermodule'}">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                            {l s='Operators' mod='globkuriermodule'}
                        </button></li>
                        <li><button type="button" class="gk-sidebar-btn" data-tab="tab-szablony" data-title="{l s='Templates' mod='globkuriermodule'}">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                            {l s='Templates' mod='globkuriermodule'}
                            {if $gk_template_count > 0}<span class="gk-sidebar-cnt">{$gk_template_count|intval}</span>{/if}
                        </button></li>
                    </ul>
                </div>

                {* Group: Shop *}
                <div class="gk-sidebar-group">
                    <div class="gk-sidebar-label">{l s='Shop' mod='globkuriermodule'}</div>
                    <ul class="gk-sidebar-nav">
                        <li><button type="button" class="gk-sidebar-btn" data-tab="tab-platnosci" data-title="{l s='Payments' mod='globkuriermodule'}">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                            {l s='Payments' mod='globkuriermodule'}
                        </button></li>
                        <li><button type="button" class="gk-sidebar-btn" data-tab="tab-etykiety" data-title="{l s='Labels & statuses' mod='globkuriermodule'}">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                            {l s='Labels & statuses' mod='globkuriermodule'}
                        </button></li>
                    </ul>
                </div>
            </aside>

            {* Mobile overlay *}
            <div class="gk-sidebar-overlay" id="gkSidebarOverlay"></div>

            {* ═══ MAIN CONTENT ═══ *}
            <div class="gk-sidebar-main">
                <div class="gk-sidebar-topbar">
                    <button type="button" class="gk-hamburger" id="gkHamburger" aria-label="Menu">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                    </button>
                    <span class="gk-sidebar-crumb" id="gkSidebarCrumb">{l s='Account & login' mod='globkuriermodule'}</span>
                </div>

                <div class="gk-sidebar-content-area">

                    {* ══════════════════════════════════════
                       TAB: KONTO I LOGOWANIE
                    ══════════════════════════════════════ *}
                    <div class="gk-tab-pane" id="tab-konto">
                        {if $gkIsAuthenticated}
                        {* Authenticated: profile card *}
                        <input type="hidden" name="config_login" value="{$config->login|escape:'htmlall':'UTF-8'}" />
                        <div class="gk-account-card">
                            <div class="gk-account-av">GK</div>
                            <div class="gk-account-meta">
                                <div class="gk-account-email">{$config->login|escape:'htmlall':'UTF-8'}</div>
                                <span class="gk-chip"><span class="gk-chip-dot"></span> {l s='Account active' mod='globkuriermodule'}</span>
                            </div>
                            <button type="button" class="btn btn-danger btn-sm" id="gkLogoutBtn">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                                {l s='Log out' mod='globkuriermodule'}
                            </button>
                        </div>
                        {else}
                        {* Guest: login form *}
                        <div style="max-width:460px;">
                            <h4 style="margin:0 0 6px; font-size:16px; font-weight:700;">{l s='Log in to GlobKurier' mod='globkuriermodule'}</h4>
                            <p style="color:#6c7a8d; margin:0 0 22px; font-size:13px;">{l s='Enter your globkurier.pl credentials to use the module.' mod='globkuriermodule'}</p>
                            <div class="form-group">
                                <label class="control-label" style="font-weight:600; margin-bottom:4px;">{l s='Email / Login' mod='globkuriermodule'}</label>
                                <input type="email" class="form-control" name="config_login" value="{$config->login|escape:'htmlall':'UTF-8'}" placeholder="twoj@email.pl" autocomplete="email" />
                            </div>
                            <div class="form-group">
                                <label class="control-label" style="font-weight:600; margin-bottom:4px;">{l s='Password' mod='globkuriermodule'}</label>
                                <input type="password" class="form-control" name="config_password" value="" placeholder="{l s='Your GlobKurier password' mod='globkuriermodule'}" autocomplete="current-password" />
                            </div>
                            <button type="submit" name="action" value="updateConfig" class="btn btn-primary">
                                <i class="icon-sign-in"></i> {l s='Log in' mod='globkuriermodule'}
                            </button>
                            <p class="help-block" style="margin-top:12px;">
                                {l s="Don't have account yet?" mod='globkuriermodule'} <a href="https://globkurier.pl" target="_blank" rel="noopener noreferrer">{l s='Register' mod='globkuriermodule'}</a>
                            </p>
                        </div>
                        {/if}

                        {* API environment toggle — always visible; saved instantly via AJAX, no form submit needed *}
                        <div class="gk-env-block">
                            <h4 class="text-muted" style="margin:0 0 10px; font-size:12px; text-transform:uppercase; letter-spacing:.05em;">{l s='GlobKurier API environment' mod='globkuriermodule'}</h4>
                            <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:6px;">
                                <span class="switch prestashop-switch" id="gkApiEnvSwitch">
                                    <input type="radio" name="config_gkApiEnv" id="gkApiEnv_on" value="1" {if $config->gkApiEnv != '0'}checked="checked"{/if} />
                                    <label for="gkApiEnv_on" class="radioCheck"><i class="color_success"></i> {l s='Production' mod='globkuriermodule'}</label>
                                    <input type="radio" name="config_gkApiEnv" id="gkApiEnv_off" value="0" {if $config->gkApiEnv == '0'}checked="checked"{/if} />
                                    <label for="gkApiEnv_off" class="radioCheck"><i class="color_danger"></i> {l s='Test' mod='globkuriermodule'}</label>
                                    <a class="slide-button btn"></a>
                                </span>
                                <small class="text-muted" id="gkApiEnvHost">{if $config->gkApiEnv == '0'}{$gkApiBaseUrlTest|escape:'htmlall':'UTF-8'}{else}{$gkApiBaseUrlProd|escape:'htmlall':'UTF-8'}{/if}</small>
                                <span id="gkApiEnvSavedMsg" class="text-success" style="display:none;"><i class="icon-check"></i> {l s='Saved' mod='globkuriermodule'}</span>
                            </div>
                        </div>
                    </div>

                    {* ══════════════════════════════════════
                       TAB: NADAWCA
                    ══════════════════════════════════════ *}
                    <div class="gk-tab-pane" id="tab-nadawca">
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
                                            <option value="{$country.isoCode|escape:'htmlall':'UTF-8'}" {if $config->defaultCountryCode == $country.isoCode}selected="selected"{/if}>{$country.name|escape:'htmlall':'UTF-8'}</option>
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
                       TAB: USTAWIENIA WYSYŁKI
                    ══════════════════════════════════════ *}
                    <div class="gk-tab-pane" id="tab-wysylka">
                        <div class="row">
                            <div class="col-lg-6">
                                <div class="form-horizontal">
                                    <h4 class="text-muted" style="margin:0 0 18px; font-size:13px; text-transform:uppercase; letter-spacing:.05em;">{l s='Default parcel parameters' mod='globkuriermodule'}</h4>
                                    <div class="form-group">
                                        <label class="col-lg-4 control-label">{l s='Length (cm)' mod='globkuriermodule'}:<sup>*</sup></label>
                                        <div class="col-lg-3"><input class="form-control" type="number" name="config_defaultDepth" value="{$config->defaultDepth|escape:'htmlall':'UTF-8'}" required="required" /></div>
                                    </div>
                                    <div class="form-group">
                                        <label class="col-lg-4 control-label">{l s='Width (cm)' mod='globkuriermodule'}:<sup>*</sup></label>
                                        <div class="col-lg-3"><input class="form-control" type="number" name="config_defaultWidth" value="{$config->defaultWidth|escape:'htmlall':'UTF-8'}" required="required" /></div>
                                    </div>
                                    <div class="form-group">
                                        <label class="col-lg-4 control-label">{l s='Height (cm)' mod='globkuriermodule'}:<sup>*</sup></label>
                                        <div class="col-lg-3"><input class="form-control" type="number" name="config_defaultHeight" value="{$config->defaultHeight|escape:'htmlall':'UTF-8'}" required="required" /></div>
                                    </div>
                                    <div class="form-group">
                                        <label class="col-lg-4 control-label">{l s='Weight (kg)' mod='globkuriermodule'}:<sup>*</sup></label>
                                        <div class="col-lg-3"><input class="form-control" type="number" step="0.01" name="config_defaultWeight" value="{$config->defaultWeight|escape:'htmlall':'UTF-8'}" required="required" /></div>
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
                        </div>
                    </div>

                    {* ══════════════════════════════════════
                       TAB: OPERATORZY
                    ══════════════════════════════════════ *}
                    <div class="gk-tab-pane" id="tab-operatorzy">
                        <div class="row">
                            <div class="col-lg-10">
                                <div>
                                    <h4 class="text-muted" style="margin:0 0 18px; font-size:13px; text-transform:uppercase; letter-spacing:.05em;">{l s='Pickup point operators' mod='globkuriermodule'}</h4>

                                    <div class="gk-operator-header">
                                        <span class="gk-operator-label"></span>
                                        <span class="gk-operator-col-head gk-operator-active">{l s='Active' mod='globkuriermodule'}</span>
                                        <span class="gk-operator-col-head gk-operator-select">{l s='PrestaShop carrier' mod='globkuriermodule'}</span>
                                        <span class="gk-operator-col-head gk-operator-point">{l s='Default pickup point' mod='globkuriermodule'}</span>
                                    </div>

                                    {* InPost *}
                                    <div class="gk-operator-row">
                                        <span class="gk-operator-label">InPost Paczkomat</span>
                                        <div class="gk-operator-active">
                                        <span class="switch prestashop-switch">
                                            <input name="config_inPostEnabled" id="inPostEnabled_on" value="1" {if $config->inPostEnabled == 1}checked="checked"{/if} type="radio">
                                            <label for="inPostEnabled_on" class="radioCheck"><i class="color_success"></i> {l s='Yes' mod='globkuriermodule'}</label>
                                            <input name="config_inPostEnabled" id="inPostEnabled_off" value="0" {if $config->inPostEnabled == 0}checked="checked"{/if} type="radio">
                                            <label for="inPostEnabled_off" class="radioCheck"><i class="color_danger"></i> {l s='No' mod='globkuriermodule'}</label>
                                            <a class="slide-button btn"></a>
                                        </span>
                                        </div>
                                        <div class="gk-operator-select">
                                            <select class="form-control" name="config_inPostCarrier">
                                                <option value="0">-- {l s='None' mod='globkuriermodule'} --</option>
                                                {foreach from=$carriers item=carrier}
                                                <option value="{$carrier['id_carrier']|escape:'htmlall':'UTF-8'}" {if $config->inPostCarrier|intval == $carrier['id_carrier']|intval}selected="selected"{/if}>{$carrier['name']|escape:'htmlall':'UTF-8'}</option>
                                                {/foreach}
                                            </select>
                                        </div>
                                        <div class="gk-operator-point">
                                            <input type="text" class="form-control" name="config_defaultInPostPoint" value="{$config->defaultInPostPoint|escape:'htmlall':'UTF-8'}" placeholder="{l s='Default sender point code' mod='globkuriermodule'}" />
                                        </div>
                                    </div>

                                    {* InPost COD *}
                                    <div class="gk-operator-row">
                                        <span class="gk-operator-label">InPost Kurier COD</span>
                                        <div class="gk-operator-active">
                                        <span class="switch prestashop-switch">
                                            <input name="config_inPostCODEnabled" id="inPostCODEnabled_on" value="1" {if $config->inPostCODEnabled == 1}checked="checked"{/if} type="radio">
                                            <label for="inPostCODEnabled_on" class="radioCheck"><i class="color_success"></i> {l s='Yes' mod='globkuriermodule'}</label>
                                            <input name="config_inPostCODEnabled" id="inPostCODEnabled_off" value="0" {if $config->inPostCODEnabled == 0}checked="checked"{/if} type="radio">
                                            <label for="inPostCODEnabled_off" class="radioCheck"><i class="color_danger"></i> {l s='No' mod='globkuriermodule'}</label>
                                            <a class="slide-button btn"></a>
                                        </span>
                                        </div>
                                        <div class="gk-operator-select">
                                            <select class="form-control" name="config_inPostCODCarrier">
                                                <option value="0">-- {l s='None' mod='globkuriermodule'} --</option>
                                                {foreach from=$carriers item=carrier}
                                                <option value="{$carrier['id_carrier']|escape:'htmlall':'UTF-8'}" {if $config->inPostCODCarrier|intval == $carrier['id_carrier']|intval}selected="selected"{/if}>{$carrier['name']|escape:'htmlall':'UTF-8'}</option>
                                                {/foreach}
                                            </select>
                                        </div>
                                        <div class="gk-operator-point">
                                            <input type="text" class="form-control" name="config_defaultInPostCODPoint" value="{$config->defaultInPostCODPoint|escape:'htmlall':'UTF-8'}" placeholder="{l s='Default sender point code' mod='globkuriermodule'}" />
                                        </div>
                                    </div>

                                    {* PaczkaRUCH *}
                                    <div class="gk-operator-row">
                                        <span class="gk-operator-label">PaczkaRUCH</span>
                                        <div class="gk-operator-active">
                                        <span class="switch prestashop-switch">
                                            <input name="config_paczkaRuchEnabled" id="paczkaRuchEnabled_on" value="1" {if $config->paczkaRuchEnabled == 1}checked="checked"{/if} type="radio">
                                            <label for="paczkaRuchEnabled_on" class="radioCheck"><i class="color_success"></i> {l s='Yes' mod='globkuriermodule'}</label>
                                            <input name="config_paczkaRuchEnabled" id="paczkaRuchEnabled_off" value="0" {if $config->paczkaRuchEnabled == 0}checked="checked"{/if} type="radio">
                                            <label for="paczkaRuchEnabled_off" class="radioCheck"><i class="color_danger"></i> {l s='No' mod='globkuriermodule'}</label>
                                            <a class="slide-button btn"></a>
                                        </span>
                                        </div>
                                        <div class="gk-operator-select">
                                            <select class="form-control" name="config_paczkaRuchCarrier">
                                                <option value="0">-- {l s='None' mod='globkuriermodule'} --</option>
                                                {foreach from=$carriers item=carrier}
                                                <option value="{$carrier['id_carrier']|escape:'htmlall':'UTF-8'}" {if $config->paczkaRuchCarrier|intval == $carrier['id_carrier']|intval}selected="selected"{/if}>{$carrier['name']|escape:'htmlall':'UTF-8'}</option>
                                                {/foreach}
                                            </select>
                                        </div>
                                        <div class="gk-operator-point">
                                            <input type="text" class="form-control" name="config_defaultPaczkaRuchPoint" value="{$config->defaultPaczkaRuchPoint|escape:'htmlall':'UTF-8'}" placeholder="{l s='Default sender point code' mod='globkuriermodule'}" />
                                        </div>
                                    </div>

                                    {* Pocztex 48 OWP *}
                                    <div class="gk-operator-row">
                                        <span class="gk-operator-label">Pocztex Kurier48 OWP</span>
                                        <div class="gk-operator-active">
                                        <span class="switch prestashop-switch">
                                            <input name="config_pocztex48owpEnabled" id="pocztex48owpEnabled_on" value="1" {if $config->pocztex48owpEnabled == 1}checked="checked"{/if} type="radio">
                                            <label for="pocztex48owpEnabled_on" class="radioCheck"><i class="color_success"></i> {l s='Yes' mod='globkuriermodule'}</label>
                                            <input name="config_pocztex48owpEnabled" id="pocztex48owpEnabled_off" value="0" {if $config->pocztex48owpEnabled == 0}checked="checked"{/if} type="radio">
                                            <label for="pocztex48owpEnabled_off" class="radioCheck"><i class="color_danger"></i> {l s='No' mod='globkuriermodule'}</label>
                                            <a class="slide-button btn"></a>
                                        </span>
                                        </div>
                                        <div class="gk-operator-select">
                                            <select class="form-control" name="config_pocztex48owpCarrier">
                                                <option value="0">-- {l s='None' mod='globkuriermodule'} --</option>
                                                {foreach from=$carriers item=carrier}
                                                <option value="{$carrier['id_carrier']|escape:'htmlall':'UTF-8'}" {if $config->pocztex48owpCarrier|intval == $carrier['id_carrier']|intval}selected="selected"{/if}>{$carrier['name']|escape:'htmlall':'UTF-8'}</option>
                                                {/foreach}
                                            </select>
                                        </div>
                                        <div class="gk-operator-point">
                                            <input type="text" class="form-control" name="config_defaultPocztex48owpPoint" value="{$config->defaultPocztex48owpPoint|escape:'htmlall':'UTF-8'}" placeholder="{l s='Default sender point code' mod='globkuriermodule'}" />
                                        </div>
                                    </div>

                                    {* DPD Pickup *}
                                    <div class="gk-operator-row">
                                        <span class="gk-operator-label">DPD Pickup</span>
                                        <div class="gk-operator-active">
                                        <span class="switch prestashop-switch">
                                            <input name="config_dpdpickupEnabled" id="dpdpickupEnabled_on" value="1" {if $config->dpdpickupEnabled == 1}checked="checked"{/if} type="radio">
                                            <label for="dpdpickupEnabled_on" class="radioCheck"><i class="color_success"></i> {l s='Yes' mod='globkuriermodule'}</label>
                                            <input name="config_dpdpickupEnabled" id="dpdpickupEnabled_off" value="0" {if $config->dpdpickupEnabled == 0}checked="checked"{/if} type="radio">
                                            <label for="dpdpickupEnabled_off" class="radioCheck"><i class="color_danger"></i> {l s='No' mod='globkuriermodule'}</label>
                                            <a class="slide-button btn"></a>
                                        </span>
                                        </div>
                                        <div class="gk-operator-select">
                                            <select class="form-control" name="config_dpdpickupCarrier">
                                                <option value="0">-- {l s='None' mod='globkuriermodule'} --</option>
                                                {foreach from=$carriers item=carrier}
                                                <option value="{$carrier['id_carrier']|escape:'htmlall':'UTF-8'}" {if $config->dpdpickupCarrier|intval == $carrier['id_carrier']|intval}selected="selected"{/if}>{$carrier['name']|escape:'htmlall':'UTF-8'}</option>
                                                {/foreach}
                                            </select>
                                        </div>
                                        <div class="gk-operator-point">
                                            <input type="text" class="form-control" name="config_defaultDpdpickupPoint" value="{$config->defaultDpdpickupPoint|escape:'htmlall':'UTF-8'}" placeholder="{l s='Default sender point code' mod='globkuriermodule'}" />
                                        </div>
                                    </div>

                                    {if $gkIsAuthenticated}
                                    <div style="margin-top:16px; padding-top:14px; border-top:1px solid #edf2f7;">
                                        <button type="button" id="updateCacheBtn" class="btn btn-default btn-sm" data-url="{$getCachePointsLink|escape:'html':'UTF-8'}">
                                            <i class="icon-refresh"></i> {l s='Update pickup points cache' mod='globkuriermodule'}
                                        </button>
                                        <span id="cacheLoading" style="display:none; margin-left:8px;"><i class="icon-refresh icon-spin"></i></span>
                                    </div>
                                    {/if}

                                </div>
                            </div>
                        </div>
                    </div>

                    {* ══════════════════════════════════════
                       TAB: SZABLONY
                    ══════════════════════════════════════ *}
                    <div class="gk-tab-pane" id="tab-szablony">
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
                            <div>
                                <strong style="font-size:14px;">{l s='Shipment templates' mod='globkuriermodule'}</strong>
                                <span class="text-muted" style="font-size:12px; margin-left:8px;" id="gk-tmpl-count-label">{$gk_template_count|intval} {l s='templates' mod='globkuriermodule'}</span>
                            </div>
                            <div style="display:flex; gap:8px;">
                                <button type="button" class="btn btn-primary btn-sm" id="gk-tmpl-new-btn">
                                    <i class="icon-plus"></i> {l s='New template' mod='globkuriermodule'}
                                </button>
                            </div>
                        </div>

                        <div class="gk-tmpl-layout">
                            <div class="gk-tmpl-list-wrap">
                                <div class="gk-tmpl-list" id="gk-tmpl-list">
                                    <div style="padding:20px; text-align:center; color:#8a9db0; font-size:13px;" id="gk-tmpl-empty">
                                        {l s='No templates yet. Click New template to add one.' mod='globkuriermodule'}
                                    </div>
                                </div>
                                <button type="button" class="btn btn-success btn-sm" id="gk-tmpl-sync-btn" style="width:100%;">
                                    <i class="icon-refresh"></i> {l s='Import from GlobKurier' mod='globkuriermodule'}
                                </button>
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
                                                <label class="col-sm-4 control-label">{l s='Package type' mod='globkuriermodule'}</label>
                                                <div class="col-sm-8">
                                                    <select class="form-control" id="gk-f-package-list">
                                                        <option value="PARCEL">{l s='Parcel' mod='globkuriermodule'}</option>
                                                        <option value="DOX">{l s='Envelope' mod='globkuriermodule'}</option>
                                                        <option value="LONG_PARCEL">{l s='Long parcel' mod='globkuriermodule'}</option>
                                                        <option value="PALLET">{l s='Pallet' mod='globkuriermodule'}</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label">{l s='Sending method' mod='globkuriermodule'}</label>
                                                <div class="col-sm-8">
                                                    <select class="form-control" id="gk-f-collection-type">
                                                        <option value="">{l s='-- no preference --' mod='globkuriermodule'}</option>
                                                        <option value="PICKUP">{l s='Courier pickup' mod='globkuriermodule'}</option>
                                                        <option value="POINT">{l s='Drop off at a point' mod='globkuriermodule'}</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label">{l s='Delivery method' mod='globkuriermodule'}</label>
                                                <div class="col-sm-8">
                                                    <select class="form-control" id="gk-f-delivery-type">
                                                        <option value="">{l s='-- no preference --' mod='globkuriermodule'}</option>
                                                        <option value="PICKUP">{l s='Door delivery' mod='globkuriermodule'}</option>
                                                        <option value="POINT">{l s='Delivery to a point' mod='globkuriermodule'}</option>
                                                    </select>
                                                </div>
                                            </div>
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
                                                <label class="col-sm-2 control-label">{l s='Width (cm)' mod='globkuriermodule'}</label>
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

                    {* ══════════════════════════════════════
                       TAB: PŁATNOŚCI
                    ══════════════════════════════════════ *}
                    <div class="gk-tab-pane" id="tab-platnosci">
                        <div class="row">
                            <div class="col-lg-7">
                                <div class="form-horizontal">
                                    <h4 class="text-muted" style="margin:0 0 18px; font-size:13px; text-transform:uppercase; letter-spacing:.05em;">{l s='Payment & COD' mod='globkuriermodule'}</h4>
                                    {* This is how the merchant settles shipping costs with GlobKurier itself
                                       (pre-paid balance vs. deferred collective invoice) — not the per-shipment
                                       payment method (bank transfer/online/COD) shown on the order form, which
                                       depends on the picked courier product and is fetched live there. *}
                                    <div class="form-group">
                                        <label class="col-lg-4 control-label">{l s='Payment' mod='globkuriermodule'}:</label>
                                        <div class="col-lg-7">
                                            <select class="form-control" name="config_defaultPaymentType">
                                                <option value="">{l s='-- none (manual selection) --' mod='globkuriermodule'}</option>
                                                <option value="9" {if $gk_currentPaymentId == 9}selected="selected"{/if}>{l s='Pre-paid account (summary invoice)' mod='globkuriermodule'}</option>
                                                <option value="4" {if $gk_currentPaymentId == 4}selected="selected"{/if}>{l s='Summary invoice (bank transfer - deferred payment)' mod='globkuriermodule'}</option>
                                            </select>
                                            <p class="help-block">{l s='How you settle shipping costs with GlobKurier: pay upfront from your pre-paid balance, or get a collective invoice with deferred payment.' mod='globkuriermodule'}</p>
                                        </div>
                                    </div>
                                    <div class="form-group" id="gk-saldo" {if $gk_currentPaymentId != 9}style="display:none;"{/if}>
                                        <label class="col-lg-4 control-label">{l s='Pre-paid balance' mod='globkuriermodule'}:</label>
                                        <div class="col-lg-7">
                                            <strong id="gkPrepaidBalanceValue">{if $gk_prepaidBalance}{$gk_prepaidBalance|escape:'htmlall':'UTF-8'}{else}—{/if}</strong>
                                            <p class="help-block">{l s='Top up from your GlobKurier panel.' mod='globkuriermodule'}</p>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label class="col-lg-4 control-label">{l s='SWIFT/BIC code for COD purpose' mod='globkuriermodule'}:</label>
                                        <div class="col-lg-7">
                                            <input type="text" class="form-control" name="config_defaultCodSwiftCode" value="{$config->defaultCodSwiftCode|escape:'htmlall':'UTF-8'}" placeholder="e.g. BREXPLPWXXX" style="text-transform:uppercase;" />
                                            <p class="help-block">{l s='Optional for a Polish account. Required by the bank when the account is not Polish.' mod='globkuriermodule'}</p>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label class="col-lg-4 control-label">{l s='Account number for COD purpose' mod='globkuriermodule'}:</label>
                                        <div class="col-lg-7"><input type="text" class="form-control" name="config_defaultCodAccount" value="{$config->defaultCodAccount|escape:'htmlall':'UTF-8'}" placeholder="PL00 0000 0000 0000 0000 0000 0000" /></div>
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

                                    <h4 class="text-muted" style="margin:24px 0 18px; font-size:13px; text-transform:uppercase; letter-spacing:.05em;">{l s='Customs & duties' mod='globkuriermodule'}</h4>
                                    <div class="form-group">
                                        <label class="col-lg-4 control-label">{l s='Default sender EORI number' mod='globkuriermodule'}:</label>
                                        <div class="col-lg-7">
                                            <input type="text" class="form-control" name="config_defaultEoriNumber" value="{$config->defaultEoriNumber|escape:'htmlall':'UTF-8'}" placeholder="PL0000000000000" />
                                            <p class="help-block">{l s='Pre-fills the EORI field in the customs form. Can be overridden per order.' mod='globkuriermodule'}</p>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label class="col-lg-4 control-label">{l s='UPS duty payer account (DDP)' mod='globkuriermodule'}:</label>
                                        <div class="col-lg-7">
                                            <input type="text" class="form-control" name="config_defaultDutyPayerNumber" value="{$config->defaultDutyPayerNumber|escape:'htmlall':'UTF-8'}" placeholder="{l s='Enter UPS account number' mod='globkuriermodule'}" />
                                            <p class="help-block">{l s='Pre-fills the UPS account field when DDP Outer add-on is selected.' mod='globkuriermodule'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {* ══════════════════════════════════════
                       TAB: ETYKIETY I STATUSY
                    ══════════════════════════════════════ *}
                    <div class="gk-tab-pane" id="tab-etykiety">
                        <div class="row">
                            <div class="col-lg-6">
                                <div class="form-horizontal">
                                    <h4 class="text-muted" style="margin:0 0 14px; font-size:13px; text-transform:uppercase; letter-spacing:.05em;">{l s='Label format' mod='globkuriermodule'}</h4>
                                    <div class="form-group">
                                        <div class="col-lg-offset-4 col-lg-8">
                                            <div class="radio">
                                                <label>
                                                    <input type="radio" name="config_labelFormat" value="A4" {if !$config->labelFormat || $config->labelFormat == 'A4'}checked{/if} />
                                                    <strong>A4</strong> — {l s='four labels per page' mod='globkuriermodule'}
                                                </label>
                                            </div>
                                            <div class="radio">
                                                <label>
                                                    <input type="radio" name="config_labelFormat" value="ZEBRA_PRINTER" {if $config->labelFormat == 'ZEBRA_PRINTER'}checked{/if} />
                                                    <strong>Zebra 10×15</strong> — {l s='thermal printer' mod='globkuriermodule'}
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <h4 class="text-muted" style="margin:24px 0 14px; font-size:13px; text-transform:uppercase; letter-spacing:.05em;">{l s='Automatic order statuses' mod='globkuriermodule'}</h4>
                                    <div class="form-group">
                                        <label class="col-lg-4 control-label">{l s='After shipment creation' mod='globkuriermodule'}:</label>
                                        <div class="col-lg-7">
                                            <select class="form-control" name="config_orderStatusAfterCreation">
                                                <option value="0">{l s='-- no change --' mod='globkuriermodule'}</option>
                                                {foreach from=$orderStatuses item=os}
                                                <option value="{$os.id_order_state|intval}" {if $config->orderStatusAfterCreation == $os.id_order_state}selected="selected"{/if}>{$os.name|escape:'htmlall':'UTF-8'}</option>
                                                {/foreach}
                                            </select>
                                            <p class="help-block">{l s='Status set automatically after a shipment is successfully created.' mod='globkuriermodule'}</p>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label class="col-lg-4 control-label">{l s='After delivery' mod='globkuriermodule'}:</label>
                                        <div class="col-lg-7">
                                            <select class="form-control" name="config_orderStatusAfterDelivery">
                                                <option value="0">{l s='-- no change --' mod='globkuriermodule'}</option>
                                                {foreach from=$orderStatuses item=os}
                                                <option value="{$os.id_order_state|intval}" {if $config->orderStatusAfterDelivery == $os.id_order_state}selected="selected"{/if}>{$os.name|escape:'htmlall':'UTF-8'}</option>
                                                {/foreach}
                                            </select>
                                            <p class="help-block">{l s='Status set when tracking API reports the shipment as delivered.' mod='globkuriermodule'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>{* /gk-sidebar-content-area *}
            </div>{* /gk-sidebar-main *}
        </div>{* /gk-app-layout *}

    </div>{* /panel-body *}
    <div class="panel-footer">
        <input type="hidden" name="action" value="updateConfig"/>
        <button type="submit" class="btn btn-default pull-left" id="gk-config-save-btn">
            <i class="process-icon-save"></i> {l s='Save' mod='globkuriermodule'}
        </button>
        <span class="text-muted" style="line-height:34px; margin-left:12px; font-size:12px;" id="gk-save-hint">{l s='Saves: Account, Sender, Shipment settings, Payments, Operators, Labels & statuses.' mod='globkuriermodule'}</span>
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
    var gkApiBaseUrl   = '{$gkApiBaseUrl|escape:'javascript':'UTF-8'}';
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
    var gkIsAuthenticated = {if $gkIsAuthenticated}true{else}false{/if};
</script>
