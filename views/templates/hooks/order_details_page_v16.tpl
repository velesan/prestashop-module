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

<div id="new-glob-parcel">
    <a href="{$newParcelPageLink|escape:'javascript':'UTF-8'}" class="btn btn-success btn-gk-success">
        <i class="icon-truck"></i> {l s='SHIP WITH GLOBKURIER' mod='globkuriermodule'}
    </a>
</div>

<div id="new-glob-invoice-parcel">
    <a href="{$newParcelPageLink|escape:'javascript':'UTF-8'}&invoice_address=1" class="btn btn-success btn-gk-success">
        <i class="icon-truck"></i> {l s='SHIP WITH GLOBKURIER' mod='globkuriermodule'} INVOCIE
    </a>
</div>

<div id="new-glob-invoice-parcel">
    <a href="{$newParcelPageLink|escape:'javascript':'UTF-8'}&action=addNewGlobOrder" class="btn btn-success btn-gk-success">
        <i class="icon-truck"></i> {l s='SHIP WITH GLOBKURIER' mod='globkuriermodule'} ADD
    </a>
</div>

{if count($orders) > 0}
<div class="panel">

    <div class="panel-heading">
        <i class="icon-truck"></i> {l s='Parcel send with Globkurier' mod='globkuriermodule'}
        <span class="badge">2</span>
    </div>

    <div class="panel-body">

       <div class="table-responsive">
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
                        <td>{$order->payment|escape:'htmlall':'UTF-8'}</td>
                        <td>
                            <a href="/module/globkuriermodule/getLabel?hash={$order->hash|escape:'url':'UTF-8'}" class="" target="_blank" title="Pobierz list przewozowy">
                              <i class="icon-file-text"></i>
                            </a>
                            <form class="track-button" id="track{$order->gkId|escape:'htmlall':'UTF-8'}" action="https://www.globkurier.pl/shipment-tracking/{$order->gkId|escape:'htmlall':'UTF-8'}" target="_blank" method="get">
{*                                <input type="hidden" name="nr" value="{$order->gkId|escape:'htmlall':'UTF-8'}">*}
                                <a href onclick="$('#track{$order->gkId|escape:'htmlall':'UTF-8'}').submit(); return false;" title="Śledź przesyłkę">
                                  <i class="icon-search"></i>
                                </a>
                            </form>
                        </td>
                    </tr>
                     {/foreach}
                </tbody>
            </table>
        </div>
    </div>
</div>
{/if}

{literal}
<script type="text/javascript">
    $(function(){
        var buttonShippingContainer = $('#new-glob-parcel');
        $('#addressShipping .well').append(buttonShippingContainer.contents());

        var buttonInvoiceContainer = $('#new-glob-invoice-parcel');
        $('#addressInvoice .well').append(buttonInvoiceContainer.contents());
    });
</script>
{/literal}
