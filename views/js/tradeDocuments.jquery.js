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

/*
 * Customs (trade) documents of one already placed GK shipment: required types,
 * PDF upload, uploaded list (download / delete unsynced), send to carrier.
 * One component mounted in three places - the success screen after placing a
 * shipment, the shipment history and the PS order page. All GK calls go through
 * AdminGlobkurierHistory AJAX actions (the token stays server-side and GK's
 * 201/204 codes are wrapped into 200 JSON there).
 *
 * Usage: GKTradeDocs.mount(element, { url: <AdminGlobkurierHistory link>, hash: <GK hash> })
 * or a button with class "gk-trade-docs-toggle" and data-url/data-hash inside a table row.
 *
 * Contract and dictionaries mirror the Shopify integration (GLOBKURIER-10217) 1:1.
 */
(function() {
	'use strict';

	const MAX_TRADE_DOCUMENT_BYTES = 5 * 1024 * 1024;

	// GK shipment statuses in which POST /order/tradeDocument/sync is accepted
	const SYNC_ALLOWED_STATUSES = ['IN_PROGRESS', 'IN_TRANSIT'];

	// Statuses after which documents can no longer reach the carrier
	const CLOSED_STATUSES = {
		CANCELED: 'canceled',
		AWAITING_CARRIER_CANCELLATION: 'canceled',
		DELIVERED: 'finished',
		RETURNED_TO_SENDER: 'finished'
	};

	// Verified dictionary for the 4 carriers that have GK manifests. Carrier and
	// type keys MUST be normalized identically for both lookups - a mismatch makes
	// most types show raw codes.
	const CARRIER_TYPE_LABELS = {
		DHL_EXPRESS: {
			INV: { pl: 'Faktura', en: 'Invoice' },
			PNV: { pl: 'Faktura pro forma', en: 'Pro forma invoice' },
			COO: { pl: 'Świadectwo pochodzenia', en: 'Certificate of origin' },
			NAF: { pl: 'Świadectwo pochodzenia Nafta', en: 'NAFTA certificate of origin' },
			CIN: { pl: 'Faktura handlowa', en: 'Commercial invoice' },
			DCL: { pl: 'Deklaracja celna', en: 'Customs declaration' },
			AWB: { pl: 'List przewozowy lotniczy', en: 'Air waybill' }
		},
		FEDEX: {
			COMMERCIAL_INVOICE: { pl: 'Faktura handlowa', en: 'Commercial invoice' },
			CERTIFICATE_OF_ORIGIN: { pl: 'Certyfikat pochodzenia', en: 'Certificate of origin' },
			PRO_FORMA_INVOICE: { pl: 'Faktura pro forma', en: 'Pro forma invoice' },
			OTHER: { pl: 'Pozostałe dokumenty', en: 'Other documents' }
		},
		UPS: {
			COMMERCIAL_INVOICE: { pl: 'Faktura handlowa/proforma', en: 'Commercial/pro forma invoice' },
			AUTHORIZATION_FORM: { pl: 'Formularz autoryzacyjny', en: 'Authorization form' },
			EXPORT_ACCOMPANYING_DOCUMENT: { pl: 'Dokument towarzyszący do wywozu', en: 'Export accompanying document' },
			ONE_TIME_NAFTA: { pl: 'Świadectwo pochodzenia NAFTA', en: 'One-time NAFTA' },
			OTHER_DOCUMENT: { pl: 'Pozostałe dokumenty', en: 'Other documents' },
			POWER_OF_ATTORNEY: { pl: 'Pełnomocnictwo', en: 'Power of attorney' },
			PACKING_LIST: { pl: 'Lista rzeczy do spakowania', en: 'Packing list' },
			SED_DOCUMENT: { pl: 'Dokument SED', en: 'SED document' },
			"SHIPPER'S_LETTER_OF_INSTRUCTION": { pl: 'Lista instrukcji nadawcy', en: "Shipper's letter of instruction" },
			DECLARATION: { pl: 'Deklaracja', en: 'Declaration' },
			EXPORTLICENSE: { pl: 'Licencja eksportowa', en: 'Export licence' },
			IMPORT_PERMIT: { pl: 'Pozwolenie na przywóz', en: 'Import permit' }
		},
		RABEN: {
			WZ: { pl: 'Dokument WZ', en: 'Goods issue note (WZ)' }
		}
	};

	const GENERIC_TYPE_LABELS = {
		COMMERCIAL_INVOICE: { pl: 'Faktura handlowa', en: 'Commercial invoice' },
		PACKING_LIST: { pl: 'Packing lista', en: 'Packing list' },
		CERTIFICATE_OF_ORIGIN: { pl: 'Certyfikat pochodzenia', en: 'Certificate of origin' },
		OTHER: { pl: 'Inne', en: 'Other' }
	};

	function normalizeKey(value) {
		return String(value || '').toUpperCase().trim().replace(/\s+/g, '_');
	}

	function uiLang() {
		const htmlLang = (document.documentElement.getAttribute('lang') || '').substring(0, 2).toLowerCase();
		return htmlLang === 'pl' ? 'pl' : 'en';
	}

	function typeLabel(carrierName, type) {
		const lang = uiLang();
		const typeKey = normalizeKey(type);
		const carrierLabels = carrierName ? CARRIER_TYPE_LABELS[normalizeKey(carrierName)] : null;
		if (carrierLabels && carrierLabels[typeKey]) return carrierLabels[typeKey][lang];
		if (GENERIC_TYPE_LABELS[typeKey]) return GENERIC_TYPE_LABELS[typeKey][lang];
		return type;
	}

	function t(key) {
		const dict = window.GKTradeDocsI18n || {};
		return dict[key] != null ? dict[key] : key;
	}

	function tf(key, value) {
		return t(key).replace('%s', value);
	}

	function escapeHtml(str) {
		return String(str == null ? '' : str).replace(/[&<>"']/g, function(ch) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
		});
	}

	function formatSize(bytes) {
		return bytes >= 1024 * 1024
			? (bytes / 1024 / 1024).toFixed(1) + ' MB'
			: Math.max(1, Math.round(bytes / 1024)) + ' KB';
	}

	// Required groups with no uploaded document (OR within a group, AND across groups)
	function getMissingGroups(manifest) {
		const present = {};
		manifest.documents.forEach(function(d) { present[d.type] = true; });
		return manifest.typeRequiredGroups.filter(function(group) {
			return !group.some(function(type) { return present[type]; });
		});
	}

	// Types offered in the upload picker: only the required ones. Carriers without
	// required groups (e.g. Raben, optional WZ) fall back to the full typeList.
	function getUploadableTypes(manifest) {
		const required = [];
		manifest.typeRequiredGroups.forEach(function(group) {
			group.forEach(function(type) {
				if (required.indexOf(type) === -1 && manifest.typeList.indexOf(type) !== -1) required.push(type);
			});
		});
		return required.length ? required : manifest.typeList.slice();
	}

	function getDocumentsStatus(manifest) {
		if (!manifest.typeList.length) return 'not_required';
		if (getMissingGroups(manifest).length) return 'missing';
		if (manifest.documents.some(function(d) { return !d.isSendToCarrier; })) return 'ready_to_send';
		return manifest.documents.length ? 'sent' : 'ready_to_send';
	}

	// Why "send to carrier" is unavailable, or null when it can be sent. Status
	// reasons win: the merchant cannot fix them.
	function getSyncBlockReason(manifest, gkStatus) {
		if (gkStatus && CLOSED_STATUSES[gkStatus]) return CLOSED_STATUSES[gkStatus];
		if (gkStatus === 'CUSTOMS_CLEARANCE_ISSUE' || gkStatus === 'REQUIRES_CLARIFICATION') return 'issue';
		if (getMissingGroups(manifest).length || !manifest.documents.length) return 'missing_documents';
		if (!manifest.documents.some(function(d) { return !d.isSendToCarrier; })) return 'nothing_to_send';
		if (!gkStatus) return 'status_unknown';
		if (SYNC_ALLOWED_STATUSES.indexOf(gkStatus) === -1) return 'not_started';
		return null;
	}

	const REASON_TEXT_KEYS = {
		canceled: 'reasonCanceled',
		finished: 'reasonFinished',
		issue: 'reasonIssue',
		not_started: 'reasonNotStarted',
		status_unknown: 'reasonStatusUnknown',
		missing_documents: 'reasonMissing',
		nothing_to_send: 'reasonNothingToSend'
	};
	const REASON_TONE = {
		canceled: 'info', finished: 'info', issue: 'warning', not_started: 'info',
		status_unknown: 'warning', missing_documents: 'warning', nothing_to_send: 'success'
	};
	const STATUS_BADGE = {
		missing: { tone: 'danger', key: 'statusMissing' },
		ready_to_send: { tone: 'warning', key: 'statusReady' },
		sent: { tone: 'success', key: 'statusSent' }
	};

	function errorText(code) {
		switch (code) {
			case 'invalid_pdf': return t('errorInvalidPdf');
			case 'file_too_large': return t('errorTooLarge');
			case 'missing_fields': return t('errorMissingFields');
			case 'not_found': return t('errorNotFound');
			case 'upload_failed': return t('errorUploadFailed');
			default: return code || t('errorGeneric');
		}
	}

	function readHeader(file) {
		return new Promise(function(resolve) {
			const reader = new FileReader();
			reader.onload = function() { resolve(String(reader.result || '')); };
			reader.onerror = function() { resolve(''); };
			reader.readAsBinaryString(file.slice(0, 5));
		});
	}

	// Whole file as base64 (without the "data:...;base64," prefix)
	function readBase64(file) {
		return new Promise(function(resolve, reject) {
			const reader = new FileReader();
			reader.onload = function() { resolve(String(reader.result || '').replace(/^data:[^,]*,/, '')); };
			reader.onerror = function() { reject(reader.error); };
			reader.readAsDataURL(file);
		});
	}

	function Panel(el, opts) {
		this.$root = window.jQuery(el);
		this.url = opts.url;
		this.hash = opts.hash;
		this.showNotRequired = !!opts.showNotRequired;
		this.data = null;
		this.loadError = null;
		this.staged = [];
		this.busy = null;
		this.message = null;
		this.stagedSeq = 0;
		this.bind();
		this.reload();
	}

	Panel.prototype.actionUrl = function(action, params) {
		const query = Object.keys(params || {}).map(function(k) {
			return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
		}).join('&');
		return this.url + '&ajax=1&action=' + action + (query ? ('&' + query) : '');
	};

	// POSTs one action; never throws - network/parse errors become {ok:false}
	Panel.prototype.post = function(action, formData) {
		return fetch(this.actionUrl(action), { method: 'POST', body: formData, credentials: 'same-origin' })
			.then(function(r) { return r.json(); })
			.catch(function(e) { return { ok: false, error: String(e) }; });
	};

	Panel.prototype.reload = function() {
		const self = this;
		self.loadError = null;
		if (!self.data) { self.render(); }
		return fetch(self.actionUrl('tradeDocuments', { hash: self.hash }), { credentials: 'same-origin' })
			.then(function(r) { return r.json(); })
			.then(function(resp) {
				if (resp && resp.ok) {
					self.data = resp;
				} else {
					self.loadError = errorText(resp && resp.error);
				}
			})
			.catch(function(e) { self.loadError = String(e); })
			.then(function() { self.render(); });
	};

	Panel.prototype.bind = function() {
		const self = this;
		const $root = self.$root;
		$root.on('change', '.gk-td-file-input', function() {
			const files = Array.prototype.slice.call(this.files || []);
			this.value = '';
			if (!files.length || !self.data) return;
			const manifest = self.data.manifest;
			const missing = getMissingGroups(manifest);
			const uploadable = getUploadableTypes(manifest);
			// Preselect the first still-missing type, so the common case needs no change
			const defaultType = (missing[0] && missing[0][0]) || uploadable[0] || '';
			self.message = null;
			files.forEach(function(file) {
				self.stagedSeq++;
				self.staged.push({
					id: 's' + self.stagedSeq,
					file: file,
					type: defaultType,
					description: '',
					error: file.size > MAX_TRADE_DOCUMENT_BYTES ? errorText('file_too_large') : null
				});
			});
			self.render();
		});
		$root.on('change', '.gk-td-staged-type', function() {
			const item = self.findStaged(window.jQuery(this).data('id'));
			if (item) { item.type = this.value; item.error = null; }
		});
		$root.on('input', '.gk-td-staged-description', function() {
			const item = self.findStaged(window.jQuery(this).data('id'));
			if (item) { item.description = this.value; }
		});
		$root.on('click', '.gk-td-staged-remove', function() {
			const id = window.jQuery(this).data('id');
			self.staged = self.staged.filter(function(s) { return s.id !== id; });
			self.render();
		});
		$root.on('click', '.gk-td-upload', function() { self.uploadAll(); });
		$root.on('click', '.gk-td-sync', function() { self.sync(); });
		$root.on('click', '.gk-td-retry', function() { self.reload(); });
		$root.on('click', '.gk-td-download', function() {
			self.download(window.jQuery(this).data('name'));
		});
		$root.on('click', '.gk-td-delete', function() {
			self.remove(window.jQuery(this).data('name'));
		});
	};

	Panel.prototype.findStaged = function(id) {
		return this.staged.find(function(s) { return s.id === id; }) || null;
	};

	Panel.prototype.uploadAll = function() {
		const self = this;
		self.message = null;
		let invalid = false;
		self.staged.forEach(function(s) {
			s.description = String(s.description || '').trim();
			if (s.file.size > MAX_TRADE_DOCUMENT_BYTES) {
				s.error = errorText('file_too_large');
				invalid = true;
			} else if (!s.description || !s.type) {
				s.error = errorText('missing_fields');
				invalid = true;
			} else {
				s.error = null;
			}
		});
		if (invalid) { self.render(); return; }

		self.busy = 'upload';
		self.render();
		const failed = [];
		let uploaded = 0;
		// Sequential on purpose: each request carries up to 5 MB
		const queue = self.staged.slice();
		const next = function() {
			const s = queue.shift();
			if (!s) return Promise.resolve();
			return readHeader(s.file).then(function(header) {
				if (header !== '%PDF-') {
					s.error = errorText('invalid_pdf');
					failed.push(s);
					return next();
				}
				// base64 in a plain field, not a multipart file - see the PHP action
				return readBase64(s.file).then(function(content) {
					const fd = new FormData();
					fd.append('hash', self.hash);
					fd.append('type', s.type);
					fd.append('description', s.description);
					fd.append('name', s.file.name);
					fd.append('content', content);
					return self.post('tradeDocumentUpload', fd);
				}).catch(function(e) {
					return { ok: false, error: String(e) };
				}).then(function(r) {
					if (r && r.ok) {
						uploaded++;
					} else {
						s.error = errorText(r && r.error);
						failed.push(s);
					}
					return next();
				});
			});
		};
		next().then(function() {
			self.busy = null;
			self.staged = failed;
			if (uploaded) { self.message = { tone: 'success', text: tf('uploadedCount', uploaded) }; }
			self.reload();
		});
	};

	Panel.prototype.remove = function(name) {
		const self = this;
		if (!name || !window.confirm(tf('confirmDelete', name))) return;
		self.busy = 'delete';
		self.message = null;
		self.render();
		const fd = new FormData();
		fd.append('hash', self.hash);
		fd.append('name', name);
		self.post('tradeDocumentDelete', fd).then(function(r) {
			self.busy = null;
			self.message = (r && r.ok)
				? { tone: 'success', text: t('deleted') }
				: { tone: 'danger', text: errorText(r && r.error) };
			// Re-fetch the manifest instead of mutating local state
			self.reload();
		});
	};

	Panel.prototype.sync = function() {
		const self = this;
		self.busy = 'sync';
		self.message = null;
		self.render();
		const fd = new FormData();
		fd.append('hash', self.hash);
		self.post('tradeDocumentSync', fd).then(function(r) {
			self.busy = null;
			self.message = (r && r.ok)
				? { tone: 'success', text: t('synced') }
				: { tone: 'danger', text: errorText(r && r.error) };
			self.reload();
		});
	};

	// Forced download (blob + <a download>) - same as the reference integrations, no viewer
	Panel.prototype.download = function(name) {
		const self = this;
		fetch(self.actionUrl('tradeDocumentDownload', { hash: self.hash, name: name }), { credentials: 'same-origin' })
			.then(function(r) {
				const contentType = r.headers.get('Content-Type') || '';
				if (!r.ok || contentType.indexOf('application/json') !== -1) {
					return r.json().then(function(body) { throw new Error(body && body.error ? errorText(body.error) : t('downloadError')); });
				}
				return r.blob();
			})
			.then(function(blob) {
				const objectUrl = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = objectUrl;
				a.download = name;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(objectUrl);
			})
			.catch(function(e) {
				self.message = { tone: 'danger', text: (e && e.message) || t('downloadError') };
				self.render();
			});
	};

	function alertHtml(tone, text) {
		return '<div class="gk-td-alert gk-td-alert--' + tone + '">' + escapeHtml(text) + '</div>';
	}

	Panel.prototype.render = function() {
		const $root = this.$root;
		if (this.loadError && !this.data) {
			$root.html(
				alertHtml('warning', t('loadError') + ' ' + this.loadError) +
				'<button type="button" class="btn btn-default btn-outline-secondary btn-sm gk-td-retry">' + escapeHtml(t('retry')) + '</button>'
			);
			return;
		}
		if (!this.data) {
			$root.html('<div class="gk-td-muted"><i class="icon-refresh icon-spin"></i> ' + escapeHtml(t('loading')) + '</div>');
			return;
		}

		const data = this.data;
		const manifest = data.manifest;
		const status = getDocumentsStatus(manifest);
		if (status === 'not_required') {
			$root.html(this.showNotRequired
				? ('<div class="gk-td-muted">' + escapeHtml(t('notRequiredYet')) + ' ' +
					'<button type="button" class="btn btn-link btn-sm gk-td-retry">' + escapeHtml(t('retry')) + '</button></div>')
				: ('<div class="gk-td-muted">' + escapeHtml(t('notRequired')) + '</div>'));
			return;
		}

		const carrierName = data.carrierName;
		const gkStatus = data.gkStatus;
		const busy = this.busy;
		const missingGroups = getMissingGroups(manifest);
		const uploadable = getUploadableTypes(manifest);
		const blockReason = getSyncBlockReason(manifest, gkStatus);
		const uploadClosed = !!(gkStatus && CLOSED_STATUSES[gkStatus]);
		const label = function(type) { return typeLabel(carrierName, type); };
		const gkStatusLabels = t('gkStatus');

		let html = '<div class="gk-td-header">' +
			'<strong class="gk-td-heading">' + escapeHtml(t('heading')) + '</strong>' +
			'<span class="gk-td-badges">' +
				(gkStatus ? ('<span class="gk-td-badge">' + escapeHtml(t('shipmentStatus')) + ': ' + escapeHtml((gkStatusLabels && gkStatusLabels[gkStatus]) || gkStatus) + '</span>') : '') +
				(!uploadClosed && STATUS_BADGE[status] ? ('<span class="gk-td-badge gk-td-badge--' + STATUS_BADGE[status].tone + '">' + escapeHtml(t(STATUS_BADGE[status].key)) + '</span>') : '') +
			'</span>' +
		'</div>';
		html += '<p class="gk-td-muted">' + escapeHtml(t('intro')) + '</p>';

		// Required types, with a check mark once a group is covered
		if (manifest.typeRequiredGroups.length) {
			html += '<div class="gk-td-required"><strong>' + escapeHtml(t('requiredTypes')) + ':</strong><ul>' +
				manifest.typeRequiredGroups.map(function(group) {
					const covered = missingGroups.indexOf(group) === -1;
					const names = group.map(label).map(escapeHtml).join(' / ');
					return '<li class="' + (covered ? 'gk-td-covered' : 'gk-td-missing') + '">' +
						(covered ? '&#10003; ' : '&#9888; ') +
						(group.length > 1 ? (escapeHtml(t('requiredOneOf')) + ': ') : '') + names +
					'</li>';
				}).join('') +
			'</ul></div>';
		}

		if (uploadClosed && blockReason) { html += alertHtml(REASON_TONE[blockReason], t(REASON_TEXT_KEYS[blockReason])); }
		if (this.message) { html += alertHtml(this.message.tone, this.message.text); }

		if (!uploadClosed) {
			html += '<div class="gk-td-step"><strong>' + escapeHtml(t('step1')) + '</strong></div>' +
				'<label class="btn btn-default btn-outline-secondary btn-sm gk-td-file-label' + (busy ? ' disabled' : '') + '">' +
					escapeHtml(t('chooseFiles')) +
					'<input type="file" class="gk-td-file-input" accept=".pdf,application/pdf" multiple' + (busy ? ' disabled' : '') + '>' +
				'</label> <span class="gk-td-muted">' + escapeHtml(t('fileHint')) + '</span>';

			html += this.staged.map(function(s) {
				const options = uploadable.map(function(type) {
					return '<option value="' + escapeHtml(type) + '"' + (type === s.type ? ' selected' : '') + '>' + escapeHtml(label(type)) + '</option>';
				}).join('');
				return '<div class="gk-td-staged' + (s.error ? ' gk-td-staged--error' : '') + '">' +
					'<div class="gk-td-staged-file"><strong>' + escapeHtml(s.file.name) + '</strong> <span class="gk-td-muted">' + formatSize(s.file.size) + '</span></div>' +
					'<div class="gk-td-staged-field"><label>' + escapeHtml(t('typeLabel')) + '</label>' +
						'<select class="form-control gk-td-staged-type" data-id="' + s.id + '">' + options + '</select></div>' +
					'<div class="gk-td-staged-field gk-td-staged-field--wide"><label>' + escapeHtml(t('descriptionLabel')) + ' <span class="text-danger">*</span></label>' +
						'<input type="text" class="form-control gk-td-staged-description" data-id="' + s.id + '" maxlength="256" value="' + escapeHtml(s.description) + '" placeholder="' + escapeHtml(t('descriptionPlaceholder')) + '"></div>' +
					'<button type="button" class="btn btn-link gk-td-staged-remove" data-id="' + s.id + '" title="' + escapeHtml(t('removeStaged')) + '"' + (busy ? ' disabled' : '') + '>&times;</button>' +
					(s.error ? ('<div class="gk-td-field-error">' + escapeHtml(s.error) + '</div>') : '') +
				'</div>';
			}).join('');

			if (this.staged.length) {
				html += '<div class="gk-td-actions">' +
					'<span class="gk-td-muted">' + escapeHtml(t('retentionHint')) + '</span>' +
					'<button type="button" class="btn btn-primary btn-sm gk-td-upload"' + (busy ? ' disabled' : '') + '>' +
						(busy === 'upload' ? '<i class="icon-refresh icon-spin"></i> ' : '') + escapeHtml(tf('uploadCount', this.staged.length)) +
					'</button>' +
				'</div>';
			}
		}

		if (manifest.documents.length) {
			html += '<div class="gk-td-step"><strong>' + escapeHtml(uploadClosed ? t('uploadedHeading') : t('step2')) + '</strong></div>' +
				'<table class="table table-condensed gk-td-table"><thead><tr>' +
					'<th>' + escapeHtml(t('colName')) + '</th><th>' + escapeHtml(t('colType')) + '</th>' +
					'<th>' + escapeHtml(t('colStatus')) + '</th><th>' + escapeHtml(t('colActions')) + '</th>' +
				'</tr></thead><tbody>' +
				manifest.documents.map(function(doc) {
					// Delete is hidden entirely (not just disabled) once the carrier has the document
					const canDelete = !doc.isSendToCarrier && !uploadClosed;
					return '<tr>' +
						'<td>' + escapeHtml(doc.name) + (doc.description ? ('<div class="gk-td-muted">' + escapeHtml(doc.description) + '</div>') : '') + '</td>' +
						'<td>' + escapeHtml(label(doc.type)) + '</td>' +
						'<td>' + (doc.isSendToCarrier
							? '<span class="gk-td-badge gk-td-badge--success">' + escapeHtml(t('sentBadge')) + '</span>'
							: '<span class="gk-td-badge">' + escapeHtml(t('notSentBadge')) + '</span>') + '</td>' +
						'<td class="gk-td-row-actions">' +
							'<button type="button" class="btn btn-default btn-outline-secondary btn-xs btn-sm gk-td-download" data-name="' + escapeHtml(doc.filename) + '">' + escapeHtml(t('download')) + '</button>' +
							(canDelete ? (' <button type="button" class="btn btn-danger btn-xs btn-sm gk-td-delete" data-name="' + escapeHtml(doc.filename) + '"' + (busy ? ' disabled' : '') + '>' + escapeHtml(t('delete')) + '</button>') : '') +
						'</td>' +
					'</tr>';
				}).join('') +
				'</tbody></table>';

			if (!uploadClosed) {
				if (blockReason) { html += alertHtml(REASON_TONE[blockReason], t(REASON_TEXT_KEYS[blockReason])); }
				html += '<div class="gk-td-actions gk-td-actions--end">' +
					'<button type="button" class="btn btn-success btn-gk-success btn-sm gk-td-sync"' + ((blockReason || busy) ? ' disabled' : '') + '>' +
						(busy === 'sync' ? '<i class="icon-refresh icon-spin"></i> ' : '') + escapeHtml(t('sync')) +
					'</button>' +
				'</div>';
			}
		}

		$root.html(html);
	};

	function mount(el, opts) {
		const $el = window.jQuery(el);
		const existing = $el.data('gkTradeDocsPanel');
		if (existing) { existing.reload(); return existing; }
		const panel = new Panel(el, opts || {});
		$el.data('gkTradeDocsPanel', panel);
		return panel;
	}

	// Table-row toggle used by the shipment history and the PS order page: opens an
	// inline row under the shipment with the panel (no modal - Bootstrap 3/4 modal
	// markup differs between PS 1.6/1.7 and PS 8/9 admin pages).
	function bindRowToggle($) {
		$(document).on('click', '.gk-trade-docs-toggle', function(e) {
			e.preventDefault();
			const $btn = $(this);
			const $row = $btn.closest('tr');
			const $next = $row.next('.gk-td-panel-row');
			if ($next.length) {
				$next.toggle();
				return;
			}
			const colspan = $row.children('td').length || 1;
			const $panelRow = $('<tr class="gk-td-panel-row"><td colspan="' + colspan + '"><div class="gk-td-panel"></div></td></tr>');
			$row.after($panelRow);
			mount($panelRow.find('.gk-td-panel')[0], { url: $btn.data('url'), hash: $btn.data('hash') });
		});
	}

	window.GKTradeDocs = { mount: mount };

	// jQuery may load after this file on Symfony-based PS 8/9 admin pages
	function init() {
		if (window.jQuery) { bindRowToggle(window.jQuery); }
	}
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
