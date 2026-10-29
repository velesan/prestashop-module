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

	const GK = window.GK || (window.GK = {});
	// Resolved lazily (not as a top-level const) because addJS()-registered scripts
	// execute in <head>, before window.InitialValues is set by the inline <script>
	// block further down the page. Reading it eagerly here always saw it as undefined.
	function gkApiBase() {
		return window.InitialValues && window.InitialValues.apiBase;
	}
	GK.state = {
		isProcessing: false,
		orderPlaced: null,
		sender: {},
		receiver: {},
		pickedService: null,
		serviceOptions: [],
		additionalInfo: { paymentType: null },
		discountCode: '',
		priceError: null,
		orderSummary: null,
		packageInfo: null,
		availablePayments: [],
		forModal: false,
		forceShowAll: false,
		customsFields: [],
		customsData: null,
		orderHash: null,
		// Confirmed against shoper's own COD->insurance cascade (assets/js/order.js):
		// once the merchant types into the insurance field themselves, the COD-driven
		// auto-fill must stop overwriting it for good - not just "while it's empty",
		// which broke on the very first keystroke of the COD amount (see the
		// CASH_ON_DELIVERY branch of the .addon-checkbox change handler).
		insuranceAmountManuallyEdited: false
	};


function setProcessing(on) {
		GK.state.isProcessing = !!on;
		$('#processingBox').toggle(!!on);
		$('#sendIcon').toggle(!on);
		$('#processingIcon').toggle(!!on);
		if (on) {
			$('#sendOrderBtn').prop('disabled', true);
		} else {
			updateSendButtonDisabled();
		}
	}

	function updateEnabledOptionsUI() {
		const s = GK.state;
		// derive active addon categories
		const activeCategories = (s.serviceOptions || []).map(function(v){ return v && v.category ? v.category : (v.category || ''); });
		// NKO → force COD and disable payment select
		if (activeCategories.indexOf('NKO') !== -1) {
			$('#paymentSelect').val('COD').prop('disabled', true);
			if (!s.additionalInfo) s.additionalInfo = {};
			s.additionalInfo.paymentType = 'COD';
		} else {
			$('#paymentSelect').prop('disabled', false);
			if (s.additionalInfo && s.additionalInfo.paymentType === 'COD' && activeCategories.indexOf('NKO') === -1) {
				// keep as chosen by user; do nothing
			}
		}
		// CASH_ON_DELIVERY → show COD bank-detail fields
		// (the COD amount input itself lives in the value-range addon group and is
		// managed by renderAddonsList()/applyValueRangeFilter(), not here)
		const hasCOD = activeCategories.indexOf('CASH_ON_DELIVERY') !== -1;
		$('#codSwiftGroup, #codAccountGroup, #codAccountHolderGroup, #codAccountAddr1Group, #codAccountAddr2Group').toggle(hasCOD);
		if (hasCOD) {
			if (!GK.state.additionalInfo) GK.state.additionalInfo = {};
			// Fill COD fields with defaults only the first time COD becomes active for
			// this field (i.e. it has no value yet) - this function re-runs on every
			// addon selection change, so re-checking/re-filtering a COD addon must NOT
			// keep clobbering whatever the merchant already typed here.
			if (!GK.state.additionalInfo.codSwiftCode && window.InitialValues && window.InitialValues.defaultCodSwiftCode) {
				$('#codSwiftInput').val(window.InitialValues.defaultCodSwiftCode);
				GK.state.additionalInfo.codSwiftCode = window.InitialValues.defaultCodSwiftCode;
			}
			if (!GK.state.additionalInfo.codAccount && window.InitialValues && window.InitialValues.defaultCodAccount) {
				$('#codAccountInput').val(window.InitialValues.defaultCodAccount);
				GK.state.additionalInfo.codAccount = window.InitialValues.defaultCodAccount;
			}
			if (!GK.state.additionalInfo.codAccountHolder && window.InitialValues && window.InitialValues.defaultCodAccountHolderName) {
				$('#codAccountHolderInput').val(window.InitialValues.defaultCodAccountHolderName);
				GK.state.additionalInfo.codAccountHolder = window.InitialValues.defaultCodAccountHolderName;
			}
			if (!GK.state.additionalInfo.codAccountAddr1 && window.InitialValues && window.InitialValues.defaultCodAccountHolderAddr1) {
				$('#codAccountAddr1Input').val(window.InitialValues.defaultCodAccountHolderAddr1);
				GK.state.additionalInfo.codAccountAddr1 = window.InitialValues.defaultCodAccountHolderAddr1;
			}
			if (!GK.state.additionalInfo.codAccountAddr2 && window.InitialValues && window.InitialValues.defaultCodAccountHolderAddr2) {
				$('#codAccountAddr2Input').val(window.InitialValues.defaultCodAccountHolderAddr2);
				GK.state.additionalInfo.codAccountAddr2 = window.InitialValues.defaultCodAccountHolderAddr2;
			}
		} else {
			$('#codSwiftInput, #codAccountInput, #codAccountHolderInput, #codAccountAddr1Input, #codAccountAddr2Input').val('');
			if (GK.state.additionalInfo) {
				GK.state.additionalInfo.codSwiftCode = '';
				GK.state.additionalInfo.codAccount = '';
				GK.state.additionalInfo.codAccountHolder = '';
				GK.state.additionalInfo.codAccountAddr1 = '';
				GK.state.additionalInfo.codAccountAddr2 = '';
			}
		}
		// International → purpose when receiver ISO != PL
		// (insurance / declared value amount inputs live in the value-range addon
		// groups and are managed by renderAddonsList()/applyValueRangeFilter())
		const receiverIso = (s.receiver && s.receiver.country && (s.receiver.country.isoCode || s.receiver.country.code || s.receiver.country.iso)) || (window.InitialValues && window.InitialValues.receiver && window.InitialValues.receiver.countryCode) || null;
		const isInternational = receiverIso && (receiverIso.toUpperCase() !== 'PL');
		$('#purposeGroup').toggle(!!isInternational);
		if (!isInternational) {
			$('#purposeSelect').val('');
			if (s.additionalInfo) s.additionalInfo.purpose = '';
		} else {
			if (!s.additionalInfo) s.additionalInfo = {};
			const selectedPurpose = s.additionalInfo.purpose || $('#purposeSelect').val() || 'SOLD';
			s.additionalInfo.purpose = selectedPurpose;
			$('#purposeSelect').val(selectedPurpose);
		}

		// insuranceRequired: some addons (e.g. certain NOT_STANDARD/COD tiers) require the
		// merchant to also carry insurance. Neither reference app (shoper/shopify) blocks
		// order submission on this - just a visible nudge - so we do the same here.
		const insuranceRequiredActive = $('.addon-checkbox[data-insurance-required="1"]:checked').length > 0;
		const hasInsurance = activeCategories.indexOf('INSURANCE') !== -1 || activeCategories.indexOf('INSURANCE_CARGO') !== -1;
		$('.gk-insurance-required-warning').toggle(insuranceRequiredActive && !hasInsurance);

		// Terminal label "InPost za pobraniem" for COD-inpost.
		// We don't rely on terminalType being COD-specific (DB usually stores only 'inpost').
		const codLabelActive = hasCOD || (s.additionalInfo && s.additionalInfo.paymentType === 'COD') || (s.additionalInfo && !!s.additionalInfo.codAmount);
		const $inpost = $('.terminalLabel[data-type="inpost"]');
		const $inpostCod = $('.terminalLabel[data-type="inpost_cod"]');
		if ($inpost.length && $inpostCod.length) {
			if (codLabelActive && $inpost.is(':visible')) {
				$inpost.hide();
				$inpostCod.show();
			} else if (!codLabelActive && $inpostCod.is(':visible')) {
				$inpostCod.hide();
				$inpost.show();
			}
		}
	}

function showOrderPlaced(order) {
		GK.state.orderPlaced = order;
		$('#mainFormBox').hide();
		$('#orderPlacedBox').show();
		$('#orderPlacedNumber').text(order && order.gkId ? order.gkId : 'Brak numeru');

		if (order && order.trackingNumber) {
			$('#orderPlacedTracking').text(order.trackingNumber);
			$('#orderPlacedTrackingLabel').show();
			$('#orderPlacedTrackingSpinner').hide();
			$('#orderPlacedTrackingTimeout').hide();
			$('#orderPlacedTrackingRow').show();
		} else if (order && order.hash) {
			$('#orderPlacedTrackingLabel').hide();
			$('#orderPlacedTrackingSpinner').show();
			$('#orderPlacedTrackingTimeout').hide();
			$('#orderPlacedTrackingRow').show();
		} else {
			$('#orderPlacedTrackingRow').hide();
		}

		$('#downloadLabelBtn').toggle(!!(order && order.hash));

		// Customs documents can only be attached to an existing shipment (the GK
		// manifest needs its hash) - offer them right here, on the success screen.
		const $docs = $('#orderPlacedTradeDocs');
		const tradeDocsUrl = window.InitialValues && window.InitialValues.tradeDocsUrl;
		if (order && order.hash && order.hasCustoms && tradeDocsUrl && window.GKTradeDocs) {
			$docs.show();
			window.GKTradeDocs.mount($docs[0], { url: tradeDocsUrl, hash: order.hash, showNotRequired: true });
		} else {
			$docs.hide().empty();
		}
	}

	let _trackingPollTimer = null;
	let _trackingPollAttempts = 0;
	const _trackingPollMax = 24;

	function startTrackingPoll(gkId, hash, moduleApiUrl) {
		_trackingPollAttempts = 0;
		if (_trackingPollTimer) clearTimeout(_trackingPollTimer);
		pollForTracking(gkId, hash, moduleApiUrl);
	}

	function pollForTracking(gkId, hash, moduleApiUrl) {
		_trackingPollAttempts++;
		if (_trackingPollAttempts > _trackingPollMax) {
			$('#orderPlacedTrackingSpinner').hide();
			$('#orderPlacedTrackingTimeout').show();
			return;
		}
		fetch(gkApiBase() + 'order?hash=' + encodeURIComponent(hash), { headers: buildHeaders() })
			.then(function(r){ return r.json(); })
			.then(function(resp){
				const tracking = (resp && resp.trackingNumber) ? resp.trackingNumber : null;
				if (tracking) {
					GK.state.orderPlaced.trackingNumber = tracking;
					$('#orderPlacedTracking').text(tracking);
					$('#orderPlacedTrackingSpinner').hide();
					$('#orderPlacedTrackingTimeout').hide();
					$('#orderPlacedTrackingLabel').show();
					if (moduleApiUrl) {
						fetch(moduleApiUrl + '&ajax=1&action=saveTrackingNumber&gkId=' + encodeURIComponent(gkId) + '&trackingNumber=' + encodeURIComponent(tracking));
					}
				} else {
					_trackingPollTimer = setTimeout(function(){
						pollForTracking(gkId, hash, moduleApiUrl);
					}, 5000);
				}
			})
			.catch(function(){
				_trackingPollTimer = setTimeout(function(){
					pollForTracking(gkId, hash, moduleApiUrl);
				}, 5000);
			});
	}

	function clearErrors() {
		$('#orderErrorList').empty();
		$('#orderErrorBox').hide();
		$('#validationErrorBox').hide();
		$('#valErrSenderPhone').hide();
		$('#valErrReceiverPhone').hide();
		$('#valErrNoPickupMethod').hide();
		$('#carrierLimitsWarning').hide();
		$('#valErrCodSwiftRequired').hide();
		$('#valErrCodSwiftFormat').hide();
		$('#pkg-weight, #pkg-width, #pkg-height, #pkg-length, #codSwiftInput').removeClass('gk-field-error');
	}

	function showValidationErrors(err) {
		if (err.noSenderPhone) $('#valErrSenderPhone').show();
		if (err.noReceiverPhone) $('#valErrReceiverPhone').show();
		if (err.noPickupMethod) $('#valErrNoPickupMethod').show();
		if (err.dimensionFields && err.dimensionFields.length) {
			err.dimensionFields.forEach(function(f) { $('#' + f).addClass('gk-field-error'); });
			$('#carrierLimitsWarning').show();
		}
		if (err.codSwiftRequired) $('#valErrCodSwiftRequired').show();
		if (err.codSwiftFormat) {
			$('#codSwiftInput').addClass('gk-field-error');
			$('#valErrCodSwiftFormat').show();
		}
		if (err.noSenderPhone || err.noReceiverPhone || err.noPickupMethod || err.codSwiftRequired) $('#validationErrorBox').show();
	}

	const SWIFT_BIC_PATTERN = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

	// UWAGA: swiftCode wymagany jest tu wyłącznie na podstawie prefiksu IBAN (PL/nie-PL).
	// Prawdziwa reguła API GlobKurier to: SWIFT wymagany, gdy IBAN nie jest polski
	// LUB waluta dodatku COD (przypisana do konkretnego produktu/przewoźnika) nie jest PLN.
	// Uproszczono, bo ta integracja nie ma pojęcia "waluty pobrania" w UI, a wszyscy
	// obecnie obsługiwani przewoźnicy z COD rozliczają pobranie w PLN.
	// TODO: jeśli dojdzie zagraniczny przewoźnik z COD w innej walucie niż PLN,
	// wrócić do tej reguły i doprecyzować warunek (nie polegać tylko na prefiksie IBAN).
	function isCodSwiftRequired() {
		const acct = ((GK.state.additionalInfo && GK.state.additionalInfo.codAccount) || '').replace(/\s/g, '').toUpperCase();
		return acct.length > 0 && acct.substring(0, 2) !== 'PL';
	}

	function validateDimensions() {
		const limits = window.InitialValues
			&& window.InitialValues.prestaCarrier
			&& window.InitialValues.prestaCarrier.limits;
		if (!limits) return null;
		const pi = GK.state.packageInfo;
		if (!pi) return null;
		const fields = [];
		if (limits.maxWeight > 0 && pi.weight > limits.maxWeight) fields.push('pkg-weight');
		if (limits.maxWidth  > 0 && pi.width  > limits.maxWidth)  fields.push('pkg-width');
		if (limits.maxHeight > 0 && pi.height > limits.maxHeight) fields.push('pkg-height');
		if (limits.maxDepth  > 0 && pi.length > limits.maxDepth)  fields.push('pkg-length');
		return fields.length ? fields : null;
	}

