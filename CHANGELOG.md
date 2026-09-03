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
