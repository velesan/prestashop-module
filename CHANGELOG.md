## [3.6.0] - 2026-10-19
+ Customs documents (GLOBKURIER-10216): attach PDF documents (max 5 MB) to an already placed customs shipment - right on the success screen after placing it, in the shipment history and on the PrestaShop order page. Only the document types the carrier requires, with readable names (DHL Express, FedEx, UPS, Raben); delete not-yet-sent documents; send them to the carrier, with the reason shown when that is not possible yet
+ Shipments placed with a customs declaration are flagged (new nullable gk_orders.has_customs column); the "Documents" button is shown only for them
+ Customs duty calculation as in GlobKurier's own panel: only for DDP/DAP Premium (paid query), calculation base = transport + fuel, selected addons included, same orderHash in the calculation and the order. Placing a Premium shipment is blocked until the calculation is ready (GlobKurier issues the customs invoice from it); every field error is listed with its field and item number, with "Retry calculation"
+ Duty calculation gets the receiver's state/province (matched from the PrestaShop address by ISO code) also when GlobKurier doesn't ask for it on the order; errors from the landed cost service are shown with their text and what to check
+ GlobKurier's "customs not required" answer (403 []) on a route whose customs declaration is required is treated as a retryable error - GlobKurier also returns it when its customs configuration lookup fails, which would otherwise let a DDP/DAP Premium shipment go without a calculation
+ Duty calculation in the order summary laid out as in GlobKurier's own: "Includes customs and tax fees" (customs fees, duties) above the total - the DDP/DAP Premium addon is priced with the calculation - then "Total customs and tax charges paid from the prepaid account" and "Future tax payments"; items as in GlobKurier's panel (decimal comma in Polish); a calculation with nothing to pay shows 0.00
+ Fixed: order-level errors from GlobKurier ("general", e.g. customs prepaid balance too low for the duties, with the amount to top up) were replaced by a generic "error placing the order" - now shown as sent, also in the customs documents panel
+ Declared value of a customs shipment taken from the declaration (currency + item values sent to pricing, GlobKurier picks the declared value tier), read-only in the form
+ Customs form validation driven by GlobKurier's constraints (required, length, ranges, decimal places, date, regex), with messages under the fields right after importing the order and on save; PL/EN description limits derived from the field's max as in GlobKurier's panel and the Shopify app; field-level max/min/precision applied where no constraint is sent (e.g. HS code, transport amount)
+ Radio-type customs fields (invoice type, strategic goods, transport included) rendered as clearly selected radio buttons; duplicate options removed; amounts accept a decimal comma
+ Offer picker as on GlobKurier's own search page (GLOBKURIER-10394): offers listed under the shipment parameters (instead of a popup) with logo, carrier, average delivery time, sending/delivery method, gross/net price, promo ribbons and expandable details; sorting (recommended/cheapest/fastest), sending/delivery filters (incl. Crossborder and any other type the offers have) and carrier filter, first 6 offers with "Show remaining offers"; responsive from phone to wide screen
+ Shipment parameters turn into static data with "Change details" once quoted; changing them hides the addons, customs and summary (and blocks sending) until a new offer is picked, so a shipment can no longer be sent with a service or price quoted for other dimensions or weight; the service column is wide while choosing and narrow once an offer is picked
+ Fixed: "Show all carriers" switch did nothing unless the customer had picked a pickup point - "No" now narrows the offer list to the customer's checkout carrier (pickup point type, the template assigned to the PrestaShop carrier, or the carrier's name, e.g. "DPD"), "Yes" shows every carrier; switching no longer re-queries GlobKurier, and a note says when none of the offers comes from the customer's carrier
+ Shipment template picker moved into "Choose delivery"; changing the template after quoting re-quotes with the template's dimensions (empty/0 template values keep the current ones)
+ Required addon groups (e.g. duty payer, receiver type, customs documents) rendered as required radio groups with a message; non-standard shipment surcharge never preselected
+ Orders send the sender's dangerous goods statement (containsDangerousGoods, GLOBKURIER-10368): false, or true only when the ADR addon is selected - GlobKurier rejects a statement that disagrees with the ADR addon
+ Fixed: international phone prefix ("+48...") could be dropped, making GlobKurier validate the number against the receiver's country