function showOrderErrors(obj) {
    const $ul = $('#orderErrorList');
		Object.keys(obj || {}).forEach(function(k) {
			$ul.append('<li>' + k + ': ' + obj[k] + '</li>');
		});
		$('#orderErrorBox').show();
	}

	function validate() {
		const r = {};
		if (!GK.state.sender.phone) r.noSenderPhone = true;
		if (!GK.state.receiver.phone) r.noReceiverPhone = true;
		const dimFields = validateDimensions();
		if (dimFields) r.dimensionFields = dimFields;
		const sendingType = $('input[name=pickup_type]:checked').val();
		if (sendingType === 'PICKUP') {
			const $orderedAddon = $('.addon-checkbox[data-category="ORDERED_COURIER"]');
			const $paidAddon = $('.addon-checkbox[data-category="PAID_PICKUP"]');
			if (($orderedAddon.length > 0 || $paidAddon.length > 0) && !$orderedAddon.is(':checked') && !$paidAddon.is(':checked')) {
				r.noPickupMethod = true;
			}
		}
		if ($('#codSwiftGroup').is(':visible')) {
			const swift = (GK.state.additionalInfo && GK.state.additionalInfo.codSwiftCode || '').replace(/\s/g, '').toUpperCase();
			if (swift) {
				if (!SWIFT_BIC_PATTERN.test(swift)) r.codSwiftFormat = true;
			} else if (isCodSwiftRequired()) {
				r.codSwiftRequired = true;
			}
		}
		return Object.keys(r).length ? r : null;
	}

	function isPointLikeCollectionType(collectionType) {
		return collectionType === 'POINT' || collectionType === 'CROSSBORDER';
	}

	function getSelectedCollectionTypeForApi() {
		const ps = GK.state.pickedService || {};
		const allowed = Array.isArray(ps.collectionTypes) ? ps.collectionTypes : [];
		const selectedSendingType = $('input[name=pickup_type]:checked').val() || 'PICKUP';
		const allowPickup = allowed.indexOf('PICKUP') > -1;
		const allowPoint = allowed.indexOf('POINT') > -1;
		const allowCrossborder = allowed.indexOf('CROSSBORDER') > -1;

		if (!allowed.length) {
			return selectedSendingType === 'POINT' ? 'POINT' : 'PICKUP';
		}

		// UI has two radio options only (PICKUP/POINT), so POINT can map to CROSSBORDER.
		if (selectedSendingType === 'POINT') {
			if (allowPoint) return 'POINT';
			if (allowCrossborder) return 'CROSSBORDER';
		}

		if (selectedSendingType === 'PICKUP' && allowPickup) {
			return 'PICKUP';
		}

		if (allowPickup) return 'PICKUP';
		if (allowPoint) return 'POINT';
		if (allowCrossborder) return 'CROSSBORDER';

		return allowed[0] || 'PICKUP';
	}

	function buildOrderData() {
		const s = GK.state;
		const collectionType = getSelectedCollectionTypeForApi();
		const addons = generateAdditionalServices(s.serviceOptions || [], s.additionalInfo || {});

		const data = {
			shipment: {
				length: s.pickedService && s.pickedService.packageInfo ? s.pickedService.packageInfo.length : null,
				width: s.pickedService && s.pickedService.packageInfo ? s.pickedService.packageInfo.width : null,
				height: s.pickedService && s.pickedService.packageInfo ? s.pickedService.packageInfo.height : null,
				weight: s.pickedService && s.pickedService.packageInfo ? s.pickedService.packageInfo.weight : null,
				productId: s.pickedService ? s.pickedService.id : null,
				quantity: s.pickedService && s.pickedService.packageInfo ? s.pickedService.packageInfo.count : 1
			},
			senderAddress: {},
			receiverAddress: {},
			content: s.pickedService && s.pickedService.packageInfo ? s.pickedService.packageInfo.content : '',
			paymentId: s.additionalInfo.paymentType,
			collectionType: collectionType,
			agreements: {},
			originId: "PRESTASHOP_API"
		};
		// GK's validate/order endpoints reject an explicit empty array ("Pole nie może
		// być puste" / "field cannot be empty") - omit the key entirely instead of
		// sending `addons: []` when nothing is selected yet.
		if (addons.length) { data.addons = addons; }

		// Add pickup data for PICKUP collection type, but skip when ORDERED_COURIER is selected
		// (courier is already booked — API does not require time range in that case)
		if (collectionType === 'PICKUP') {
			const $orderedCb = $('.addon-checkbox[data-category="ORDERED_COURIER"]');
			if (!($orderedCb.length > 0 && $orderedCb.is(':checked'))) {
				data.pickup = generatePickup(s.additionalInfo || {});
			}
		}


		// map sender/receiver
		['sender','receiver'].forEach(function(role){
			const src = s[role] || {};
			const dst = (role === 'sender') ? data.senderAddress : data.receiverAddress;
			dst.name = src.name;
			dst.city = src.city;

			dst.street = src.street;
			dst.houseNumber = src.houseNumber;

			dst.postCode = src.postalCode;
			dst.countryId = src.country && src.country.id;

			dst.phone = src.phone;

			dst.email = src.email;
			dst.contactPerson = src.contactPerson;

			// Add apartment number if exists
			if (src.apartmentNumber) {
				dst.apartmentNumber = src.apartmentNumber;
			}

			// Add pointId driven by API: customRequiredFields returns senderAddressPointId/receiverAddressPointId.
			// Fall back to service-based heuristic when customRequired not yet loaded.
			const cr = GK.state.customRequired;
			const deliveryIsToPoint = !!(s.pickedService && s.pickedService.deliveryTypes && s.pickedService.deliveryTypes.includes('POINT'));
			const isPointDelivery = cr
				? (role === 'sender' ? cr.senderAddressPointId === true : cr.receiverAddressPointId === true)
				: (isPointLikeCollectionType(collectionType) || (role === 'receiver' && deliveryIsToPoint));
			if (s.pickedService && isPointDelivery) {
				const carrierName = (s.pickedService.carrierName || '').toLowerCase();
				const serviceName = (s.pickedService.name || '').toLowerCase();
				const collectionTypes = s.pickedService.collectionTypes || [];

				// InPost - receiver and sender points
				if (carrierName.indexOf('inpost') > -1 && s.additionalInfo) {
					const pointKey = role === 'receiver' ? 'inPostReceiverPoint' : 'inPostSenderPoint';
					if (s.additionalInfo[pointKey] && s.additionalInfo[pointKey].id) {
						dst.pointId = s.additionalInfo[pointKey].id;
					}
				}
				// DHL - receiver and sender points
				else if (carrierName.indexOf('dhl') > -1 && s.additionalInfo) {
					const pointKey = role === 'receiver' ? 'dhlparcelReceiverPoint' : 'dhlparcelSenderPoint';
					if (s.additionalInfo[pointKey] && s.additionalInfo[pointKey].id) {
						dst.pointId = s.additionalInfo[pointKey].id;
					}
				}
				// Orlen/Ruch - receiver and sender points
				else if ((carrierName.indexOf('orlen') > -1 || carrierName.indexOf('ruch') > -1) && s.additionalInfo) {
					const pointKey = role === 'receiver' ? 'paczkaRuchReceiverPoint' : 'paczkaRuchSenderPoint';
					if (s.additionalInfo[pointKey] && s.additionalInfo[pointKey].id) {
						dst.pointId = s.additionalInfo[pointKey].id;
					}
				}
				// Poczta Polska - receiver and sender points
				else if (carrierName.indexOf('poczta') > -1 && s.additionalInfo) {
					const pointKey = role === 'receiver' ? 'pocztex48owpReceiverPoint' : 'pocztex48owpSenderPoint';
					if (s.additionalInfo[pointKey] && s.additionalInfo[pointKey].id) {
						dst.pointId = s.additionalInfo[pointKey].id;
					}
				}
				// DPD - receiver and sender points
				else if (carrierName.indexOf('dpd') > -1 && s.additionalInfo) {
					const pointKey = role === 'receiver' ? 'dpdpickupReceiverPoint' : 'dpdpickupSenderPoint';
					if (s.additionalInfo[pointKey] && s.additionalInfo[pointKey].id) {
						dst.pointId = s.additionalInfo[pointKey].id;
					}
				}
				// FedEx - receiver and sender points
				else if (carrierName.indexOf('fedex') > -1 && s.additionalInfo) {
					const pointKey = role === 'receiver' ? 'fedexReceiverPoint' : 'fedexSenderPoint';
					if (s.additionalInfo[pointKey] && s.additionalInfo[pointKey].id) {
						dst.pointId = s.additionalInfo[pointKey].id;
					}
				}
			}

			// Fallback: terminal/point ID — uses same role-aware isPointDelivery computed above
			if (isPointDelivery && src.terminal) {
				dst.pointId = src.terminal;
			}

			// Add state ID if exists (for international shipments) - only if > 0 like Angular
			// Use separate stateType for sender and receiver like Angular
			if (role === 'sender' && s.additionalInfo && s.additionalInfo.senderStateType && s.additionalInfo.senderStateType > 0) {
				dst.stateId = s.additionalInfo.senderStateType;
			} else if (role === 'receiver' && s.additionalInfo && s.additionalInfo.stateType && s.additionalInfo.stateType > 0) {
				dst.stateId = s.additionalInfo.stateType;
			}

		});

		// Add international shipment fields (like Angular)
		if (data.senderAddress.countryId !== data.receiverAddress.countryId) {
			if (s.additionalInfo && s.additionalInfo.declaredValue) {
				data.declaredValue = s.additionalInfo.declaredValue;
			}
			if (s.additionalInfo && s.additionalInfo.purpose) {
				data.purpose = s.additionalInfo.purpose;
			}
		}

		// Add the customs section only when GET /customs/config actually returned
		// fields for this route/carrier (see fetchCustomsConfig()/renderCustomsSection()).
		if (Array.isArray(GK.state.customsFields) && GK.state.customsFields.length && GK.state.customsData) {
			data.customs = buildCustomsPayload(GK.state.customsFields, GK.state.customsData);
		}
		// orderHash is NOT added here on purpose: this same object is also POSTed to
		// order/validate (both from placeOrder()'s pre-flight check and from
		// debouncedFullOrderValidate()), and that endpoint rejects it outright
		// (confirmed live: {"orderHash":"Nadmiarowe pole."}). It only belongs on the
		// real POST order call - see placeOrder(), which adds it to its own copy of
		// this data right before that specific request.

		// Add declared value if exists (regardless of international)
		if (s.additionalInfo && s.additionalInfo.declaredValue) {
			data.declaredValue = s.additionalInfo.declaredValue;
		}

		return data;
	}

	// Lightweight senderAddress/receiverAddress-only payload for GK's partial order
	// validation (POST order/validate), used before a service is even picked (page
	// load, sender/receiver edit) - full buildOrderData() isn't safe to call yet
	// since it depends on GK.state.pickedService.
	function buildAddressOnlyPayload() {
		const s = GK.state;
		const build = function(src) {
			src = src || {};
			const dst = {
				name: src.name,
				city: src.city,
				street: src.street,
				houseNumber: src.houseNumber,
				postCode: src.postalCode,
				countryId: src.country && src.country.id,
				phone: src.phone,
				email: src.email,
				contactPerson: src.contactPerson
			};
			if (src.apartmentNumber) { dst.apartmentNumber = src.apartmentNumber; }
			return dst;
		};
		const senderAddress = build(s.sender);
		const receiverAddress = build(s.receiver);
		// stateId matters for customs (e.g. US state) even though it's not needed for
		// the plain address-only validation this was originally built for.
		if (s.additionalInfo && s.additionalInfo.senderStateType > 0) { senderAddress.stateId = s.additionalInfo.senderStateType; }
		if (s.additionalInfo && s.additionalInfo.stateType > 0) { receiverAddress.stateId = s.additionalInfo.stateType; }
		return { senderAddress: senderAddress, receiverAddress: receiverAddress };
	}

	// GK reports sender/receiver field errors as flat keys like "receiverAddress[phone]"
	// (confirmed from a real 400 response: {"fields":{"receiverAddress[phone]":"..."}})
	// rather than a nested object, so match that shape explicitly and only fall back to
	// generic flattening for anything else (other top-level fields, or a differently
	// shaped body) instead of assuming one or the other everywhere.
	const ADDRESS_ERROR_KEY_RE = /^(sender|receiver)Address\[([A-Za-z0-9]+)\]$/;

	// Maps a GK address API field name to the "<role>_edit_<suffix>" input id used in
	// the sender/receiver edit modals (a couple of names differ: postCode -> postalCode
	// input, contactPerson -> contact input).
	const ADDRESS_FIELD_TO_EDIT_SUFFIX = {
		name: 'name', city: 'city', street: 'street', houseNumber: 'houseNumber',
		apartmentNumber: 'apartmentNumber', postCode: 'postalCode', phone: 'phone',
		email: 'email', contactPerson: 'contact'
	};

	// GK also reports addon field errors as flat keys like "addons[1][bankAccountNumber]"
	// or "addons[1][id]" (the "addon not selected/invalid" case) - the index is the
	// position of that entry in the `addons` array we sent, i.e. GK.state.serviceOptions[index].
	const ADDON_ERROR_KEY_RE = /^addons\[(\d+)\]\[([A-Za-z0-9]+)\]$/;

	// COD bank-detail fields are fixed, single inputs on the main form (not per
	// addon-instance), so a field name maps straight to one input id.
	const ADDON_FIELD_TO_INPUT_ID = {
		bankAccountNumber: 'codAccountInput',
		swiftCode: 'codSwiftInput',
		name: 'codAccountHolderInput',
		addressLine1: 'codAccountAddr1Input',
		addressLine2: 'codAccountAddr2Input'
	};

	// Reads the human, already-translated label straight from the edit modal's own
	// <label> instead of maintaining a second copy of those translations here.
	function addressFieldLabel(role, apiField) {
		const suffix = ADDRESS_FIELD_TO_EDIT_SUFFIX[apiField];
		const $input = suffix ? $('#' + role + '_edit_' + suffix) : $();
		const label = $input.length ? $input.closest('.form-group').find('label').first().text().trim() : '';
		return label || apiField;
	}

	function parseValidationErrors(errors) {
		const addressErrors = [];
		const addonErrors = [];
		const otherMessages = [];
		function prettifyKey(k) {
			return k.replace(/\[([A-Za-z0-9]+)\]/g, ' → $1').replace(/\./g, ' → ');
		}
		function walk(obj, keyPath) {
			if (obj == null) return;
			if (typeof obj === 'string') {
				const addrMatch = keyPath.match(ADDRESS_ERROR_KEY_RE);
				const addonMatch = !addrMatch && keyPath.match(ADDON_ERROR_KEY_RE);
				if (addrMatch) {
					addressErrors.push({ role: addrMatch[1], field: addrMatch[2], message: obj });
				} else if (addonMatch) {
					const index = parseInt(addonMatch[1], 10);
					addonErrors.push({ index: index, field: addonMatch[2], message: obj, option: (GK.state.serviceOptions || [])[index] || null });
				} else {
					otherMessages.push(keyPath ? (prettifyKey(keyPath) + ': ' + obj) : obj);
				}
			} else if (Array.isArray(obj)) {
				obj.forEach(function(m) { walk(m, keyPath); });
			} else if (typeof obj === 'object') {
				Object.keys(obj).forEach(function(k) { walk(obj[k], keyPath ? (keyPath + '.' + k) : k); });
			}
		}
		walk(errors, '');
		return { addressErrors: addressErrors, addonErrors: addonErrors, otherMessages: otherMessages };
	}

	const MANAGED_FIELD_ERROR_IDS = ['codSwiftInput', 'codAccountInput', 'codAccountHolderInput', 'codAccountAddr1Input', 'codAccountAddr2Input', 'codAmountInput', 'insuranceAmountInput', 'declaredValueInput'];

	function clearAddressValidationErrors() {
		$('#validationErrorsList').empty();
		$('#validationErrors').hide();
		$('#senderBox .panel, #receiverBox .panel').removeClass('gk-panel-error');
		$('#senderEditModal, #receiverEditModal').find('.gk-field-error').removeClass('gk-field-error');
		MANAGED_FIELD_ERROR_IDS.forEach(function(id) { $('#' + id).removeClass('gk-field-error'); });
		$('.gk-inline-field-error').remove();
	}

	// Highlights the specific input inside the (already open, or about to be opened)
	// edit modal, so fixing an error doesn't require hunting for which field it means.
	function highlightAddressField(role, field, message) {
		const suffix = ADDRESS_FIELD_TO_EDIT_SUFFIX[field];
		if (!suffix) return;
		const $input = $('#' + role + '_edit_' + suffix);
		if (!$input.length) return;
		$input.addClass('gk-field-error');
		if (!$input.next('.gk-inline-field-error').length) {
			$('<div class="gk-inline-field-error"></div>').text(message).insertAfter($input);
		}
	}

	function highlightFieldById(inputId, message) {
		const $input = $('#' + inputId);
		if (!$input.length) return;
		$input.addClass('gk-field-error');
		if (!$input.next('.gk-inline-field-error').length) {
			$('<div class="gk-inline-field-error"></div>').text(message).insertAfter($input);
		}
	}

	// For an "addon not selected/invalid" (field "id") error: highlight the amount
	// input driving that addon category (Additional options), since that's what the
	// merchant actually needs to fix (e.g. no in-range insurance addon matched yet).
	function highlightValueGroupInputForCategory(category, message) {
		const groupKey = Object.keys(VALUE_CATEGORY_GROUPS).find(function(gk) { return VALUE_CATEGORY_GROUPS[gk].categories.indexOf(category) !== -1; });
		if (!groupKey) return;
		highlightFieldById(VALUE_CATEGORY_GROUPS[groupKey].inputId, message);
	}

	// Renders order/validate's raw error body as a friendly, translated summary
	// ("Receiver - Phone: <message> [Fix]") instead of dumping technical API field
	// paths like "receiverAddress[phone]" or "addons[1][bankAccountNumber]", and ties
	// each error to its source: the sender/receiver panel (red outline, "Fix" link to
	// the edit modal) or the relevant COD/insurance/declared-value input on the main
	// form (red border + inline message under it).
	function showAddressValidationErrors(rawErrors) {
		clearAddressValidationErrors();
		const parsed = parseValidationErrors(rawErrors || {});
		if (!parsed.addressErrors.length && !parsed.addonErrors.length && !parsed.otherMessages.length) return;

		const iv = window.InitialValues || {};
		const $ul = $('#validationErrorsList');

		parsed.addressErrors.forEach(function(err) {
			const roleLabel = err.role === 'sender' ? (iv.langSender || 'Sender') : (iv.langReceiver || 'Receiver');
			const fieldLabel = addressFieldLabel(err.role, err.field);
			const $li = $('<li></li>').text(roleLabel + ' — ' + fieldLabel + ': ' + err.message + ' ');
			$('<a href="#" class="gk-fix-address-error"></a>')
				.attr('data-role', err.role)
				.attr('data-field', err.field)
				.attr('data-message', err.message)
				.text(iv.langFix || 'Fix')
				.appendTo($li);
			$ul.append($li);

			$('#' + err.role + 'Box .panel').addClass('gk-panel-error');
			highlightAddressField(err.role, err.field, err.message);
		});

		parsed.addonErrors.forEach(function(err) {
			const optionName = err.option && err.option.name ? err.option.name : ('#' + (err.index + 1));
			const inputId = ADDON_FIELD_TO_INPUT_ID[err.field];
			// "id" errors (addon missing/invalid) already name the addon in the message
			// itself (e.g. "Dodatek ubezpieczenie musi być wybrany.") - prefixing the
			// addon name again would just be redundant noise.
			const text = inputId
				? (optionName + ' — ' + $('#' + inputId).closest('.form-group').find('label').first().text().trim() + ': ' + err.message)
				: err.message;
			$ul.append($('<li></li>').text(text));

			if (inputId) {
				highlightFieldById(inputId, err.message);
			} else if (err.option && err.option.category) {
				highlightValueGroupInputForCategory(err.option.category, err.message);
			}
		});

		parsed.otherMessages.forEach(function(msg) {
			$ul.append($('<li></li>').text(msg));
		});

		$('#validationErrors').show();
	}

	// Fire-and-forget partial validation: independent of order/price (mirrors how
	// the sibling shoper app runs them side by side, rather than gating price on it),
	// since this admin form recalculates price on nearly every keystroke and a hard
	// gate would make the whole form feel sluggish.
	function postOrderValidate(payload) {
		const token = window.InitialValues && window.InitialValues.token;
		const headers = {
			'Content-Type': 'application/json',
			'accept-language': (window.InitialValues && window.InitialValues.isoCode === 'pl') ? 'pl' : 'en',
			'x-auth-token': token || ''
		};
		return fetch(gkApiBase() + 'order/validate', {
			method: 'POST',
			headers: headers,
			body: JSON.stringify(payload)
		}).then(function(resp) {
			if (resp.status === 204) {
				clearAddressValidationErrors();
				return;
			}
			return resp.json().then(function(body) {
				const errors = (body && (body.fields || body.errors || body.violations)) || body || {};
				showAddressValidationErrors(errors);
			});
		}).catch(function() {
			// Network hiccup on a non-blocking pre-check - ignore, the final
			// order/validate call before actual submission still guards placeOrder().
		});
	}

	let _fullValidateAbortController = null;
	let _fullValidateDebounceTimer = null;

	// Debounced/abortable order/validate using the full buildOrderData() payload,
	// called alongside order/price once a service is picked (recalcOrderPrice()), and
	// directly by any other field that feeds buildOrderData() but doesn't affect price
	// (COD bank details, purpose, SENT number, states, pickup date/time).
	function debouncedFullOrderValidate() {
		if (!GK.state.pickedService) return;
		if (_fullValidateDebounceTimer) clearTimeout(_fullValidateDebounceTimer);
		_fullValidateDebounceTimer = setTimeout(function() {
			if (_fullValidateAbortController) { _fullValidateAbortController.abort(); }
			_fullValidateAbortController = (typeof AbortController !== 'undefined') ? new AbortController() : null;
			const token = window.InitialValues && window.InitialValues.token;
			const headers = {
				'Content-Type': 'application/json',
				'accept-language': (window.InitialValues && window.InitialValues.isoCode === 'pl') ? 'pl' : 'en',
				'x-auth-token': token || ''
			};
			fetch(gkApiBase() + 'order/validate', {
				method: 'POST',
				headers: headers,
				body: JSON.stringify(buildOrderData()),
				signal: _fullValidateAbortController ? _fullValidateAbortController.signal : undefined
			}).then(function(resp) {
				if (resp.status === 204) {
					clearAddressValidationErrors();
					return;
				}
				return resp.json().then(function(body) {
					const errors = (body && (body.fields || body.errors || body.violations)) || body || {};
					showAddressValidationErrors(errors);
				});
			}).catch(function(e) {
				if (e && e.name === 'AbortError') return;
			});
		}, 800);
	}

	function generatePickup(additionalInfo) {
		const pickup = {
			date: additionalInfo.sendDate || (window.InitialValues && window.InitialValues.todayDate) || new Date().toISOString().split('T')[0]
		};

		if (additionalInfo.timeRange && additionalInfo.timeRange.timeFrom) {
			pickup.timeFrom = additionalInfo.timeRange.timeFrom;
		}
		if (additionalInfo.timeRange && additionalInfo.timeRange.timeTo) {
			pickup.timeTo = additionalInfo.timeRange.timeTo;
		}

		return pickup;
	}

	// Some addon categories need extra data captured only once the addon is checked,
	// mirroring GK's own web app (its Angular UI renders an "ardn-product-addon-
	// category-fields" block for these, e.g. marketplace name + IOSS/OMP number for
	// DUTY_DDP_MARKETPLACE_UK - "VAT settled by marketplace (UK)"). GK's own API docs
	// only document this pattern for CASH_ON_DELIVERY (bankAccountNumber/swiftCode/
	// name/addressLine1 - handled separately above) and explicitly say "for specific
	// add-on categories, additional parameters are required" without listing them, so
	// these key names are a best-effort guess from the field's on-screen label, NOT
	// a confirmed API contract - verify with GlobKurier support before relying on this
	// for real UK IOSS/VAT compliance data.
	// RETURN_SHIPMENT_ADDRESS field names/shape confirmed against two independent
	// real sources: shoper's own working production payload (kafelman/index.php)
	// and GlobKurier's backend OrderValidator/AddonsFactory/DTO code in the
	// globkurier.pl repo - both agree on a flat name/street/houseNumber/
	// apartmentNumber/postCode/city set with no phone/email/surname, despite
	// GK's own public API docs listing those as required (confirmed stale there:
	// the validator, DTO and passing Behat feature scenarios all omit them).
	// `countryId` isn't user-typed here - it's auto-set from the sender's own
	// country when the addon is built (see generateAdditionalServices), matching
	// shoper's UI which locks this to the merchant's own (PL-only there) country.
	const ADDON_CATEGORY_EXTRA_FIELDS = {
		DUTY_DDP_MARKETPLACE_UK: [
			{ key: 'marketplaceName', labelKey: 'langMarketplaceName', placeholder: 'np. Amazon' },
			{ key: 'iossNumber', labelKey: 'langIossNumber', placeholder: 'np. IM1234567890' }
		],
		RETURN_SHIPMENT_ADDRESS: [
			{ key: 'name', labelKey: 'langReturnShipmentName', placeholder: 'np. Magazyn zwrotów' },
			{ key: 'street', labelKey: 'langReturnShipmentStreet', placeholder: 'np. Kwiatowa' },
			{ key: 'houseNumber', labelKey: 'langReturnShipmentHouseNumber', placeholder: 'np. 12' },
			{ key: 'apartmentNumber', labelKey: 'langReturnShipmentApartmentNumber', placeholder: '' },
			{ key: 'postCode', labelKey: 'langReturnShipmentPostCode', placeholder: 'np. 00-001' },
			{ key: 'city', labelKey: 'langReturnShipmentCity', placeholder: 'np. Warszawa' }
		]
	};

	function generateAdditionalServices(serviceOptions, additionalInfo) {
		if (!Array.isArray(serviceOptions)) return [];

		const addons = [];
		serviceOptions.forEach(function(option) {
			const addon = { id: option.id };

			// Only add value field for specific categories (like Angular does)
			if (option.category === 'CASH_ON_DELIVERY') {
				addon.value = additionalInfo.codAmount || '';
				if (additionalInfo.codAccount) addon.bankAccountNumber = additionalInfo.codAccount.replace(/\s/g, '');
				if (additionalInfo.codSwiftCode) addon.swiftCode = additionalInfo.codSwiftCode.replace(/\s/g, '').toUpperCase();
				if (additionalInfo.codAccountHolder) addon.name = additionalInfo.codAccountHolder;
				if (additionalInfo.codAccountAddr1) addon.addressLine1 = additionalInfo.codAccountAddr1;
				if (additionalInfo.codAccountAddr2) addon.addressLine2 = additionalInfo.codAccountAddr2;
			} else if (option.category === 'INSURANCE' || option.category === 'INSURANCE_CARGO') {
				addon.value = additionalInfo.insuranceAmount || '';
			} else if (option.category === 'DECLARED_VALUE') {
				addon.value = additionalInfo.declaredValue || '';
			} else if (option.category === 'SENT' && option.sentNumber) {
				addon.sentNumber = option.sentNumber;
			} else if (option.category === 'RETURN_SHIPMENT_ADDRESS') {
				addon.name = option.name || '';
				addon.street = option.street || '';
				addon.houseNumber = option.houseNumber || '';
				if (option.apartmentNumber) { addon.apartmentNumber = option.apartmentNumber; }
				addon.postCode = option.postCode || '';
				addon.city = option.city || '';
				addon.countryId = (GK.state.sender && GK.state.sender.country && GK.state.sender.country.id) || 1;
				addon.fields = [];
			} else if (ADDON_CATEGORY_EXTRA_FIELDS[option.category]) {
				ADDON_CATEGORY_EXTRA_FIELDS[option.category].forEach(function(f) {
					if (option[f.key]) { addon[f.key] = option[f.key]; }
				});
			}
			// For other addons, don't add value field unless explicitly provided

			addons.push(addon);
		});

		return addons;
	}

	function placeOrder() {
		clearErrors();
		const err = validate();
		if (err) { showValidationErrors(err); return; }
		if (!GK.state.pickedService) return;

		// Validate pickup date and time
		const collectionType = getSelectedCollectionTypeForApi();
		const $orderedCbValidate = $('.addon-checkbox[data-category="ORDERED_COURIER"]');
		const orderedCourierSelected = $orderedCbValidate.length > 0 && $orderedCbValidate.is(':checked');

		if (collectionType === 'PICKUP' && !orderedCourierSelected) {
			const sendDate = $('#sendDateInput').val();
			const timeRange = $('#pickupTimeSelect').val();
			if (!sendDate) {
				showOrderErrors({ pickup: 'Please select pickup date' });
				return;
			}
			if (!timeRange) {
				showOrderErrors({ pickup: 'Please select pickup time range' });
				return;
			}
			// Validate that the date is not in the past
			const today = new Date().toISOString().split('T')[0];
			if (sendDate < today) {
				showOrderErrors({ pickup: 'Pickup date cannot be in the past' });
				return;
			}
			// Check if date is in available dates
			if (GK.state.availablePickupDates && GK.state.availablePickupDates.length > 0) {
				if (!GK.state.availablePickupDates.includes(sendDate)) {
					showOrderErrors({ pickup: 'Pickup date is not available, please select another date' });
					return;
				}
			} else {
				// If no available dates fetched, use today or tomorrow as fallback
				const today = new Date().toISOString().split('T')[0];
				const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
				if (sendDate < today) {
					sendDate = today; // Use today if date is in the past
				}
			}
		}

		// Validate international shipment fields
		if (GK.state.sender && GK.state.sender.country && GK.state.receiver && GK.state.receiver.country &&
			GK.state.sender.country.id !== GK.state.receiver.country.id) {
			if (!GK.state.additionalInfo || !GK.state.additionalInfo.purpose) {
				showOrderErrors({ purpose: 'Purpose is required for international shipments' });
				return;
			}
			if (!GK.state.additionalInfo || !GK.state.additionalInfo.declaredValue) {
				showOrderErrors({ declaredValue: 'Declared value is required for international shipments' });
				return;
			}
		}

		// Block placing the order while a customs declaration is required (this route
		// returned fields from /customs/config) but not yet complete - opens the
		// modal and highlights exactly what's missing instead of letting the order
		// go through and fail server-side on POST /order.
		if (GK.state.customsFields && GK.state.customsFields.length && !isCustomsFormComplete()) {
			showOrderErrors({ customs: 'Customs declaration must be completed before placing the order' });
			$('#customsModal').modal('show');
			highlightIncompleteCustomsFields();
			return;
		}

		// Validate required addons
		if (GK.state.customRequired && GK.state.customRequired.requiredAddons) {
			const requiredAddons = GK.state.customRequired.requiredAddons;
			const selectedAddonIds = (GK.state.serviceOptions || []).map(function(opt) { return opt.id; });
			const missingAddons = requiredAddons.filter(function(reqId) {
				return !selectedAddonIds.some(function(selId) { return (selId + '') === (reqId + ''); });
			});
			if (missingAddons.length > 0) {
				showOrderErrors({ addons: 'Required addons are missing: ' + missingAddons.join(', ') });
				return;
			}
		}

		setProcessing(true);
		const orderData = buildOrderData();
		const token = window.InitialValues && window.InitialValues.token;
		const reqHeaders = {
			'Content-Type': 'application/json',
			'accept-language': (window.InitialValues && window.InitialValues.isoCode === 'pl') ? 'pl' : 'en',
			'x-auth-token': token || ''
		};

		fetch(gkApiBase() + 'order/validate', {
			method: 'POST',
			headers: reqHeaders,
			body: JSON.stringify(orderData)
		}).then(function(validateResp) {
			if (validateResp.status !== 204) {
				return validateResp.json().then(function(body) { throw body || {}; });
			}
			// orderHash only goes on the real order-creation call (order/validate
			// rejects it) - reuses the id from order/customs/calculation, if that ran,
			// so GK can serve the already-computed duty estimate instead of redoing it.
			const createData = Object.assign({}, orderData);
			if (GK.state.orderHash && createData.customs) { createData.orderHash = GK.state.orderHash; }
			return fetch(gkApiBase() + 'order', {
				method: 'POST',
				headers: reqHeaders,
				body: JSON.stringify(createData)
			}).then(function(r){ return r.json(); })
			.then(function(resp){
				if (!resp || !resp.number) throw resp || {};
				// Save in shop
				const moduleApiUrl = (window.InitialValues && window.InitialValues.moduleApiUrl) || '';
				const dataToSend = {
					gkId: resp.number,
					hash: resp.hash || '',
					orderId: (window.InitialValues && window.InitialValues.prestaOrderId) || null,
					crateDate: null,
					receiver: GK.state.receiver && GK.state.receiver.name,
					content: orderData.content,
					weight: orderData.shipment.weight,
					carrier: GK.state.pickedService ? (GK.state.pickedService.carrierName + ' - ' + GK.state.pickedService.name) : '',
					comments: '',
					cod: GK.state.additionalInfo && GK.state.additionalInfo.codAmount ? GK.state.additionalInfo.codAmount : 0,
					payment: GK.state.additionalInfo && GK.state.additionalInfo.paymentType,
					hasCustoms: !!createData.customs
				};
				const gkId = resp.number;
				const gkHash = resp.hash || '';
				const url = moduleApiUrl + '&ajax=1&action=addNewGlobOrder&data=' + encodeURIComponent(JSON.stringify(dataToSend));
				return fetch(url).then(function(r){ return r.json(); }).then(function(saved){
					const trackingFromPs = saved && saved.trackingNumber ? saved.trackingNumber : null;
					showOrderPlaced({ gkId: gkId, hash: gkHash, trackingNumber: trackingFromPs, hasCustoms: dataToSend.hasCustoms });
					if (!trackingFromPs && gkHash) {
						startTrackingPoll(gkId, gkHash, moduleApiUrl);
					}
				});
			});
		})
		.catch(function(e){
			showOrderErrors(e && e.fields ? e.fields : { common: 'Błąd podczas składania zamówienia' });
		})
		.finally(function(){ setProcessing(false); });
	}

	function bind() {
		$(document).on('click', '#orderErrorClose', function(){ $('#orderErrorBox').hide(); });
		$(document).on('click', '#validationErrorClose', function(){ $('#validationErrorBox').hide(); });
		// "Fix" link inside the address validation summary: opens the relevant edit
		// modal (reusing its own open/populate handler) and highlights the exact field.
		$(document).on('click', '.gk-fix-address-error', function(e){
			e.preventDefault();
			const role = $(this).data('role');
			const field = $(this).data('field');
			const message = $(this).data('message');
			$('#' + role + 'ChangeLink').trigger('click');
			setTimeout(function(){ highlightAddressField(role, field, message); }, 0);
		});
		// --- Customs clearance form ------------------------------------------------
		$(document).on('click', '#openCustomsModalBtn', function(){ $('#customsModal').modal('show'); });
		// The modal has no dismiss/backdrop-close (data-backdrop="static", data-keyboard=
		// "false" on #customsModal) - the only way out is this button, which blocks
		// closing while required fields are still missing instead of silently losing
		// the merchant's not-yet-valid declaration.
		$(document).on('click', '#customsModalSaveBtn', function(){
			const hasFields = GK.state.customsFields && GK.state.customsFields.length;
			if (!hasFields || isCustomsFormComplete()) {
				$('#customsModalValidationMsg').hide();
				$('.gk-customs-field').removeClass('has-error');
				$('#customsModal').modal('hide');
				return;
			}
			highlightIncompleteCustomsFields();
			$('#customsModalValidationMsg').show();
			const $first = $('.gk-customs-field.has-error').first();
			if ($first.length) { $first[0].scrollIntoView({ block: 'center', behavior: 'smooth' }); }
		});
		$(document).on('input change', '.gk-customs-input', function(){
			const $el = $(this);
			$el.closest('.form-group').removeClass('has-error');
			const path = parseCustomsPath($el.data('path'));
			if ($el.hasClass('gk-customs-multi')) {
				const arr = customsPathGet(GK.state.customsData, path) || [];
				const val = $el.val();
				const idx = arr.indexOf(val);
				if ($el.is(':checked') && idx === -1) { arr.push(val); }
				else if (!$el.is(':checked') && idx !== -1) { arr.splice(idx, 1); }
				customsPathSet(GK.state.customsData, path, arr);
			} else {
				customsPathSet(GK.state.customsData, path, $el.val());
			}
			// Dual-language fields: the counter reflects the COMBINED "PL ;; EN" wire
			// value (see customsDualCombinedLength), so it has to be recomputed off both
			// sibling inputs together rather than this input's own length alone.
			const lastSeg = path[path.length - 1];
			if (lastSeg === 'pl' || lastSeg === 'en') {
				const rowPath = path.slice(0, -1);
				const field = customsFieldByPath(rowPath.join('.'));
				const maxLen = field && customsLengthMax(field);
				if (maxLen != null) {
					const rowVal = customsPathGet(GK.state.customsData, rowPath) || {};
					const combinedLen = customsDualCombinedLength(rowVal.pl, rowVal.en);
					$el.closest('.gk-customs-field').find('.gk-customs-charcount')
						.text(combinedLen + '/' + maxLen)
						.toggleClass('gk-customs-charcount-over', combinedLen > maxLen);
				}
			}
			if (path.length === 1 && path[0] === 'currency') {
				$('.gk-customs-currency-addon').text($el.val());
			}
			validateCustomsFieldPattern($el);
			recalcCustomsComputedFields();
			debouncedFullOrderValidate();
		});
		$(document).on('click', '.gk-customs-add-row', function(){
			const collPath = parseCustomsPath($(this).data('collection-path'));
			const field = (GK.state.customsFields || []).find(function(f){ return f.name === collPath[0]; });
			if (!field) return;
			const arr = customsPathGet(GK.state.customsData, collPath) || [];
			arr.push(buildCustomsDefaultValue({ compound: true, fields: field.fields }));
			customsPathSet(GK.state.customsData, collPath, arr);
			const idx = arr.length - 1;
			$('.gk-customs-collection-rows[data-collection-path="' + collPath.join('.') + '"]').append(renderCustomsCollectionRow(field, collPath, idx));
			updateCustomsRemoveButtons(collPath.join('.'));
			recalcCustomsComputedFields();
			debouncedFullOrderValidate();
		});
		$(document).on('click', '.gk-customs-remove-row', function(){
			const collPath = parseCustomsPath($(this).data('collection-path'));
			const field = (GK.state.customsFields || []).find(function(f){ return f.name === collPath[0]; });
			if (!field) return;
			const arr = customsPathGet(GK.state.customsData, collPath) || [];
			if (arr.length <= 1) return; // always keep at least one commodity row
			const idx = parseInt($(this).data('row-index'), 10);
			arr.splice(idx, 1);
			customsPathSet(GK.state.customsData, collPath, arr);
			const $rowsContainer = $('.gk-customs-collection-rows[data-collection-path="' + collPath.join('.') + '"]').empty();
			arr.forEach(function(_, i){ $rowsContainer.append(renderCustomsCollectionRow(field, collPath, i)); });
			updateCustomsRemoveButtons(collPath.join('.'));
			recalcCustomsComputedFields();
			debouncedFullOrderValidate();
		});
		// PL -> EN translation for the dual-language commodity fields (description/composition/purpose).
		$(document).on('click', '.gk-customs-translate', function(){
			const $btn = $(this);
			const pathStr = $btn.data('path');
			const $plInput = $('.gk-customs-input[data-path="' + pathStr + '.pl"]');
			const plVal = $plInput.val();
			if (!plVal) {
				// Silently doing nothing here (the old behavior) reads as a broken
				// button when composition/purpose haven't been typed in yet - flash the
				// PL field instead so it's clear WHY nothing happened.
				$plInput.trigger('focus').closest('.form-group').addClass('has-error');
				setTimeout(function(){ $plInput.closest('.form-group').removeClass('has-error'); }, 1200);
				return;
			}
			$btn.prop('disabled', true);
			$btn.find('.gk-customs-translate-icon').hide();
			$btn.find('.gk-customs-translate-spinner').show();
			fetch(gkApiBase() + 'translate', {
				method: 'POST',
				headers: Object.assign({ 'Content-Type': 'application/json' }, buildHeaders()),
				body: JSON.stringify({ text: plVal, sourceLanguage: 'pl', targetLanguage: 'en' })
			}).then(function(r){
				// Confirmed live: /translate works fine with a valid token. Without this
				// check, an error response (e.g. an expired token, returned as 401 or
				// even a bare 500 per this API's own inconsistency observed elsewhere
				// this session) still has no `translatedText` field, so the old code
				// silently "succeeded" with an empty string instead of surfacing the
				// failure - looked exactly like the button doing nothing.
				if (!r.ok) { throw new Error('translate request failed: ' + r.status); }
				return r.json();
			}).then(function(resp){
				let en = (resp && resp.translatedText) || '';
				// The combined "PL ;; EN" wire value shares one Length budget (see
				// customsDualCombinedLength) - a translation that would push the pair
				// over it gets truncated to whatever room is actually left for EN.
				const field = customsFieldByPath(pathStr);
				const maxLen = field && customsLengthMax(field);
				if (maxLen != null) {
					const budget = Math.max(0, maxLen - plVal.length - 4);
					en = en.substring(0, budget);
				}
				customsPathSet(GK.state.customsData, parseCustomsPath(pathStr).concat(['en']), en);
				const $enInput = $('.gk-customs-input[data-path="' + pathStr + '.en"]').val(en);
				if (maxLen != null) {
					$enInput.closest('.gk-customs-field').find('.gk-customs-charcount')
						.text(customsDualCombinedLength(plVal, en) + '/' + maxLen)
						.toggleClass('gk-customs-charcount-over', false);
				}
				debouncedFullOrderValidate();
			}).catch(function(){
				// Leaves whatever EN already had (never overwrite good data with an
				// empty/failed translation) and flashes the EN field red so the
				// merchant knows the click did register but the call failed - a stale
				// token (see gkApiBase()'s callers elsewhere) is the most likely cause.
				const $enInput = $('.gk-customs-input[data-path="' + pathStr + '.en"]');
				$enInput.closest('.form-group').addClass('has-error');
				setTimeout(function(){ $enInput.closest('.form-group').removeClass('has-error'); }, 2000);
			}).finally(function(){
				$btn.prop('disabled', false);
				$btn.find('.gk-customs-translate-spinner').hide();
				$btn.find('.gk-customs-translate-icon').show();
			});
		});
		// HS code suggestion, built from the commodity row's own PL description/composition/purpose.
		$(document).on('click', '.gk-customs-hs-lookup', function(){
			const $btn = $(this);
			const path = parseCustomsPath($btn.data('path'));
			const rowPath = path.slice(0, -1);
			const row = customsPathGet(GK.state.customsData, rowPath) || {};
			const itemDescription = [row.description, row.composition, row.purpose]
				.map(function(f){ return f && f.pl; })
				.filter(Boolean)
				.join(', ');
			const receiverCountryId = GK.state.receiver && GK.state.receiver.country && GK.state.receiver.country.id;
			if (!itemDescription || !receiverCountryId) return;
			$btn.prop('disabled', true);
			const params = new URLSearchParams({ receiverCountryId: receiverCountryId, itemDescription: itemDescription });
			fetch(gkApiBase() + 'order/customs/hsCode?' + params.toString(), { headers: buildHeaders() })
				.then(function(r){ return r.json(); })
				.then(function(resp){
					if (resp && resp.hsCode) {
						customsPathSet(GK.state.customsData, path, resp.hsCode);
						$('.gk-customs-input[data-path="' + $btn.data('path') + '"]').val(resp.hsCode);
						debouncedFullOrderValidate();
					}
				}).catch(function(){}).finally(function(){ $btn.prop('disabled', false); });
		});

		$(document).on('click', '#sendOrderBtn', placeOrder);
		$(document).on('click', '#downloadLabelBtn', function(){
			const order = GK.state.orderPlaced;
			if (!order || !order.hash) return;
			fetch(
				gkApiBase() + 'order/labels?orderHashes[0]=' + encodeURIComponent(order.hash),
				{ headers: buildHeaders() }
			).then(function(r){ return r.blob(); }).then(function(blob){
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = (order.gkId || 'label') + '.pdf';
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			});
		});
	}

