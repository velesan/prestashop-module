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

(function() {
	'use strict';

	function buildServiceCard(product) {
		var logo = product.carrierLogoLink ? '<img src="' + product.carrierLogoLink + '" alt="' + (product.carrierName || '') + '" />' : '';
		var price = (product.netPrice != null) ? (product.netPrice + ' zł netto') : '';
		return (
			'<div class="col-lg-4 glob-product-block">' +
				logo + '<br/>' +
				'<strong>' + (product.carrierName || '') + '</strong><br/>' +
				'<span>' + (product.name || '') + '</span><br/><br/>' +
				'<strong>' + price + '</strong><br/><br/>' +
				'<button class="btn btn-sm btn-success pick-service" ' +
				'	data-id="' + product.id + '" ' +
				'	data-name="' + (product.carrierName || '') + '">Wybierz</button>' +
			'</div>'
		);
	}

	function fetchServices() {
		var params = {
			length: $('input[name=config_defaultDepth]').val(),
			width: $('input[name=config_defaultWidth]').val(),
			height: $('input[name=config_defaultHeight]').val(),
			weight: $('input[name=config_defaultWeight]').val(),
			quantity: 1,
			senderCountryId: 1,
			receiverCountryId: 1
		};
		var headers = {};
		if (typeof window.tokenAPI !== 'undefined' && window.tokenAPI) {
			headers['x-auth-token'] = window.tokenAPI;
		}
		var url = 'https://api.globkurier.pl/v1/products?' + new URLSearchParams(params).toString();
		return fetch(url, { headers: headers })
			.then(function(r) { return r.json(); })
			.then(function(data) {
				var list = [];
				if (data && Array.isArray(data.standard)) {
					list = data.standard;
				}
				var html = list.map(buildServiceCard).join('');
				$('#servicesList').html(html || '<div class="col-lg-12 text-center">Brak usług</div>');
				$('#servicesModal').modal('show');
			});
	}

	function bindEvents() {
		$(document).on('click', '#openServicesModal', function() {
			fetchServices().catch(function() {
				$('#servicesList').html('<div class="col-lg-12 text-center">Błąd podczas pobierania usług</div>');
				$('#servicesModal').modal('show');
			});
		});

		$(document).on('click', '.pick-service', function() {
			var id = $(this).data('id');
			var name = $(this).data('name');
			$('input[name=config_defaultServiceCode]').val(id);
			$('input[name=config_defaultServiceName]').val(name);
			$('#selectedServiceName').text(name || '');
			$('#servicesModal').modal('hide');
		});

		$(document).on('click', '#updateCacheBtn', function() {
			var $btn = $(this);
			var url = $btn.data('url');
			$btn.prop('disabled', true);
			$('#cacheLoading').show();
			fetch(url)
				.finally(function() {
					$btn.prop('disabled', false);
					$('#cacheLoading').hide();
				});
		});
	}

	$(bindEvents);
})();

/* ─────────────────────────────────────────
   TAB SYSTEM — PS 1.7 / 8 / 9 compatible
───────────────────────────────────────── */
(function () {
	'use strict';

	var STORAGE_KEY = 'gk_config_tab';

	function activateTab(tabId) {
		$('.gk-tab-item').removeClass('gk-tab-active');
		$('.gk-tab-item[data-tab="' + tabId + '"]').addClass('gk-tab-active');
		$('.gk-tab-pane').removeClass('gk-active');
		$('#' + tabId).addClass('gk-active');
		try { sessionStorage.setItem(STORAGE_KEY, tabId); } catch(e) {}
	}

	function initTabs() {
		$('.gk-tab-item').on('click', function () {
			activateTab($(this).data('tab'));
		});

		var saved = null;
		try { saved = sessionStorage.getItem(STORAGE_KEY); } catch(e) {}
		var hash = window.location.hash ? window.location.hash.replace('#', '') : null;
		var target = hash || saved;
		if (target && $('#' + target).length) {
			activateTab(target);
		}
	}

	$(initTabs);
})();

