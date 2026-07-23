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
<style type="text/css">
    .track-button { display: inline; padding: 0 6px; }
    .gk-tracking-green  { font-family: monospace; font-size: 12px; color: #2d6a2d; font-weight: bold; }
    .gk-tracking-orange { font-family: monospace; font-size: 12px; color: #c87020; font-weight: bold; }
    .gk-tracking-gray   { font-family: monospace; font-size: 12px; color: #999; }
    .gk-no-tracking     { color: #bbb; }
    .gk-update-carrier-btn {
        display: inline-block; margin-top: 3px; font-size: 11px;
        padding: 1px 6px; cursor: pointer;
    }
    .gk-history-pagination { display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin:12px 0 4px; }
    .gk-history-pagination .page-btn { min-width:32px; }
    .gk-history-pagination .page-btn.active { font-weight:bold; pointer-events:none; background:#5cb85c; border-color:#4cae4c; color:#fff; }
    .gk-history-toolbar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:8px; }
    #autoSyncStatus { font-size:12px; color:#888; margin-left:8px; }
</style>

<div class="panel">
    <div class="panel-heading">
        <i class="icon-send"></i> {l s='Globkurier - order history' mod='globkuriermodule'}
        <span style="float:right; font-size:13px; font-weight:normal;">
            {l s='Total' mod='globkuriermodule'}: <strong>{$total|intval}</strong>
            <span id="autoSyncStatus"></span>
        </span>
    </div>

    <div class="gk-history-toolbar">
        <div style="display:flex; align-items:center; gap:6px;">
            <label style="margin:0;">{l s='Per page' mod='globkuriermodule'}:</label>
            {foreach from=[10,20,50,100] item=pp}
                <a href="{$historyBaseUrl|escape:'htmlall':'UTF-8'}&page=1&perPage={$pp|intval}"
                   class="btn btn-xs {if $perPage == $pp}btn-primary{else}btn-default{/if}">{$pp|intval}</a>
            {/foreach}
        </div>
        <div style="font-size:11px; color:#888; line-height:1.6;">
            <span style="color:#2d6a2d; font-weight:bold;">&#9679;</span> {l s='Synced with order' mod='globkuriermodule'} &nbsp;
            <span style="color:#c87020; font-weight:bold;">&#9679;</span> {l s='Not in order yet' mod='globkuriermodule'} &nbsp;
            <span style="color:#999;">&#9679;</span> {l s='Different in order' mod='globkuriermodule'}
        </div>
    </div>

    <div style="overflow-x:auto;">
    <table class="table table-striped">
        <thead>
            <tr>
                <th>{l s='Date' mod='globkuriermodule'}</th>
                <th>{l s='Parcel No' mod='globkuriermodule'}</th>
                <th>{l s='Order ID' mod='globkuriermodule'}</th>
                <th>{l s='Tracking code' mod='globkuriermodule'}</th>
                <th>{l s='Receiver' mod='globkuriermodule'}</th>
                <th>{l s='Carrier' mod='globkuriermodule'}</th>
                <th>{l s='Content' mod='globkuriermodule'}</th>
                <th>{l s='Weight' mod='globkuriermodule'}</th>
                <th>{l s='Payment' mod='globkuriermodule'}</th>
                <th>{l s='Label' mod='globkuriermodule'}</th>
                <th>#</th>
            </tr>
        </thead>
        <tbody>
            {foreach from=$orders item=order}
            <tr data-gk-id="{$order->gkId|escape:'htmlall':'UTF-8'}">
                <td>{$order->crateDate|escape:'htmlall':'UTF-8'}</td>
                <td>{$order->gkId|escape:'htmlall':'UTF-8'}</td>
                <td>
                    {if $order->orderId}
                        <a href="{$orderDetailsUrl|escape:'javascript':'UTF-8'}&id_order={$order->orderId|intval}" title="{l s='View order' mod='globkuriermodule'}">
                            #{$order->orderId|intval}
                        </a>
                    {else}
                        <span class="gk-no-tracking">—</span>
                    {/if}
                </td>
                <td class="tracking-cell"
                    data-gk-tracking="{$order->trackingNumber|escape:'htmlall':'UTF-8'}"
                    data-ps-tracking="{$order->psTrackingNumber|escape:'htmlall':'UTF-8'}">
                    {if $order->trackingNumber}
                        {if $order->psTrackingNumber && $order->psTrackingNumber == $order->trackingNumber}
                            {* green: GK tracking matches PS order carrier *}
                            <span class="gk-tracking-green">{$order->trackingNumber|escape:'htmlall':'UTF-8'}</span>
                        {elseif !$order->psTrackingNumber}
                            {* orange: GK tracking exists but PS order carrier is empty *}
                            <span class="gk-tracking-orange">{$order->trackingNumber|escape:'htmlall':'UTF-8'}</span>
                            {if $order->orderId}
                            <br>
                            <button class="btn btn-warning btn-xs gk-update-carrier-btn"
                                data-gk-id="{$order->gkId|escape:'htmlall':'UTF-8'}"
                                data-url="{$moduleApiUrl|escape:'htmlall':'UTF-8'}">
                                {l s='Update in order' mod='globkuriermodule'}
                            </button>
                            {/if}
                        {else}
                            {* gray: PS order carrier has a different tracking number *}
                            <span class="gk-tracking-gray">{$order->trackingNumber|escape:'htmlall':'UTF-8'}</span>
                        {/if}
                    {else}
                        <span class="gk-no-tracking">—</span>
                    {/if}
                </td>
                <td>{$order->receiver|escape:'htmlall':'UTF-8'}</td>
                <td>{$order->carrier|escape:'htmlall':'UTF-8'}</td>
                <td>{$order->content|escape:'htmlall':'UTF-8'}</td>
                <td>{$order->weight|escape:'htmlall':'UTF-8'}kg</td>
                <td>{$order->paymentName|escape:'htmlall':'UTF-8'}</td>
                <td>
                    {if $order->hash}
                        <a href="{$urlModule|escape:'javascript':'UTF-8'}?hash={$order->hash|escape:'url':'UTF-8'}" target="_blank" title="{l s='Download the bill of lading' mod='globkuriermodule'}">
                            <i class="material-icons">note</i>
                        </a>
                    {else}
                        <span class="gk-no-tracking">—</span>
                    {/if}
                </td>
                <td>
                    <form class="track-button" id="track{$order->gkId|escape:'htmlall':'UTF-8'}" action="https://www.globkurier.pl/shipment-tracking/{$order->gkId|escape:'htmlall':'UTF-8'}" target="_blank" method="get">
                        <a href onclick="$('#track{$order->gkId|escape:'htmlall':'UTF-8'}').submit(); return false;" title="{l s='Tracking shipment' mod='globkuriermodule'}">
                            <i class="icon-search"></i>
                        </a>
                    </form>
                </td>
            </tr>
            {/foreach}
        </tbody>
    </table>
    </div>

    {* Pagination *}
    {if $totalPages > 1}
    <div class="gk-history-pagination">
        {if $page > 1}
            <a href="{$historyBaseUrl|escape:'htmlall':'UTF-8'}&page={$prevPage|intval}&perPage={$perPage|intval}" class="btn btn-default btn-sm page-btn">&laquo;</a>
        {/if}

        {if $pFrom > 1}
            <a href="{$historyBaseUrl|escape:'htmlall':'UTF-8'}&page=1&perPage={$perPage|intval}" class="btn btn-default btn-sm page-btn">1</a>
            {if $pFrom > 2}<span>…</span>{/if}
        {/if}

        {for $p = $pFrom to $pTo}
            <a href="{$historyBaseUrl|escape:'htmlall':'UTF-8'}&page={$p|intval}&perPage={$perPage|intval}"
               class="btn btn-default btn-sm page-btn{if $p == $page} active{/if}">{$p|intval}</a>
        {/for}

        {if $pTo < $totalPages}
            {if $pTo < $totalPages-1}<span>…</span>{/if}
            <a href="{$historyBaseUrl|escape:'htmlall':'UTF-8'}&page={$totalPages|intval}&perPage={$perPage|intval}" class="btn btn-default btn-sm page-btn">{$totalPages|intval}</a>
        {/if}

        {if $page < $totalPages}
            <a href="{$historyBaseUrl|escape:'htmlall':'UTF-8'}&page={$nextPage|intval}&perPage={$perPage|intval}" class="btn btn-default btn-sm page-btn">&raquo;</a>
        {/if}

        <span style="color:#888; font-size:12px;">
            {l s='Page %1$d / %2$d (%3$d total)' sprintf=[$page|intval, $totalPages|intval, $total|intval] mod='globkuriermodule'}
        </span>
    </div>
    {/if}
</div>

<script type="text/javascript">
(function($){

    const moduleApiUrl   = '{$moduleApiUrl|escape:'javascript':'UTF-8'}';
    const currentPage    = {$page|intval};
    const currentPerPage = {$perPage|intval};
    const labelUpdateBtn = '{l s='Update in order' mod='globkuriermodule'}';

    const escHtml = str => $('<div>').text(str).html();

    // Build the cell HTML based on gkTracking / psTracking values
    function buildTrackingCell(gkTracking, psTracking, gkId, hasOrderId) {
        if (!gkTracking) {
            return '<span class="gk-no-tracking">—</span>';
        }
        if (psTracking && psTracking === gkTracking) {
            return '<span class="gk-tracking-green">' + escHtml(gkTracking) + '</span>';
        }
        if (!psTracking) {
            const btn = hasOrderId
                ? '<br><button class="btn btn-warning btn-xs gk-update-carrier-btn"'
                    + ' data-gk-id="' + escHtml(gkId) + '"'
                    + ' data-url="' + escHtml(moduleApiUrl) + '">'
                    + labelUpdateBtn + '</button>'
                : '';
            return '<span class="gk-tracking-orange">' + escHtml(gkTracking) + '</span>' + btn;
        }
        // different tracking in PS order
        return '<span class="gk-tracking-gray">' + escHtml(gkTracking) + '</span>';
    }

    // Auto-sync missing tracking codes after page load
    function autoSync() {
        const url = moduleApiUrl + '&ajax=1&action=autoSyncTracking'
            + '&page=' + currentPage + '&perPage=' + currentPerPage;

        $('#autoSyncStatus').text('↻ syncing...');

        $.getJSON(url, function(resp) {
            if (resp && resp.success && resp.trackings) {
                let count = 0;
                $.each(resp.trackings, function(gkId, data) {
                    const $row = $('tr[data-gk-id="' + gkId + '"]');
                    if (!$row.length) return;
                    const $cell = $row.find('.tracking-cell');
                    const hasOrderId = !!$row.find('a[href*="id_order"]').length;
                    $cell.attr('data-gk-tracking', data.gkTracking || '');
                    $cell.html(buildTrackingCell(data.gkTracking, data.psTracking, gkId, hasOrderId));
                    count++;
                });
                $('#autoSyncStatus').text(count ? '(' + count + ' updated)' : '').fadeOut(3000);
            } else {
                $('#autoSyncStatus').text('');
            }
        }).fail(function() {
            $('#autoSyncStatus').text('');
        });
    }

    // Per-row "Update in order" button
    $(document).on('click', '.gk-update-carrier-btn', function() {
        const $btn = $(this);
        const gkId = $btn.data('gk-id');
        const $cell = $btn.closest('.tracking-cell');
        const url = $btn.data('url') + '&ajax=1&action=updateCarrierTracking&gkId=' + encodeURIComponent(gkId);

        $btn.prop('disabled', true).text('...');

        $.getJSON(url, function(resp) {
            if (resp && resp.success) {
                const gkTracking = $cell.data('gk-tracking');
                $cell.attr('data-ps-tracking', gkTracking);
                $cell.html('<span class="gk-tracking-green">' + escHtml(gkTracking) + '</span>');
            } else {
                $btn.prop('disabled', false).text(labelUpdateBtn);
                alert(resp && resp.error ? resp.error : 'Error updating order');
            }
        }).fail(function() {
            $btn.prop('disabled', false).text(labelUpdateBtn);
        });
    });

    // Trigger auto-sync on page load
    autoSync();

})(jQuery);
</script>