function initStateFromInitialValues() {
    const iv = window.InitialValues || {};
		GK.state.sender = {
			name: (iv.sender && iv.sender.name) || '',
			street: (iv.sender && iv.sender.street) || '',
			houseNumber: (iv.sender && iv.sender.houseNumber) || '',
			apartmentNumber: (iv.sender && iv.sender.apartmentNumber) || '',
			postalCode: (iv.sender && iv.sender.postCode) || '',
			city: (iv.sender && iv.sender.city) || '',
			country: iv.sender && iv.sender.countryCode ? { id: null, isoCode: iv.sender.countryCode } : null,
			contactPerson: (iv.sender && iv.sender.personName) || '',
			phone: (iv.sender && iv.sender.phone) || '',
			email: (iv.sender && iv.sender.email) || ''
		};
        const rv = iv.receiver || {};
		GK.state.receiver = {
			name: rv.personName || rv.name || '',
			street: rv.street || '',
			houseNumber: rv.houseNumber || '',
			apartmentNumber: rv.apartmentNumber || '',
			postalCode: rv.postCode || rv.postalCode || '',
			city: rv.city || '',
			country: rv.countryId ? { id: rv.countryId, isoCode: (rv.countryCode || rv.countryIso || rv.isoCode || null) } : (rv.countryCode ? { id: null, isoCode: rv.countryCode } : null),
			contactPerson: rv.personName || '',
			phone: rv.phone || '',
			email: rv.email || ''
		};
		if (!GK.state.additionalInfo) GK.state.additionalInfo = {};
		// Initialize stateType from InitialValues if available
		// Only set stateType if stateId > 0 (like Angular logic)
		// NOTE: stateId from PrestaShop needs to be mapped to Globkurier state IDs
		if (iv.receiver && iv.receiver.stateId && iv.receiver.stateId > 0) {
			// For now, don't auto-set stateType from PrestaShop stateId
			// User should select state from Globkurier API list
			// GK.state.additionalInfo.stateType = iv.receiver.stateId;
		}
		// Initialize receiver points from InitialValues (like Angular)
		if (iv.terminalCode && iv.terminalType) {
			switch (iv.terminalType) {
				case 'inpost':
					GK.state.additionalInfo.inPostReceiverPoint = { id: iv.terminalCode };
					break;
				case 'inpost_cod':
				case 'inpostCod':
					GK.state.additionalInfo.inPostReceiverPoint = { id: iv.terminalCode };
					break;
				case 'ruch':
					GK.state.additionalInfo.paczkaRuchReceiverPoint = { id: iv.terminalCode };
					break;
				case 'pocztex48owp':
					GK.state.additionalInfo.pocztex48owpReceiverPoint = { id: iv.terminalCode };
					break;
				case 'dhlparcel':
					GK.state.additionalInfo.dhlparcelReceiverPoint = { id: iv.terminalCode };
					break;
				case 'dpdpickup':
					GK.state.additionalInfo.dpdpickupReceiverPoint = { id: iv.terminalCode };
					break;
			}
		}

		// Also set default sender point if available (like Angular)
		if (iv.defaultInPostPoint) {
			GK.state.additionalInfo.inPostSenderPoint = { id: iv.defaultInPostPoint };
		}

		// make sure UI reflects current international rules immediately
        try { updateEnabledOptionsUI(); } catch(e) {}
        try { preloadCountriesMap().then(ensureCountryIdsFromIso); } catch(e) { ensureCountryIdsFromIso(); }
	}

// Maps country.id by isoCode using /countries list (no hardcoded exceptions)
// Ports shoper's normalizeGkPhone()/GK_COUNTRY_CALLING_CODES logic: GK's API rejects
// a bare local-format number (e.g. PrestaShop's raw "0102030405" from a US address)
// with a generic "Nieprawidłowa wartość" - it expects the destination country's
// international calling code prepended. Idempotent: a number that's already
// "+<known calling code>..." or "00..." is trusted and returned unchanged, so this
// is safe to re-run on every country resolution instead of only once.
function normalizeGkPhone(raw, isoCode) {
    let value = (raw || '').replace(/[\s()-]/g, '');
    if (!value) return value;
    const codes = (window.GK && window.GK.countryCallingCodes) ? window.GK.countryCallingCodes : {};
    const callingCode = isoCode ? codes[isoCode.toUpperCase()] : null;

    if (value.substring(0, 3) === '+00') { return '+' + value.substring(3); }
    if (value.substring(0, 2) === '00') { return '+' + value.substring(2); }
    if (value[0] === '+') {
        const rest = value.substring(1);
        const knownCodes = Object.keys(codes).map(function(k){ return codes[k]; }).sort(function(a, b){ return b.length - a.length; });
        for (let i = 0; i < knownCodes.length; i++) {
            if (rest.substring(0, knownCodes[i].length) === knownCodes[i]) { return '+' + rest; }
        }
        value = rest;
    }
    if (!callingCode) { return value; }
    // A leading "0" is only a trunk prefix to strip under European-style local
    // dialing conventions. Italy already excepted itself (its numbers keep the 0
    // even internationally); NANP numbers (calling code "1": US, Canada...) don't
    // use a leading-0 trunk prefix at all - stripping one there just produces a
    // too-short number instead of fixing anything (confirmed live: a 10-digit US
    // number lost a digit here, GK then rejected it as "9 digits, expected 10").
    const skipLeadingZeroStrip = (isoCode && isoCode.toUpperCase() === 'IT') || callingCode === '1';
    if (value[0] === '0' && !skipLeadingZeroStrip) { value = value.substring(1); }
    return '+' + callingCode + value;
}

function ensureCountryIdsFromIso() {
    const s = GK.state;
    if (!s) return;
    const map = (window.GK && window.GK.countriesMap) ? window.GK.countriesMap : null;
    function normalizeCountry(country, fallbackId) {
        if (!country) return null;
        const iso = (country.isoCode || country.code || country.iso || '').toUpperCase();
        // if we have a countries map, override id based on ISO
        if (map && map[iso]) {
            country.id = map[iso];
            return country;
        }
        // fallback: use id from fallbackId (if provided)
        if (fallbackId) {
            country.id = fallbackId;
            return country;
        }
        // if id already set and no map/fallback, keep as is
        if (country.id) return country;
        // default fallback to Poland (country ID 1 in Globkurier)
        country.id = 1;
        return country;
    }
    if (s.sender && s.sender.country) {
        s.sender.country = normalizeCountry(s.sender.country, null);
        if (s.sender.phone) { s.sender.phone = normalizeGkPhone(s.sender.phone, s.sender.country.isoCode); }
    }
    if (s.receiver && s.receiver.country) {
        s.receiver.country = normalizeCountry(s.receiver.country, null);
        if (s.receiver.phone) { s.receiver.phone = normalizeGkPhone(s.receiver.phone, s.receiver.country.isoCode); }
    }
}

// Fetch countries once and build ISO -> ID and ISO -> calling-code maps
function preloadCountriesMap() {
    if (!window.GK) window.GK = {};
    if (window.GK.countriesMapLoaded) return Promise.resolve(window.GK.countriesMap || {});
    const url = gkApiBase() + 'countries';
    return fetch(url, { headers: buildHeaders() })
        .then(function(r){ return r.json(); })
        .then(function(list){
            const map = {};
            const callingCodes = {};
            if (Array.isArray(list)) {
                list.forEach(function(c){
                    if (!c || !c.isoCode) return;
                    const iso = (c.isoCode + '').toUpperCase();
                    map[iso] = c.id;
                    if (c.phonePrefix) { callingCodes[iso] = (c.phonePrefix + '').replace('+', ''); }
                });
            }
            window.GK.countriesMap = map;
            window.GK.countryCallingCodes = callingCodes;
            window.GK.countriesMapLoaded = true;
            return map;
        })
        .catch(function(){ window.GK.countriesMapLoaded = true; return {}; });
}

function renderAddressBoxes() {
    // populate sender
    $('#sender_name').val(GK.state.sender.name);
    $('#sender_street').val(GK.state.sender.street);
    $('#sender_houseNumber').val(GK.state.sender.houseNumber);
    $('#sender_apartmentNumber').val(GK.state.sender.apartmentNumber);
    $('#sender_postalCode').val(GK.state.sender.postalCode);
    $('#sender_city').val(GK.state.sender.city);
    $('#sender_phone').val(GK.state.sender.phone);
    $('#sender_email').val(GK.state.sender.email);
    // populate receiver
    $('#receiver_name').val(GK.state.receiver.name);
    $('#receiver_street').val(GK.state.receiver.street);
    $('#receiver_houseNumber').val(GK.state.receiver.houseNumber);
    $('#receiver_apartmentNumber').val(GK.state.receiver.apartmentNumber);
    $('#receiver_postalCode').val(GK.state.receiver.postalCode);
    $('#receiver_city').val(GK.state.receiver.city);
    $('#receiver_phone').val(GK.state.receiver.phone);
    $('#receiver_email').val(GK.state.receiver.email);

    // bind
    $(document).on('input change', '#sender_name,#sender_street,#sender_houseNumber,#sender_apartmentNumber,#sender_postalCode,#sender_city,#sender_phone,#sender_email', function(){
        const id = this.id.replace('sender_','');
        GK.state.sender[id] = $(this).val();
        if (GK.state.sender.phone && GK.state.receiver.phone) { $('#validationErrorBox').hide(); }
    });
    $(document).on('input change', '#receiver_name,#receiver_street,#receiver_houseNumber,#receiver_apartmentNumber,#receiver_postalCode,#receiver_city,#receiver_phone,#receiver_email', function(){
        const id = this.id.replace('receiver_','');
        GK.state.receiver[id] = $(this).val();
        if (GK.state.sender.phone && GK.state.receiver.phone) { $('#validationErrorBox').hide(); }
    });
}

function populateDisplayPanels() {
    // Sender display
    if ($('#sender_display_name').length) {
        $('#sender_display_name').text(GK.state.sender.name || '');
        $('#sender_display_street').text(GK.state.sender.street || '');
        $('#sender_display_houseNumber').text(GK.state.sender.houseNumber || '');
        $('#sender_display_postalCode').text(GK.state.sender.postalCode || '');
        $('#sender_display_city').text(GK.state.sender.city || '');
        $('#sender_display_countryIso').text((window.InitialValues && window.InitialValues.sender && window.InitialValues.sender.countryCode) || '');
        $('#sender_display_contact').text(GK.state.sender.contactPerson || '');
        $('#sender_display_phone').text(GK.state.sender.phone || '');
        $('#sender_display_email').text(GK.state.sender.email || '');
    }
    // Receiver display
    if ($('#receiver_display_name').length) {
        $('#receiver_display_name').text(GK.state.receiver.name || '');
        $('#receiver_display_street').text(GK.state.receiver.street || '');
        $('#receiver_display_houseNumber').text(GK.state.receiver.houseNumber || '');
        $('#receiver_display_postalCode').text(GK.state.receiver.postalCode || '');
        $('#receiver_display_city').text(GK.state.receiver.city || '');
        $('#receiver_display_countryIso').text((window.InitialValues && window.InitialValues.receiver && window.InitialValues.receiver.countryCode) || '');
        $('#receiver_display_contact').text(GK.state.receiver.contactPerson || '');
        $('#receiver_display_phone').text(GK.state.receiver.phone || '');
        $('#receiver_display_email').text(GK.state.receiver.email || '');
    }
}

function populateReceiverPoints() {
    // Display receiver points in UI if they exist in state
    if (GK.state.additionalInfo) {
        if (GK.state.additionalInfo.inPostReceiverPoint && GK.state.additionalInfo.inPostReceiverPoint.id) {
            $('#inpostReceiverLabel').text('[' + GK.state.additionalInfo.inPostReceiverPoint.id + ']');
        }
        if (GK.state.additionalInfo.paczkaRuchReceiverPoint && GK.state.additionalInfo.paczkaRuchReceiverPoint.id) {
            $('#orlenReceiverLabel').text('[' + GK.state.additionalInfo.paczkaRuchReceiverPoint.id + ']');
        }
        if (GK.state.additionalInfo.pocztex48owpReceiverPoint && GK.state.additionalInfo.pocztex48owpReceiverPoint.id) {
            $('#pocztexReceiverLabel').text('[' + GK.state.additionalInfo.pocztex48owpReceiverPoint.id + ']');
        }
        if (GK.state.additionalInfo.dhlparcelReceiverPoint && GK.state.additionalInfo.dhlparcelReceiverPoint.id) {
            $('#dhlReceiverLabel').text('[' + GK.state.additionalInfo.dhlparcelReceiverPoint.id + ']');
        }
        if (GK.state.additionalInfo.dhlparcelSenderPoint && GK.state.additionalInfo.dhlparcelSenderPoint.id) {
            $('#dhlSenderLabel').text('[' + GK.state.additionalInfo.dhlparcelSenderPoint.id + ']');
        }
        if (GK.state.additionalInfo.dpdpickupReceiverPoint && GK.state.additionalInfo.dpdpickupReceiverPoint.id) {
            $('#dpdReceiverLabel').text('[' + GK.state.additionalInfo.dpdpickupReceiverPoint.id + ']');
        }

        // Also display sender points
        if (GK.state.additionalInfo.inPostSenderPoint && GK.state.additionalInfo.inPostSenderPoint.id) {
            $('#inpostSenderLabel').text('[' + GK.state.additionalInfo.inPostSenderPoint.id + ']');
        }
        if (GK.state.additionalInfo.dhlparcelSenderPoint && GK.state.additionalInfo.dhlparcelSenderPoint.id) {
            $('#dhlSenderLabel').text('[' + GK.state.additionalInfo.dhlparcelSenderPoint.id + ']');
        }
        if (GK.state.additionalInfo.paczkaRuchSenderPoint && GK.state.additionalInfo.paczkaRuchSenderPoint.id) {
            $('#orlenSenderLabel').text('[' + GK.state.additionalInfo.paczkaRuchSenderPoint.id + ']');
        }
        if (GK.state.additionalInfo.pocztex48owpSenderPoint && GK.state.additionalInfo.pocztex48owpSenderPoint.id) {
            $('#pocztexSenderLabel').text('[' + GK.state.additionalInfo.pocztex48owpSenderPoint.id + ']');
        }
        if (GK.state.additionalInfo.dpdpickupSenderPoint && GK.state.additionalInfo.dpdpickupSenderPoint.id) {
            $('#dpdSenderLabel').text('[' + GK.state.additionalInfo.dpdpickupSenderPoint.id + ']');
        }
        if (GK.state.additionalInfo.fedexReceiverPoint && GK.state.additionalInfo.fedexReceiverPoint.id) {
            $('#fedexReceiverLabel').text('[' + GK.state.additionalInfo.fedexReceiverPoint.id + ']');
        }
        if (GK.state.additionalInfo.fedexSenderPoint && GK.state.additionalInfo.fedexSenderPoint.id) {
            $('#fedexSenderLabel').text('[' + GK.state.additionalInfo.fedexSenderPoint.id + ']');
        }

        // Unified sender label (used for POINT/CROSSBORDER sending point UI).
        const senderPoint =
            GK.state.additionalInfo.inPostSenderPoint ||
            GK.state.additionalInfo.dhlparcelSenderPoint ||
            GK.state.additionalInfo.paczkaRuchSenderPoint ||
            GK.state.additionalInfo.pocztex48owpSenderPoint ||
            GK.state.additionalInfo.dpdpickupSenderPoint ||
            GK.state.additionalInfo.fedexSenderPoint ||
            null;
        if (senderPoint && senderPoint.id) {
            // We only know the terminal id here, not the full address label.
            $('#senderPointLabel').text('[' + senderPoint.id + ']');
        }
    }
}

function bindEditModals() {
    // Open Sender edit
    $(document).off('click', '#senderChangeLink').on('click', '#senderChangeLink', function(e){
        e.preventDefault();
        if (!$('#senderEditModal').length) return;
        $('#sender_edit_name').val(GK.state.sender.name || '');
        $('#sender_edit_street').val(GK.state.sender.street || '');
        $('#sender_edit_houseNumber').val(GK.state.sender.houseNumber || '');
        $('#sender_edit_apartmentNumber').val(GK.state.sender.apartmentNumber || '');
        $('#sender_edit_postalCode').val(GK.state.sender.postalCode || '');
        $('#sender_edit_city').val(GK.state.sender.city || '');
        $('#sender_edit_contact').val(GK.state.sender.contactPerson || '');
        $('#sender_edit_phone').val(GK.state.sender.phone || '');
        $('#sender_edit_email').val(GK.state.sender.email || '');
        $('#senderEditModal').modal('show');
    });
    // Save Sender edit
    $(document).off('click', '#saveSenderEdit').on('click', '#saveSenderEdit', function(){
        GK.state.sender.name = $('#sender_edit_name').val();
        GK.state.sender.street = $('#sender_edit_street').val();
        GK.state.sender.houseNumber = $('#sender_edit_houseNumber').val();
        GK.state.sender.apartmentNumber = $('#sender_edit_apartmentNumber').val();
        GK.state.sender.postalCode = $('#sender_edit_postalCode').val();
        GK.state.sender.city = $('#sender_edit_city').val();
        GK.state.sender.contactPerson = $('#sender_edit_contact').val();
        GK.state.sender.phone = $('#sender_edit_phone').val();
        GK.state.sender.email = $('#sender_edit_email').val();
        populateDisplayPanels();
        if (GK.state.sender.phone && GK.state.receiver.phone) { $('#validationErrorBox').hide(); }
        try { ensureCountryIdsFromIso(); } catch(e) {}
        postOrderValidate(buildAddressOnlyPayload());
        // A fixed address/phone can turn a previously-failing customs calculation
        // into a successful one (e.g. the phone-format error GK returns from this
        // same endpoint) - re-run it instead of leaving the estimate hidden forever.
        debouncedCustomsCalculation();
    });

    // Open Receiver edit
    $(document).off('click', '#receiverChangeLink').on('click', '#receiverChangeLink', function(e){
        e.preventDefault();
        if (!$('#receiverEditModal').length) return;
        $('#receiver_edit_name').val(GK.state.receiver.name || '');
        $('#receiver_edit_street').val(GK.state.receiver.street || '');
        $('#receiver_edit_houseNumber').val(GK.state.receiver.houseNumber || '');
        $('#receiver_edit_apartmentNumber').val(GK.state.receiver.apartmentNumber || '');
        $('#receiver_edit_postalCode').val(GK.state.receiver.postalCode || '');
        $('#receiver_edit_city').val(GK.state.receiver.city || '');
        $('#receiver_edit_contact').val(GK.state.receiver.contactPerson || '');
        $('#receiver_edit_phone').val(GK.state.receiver.phone || '');
        $('#receiver_edit_email').val(GK.state.receiver.email || '');
        $('#receiverEditModal').modal('show');
    });
    // Save Receiver edit
    $(document).off('click', '#saveReceiverEdit').on('click', '#saveReceiverEdit', function(){
        GK.state.receiver.name = $('#receiver_edit_name').val();
        GK.state.receiver.street = $('#receiver_edit_street').val();
        GK.state.receiver.houseNumber = $('#receiver_edit_houseNumber').val();
        GK.state.receiver.apartmentNumber = $('#receiver_edit_apartmentNumber').val();
        GK.state.receiver.postalCode = $('#receiver_edit_postalCode').val();
        GK.state.receiver.city = $('#receiver_edit_city').val();
        GK.state.receiver.contactPerson = $('#receiver_edit_contact').val();
        GK.state.receiver.phone = $('#receiver_edit_phone').val();
        GK.state.receiver.email = $('#receiver_edit_email').val();
        populateDisplayPanels();
        if (GK.state.sender.phone && GK.state.receiver.phone) { $('#validationErrorBox').hide(); }
        try { ensureCountryIdsFromIso(); } catch(e) {}
        postOrderValidate(buildAddressOnlyPayload());
        // A fixed address/phone can turn a previously-failing customs calculation
        // into a successful one (e.g. the phone-format error GK returns from this
        // same endpoint) - re-run it instead of leaving the estimate hidden forever.
        debouncedCustomsCalculation();
    });
}
	// ============ Services and Options (MVP) ============

function templateServicesPanel() { return ''; }

	function setPackageInfoFromInputs() {
		const selVal = $('#pkg-content-select').val();
		const content = selVal === '__custom__' || selVal === ''
			? ($('#pkg-content').val() || '')
			: (selVal || $('#pkg-content').val() || '');
		GK.state.packageInfo = {
			content: content,
			length: parseFloat($('#pkg-length').val()) || null,
			width: parseFloat($('#pkg-width').val()) || null,
			height: parseFloat($('#pkg-height').val()) || null,
			weight: parseFloat($('#pkg-weight').val()) || null,
			count: parseInt($('#pkg-count').val(), 10) || 1
		};
	}

function populatePackageInputs() {
    const pi = GK.state.packageInfo || (window.InitialValues && window.InitialValues.defaultPackageInfo) || {};
    if (pi.length != null) $('#pkg-length').val(pi.length);
    if (pi.width != null) $('#pkg-width').val(pi.width);
    if (pi.height != null) $('#pkg-height').val(pi.height);
    if (pi.weight != null) $('#pkg-weight').val(pi.weight);
    if (pi.count != null) $('#pkg-count').val(pi.count);
}

function buildProductsParams() {
    const s = GK.state;
    try { ensureCountryIdsFromIso(); } catch(e) {}
    const p = s.packageInfo || {};
    const params = {
			length: p.length,
			width: p.width,
			height: p.height,
			weight: p.weight,
			quantity: p.count || 1
		};
		if (s.sender && s.sender.postalCode) params.senderPostCode = s.sender.postalCode;
		if (s.receiver && s.receiver.postalCode) params.receiverPostCode = s.receiver.postalCode;
		if (s.sender && s.sender.country && s.sender.country.id) params.senderCountryId = s.sender.country.id;
		if (s.receiver && s.receiver.country && s.receiver.country.id) params.receiverCountryId = s.receiver.country.id;
		return params;
	}

function buildHeaders() {
    const headers = {};
	if (window.InitialValues && window.InitialValues.token) headers['x-auth-token'] = window.InitialValues.token;
	headers['accept-language'] = (window.InitialValues && window.InitialValues.isoCode === 'pl') ? 'pl' : 'en';
		return headers;
	}

function cardForProduct(product) {
    const logo = product.carrierLogoLink ? '<img src="' + product.carrierLogoLink + '" alt="' + (product.carrierName || '') + '" />' : '';
    const price = (product.netPrice != null) ? (product.netPrice + " " + product.currency) : '';
    // Purely visual match against the active template's saved service — no
    // fetching or side effects, just a state read (see applyTemplate() /
    // initTemplateSelector()), so this carries none of the timing risk that
    // auto-selecting the service on load did.
    const isTemplateMatch = !!(GK.state._templateServiceId && (product.id + '') === (GK.state._templateServiceId + ''));
    const iv = window.InitialValues || {};
    const templateBadge = isTemplateMatch
        ? '<span class="glob-template-badge" title="' + (iv.langFromTemplateTitle || '') + '">' +
            '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2z"/></svg> ' +
            (iv.langFromTemplate || '') +
        '</span>'
        : '';

	return (
		'<div class="col-lg-4 col-md-6 col-sm-6 glob-product-block text-center">' +
			'<div class="glob-product-wrapper' + (isTemplateMatch ? ' gk-template-match' : '') + '">' +
			templateBadge +
			'<div class="glob-collectionTypes">' +
				'<div class="glob-collectionType">' +
				(product.collectionTypes || []).map(
					function(type){ return '<span class="glob-collectionType-item glob-collectionType-item-' + type + '">' + type + '</span>'; }
				).join('') + '</div>' +
			'</div>' +
			'<div class="glob-product-logo">' + logo + '</div>' +
			'<strong>' + (product.carrierName || '') + '</strong><br/>' +
			'<span>' + (product.name || '') + '</span><br/><br/>' +
			'<strong>' + price + '</strong><br/><br/>' +
			'<button class="btn btn-sm btn-success btn-gk-success pick-product" data-id="' + product.id + '">Wybierz</button>' +
			'</div>' +
		'</div>'
	);
}

function fetchProducts() {
		setPackageInfoFromInputs();
		const params = buildProductsParams();
		// Filter by terminal type if showAllCarriers is false
    // determine current filter state
    const showAllFromDom = $('#service_filters_on').is(':checked');
    GK.state.showAllCarriers = !!showAllFromDom;
    const terminalType = GK.state.terminalType || (window.InitialValues && window.InitialValues.terminalType) || null;
		const url = gkApiBase() + 'products?' + new URLSearchParams(params).toString();
		$('#servicesModalList').html('<div class="col-lg-12 text-center"><i class="icon-cog icon-spin"></i></div>');
		$('#servicesContainer').addClass('loading');
		const $btn = $('#getServicesBtn');
		$btn.prop('disabled', true);
		$btn.find('i.icon-cog').show();
		return fetch(url, { headers: buildHeaders() })
			.then(function(r){ return r.json(); })
			.then(function(data){
				let list = [];
				if (data) {
					['standard','fast','superfast','noon','morning'].forEach(function(bucket){
						if (Array.isArray(data[bucket])) list = list.concat(data[bucket]);
					});
				}
                GK.state.products = list;

                if (!GK.state.showAllCarriers && terminalType) {
					let map = {
						inpost: function(p){ return (p.carrierName || '').toLowerCase().indexOf('inpost') > -1; },
						inpost_cod: function(p){ return (p.carrierName || '').toLowerCase().indexOf('inpost') > -1; },
						inpostcod: function(p){ return (p.carrierName || '').toLowerCase().indexOf('inpost') > -1; },
						ruch: function(p){ return (p.carrierName || '').toLowerCase().indexOf('orlen') > -1 || (p.carrierName || '').toLowerCase().indexOf('ruch') > -1; },
						pocztex48owp: function(p){ return (p.carrierName || '').toLowerCase().indexOf('poczta') > -1; },
						dhlparcel: function(p){ return (p.carrierName || '').toLowerCase().indexOf('dhl') > -1; },
						dpdpickup: function(p){ return (p.carrierName || '').toLowerCase().indexOf('dpd') > -1; },
						fedex: function(p){ return (p.carrierName || '').toLowerCase().indexOf('fedex') > -1; }
					};
					let fn = map[(terminalType + '').toLowerCase()];
					if (fn) list = list.filter(fn);
				}
               const html = list.map(cardForProduct).join('');
               if (GK.state.forModal) {
                   $('#servicesModalList').html(html);
                   if (!html) {
                       $('#servicesModalEmpty').show();
                   } else {
                       $('#servicesModalEmpty').hide();
                   }
               }
                // no-op
			})
			.finally(function(){
				$('#servicesContainer').removeClass('loading');
				const $btn = $('#getServicesBtn');
				$btn.prop('disabled', false);
				$btn.find('i.icon-cog').hide();
			});
	}

