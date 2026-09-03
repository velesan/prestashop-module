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
		const logo = product.carrierLogoLink ? '<img src="' + product.carrierLogoLink + '" alt="' + (product.carrierName || '') + '" />' : '';
		const price = (product.netPrice != null) ? (product.netPrice + ' zł netto') : '';
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
		const params = {
			length: $('input[name=config_defaultDepth]').val(),
			width: $('input[name=config_defaultWidth]').val(),
			height: $('input[name=config_defaultHeight]').val(),
			weight: $('input[name=config_defaultWeight]').val(),
			quantity: 1,
			senderCountryId: 1,
			receiverCountryId: 1
		};
		const headers = {};
		if (typeof window.tokenAPI !== 'undefined' && window.tokenAPI) {
			headers['x-auth-token'] = window.tokenAPI;
		}
		const url = window.gkApiBaseUrl + 'products?' + new URLSearchParams(params).toString();
		return fetch(url, { headers: headers })
			.then(function(r) { return r.json(); })
			.then(function(data) {
				let list = [];
				if (data && Array.isArray(data.standard)) {
					list = data.standard;
				}
				const html = list.map(buildServiceCard).join('');
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
			const id = $(this).data('id');
			const name = $(this).data('name');
			$('input[name=config_defaultServiceCode]').val(id);
			$('input[name=config_defaultServiceName]').val(name);
			$('#selectedServiceName').text(name || '');
			$('#servicesModal').modal('hide');
		});

		$(document).on('click', '#updateCacheBtn', function() {
			const $btn = $(this);
			const url = $btn.data('url');
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
   SIDEBAR TAB SYSTEM — PS 1.7 / 8 / 9
───────────────────────────────────────── */
(function () {
	'use strict';

	const STORAGE_KEY = 'gk_config_tab';

	function activateTab(tabId) {
		const $btn = $('.gk-sidebar-btn[data-tab="' + tabId + '"]');
		$('.gk-sidebar-btn').removeClass('is-active');
		$btn.addClass('is-active');
		$('.gk-tab-pane').removeClass('gk-active');
		$('#' + tabId).addClass('gk-active');
		const title = $btn.data('title') || '';
		$('#gkSidebarCrumb').text(title);
		try { sessionStorage.setItem(STORAGE_KEY, tabId); } catch(e) {}
	}

	function closeSidebar() {
		$('#gkSidebar').removeClass('is-open');
		$('#gkSidebarOverlay').hide();
	}

	function initSidebar() {
		$('.gk-sidebar-btn').on('click', function () {
			activateTab($(this).data('tab'));
			closeSidebar();
		});

		$('#gkHamburger').on('click', function () {
			$('#gkSidebar').addClass('is-open');
			$('#gkSidebarOverlay').show();
		});

		$('#gkSidebarClose, #gkSidebarOverlay').on('click', function () {
			closeSidebar();
		});

		const isGuest = typeof gkIsAuthenticated !== 'undefined' && !gkIsAuthenticated;
		let saved = null;
		try { saved = sessionStorage.getItem(STORAGE_KEY); } catch(e) {}
		const hash = window.location.hash ? window.location.hash.replace('#', '') : null;
		// Logged-out users only have the account tab's nav button rendered - ignore any
		// stale hash/sessionStorage pointing at a tab from a previous logged-in session.
		const target = isGuest ? 'tab-konto' : (hash || saved || 'tab-konto');
		if ($('#' + target).length) {
			activateTab(target);
		} else {
			activateTab('tab-konto');
		}
	}

	function initLoginLoadingState() {
		// This is a native form submit (full page reload via Post/Redirect/Get), not
		// AJAX - there's a multi-second gap with no visual feedback otherwise. Disabling
		// a submit button SYNCHRONOUSLY inside its own click handler can make some
		// browsers drop it as the form's "activated submitter" and cancel the pending
		// submit entirely (button spins forever, no request ever goes out) - deferring
		// the disable by one tick lets the native submit fire first.
		$(document).on('click', '#gkLoginBtn', function () {
			const $btn = $(this);
			const loadingText = $btn.data('loading-text') || 'Logowanie…';
			setTimeout(function () {
				$btn.prop('disabled', true).html('<i class="icon-refresh icon-spin"></i> ' + loadingText);
			}, 0);
		});
	}

	function initLogout() {
		$(document).on('click', '#gkLogoutBtn', function () {
			if (!confirm('Czy na pewno chcesz wylogować się z GlobKurier?')) { return; }
			const $btn = $(this);
			$btn.prop('disabled', true).text('Wylogowywanie…');

			const url = (typeof gkConfigAjaxUrl !== 'undefined') ? gkConfigAjaxUrl : window.gkConfigAjaxUrl;
			$.post(url + '&ajax_action=gkLogout', {})
				.done(function (res) {
					if (res && res.success) {
						window.location.reload();
					} else {
						alert('Błąd wylogowania. Spróbuj ponownie.');
						$btn.prop('disabled', false).text('Wyloguj się');
					}
				})
				.fail(function () {
					alert('Błąd połączenia z serwerem.');
					$btn.prop('disabled', false).text('Wyloguj się');
				});
		});
	}

	function initApiEnvSwitch() {
		$(document).on('change', 'input[name="config_gkApiEnv"]', function () {
			const $switch = $('#gkApiEnvSwitch');
			const $inputs = $switch.find('input[name="config_gkApiEnv"]');
			const $savedMsg = $('#gkApiEnvSavedMsg');
			const $host = $('#gkApiEnvHost');
			const newVal = $(this).val();

			const url = (typeof gkConfigAjaxUrl !== 'undefined') ? gkConfigAjaxUrl : window.gkConfigAjaxUrl;
			$inputs.prop('disabled', true);
			$savedMsg.hide();

			$.post(url + '&ajax_action=setApiEnv', { config_gkApiEnv: newVal })
				.done(function (res) {
					if (res && res.success) {
						window.gkApiBaseUrl = res.baseUrl;
						$host.text(res.baseUrl);
						$savedMsg.stop(true).show().delay(1500).fadeOut();
					} else {
						alert('Nie udało się zapisać środowiska API. Spróbuj ponownie.');
					}
				})
				.fail(function () {
					alert('Błąd połączenia z serwerem.');
				})
				.always(function () {
					$inputs.prop('disabled', false);
				});
		});
	}

	function initPrepaidBalanceToggle() {
		const $select = $('select[name="config_defaultPaymentType"]');
		const $balanceBox = $('#gk-saldo');

		function togglePrepaidBox() {
			$balanceBox.toggle($select.val() === '9');
		}
		$select.on('change', togglePrepaidBox);
		togglePrepaidBox();
	}

	$(function () {
		initSidebar();
		initLoginLoadingState();
		initLogout();
		initApiEnvSwitch();
		initPrepaidBalanceToggle();
	});
})();

/* ─────────────────────────────────────────
   TEMPLATE CRUD
───────────────────────────────────────── */
(function () {
	'use strict';

	const GkTmpl = {
		ajaxUrl: null,
		templates: [],
		currentId: null,   // null = new, number = existing
		_productTimer: null,

		init: function () {
			const ajaxUrl = (typeof gkConfigAjaxUrl !== 'undefined') ? gkConfigAjaxUrl : window.gkConfigAjaxUrl;
			if (typeof ajaxUrl === 'undefined') { return; }
			GkTmpl.ajaxUrl = ajaxUrl;
			GkTmpl.templates = (typeof window.gkTemplatesData !== 'undefined' && window.gkTemplatesData) ? window.gkTemplatesData : [];
			GkTmpl.renderList();
			GkTmpl.bindEvents();
		},

		/* ── LIST ── */
		renderList: function () {
			const $list = $('#gk-tmpl-list');
			const $empty = $('#gk-tmpl-empty');
			$list.find('.gk-tmpl-list-item').remove();

			if (!GkTmpl.templates.length) {
				$empty.show();
				$('#gk-tmpl-count-label').text('0 szablonów');
				return;
			}
			$empty.hide();

			const count = GkTmpl.templates.length;
			$('#gk-tmpl-count-label').text(count + (count === 1 ? ' szablon' : count < 5 ? ' szablony' : ' szablonów'));

			for (let i = 0; i < GkTmpl.templates.length; i++) {
				const t = GkTmpl.templates[i];
				const star = t.is_default ? '<span class="gk-tmpl-star">★</span> ' : '';
				const synced = t.gk_template_id ? '<span class="gk-tmpl-synced" title="Zsynchronizowany z GlobKurier"></span>' : '';
				const meta = [];
				if (t.length && t.width && t.height) {
					meta.push(t.length + '×' + t.width + '×' + t.height + ' cm');
				}
				if (t.weight) { meta.push(t.weight + ' kg'); }
				const $item = $('<div class="gk-tmpl-list-item" data-id="' + t.id_template + '">' +
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
			let t = null;
			for (let i = 0; i < GkTmpl.templates.length; i++) {
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
			$('#gk-f-default').prop('checked', !!t.is_default);
			$('#gk-f-package-list').val(t.package_list || 'PARCEL');
			$('#gk-f-collection-type').val(t.collection_type || '');
			$('#gk-f-delivery-type').val(t.delivery_type || '');
			$('#gk-f-sender-country').val(t.sender_country || 'PL');
			$('#gk-f-recipient-country').val(t.recipient_country || 'PL');
			$('#gk-f-product-id').val(t.gk_product_id || '');
			$('#gk-f-addons').val(t.gk_addons || '');
			$('#gk-f-product-select').html('<option value="">Ładowanie…</option>');
			$('#gk-f-addons-wrap').hide();
			$('#gk-f-contents-select').html('<option value="">-- wybierz zawartość --</option>');
			GkTmpl.fetchProducts();

			const syncAt = (t.gk_sync_at && t.gk_sync_at !== '0000-00-00 00:00:00') ? t.gk_sync_at : null;
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
			$('#gk-f-default').prop('checked', false);
			$('#gk-f-sync-info').hide();
			$('#gk-f-package-list').val('PARCEL');
			$('#gk-f-collection-type').val('');
			$('#gk-f-delivery-type').val('');
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
			const name = $.trim($('#gk-f-name').val());
			if (!name) {
				alert('Podaj nazwę szablonu.');
				$('#gk-f-name').focus();
				return;
			}
			GkTmpl.collectAddons();
			const $btn = $('#gk-tmpl-save-btn');
			$btn.prop('disabled', true).text('Zapisuję…');

			let contentsVal = $('#gk-f-contents-select').val();
			if (contentsVal === '__custom__' || !contentsVal) {
				contentsVal = $('#gk-f-contents').val() || '';
			}

			const payload = {
				id_template:       $('#gk-f-id').val() || '',
				name:              name,
				ps_carrier_id:     $('#gk-f-carrier').val() || '',
				length:            $('#gk-f-length').val() || '',
				width:             $('#gk-f-width').val() || '',
				height:            $('#gk-f-height').val() || '',
				weight:            $('#gk-f-weight').val() || '',
				quantity:          $('#gk-f-quantity').val() || 1,
				contents:          contentsVal,
				is_default:        $('#gk-f-default').is(':checked') ? 1 : 0,
				package_list:      $('#gk-f-package-list').val() || 'PARCEL',
				collection_type:   $('#gk-f-collection-type').val() || '',
				delivery_type:     $('#gk-f-delivery-type').val() || '',
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
			const $btn = $('#gk-tmpl-sync-btn');
			$btn.prop('disabled', true).html('<i class="icon-refresh icon-spin"></i> Importuję…');

			$.post(GkTmpl.ajaxUrl + '&ajax_action=syncTemplates', {})
				.done(function (res) {
					if (res && res.success) {
						let msg = 'Synchronizacja zakończona.';
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
			const prevId = GkTmpl.currentId;
			$.get(GkTmpl.ajaxUrl + '&ajax_action=getTemplates')
				.done(function (res) {
					if (res && Array.isArray(res.templates)) {
						GkTmpl.templates = res.templates;
						GkTmpl.renderList();
						if (prevId) {
							let found = false;
							for (let i = 0; i < GkTmpl.templates.length; i++) {
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
			const len    = $('#gk-f-length').val();
			const width  = $('#gk-f-width').val();
			const height = $('#gk-f-height').val();
			const weight = $('#gk-f-weight').val();
			const sc     = $('#gk-f-sender-country').val() || 'PL';
			const rc     = $('#gk-f-recipient-country').val() || 'PL';
			const pkg    = $('#gk-f-package-list').val() || '';
			const collType = $('#gk-f-collection-type').val() || '';
			const delType  = $('#gk-f-delivery-type').val() || '';
			const $sel   = $('#gk-f-product-select');

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
				sender_country: sc, recipient_country: rc,
				package_list: pkg, collection_type: collType, delivery_type: delType
			}).done(function (res) {
				$('#gk-f-product-spinner').hide();
				$sel.prop('disabled', false);
				const services = (res && res.success && Array.isArray(res.services)) ? res.services : [];
				if (!services.length) {
					$sel.html('<option value="">Brak dostępnych usług</option>');
					$('#gk-f-addons-wrap').hide();
					return;
				}
				let html = '<option value="">-- wybierz usługę --</option>';
				for (let i = 0; i < services.length; i++) {
					const s = services[i];
					let label = (s.carrierName ? s.carrierName + ' – ' : '') + (s.name || 'Usługa ' + s.id);
					if (s.price) { label += ' (' + s.price + ')'; }
					html += '<option value="' + s.id + '">' + GkTmpl.esc(label) + '</option>';
				}
				$sel.html(html);
				const savedId = $('#gk-f-product-id').val();
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
			const productId = $('#gk-f-product-select').val();
			if (!productId) {
				$('#gk-f-addons-wrap').hide();
				$('#gk-f-addons-list').empty();
				return;
			}
			const sc = $('#gk-f-sender-country').val() || 'PL';
			const rc = $('#gk-f-recipient-country').val() || 'PL';

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
				const rawAddons = (res && res.success && Array.isArray(res.addons)) ? res.addons : [];
				// Amount-dependent categories don't make sense as a template default —
				// there's no order context here to attach a value (COD amount, insured
				// value, declared value) to, so they're excluded from this list entirely.
				const amountDependentCategories = ['INSURANCE', 'INSURANCE_CARGO', 'CASH_ON_DELIVERY', 'DECLARED_VALUE'];
				const addons = rawAddons.filter(function (a) {
					return amountDependentCategories.indexOf(a.category) === -1;
				});
				const $list  = $('#gk-f-addons-list');
				if (!addons.length) {
					$list.empty();
					$('#gk-f-addons-wrap').hide();
					return;
				}
				// Matched by category, not id: the same conceptual addon (e.g. COD)
				// gets a different numeric id per product/route from the GK API,
				// but its category (CASH_ON_DELIVERY, DECLARED_VALUE, ...) is stable.
				let savedCategories = [];
				try { savedCategories = JSON.parse($('#gk-f-addons').val() || '[]'); } catch (e) {}
				let html = '<div class="row">';
				for (let i = 0; i < addons.length; i++) {
					const a = addons[i];
					const checked = (a.category && savedCategories.indexOf(a.category) !== -1) ? ' checked' : '';
					html += '<div class="col-xs-12 col-sm-6"><div class="checkbox"><label>' +
						'<input type="checkbox" class="gk-tmpl-addon" value="' + a.id + '" data-category="' + (a.category || '') + '"' + checked + '> ' +
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
			const productId = $('#gk-f-product-select').val();
			const $sel      = $('#gk-f-contents-select');
			if (!productId) {
				$sel.html('<option value="">-- wybierz najpierw usługę --</option>');
				$('#gk-f-contents').hide().val('');
				return;
			}
			const sc = $('#gk-f-sender-country').val() || 'PL';
			const rc = $('#gk-f-recipient-country').val() || 'PL';

			$sel.html('<option value="">-- pobieranie zawartości --</option>').prop('disabled', true);

			$.post(GkTmpl.ajaxUrl + '&ajax_action=getContentList', {
				product_id: productId, sender_country: sc, recipient_country: rc
			}).done(function (res) {
				$sel.prop('disabled', false);
				const contents  = (res && res.success && Array.isArray(res.contents)) ? res.contents : [];
				const allowOther = !!(res && res.allowOtherContent);
				const currentVal = $('#gk-f-contents').val() || '';
				let html        = '<option value="">-- wybierz zawartość --</option>';
				for (let i = 0; i < contents.length; i++) {
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
			const val = $('#gk-f-contents-select').val();
			if (val === '__custom__') {
				$('#gk-f-contents').show().focus();
			} else {
				$('#gk-f-contents').hide().val(val);
			}
		},

		/* ── collect checked addons (by category, not id — see fetchAddons()) to hidden field ── */
		collectAddons: function () {
			const categories = [];
			$('#gk-f-addons-list .gk-tmpl-addon:checked').each(function () {
				const cat = $(this).data('category');
				if (cat) { categories.push(cat); }
			});
			$('#gk-f-addons').val(JSON.stringify(categories));
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

			const dimFields = '#gk-f-length, #gk-f-width, #gk-f-height, #gk-f-weight, #gk-f-sender-country, #gk-f-recipient-country, #gk-f-package-list, #gk-f-collection-type, #gk-f-delivery-type';
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

			// PAID_PICKUP and ORDERED_COURIER are optional and mutually exclusive —
			// pick one of the two, or neither (mirrors the order form's pickup
			// method logic). Unlike other addon categories, both are always shown
			// here since neither depends on an order-time amount. Bound before the
			// collectAddons() handler below so it reads the corrected state.
			$(document).on('change', '.gk-tmpl-addon', function () {
				const $current = $(this);
				if (!$current.is(':checked')) { return; }
				const pickupMethodPair = ['ORDERED_COURIER', 'PAID_PICKUP'];
				const category = $current.data('category');
				if (pickupMethodPair.indexOf(category) === -1) { return; }
				$('#gk-f-addons-list .gk-tmpl-addon').not($current).each(function () {
					if (pickupMethodPair.indexOf($(this).data('category')) !== -1 && $(this).is(':checked')) {
						$(this).prop('checked', false);
					}
				});
			});

			$(document).on('change', '#gk-f-addons-list', function () {
				GkTmpl.collectAddons();
			});

			$(document).on('click', '.gk-tmpl-list-item', function () {
				const id = parseInt($(this).data('id'), 10);
				GkTmpl.openTemplate(id);
			});
		}
	};

	$(function () { GkTmpl.init(); });
})();