/* ─────────────────────────────────────────
   TEMPLATE CRUD
───────────────────────────────────────── */
(function () {
	'use strict';

	var GkTmpl = {
		ajaxUrl: null,
		templates: [],
		currentId: null,   // null = new, number = existing

		init: function () {
			if (typeof window.gkConfigAjaxUrl === 'undefined') { return; }
			GkTmpl.ajaxUrl = window.gkConfigAjaxUrl;
			GkTmpl.templates = (typeof window.gkTemplatesData !== 'undefined' && window.gkTemplatesData) ? window.gkTemplatesData : [];
			GkTmpl.renderList();
			GkTmpl.bindEvents();
		},

		/* ── LIST ── */
		renderList: function () {
			var $list = $('#gk-tmpl-list');
			var $empty = $('#gk-tmpl-empty');
			$list.find('.gk-tmpl-list-item').remove();

			if (!GkTmpl.templates.length) {
				$empty.show();
				$('#gk-tmpl-count-label').text('0 szablonów');
				return;
			}
			$empty.hide();

			var count = GkTmpl.templates.length;
			$('#gk-tmpl-count-label').text(count + (count === 1 ? ' szablon' : count < 5 ? ' szablony' : ' szablonów'));

			for (var i = 0; i < GkTmpl.templates.length; i++) {
				var t = GkTmpl.templates[i];
				var star = t.is_default ? '<span class="gk-tmpl-star">★</span> ' : '';
				var synced = t.gk_template_id ? '<span class="gk-tmpl-synced" title="Zsynchronizowany z GlobKurier"></span>' : '';
				var meta = [];
				if (t.length && t.width && t.height) {
					meta.push(t.length + '×' + t.width + '×' + t.height + ' cm');
				}
				if (t.weight) { meta.push(t.weight + ' kg'); }
				var $item = $('<div class="gk-tmpl-list-item" data-id="' + t.id_template + '">' +
					'<div class="gk-tmpl-name">' + star + GkTmpl.esc(t.name) + synced + '</div>' +
					(meta.length ? '<div class="gk-tmpl-meta">' + meta.join(' / ') + '</div>' : '') +
					'</div>');
				if (t.id_template === GkTmpl.currentId) {
					$item.addClass('gk-active');
				}
				$list.append($item);
			}
		},

		/* ── EDITOR: open existing ── */
		openTemplate: function (id) {
			var t = null;
			for (var i = 0; i < GkTmpl.templates.length; i++) {
				if (GkTmpl.templates[i].id_template === id) { t = GkTmpl.templates[i]; break; }
			}
			if (!t) { return; }
			GkTmpl.currentId = id;

			$('#gk-tmpl-placeholder').hide();
			$('#gk-tmpl-form-wrap').css('display', 'flex');
			$('#gk-tmpl-editor-title').text(t.name);
			$('#gk-tmpl-delete-btn').show();
			$('#gk-tmpl-star-btn').prop('disabled', !!t.is_default);

			$('#gk-f-id').val(t.id_template);
			$('#gk-f-name').val(t.name || '');
			$('#gk-f-carrier').val(t.ps_carrier_id || '');
			$('#gk-f-length').val(t.length || '');
			$('#gk-f-width').val(t.width || '');
			$('#gk-f-height').val(t.height || '');
			$('#gk-f-weight').val(t.weight || '');
			$('#gk-f-quantity').val(t.quantity || 1);
			$('#gk-f-contents').val(t.contents || '');
			$('#gk-f-payment').val(t.payment_type || '');
			$('#gk-f-default').prop('checked', !!t.is_default);

			if (t.gk_sync_at) {
				$('#gk-f-sync-info').show();
				$('#gk-f-sync-date').text(t.gk_sync_at);
			} else {
				$('#gk-f-sync-info').hide();
			}

			$('.gk-tmpl-list-item').removeClass('gk-active');
			$('.gk-tmpl-list-item[data-id="' + id + '"]').addClass('gk-active');
		},

		/* ── EDITOR: new ── */
		openNew: function () {
			GkTmpl.currentId = null;
			$('#gk-tmpl-placeholder').hide();
			$('#gk-tmpl-form-wrap').css('display', 'flex');
			$('#gk-tmpl-editor-title').text('Nowy szablon');
			$('#gk-tmpl-delete-btn').hide();
			$('#gk-tmpl-star-btn').prop('disabled', false);

			$('#gk-f-id').val('');
			$('#gk-f-name').val('');
			$('#gk-f-carrier').val('');
			$('#gk-f-length').val('');
			$('#gk-f-width').val('');
			$('#gk-f-height').val('');
			$('#gk-f-weight').val('');
			$('#gk-f-quantity').val(1);
			$('#gk-f-contents').val('');
			$('#gk-f-payment').val('');
			$('#gk-f-default').prop('checked', false);
			$('#gk-f-sync-info').hide();

			$('.gk-tmpl-list-item').removeClass('gk-active');
		},

		/* ── AJAX: save ── */
		saveTemplate: function () {
			var name = $.trim($('#gk-f-name').val());
			if (!name) {
				alert('Podaj nazwę szablonu.');
				$('#gk-f-name').focus();
				return;
			}
			var $btn = $('#gk-tmpl-save-btn');
			$btn.prop('disabled', true).text('Zapisuję…');

			var payload = {
				id_template:  $('#gk-f-id').val() || '',
				name:         name,
				ps_carrier_id: $('#gk-f-carrier').val() || '',
				length:       $('#gk-f-length').val() || '',
				width:        $('#gk-f-width').val() || '',
				height:       $('#gk-f-height').val() || '',
				weight:       $('#gk-f-weight').val() || '',
				quantity:     $('#gk-f-quantity').val() || 1,
				contents:     $('#gk-f-contents').val() || '',
				payment_type: $('#gk-f-payment').val() || '',
				is_default:   $('#gk-f-default').is(':checked') ? 1 : 0
			};

			$.post(GkTmpl.ajaxUrl + '&ajax_action=saveTemplate', payload)
				.done(function (res) {
					if (res && res.success) {
						GkTmpl.reloadFromServer();
					} else {
						alert('Błąd zapisu: ' + (res && res.error ? res.error : 'Nieznany błąd'));
					}
				})
				.fail(function () { alert('Błąd połączenia z serwerem.'); })
				.always(function () { $btn.prop('disabled', false).text('Zapisz'); });
		},

		/* ── AJAX: delete ── */
		deleteTemplate: function () {
			if (!GkTmpl.currentId) { return; }
			if (!confirm('Usunąć ten szablon? Operacji nie można cofnąć.')) { return; }

			$.post(GkTmpl.ajaxUrl + '&ajax_action=deleteTemplate', { id_template: GkTmpl.currentId })
				.done(function (res) {
					if (res && res.success) {
						GkTmpl.currentId = null;
						$('#gk-tmpl-form-wrap').hide();
						$('#gk-tmpl-placeholder').show();
						GkTmpl.reloadFromServer();
					} else {
						alert('Błąd usuwania: ' + (res && res.error ? res.error : 'Nieznany błąd'));
					}
				})
				.fail(function () { alert('Błąd połączenia z serwerem.'); });
		},

		/* ── AJAX: set default ── */
		setDefault: function () {
			if (!GkTmpl.currentId) { return; }
			$.post(GkTmpl.ajaxUrl + '&ajax_action=setDefaultTemplate', { id_template: GkTmpl.currentId })
				.done(function (res) {
					if (res && res.success) {
						GkTmpl.reloadFromServer();
					} else {
						alert('Błąd: ' + (res && res.error ? res.error : 'Nieznany błąd'));
					}
				})
				.fail(function () { alert('Błąd połączenia z serwerem.'); });
		},

		/* ── AJAX: sync from GK ── */
		syncFromGK: function () {
			var $btn = $('#gk-tmpl-sync-btn');
			$btn.prop('disabled', true).html('<i class="icon-refresh icon-spin"></i> Importuję…');

			$.post(GkTmpl.ajaxUrl + '&ajax_action=syncTemplates', {})
				.done(function (res) {
					if (res && res.success) {
						var msg = 'Synchronizacja zakończona.';
						if (typeof res.created !== 'undefined' || typeof res.updated !== 'undefined') {
							msg += ' Dodano: ' + (res.created || 0) + ', zaktualizowano: ' + (res.updated || 0) + '.';
						}
						alert(msg);
						GkTmpl.reloadFromServer();
					} else {
						alert('Błąd synchronizacji: ' + (res && res.error ? res.error : 'Nieznany błąd'));
					}
				})
				.fail(function () { alert('Błąd połączenia z serwerem.'); })
				.always(function () {
					$btn.prop('disabled', false).html('<i class="icon-refresh"></i> Importuj z GlobKurier');
				});
		},

		/* ── reload list from server via AJAX ── */
		reloadFromServer: function () {
			var prevId = GkTmpl.currentId;
			$.get(GkTmpl.ajaxUrl + '&ajax_action=getTemplates')
				.done(function (res) {
					if (res && Array.isArray(res.templates)) {
						GkTmpl.templates = res.templates;
						GkTmpl.renderList();
						if (prevId) {
							var found = false;
							for (var i = 0; i < GkTmpl.templates.length; i++) {
								if (GkTmpl.templates[i].id_template === prevId) { found = true; break; }
							}
							if (found) {
								GkTmpl.openTemplate(prevId);
							} else {
								GkTmpl.currentId = null;
								$('#gk-tmpl-form-wrap').hide();
								$('#gk-tmpl-placeholder').show();
							}
						}
					}
				});
		},

		esc: function (str) {
			return $('<div>').text(str || '').html();
		},

		/* ── bind all template events ── */
		bindEvents: function () {
			$('#gk-tmpl-new-btn').on('click', function () { GkTmpl.openNew(); });
			$('#gk-tmpl-cancel-btn').on('click', function () {
				GkTmpl.currentId = null;
				$('#gk-tmpl-form-wrap').hide();
				$('#gk-tmpl-placeholder').show();
				$('.gk-tmpl-list-item').removeClass('gk-active');
			});
			$('#gk-tmpl-save-btn').on('click', function () { GkTmpl.saveTemplate(); });
			$('#gk-tmpl-delete-btn').on('click', function () { GkTmpl.deleteTemplate(); });
			$('#gk-tmpl-star-btn').on('click', function () { GkTmpl.setDefault(); });
			$('#gk-tmpl-sync-btn').on('click', function () { GkTmpl.syncFromGK(); });

			$(document).on('click', '.gk-tmpl-list-item', function () {
				var id = parseInt($(this).data('id'), 10);
				GkTmpl.openTemplate(id);
			});
		}
	};

	$(function () { GkTmpl.init(); });
})();