function renderServiceOptionsContainer() {
    // Use existing markup in TPL; just initialize widgets and bind events
    $('#serviceOptionsContainer').show();

    // Initialize datepicker with available dates restriction
    initializeDatepickerWithAvailability();

    if (window.InitialValues && window.InitialValues.todayDate) {
        $('#sendDateInput').val(window.InitialValues.todayDate);
    }
    $('#sendDateInput').off('change').on('change', function(){
      if (!GK.state.additionalInfo) GK.state.additionalInfo = {};
      GK.state.additionalInfo.sendDate = $(this).val();
      fetchTimeRanges();
      debouncedFullOrderValidate();
    });
    // bind new inputs to state
    $(document)
      .off('input change', '#codAmountInput')
      .on('input change', '#codAmountInput', function(){ if (!GK.state.additionalInfo) GK.state.additionalInfo = {}; GK.state.additionalInfo.codAmount = $(this).val(); recalcOrderPrice(); });
    $(document)
      .off('input change', '#codSwiftInput')
      .on('input change', '#codSwiftInput', function(){ if (!GK.state.additionalInfo) GK.state.additionalInfo = {}; GK.state.additionalInfo.codSwiftCode = $(this).val(); debouncedFullOrderValidate(); });
    $(document)
      .off('input change', '#codAccountInput')
      .on('input change', '#codAccountInput', function(){ if (!GK.state.additionalInfo) GK.state.additionalInfo = {}; GK.state.additionalInfo.codAccount = $(this).val(); debouncedFullOrderValidate(); });
    $(document)
      .off('input change', '#codAccountHolderInput')
      .on('input change', '#codAccountHolderInput', function(){ if (!GK.state.additionalInfo) GK.state.additionalInfo = {}; GK.state.additionalInfo.codAccountHolder = $(this).val(); debouncedFullOrderValidate(); });
    $(document)
      .off('input change', '#codAccountAddr1Input')
      .on('input change', '#codAccountAddr1Input', function(){ if (!GK.state.additionalInfo) GK.state.additionalInfo = {}; GK.state.additionalInfo.codAccountAddr1 = $(this).val(); debouncedFullOrderValidate(); });
    $(document)
      .off('input change', '#codAccountAddr2Input')
      .on('input change', '#codAccountAddr2Input', function(){ if (!GK.state.additionalInfo) GK.state.additionalInfo = {}; GK.state.additionalInfo.codAccountAddr2 = $(this).val(); debouncedFullOrderValidate(); });
    $(document)
      .off('input change', '#insuranceAmountInput')
      .on('input change', '#insuranceAmountInput', function(){
        if (!GK.state.additionalInfo) GK.state.additionalInfo = {};
        GK.state.additionalInfo.insuranceAmount = $(this).val();
        // A real DOM event only fires here from the merchant's own typing - the
        // CASH_ON_DELIVERY auto-fill sets .val() directly without triggering it
        // (see the .addon-checkbox change handler), so this can't misfire from
        // the cascade overwriting its own field.
        GK.state.insuranceAmountManuallyEdited = true;
        recalcOrderPrice();
      });
    $(document)
      .off('change', '#purposeSelect')
      .on('change', '#purposeSelect', function(){ if (!GK.state.additionalInfo) GK.state.additionalInfo = {}; GK.state.additionalInfo.purpose = $(this).val(); debouncedFullOrderValidate(); });
    $(document)
      .off('input change', '#declaredValueInput')
      .on('input change', '#declaredValueInput', function(){ if (!GK.state.additionalInfo) GK.state.additionalInfo = {}; GK.state.additionalInfo.declaredValue = $(this).val(); });
    // Value-range-driven addon groups (COD / insurance / declared value) live inside
    // #addonsList and get torn down and rebuilt by renderAddonsList() on every service
    // or pickup-type change - bound on document so they survive that.
    $(document)
      .off('input change', '.gk-value-addon-input')
      .on('input change', '.gk-value-addon-input', function(){ applyValueRangeFilter($(this).data('group')); });
    // Standard/non-standard shipment radio toggle, same lifecycle as the value-range groups above.
    $(document)
      .off('change', '.gk-shipment-type-radio')
      .on('change', '.gk-shipment-type-radio', function(){ applyShipmentTypeSelection($(this).val()); });
    // Per-addon SENT number field, injected into .addon-attributes when a SENT addon is checked.
    $(document)
      .off('input change', '.gk-sent-number-input')
      .on('input change', '.gk-sent-number-input', function(){
        const addonId = String($(this).data('id'));
        const value = $(this).val();
        (GK.state.serviceOptions || []).forEach(function(o){ if (String(o.id) === addonId) { o.sentNumber = value; } });
        debouncedFullOrderValidate();
      });
    // Per-addon extra fields (see ADDON_CATEGORY_EXTRA_FIELDS), e.g. marketplace
    // name / IOSS number for DUTY_DDP_MARKETPLACE_UK.
    $(document)
      .off('input change', '.gk-addon-extra-field')
      .on('input change', '.gk-addon-extra-field', function(){
        const addonId = String($(this).data('id'));
        const field = $(this).data('field');
        const value = $(this).val();
        (GK.state.serviceOptions || []).forEach(function(o){ if (String(o.id) === addonId) { o[field] = value; } });
        debouncedFullOrderValidate();
      });
    $(document)
      .off('input change', '#commentsInput')
      .on('input change', '#commentsInput', function(){ if (!GK.state.additionalInfo) GK.state.additionalInfo = {}; GK.state.additionalInfo.notes = $(this).val(); });
    $(document)
      .off('change', '#statesSelect')
      .on('change', '#statesSelect', function(){ if (!GK.state.additionalInfo) GK.state.additionalInfo = {}; GK.state.additionalInfo.stateType = $(this).val(); debouncedFullOrderValidate(); });
    $(document)
      .off('change', '#senderStatesSelect')
      .on('change', '#senderStatesSelect', function(){ if (!GK.state.additionalInfo) GK.state.additionalInfo = {}; GK.state.additionalInfo.senderStateType = $(this).val(); debouncedFullOrderValidate(); });
    $(document)
      .off('change', '#pickupTimeSelect')
      .on('change', '#pickupTimeSelect', function(){
        if (!GK.state.additionalInfo) GK.state.additionalInfo = {};
        const selectedValue = $(this).val();
        if (selectedValue) {
          try {
            GK.state.additionalInfo.timeRange = JSON.parse(decodeURIComponent(selectedValue));
          } catch(e) {
            GK.state.additionalInfo.timeRange = null;
          }
        } else {
          GK.state.additionalInfo.timeRange = null;
        }
        debouncedFullOrderValidate();
      });
    $('input[name=pickup_type]').off('change').on('change', function(){
        fetchTimeRanges();
        refreshAddons();
        refreshPayments();
        recalcOrderPrice();
        updateCarrierDependentUI();
        updateEnabledOptionsUI();
        fetchCustomRequiredFields();
        fetchCustomsConfig();
    });
}

	function fetchContentList() {
		const s = GK.state;
		if (!s.pickedService) return;
		const senderIso = (s.sender && s.sender.country && s.sender.country.isoCode) || (window.InitialValues && window.InitialValues.sender && window.InitialValues.sender.countryCode) || 'PL';
		const receiverIso = (s.receiver && s.receiver.country && s.receiver.country.isoCode) || (window.InitialValues && window.InitialValues.receiver && window.InitialValues.receiver.countryCode) || 'PL';
		const url = gkApiBase() + 'order/content?' + new URLSearchParams({ productId: s.pickedService.id, senderCountry: senderIso, receiverCountry: receiverIso }).toString();
		// A just-applied template's content (see applyTemplateContent()) takes
		// priority over the page-load default, since it reflects the user's
		// most recent choice rather than the initial server-side computation.
		const defaultContent = GK.state._templateContent || (window.InitialValues && window.InitialValues.defaultPackageInfo && window.InitialValues.defaultPackageInfo.content) || '';
		GK.state._templateContent = null;
		const currentCustom = (GK.state.packageInfo && GK.state.packageInfo.content) || '';
		fetch(url, { headers: buildHeaders() })
			.then(function(r) { return r.json(); })
			.then(function(data) {
				const list = Array.isArray(data) ? data : (data && Array.isArray(data.contents) ? data.contents : []);
				const $sel = $('#pkg-content-select');
				const $inp = $('#pkg-content');
				let html = '<option value="">-- wybierz --</option>';
				list.forEach(function(item) {
					const val = (typeof item === 'string') ? item : (item.name || item.value || item);
					html += '<option value="' + val + '">' + val + '</option>';
				});
				const customLabel = (window.InitialValues && window.InitialValues.langContentCustom) || 'Własna wartość';
				html += '<option value="__custom__">' + customLabel + '</option>';
				$sel.html(html);
				const match = defaultContent && list.some(function(item) {
					const val = (typeof item === 'string') ? item : (item.name || item.value || item);
					return val === defaultContent;
				});
				if (match) {
					$sel.val(defaultContent);
					$inp.hide().val(defaultContent);
					GK.state.packageInfo = GK.state.packageInfo || {};
					GK.state.packageInfo.content = defaultContent;
				} else if (defaultContent) {
					$sel.val('__custom__');
					$inp.show().val(defaultContent);
					GK.state.packageInfo = GK.state.packageInfo || {};
					GK.state.packageInfo.content = defaultContent;
				}
				$sel.off('change.content').on('change.content', function() {
					const v = $(this).val();
					if (v === '__custom__') {
						$inp.show().focus();
						GK.state.packageInfo = GK.state.packageInfo || {};
						GK.state.packageInfo.content = $inp.val();
					} else {
						$inp.hide();
						GK.state.packageInfo = GK.state.packageInfo || {};
						GK.state.packageInfo.content = v;
					}
				});
				$inp.off('input.content').on('input.content', function() {
					GK.state.packageInfo = GK.state.packageInfo || {};
					GK.state.packageInfo.content = $(this).val();
				});
			})
			.catch(function() {
				$('#pkg-content-select').hide();
				$('#pkg-content').show();
			});
	}

	// Categories whose addons come in value-range tiers (e.g. "Insurance up to 5,000 PLN")
	// instead of being picked directly: the merchant types an amount in Additional options
	// and the matching addon(s) are derived from it, rather than checked by hand first.
	// INSURANCE and INSURANCE_CARGO share one amount input (both are tiered by the same
	// declared shipment value) but are complementary, not alternatives - a client can buy
	// regular insurance AND additional cargo insurance on top of it - so `perCategory`
	// shows/keeps the cheapest match from each category as its own independent pick
	// instead of blending them into a single either/or selection.
	const VALUE_CATEGORY_GROUPS = {
		CASH_ON_DELIVERY: { categories: ['CASH_ON_DELIVERY'], inputId: 'codAmountInput', showAllMatches: true },
		INSURANCE: { categories: ['INSURANCE', 'INSURANCE_CARGO'], inputId: 'insuranceAmountInput', showAllMatches: false, perCategory: true },
		DECLARED_VALUE: { categories: ['DECLARED_VALUE'], inputId: 'declaredValueInput', showAllMatches: false }
	};
	const VALUE_CATEGORY_NAMES = ['CASH_ON_DELIVERY', 'INSURANCE', 'INSURANCE_CARGO', 'DECLARED_VALUE'];
	const VALUE_GROUP_STATE_FIELD = { CASH_ON_DELIVERY: 'codAmount', INSURANCE: 'insuranceAmount', DECLARED_VALUE: 'declaredValue' };
	const VALUE_GROUP_LABEL_KEY = { CASH_ON_DELIVERY: 'langCodAmount', INSURANCE: 'langInsuranceAmount', DECLARED_VALUE: 'langDeclaredValue' };

	function escapeHtml(str) {
		return (str + '').replace(/[&<>"']/g, function(ch) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
		});
	}

	// Same markup/attributes the existing global .addon-checkbox change handler expects
	// (data-id/data-category/data-price, sibling .addon-attributes box - now reserved
	// for the SENT-number/marketplace-extra-field inputs, which DO need the addon to
	// be checked first since they're inputs for a choice the merchant just made).
	// `description` is a hover-only tooltip (icon), while `attributes` (rich HTML info
	// text from GK, e.g. the DDP Premium terms) is rendered immediately/always-visible
	// right under the label, since it's informational, not gated by selection.
	function renderAddonCheckboxHtml(opt) {
		const p = (opt.priceGross != null ? opt.priceGross : opt.price);
		const curr = (opt.currency || '').trim();
		const priceTxt = (p != null) ? (' <span class="text-muted">(+' + p + (curr ? (' ' + curr) : '') + ')</span>') : '';
		const label = opt.addonName || opt.name || opt.symbol || ('#' + opt.id);
		const attrsBlock = opt.attributes ? ('<div class="gk-addon-attributes-block">' + opt.attributes + '</div>') : '';
		const descTxt = (opt.description || '').trim();
		// Plain unicode symbol instead of an icon font glyph: the admin theme's icon
		// set differs between PS 1.6/1.7/8/9, so this avoids depending on any of them.
		const descIcon = descTxt
			? ' <span class="text-muted" style="cursor:help; border:1px solid; border-radius:50%; padding:0 5px; font-size:11px;" title="' + escapeHtml(descTxt) + '">i</span>'
			: '';
		// isRequired addons (e.g. SEASONAL_SURCHARGE, RECEIVER_REMOTE_AREA) are forced
		// by GK for this route/carrier - the merchant can't opt out. Deliberately NOT
		// using the `disabled` attribute here: a checked+disabled checkbox renders
		// with no visible checkmark in this admin theme (confirmed - the state was
		// correct, it just wasn't shown), so it stays a normal, visibly-checked
		// checkbox and unchecking is blocked in the change handler instead (see
		// data-required there). data-required also drives the post-render trigger
		// that registers it into GK.state.serviceOptions on first render.
		const requiredAttrs = opt.isRequired ? ' checked data-required="1"' : '';
		const requiredNote = opt.isRequired
			? ' <span class="text-muted">(' + escapeHtml((window.InitialValues || {}).langRequired || 'required') + ')</span>'
			: '';
		return '' +
			'<div class="col-lg-12">' +
				'<label>' +
					'<input type="checkbox" class="addon-checkbox" data-id="' + opt.id + '" data-category="' + (opt.category || '') + '" data-price="' + (p != null ? p : '') + '" data-insurance-required="' + (opt.insuranceRequired ? '1' : '0') + '"' + requiredAttrs + '> ' +
					'<span class="addon-name-text">' + label + '</span>' + priceTxt + descIcon + requiredNote +
				'</label>' +
				attrsBlock +
				'<div class="addon-attributes" style="display:none;"></div>' +
			'</div>';
	}

	// Triggers 'change' on any freshly-rendered isRequired addon checkbox, and on
	// whichever radio a requiredAlternativeAddonsGroups block pre-selected, so both
	// register into GK.state.serviceOptions the same way a manual click would -
	// setting `checked`/`disabled` as raw HTML attributes doesn't fire that event.
	// The explicit .prop('checked', true) (not just relying on the parsed HTML
	// attribute) matters here: a disabled checkbox's checked *attribute* can render
	// inconsistently across browsers, but forcing the property is always reliable.
	function triggerPreselectedAddonChecks($container) {
		$container.find('.addon-checkbox[data-required="1"]').prop('checked', true).trigger('change');
		$container.find('.gk-alt-addon-group .addon-checkbox:checked').prop('checked', true).trigger('change');
	}

	// requiredAlternativeAddonsGroups render as an actual radio group (browser
	// enforces the mutual exclusivity natively) instead of independent checkboxes
	// only kept exclusive by JS - a separate function from renderAddonCheckboxHtml
	// rather than adding a 2nd parameter to it, since that function is called via
	// bare `.map(renderAddonCheckboxHtml)` elsewhere and Array#map passes the
	// current index as a callback's 2nd argument (the classic `.map(parseInt)` bug).
	function renderAlternativeAddonRadioHtml(opt, radioName, checked) {
		const p = (opt.priceGross != null ? opt.priceGross : opt.price);
		const curr = (opt.currency || '').trim();
		const priceTxt = (p != null) ? (' <span class="text-muted">(+' + p + (curr ? (' ' + curr) : '') + ')</span>') : '';
		const label = opt.addonName || opt.name || opt.symbol || ('#' + opt.id);
		const attrsBlock = opt.attributes ? ('<div class="gk-addon-attributes-block">' + opt.attributes + '</div>') : '';
		const descTxt = (opt.description || '').trim();
		const descIcon = descTxt
			? ' <span class="text-muted" style="cursor:help; border:1px solid; border-radius:50%; padding:0 5px; font-size:11px;" title="' + escapeHtml(descTxt) + '">i</span>'
			: '';
		return '' +
			'<div class="col-lg-12">' +
				'<label>' +
					'<input type="radio" class="addon-checkbox" name="' + radioName + '" data-id="' + opt.id + '" data-category="' + (opt.category || '') + '" data-price="' + (p != null ? p : '') + '" data-insurance-required="' + (opt.insuranceRequired ? '1' : '0') + '"' + (checked ? ' checked' : '') + '> ' +
					'<span class="addon-name-text">' + label + '</span>' + priceTxt + descIcon +
				'</label>' +
				attrsBlock +
				'<div class="addon-attributes" style="display:none;"></div>' +
			'</div>';
	}

	function renderAlternativeAddonGroupHtml(group, groupIndex) {
		const radioName = 'gk-alt-group-' + groupIndex;
		const defaultOpt = group.find(function(o) { return o.isSelectedByDefault; }) || group[0];
		return '' +
			'<div class="col-lg-12 gk-alt-addon-group" style="margin-bottom:10px; padding:8px; border:1px dashed #ccc; border-radius:4px;">' +
				group.map(function(opt) { return renderAlternativeAddonRadioHtml(opt, radioName, opt.id === defaultOpt.id); }).join('') +
			'</div>';
	}

	// Builds #addonsList: standard/non-standard shipment toggle first (if NOT_STANDARD
	// addons exist), then value-range-driven groups (with their amount input), then
	// every other addon rendered as a plain checkbox like before.
	function renderAddonsList(list, requiredAlternativeAddonsGroups) {
		// Reset any addon selections that no longer exist in this fetch - switching to
		// a different courier product/service can offer a completely different addon
		// set (including which ones are isRequired), so a stale, no-longer-offered
		// addon (required or not) must not stay silently selected in the background
		// just because it isn't purged anywhere else once its checkbox is gone.
		const validIds = {};
		(list || []).forEach(function(opt) { validIds[String(opt.id)] = true; });
		GK.state.serviceOptions = (GK.state.serviceOptions || []).filter(function(o) { return validIds[String(o.id)]; });

		GK.state.requiredAlternativeAddonsGroups = Array.isArray(requiredAlternativeAddonsGroups) ? requiredAlternativeAddonsGroups : [];
		GK.state.valueAddonsByCategory = {};
		VALUE_CATEGORY_NAMES.forEach(function(cat) { GK.state.valueAddonsByCategory[cat] = []; });
		GK.state.notStandardAddons = [];
		const generic = [];
		const idToAddon = {};
		(list || []).forEach(function(opt) { idToAddon[String(opt.id)] = opt; });
		// requiredAlternativeAddonsGroups ids are an either/or choice (e.g. "sender
		// pays duty (DDP)" vs "receiver pays duty (DAP)") - pull them out of the plain
		// checkbox list entirely so they can render as an actual radio group below,
		// instead of two independent checkboxes only kept exclusive by JS.
		const alternativeGroups = GK.state.requiredAlternativeAddonsGroups
			.map(function(idGroup) { return (idGroup || []).map(function(id) { return idToAddon[String(id)]; }).filter(Boolean); })
			.filter(function(g) { return g.length > 1; });
		const alternativeIds = {};
		alternativeGroups.forEach(function(g) { g.forEach(function(opt) { alternativeIds[String(opt.id)] = true; }); });

		(list || []).forEach(function(opt) {
			if (alternativeIds[String(opt.id)]) {
				return; // rendered via alternativeGroupsHtml instead
			}
			if (VALUE_CATEGORY_NAMES.indexOf(opt.category) !== -1) {
				GK.state.valueAddonsByCategory[opt.category].push(opt);
			} else if (opt.category === 'NOT_STANDARD') {
				GK.state.notStandardAddons.push(opt);
			} else {
				generic.push(opt);
			}
		});

		const iv = window.InitialValues || {};
		const groupsHtml = Object.keys(VALUE_CATEGORY_GROUPS).map(function(groupKey) {
			const group = VALUE_CATEGORY_GROUPS[groupKey];
			const hasAny = group.categories.some(function(cat) { return GK.state.valueAddonsByCategory[cat].length > 0; });
			// DECLARED_VALUE renders unconditionally, just hidden when no priced addon
			// tier exists for this route - confirmed live (and in shoper's own
			// #declaredValue, always in the DOM) that GK can require a declared value
			// for customs purposes via order/customRequiredFields even when it doesn't
			// expose a purchasable DECLARED_VALUE addon here, so gating the input's very
			// existence on "does an addon exist" left the merchant with no field to fill
			// in - fetchCustomRequiredFields() shows it when json.declaredValue is true.
			// CASH_ON_DELIVERY/INSURANCE stay addon-gated: there's nothing to configure
			// if GK doesn't offer that addon on this route at all.
			if (!hasAny && groupKey !== 'DECLARED_VALUE') return '';
			const labelText = iv[VALUE_GROUP_LABEL_KEY[groupKey]] || groupKey;
			// fetchCustomRequiredFields() and this addons-list render are two independent
			// fetches that can resolve in either order - re-check its already-cached flag
			// here too, so a DECLARED_VALUE-required response that arrived BEFORE this
			// render (instead of after) still ends up visible instead of staying hidden.
			const requiredByGk = groupKey === 'DECLARED_VALUE' && !!(GK.state.customRequired && GK.state.customRequired.declaredValue);
			const hideStyle = (groupKey === 'DECLARED_VALUE' && !hasAny && !requiredByGk) ? ' display:none;' : '';
			return '' +
				'<div class="col-lg-12 gk-value-addon-group" data-group="' + groupKey + '" style="margin-bottom:14px;' + hideStyle + '">' +
					'<label>' + labelText + '</label>' +
					'<input type="text" class="form-control gk-value-addon-input" id="' + group.inputId + '" data-group="' + groupKey + '" style="max-width:220px;">' +
					(groupKey === 'INSURANCE' ? '<div class="gk-insurance-required-warning text-danger" style="display:none; margin-top:4px;">' + escapeHtml(iv.langInsuranceRequiredWarning || '') + '</div>' : '') +
					'<div class="gk-value-addon-options" style="margin-top:6px;"></div>' +
				'</div>';
		}).join('');

		// Standard vs non-standard shipment radio toggle. Always shown; the
		// "non-standard" choice (and its reveal-able options) only appears when the
		// API actually returned NOT_STANDARD addons for this route/package - otherwise
		// "standard" is the only option.
		const hasNotStandard = GK.state.notStandardAddons.length > 0;
		const notStandardHtml = '' +
			'<div class="col-lg-12 gk-not-standard-group" style="margin-bottom:14px;">' +
				'<div class="radio"><label><input type="radio" name="gkShipmentType" class="gk-shipment-type-radio" value="standard" checked> ' + (iv.langStandardShipment || 'Standard shipment') + '</label></div>' +
				(hasNotStandard ? '<div class="radio"><label><input type="radio" name="gkShipmentType" class="gk-shipment-type-radio" value="nonstandard"> ' + (iv.langNonStandardShipment || 'Non-standard shipment') + '</label></div>' : '') +
				(hasNotStandard ? '<div class="gk-not-standard-options row" style="display:none; margin-top:6px;"></div>' : '') +
			'</div>';

		const alternativeGroupsHtml = alternativeGroups.map(renderAlternativeAddonGroupHtml).join('');
		const genericHtml = generic.map(renderAddonCheckboxHtml).join('');
		const html = notStandardHtml + groupsHtml + alternativeGroupsHtml + genericHtml;
		$('#addonsList').html(html);
		if (html) { $('#addonsListContainer').show(); } else { $('#addonsListContainer').hide(); }
		triggerPreselectedAddonChecks($('#addonsList'));

		Object.keys(VALUE_CATEGORY_GROUPS).forEach(function(groupKey) {
			// Re-apply whatever amount is already tracked in state (e.g. surviving a
			// pickup-type change) instead of always starting blank.
			const stateField = VALUE_GROUP_STATE_FIELD[groupKey];
			const existingValue = GK.state.additionalInfo && GK.state.additionalInfo[stateField];
			if (existingValue) {
				$('#' + VALUE_CATEGORY_GROUPS[groupKey].inputId).val(existingValue);
			}
			applyValueRangeFilter(groupKey);
		});
	}

	// Filters a value-range group's addons to those whose [minValue, maxValue] contains
	// the amount currently typed in its input, and (re)renders the matching checkbox(es).
	function applyValueRangeFilter(groupKey) {
		const group = VALUE_CATEGORY_GROUPS[groupKey];
		if (!group) return;
		const $input = $('#' + group.inputId);
		const $wrapper = $input.closest('.gk-value-addon-group');
		const $container = $wrapper.find('.gk-value-addon-options');
		const value = parseFloat((($input.val() || '') + '').replace(',', '.'));

		const previousIds = $container.find('.addon-checkbox').map(function() { return String($(this).data('id')); }).get();
		const previousCheckedIds = $container.find('.addon-checkbox:checked').map(function() { return String($(this).data('id')); }).get();

		let addons = [];
		group.categories.forEach(function(cat) {
			addons = addons.concat((GK.state.valueAddonsByCategory && GK.state.valueAddonsByCategory[cat]) || []);
		});

		const purgeUnrendered = function(renderedIds) {
			previousIds.forEach(function(id) {
				if (renderedIds.indexOf(id) === -1) {
					GK.state.serviceOptions = (GK.state.serviceOptions || []).filter(function(o) { return String(o.id) !== id; });
				}
			});
		};

		if (!value || isNaN(value) || value <= 0) {
			$container.empty();
			purgeUnrendered([]);
			updateEnabledOptionsUI();
			recalcOrderPrice();
			refreshPayments();
			return;
		}

		const inRange = addons.filter(function(a) {
			const min = (a.minValue != null) ? parseFloat(a.minValue) : null;
			const max = (a.maxValue != null) ? parseFloat(a.maxValue) : null;
			if (min != null && value < min) return false;
			if (max != null && value > max) return false;
			return true;
		}).sort(function(a, b) {
			const pa = (a.priceGross != null ? a.priceGross : a.price) || 0;
			const pb = (b.priceGross != null ? b.priceGross : b.price) || 0;
			return pa - pb;
		});

		if (!inRange.length) {
			$container.empty();
			purgeUnrendered([]);
			updateEnabledOptionsUI();
			recalcOrderPrice();
			refreshPayments();
			return;
		}

		// perCategory (INSURANCE group): INSURANCE and INSURANCE_CARGO are complementary,
		// not alternatives - a client can buy regular insurance AND additional cargo
		// insurance on top of it - so show the cheapest match from EACH category as its
		// own independent, non-exclusive pick, instead of blending both lists together
		// and offering only one selection overall.
		const toRender = group.perCategory
			? group.categories.map(function(cat) { return inRange.find(function(a) { return a.category === cat; }); }).filter(Boolean)
			: (group.showAllMatches ? inRange : [inRange[0]]);
		const renderedIds = toRender.map(function(a) { return String(a.id); });
		purgeUnrendered(renderedIds);

		$container.html(toRender.map(renderAddonCheckboxHtml).join(''));

		if (group.perCategory) {
			group.categories.forEach(function(cat, idx) {
				const catIds = toRender.filter(function(a) { return a.category === cat; }).map(function(a) { return String(a.id); });
				if (!catIds.length) return;
				// Keep the merchant's own pick for this category if it's still a valid
				// match; only the first (primary) category defaults to auto-checked -
				// the rest (e.g. cargo) are opt-in extras left unchecked by default.
				const stillValidPrevious = previousCheckedIds.find(function(id) { return catIds.indexOf(id) !== -1; });
				if (stillValidPrevious) {
					$container.find('.addon-checkbox[data-id="' + stillValidPrevious + '"]').prop('checked', true).trigger('change');
				} else if (idx === 0) {
					$container.find('.addon-checkbox[data-id="' + catIds[0] + '"]').prop('checked', true).trigger('change');
				}
			});
		} else {
			// Keep the merchant's own pick if it's still a valid match; otherwise default
			// to the cheapest (first, since toRender is price-sorted).
			const previousCheckedId = previousCheckedIds[0];
			const idToCheck = (previousCheckedId && renderedIds.indexOf(previousCheckedId) !== -1)
				? previousCheckedId
				: renderedIds[0];
			$container.find('.addon-checkbox[data-id="' + idToCheck + '"]').prop('checked', true).trigger('change');
		}
		triggerPreselectedAddonChecks($container);
	}

	// Standard/non-standard shipment toggle: "non-standard" reveals the NOT_STANDARD
	// addons fetched for this route as plain (multi-select) checkboxes; switching back
	// to "standard" hides and unchecks them, removing any from GK.state.serviceOptions.
	function applyShipmentTypeSelection(type) {
		const $container = $('.gk-not-standard-options');
		if (type === 'nonstandard') {
			$container.html((GK.state.notStandardAddons || []).map(renderAddonCheckboxHtml).join('')).show();
			triggerPreselectedAddonChecks($container);
		} else {
			$container.find('.addon-checkbox:checked').each(function(){
				const otherId = String($(this).data('id'));
				GK.state.serviceOptions = (GK.state.serviceOptions || []).filter(function(o){ return String(o.id) !== otherId; });
			});
			$container.hide().empty();
			updateEnabledOptionsUI();
			refreshPayments();
			recalcOrderPrice();
		}
	}

	function fetchAddonsAndPayments() {
		const s = GK.state;
		if (!s.pickedService) return;
		renderServiceOptionsContainer();
		fetchContentList();
		// Addons
		$('#addonsList').empty();
		$('#addonsListContainer').hide();
		const params = buildProductsParams();
		params.productId = s.pickedService.id;
		const addonsUrl = gkApiBase() + 'product/addons?' + new URLSearchParams(params).toString();
		fetch(addonsUrl, { headers: buildHeaders() })
			.then(function(r){ return r.json(); })
			.then(function(data){
				const list = (data && Array.isArray(data.addons)) ? data.addons : (Array.isArray(data) ? data : []);
				renderAddonsList(list, data && data.requiredAlternativeAddonsGroups);
				// Matched by category, not id: the GK API assigns a different numeric
				// id to the same conceptual addon (e.g. COD) depending on the
				// product/route, but its category (CASH_ON_DELIVERY, DECLARED_VALUE,
				// ...) is stable — see queueTemplateAddons() and configApp.jquery.js.
				if (Array.isArray(GK.state._templateAddonCategories) && GK.state._templateAddonCategories.length) {
					applyTemplateAddonCategories(GK.state._templateAddonCategories);
					// Applied once per template selection — cleared so later addon-list
					// refreshes (e.g. dimensions change) don't keep re-forcing them back
					// on over the user's own manual (un)checks.
					GK.state._templateAddonCategories = null;
				}
				applyPickupMethodAddonLogic();
				refreshPayments();
			});
		// Payments (requires grossOrderPrice in some cases)
		refreshPayments();
		// Prefill UI for picked service summary
		$('#pickedServiceName').text((s.pickedService.carrierName || '') + (s.pickedService.name ? (' – ' + s.pickedService.name) : ''));
		$('#pickedServicePanel').show();
        $('#summaryServiceName').html(
			(s.pickedService.carrierName || '') + (s.pickedService.name ? (' – ' + s.pickedService.name) : '')
			+ ((s.pickedService.units && s.pickedService.units > 1) ? ' ' + "<b>(x" + s.pickedService.units + ")</b> " : '')
		);
        $('#changeServiceBtn').off('click').on('click', function(){ GK.state.forceShowAll = true; GK.state.forModal = true; fetchProducts().then(function(){ $('#servicesPickModal').modal('show'); }); });
        // Always show terminal info block; fill defaults if available
        $('#terminalInfo').show();
        if (window.InitialValues && window.InitialValues.terminalCode) {
            $('#terminalCode').text(window.InitialValues.terminalCode);
            // Also set the terminal in state for proper data handling
            if (!GK.state.receiver) GK.state.receiver = {};
            GK.state.receiver.terminal = window.InitialValues.terminalCode;
        }
        $('.terminalLabel').hide();
        if (window.InitialValues && window.InitialValues.terminalType) {
            let tt = (window.InitialValues.terminalType || '') + '';
            tt = tt.trim();
            // Normalize potential camelCase variant.
            if (tt === 'inpostCod') tt = 'inpost_cod';
            $('.terminalLabel[data-type="' + tt + '"]').show();
        } else if (
            window.InitialValues &&
            window.InitialValues.prestaCarrier &&
            window.InitialValues.prestaCarrier.name
        ) {
            // Fallback: derive terminal label from PrestaShop carrier name.
            // (We use it only for UI; selection of the actual pickup point still relies on terminalCode/terminalType.)
            const n = (window.InitialValues.prestaCarrier.name || '').toLowerCase();
            let tt = null;

            if (n.indexOf('inpost') > -1 || n.indexOf('paczkomat') > -1) {
                if (n.indexOf('cod') > -1 || n.indexOf('pobr') > -1 || n.indexOf('pobran') > -1) {
                    tt = 'inpost_cod';
                } else {
                    tt = 'inpost';
                }
            } else if (n.indexOf('orlen') > -1 || n.indexOf('ruch') > -1) {
                tt = 'ruch';
            } else if (n.indexOf('pocztex') > -1) {
                tt = 'pocztex48owp';
            } else if (n.indexOf('dhl') > -1) {
                tt = 'dhlparcel';
            } else if (n.indexOf('dpd') > -1) {
                tt = 'dpdpickup';
            } else if (n.indexOf('fedex') > -1) {
                tt = 'fedex';
            }

            if (tt) {
                $('.terminalLabel[data-type="' + tt + '"]').show();
            }
        }
		// Initial dependent UI and requirements
		enforceCollectionTypeRadios();
		updateCarrierDependentUI();
		setTimeout(function(){
			fetchTimeRanges();
			fetchCustomRequiredFields();
			fetchCustomsConfig();
			// Refresh available dates when service changes
			fetchAvailablePickupDates().then(function(availableDates) {
				GK.state.availablePickupDates = availableDates;
				$('#sendDateInput').datepicker('refresh');
			});
		}, 0);
	}