## [3.5.0] - 2026-09-18
+ Customs declaration form for international shipments: generic renderer driven entirely by GlobKurier's own /customs/config field metadata (sections, dual-language description/composition/purpose, commodities, EORI, invoice details)
+ Estimated customs duty/fees preview before placing the order, reused across order pricing and order creation
+ Field length limits enforced live (matching GlobKurier's actual validation) with a character counter and translation truncation, instead of failing only after submission
+ Fixed: mutually exclusive duty-payer addons (DDP/DAP/marketplace VAT) could both end up selected and sent, rejected by the API
+ Fixed: declared value field only appeared when a priced addon existed for the route, even when GlobKurier required it for customs
+ Added return shipment address fields
+ Localized the shipment purpose dropdown (was showing raw internal codes)
+ Fixed: US/Canada phone numbers losing a digit during formatting
+ Save and close validation on the customs form, highlighting exactly what's missing

## [3.4.0] - 2026-09-03
+ Config page redesigned: sidebar navigation with 7 sections (Account & login,  Sender, Shipment settings, Operators, Templates, Payments, Labels & statuses),  replacing the old flat form
+ Template management: create, edit, delete, set default shipment templates; sync templates from GlobKurier API; package type, sending/delivery method added
+ Auto-select template by PS carrier on order placement, fallback to default
+ New DB table gk_template (renamed from globkurier_template), migrated from config
+ COD SWIFT/BIC field for foreign bank accounts
+ Payments tab redesigned around GlobKurier's actual billing model (pre-paid balance vs. deferred collective invoice), with live balance display
+ Order form: dropped bank transfer/online as customer-facing payment options
+ Fixed: payment method mismatch between config page and order form
+ Fixed: template import from GlobKurier API only ever populated name/content
+ Fixed: front checkout pickup-point widget bugs on PS 1.7/8/9 (duplicate Select2 init, missing Select2 CSS on PS8/9, PS1.7 theme race hiding the map, search query overwritten by stale auto-search)
+ Fixed: logging out and reloading silently logged the user back in (Post/Redirect/Get for the login form)
+ Non-account tabs now fully hidden (not just their nav buttons) while logged out
+ PrestaShop Addons Validator compliance fixes
+ Translations PL/EN extended for new UI

## [3.3.6] - 2026-07-27
+ Tracking code fetched automatically after order placement
+ Refactor Order history page
+ Pickup point selection restored when customer navigates back to delivery step in checkout
+ Auto-fill parcel weight, content and payment method from order data
+ Carrier dimension and weight limits validated before pricing request
+ Units (kg, cm) displayed after carrier name in results
+ Address splitter improved with EU/US street patterns
+ Fixed: pickup point not required for all point-type carriers
+ Fixed: checkout submit button disabled by PrestaShop before pickup validation ran
+ Pickup widget now renders for all carrier types on PS 1.7, 8 and 9 (switched from displayCarrierExtraContent to displayAfterCarrier hook)
+ Pickup widget relocated into carrier row (above submit button) via JS DOM move
+ Fixed: Polish translations missing for pickup widget
+ Fixed: duplicate Select2 CSS asset loading removed

## [3.3.5] - 2026-04-17
+ block duplicate orders
+ fix pickup widget in PS8
+ restore terminal in order form

## [3.3.4] - 2026-04-14
+ Fixed CSS style conflicts

## [3.3.3] - 2026-04-01
+ Added order customs sending and CROSSBORDER collection type
+ Added carrier description and collectionType label on products list
+ Improved GitHub release information
+ Fixed terminalCode error, group margin and missing translations

## [3.3.2] - 2026-03-03
+ Refactor variables using namespaces and IIFE
+ Fix for displaying points in the Hummingbird theme
+ Add Insurance Premium support


## [3.3.1] - 2025-11-26
+ Replace Google Maps API with Leaflet

## [3.3.0] - 2025-09-15
+ Migrated js script
+ Fixed controller issues
+ Resolved compatibility issues with latest PrestaShop versions

## [3.2.0] - 2025-09-15

+ Added discount code and order summary section
+ Display of detailed pricing information (net, gross, discount, VAT, fuel surcharge)
+ Fix the layout grid of the list of carriers
+ Added support for PrestaShop 8.x and 9.x
+ Overall improvements and bug fixes
+ Fixed security issues

## [3.1.1] - 2024-09-30

+ Initial version of Globkurier module
+ Basic parcel shipping functionality
+ Integration with PrestaShop system
