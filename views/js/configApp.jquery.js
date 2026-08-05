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
		_productTimer: null,

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
			$('#gk-f-sender-country').val(t.sender_country || 'PL');
			$('#gk-f-recipient-country').val(t.recipient_country || 'PL');
			$('#gk-f-product-id').val(t.gk_product_id || '');
			$('#gk-f-addons').val(t.gk_addons || '');
			$('#gk-f-product-select').html('<option value="">Ładowanie…</option>');
			$('#gk-f-addons-wrap').hide();
			$('#gk-f-contents-select').html('<option value="">-- wybierz zawartość --</option>');
			GkTmpl.fetchProducts();

			var syncAt = (t.gk_sync_at && t.gk_sync_at !== '0000-00-00 00:00:00') ? t.gk_sync_at : null;
			if (syncAt) {
				$('#gk-f-sync-info').show();
				$('#gk-f-sync-date').text(syncAt);
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
			$('#gk-f-contents').val('').hide();
			$('#gk-f-payment').val('');
			$('#gk-f-default').prop('checked', false);
			$('#gk-f-sync-info').hide();
			$('#gk-f-sender-country').val('PL');
			$('#gk-f-recipient-country').val('PL');
			$('#gk-f-product-id').val('');
			$('#gk-f-addons').val('');
			$('#gk-f-product-select').html('<option value="">-- podaj wymiary i kraj --</option>');
			$('#gk-f-addons-wrap').hide();
			$('#gk-f-addons-list').empty();
			$('#gk-f-contents-select').html('<option value="">-- wybierz najpierw usługę --</option>');

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
			GkTmpl.collectAddons();
			var $btn = $('#gk-tmpl-save-btn');
			$btn.prop('disabled', true).text('Zapisuję…');

			var contentsVal = $('#gk-f-contents-select').val();
			if (contentsVal === '__custom__' || !contentsVal) {
				contentsVal = $('#gk-f-contents').val() || '';
			}

			var payload = {
				id_template:       $('#gk-f-id').val() || '',
				name:              name,
				ps_carrier_id:     $('#gk-f-carrier').val() || '',
				length:            $('#gk-f-length').val() || '',
				width:             $('#gk-f-width').val() || '',
				height:            $('#gk-f-height').val() || '',
				weight:            $('#gk-f-weight').val() || '',
				quantity:          $('#gk-f-quantity').val() || 1,
				contents:          contentsVal,
				payment_type:      $('#gk-f-payment').val() || '',
				is_default:        $('#gk-f-default').is(':checked') ? 1 : 0,
				sender_country:    $('#gk-f-sender-country').val() || 'PL',
				recipient_country: $('#gk-f-recipient-country').val() || 'PL',
				gk_product_id:     $('#gk-f-product-select').val() || '',
				gk_addons:         $('#gk-f-addons').val() || ''
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
						if (typeof res.created !== 'undefined' || typeof res.skipped !== 'undefined') {
							msg += ' Dodano: ' + (res.created || 0) + ', pominięto istniejące: ' + (res.skipped || 0) + '.';
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

		/* ── fetch products from GK API ── */
		fetchProducts: function () {
			var len    = $('#gk-f-length').val();
			var width  = $('#gk-f-width').val();
			var height = $('#gk-f-height').val();
			var weight = $('#gk-f-weight').val();
			var sc     = $('#gk-f-sender-country').val() || 'PL';
			var rc     = $('#gk-f-recipient-country').val() || 'PL';
			var $sel   = $('#gk-f-product-select');

			if (!len || !width || !height || !weight) {
				$sel.html('<option value="">-- podaj wymiary i kraj --</option>');
				$('#gk-f-product-spinner').hide();
				$('#gk-f-addons-wrap').hide();
				return;
			}

			$sel.html('<option value="">-- pobieranie usług --</option>').prop('disabled', true);
			$('#gk-f-product-spinner').show();

			$.post(GkTmpl.ajaxUrl + '&ajax_action=getProducts', {
				length: len, width: width, height: height, weight: weight,
				sender_country: sc, recipient_country: rc
			}).done(function (res) {
				$('#gk-f-product-spinner').hide();
				$sel.prop('disabled', false);
				var services = (res && res.success && Array.isArray(res.services)) ? res.services : [];
				if (!services.length) {
					$sel.html('<option value="">Brak dostępnych usług</option>');
					$('#gk-f-addons-wrap').hide();
					return;
				}
				var html = '<option value="">-- wybierz usługę --</option>';
				for (var i = 0; i < services.length; i++) {
					var s = services[i];
					var label = (s.carrierName ? s.carrierName + ' – ' : '') + (s.name || 'Usługa ' + s.id);
					if (s.price) { label += ' (' + s.price + ')'; }
					html += '<option value="' + s.id + '">' + GkTmpl.esc(label) + '</option>';
				}
				$sel.html(html);
				var savedId = $('#gk-f-product-id').val();
				if (savedId) { $sel.val(savedId); }
				GkTmpl.fetchAddons();
				GkTmpl.fetchContentList();
			}).fail(function () {
				$('#gk-f-product-spinner').hide();
				$sel.prop('disabled', false).html('<option value="">Błąd pobierania usług</option>');
			});
		},

		/* ── fetch addons for selected product ── */
		fetchAddons: function () {
			var productId = $('#gk-f-product-select').val();
			if (!productId) {
				$('#gk-f-addons-wrap').hide();
				$('#gk-f-addons-list').empty();
				return;
			}
			var sc = $('#gk-f-sender-country').val() || 'PL';
			var rc = $('#gk-f-recipient-country').val() || 'PL';

			$('#gk-f-addons-list').html('<p class="text-muted gk-tmpl-loading"><i class="icon-refresh icon-spin"></i> Pobieranie dodatków…</p>');
			$('#gk-f-addons-wrap').show();

			$.post(GkTmpl.ajaxUrl + '&ajax_action=getAddons', {
				product_id:       productId,
				sender_country:   sc,
				recipient_country: rc,
				length:           $('#gk-f-length').val() || 1,
				width:            $('#gk-f-width').val()  || 1,
				height:           $('#gk-f-height').val() || 1,
				weight:           $('#gk-f-weight').val() || 1,
				quantity:         $('#gk-f-quantity').val() || 1
			}).done(function (res) {
				var addons = (res && res.success && Array.isArray(res.addons)) ? res.addons : [];
				var $list  = $('#gk-f-addons-list');
				if (!addons.length) {
					$list.empty();
					$('#gk-f-addons-wrap').hide();
					return;
				}
				var savedAddons = [];
				try { savedAddons = JSON.parse($('#gk-f-addons').val() || '[]'); } catch (e) {}
				var html = '<div class="row">';
				for (var i = 0; i < addons.length; i++) {
					var a = addons[i];
					var checked = (savedAddons.indexOf(a.id) !== -1 || savedAddons.indexOf(String(a.id)) !== -1) ? ' checked' : '';
					html += '<div class="col-xs-6"><div class="checkbox"><label>' +
						'<input type="checkbox" class="gk-tmpl-addon" value="' + a.id + '"' + checked + '> ' +
						GkTmpl.esc(a.name || 'Dodatek ' + a.id) +
						'</label></div></div>';
				}
				html += '</div>';
				$list.html(html);
				$('#gk-f-addons-wrap').show();
			}).fail(function () {
				$('#gk-f-addons-wrap').hide();
			});
		},

		/* ── fetch content list for selected product ── */
		fetchContentList: function () {
			var productId = $('#gk-f-product-select').val();
			var $sel      = $('#gk-f-contents-select');
			if (!productId) {
				$sel.html('<option value="">-- wybierz najpierw usługę --</option>');
				$('#gk-f-contents').hide().val('');
				return;
			}
			var sc = $('#gk-f-sender-country').val() || 'PL';
			var rc = $('#gk-f-recipient-country').val() || 'PL';

			$sel.html('<option value="">-- pobieranie zawartości --</option>').prop('disabled', true);

			$.post(GkTmpl.ajaxUrl + '&ajax_action=getContentList', {
				product_id: productId, sender_country: sc, recipient_country: rc
			}).done(function (res) {
				$sel.prop('disabled', false);
				var contents    = (res && res.success && Array.isArray(res.contents)) ? res.contents : [];
				var allowOther  = !!(res && res.allowOtherContent);
				var currentVal  = $('#gk-f-contents').val() || '';
				var html        = '<option value="">-- wybierz zawartość --</option>';
				for (var i = 0; i < contents.length; i++) {
					html += '<option value="' + GkTmpl.esc(contents[i]) + '">' + GkTmpl.esc(contents[i]) + '</option>';
				}
				if (allowOther) {
					html += '<option value="__custom__">Wpisz własną…</option>';
				}
				$sel.html(html);
				if (currentVal) {
					$sel.val(currentVal);
					if ($sel.val() !== currentVal) {
						if (allowOther) {
							$sel.val('__custom__');
							$('#gk-f-contents').show();
						} else {
							$sel.val('');
							$('#gk-f-contents').hide();
						}
					} else {
						$('#gk-f-contents').hide();
					}
				}
			}).fail(function () {
				$sel.prop('disabled', false).html('<option value="">Błąd pobierania zawartości</option>');
			});
		},

		/* ── contents select change ── */
		onContentsSelect: function () {
			var val = $('#gk-f-contents-select').val();
			if (val === '__custom__') {
				$('#gk-f-contents').show().focus();
			} else {
				$('#gk-f-contents').hide().val(val);
			}
		},

		/* ── collect checked addons to hidden field ── */
		collectAddons: function () {
			var ids = [];
			$('#gk-f-addons-list .gk-tmpl-addon:checked').each(function () {
				ids.push(parseInt($(this).val(), 10));
			});
			$('#gk-f-addons').val(JSON.stringify(ids));
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

			var dimFields = '#gk-f-length, #gk-f-width, #gk-f-height, #gk-f-weight, #gk-f-sender-country, #gk-f-recipient-country';
			$(document).on('input change', dimFields, function () {
				clearTimeout(GkTmpl._productTimer);
				GkTmpl._productTimer = setTimeout(function () { GkTmpl.fetchProducts(); }, 600);
			});

			$(document).on('change', '#gk-f-product-select', function () {
				$('#gk-f-product-id').val($(this).val());
				GkTmpl.fetchAddons();
				GkTmpl.fetchContentList();
			});

			$(document).on('change', '#gk-f-contents-select', function () {
				GkTmpl.onContentsSelect();
			});

			$(document).on('change', '#gk-f-addons-list', function () {
				GkTmpl.collectAddons();
			});

			$(document).on('click', '.gk-tmpl-list-item', function () {
				var id = parseInt($(this).data('id'), 10);
				GkTmpl.openTemplate(id);
			});
		}
	};

	$(function () { GkTmpl.init(); });
})();