function updatePickupMetaVisibility() {
    const sendingType = $('input[name=pickup_type]:checked').val();
    if (sendingType !== 'PICKUP') {
        $('#pickupMeta').hide();
        return;
    }
    const $ordered = $('.addon-checkbox[data-category="ORDERED_COURIER"]');
    const $paid = $('.addon-checkbox[data-category="PAID_PICKUP"]');
    if ($paid.is(':checked')) {
        $('#pickupMeta').show();
    } else if ($ordered.is(':checked')) {
        $('#pickupMeta').hide();
    } else {
        // No option checked, or these add-ons don't exist — show by default
        $('#pickupMeta').show();
    }
}

function applyPickupMethodAddonLogic() {
    const sendingType = $('input[name=pickup_type]:checked').val();
    const $container = $('#pickupMethodAddons');

    // Clear old elements and move fresh ones in from #addonsList
    $container.empty();
    $('#addonsList .addon-checkbox[data-category="ORDERED_COURIER"]').closest('.col-lg-12').detach().appendTo($container);
    $('#addonsList .addon-checkbox[data-category="PAID_PICKUP"]').closest('.col-lg-12').detach().appendTo($container);

    if (!$container.children().length) {
        $container.hide();
        return;
    }

    if (sendingType === 'POINT') {
        $container.hide();
        $container.find('.addon-checkbox').each(function() {
            const $cb = $(this);
            if ($cb.is(':checked')) {
                const cid = $cb.data('id');
                $cb.prop('checked', false);
                $cb.closest('.col-lg-12').find('.addon-attributes').hide().empty();
                GK.state.serviceOptions = (GK.state.serviceOptions || []).filter(function(o) {
                    return (o.id + '') !== (cid + '');
                });
            }
        });
    } else {
        $container.show();
        // Default to checking PAID_PICKUP if no option is selected
        const $ordered = $container.find('.addon-checkbox[data-category="ORDERED_COURIER"]');
        const $paid = $container.find('.addon-checkbox[data-category="PAID_PICKUP"]');
        if (!$ordered.is(':checked') && !$paid.is(':checked') && $paid.length) {
            $paid.prop('checked', true).trigger('change');
        }
    }
    updatePickupMetaVisibility();
}

function updateCarrierDependentUI() {
    const s = GK.state;
    if (!s.pickedService) return;
    const name = (s.pickedService.carrierName || '').toLowerCase();
    const sendingType = $('input[name=pickup_type]:checked').val();
    const collectionType = getSelectedCollectionTypeForApi();

    // hide all
    $('.receiverAddressPointId').hide();
    $('.senderAddressPointId').hide();
    updatePickupMetaVisibility();
    // Sync visibility of courier pickup add-ons (they live in #pickupMethodAddons, not #addonsList)
    const $pma = $('#pickupMethodAddons');
    if ($pma.children().length) {
        if (sendingType === 'POINT') { $pma.hide(); } else { $pma.show(); }
    }
    // Receiver point selection ONLY when deliveryTypes contains POINT (dostawa do paczkomatu)
    // This is independent of how we send it (courier pickup vs point drop-off)
    const hasPointDelivery = s.pickedService.deliveryTypes && s.pickedService.deliveryTypes.includes('POINT');
    const showReceiver = hasPointDelivery;
    if (showReceiver && name.indexOf('inpost') > -1) {
        $('.receiverAddressPointIdinpost').show();
    } else if (showReceiver && (name.indexOf('orlen') > -1 || name.indexOf('ruch') > -1)) {
        $('.receiverAddressPointIdorlen').show();
    } else if (showReceiver && name.indexOf('poczta') > -1) {
        $('.receiverAddressPointIdpocztex48').show();
    } else if (showReceiver && name.indexOf('dhl') > -1) {
        $('.receiverAddressPointIddhl').show();
    } else if (showReceiver && name.indexOf('dpd') > -1) {
        $('.receiverAddressPointIddpd').show();
    } else if (showReceiver && name.indexOf('fedex') > -1) {
        $('.receiverAddressPointIdfedex').show();
    }

    // Sender point selection: show for POINT and CROSSBORDER collection types.
    // We don't filter by carrierName: fallback in buildOrderData uses GK.state.sender.terminal (pointId),
    // so point selection should be available for every carrier that supports POINT/CROSSBORDER collectionType.
    if (isPointLikeCollectionType(collectionType)) {
        $('.senderAddressPointIdUnified').show();
    }

    // Don't modify terminalCode - it shows client's original choice

    updateEnabledOptionsUI();
}

function enforceCollectionTypeRadios() {
    const ps = GK.state.pickedService || {};
    const allowed = Array.isArray(ps.collectionTypes) ? ps.collectionTypes : [];
    const allowPickup = allowed.indexOf('PICKUP') > -1;
    const allowPoint = allowed.indexOf('POINT') > -1 || allowed.indexOf('CROSSBORDER') > -1;

    // Enable/disable and show/hide radios
    const $pickupLabel = $('#pickup').closest('.radio');
    const $pointLabel = $('#point').closest('.radio');

    $('#pickup').prop('disabled', !allowPickup);
    $pickupLabel[allowPickup ? 'removeClass' : 'addClass']('disabled');
    $pickupLabel.css('opacity', allowPickup ? '1' : '0.5');

    $('#point').prop('disabled', !allowPoint);
    $pointLabel[allowPoint ? 'removeClass' : 'addClass']('disabled');
    $pointLabel.css('opacity', allowPoint ? '1' : '0.5');

    // Determine which option should be selected
    const current = $('input[name=pickup_type]:checked').val();
    let selected = null;

    if (allowed.length === 0) {
        // No collection types specified - default to PICKUP
        selected = 'PICKUP';
    } else if (allowed.length === 1) {
        // UI supports two sending modes: courier pickup or point drop-off.
        selected = allowed[0] === 'PICKUP' ? 'PICKUP' : 'POINT';
    } else {
        // Multiple options available
        // Keep current selection if it's valid, otherwise pick first available
        if (current === 'PICKUP' && allowPickup) {
            selected = 'PICKUP';
        } else if (current === 'POINT' && allowPoint) {
            selected = 'POINT';
        } else {
            // Current selection is not valid, pick first available
            selected = allowPickup ? 'PICKUP' : (allowPoint ? 'POINT' : null);
        }
    }

    // Apply selection if valid and different from current
    if (selected && selected !== current) {
        $('input[name=pickup_type][value="' + selected + '"]').prop('checked', true).trigger('change');
    }
}

function updateChosenServiceUI() {

    const ps = GK.state.pickedService;
	const carrierSubName = (ps.name || '') + ((ps.units && ps.units > 1) ? ' ' + "<b>(x" + ps.units + ")</b>" : '');

    if (!ps) return;
    if (ps.carrierLogoLink) {
        $('#chosenServiceLogo').attr('src', ps.carrierLogoLink).show();
    }
    $('#chosenServiceCarrier').text(ps.carrierName || '');
    $('#chosenServiceName').html(carrierSubName || '');
	$('#chosenServiceSummary').html(
		Array.isArray(ps.labels)
			? ('<ul style="margin:0; padding-left:18px;">' + ps.labels.map(function(l){ return '<li>' + l + '</li>'; }).join('') + '</ul>')
			: (typeof ps.labels === 'string' ? ps.labels : '')
	);
    // render labels (if any)
    try {
        const labels = Array.isArray(ps.labels) ? ps.labels : [];
        const html = labels.length ? ('<ul style="margin:0 0 10px 18px;">' + labels.map(function(l){ return '<li>' + l + '</li>'; }).join('') + '</ul>') : '';
        $('#summaryServiceLabels').html(html);
        if (html) { $('#summaryServiceLabels').show(); } else { $('#summaryServiceLabels').hide(); }
    } catch(e) { $('#summaryServiceLabels').hide(); }
}

	function refreshAddons() {
		const s = GK.state;
		if (!s.pickedService) return Promise.resolve();
		const params = buildProductsParams();
		params.productId = s.pickedService.id;
		const addonsUrl = gkApiBase() + 'product/addons?' + new URLSearchParams(params).toString();
		$('#addonsList').empty();
		$('#addonsListContainer').hide();
		return fetch(addonsUrl, { headers: buildHeaders() })
			.then(function(r){ return r.json(); })
			.then(function(data){
				const list = (data && Array.isArray(data.addons)) ? data.addons : (Array.isArray(data) ? data : []);
				renderAddonsList(list, data && data.requiredAlternativeAddonsGroups);
				applyPickupMethodAddonLogic();
			});
	}

	function computeGrossPrice() {
		const s = GK.state;
		let base = 0;
		if (s.pickedService) {
			base = parseFloat(
				s.pickedService.grossPrice != null ? s.pickedService.grossPrice :
				s.pickedService.totalGrossPrice != null ? s.pickedService.totalGrossPrice :
				s.pickedService.price_gross != null ? s.pickedService.price_gross :
				s.pickedService.netPrice != null ? s.pickedService.netPrice : 0
			);
			if (isNaN(base)) base = 0;
		}
		let addons = 0;
		if (Array.isArray(s.serviceOptions)) {
			addons = s.serviceOptions.reduce(function(sum, o){
				const p = o && o.price != null ? parseFloat(o.price) : 0;
				return sum + (isNaN(p) ? 0 : p);
			}, 0);
		}
		const total = base + addons;
		return isNaN(total) ? undefined : total;
	}

	function refreshPayments() {
		const s = GK.state;
        try { ensureCountryIdsFromIso(); } catch(e) {}
		if (!s.pickedService) return Promise.resolve();
		const payParams = { productId: s.pickedService.id, isFreightForwardAddonSelected: false };
		const gross = computeGrossPrice();
		if (gross != null) payParams.grossOrderPrice = gross.toFixed(2);
		const paymentsUrl = gkApiBase() + 'order/payments?' + new URLSearchParams(payParams).toString();
		const prev = s.additionalInfo && s.additionalInfo.paymentType ? (s.additionalInfo.paymentType + '') : '';
		return fetch(paymentsUrl, { headers: buildHeaders() })
			.then(function(r){ return r.json(); })
			.then(function(data){
				const list = Array.isArray(data) ? data : (data && Array.isArray(data.payments) ? data.payments : []);
				// Bank transfer (1) and Online payment (2) are excluded here — the merchant
				// settles shipping costs with GlobKurier via pre-paid balance or collective
				// invoice instead (see the config page's Payments tab).
				GK.state.availablePayments = list.filter(function(p){ return p.enabled !== false && p.id !== 1 && p.id !== 2; });
				const html = '<option value="">-- wybierz --</option>' + GK.state.availablePayments.map(function(p){
					return '<option value="' + p.id + '">' + (p.name || ('ID ' + p.id)) + '</option>';
				}).join('');
				$('#paymentSelect').html(html);
				if (prev && GK.state.availablePayments.some(function(p){ return (p.id + '') === prev; })) {
					$('#paymentSelect').val(prev);
					if (!s.additionalInfo) s.additionalInfo = {};
					s.additionalInfo.paymentType = prev;
				} else {
					const iv = window.InitialValues || {};
					const defaultPt = iv.defaultPaymentType ? (iv.defaultPaymentType + '').trim() : '';
					const payments = GK.state.availablePayments;
					let autoId = null;
					if (defaultPt) {
						const matched = payments.find(function(p) {
							return (p.id + '') === defaultPt;
						});
						if (matched) autoId = matched.id + '';
					}
					if (!autoId && payments.length === 1) {
						autoId = payments[0].id + '';
					}
					if (autoId) {
						$('#paymentSelect').val(autoId);
						if (!s.additionalInfo) s.additionalInfo = {};
						s.additionalInfo.paymentType = autoId;
					}
				}
				$('#paymentSelect').off('change').on('change', function(){
					GK.state.additionalInfo.paymentType = $(this).val();
					recalcOrderPrice();
			updateEnabledOptionsUI();
				});
				recalcOrderPrice();
			});
	}

	// Initialize datepicker with available dates restriction
	function initializeDatepickerWithAvailability() {
		const today = new Date();
		const maxDate = new Date();
		maxDate.setDate(today.getDate() + 30); // maksymalnie 30 dni do przodu

		// Store available dates in state for datepicker
		GK.state.availablePickupDates = [];

		// Initialize basic datepicker first
		try {
			$('#sendDateInput').datepicker({
				dateFormat: 'yy-mm-dd',
				minDate: today,
				maxDate: maxDate,
				beforeShow: function(input, inst) {
					inst.dpDiv.addClass('gk-datepicker');
				},
				beforeShowDay: function(date) {
					const dateStr = $.datepicker.formatDate('yy-mm-dd', date);
					const isAvailable = GK.state.availablePickupDates.includes(dateStr);
					return [isAvailable, isAvailable ? '' : 'unavailable'];
				}
			});
		} catch(e) {
			// Datepicker initialization failed
		}

		// Fetch available dates and update datepicker
		fetchAvailablePickupDates().then(function(availableDates) {
			GK.state.availablePickupDates = availableDates;
			// Refresh datepicker to apply new restrictions
			$('#sendDateInput').datepicker('refresh');

			// Pre-fill the nearest available pickup date instead of leaving "today"
			// selected when it isn't actually a bookable pickup date.
			const sorted = (availableDates || []).slice().sort();
			const currentDate = $('#sendDateInput').val();
			if (sorted.length && sorted.indexOf(currentDate) === -1) {
				const nearest = sorted[0];
				$('#sendDateInput').val(nearest);
				if (!GK.state.additionalInfo) GK.state.additionalInfo = {};
				GK.state.additionalInfo.sendDate = nearest;
			}
			fetchTimeRanges();
		});
	}

	// Fetch available pickup dates and initialize datepicker with restrictions
	function fetchAvailablePickupDates() {
		const s = GK.state;
		try { ensureCountryIdsFromIso(); } catch(e) {}
		if (!s.pickedService) return Promise.resolve([]);

		const params = {
			productId: s.pickedService.id,
			date: new Date().toISOString().split('T')[0] // today's date
		};
		const p = s.packageInfo || {};
		if (p.weight != null) params.weight = p.weight;
		params.quantity = p.count || 1;
		if (s.sender && s.sender.country && s.sender.country.id) params.senderCountryId = s.sender.country.id;
		if (s.receiver && s.receiver.country && s.receiver.country.id) params.receiverCountryId = s.receiver.country.id;
		if (s.sender && s.sender.postalCode) params.senderPostCode = s.sender.postalCode;
		if (s.receiver && s.receiver.postalCode) params.receiverPostCode = s.receiver.postalCode;

		const url = gkApiBase() + 'order/pickupTimeRanges?' + new URLSearchParams(params).toString();
		return fetch(url, { headers: buildHeaders() })
			.then(function(r){ return r.json(); })
			.then(function(data){
				const list = Array.isArray(data) ? data : (data && Array.isArray(data.timeRanges) ? data.timeRanges : []);
				// Extract unique dates from the response
				const availableDates = [...new Set(list.map(item => item.date))];
				return availableDates;
			})
			.catch(function(e){
				return [];
			});
	}

	function fetchTimeRanges() {
		const s = GK.state;
    try { ensureCountryIdsFromIso(); } catch(e) {}
		if (!s.pickedService) return;
		const date = $('#sendDateInput').val();
		if (!date) return; // wait until date is chosen
	// Only required parameters for this endpoint
	const params = {
		productId: s.pickedService.id,
		date: date
	};
	const p = s.packageInfo || {};
	if (p.weight != null) params.weight = p.weight;
	params.quantity = p.count || 1;
	if (s.sender && s.sender.country && s.sender.country.id) params.senderCountryId = s.sender.country.id;
	if (s.receiver && s.receiver.country && s.receiver.country.id) params.receiverCountryId = s.receiver.country.id;
	if (s.sender && s.sender.postalCode) params.senderPostCode = s.sender.postalCode;
	if (s.receiver && s.receiver.postalCode) params.receiverPostCode = s.receiver.postalCode;
		const url = gkApiBase() + 'order/pickupTimeRanges?' + new URLSearchParams(params).toString();
		return fetch(url, { headers: buildHeaders() })
			.then(function(r){ return r.json(); })
			.then(function(data){
				const list = Array.isArray(data) ? data : (data && Array.isArray(data.timeRanges) ? data.timeRanges : []);

				// Group time ranges by date and merge overlapping ranges
				const timeRangesByDate = {};
				list.forEach(function(item) {
					if (!timeRangesByDate[item.date]) {
						timeRangesByDate[item.date] = [];
					}
					timeRangesByDate[item.date].push({
						timeFrom: item.timeFrom,
						timeTo: item.timeTo
					});
				});

				// For the selected date, show all available time ranges
				const selectedDateRanges = timeRangesByDate[date] || [];
				const html = '<option value="">-- wybierz --</option>' + selectedDateRanges.map(function(t){
					const label = (t.timeFrom && t.timeTo) ? (t.timeFrom + ' - ' + t.timeTo) : '';
					const value = JSON.stringify({ timeFrom: t.timeFrom, timeTo: t.timeTo });
					return '<option value="' + encodeURIComponent(value) + '">' + label + '</option>';
				}).join('');
				$('#pickupTimeSelect').html(html);

				// Pre-fill the nearest (first) available time range by default, but
				// keep the merchant's own pick if it's still offered for this date -
				// this list gets rebuilt on every date/weight/dimension change.
				if (!GK.state.additionalInfo) GK.state.additionalInfo = {};
				if (selectedDateRanges.length) {
					const existing = GK.state.additionalInfo.timeRange;
					const stillValid = existing && selectedDateRanges.some(function(t){ return t.timeFrom === existing.timeFrom && t.timeTo === existing.timeTo; });
					const chosen = stillValid ? existing : selectedDateRanges[0];
					$('#pickupTimeSelect').val(encodeURIComponent(JSON.stringify({ timeFrom: chosen.timeFrom, timeTo: chosen.timeTo })));
					GK.state.additionalInfo.timeRange = chosen;
				} else {
					GK.state.additionalInfo.timeRange = null;
				}
				debouncedFullOrderValidate();
			});
	}

