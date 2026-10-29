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
    .track-button {
        display: inline;
        padding: 0px 10px;
    }
</style>

{assign var='orderCount' value=$orders|count}

<div class="card">
    <div class="card-header">
        <div class="row">
            <div class="col-md-6">
                <h3 class="card-header-title">
                    <i class="icon-truck"></i> {l s='Parcel send with Globkurier' mod='globkuriermodule'}
                    <span class="badge">({$orderCount|intval})</span>
                </h3>
            </div>
        </div>
    </div>
    <div class="card-body">
        <div class="table-responsive">
            <a name="nadajGK"></a>
            {if count($orders) > 0}
            <table class="table" id="orderForShipment">
                <thead>
                <tr>
                    <th>
                        <span class="title_box">{l s='GK No' mod='globkuriermodule'}</span>
                    </th>
                    <th>
                        <span class="title_box">{l s='Ship date' mod='globkuriermodule'}</span>
                    </th>
                    <th>
                        <span class="title_box">{l s='Receiver' mod='globkuriermodule'}</span>
                    </th>
                    <th>
                        <span class="title_box">{l s='Content' mod='globkuriermodule'}</span>
                    </th>
                    <th>
                        <span class="title_box">{l s='Weight' mod='globkuriermodule'}</span>
                    </th>
                    <th>
                        <span class="title_box">{l s='Carrier' mod='globkuriermodule'}</span>
                    </th>
                    <th>
                        <span class="title_box">{l s='Notes' mod='globkuriermodule'}</span>
                    </th>
                    <th>
                        <span class="title_box">{l s='COD' mod='globkuriermodule'}</span>
                    </th>
                    <th>
                        <span class="title_box">{l s='Payment' mod='globkuriermodule'}</span>
                    </th>
                    <th>
                        <span class="title_box">{l s='Option' mod='globkuriermodule'}</span>
                    </th>
                </tr>
                </thead>
                <tbody>
                {foreach from=$orders item=order}
                    <tr class="order-line-row">
                        <td>{$order->gkId|escape:'htmlall':'UTF-8'}</td>
                        <td>{$order->crateDate|escape:'htmlall':'UTF-8'}</td>
                        <td>{$order->receiver|escape:'htmlall':'UTF-8'}</td>
                        <td>{$order->content|escape:'htmlall':'UTF-8'}</td>
                        <td>{$order->weight|escape:'htmlall':'UTF-8'}</td>
                        <td>{$order->carrier|escape:'htmlall':'UTF-8'}</td>
                        <td>{$order->comments|escape:'htmlall':'UTF-8'}</td>
                        <td>{if $order->cod}{$order->cod|escape:'htmlall':'UTF-8'}zł{else} - {/if}</td>
                        <td>{$order->payment_name|escape:'htmlall':'UTF-8'}</td>
                        <td>
                            <a id="gk_{$order->gkId|escape:'htmlall':'UTF-8'}" href="/module/globkuriermodule/getLabel?hash={$order->hash|escape:'url':'UTF-8'}" data-pdf="{$order->pdf|escape:'htmlall':'UTF-8'}" onclick="return getLabel($(this));" data-id="{$order->gkId|escape:'htmlall':'UTF-8'}" data-hash="{$order->hash|escape:'url':'UTF-8'}" class="getLabel" target="_blank" title="{l s='Download label' mod='globkuriermodule'}">
                                <i class="material-icons">note</i>
                            </a>
                            {if $order->hash && $order->hasCustoms}
                                <button type="button" class="btn btn-default btn-outline-secondary btn-sm gk-trade-docs-toggle"
                                    data-hash="{$order->hash|escape:'htmlall':'UTF-8'}"
                                    data-url="{$moduleApiUrl|escape:'htmlall':'UTF-8'}"
                                    title="{l s='Customs documents' mod='globkuriermodule'}">
                                    {l s='Documents' mod='globkuriermodule'}
                                </button>
                            {/if}
                            <form class="track-button" id="track{$order->gkId|escape:'htmlall':'UTF-8'}" action="https://www.globkurier.pl/shipment-tracking/{$order->gkId|escape:'htmlall':'UTF-8'}" target="_blank" method="get">
                                <a href onclick="$('#track{$order->gkId|escape:'htmlall':'UTF-8'}').submit(); return false;" title="{l s='Track shipment' mod='globkuriermodule'}">
                                    <i class="material-icons">local_shipping</i>
                                </a>
                            </form>
                            <div class="alert-box alert_{$order->gkId|escape:'htmlall':'UTF-8'}" style="display: none;">
                                <div class="header"></div>
                                <div class="body">
                                    <div class="alert alert-danger"></div>
                                </div>
                                <div class="foot"><button type="button" class="btn btn-primary pull-right closeAlert">Zamknij</button> </div>
                            </div>
                        </td>
                    </tr>
                {/foreach}
                </tbody>
            </table>
            {else}
            <p class="mb-0 mt-1 text-center text-muted">
                <small>
                    {l s='No shipments found' mod='globkuriermodule'}
                </small>
            </p>
            {/if}
        </div>
    </div>
    <div class="card-body">
        <div class="row" style="padding: 15px;">
            <div id="new-glob-parcel col-lg-3" style="padding: 0 10px;">
                <a href="{$newParcelPageLink|escape:'javascript':'UTF-8'}" class="btn btn-success btn-gk-success pull-right">
                    <i class="icon-truck"></i> {l s='Send a package' mod='globkuriermodule'}
                </a>
            </div>
        </div>
    </div>
</div>

{include file=$gkTradeDocsI18nTpl}

{literal}
    <script type="text/javascript">
        $(function(){
            const buttonShippingContainer = $('#new-glob-parcel');
            $('#addressShipping .well').append(buttonShippingContainer.contents());

            const buttonInvoiceContainer = $('#new-glob-invoice-parcel');
            $('#addressInvoice .well').append(buttonInvoiceContainer.contents());
        });

        $(document).ready(function () {
            $(document).on('click', '.closeAlert', function() {
                $(this).closest('.alert-box').hide();
            });
        });

        function getLabel(iurl)
        {
            const url = iurl.attr('href');
            const id = iurl.attr('data-id');
            const pdf = iurl.attr('data-pdf');
            const domId = iurl.attr('id');

            if (pdf == 0) {
                console.log('pdf=0');
                $.ajax({
                    url: url+'&ajax=1',
                    dataType: 'json',
                    success: function (ret) {
                        if (ret.status === false) {
                            $('.alert-box.alert_' + id + ' .body .alert').empty().append(ret.errors);
                            $('.alert-box.alert_' + id).show();
                        } else {
                            iurl.attr('data-pdf', 1);
                            $('#'+domId).click();
                            return true;
                        }
                    }
                });
                return false;
            } else {
                return true;
            }
        }

    </script>
{/literal}