function fetchStates(countryId, opts) {
    opts = opts || {}; // { targetGroup: '#statesGroup', targetSelect: '#statesSelect' }
    const targetGroup = opts.targetGroup || '#statesGroup';
    const targetSelect = opts.targetSelect || '#statesSelect';
    if (!countryId) { $(targetGroup).hide(); return Promise.resolve([]); }
    const url = gkApiBase() + 'states?countryId=' + encodeURIComponent(countryId);
    return fetch(url, { headers: buildHeaders() })
        .then(function(r){ return r.json(); })
        .then(function(list){
            if (!Array.isArray(list) || !list.length) {
                $(targetGroup).hide();
                return [];
            }
            const html = '<option value="">-- wybierz --</option>' + list.map(function(s){ return '<option value="' + s.id + '">' + (s.name || ('ID ' + s.id)) + '</option>'; }).join('');
            $(targetSelect).html(html);
            $(targetGroup).show();
            return list;
        });
}

	function fetchCustomRequiredFields() {
		const s = GK.state;
    try { ensureCountryIdsFromIso(); } catch(e) {}
		if (!s.pickedService) return;
		const collectionType = getSelectedCollectionTypeForApi();
		const receiverCountryId = s.receiver && s.receiver.country && s.receiver.country.id;
		const senderCountryId = s.sender && s.sender.country && s.sender.country.id;
		if (!receiverCountryId || !senderCountryId) return;
		const url = gkApiBase() + 'order/customRequiredFields?' + new URLSearchParams({
			productId: s.pickedService.id,
			senderCountryId: senderCountryId,
			receiverCountryId: receiverCountryId,
			collectionType: collectionType
		}).toString();
		// UI loading state could be added if needed
		return fetch(url, { headers: buildHeaders() })
			.then(function(r){ return r.json(); })
			.then(function(json){
				GK.state.customRequired = json || {};
				// This flag is authoritative for visibility - a purchasable DECLARED_VALUE
				// addon tier existing (renderAddonsList) is a separate, independent reason
				// to show the same field, not the only one (see the comment where
				// groupsHtml builds this block).
				if (json.declaredValue) {
					$('.gk-value-addon-group[data-group="DECLARED_VALUE"]').show();
					// Initialize declaredValue with default value if not set
					if (!GK.state.additionalInfo || !GK.state.additionalInfo.declaredValue) {
						GK.state.additionalInfo = GK.state.additionalInfo || {};
						GK.state.additionalInfo.declaredValue = '0'; // Default value
						$('#declaredValueInput').val('0');
					}
				}
				if (json.purpose) {
					$('#purposeGroup').show();
					// Initialize purpose with default value if not set
					if (!GK.state.additionalInfo || !GK.state.additionalInfo.purpose) {
						GK.state.additionalInfo = GK.state.additionalInfo || {};
						GK.state.additionalInfo.purpose = 'SOLD'; // Default value
					}
					$('#purposeSelect').val(GK.state.additionalInfo.purpose || 'SOLD');
				} else {
					$('#purposeGroup').hide();
				}
				// pickup date/time
				const showPickupMeta = !!(json.pickupDate || json.pickupTimeFrom || json.pickupTimeTo);
				$('#pickupMeta').toggle(showPickupMeta);
				// receiver/sender point blocks
				if (json.receiverAddressPointId === true) {
					// ensure only the matching receiver block is visible; updateCarrierDependentUI already bases on carrier
					// we just make sure at least one group is visible if POINT
					if ($('input[name=pickup_type]:checked').val() === 'POINT') {
						// show/hide handled in updateCarrierDependentUI
					}
				} else {
					$('.receiverAddressPointId').hide();
				}
				if (json.senderAddressPointId === true) {
					// we currently only have InPost sender block; let carrier UI handle it when applicable
				} else {
					$('.senderAddressPointId').hide();
				}
				// states
                if (json.receiverStateId === true) {
                    fetchStates(receiverCountryId, { targetGroup: '#statesGroup', targetSelect: '#statesSelect' });
                } else {
                    $('#statesGroup').hide();
                }
                if (json.senderStateId === true) {
                    fetchStates(senderCountryId, { targetGroup: '#senderStatesGroup', targetSelect: '#senderStatesSelect' });
                } else {
                    $('#senderStatesGroup').hide();
                }

                // Handle required addons
                if (json.requiredAddons && Array.isArray(json.requiredAddons)) {
                    GK.state.customRequired.requiredAddons = json.requiredAddons;
                    // Auto-select required addons
                    json.requiredAddons.forEach(function(requiredId) {
                        const addonCheckbox = $('.addon-checkbox[data-id="' + requiredId + '"]');
                        if (addonCheckbox.length && !addonCheckbox.is(':checked')) {
                            addonCheckbox.prop('checked', true).trigger('change');
                        }
                    });
                } else {
                    // Clear required addons if not present
                    GK.state.customRequired.requiredAddons = null;
                }

				updateCarrierDependentUI();
			});
	}

	// --- Customs clearance (GET /customs/config) -----------------------------------
	// Replaces the deprecated `orderCustoms` key from order/customRequiredFields (GK
	// docs: "this endpoint replaces the customs key from customRequiredFields").
	// Field sets vary a lot by carrier (confirmed live: UPS/FedEx/CrossBorder on the
	// same PL->GB route each return a different subset - sender-only eori vs
	// sender+receiver, purpose vs no purpose, vatRegistrationNumber for CrossBorder
	// only, etc.), so this renders generically off each field's metadata
	// (compound/collection/frontType/disabled) instead of hardcoding known field
	// names like the sibling shoper/shopify-app integrations do - they don't render
	// several fields (customsInvoiceType, isStrategic, transportIncluded/Amount/
	// Currency, declarantName, totalWeight) that the live API already returns.

	function customsPathGet(obj, path) {
		let cur = obj;
		for (let i = 0; i < path.length; i++) {
			if (cur == null) return undefined;
			cur = cur[path[i]];
		}
		return cur;
	}

	function customsPathSet(obj, path, value) {
		let cur = obj;
		for (let i = 0; i < path.length - 1; i++) {
			const seg = path[i];
			const nextSeg = path[i + 1];
			if (cur[seg] == null) { cur[seg] = (typeof nextSeg === 'number') ? [] : {}; }
			cur = cur[seg];
		}
		cur[path[path.length - 1]] = value;
	}

	function parseCustomsPath(str) {
		return String(str).split('.').map(function(seg) { return /^\d+$/.test(seg) ? parseInt(seg, 10) : seg; });
	}

	// The field's own top-level `min`/`max` don't always match what the API actually
	// enforces (confirmed live: "description" reports max:35 at the field level but
	// its real `constraints[].Length` says max:50, and the live order/validate error
	// for a 51-char description cites "50 znaków" - matching the constraint, not
	// the field-level max). Read the Symfony constraint directly instead of trusting
	// the field-level min/max hints.
	function customsFindConstraint(field, shortClassName) {
		return (field.constraints || []).find(function(c) {
			return c.class && c.class.split('\\').pop() === shortClassName;
		});
	}
	function customsLengthMax(field) {
		const c = customsFindConstraint(field, 'Length');
		const max = c && c.arguments && c.arguments.max;
		return (max != null && max !== '') ? parseInt(max, 10) : null;
	}
	// Mirrors buildCustomsPayloadValue's own dual_description wire format exactly -
	// the two must never diverge, since this is what the Length constraint actually
	// measures server-side.
	function customsDualCombinedLength(pl, en) {
		return en ? ((pl || '').length + 4 + en.length) : (pl || '').length;
	}
	// Finds a field's own definition by its rendered dot-path (e.g.
	// "commodities.0.description" -> the "description" sub-field of "commodities"),
	// skipping numeric array-index segments, so length-limited fields can be looked
	// up again outside of renderCustomsLeafField (translate button, input handler).
	function customsFieldByPath(pathStr) {
		const segs = String(pathStr).split('.');
		let fields = GK.state.customsFields || [];
		let field = null;
		for (let i = 0; i < segs.length; i++) {
			const seg = segs[i];
			if (/^\d+$/.test(seg)) { continue; }
			field = (fields || []).find(function(f) { return f.name === seg; });
			if (!field) return null;
			fields = field.fields || [];
		}
		return field;
	}

	// Builds the default value for a field definition, respecting the API's own
	// `value` default and `options[].selected` (the real mechanism the live API uses
	// for locked/suggested values - the `predefined` concept from older docs does not
	// appear anywhere in real /customs/config responses; `disabled: true` + `value`
	// covers computed/locked fields instead).
	function buildCustomsDefaultValue(field) {
		if (field.type === 'collection') {
			return field.disabled ? buildCustomsDefaultValue({ compound: true, fields: field.fields }) : [];
		}
		if (field.compound) {
			const obj = {};
			(field.fields || []).forEach(function(sub) { obj[sub.name] = buildCustomsDefaultValue(sub); });
			return obj;
		}
		if (field.frontType === 'dual_description') {
			return { pl: '', en: '' };
		}
		if (field.type === 'choice' && field.multi) {
			return (field.options || []).filter(function(o) { return o.selected; }).map(function(o) { return o.value; });
		}
		if (field.type === 'choice') {
			if (field.value != null) return field.value;
			const sel = (field.options || []).find(function(o) { return o.selected; });
			return sel ? sel.value : '';
		}
		return field.value != null ? field.value : '';
	}

	// Overlays a real order line item (name/quantity/unit price/weight, from
	// window.GkOrderProducts - see AdminGlobkurierPlaceOrderController.php) onto an
	// otherwise-default commodity row, but only for the specific field names that
	// carry that data. Stays generic/safe for any carrier: a schema missing one of
	// these names (e.g. no "unitValue" field) just leaves that part at its normal
	// default instead of assuming the field exists.
	function buildCommodityRowFromOrderProduct(field, product) {
		const row = buildCustomsDefaultValue({ compound: true, fields: field.fields });
		const fieldByName = {};
		(field.fields || []).forEach(function(f) { fieldByName[f.name] = f; });
		if (fieldByName.description && product.name) {
			const maxLen = customsLengthMax(fieldByName.description);
			row.description = { pl: maxLen ? product.name.substring(0, maxLen) : product.name, en: '' };
		}
		if (fieldByName.quantity && product.quantity) {
			row.quantity = product.quantity;
		}
		if (fieldByName.unitValue && product.unitValue != null) {
			row.unitValue = product.unitValue;
		}
		if (fieldByName.unitWeightGross && product.unitWeight != null) {
			row.unitWeightGross = product.unitWeight;
		}
		if (fieldByName.unitWeightNet && product.unitWeight != null) {
			row.unitWeightNet = product.unitWeight;
		}
		return row;
	}

	function fetchCustomsConfig() {
		const s = GK.state;
		try { ensureCountryIdsFromIso(); } catch (e) {}
		if (!s.pickedService) return;
		const senderCountryId = s.sender && s.sender.country && s.sender.country.id;
		const receiverCountryId = s.receiver && s.receiver.country && s.receiver.country.id;
		const carrierName = s.pickedService.carrierName;
		if (!senderCountryId || !receiverCountryId || !carrierName) { hideCustomsSection(); return; }
		const params = new URLSearchParams({ name: carrierName, senderCountry: senderCountryId, receiverCountry: receiverCountryId });
		return fetch(gkApiBase() + 'customs/config?' + params.toString(), { headers: buildHeaders() })
			.then(function(r) { return (r.status === 404) ? { fields: [] } : r.json(); })
			.then(function(json) {
				const fields = (json && Array.isArray(json.fields)) ? json.fields : [];
				GK.state.customsFields = fields;
				if (!fields.length) { hideCustomsSection(); return; }
				renderCustomsSection(fields);
			})
			.catch(function() { hideCustomsSection(); });
	}

	function hideCustomsSection() {
		GK.state.customsFields = [];
		GK.state.customsData = null;
		$('#customsContainer').hide();
		$('#customsBody').empty();
		$('#customsSummaryTable').hide();
		$('#customsSummaryTableBody').empty();
		hideCustomsCalculation();
	}

	// Drives the status badge next to the "Customs clearance" button and gates
	// "Save and close" - both need the exact same definition of "done" (required
	// fields filled AND nothing over its Length limit), so this just checks whether
	// collectIncompleteCustomsPaths (below) found anything, instead of maintaining a
	// second parallel traversal that can silently drift out of sync with it (as the
	// required-vs-length-only-checked-in-one-of-them bug demonstrated).
	function isCustomsFormComplete() {
		const fields = GK.state.customsFields || [];
		const data = GK.state.customsData || {};
		return fields.every(function(field) { return collectIncompleteCustomsPaths(field, data[field.name], [field.name]).length === 0; });
	}

	// Mirrors isCustomsFieldFilled's traversal but collects the dot-paths of every
	// unfilled required field instead of a single boolean, so "Save and close" can
	// point at exactly what's missing instead of just refusing to close.
	function collectIncompleteCustomsPaths(field, value, path) {
		if (field.type === 'collection') {
			if (field.disabled) return [];
			const rows = value || [];
			if (!rows.length) { return [path.join('.')]; }
			let missing = [];
			rows.forEach(function(row, idx) {
				(field.fields || []).forEach(function(sub) {
					missing = missing.concat(collectIncompleteCustomsPaths(sub, row[sub.name], path.concat([idx, sub.name])));
				});
			});
			return missing;
		}
		if (field.compound) {
			let missing = [];
			(field.fields || []).forEach(function(sub) {
				missing = missing.concat(collectIncompleteCustomsPaths(sub, (value || {})[sub.name], path.concat([sub.name])));
			});
			return missing;
		}
		// Length overflow blocks the real order/validate call regardless of `required`
		// (confirmed live: a too-long description gets rejected by the API even though
		// the same constraint mechanism also covers required fields) - checked before
		// the required-gate below rather than inside it.
		if (field.frontType === 'dual_description') {
			// Paths must carry the .pl/.en suffix to match the actual rendered
			// input's data-path (renderCustomsLeafField), otherwise the has-error
			// selector below silently matches nothing and these fields never
			// visibly highlight despite blocking the "Save and close" gate.
			const missing = [];
			const plVal = (value && value.pl) || '';
			const enVal = (value && value.en) || '';
			if (field.required && !plVal) { missing.push(path.concat(['pl']).join('.')); }
			if (field.required && !enVal) { missing.push(path.concat(['en']).join('.')); }
			const maxLen = customsLengthMax(field);
			// The constraint measures the combined "PL ;; EN" wire value (see
			// customsDualCombinedLength), not each language independently - flagging
			// both inputs when it's exceeded since either one could be shortened to fix it.
			if (maxLen != null && customsDualCombinedLength(plVal, enVal) > maxLen) {
				missing.push(path.concat(['pl']).join('.'));
				missing.push(path.concat(['en']).join('.'));
			}
			return missing;
		}
		if (field.type === 'choice' && field.multi) { return []; }
		const missing = [];
		if (field.required && (value == null || value === '')) { missing.push(path.join('.')); }
		const maxLen = customsLengthMax(field);
		if (maxLen != null && typeof value === 'string' && value.length > maxLen) { missing.push(path.join('.')); }
		return missing;
	}

	// Runs continuously (every recalcCustomsComputedFields pass - initial render and
	// every field edit) rather than only when "Save and close" is clicked, matching
	// GK's own panel which shows required-but-empty fields as invalid immediately,
	// not just on a submit attempt. Returns the count of still-missing fields so the
	// save button can decide whether to actually close the modal.
	function highlightIncompleteCustomsFields() {
		$('.gk-customs-field').removeClass('has-error');
		const fields = GK.state.customsFields || [];
		const data = GK.state.customsData || {};
		let missing = [];
		fields.forEach(function(field) {
			missing = missing.concat(collectIncompleteCustomsPaths(field, data[field.name], [field.name]));
		});
		missing.forEach(function(pathStr) {
			$('.gk-customs-input[data-path="' + pathStr + '"]').closest('.form-group').addClass('has-error');
		});
		return missing.length;
	}

	// No separate "Filled in / Needs to be filled in" badge - the "Edit customs
	// declaration" button's own color communicates the state (orange = incomplete,
	// green = done), and placeOrder() blocks submission with an explicit error if
	// it's still incomplete when the merchant tries to place the order.
	function updateCustomsStatusBadge() {
		const complete = isCustomsFormComplete();
		$('#openCustomsModalBtn')
			.toggleClass('btn-warning', !complete)
			.toggleClass('btn-success btn-gk-success', complete);
	}

	// Section titles are our own translated labels (the API only labels individual
	// fields, not the sections themselves), keyed off the same section names GK's
	// own top-level `sections` array uses ("sender","receiver","commodities",
	// "summary","details").
	const CUSTOMS_SECTION_LABEL_KEYS = {
		sender: 'langCustomsSectionSender',
		receiver: 'langCustomsSectionReceiver',
		commodities: 'langCustomsSectionCommodities',
		summary: 'langCustomsSectionSummary',
		details: 'langCustomsSectionDetails'
	};

	function customsSectionLabel(key) {
		const iv = window.InitialValues || {};
		const langKey = CUSTOMS_SECTION_LABEL_KEYS[key];
		return (langKey && iv[langKey]) || key;
	}

	// A top-level field's own `section` is null for the sender/receiver/commodities
	// wrapper fields themselves (only their sub-fields carry it), so fall back to the
	// field's own name - which for those three IS the section key.
	function groupCustomsFieldsBySection(fields) {
		const groups = {};
		const order = [];
		fields.forEach(function(field) {
			const key = field.section || field.name;
			if (!groups[key]) { groups[key] = []; order.push(key); }
			groups[key].push(field);
		});
		return { groups: groups, order: order };
	}

	function renderCustomsSection(fields) {
		if (!GK.state.customsData) { GK.state.customsData = {}; }
		fields.forEach(function(field) {
			if (customsPathGet(GK.state.customsData, [field.name]) === undefined) {
				customsPathSet(GK.state.customsData, [field.name], buildCustomsDefaultValue(field));
			}
		});
		// Pre-fill sender EORI from the module's configured default (only if the
		// merchant hasn't already typed/kept something there across a re-render).
		const iv = window.InitialValues || {};
		if (GK.state.customsData.sender && !GK.state.customsData.sender.eori && iv.defaultEoriNumber) {
			GK.state.customsData.sender.eori = iv.defaultEoriNumber;
		}
		// Repeatable collections (commodities) always keep at least one row - the
		// first time (no rows yet), seed one row per order line item when placing
		// the shipment from a real PrestaShop order, instead of one blank row the
		// merchant would have to fill in by hand for every product.
		fields.forEach(function(field) {
			if (field.type === 'collection' && !field.disabled) {
				const arr = customsPathGet(GK.state.customsData, [field.name]) || [];
				if (!arr.length) {
					const orderProducts = (window.GkOrderProducts && window.GkOrderProducts.length) ? window.GkOrderProducts : null;
					if (orderProducts) {
						orderProducts.forEach(function(p) { arr.push(buildCommodityRowFromOrderProduct(field, p)); });
					} else {
						arr.push(buildCustomsDefaultValue({ compound: true, fields: field.fields }));
					}
					customsPathSet(GK.state.customsData, [field.name], arr);
				}
			}
		});

		const grouped = groupCustomsFieldsBySection(fields);
		// Sender/receiver each arrive as their own section (one compound field per
		// key), but read far better side by side than as two stacked full-width
		// cards - receiver only takes a column when the API actually returned it
		// for this route (e.g. Cross Border on PL->GB has it, UPS/FedEX don't).
		const order = grouped.order.filter(function(key) { return key !== 'sender' && key !== 'receiver'; });
		let html = (grouped.groups.sender || grouped.groups.receiver)
			? renderCustomsSenderReceiverCard(grouped.groups.sender, grouped.groups.receiver)
			: '';
		html += order.map(function(key) { return renderCustomsSectionCard(key, grouped.groups[key]); }).join('');
		$('#customsBody').html(html);
		$('#customsContainer').show();
		fields.forEach(function(field) {
			if (field.type === 'collection' && !field.disabled) {
				updateCustomsRemoveButtons(field.name);
			}
		});
		recalcCustomsComputedFields();
	}

	// Sender and receiver each arrive from the API as their own single-field
	// "section" (a compound field named after itself, e.g. sender.fields = [eori]),
	// but showing them as two stacked full-width panels wastes space for what's
	// usually a single field each - render them as one card, left column always
	// sender, right column receiver only if the API actually returned it for this
	// route/carrier (confirmed live: e.g. Cross Border on PL->GB has receiver.eori,
	// UPS/FedEX on the same route and every carrier on PL->US don't).
	function renderCustomsSenderReceiverCard(senderGroup, receiverGroup) {
		function renderSide(group) {
			const field = (group || [])[0];
			if (!field) { return ''; }
			return (field.fields || []).map(function(sub) {
				return renderCustomsLeafField(sub, [field.name, sub.name]);
			}).join('');
		}
		const hasReceiver = !!(receiverGroup && receiverGroup[0]);
		const leftClass = hasReceiver ? 'col-sm-6' : 'col-sm-12';
		let body = '<div class="row">';
		body += '<div class="' + leftClass + '"><span class="gk-customs-subheading">' + escapeHtml(customsSectionLabel('sender')) + '</span>' + renderSide(senderGroup) + '</div>';
		if (hasReceiver) {
			body += '<div class="col-sm-6"><span class="gk-customs-subheading">' + escapeHtml(customsSectionLabel('receiver')) + '</span>' + renderSide(receiverGroup) + '</div>';
		}
		body += '</div>';
		return '<div class="col-sm-12 gk-customs-section">' + body + '</div>';
	}

	// One card per remaining section (Commodities / Details / Summary). Within a
	// card: dual PL/EN fields get their own full-width row (they already hold two
	// inputs + a button, cramming them into a narrow column is what made the old
	// layout unreadable); every other plain field sits in a 3-per-row grid; the
	// commodities collection renders as a list of per-item cards. The "summary"
	// section specifically pairs its read-only totals table (2/3 width) with
	// whatever plain field(s) sit alongside it - currency, in every route seen so
	// far - in the remaining 1/3, rather than stacking them full-width.
	function renderCustomsSectionCard(sectionKey, fieldsInSection) {
		let bodyHtml = '';
		if (sectionKey === 'summary') {
			const tableFields = fieldsInSection.filter(function(f) { return f.type === 'collection' && f.disabled; });
			const otherFields = fieldsInSection.filter(function(f) { return !(f.type === 'collection' && f.disabled); });
			const tableHtml = tableFields.map(function(f) { return renderCustomsSummaryField(f, [f.name]); }).join('');
			const otherHtml = otherFields.map(function(f) { return renderCustomsLeafField(f, [f.name]); }).join('');
			bodyHtml = (tableHtml && otherHtml)
				? ('<div class="row"><div class="col-sm-8">' + tableHtml + '</div><div class="col-sm-4">' + otherHtml + '</div></div>')
				: (tableHtml + otherHtml);
		} else {
			let gridBuffer = [];
			const flushGrid = function() {
				if (gridBuffer.length) {
					bodyHtml += '<div class="row">' + gridBuffer.join('') + '</div>';
					gridBuffer = [];
				}
			};
			fieldsInSection.forEach(function(field) {
				const path = [field.name];
				if (field.type === 'collection' && !field.disabled) {
					flushGrid();
					bodyHtml += renderCustomsCollectionBlock(field, path);
				} else if (field.type === 'collection' && field.disabled) {
					flushGrid();
					bodyHtml += renderCustomsSummaryField(field, path);
				} else if (field.compound) {
					flushGrid();
					bodyHtml += '<div class="row">' + (field.fields || []).map(function(sub) {
						return '<div class="col-sm-4">' + renderCustomsLeafField(sub, path.concat([sub.name])) + '</div>';
					}).join('') + '</div>';
				} else {
					const colClass = (field.frontType === 'dual_description') ? 'col-sm-12' : 'col-sm-4';
					gridBuffer.push('<div class="' + colClass + '">' + renderCustomsLeafField(field, path) + '</div>');
				}
			});
			flushGrid();
		}
		return '' +
			'<div class="col-sm-12 gk-customs-section">' +
				'<div class="gk-customs-section-heading">' + escapeHtml(customsSectionLabel(sectionKey)) + '</div>' +
				bodyHtml +
			'</div>';
	}

	function renderCustomsCollectionBlock(field, path) {
		const iv = window.InitialValues || {};
		const arr = customsPathGet(GK.state.customsData, path) || [];
		const rowsHtml = arr.map(function(_, idx) { return renderCustomsCollectionRow(field, path, idx); }).join('');
		return '' +
			'<div class="gk-customs-collection-rows" data-collection-path="' + path.join('.') + '">' + rowsHtml + '</div>' +
			'<button type="button" class="btn btn-default btn-sm gk-customs-add-row" data-collection-path="' + path.join('.') + '">+ ' + escapeHtml(iv.langAddCommodity || 'Add item') + '</button>';
	}

	function renderCustomsCollectionRow(field, collPath, idx) {
		const rowPath = collPath.concat([idx]);
		const iv = window.InitialValues || {};
		const subFields = field.fields || [];
		// Dual PL/EN fields (description/composition/purpose) need the full row
		// width for their two inputs + translate button; everything else (hsCode,
		// countryOfOrigin, quantities, weights...) shares a compact 3-per-row grid.
		const dualHtml = subFields.filter(function(f) { return f.frontType === 'dual_description'; })
			.map(function(sub) { return '<div class="col-sm-12">' + renderCustomsLeafField(sub, rowPath.concat([sub.name])) + '</div>'; }).join('');
		const gridHtml = subFields.filter(function(f) { return f.frontType !== 'dual_description'; })
			.map(function(sub) { return '<div class="col-sm-4">' + renderCustomsLeafField(sub, rowPath.concat([sub.name])) + '</div>'; }).join('');
		return '' +
			'<div class="gk-customs-row gk-customs-card" data-row-index="' + idx + '">' +
				'<div class="gk-customs-card-heading gk-customs-row-heading" style="display:flex; align-items:center; justify-content:space-between;">' +
					'<strong>' + escapeHtml(iv.langCommodityItem || 'Item') + ' ' + (idx + 1) + '</strong>' +
					'<button type="button" class="btn btn-danger btn-xs gk-customs-remove-row" data-collection-path="' + collPath.join('.') + '" data-row-index="' + idx + '">' + escapeHtml(iv.langRemoveCommodity || 'Remove') + '</button>' +
				'</div>' +
				'<div class="gk-customs-card-body">' +
					(dualHtml ? ('<div class="row">' + dualHtml + '</div>') : '') +
					(gridHtml ? ('<div class="row">' + gridHtml + '</div>') : '') +
				'</div>' +
			'</div>';
	}

	// GK's totalWeight field models one unit/weightGross/weightNet triple, but both
	// sibling apps (shoper, shopify-app) correctly group by each commodity row's own
	// unitOfMeasurement instead of blending everything into one bucket (a shipment
	// with some items in "EA" and others in "KG" would otherwise sum incompatible
	// units together) - one summary row per distinct unit actually in use.
	function computeCustomsWeightsByUnit(commodities) {
		const map = {};
		const order = [];
		(commodities || []).forEach(function(row) {
			const unit = row.unitOfMeasurement || 'EA';
			if (!map[unit]) { map[unit] = { unit: unit, weightGross: 0, weightNet: 0 }; order.push(unit); }
			const qty = parseFloat(row.quantity) || 0;
			map[unit].weightGross += qty * (parseFloat(row.unitWeightGross) || 0);
			map[unit].weightNet += qty * (parseFloat(row.unitWeightNet) || 0);
		});
		return order.map(function(u) {
			return { unit: map[u].unit, weightGross: Math.round(map[u].weightGross * 1000) / 1000, weightNet: Math.round(map[u].weightNet * 1000) / 1000 };
		});
	}

	// unitOfMeasurement is stored/grouped by its raw code (e.g. "EA", "KG") - looks
	// up the matching option's full label from the commodities field's own choice
	// options (e.g. "Sztuki", "Kilogramy") instead of showing the bare code.
	function customsUnitOfMeasurementName(code) {
		const commoditiesField = (GK.state.customsFields || []).find(function(f) { return f.name === 'commodities'; });
		const unitField = commoditiesField && (commoditiesField.fields || []).find(function(f) { return f.name === 'unitOfMeasurement'; });
		const opt = unitField && (unitField.options || []).find(function(o) { return o.value === code; });
		return opt ? opt.name : code;
	}

	// Renders the "Total weight" summary as its own small table (unit/gross/net per
	// row), reusing the sub-fields' own translated labels/suffixes from the API
	// instead of inventing new ones, plus a non-blocking warning (like both sibling
	// apps show) when the declared customs weight exceeds the actual shipment weight.
	function renderCustomsSummaryField(field, path) {
		const subFieldByName = {};
		(field.fields || []).forEach(function(f) { subFieldByName[f.name] = f; });
		const unitLabel = (subFieldByName.unit && subFieldByName.unit.label) || 'Unit';
		const grossLabel = (subFieldByName.weightGross && subFieldByName.weightGross.label) || 'Gross weight';
		const netLabel = (subFieldByName.weightNet && subFieldByName.weightNet.label) || 'Net weight';
		const grossSuffix = (subFieldByName.weightGross && subFieldByName.weightGross.suffix) || 'kg';
		const netSuffix = (subFieldByName.weightNet && subFieldByName.weightNet.suffix) || 'kg';

		const rows = computeCustomsWeightsByUnit(GK.state.customsData && GK.state.customsData.commodities);
		const orderWeight = parseFloat(GK.state.pickedService && GK.state.pickedService.packageInfo && GK.state.pickedService.packageInfo.weight) || 0;
		const totalGross = rows.reduce(function(sum, r) { return sum + r.weightGross; }, 0);
		const exceeds = orderWeight > 0 && totalGross > orderWeight;

		const bodyRows = rows.length
			? rows.map(function(r) {
				return '<tr><td>' + escapeHtml(customsUnitOfMeasurementName(r.unit)) + '</td><td>' + r.weightGross.toFixed(3) + ' ' + escapeHtml(grossSuffix) + '</td><td>' + r.weightNet.toFixed(3) + ' ' + escapeHtml(netSuffix) + '</td></tr>';
			}).join('')
			: '<tr><td colspan="3" class="text-muted">-</td></tr>';

		const iv = window.InitialValues || {};
		return '' +
			'<div class="gk-customs-weight-summary" data-path="' + path.join('.') + '">' +
				'<label><strong>' + escapeHtml(field.label || field.name) + '</strong></label>' +
				'<table class="table table-condensed" style="margin-bottom:6px;">' +
					'<thead><tr><th>' + escapeHtml(unitLabel) + '</th><th>' + escapeHtml(grossLabel) + '</th><th>' + escapeHtml(netLabel) + '</th></tr></thead>' +
					'<tbody>' + bodyRows + '</tbody>' +
				'</table>' +
				(exceeds ? ('<div class="text-danger">' + escapeHtml(iv.langWeightExceedsOrder || 'Total customs weight exceeds the shipment weight') + '</div>') : '') +
			'</div>';
	}

	function renderCustomsLeafField(field, path) {
		const pathStr = path.join('.');
		const iv = window.InitialValues || {};
		const label = (field.label || field.name || '').split(' ;; ')[0];
		const required = field.required ? ' <span class="text-danger">*</span>' : '';
		const tooltip = field.tooltip ? ' <span class="gk-customs-tooltip" title="' + escapeHtml(field.tooltip) + '">i</span>' : '';
		const currentVal = customsPathGet(GK.state.customsData, path);

		if (field.disabled) {
			return '' +
				'<div class="form-group gk-customs-field">' +
					'<label>' + escapeHtml(label) + required + tooltip + '</label>' +
					'<input type="text" class="form-control gk-customs-input" data-path="' + pathStr + '" value="' + escapeHtml(currentVal != null ? currentVal : '') + '" readonly>' +
				'</div>';
		}

		if (field.frontType === 'dual_description') {
			const pl = (currentVal && currentVal.pl) || '';
			const en = (currentVal && currentVal.en) || '';
			// Confirmed live: the wire payload merges these into ONE string
			// ("PL ;; EN", or just "PL" when EN is empty - see buildCustomsPayloadValue)
			// and the API's Length constraint applies to THAT combined string, not to
			// PL/EN independently (a 50-char max description rejected a "PL ;; EN" pair
			// whose halves were each already under 50 on their own). `maxlength` on each
			// input is only an outer safety net for the empty-EN case; the real
			// enforcement is the combined counter + live truncation in the
			// .gk-customs-input change handler below.
			const maxLen = customsLengthMax(field);
			const maxLenAttr = maxLen != null ? (' maxlength="' + maxLen + '"') : '';
			const combinedLen = customsDualCombinedLength(pl, en);
			const combinedCount = maxLen != null
				? ('<span class="gk-customs-charcount' + (combinedLen > maxLen ? ' gk-customs-charcount-over' : '') + '" data-maxlen="' + maxLen + '">' + combinedLen + '/' + maxLen + '</span>')
				: '';
			return '' +
				'<div class="form-group gk-customs-field gk-customs-dual">' +
					'<label>' + escapeHtml(label) + required + tooltip + '</label>' +
					'<div class="gk-customs-dual-row">' +
						'<span class="gk-customs-dual-col">' +
							'<input type="text" class="form-control gk-customs-input" data-path="' + pathStr + '.pl" value="' + escapeHtml(pl) + '" placeholder="' + escapeHtml(iv.langPl || 'PL') + '"' + maxLenAttr + '>' +
						'</span>' +
						'<button type="button" class="btn btn-primary btn-gk-primary gk-customs-translate" data-path="' + pathStr + '" title="' + escapeHtml(iv.langTranslateToEn || 'Translate to English') + '">' +
							'<i class="icon-refresh icon-spin gk-customs-translate-spinner" style="display:none;"></i>' +
							'<svg class="gk-customs-translate-icon" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#ffffff" style="width:16px;height:16px;vertical-align:middle;"><path d="m488-96 171-456h82L912-96h-79l-41-117H608L567-96h-79ZM169-216l-50-51 192-190q-36-38-67-79t-54-89h82q18 32 36 54.5t52 60.5q38-42 70-87.5t52-98.5H48v-72h276v-96h72v96h276v72H558q-21 69-61 127.5T409-457l91 90-28 74-112-112-191 189Zm463-63h136l-66-189-70 189Z"></path></svg>' +
						'</button>' +
						'<span class="gk-customs-dual-col">' +
							'<input type="text" class="form-control gk-customs-input" data-path="' + pathStr + '.en" value="' + escapeHtml(en) + '" placeholder="' + escapeHtml(iv.langEn || 'EN') + '"' + maxLenAttr + '>' +
						'</span>' +
					'</div>' +
					combinedCount +
				'</div>';
		}

		if (field.type === 'choice') {
			const options = field.options || [];
			if (field.multi) {
				const selectedVals = Array.isArray(currentVal) ? currentVal : [];
				const boxes = options.map(function(o) {
					const checked = selectedVals.indexOf(o.value) !== -1 ? ' checked' : '';
					return '<label class="checkbox"><input type="checkbox" class="gk-customs-input gk-customs-multi" data-path="' + pathStr + '" value="' + escapeHtml(o.value) + '"' + checked + '> ' + escapeHtml(o.name) + '</label>';
				}).join('');
				return '<div class="form-group gk-customs-field"><label>' + escapeHtml(label) + tooltip + '</label>' + boxes + '</div>';
			}
			if (field.expanded) {
				const radios = options.map(function(o) {
					const checked = (currentVal === o.value) ? ' checked' : '';
					return '<label class="radio-inline"><input type="radio" name="gk-customs-' + pathStr.replace(/\./g, '-') + '" class="gk-customs-input" data-path="' + pathStr + '" value="' + escapeHtml(o.value) + '"' + checked + '> ' + escapeHtml(o.name) + '</label>';
				}).join('');
				return '<div class="form-group gk-customs-field"><label>' + escapeHtml(label) + required + tooltip + '</label><div>' + radios + '</div></div>';
			}
			const opts = options.map(function(o) {
				return '<option value="' + escapeHtml(o.value) + '"' + (currentVal === o.value ? ' selected' : '') + '>' + escapeHtml(o.name) + '</option>';
			}).join('');
			return '' +
				'<div class="form-group gk-customs-field">' +
					'<label>' + escapeHtml(label) + required + tooltip + '</label>' +
					'<select class="form-control gk-customs-input" data-path="' + pathStr + '">' + opts + '</select>' +
				'</div>';
		}

		// HS code: optional per the live API (GK auto-matches it server-side when
		// left blank) but a lookup button still lets the merchant confirm/override it.
		const extraBtn = (field.name === 'hsCode')
			? '<button type="button" class="btn btn-default gk-customs-hs-lookup" data-path="' + pathStr + '" title="' + escapeHtml(iv.langSuggestHsCode || 'Suggest HS code') + '">HS?</button>'
			: '';
		const inputType = (field.type === 'number') ? 'number' : (field.frontType === 'date' ? 'date' : 'text');
		const stepAttr = (field.type === 'number' && field.precision != null) ? (' step="' + (1 / Math.pow(10, field.precision)) + '"') : '';
		const patternAttrs = (field.pattern && field.pattern.regex) ? (' data-pattern="' + escapeHtml(field.pattern.regex) + '" data-pattern-error="' + escapeHtml(field.pattern.error || '') + '"') : '';
		const leafMaxLen = customsLengthMax(field);
		const maxLenAttr = (leafMaxLen != null && inputType === 'text') ? (' maxlength="' + leafMaxLen + '"') : '';
		// Unit value / subtotal fields (frontType "currency") show the currently
		// selected currency as a live suffix - updated in the .gk-customs-input
		// change handler whenever the top-level "currency" field itself changes.
		const currentCurrency = (GK.state.customsData && GK.state.customsData.currency) || '';
		const suffixAddon = field.suffix
			? ('<span class="input-group-addon">' + escapeHtml(field.suffix) + '</span>')
			: (field.frontType === 'currency' ? ('<span class="input-group-addon gk-customs-currency-addon">' + escapeHtml(currentCurrency) + '</span>') : '');

		return '' +
			'<div class="form-group gk-customs-field">' +
				'<label>' + escapeHtml(label) + required + tooltip + '</label>' +
				'<div class="' + (extraBtn || suffixAddon ? 'input-group' : '') + '">' +
					'<input type="' + inputType + '" class="form-control gk-customs-input" data-path="' + pathStr + '" value="' + escapeHtml(currentVal != null ? currentVal : '') + '" placeholder="' + escapeHtml(field.placeholder || '') + '"' + stepAttr + patternAttrs + maxLenAttr + '>' +
					(extraBtn ? ('<span class="input-group-btn">' + extraBtn + '</span>') : suffixAddon) +
				'</div>' +
			'</div>';
	}

	function updateCustomsRemoveButtons(collPathStr) {
		const $rows = $('.gk-customs-collection-rows[data-collection-path="' + collPathStr + '"] .gk-customs-row');
		$rows.find('.gk-customs-remove-row').prop('disabled', $rows.length <= 1);
	}

	// Recomputes the two known GK customFunctions formulas seen live: "multiple"
	// (subTotalValue = quantity x unitValue per commodity row) and the totalWeight
	// summary (sum of quantity x unitWeightGross/Net across all rows). GK's own
	// aggregation semantics for other/future customFunctions aren't documented, so
	// unrecognized ones are just left as plain manual inputs rather than guessed at.
	function recalcCustomsComputedFields() {
		const commodities = (GK.state.customsData && GK.state.customsData.commodities) || [];
		let sumGross = 0;
		let sumNet = 0;
		let sumValue = 0;
		commodities.forEach(function(row, idx) {
			const qty = parseFloat(row.quantity) || 0;
			const unitValue = parseFloat(row.unitValue) || 0;
			const subTotal = Math.round(qty * unitValue * 100) / 100;
			row.subTotalValue = subTotal;
			$('.gk-customs-input[data-path="commodities.' + idx + '.subTotalValue"]').val(subTotal);
			sumGross += qty * (parseFloat(row.unitWeightGross) || 0);
			sumNet += qty * (parseFloat(row.unitWeightNet) || 0);
			sumValue += subTotal;
		});
		if (GK.state.customsData && GK.state.customsData.totalWeight) {
			GK.state.customsData.totalWeight.weightGross = Math.round(sumGross * 1000) / 1000;
			GK.state.customsData.totalWeight.weightNet = Math.round(sumNet * 1000) / 1000;
			GK.state.customsData.totalWeight.unit = 'KG';
			renderCustomsSummaryDisplays();
		}
		// The "Declared value" addon field (Additional options -> DECLARED_VALUE) must
		// match what's actually being declared at customs, so keep it derived from the
		// commodities total rather than asking the merchant to enter the same number
		// twice - re-running the value-range filter re-selects the matching addon tier.
		if (commodities.length) {
			const roundedTotal = Math.round(sumValue * 100) / 100;
			if (!GK.state.additionalInfo) GK.state.additionalInfo = {};
			GK.state.additionalInfo.declaredValue = roundedTotal;
			$('#declaredValueInput').val(roundedTotal);
			applyValueRangeFilter('DECLARED_VALUE');
		}
		renderCustomsSummaryTable();
		updateCustomsStatusBadge();
		highlightIncompleteCustomsFields();
		debouncedCustomsCalculation();
	}

	// A unique per-draft id the merchant's browser makes up (GK does not issue one -
	// confirmed: any 64-128 char string works, the same value just needs to be reused
	// across calls). Passing it to /order/customs/calculation lets GK cache that duty
	// estimate under this id; passing the SAME id later in the real order lets GK's
	// LandedCostCalculationService reuse the cached figure instead of recalculating.
	function generateOrderHash() {
		if (window.crypto && window.crypto.getRandomValues) {
			const bytes = new Uint8Array(32);
			window.crypto.getRandomValues(bytes);
			return Array.prototype.map.call(bytes, function(b) { return b.toString(16).padStart(2, '0'); }).join('');
		}
		let s = '';
		for (let i = 0; i < 64; i++) { s += Math.floor(Math.random() * 16).toString(16); }
		return s;
	}

	let _customsCalcDebounceTimer = null;
	function debouncedCustomsCalculation() {
		if (_customsCalcDebounceTimer) clearTimeout(_customsCalcDebounceTimer);
		_customsCalcDebounceTimer = setTimeout(fetchCustomsCalculation, 900);
	}

	function hideCustomsCalculation() {
		$('#customsCalculationPrice').hide().text('').removeAttr('title');
		$('#customsCalculationBreakdown').hide();
		$('#customsCalculationBreakdownBody').empty();
	}

	// Estimated customs duty/fees preview (POST order/customs/calculation) - shown
	// next to the completeness badge. Best-effort only: GK's own docs/behavior treat
	// this as informational (a failed calculation never blocks placing the real
	// order), so any failure here just hides the estimate rather than showing an
	// error - the merchant isn't blocked by it either.
	function fetchCustomsCalculation() {
		const s = GK.state;
		if (!s.pickedService || !Array.isArray(s.customsFields) || !s.customsFields.length || !s.customsData) {
			hideCustomsCalculation();
			return;
		}
		if (!isCustomsFormComplete()) {
			hideCustomsCalculation();
			return;
		}
		if (!s.orderHash) { s.orderHash = generateOrderHash(); }
		const addr = buildAddressOnlyPayload();
		const postalCharges = (s.orderSummary && s.orderSummary.totalGrossPrice != null) ? s.orderSummary.totalGrossPrice : 0;
		const postalChargesCurrency = (s.orderSummary && s.orderSummary.currency) || 'PLN';
		const payload = {
			productId: s.pickedService.id,
			orderHash: s.orderHash,
			force: true,
			purpose: (s.additionalInfo && s.additionalInfo.purpose) || 'SOLD',
			postalCharges: postalCharges,
			postalChargesCurrency: postalChargesCurrency,
			senderAddress: addr.senderAddress,
			receiverAddress: addr.receiverAddress,
			customs: buildCustomsPayload(s.customsFields, s.customsData)
		};
		const headers = Object.assign({ 'Content-Type': 'application/json' }, buildHeaders());
		fetch(gkApiBase() + 'order/customs/calculation', {
			method: 'POST',
			headers: headers,
			body: JSON.stringify(payload)
		}).then(function(r) { return r.ok ? r.json() : null; })
			.then(function(resp) {
				if (!resp) { hideCustomsCalculation(); return; }
				renderCustomsCalculation(resp);
				// Now that GK has cached a duty estimate under s.orderHash, refetch
				// order/price (which now sends that same hash) so the DUTY_DDP_PREMIUM/
				// DUTY_DAP/CUSTOMS_CLEARANCE_FEE addon lines pick up the real amount
				// instead of staying at 0.00 from the earlier, hash-less price call.
				recalcOrderPrice();
			})
			.catch(function() { hideCustomsCalculation(); });
	}

	// Mirrors exactly how GK's own web panel presents this response (confirmed by
	// the user against the live site): grouped by type (Fees/Duties/Taxes), each line
	// headed by `description` (even when it's a raw code like
	// "US_SEC301_FORCED_LABOR_EU_UPTO10PCT" - GK's own UI shows it verbatim too),
	// amount always paired with its origin amount/currency and exchange rate, and
	// `note` (the human-readable explanation) appended in parentheses at the end.
	function renderCustomsCalculation(resp) {
		const iv = window.InitialValues || {};
		const sections = [
			{ items: resp.fees || [], labelKey: 'langCustomsFees', fallback: 'Fees' },
			{ items: resp.duties || [], labelKey: 'langCustomsDuties', fallback: 'Duties' },
			{ items: resp.taxes || [], labelKey: 'langCustomsTaxes', fallback: 'Taxes' }
		];
		const allItems = [].concat(resp.fees || [], resp.duties || [], resp.taxes || []);
		if (!allItems.length) { hideCustomsCalculation(); return; }

		// Compact total (+ plain-text tooltip breakdown) shown next to the status badge.
		const sumsByCurrency = {};
		const tooltipLines = [];
		allItems.forEach(function(item) {
			const cur = item.currency || 'PLN';
			const amount = parseFloat(item.amount) || 0;
			sumsByCurrency[cur] = (sumsByCurrency[cur] || 0) + amount;
			tooltipLines.push((item.description || '') + (item.note ? (' (' + item.note + ')') : '') + ': ' + (Math.round(amount * 100) / 100) + ' ' + cur);
		});
		const totalText = Object.keys(sumsByCurrency).map(function(cur) {
			return (Math.round(sumsByCurrency[cur] * 100) / 100) + ' ' + cur;
		}).join(' + ');
		$('#customsCalculationPrice')
			.attr('title', tooltipLines.join('\n'))
			.text((iv.langEstimatedDuty || 'Estimated duty/fees') + ': ' + totalText)
			.show();

		// Full itemized breakdown, grouped by type, shown inside the modal.
		const sectionsHtml = sections.filter(function(s) { return s.items.length; }).map(function(section) {
			const itemsHtml = section.items.map(function(item) {
				const amount = parseFloat(item.amount) || 0;
				const originAmount = parseFloat(item.originAmount) || 0;
				const noteTxt = item.note ? (' (' + escapeHtml(item.note) + ')') : '';
				return '' +
					'<div>' +
						'<strong>' + escapeHtml(item.description || '') + ':</strong> ' +
						amount.toFixed(2) + ' ' + escapeHtml(item.currency || '') +
						' (' + originAmount.toFixed(2) + ' ' + escapeHtml(item.originCurrency || '') + ', ' + escapeHtml(iv.langRate || 'rate') + ': ' + (item.rate != null ? item.rate : '') + ')' +
						noteTxt +
					'</div>';
			}).join('');
			return '<div style="margin-top:6px;"><strong>' + escapeHtml(iv[section.labelKey] || section.fallback) + ':</strong>' + itemsHtml + '</div>';
		}).join('');
		$('#customsCalculationBreakdownBody').html(sectionsHtml);
		$('#customsCalculationBreakdown').show();
	}

	// Read-only preview of the commodities list shown next to the "Customs
	// clearance" button, so the merchant can see what's been declared without
	// opening the modal - mirrors the summary table in the sibling shopify-app
	// (there it only refreshes on Save; ours stays live since our modal has no
	// separate save step - GK.state.customsData is already the live source of truth).
	function renderCustomsSummaryTable() {
		const commodities = (GK.state.customsData && GK.state.customsData.commodities) || [];
		const currency = (GK.state.customsData && GK.state.customsData.currency) || '';
		if (!commodities.length) { $('#customsSummaryTable').hide(); return; }
		const rows = commodities.map(function(row) {
			const desc = (row.description && row.description.pl) || '';
			const comp = (row.composition && row.composition.pl) || '';
			const purp = (row.purpose && row.purpose.pl) || '';
			const hsCode = row.hsCode || '';
			const qty = row.quantity != null ? row.quantity : '';
			const subtotal = row.subTotalValue != null ? row.subTotalValue : '';
			return '<tr>' +
				'<td>' + escapeHtml(desc) + '</td>' +
				'<td>' + escapeHtml(comp) + '</td>' +
				'<td>' + escapeHtml(purp) + '</td>' +
				'<td>' + escapeHtml(hsCode) + '</td>' +
				'<td>' + escapeHtml(String(qty)) + '</td>' +
				'<td>' + escapeHtml(String(subtotal)) + (currency ? (' ' + escapeHtml(currency)) : '') + '</td>' +
			'</tr>';
		}).join('');
		$('#customsSummaryTableBody').html(rows);
		$('#customsSummaryTable').show();
	}

	function renderCustomsSummaryDisplays() {
		const field = (GK.state.customsFields || []).find(function(f) { return f.type === 'collection' && f.disabled; });
		if (!field) return;
		const $existing = $('.gk-customs-weight-summary[data-path="' + field.name + '"]');
		if ($existing.length) {
			$existing.replaceWith(renderCustomsSummaryField(field, [field.name]));
		}
	}

	function validateCustomsFieldPattern($el) {
		const pattern = $el.data('pattern');
		$el.next('.gk-inline-field-error').remove();
		if (!pattern) { $el.removeClass('gk-field-error'); return; }
		const val = $el.val();
		if (val && !(new RegExp(pattern)).test(val)) {
			$el.addClass('gk-field-error');
			$('<div class="gk-inline-field-error"></div>').text($el.data('pattern-error') || '').insertAfter($el);
		} else {
			$el.removeClass('gk-field-error');
		}
	}

	// Builds the final `customs` payload for POST order/order validate from the
	// collected editor state, using field metadata to know how to shape each value
	// (join PL/EN dual fields with " ;; " per GK's own documented example, map
	// collections/compounds, coerce numbers).
	function buildCustomsPayloadValue(field, value) {
		if (field.type === 'collection') {
			if (field.disabled) {
				// totalWeight: confirmed against a real working request/response pair that
				// GK expects an ARRAY - one entry per distinct unitOfMeasurement actually
				// used across the commodities - not the single blended object its own
				// compound sub-fields (unit/weightGross/weightNet) would naively suggest.
				if (field.name === 'totalWeight') {
					return computeCustomsWeightsByUnit(GK.state.customsData && GK.state.customsData.commodities);
				}
				const obj = {};
				(field.fields || []).forEach(function(sub) { obj[sub.name] = (value || {})[sub.name]; });
				return obj;
			}
			return (value || []).map(function(row) {
				const obj = {};
				(field.fields || []).forEach(function(sub) { obj[sub.name] = buildCustomsPayloadValue(sub, row[sub.name]); });
				return obj;
			});
		}
		if (field.compound) {
			const obj = {};
			(field.fields || []).forEach(function(sub) { obj[sub.name] = buildCustomsPayloadValue(sub, (value || {})[sub.name]); });
			return obj;
		}
		if (field.frontType === 'dual_description') {
			const pl = (value && value.pl) || '';
			const en = (value && value.en) || '';
			return en ? (pl + ' ;; ' + en) : pl;
		}
		if (field.type === 'number') {
			return (value === '' || value == null) ? null : parseFloat(value);
		}
		return value;
	}

	function buildCustomsPayload(fields, data) {
		const out = {};
		fields.forEach(function(field) { out[field.name] = buildCustomsPayloadValue(field, data[field.name]); });
		return out;
	}

function renderSummaryContainer() {
    $('#summaryContainer').show();
    const $box = $('#discountAndSummary');
    $(document).off('click', '#applyDiscountBtn').on('click', '#applyDiscountBtn', function(){
        GK.state.discountCode = ($('#discountCodeInput').val() || '').trim();
        recalcOrderPrice();
    });
    $(document).off('click', '#clearDiscountBtn').on('click', '#clearDiscountBtn', function(){
        GK.state.discountCode = '';
        $('#discountCodeInput').val('');
        recalcOrderPrice();
    });
}

	function updateSendButtonDisabled() {
		const disabled = (!GK.state.pickedService) || (!GK.state.additionalInfo || !GK.state.additionalInfo.paymentType) || !!GK.state.priceError;
		$('#sendOrderBtn').prop('disabled', disabled);
	}

	function recalcOrderPrice() {
		updateSendButtonDisabled();
		const s = GK.state;
		try { ensureCountryIdsFromIso(); } catch(e) {}
		if (!s.pickedService || !s.additionalInfo || !s.additionalInfo.paymentType) return;
		// Independent of the price fetch below (not gating it) - just a proactive
		// pre-check so address/addon problems surface before the merchant hits "send".
		debouncedFullOrderValidate();
		const p = s.packageInfo || {};
		const usp = new URLSearchParams();
		usp.append('productId', s.pickedService.id);
		usp.append('length', p.length || 0);
		usp.append('width', p.width || 0);
		usp.append('height', p.height || 0);
		usp.append('weight', p.weight || 0);
		usp.append('quantity', p.count || 1);
		usp.append('senderCountryId', (s.sender && s.sender.country && s.sender.country.id) || 1);
		usp.append('receiverCountryId', (s.receiver && s.receiver.country && s.receiver.country.id) || 1);
		usp.append('senderPostCode', (s.sender && s.sender.postalCode) || (window.InitialValues && window.InitialValues.sender && window.InitialValues.sender.postCode) || '');
		usp.append('receiverPostCode', (s.receiver && s.receiver.postalCode) || (window.InitialValues && window.InitialValues.receiver && window.InitialValues.receiver.postCode) || '');
		usp.append('paymentId', parseInt(s.additionalInfo.paymentType, 10) || s.additionalInfo.paymentType);
		if (Array.isArray(s.serviceOptions) && s.serviceOptions.length) {
			s.serviceOptions.forEach(function(opt){
				const id = parseInt(opt.id, 10) || opt.id;
				usp.append('addonIds[]', id);
			});
		}
		if (s.additionalInfo && s.additionalInfo.insuranceAmount) usp.append('insuranceValue', s.additionalInfo.insuranceAmount);
		if (s.additionalInfo && s.additionalInfo.codAmount) usp.append('cashOnDeliveryValue', s.additionalInfo.codAmount);
		if (s.discountCode) usp.append('discountCode', s.discountCode);
		// Confirmed live: without this, /order/price assumes customs duty is zero -
		// it has no way to estimate DUTY_DDP_PREMIUM/DUTY_DAP/CUSTOMS_CLEARANCE_FEE
		// addon prices from the commodities alone. Passing the SAME orderHash already
		// used in a successful POST order/customs/calculation (see
		// fetchCustomsCalculation) lets it pull that cached duty estimate into the
		// addon prices instead of showing 0.00.
		if (s.orderHash) usp.append('orderHash', s.orderHash);

		const url = gkApiBase() + 'order/price?' + usp.toString();
		$('#priceErrorBox').hide().text('');
		return fetch(url, { headers: buildHeaders() })
			.then(function(r){ return r.json(); })
			.then(function(resp){
                if (resp && resp.totalNetPrice != null) {
					GK.state.orderSummary = resp;
					GK.state.priceError = null;
					const cur = resp.currency ? (' ' + resp.currency) : ' PLN';
                    const fuel = (resp.fuelSurchargeGrossPrice != null ? resp.fuelSurchargeGrossPrice : resp.fuelSurcharge);
                    const baseNet = (resp.totalNetPrice != null ? resp.totalNetPrice : null);
                    const addonsNet = (resp.addonsNetPrice != null ? resp.addonsNetPrice : 0);
                    const netWithFuel = (resp.productsGrossPrice != null ? resp.productsGrossPrice : null);
                    const gross = (resp.totalGrossPrice != null ? resp.totalGrossPrice : null);
                    const discount = (resp.discountNetPrice != null ? resp.discountNetPrice : 0);

					$('#summaryBaseNet').text(baseNet != null ? (baseNet + cur) : '-');
                    $('#summaryRowBaseNet').toggle(baseNet != null);

                    $('#summaryAddonsNet').text(addonsNet ? (addonsNet + cur) : ('0' + cur));
                    $('#summaryRowAddons').toggle(!!addonsNet);
                    $('#summaryDiscount').text(discount ? ('-' + discount + cur) : ('0' + cur));
                    $('#summaryRowDiscount').toggle(!!discount);

					$('#summaryNetWithFuel').text(netWithFuel != null ? (netWithFuel + cur) : '-');
                    $('#summaryRowNetWithFuel').toggle(netWithFuel != null);

					$('#summaryGross').text(gross != null ? (gross + cur) : '-');
                    $('#summaryRowGross').toggle(gross != null);

                    $('#summaryFuel').text(fuel != null ? (fuel + cur) : '-');
                    $('#summaryRowFuel').toggle(fuel != null);
                    // VAT: prefer explicit vatPercent; fall back to taxType like "VAT23"
                    let parsedVat = null;
                    if (resp && !resp.vatPercent && resp.taxType && /^VAT(\d+)/.test(resp.taxType)) {
                        parsedVat = parseInt(RegExp.$1, 10);
                    }
                    const effectiveVatPercent = (resp && resp.vatPercent != null) ? resp.vatPercent : parsedVat;
                    const vatVal = (resp.totalGrossPrice != null && resp.totalNetPrice != null)
                        ? (resp.totalGrossPrice - resp.totalNetPrice)
                        : null;
                    if (effectiveVatPercent != null || (vatVal != null && !isNaN(vatVal))) {
                        if (effectiveVatPercent != null) {
                            $('#summaryVatLabel').text('(' + effectiveVatPercent + '%)');
                        } else {
                            $('#summaryVatLabel').text('');
                        }
                        const vatText = (vatVal != null && !isNaN(vatVal)) ? vatVal.toFixed(2) + cur : ('0' + cur);
                        $('#summaryVat').text(vatText);
                        $('#summaryRowVat').show();
                    } else {
                        $('#summaryVatLabel').text('');
                        $('#summaryVat').text('-');
                        $('#summaryRowVat').hide();
                    }
				} else {
					let msg = 'Błąd kalkulacji ceny';
					if (resp && resp.fields && typeof resp.fields === 'object') {
						try {
							msg = Object.keys(resp.fields).map(function(k){ return k + ': ' + resp.fields[k]; }).join('\n');
						} catch(e) {}
					} else if (resp && resp.message) {
						msg = resp.message;
					}
					GK.state.priceError = msg;
					$('#priceErrorBox').text(msg).show();
					// If the error concerns discountCode, recalc without code to zero the discount in summary
					if (resp && resp.fields && resp.fields.discountCode) {
						try {
							const usp2 = new URLSearchParams(usp.toString());
							usp2.delete('discountCode');
							const url2 = gkApiBase() + 'order/price?' + usp2.toString();
							return fetch(url2, { headers: buildHeaders() })
								.then(function(r){ return r.json(); })
								.then(function(r2){
									if (!r2 || r2.totalNetPrice == null) { return; }
									GK.state.orderSummary = r2;
									const cur2 = r2.currency ? (' ' + r2.currency) : ' PLN';
									const fuel2 = (r2.fuelSurchargeGrossPrice != null ? r2.fuelSurchargeGrossPrice : r2.fuelSurcharge);
									const baseNet2 = (r2.totalNetPrice != null ? r2.totalNetPrice : null);
									const addonsNet2 = (r2.addonsNetPrice != null ? r2.addonsNetPrice : 0);
									const netWithFuel2 = (r2.productsGrossPrice != null ? r2.productsGrossPrice : null);
									const gross2 = (r2.totalGrossPrice != null ? r2.totalGrossPrice : null);
									const discount2 = 0; // wyzerowany rabat
									$('#summaryBaseNet').text(baseNet2 != null ? (baseNet2 + cur2) : '-');
									$('#summaryRowBaseNet').toggle(baseNet2 != null);
									$('#summaryAddonsNet').text(addonsNet2 ? (addonsNet2 + cur2) : ('0' + cur2));
									$('#summaryRowAddons').toggle(!!addonsNet2);
									$('#summaryDiscount').text('0' + cur2);
									$('#summaryRowDiscount').toggle(false);
									$('#summaryNetWithFuel').text(netWithFuel2 != null ? (netWithFuel2 + cur2) : '-');
									$('#summaryRowNetWithFuel').toggle(netWithFuel2 != null);
									$('#summaryGross').text(gross2 != null ? (gross2 + cur2) : '-');
									$('#summaryRowGross').toggle(gross2 != null);
									$('#summaryFuel').text(fuel2 != null ? (fuel2 + cur2) : '-');
									$('#summaryRowFuel').toggle(fuel2 != null);
									let parsedVat2 = null;
									if (r2 && !r2.vatPercent && r2.taxType && /^VAT(\d+)/.test(r2.taxType)) { parsedVat2 = parseInt(RegExp.$1, 10); }
									const effVat2 = (r2 && r2.vatPercent != null) ? r2.vatPercent : parsedVat2;
									const vatVal2 = (r2.totalGrossPrice != null && r2.totalNetPrice != null) ? (r2.totalGrossPrice - r2.totalNetPrice) : null;
									if (effVat2 != null || (vatVal2 != null && !isNaN(vatVal2))) {
										$('#summaryVatLabel').text(effVat2 != null ? ('(' + effVat2 + '%)') : '');
										$('#summaryVat').text(vatVal2 != null ? vatVal2.toFixed(2) + cur2 : ('0' + cur2));
										$('#summaryRowVat').show();
									} else {
										$('#summaryVatLabel').text('');
										$('#summaryVat').text('-');
										$('#summaryRowVat').hide();
									}
									updateSendButtonDisabled();
								});
						} catch(e) {}
					}
				}
				updateSendButtonDisabled();
			});
	}

function renderServicesAndBind() {
    // Keep TPL markup; only bind events here
    populatePackageInputs();
    populateReceiverPoints(); // Display receiver points in UI
    $('#getServicesBtn').off('click').on('click', function(){
            clearErrors();
            setPackageInfoFromInputs();
            const dimFields = validateDimensions();
            if (dimFields) { showValidationErrors({ dimensionFields: dimFields }); return; }
            const $btn = $(this);
            $btn.prop('disabled', true);
            $btn.find('i.icon-cog').show();
            GK.state.forceShowAll = true;
            GK.state.forModal = true;
            fetchProducts().then(function(){ $('#servicesPickModal').modal('show'); })
            .finally(function(){ $btn.prop('disabled', false); $btn.find('i.icon-cog').hide(); });
        });
    // Also handle top Change button
    $(document).off('click', '#openServicesModal').on('click', '#openServicesModal', function(){
        GK.state.forceShowAll = $('#service_filters_on').is(':checked');
        GK.state.forModal = true;
        fetchProducts().then(function(){ $('#servicesPickModal').modal('show'); });
    });
		$(document).off('click', '.pick-product').on('click', '.pick-product', function(){
			const productId = $(this).data('id');
			// find selected product in last list
			const found = (GK.state.products || []).find(function(p){ return (p.id + '') === (productId + ''); });
			if (found) {
				GK.state.pickedService = Object.assign({}, found);
				GK.state.pickedService.packageInfo = GK.state.packageInfo;
			} else {
				const $card = $(this).closest('.glob-product-block');
				const name = $card.find('strong').first().text();
				GK.state.pickedService = { id: productId, carrierName: name, name: $card.find('span').first().text(), packageInfo: GK.state.packageInfo };
			}

			// Clear previously selected pickup/drop-off points when switching carrier/service.
			// Otherwise old terminal IDs remain in state and labels.
			if (!GK.state.additionalInfo) GK.state.additionalInfo = {};
			const ai = GK.state.additionalInfo;
			[
				// receiver points
				'inPostReceiverPoint',
				'paczkaRuchReceiverPoint',
				'pocztex48owpReceiverPoint',
				'dhlparcelReceiverPoint',
				'dpdpickupReceiverPoint',
				'fedexReceiverPoint',
				// sender points
				'inPostSenderPoint',
				'dhlparcelSenderPoint',
				'paczkaRuchSenderPoint',
				'pocztex48owpSenderPoint',
				'dpdpickupSenderPoint',
				'fedexSenderPoint'
			].forEach(function(k){
				if (ai && Object.prototype.hasOwnProperty.call(ai, k)) delete ai[k];
			});
			// Also clear fallback terminal IDs that might be used by buildOrderData.
			if (GK.state.receiver && Object.prototype.hasOwnProperty.call(GK.state.receiver, 'terminal')) delete GK.state.receiver.terminal;
			if (GK.state.sender && Object.prototype.hasOwnProperty.call(GK.state.sender, 'terminal')) delete GK.state.sender.terminal;

			// Clear labels in UI.
			$('#inpostReceiverLabel, #orlenReceiverLabel, #pocztexReceiverLabel, #dhlReceiverLabel, #dpdReceiverLabel, #fedexReceiverLabel').text('');
			$('#inpostSenderLabel, #orlenSenderLabel, #pocztexSenderLabel, #dhlSenderLabel, #dpdSenderLabel, #fedexSenderLabel').text('');
			$('#senderPointLabel').text('');

			// Restore pre-loaded terminal from customer's cart selection (cleared above, but customer's choice must persist).
			const iv = window.InitialValues;
			if (!GK.state.additionalInfo) GK.state.additionalInfo = {};
			if (iv && iv.terminalCode && iv.terminalType) {
				const tt = (iv.terminalType + '').trim();
				if (tt === 'inpost' || tt === 'inpost_cod' || tt === 'inpostCod') {
					GK.state.additionalInfo.inPostReceiverPoint = { id: iv.terminalCode };
				} else if (tt === 'ruch') {
					GK.state.additionalInfo.paczkaRuchReceiverPoint = { id: iv.terminalCode };
				} else if (tt === 'pocztex48owp') {
					GK.state.additionalInfo.pocztex48owpReceiverPoint = { id: iv.terminalCode };
				} else if (tt === 'dhlparcel') {
					GK.state.additionalInfo.dhlparcelReceiverPoint = { id: iv.terminalCode };
				} else if (tt === 'dpdpickup') {
					GK.state.additionalInfo.dpdpickupReceiverPoint = { id: iv.terminalCode };
				}
				GK.state.receiver = GK.state.receiver || {};
				GK.state.receiver.terminal = iv.terminalCode;
			}
			// Always restore default sender point — cleared above, must persist across service changes.
			if (iv && iv.defaultInPostPoint) {
				GK.state.additionalInfo.inPostSenderPoint = { id: iv.defaultInPostPoint };
			}
			populateReceiverPoints();

			// reset previously selected addons/options when changing service
			GK.state.serviceOptions = [];
			fetchAddonsAndPayments();
			renderSummaryContainer();
			updateSendButtonDisabled();
            $('#servicesPickModal').modal('hide');
            GK.state.forModal = false;
            // show top service card and options sections
            updateChosenServiceUI();
			$('#openServicesModal').show();
            $('#servicesContainer').show();
            $('#servicesListContainer').show();
            $('#serviceOptionsContainer').show();
			$('#getServicesBtn').hide();
            // Ensure the PICKUP/POINT radio maps to the picked service's allowed collection types.
            // This is especially important for CROSSBORDER services, where POINT -> CROSSBORDER mapping is used.
            enforceCollectionTypeRadios();
            updateCarrierDependentUI();
            // preload time ranges if courier pickup selected
            if ($('input[name=pickup_type]:checked').val() === 'PICKUP') { fetchTimeRanges(); }
		fetchCustomRequiredFields();
		fetchCustomsConfig();
		});

		$(document).on('change', '.addon-checkbox', function(){
			const $current = $(this);
			const id = $current.data('id');
			const price = $current.data('price');
			const category = $current.data('category');
			// Read just the addon name span, not the whole <label> text - that also
			// contains the price suffix and the description tooltip icon.
			const $nameSpan = $current.closest('label').find('.addon-name-text');
			const addonName = ($nameSpan.length ? $nameSpan.text() : $current.closest('label').text()).trim();
			const $attrBox = $current.closest('.col-lg-12').find('.addon-attributes');
			let isChecked = $current.is(':checked');

			// isRequired addons can't be turned off - re-check and bail out immediately
			// on any attempt to uncheck one (mouse click, keyboard, whatever fired this
			// 'change'), before any of the state-mutating logic below runs.
			if (!isChecked && $current.data('required') == 1) {
				$current.prop('checked', true);
				isChecked = true;
				return;
			}

			// COD strictly requires INSURANCE - confirmed against GK's own backend
			// validator (OrderValidator::validateAddonListWithPaymentNKO is the ONLY
			// path that accepts INSURANCE_CARGO as a substitute, and that's a separate
			// payment method this module doesn't use). For the standard flow,
			// INSURANCE_CARGO alone + CASH_ON_DELIVERY is rejected server-side with
			// "Addon insurance must be selected." - block unchecking the active
			// INSURANCE tier while COD is selected, the same way isRequired addons
			// can't be turned off, instead of letting the merchant reach an order that
			// will fail at submission.
			if (!isChecked && category === 'INSURANCE') {
				const codIsChecked = $('.addon-checkbox[data-category="CASH_ON_DELIVERY"]:checked').length > 0;
				if (codIsChecked) {
					$current.prop('checked', true);
					isChecked = true;
					return;
				}
			}

			// This handler accumulated a lot of category-specific branches this session
			// (isRequired, requiredAlternativeAddonsGroups, COD-requires-insurance,
			// extra fields...) - wrap them so a bug in any one of them can never again
			// silently skip the price refetch/validate that must always happen after an
			// addon selection changes.
			try {

			// Categories limited to a single choice *within their own category* (only one
			// COD tier, only one INSURANCE tier, only one INSURANCE_CARGO tier at a time).
			// INSURANCE and INSURANCE_CARGO are deliberately NOT merged into one group
			// here even though they share an amount field/input - a client can buy
			// regular insurance AND additional cargo insurance at the same time, so
			// checking one must not uncheck the other (see VALUE_CATEGORY_GROUPS.INSURANCE
			// perCategory / applyValueRangeFilter for how both get offered together).
			const exclusivityGroups = {
				'CASH_ON_DELIVERY': 'CASH_ON_DELIVERY',
				'INSURANCE': 'INSURANCE',
				'INSURANCE_CARGO': 'INSURANCE_CARGO'
			};
			const currentGroup = exclusivityGroups[category];

			// When checking an option from one of the groups above, uncheck others in THE SAME group
			if (isChecked && currentGroup) {
				$('.addon-checkbox').each(function(){
					const $other = $(this);
					if ($other[0] === $current[0]) return;
					const otherCat = $other.data('category');
					if (exclusivityGroups[otherCat] !== currentGroup) return; // only within the same exclusivity group
					if ($other.is(':checked')) {
						const otherId = $other.data('id');
						const $otherAttrBox = $other.closest('.col-lg-12').find('.addon-attributes');
						$other.prop('checked', false);
						$otherAttrBox.hide().empty();
						GK.state.serviceOptions = (GK.state.serviceOptions || []).filter(function(o){ return (o.id + '') !== (otherId + ''); });
					}
				});
			}

			// Unchecking a CASH_ON_DELIVERY/INSURANCE/INSURANCE_CARGO addon should clear
			// the amount typed into its shared input too, once no addon of that value
			// group is checked anymore - otherwise the amount lingers in the UI/state
			// with no addon left to attach it to. INSURANCE and INSURANCE_CARGO share one
			// input (see VALUE_CATEGORY_GROUPS.INSURANCE), so only clear it when BOTH are
			// unchecked, not just the one that changed. DECLARED_VALUE is excluded - its
			// value can be legitimately required by customs even with no addon selected
			// (see renderAddonsList's requiredByGk handling).
			if (!isChecked) {
				const valueGroupKey = Object.keys(VALUE_CATEGORY_GROUPS).find(function(gk) {
					return gk !== 'DECLARED_VALUE' && VALUE_CATEGORY_GROUPS[gk].categories.indexOf(category) !== -1;
				});
				if (valueGroupKey) {
					const valueGroup = VALUE_CATEGORY_GROUPS[valueGroupKey];
					const stillChecked = valueGroup.categories.some(function(cat) {
						return $('.addon-checkbox[data-category="' + cat + '"]:checked').length > 0;
					});
					if (!stillChecked) {
						$('#' + valueGroup.inputId).val('');
						const stateField = VALUE_GROUP_STATE_FIELD[valueGroupKey];
						if (stateField && GK.state.additionalInfo) { GK.state.additionalInfo[stateField] = ''; }
						// The field is genuinely empty again now - let a future COD amount
						// entry auto-fill it once more instead of staying permanently stuck
						// from an earlier manual edit.
						if (valueGroupKey === 'INSURANCE') { GK.state.insuranceAmountManuallyEdited = false; }
						// Re-run the filter now that the input is empty - it empties the
						// rendered tier checkboxes for this group AND purges their ids from
						// GK.state.serviceOptions (purgeUnrendered), so nothing stale is left
						// either visible or sitting in state ready to be resubmitted.
						applyValueRangeFilter(valueGroupKey);
					}
				}
			}

			// ORDERED_COURIER and PAID_PICKUP are mutually exclusive
			const pickupMethodPair = ['ORDERED_COURIER', 'PAID_PICKUP'];
			if (isChecked && pickupMethodPair.indexOf(category) !== -1) {
				$('.addon-checkbox').each(function(){
					const $other = $(this);
					if ($other[0] === $current[0]) return;
					const otherCat = $other.data('category');
					if (pickupMethodPair.indexOf(otherCat) === -1) return;
					if ($other.is(':checked')) {
						const otherId = $other.data('id');
						const $otherAttrBox = $other.closest('.col-lg-12').find('.addon-attributes');
						$other.prop('checked', false);
						$otherAttrBox.hide().empty();
						GK.state.serviceOptions = (GK.state.serviceOptions || []).filter(function(o){ return (o.id + '') !== (otherId + ''); });
					}
				});
			}
			if (pickupMethodPair.indexOf(category) !== -1) {
				updatePickupMetaVisibility();
			}

			// COD must be insured: auto-fill the insurance amount (from the COD amount
			// itself, the money actually at risk) and let applyValueRangeFilter pick the
			// cheapest matching INSURANCE tier - but only when the merchant hasn't typed
			// into the insurance field themselves. Confirmed against shoper's own
			// COD->insurance cascade: gating this on "insurance is currently empty"
			// (the old check) broke on the very first keystroke of the COD amount -
			// typing "500" fires this on every digit, so as soon as insurance got set
			// to "5" from the first keystroke it was no longer empty, and the rest of
			// "00" never made it in. A manually-edited flag (like shoper's
			// insuranceValueManuallyEdited) keeps syncing on every keystroke instead.
			if (isChecked && category === 'CASH_ON_DELIVERY') {
				const $insuranceInput = $('#insuranceAmountInput');
				const codAmount = GK.state.additionalInfo && GK.state.additionalInfo.codAmount;
				if (!GK.state.insuranceAmountManuallyEdited && codAmount) {
					$insuranceInput.val(codAmount);
					if (!GK.state.additionalInfo) GK.state.additionalInfo = {};
					GK.state.additionalInfo.insuranceAmount = codAmount;
					applyValueRangeFilter('INSURANCE');
				}
			}

			// requiredAlternativeAddonsGroups: addon ids GlobKurier reports as mutually
			// exclusive alternatives (e.g. RECEIVER_TYPE_COMPANY vs RECEIVER_TYPE_PRIVATE_PERSON),
			// rendered as real <input type="radio"> so the browser enforces exclusivity
			// visually - but browsers only fire 'change' on the radio that BECOMES
			// checked, never on the one that becomes unchecked. Relying on ":checked"
			// here to decide what to remove is therefore a no-op for true radios (the
			// previous pick is already unchecked in the DOM by the time this runs) and
			// let a stale previous selection linger in GK.state.serviceOptions - two
			// members of the same group both ended up in the real order payload,
			// rejected server-side as "Dodatek z grupy wymaganych dodatków nie
			// został przekazany" (confirmed live). Purge every other group member
			// from state unconditionally instead of gating it on DOM :checked state.
			if (isChecked && Array.isArray(GK.state.requiredAlternativeAddonsGroups)) {
				const myGroups = GK.state.requiredAlternativeAddonsGroups.filter(function(g){ return Array.isArray(g) && g.some(function(gid){ return String(gid) === String(id); }); });
				if (myGroups.length) {
					const groupIds = [];
					myGroups.forEach(function(g){ g.forEach(function(gid){ groupIds.push(String(gid)); }); });
					GK.state.serviceOptions = (GK.state.serviceOptions || []).filter(function(o){
						return (o.id + '') === (id + '') || groupIds.indexOf(o.id + '') === -1;
					});
					$('.addon-checkbox').each(function(){
						const $other = $(this);
						if ($other[0] === $current[0]) return;
						if (groupIds.indexOf(String($other.data('id'))) === -1) return;
						$other.prop('checked', false);
						$other.closest('.col-lg-12').find('.addon-attributes').hide().empty();
					});
				}
			}

			// SENT addon: show a free-text "SENT number" field instead of the generic
			// decoded attributes box (SENT addons don't carry an `attributes` payload).
			const extraFieldsDef = ADDON_CATEGORY_EXTRA_FIELDS[category];
			if (category === 'SENT') {
				if (isChecked) {
					const iv = window.InitialValues || {};
					$attrBox.html('<input type="text" class="form-control gk-sent-number-input" data-id="' + id + '" placeholder="' + escapeHtml(iv.langSentNumber || 'SENT number') + '">').show();
				} else {
					$attrBox.hide().empty();
				}
			} else if (extraFieldsDef) {
				if (isChecked) {
					const iv = window.InitialValues || {};
					const existing = (GK.state.serviceOptions || []).find(function(o){ return (o.id + '') === (id + ''); });
					const fieldsHtml = extraFieldsDef.map(function(f) {
						const val = existing ? (existing[f.key] || '') : '';
						return '' +
							'<div class="form-group" style="margin-top:6px;">' +
								'<label>' + escapeHtml(iv[f.labelKey] || f.key) + '</label>' +
								'<input type="text" class="form-control gk-addon-extra-field" data-id="' + id + '" data-field="' + f.key + '" value="' + escapeHtml(val) + '" placeholder="' + escapeHtml(f.placeholder || '') + '">' +
							'</div>';
					}).join('');
					$attrBox.html(fieldsHtml).show();
				} else {
					$attrBox.hide().empty();
				}
			} else {
				// Every other addon: no per-selection input needed in .addon-attributes -
				// its `attributes` HTML (if any) is now rendered immediately/always-visible
				// at build time (see renderAddonCheckboxHtml), not gated by isChecked here.
				$attrBox.hide().empty();
			}

			if (isChecked) {
				if (!Array.isArray(GK.state.serviceOptions)) GK.state.serviceOptions = [];
				if (!GK.state.serviceOptions.some(function(o){ return (o.id + '') === (id + ''); })) {
					const newOption = {
						id: id,
						price: price,
						category: category,
						name: addonName
					};
					if (category === 'SENT') { newOption.sentNumber = ''; }
					if (ADDON_CATEGORY_EXTRA_FIELDS[category]) {
						ADDON_CATEGORY_EXTRA_FIELDS[category].forEach(function(f) { newOption[f.key] = ''; });
					}
					GK.state.serviceOptions.push(newOption);
				}
			} else {
				GK.state.serviceOptions = (GK.state.serviceOptions || []).filter(function(o){ return (o.id + '') !== (id + ''); });
			}
			} finally {
				updateEnabledOptionsUI();
				refreshPayments();
				recalcOrderPrice();
			}
		});
		// show all carriers toggle
	GK.state.showAllCarriers = false;
	$('#disableServiceFilters').off('click').on('click', function(){
		GK.state.showAllCarriers = true;
		GK.state.forceShowAll = true;
		fetchProducts().then(function(){ $('#servicesPickModal').modal('show'); });
	});
	$('#enableServiceFilters').off('click').on('click', function(){
		GK.state.showAllCarriers = false;
		GK.state.forceShowAll = false;
		fetchProducts().then(function(){ $('#servicesPickModal').modal('show'); });
	});
	}

	// ============ Terminal picker (jQuery rebuild of Angular globTerminalPicker) ============
	function fetchTerminals(query) {
		const s = GK.state;
		if (!s.pickedService) return Promise.resolve();
		const params = { productId: s.pickedService.id };
		if (query) params.filter = query;
		params.isCashOnDeliveryAddonSelected = !!(s.additionalInfo && s.additionalInfo.codAmount);

		// Pass countryId so foreign points load correctly.
		// addr.countryId is a primitive copy from init; addr.country.id is kept up-to-date
		// by ensureCountryIdsFromIso(), so check both.
		const target = s.terminalTarget || '';
		const isSender = target.toLowerCase().indexOf('sender') > -1;
		const addr = isSender ? s.sender : s.receiver;
		const resolvedCountryId = (addr && addr.countryId) || (addr && addr.country && addr.country.id);
		if (resolvedCountryId) {
			params.countryId = resolvedCountryId;
		}

		const url = gkApiBase() + 'points?' + new URLSearchParams(params).toString();
		return fetch(url, { headers: buildHeaders() })
			.then(function(r){ return r.json(); })
			.then(function(resp){
				// Hide error box first
				$('#terminalErrorBox').hide();

				// Check if response contains error fields
				if (resp && resp.fields && typeof resp.fields === 'object') {
					const errorMessages = Object.keys(resp.fields).map(function(k) {
						return k + ': ' + resp.fields[k];
					}).join('\n');
					$('#terminalErrorBox').text(errorMessages).show();
					$('#terminalSelect').html('');
					$('#terminalHint').hide();
					return;
				}

				// Handle normal list response
				let list = resp;
				if (!Array.isArray(list)) list = [];
				if (!list.length) {
					$('#terminalSelect').html('');
					$('#terminalHint').show();
					return;
				}
				const html = list.map(function(t, i){
					const label = (t.city ? t.city + ', ' : '') + (t.address || '');
					const id = t.id || t.code || ('pt_' + i);
					const pointData = { id: id, city: t.city, address: t.address };
					if (t.lat != null) pointData.lat = t.lat;
					if (t.lng != null) pointData.lng = t.lng;
					if (t.lon != null) pointData.lng = t.lon;
					return '<option value="' + id + '" data-json="' + encodeURIComponent(JSON.stringify(pointData)) + '">' + label + '</option>';
				}).join('');
				$('#terminalSelect').html(html);
				$('#terminalHint').hide();
			})
			.catch(function(e){
				// Handle network/parsing errors
				const errorMsg = e && e.message ? e.message : 'Error fetching terminals';
				$('#terminalErrorBox').text(errorMsg).show();
				$('#terminalSelect').html('');
				$('#terminalHint').hide();
			});
	}

	// open picker
	$(document).on('click', '.open-terminal-picker', function(){
		const $btn = $(this);
		const explicitTarget = $btn.data('target');
		const role = $btn.data('role');

		if (explicitTarget) {
			GK.state.terminalTarget = explicitTarget;
		} else if (role === 'sender') {
			// Unified "sending point" button: map current carrier to the existing terminalTarget keys.
			const carrierName = (GK.state.pickedService && GK.state.pickedService.carrierName) ? (GK.state.pickedService.carrierName + '') : '';
			const n = carrierName.toLowerCase();
			if (n.indexOf('inpost') > -1) GK.state.terminalTarget = 'inPostSenderPoint';
			else if (n.indexOf('dhl') > -1) GK.state.terminalTarget = 'dhlparcelSenderPoint';
			else if (n.indexOf('orlen') > -1 || n.indexOf('ruch') > -1) GK.state.terminalTarget = 'paczkaRuchSenderPoint';
			else if (n.indexOf('poczta') > -1 || n.indexOf('pocztex') > -1) GK.state.terminalTarget = 'pocztex48owpSenderPoint';
			else if (n.indexOf('dpd') > -1) GK.state.terminalTarget = 'dpdpickupSenderPoint';
			else if (n.indexOf('fedex') > -1) GK.state.terminalTarget = 'fedexSenderPoint';
			else GK.state.terminalTarget = 'inPostSenderPoint';
		} else {
			// Default for existing receiver buttons (they pass data-target).
			GK.state.terminalTarget = 'inPostReceiverPoint';
		}
		// Auto-fill search with address city + postcode
		const isSenderModal = (GK.state.terminalTarget || '').toLowerCase().indexOf('sender') > -1;
		const addrModal = isSenderModal ? GK.state.sender : GK.state.receiver;
		const city = (addrModal && addrModal.city) || '';
		const postCode = (addrModal && addrModal.postCode) || '';
		const autoQuery = city && postCode ? city + ', ' + postCode : city || postCode;
		$('#terminalQuery').val(autoQuery);
		$('#terminalSelect').html('');
		$('#terminalErrorBox').hide();
		if (autoQuery) {
			$('#terminalHint').hide();
			fetchTerminals(autoQuery);
		} else {
			$('#terminalHint').show();
		}
		$('#terminalPickerModal').modal('show');
	});

	// search points — button click or Enter key
	$(document).on('click', '#terminalSearchBtn', function(){
		fetchTerminals($('#terminalQuery').val());
	});
	$(document).on('keydown', '#terminalQuery', function(e){
		if (e.which === 13) { e.preventDefault(); fetchTerminals($(this).val()); }
	});

	// save selected point
	$(document).on('click', '#terminalSaveBtn', function(){
		const opt = $('#terminalSelect option:selected');
		if (!opt.length) return;
		let data = opt.attr('data-json');
		try { data = JSON.parse(decodeURIComponent(data)); } catch(e) { data = {}; }
		const code = data.id || '';
		const label = (data.city ? data.city + ', ' : '') + (data.address || '');
		if (!GK.state.additionalInfo) GK.state.additionalInfo = {};
		const target = GK.state.terminalTarget || 'inPostReceiverPoint';
		if (target === 'inPostReceiverPoint') {
			GK.state.additionalInfo.inPostReceiverPoint = { id: code };
			GK.state.receiver = GK.state.receiver || {};
			GK.state.receiver.terminal = code;
			$('#inpostReceiverLabel').text('[' + code + '] ' + label);
			// Don't update terminalCode or terminalLabel - they show client's original choice
		} else if (target === 'inPostSenderPoint') {
			GK.state.additionalInfo.inPostSenderPoint = { id: code };
			GK.state.sender = GK.state.sender || {};
			GK.state.sender.terminal = code;
			$('#inpostSenderLabel').text('[' + code + '] ' + label);
			$('#senderPointLabel').text('[' + code + '] ' + label);
		} else if (target === 'paczkaRuchReceiverPoint') {
			GK.state.additionalInfo.paczkaRuchReceiverPoint = { id: code };
			GK.state.receiver.terminal = code;
			$('#orlenReceiverLabel').text('[' + code + '] ' + label);
			// Don't update terminalCode or terminalLabel - they show client's original choice
		} else if (target === 'pocztex48owpReceiverPoint') {
			GK.state.additionalInfo.pocztex48owpReceiverPoint = { id: code };
			GK.state.receiver.terminal = code;
			$('#pocztexReceiverLabel').text('[' + code + '] ' + label);
			// Don't update terminalCode or terminalLabel - they show client's original choice
		} else if (target === 'dhlparcelReceiverPoint') {
			GK.state.additionalInfo.dhlparcelReceiverPoint = { id: code };
			GK.state.receiver.terminal = code;
			$('#dhlReceiverLabel').text('[' + code + '] ' + label);
			// Don't update terminalCode or terminalLabel - they show client's original choice
		} else if (target === 'dhlparcelSenderPoint') {
			GK.state.additionalInfo.dhlparcelSenderPoint = { id: code };
			GK.state.sender = GK.state.sender || {};
			GK.state.sender.terminal = code;
			$('#dhlSenderLabel').text('[' + code + '] ' + label);
			$('#senderPointLabel').text('[' + code + '] ' + label);
		} else if (target === 'paczkaRuchSenderPoint') {
			GK.state.additionalInfo.paczkaRuchSenderPoint = { id: code };
			GK.state.sender = GK.state.sender || {};
			GK.state.sender.terminal = code;
			$('#orlenSenderLabel').text('[' + code + '] ' + label);
			$('#senderPointLabel').text('[' + code + '] ' + label);
		} else if (target === 'pocztex48owpSenderPoint') {
			GK.state.additionalInfo.pocztex48owpSenderPoint = { id: code };
			GK.state.sender = GK.state.sender || {};
			GK.state.sender.terminal = code;
			$('#pocztexSenderLabel').text('[' + code + '] ' + label);
			$('#senderPointLabel').text('[' + code + '] ' + label);
		} else if (target === 'dpdpickupReceiverPoint') {
			GK.state.additionalInfo.dpdpickupReceiverPoint = { id: code };
			GK.state.receiver.terminal = code;
			$('#dpdReceiverLabel').text('[' + code + '] ' + label);
			// Don't update terminalCode or terminalLabel - they show client's original choice
		} else if (target === 'dpdpickupSenderPoint') {
			GK.state.additionalInfo.dpdpickupSenderPoint = { id: code };
			GK.state.sender = GK.state.sender || {};
			GK.state.sender.terminal = code;
			$('#dpdSenderLabel').text('[' + code + '] ' + label);
			$('#senderPointLabel').text('[' + code + '] ' + label);
		} else if (target === 'fedexReceiverPoint') {
			GK.state.additionalInfo.fedexReceiverPoint = { id: code };
			GK.state.receiver.terminal = code;
			$('#fedexReceiverLabel').text('[' + code + '] ' + label);
		} else if (target === 'fedexSenderPoint') {
			GK.state.additionalInfo.fedexSenderPoint = { id: code };
			GK.state.sender = GK.state.sender || {};
			GK.state.sender.terminal = code;
			$('#fedexSenderLabel').text('[' + code + '] ' + label);
			$('#senderPointLabel').text('[' + code + '] ' + label);
		}
		recalcOrderPrice();
	});

	function applyTemplate(tmpl) {
		if (!tmpl) return;
		GK.state.packageInfo = GK.state.packageInfo || {};
		if (tmpl.weight  != null) { $('#pkg-weight').val(tmpl.weight);  GK.state.packageInfo.weight  = parseFloat(tmpl.weight);  }
		if (tmpl.height  != null) { $('#pkg-height').val(tmpl.height);  GK.state.packageInfo.height  = parseFloat(tmpl.height);  }
		if (tmpl.length  != null) { $('#pkg-length').val(tmpl.length);  GK.state.packageInfo.length  = parseFloat(tmpl.length);  }
		if (tmpl.width   != null) { $('#pkg-width').val(tmpl.width);    GK.state.packageInfo.width   = parseFloat(tmpl.width);   }
		if (tmpl.quantity) { $('#pkg-count').val(tmpl.quantity); GK.state.packageInfo.count = parseInt(tmpl.quantity, 10); }
		if (tmpl.contents) {
			applyTemplateContent(tmpl.contents);
		}
		if (tmpl.payment_type) {
			GK.state._templatePaymentId = tmpl.payment_type + '';
		}
		if (tmpl.gk_product_id) {
			GK.state._templateServiceId = parseInt(tmpl.gk_product_id, 10);
		}
		queueTemplateAddons(tmpl);
	}

	// Syncs whatever .addon-checkbox elements currently exist in the DOM (see
	// fetchAddonsAndPayments()) to exactly match the given addon categories —
	// checks the ones present, and just as importantly unchecks any addon left
	// over from a previously selected template that isn't in this one.
	function applyTemplateAddonCategories(categories) {
		$('#addonsList .addon-checkbox').each(function () {
			const $cb = $(this);
			const shouldBeChecked = categories.indexOf($cb.data('category')) !== -1;
			if ($cb.is(':checked') !== shouldBeChecked) {
				$cb.prop('checked', shouldBeChecked).trigger('change');
			}
		});
		// Each toggle above already re-triggers the addon-checkbox change handler
		// (which itself calls recalcOrderPrice()), but that only fires for
		// checkboxes whose state actually flipped. Called again here so the
		// summary is always fresh after a template switch, even when nothing
		// needed toggling (e.g. re-applying the same template).
		recalcOrderPrice();
	}

	// If the predefined content list is already fetched and visible for the
	// currently picked service, selects the matching option now (or falls
	// back to the custom free-text input if there's no match). Otherwise sets
	// the raw field and queues the value for fetchContentList() to reconcile
	// against the real list once it loads (see there).
	function applyTemplateContent(content) {
		GK.state.packageInfo = GK.state.packageInfo || {};
		const $sel = $('#pkg-content-select');
		const $inp = $('#pkg-content');
		// The select always ships with one static placeholder option (see the
		// tpl); a real fetchContentList() completion always adds at least a
		// "custom" option on top of that, so >1 reliably means the predefined
		// list for the currently picked service has actually loaded.
		if ($sel.find('option').length > 1) {
			const hasMatch = $sel.find('option').toArray().some(function (o) { return o.value === content; });
			if (hasMatch) {
				$sel.val(content);
				$inp.hide().val(content);
			} else {
				$sel.val('__custom__');
				$inp.show().val(content);
			}
			GK.state._templateContent = null;
		} else {
			$inp.val(content);
			GK.state._templateContent = content;
		}
		GK.state.packageInfo.content = content;
	}

	// If the addons list is already fetched and visible for the currently
	// picked service, the template's saved categories are applied right away.
	// Otherwise addon checkboxes don't exist in the DOM yet (no service picked,
	// or list not loaded), so they're queued here and applied later, once
	// fetchAddonsAndPayments() renders the checkboxes (see there).
	function queueTemplateAddons(tmpl) {
		if (!tmpl || !tmpl.gk_addons) return;
		try {
			const categories = JSON.parse(tmpl.gk_addons);
			if (!Array.isArray(categories) || !categories.length) { return; }
			if ($('#addonsList .addon-checkbox').length) {
				applyTemplateAddonCategories(categories);
			} else {
				GK.state._templateAddonCategories = categories;
			}
		} catch (e) {}
	}

	function initTemplateSelector() {
		const templates = window.GkTemplates || [];
		if (!templates.length) return;
		const selectedId = window.GkSelectedTemplateId || 0;
		const $sel = $('#gk-template-select');
		if (!$sel.length) return;
		const iv = window.InitialValues || {};
		let html = '<option value="">' + (iv.langNoTemplate || '') + '</option>';
		templates.forEach(function(t) {
			let label = t.name;
			if (t.is_default) label += ' (★)';
			html += '<option value="' + t.id_template + '">' + label + '</option>';
		});
		$sel.html(html);
		if (selectedId) {
			$sel.val(selectedId);
			// Dimensions/weight/quantity/content/payment_type/pickup_type for the
			// auto-matched template are already baked into the initial server-side
			// render (InitialValues, pickup_type radio), so we don't re-run the
			// rest of applyTemplate() here to avoid clobbering values PHP already
			// computed with different precedence (e.g. order product weight).
			// Addon checkboxes have no such server-side pre-check mechanism though
			// (they don't exist in the DOM until a service is picked), so queue
			// them the same way a manual template switch would.
			const autoTmpl = templates.find(function(t) { return t.id_template === selectedId; });
			if (autoTmpl) {
				queueTemplateAddons(autoTmpl);
				if (autoTmpl.gk_product_id) { GK.state._templateServiceId = parseInt(autoTmpl.gk_product_id, 10); }
			}
		}
		$sel.off('change.template').on('change.template', function() {
			const id = parseInt($(this).val(), 10);
			const tmpl = templates.find(function(t) { return t.id_template === id; });
			if (tmpl) {
				applyTemplate(tmpl);
			}
		});
	}

	$(function(){
		initStateFromInitialValues();
		GK.state.packageInfo = (window.InitialValues && window.InitialValues.defaultPackageInfo) ? window.InitialValues.defaultPackageInfo : { count: 1 };
		initTemplateSelector();
		renderAddressBoxes();
        populateDisplayPanels();
        // Validate the pre-filled sender/receiver addresses as soon as the form
        // loads, rather than waiting for the merchant to reach pricing/submit -
        // wait for the country-id map (kicked off inside initStateFromInitialValues())
        // so countryId isn't missing on this very first check.
        try {
            preloadCountriesMap().then(function(){
                try { ensureCountryIdsFromIso(); } catch(e) {}
                postOrderValidate(buildAddressOnlyPayload());
            });
        } catch(e) {
            postOrderValidate(buildAddressOnlyPayload());
        }
        bindEditModals();
		renderServicesAndBind();
		bind();

		// Initialize terminal info if available from InitialValues
		if (window.InitialValues && window.InitialValues.terminalCode) {
			$('#terminalCode').text(window.InitialValues.terminalCode);
			if (!GK.state.receiver) GK.state.receiver = {};
			GK.state.receiver.terminal = window.InitialValues.terminalCode;
		}

		if (window.InitialValues && window.InitialValues.terminalType) {
			$('.terminalLabel').hide();
			let tt = (window.InitialValues.terminalType || '') + '';
			tt = tt.trim();
			// Normalize potential camelCase variant.
			if (tt === 'inpostCod') tt = 'inpost_cod';
			$('.terminalLabel[data-type="' + tt + '"]').show();
		}
	});

})();


