<?php
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

use Globkuriermodule\Common\Config;
use Globkuriermodule\Common\ModuleTabs;

if (!defined('_PS_VERSION_')) {
    exit;
}

require_once 'src/globkurier.loader.php';

class Globkuriermodule extends Module
{
    protected $config_form = false;

    protected $link;

    private $payments = [
        1 => 'Przelew bankowy',
        2 => 'Płatność online',
        3 => 'Konto pre-paid',
        4 => 'Faktura zbiorcza (przelew bankowy - odroczony termin płatności)',
        5 => 'Płatność gotówką',
        6 => 'Płatność gotówką przy doręczeniu',
        7 => '-',
        8 => 'Bon',
        9 => 'Konto pre-paid (faktura zbiorcza)',
    ];

    public function __construct()
    {
        $this->name = 'globkuriermodule';
        $this->tab = 'shipping_logistics';
        $this->version = '3.4.0';
        $this->author = 'GlobKurier.pl';
        $this->need_instance = 0;
        $this->bootstrap = true;
        $this->module_key = '82d29cc1292216aeeb640e446d32c5ea';

        parent::__construct();

        $this->displayName = $this->l('Globkurier integration');
        $this->description = $this->l('Official Globkurier integrationmodule for sending parcels');
        $this->ps_versions_compliancy = ['min' => '1.6', 'max' => _PS_VERSION_];
        $this->link = new Link();
    }

    /**
     * Don't forget to create update methods if needed:
     * http://doc.prestashop.com/display/PS16/Enabling+the+Auto-Update
     */
    public function install()
    {
        Configuration::updateValue('GLOBKURIER2_LIVE_MODE', false);
        require_once __DIR__ . '/sql/install.php';
        ModuleTabs::install();

        return parent::install()
            && $this->registerHook('displayHeader')
            && $this->registerHook('displayBackOfficeHeader')
            && $this->registerHook('displayAdminAfterHeader')
            && $this->registerHook('displayCarrierList')
            && $this->registerHook('displayAfterCarrier')
            && $this->registerHook('displayCarrierExtraContent')
            && $this->registerHook('displayAdminOrderMainBottom')
            && $this->registerHook('actionUpdateCarrier')
            && $this->registerHook('actionAdminOrdersTrackingNumberUpdate');
    }

    public function uninstall()
    {
        Configuration::deleteByName('GLOBKURIER2_LIVE_MODE');
        Configuration::deleteByName('GLOBKURIER_GITHUB_LATEST_VER');
        Configuration::deleteByName('GLOBKURIER_GITHUB_CACHE_TIME');
        ModuleTabs::uninstall();
        // include(dirname(__FILE__).'/sql/uninstall.php');
        Config::purge();

        return parent::uninstall();
    }

    /**
     * Load the configuration form
     */
    public function getContent()
    {
        // AJAX handler dla operacji na szablonach (nie wymaga renderowania HTML)
        $ajaxAction = Tools::getValue('ajax_action');
        if ($ajaxAction) {
            $this->handleTemplateAjax($ajaxAction);
            return '';
        }

        // One-time Smarty compile-cache clear after 3.4.0 upgrade.
        // In production PS compile_check=false, so new .tpl files are never
        // picked up until the compile directory is flushed.
        if (!Configuration::get('GK_SMARTY_CLEARED_340')) {
            if (method_exists($this->context->smarty, 'clearCompiledTemplate')) {
                $this->context->smarty->clearCompiledTemplate();
            }
            Configuration::updateValue('GK_SMARTY_CLEARED_340', 1);
        }

        $config = new Config();
        if (Tools::getValue('action') == 'updateConfig' && $this->validateConfigFields()) {
            $return = $config->update();
            if ($return) {
                $this->context->smarty->assign([
                    'success' => $this->l('The module settings have been saved correctly.'),
                ]);
            } else {
                $error = $this->l('An error occurred while saving the settings. Try again.');
                $this->context->smarty->assign([
                    'error_info' => $error,
                ]);
            }
        }
        $this->context->smarty->assign([
            'config' => $config,
            'submited' => Tools::getValue('action') == 'updateConfig' ? true : false,
            'newParcelPageLink' => $this->link->getAdminLink('AdminGlobkurierPlaceOrder'),
            'getCachePointsLink' => $this->link->getAdminLink('AdminGlobkurierPlaceOrder') . '&ajax=1&action=getAllPickupPoints',
            'baseurl' => $this->_path,
        ]);
        $api = new Globkuriermodule\Common\GlobkurierApi($config->login, $config->password, $config->apiKey);
        if (!$api->isUserAuthorized()) {
            if (version_compare(_PS_VERSION_, '1.6.0', '>=') === true) {
                return $this->display(__FILE__, 'views/templates/admin/login_page_v16.tpl');
            }

            return $this->display(__FILE__, 'views/templates/admin/login_page_v15.tpl');
        }
        $carriers = Carrier::getCarriers($this->context->language->id);
        $countries = $api->getCountries();
        $latestVersion = $this->getLatestGithubVersion();

        $gkPayments = [];

        try {
            $raw = $api->getPayments();
            if (is_array($raw)) {
                foreach ($raw as $p) {
                    if (isset($p['id']) && isset($p['enabled']) && $p['enabled']) {
                        $gkPayments[] = $p;
                    }
                }
            }
        } catch (Exception $e) {
        }

        $legacyPaymentMap = ['T' => 1, 'O' => 2, 'P' => 9, 'D' => 4, 'COD' => 6];
        $currentPaymentId = $config->defaultPaymentType;
        if (isset($legacyPaymentMap[$currentPaymentId])) {
            $currentPaymentId = $legacyPaymentMap[$currentPaymentId];
        }

        $gkTemplatesArr = [];
        try {
            $tm = new Globkuriermodule\Template\TemplateManager();
            foreach ($tm->getAll() as $tmpl) {
                $gkTemplatesArr[] = $tmpl->toArray();
            }
        } catch (\Exception $e) {
            // Tabela jeszcze nie istnieje — uruchom upgrade przez panel PS
        }

        $configAjaxUrl = $this->context->link->getAdminLink('AdminModules')
            . '&configure=' . $this->name
            . '&token=' . Tools::getAdminTokenLite('AdminModules');

        $this->context->smarty->assign([
            'countries'           => $countries,
            'carriers'            => $carriers,
            'tokenAPI'            => $api->getToken(),
            'moduleVersion'       => $this->version,
            'gk_latestVersion'    => $latestVersion,
            'gk_updateAvailable'  => $latestVersion && version_compare($latestVersion, $this->version, '>'),
            'gk_githubReleaseUrl' => 'https://github.com/globkurier/prestashop-module/releases/latest',
            'gk_payments'         => $gkPayments,
            'gk_currentPaymentId' => $currentPaymentId,
            'gk_templates_json'   => json_encode($gkTemplatesArr),
            'gk_template_count'   => count($gkTemplatesArr),
            'configAjaxUrl'       => $configAjaxUrl,
        ]);
        // Load jQuery-based config page script (Angular removed)
        $this->context->controller->addJS($this->_path . '/views/js/configApp.jquery.js');
        if (version_compare(_PS_VERSION_, '1.6.0', '>=') === true) {
            return $this->display(__FILE__, 'views/templates/admin/config_page_v16.tpl');
        }

        return $this->display(__FILE__, 'views/templates/admin/config_page_v15.tpl');
    }

    /**
     * Obsługuje żądania AJAX ze strony konfiguracji (szablony).
     * Wysyła JSON i kończy wykonanie.
     *
     * @param string $action
     */
    private function handleTemplateAjax($action)
    {
        header('Content-Type: application/json; charset=utf-8');

        $tm = new Globkuriermodule\Template\TemplateManager();

        try {
            switch ($action) {
                case 'getTemplates':
                    $result = [];
                    foreach ($tm->getAll() as $t) {
                        $result[] = $t->toArray();
                    }
                    echo json_encode(['success' => true, 'templates' => $result]);
                    break;

                case 'saveTemplate':
                    $name = trim((string)Tools::getValue('name', ''));
                    if ($name === '') {
                        echo json_encode(['success' => false, 'error' => 'Brak nazwy szablonu']);
                        break;
                    }
                    $id = (int)Tools::getValue('id_template', 0);
                    if ($id) {
                        $t = $tm->getById($id);
                        if (!$t) {
                            echo json_encode(['success' => false, 'error' => 'Nie znaleziono szablonu']);
                            break;
                        }
                    } else {
                        $t = new Globkuriermodule\Template\TemplateModel();
                    }
                    $len = Tools::getValue('length', '');
                    $wid = Tools::getValue('width', '');
                    $hei = Tools::getValue('height', '');
                    $wei = Tools::getValue('weight', '');
                    $pay = Tools::getValue('payment_type', '');
                    $car = Tools::getValue('ps_carrier_id', '');
                    $t->name        = $name;
                    $t->packageList = 'PARCEL';
                    $t->length      = $len !== '' ? (float)$len : null;
                    $t->width       = $wid !== '' ? (float)$wid : null;
                    $t->height      = $hei !== '' ? (float)$hei : null;
                    $t->weight      = $wei !== '' ? (float)$wei : null;
                    $t->quantity    = max(1, (int)Tools::getValue('quantity', 1));
                    $cont           = Tools::getValue('contents', '');
                    $t->contents    = $cont !== '' ? (string)$cont : null;
                    $t->paymentType = $pay !== '' ? (int)$pay : null;
                    $t->isDefault   = Tools::getValue('is_default', 0) ? 1 : 0;
                    $t->psCarrierId = $car !== '' ? (int)$car : null;
                    $sc = (string)Tools::getValue('sender_country', 'PL');
                    $rc = (string)Tools::getValue('recipient_country', 'PL');
                    $t->senderCountry    = preg_match('/^[A-Z]{2}$/', $sc) ? $sc : 'PL';
                    $t->recipientCountry = preg_match('/^[A-Z]{2}$/', $rc) ? $rc : 'PL';
                    $gpid = Tools::getValue('gk_product_id', '');
                    $t->gkProductId = ($gpid !== '' && is_numeric($gpid)) ? (int)$gpid : null;
                    $addonsJson = Tools::getValue('gk_addons', '');
                    $t->gkAddons = ($addonsJson !== '') ? (string)$addonsJson : null;
                    $ok = $id ? $tm->update($t) : $tm->create($t);
                    echo json_encode(['success' => $ok, 'id_template' => $t->idTemplate]);
                    break;

                case 'deleteTemplate':
                    $id = (int)Tools::getValue('id_template', 0);
                    echo json_encode(['success' => $id ? $tm->delete($id) : false]);
                    break;

                case 'setDefaultTemplate':
                    $id = (int)Tools::getValue('id_template', 0);
                    echo json_encode(['success' => $id ? $tm->setDefault($id) : false]);
                    break;

                case 'syncTemplates':
                    $config = new Config();
                    $api = new Globkuriermodule\Common\GlobkurierApi($config->login, $config->password, $config->apiKey);
                    if (!$api->isUserAuthorized()) {
                        echo json_encode(['success' => false, 'error' => 'Błąd autoryzacji']);
                        break;
                    }
                    $raw = $api->getTemplates();
                    $list = is_array($raw) ? $raw : [];
                    $stats = $tm->syncFromApi($list);
                    echo json_encode(['success' => true] + $stats);
                    break;

                case 'getProducts':
                    $config = new Config();
                    $api = new Globkuriermodule\Common\GlobkurierApi($config->login, $config->password, $config->apiKey);
                    if (!$api->isUserAuthorized()) {
                        echo json_encode(['success' => false, 'services' => []]);
                        break;
                    }
                    $token       = $api->getToken();
                    $senderIso   = strtoupper(preg_replace('/[^A-Za-z]/', '', (string)Tools::getValue('sender_country', 'PL')));
                    $receiverIso = strtoupper(preg_replace('/[^A-Za-z]/', '', (string)Tools::getValue('recipient_country', 'PL')));
                    $isoToId = $this->getGkCountriesMap($config);
                    $senderCountryId   = isset($isoToId[$senderIso])   ? $isoToId[$senderIso]   : 1;
                    $receiverCountryId = isset($isoToId[$receiverIso]) ? $isoToId[$receiverIso] : 1;
                    $params = http_build_query([
                        'senderCountryId'   => $senderCountryId,
                        'receiverCountryId' => $receiverCountryId,
                        'length'   => (float)Tools::getValue('length', 0),
                        'width'    => (float)Tools::getValue('width', 0),
                        'height'   => (float)Tools::getValue('height', 0),
                        'weight'   => (float)Tools::getValue('weight', 0),
                        'quantity' => 1,
                    ]);
                    $ch = curl_init('https://api.globkurier.pl/v1/products?' . $params);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_HTTPHEADER, ['x-auth-token: ' . $token, 'accept-language: pl']);
                    $resp = curl_exec($ch);
                    curl_close($ch);
                    $data = $resp ? json_decode($resp, true) : [];
                    $services = [];
                    if (!empty($data['standard']) && is_array($data['standard'])) {
                        foreach ($data['standard'] as $p) {
                            $services[] = [
                                'id'          => $p['id'],
                                'name'        => $p['name'],
                                'carrierName' => $p['carrierName'],
                                'price'       => isset($p['netPrice']) ? $p['netPrice'] : '',
                            ];
                        }
                    }
                    echo json_encode(['success' => true, 'services' => $services]);
                    break;

                case 'getAddons':
                    $config = new Config();
                    $api = new Globkuriermodule\Common\GlobkurierApi($config->login, $config->password, $config->apiKey);
                    if (!$api->isUserAuthorized()) {
                        echo json_encode(['success' => false, 'addons' => []]);
                        break;
                    }
                    $token       = $api->getToken();
                    $senderIso   = strtoupper(preg_replace('/[^A-Za-z]/', '', (string)Tools::getValue('sender_country', 'PL')));
                    $receiverIso = strtoupper(preg_replace('/[^A-Za-z]/', '', (string)Tools::getValue('recipient_country', 'PL')));
                    $isoToId = $this->getGkCountriesMap($config);
                    $senderPostCode   = $config->defaultSenderPostCode ?: '01-001';
                    $receiverPostCode = ($receiverIso === 'PL') ? '01-001' : '10000';
                    $params = http_build_query([
                        'productId'         => (int)Tools::getValue('product_id', 0),
                        'senderCountryId'   => isset($isoToId[$senderIso])   ? $isoToId[$senderIso]   : 1,
                        'receiverCountryId' => isset($isoToId[$receiverIso]) ? $isoToId[$receiverIso] : 1,
                        'senderPostCode'    => $senderPostCode,
                        'receiverPostCode'  => $receiverPostCode,
                        'length'            => (float)Tools::getValue('length', 1),
                        'width'             => (float)Tools::getValue('width', 1),
                        'height'            => (float)Tools::getValue('height', 1),
                        'weight'            => (float)Tools::getValue('weight', 1),
                        'quantity'          => max(1, (int)Tools::getValue('quantity', 1)),
                    ]);
                    $ch = curl_init('https://api.globkurier.pl/v1/product/addons?' . $params);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_HTTPHEADER, ['x-auth-token: ' . $token, 'accept-language: pl']);
                    $resp     = curl_exec($ch);
                    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                    curl_close($ch);
                    if ($resp === false || ($httpCode !== 0 && ($httpCode < 200 || $httpCode >= 300))) {
                        echo json_encode(['success' => false, 'error' => 'GK API HTTP ' . $httpCode, 'addons' => []]);
                        break;
                    }
                    $data = json_decode($resp, true);
                    if (!is_array($data)) {
                        echo json_encode(['success' => false, 'error' => 'GK API invalid JSON', 'addons' => []]);
                        break;
                    }
                    $rawAddons = (isset($data['addons']) && is_array($data['addons'])) ? $data['addons'] : [];
                    $addonsList = [];
                    foreach ($rawAddons as $a) {
                        $addonsList[] = [
                            'id'         => $a['id'],
                            'name'       => isset($a['addonName']) ? $a['addonName'] : (isset($a['name']) ? $a['name'] : ''),
                            'price'      => isset($a['price']) ? $a['price'] : null,
                            'isRequired' => !empty($a['isRequired']),
                            'disabled'   => !empty($a['disabled']),
                        ];
                    }
                    echo json_encode(['success' => true, 'addons' => $addonsList]);
                    break;

                case 'getContentList':
                    $config = new Config();
                    $api = new Globkuriermodule\Common\GlobkurierApi($config->login, $config->password, $config->apiKey);
                    if (!$api->isUserAuthorized()) {
                        echo json_encode(['success' => false, 'contents' => [], 'allowOtherContent' => true]);
                        break;
                    }
                    $token       = $api->getToken();
                    $senderIso   = strtoupper(preg_replace('/[^A-Za-z]/', '', (string)Tools::getValue('sender_country', 'PL')));
                    $receiverIso = strtoupper(preg_replace('/[^A-Za-z]/', '', (string)Tools::getValue('recipient_country', 'PL')));
                    $params = http_build_query([
                        'productId'       => (int)Tools::getValue('product_id', 0),
                        'senderCountry'   => $senderIso,
                        'receiverCountry' => $receiverIso,
                    ]);
                    $ch = curl_init('https://api.globkurier.pl/v1/order/content?' . $params);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_HTTPHEADER, ['x-auth-token: ' . $token, 'accept-language: pl']);
                    $resp = curl_exec($ch);
                    curl_close($ch);
                    $data = $resp ? json_decode($resp, true) : ['contents' => [], 'allowOtherContent' => true];
                    echo json_encode(
                        ['success' => true] +
                        (is_array($data) ? $data : ['contents' => [], 'allowOtherContent' => true])
                    );
                    break;

                default:
                    echo json_encode(['success' => false, 'error' => 'Nieznana akcja']);
            }
        } catch (\Exception $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }

        exit;
    }

    private function validateConfigFields()
    {
        $valid = true;
        $ruchCarrier = (int) Tools::getValue('config_paczkaRuchCarrier');
        $inpostCarrier = (int) Tools::getValue('config_inPostCarrier');
        if ($inpostCarrier != 0 && $inpostCarrier == $ruchCarrier) {
            $this->context->controller->errors[] = $this->l('You cant use same carrier for two services');
            $valid = false;
        }

        return $valid;
    }

    public function hookdisplayAdminOrderMainBottom($params)
    {
        $orderM = new Globkuriermodule\Order\OrderManager();
        $gkOrder = $orderM->getByOrderId($params['id_order']);
        if (!empty($gkOrder)) {
            foreach ($gkOrder as &$item) {
                $pdf = (int) $this->checkPDFReady($item->hash);
                $item->pdf = $pdf;
                $item->payment_name = $this->payments[$item->payment];
            }
        }
        $newParcelPageLink = $this->link->getAdminLink('AdminGlobkurierPlaceOrder');
        $newParcelPageLink .= '&order_id=' . $params['id_order'];
        $this->context->smarty->assign([
            'orders' => $gkOrder,
            'moduleApiUrl' => $this->link->getAdminLink('AdminGlobkurierHistory'),
            'newParcelPageLink' => $newParcelPageLink,
        ]);

        if (version_compare(_PS_VERSION_, '8.0.0', '>=') === true) {
            // PrestaShop 8.x and 9.x
            return $this->display(__FILE__, 'views/templates/hooks/admin_order.tpl');
        } elseif (version_compare(_PS_VERSION_, '1.7.0', '>=') === true) {
            // PrestaShop 1.7.x
            return $this->display(__FILE__, 'views/templates/hooks/admin_order.tpl');
        } elseif (version_compare(_PS_VERSION_, '1.6.0', '>=') === true) {
            // PrestaShop 1.6.x
            return $this->display(__FILE__, 'views/templates/hooks/order_details_page_v16.tpl');
        }

        // PrestaShop 1.5.x and older
        return $this->display(__FILE__, 'views/templates/hooks/order_details_v15.tpl');
    }

    /**
     * Check if PDF label is ready for download
     * This method makes an internal API call to check the status of a parcel label
     *
     * @param string|null $hash The parcel hash identifier
     *
     * @return int Returns 1 if PDF is ready, 0 otherwise
     */
    private function checkPDFReady($hash)
    {
        // Check if hash is null or empty - prevent null access errors
        if ($hash === null || $hash === '') {
            return 0;
        }

        // Build internal API URL to check label status
        $url = 'https://tebimpro:tebimpro@' . $this->context->shop->domain . $this->context->shop->physical_uri . 'module/globkuriermodule/getLabel?hash=' . $hash . '&ajax=1';
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_VERBOSE, true);
        $result = curl_exec($ch);
        curl_close($ch);

        // Check if cURL request failed
        if ($result === false) {
            return 0;
        }

        // Decode JSON response and validate structure
        $return = json_decode($result, true);
        if (!is_array($return) || !isset($return['status'])) {
            return 0;
        }

        return $return['status'];
    }

    /**
     * Wyświetla i ładuje skrypty związane z wyborem paczkomatów
     *
     * @param $params
     *
     * @return string
     */
    public function hookDisplayCarrierList($params)
    {
        // PS 1.7+ is handled by hookDisplayCarrierExtraContent (per-carrier widget)
        if (version_compare(_PS_VERSION_, '1.7.0', '>=')) {
            return '';
        }

        // PS 1.6 fallback
        $config = new Config();
        if (!$config->inPostEnabled && !$config->inPostCODEnabled && !$config->paczkaRuchEnabled && !$config->pocztex48owpEnabled) {
            return '';
        }
        $address = new Address($this->context->cart->id_address_delivery);
        $terminalPickupManager = new Globkuriermodule\TerminalPickup\TerminalPickupManager();
        $savedPickup = $terminalPickupManager->getByCartId($params['cart']->id);
        $this->smarty->assign([
            'globConfig' => $config,
            'cart_id' => $params['cart']->id,
            'rest_endpoint' => $this->context->link->getModuleLink($this->name, 'restinterface', [], true),
            'gk_token' => $this->encryptCartId($params['cart']->id),
            'baseurl' => 'https://' . $this->context->shop->domain . $this->context->shop->physical_uri,
            'city' => $address->city,
            'postcode' => $address->postcode,
            'country_iso' => Country::getIsoById($address->id_country) ?: 'PL',
            'countries_map_json' => json_encode($this->getGkCountriesMap($config)) ?: '{}',
            'saved_pickup_type' => $savedPickup ? $savedPickup['type'] : null,
            'saved_pickup_code' => $savedPickup ? $savedPickup['code'] : null,
        ]);

        return $this->display(__FILE__, 'views/templates/hooks/carrier_list.tpl');
    }

    /**
     * Renders all pickup widgets after the carrier list (all PS versions).
     * displayCarrierExtraContent only fires for is_module=1 carriers — our carriers are not
     * module carriers, so we use displayAfterCarrier which is called globally for all versions.
     * All widgets are rendered hidden; JS shows the one matching the selected carrier.
     *
     * @param array $params
     *
     * @return string
     */
    public function hookDisplayAfterCarrier($params): string
    {
        $config = new Config();
        $cart = $this->context->cart;
        $cartId = (int) ($cart ? $cart->id : 0);
        if (!$cartId) {
            return '';
        }

        $carrierMap = $this->buildPickupCarrierMap($config);
        if (empty($carrierMap)) {
            return '';
        }

        $address = new Address($cart->id_address_delivery);
        $terminalPickupManager = new Globkuriermodule\TerminalPickup\TerminalPickupManager();
        $savedPickup = $terminalPickupManager->getByCartId($cartId);

        $output = '';
        foreach ($carrierMap as $carrierId => $info) {
            $output .= $this->renderPickupWidget($info, $carrierId, $cartId, $config, $address, $savedPickup ?: null, true);
        }

        return $output;
    }

    /**
     * Registered for compatibility; returns empty because displayCarrierExtraContent
     * only fires for is_module=1 carriers (not our carriers) in all supported PS versions.
     * Pickup widgets are rendered via hookDisplayAfterCarrier instead.
     *
     * @param array $params
     *
     * @return string
     */
    public function hookDisplayCarrierExtraContent(array $params = []): string
    {
        return '';
    }

    /**
     * Returns a map of configured pickup carrier IDs to their service info.
     *
     * @param Config $config
     *
     * @return array<int, array{serviceCode: string, type: string, isCod: bool}>
     */
    private function buildPickupCarrierMap(Config $config): array
    {
        $map = [];
        if ($config->inPostEnabled && $config->inPostCarrier) {
            $map[(int) $config->inPostCarrier] = ['serviceCode' => 'PACZKOMAT', 'type' => 'inpost', 'isCod' => false];
        }
        if ($config->inPostCODEnabled && $config->inPostCODCarrier) {
            $map[(int) $config->inPostCODCarrier] = ['serviceCode' => 'PACZKOMAT', 'type' => 'inpost', 'isCod' => true];
        }
        if ($config->paczkaRuchEnabled && $config->paczkaRuchCarrier) {
            $map[(int) $config->paczkaRuchCarrier] = ['serviceCode' => 'ORLEN PACZKA', 'type' => 'ruch', 'isCod' => false];
        }
        if ($config->pocztex48owpEnabled && $config->pocztex48owpCarrier) {
            $map[(int) $config->pocztex48owpCarrier] = ['serviceCode' => 'POCZTA POLSKA', 'type' => 'pocztex48owp', 'isCod' => false];
        }
        if ($config->dhlparcelEnabled && $config->dhlparcelCarrier) {
            $map[(int) $config->dhlparcelCarrier] = ['serviceCode' => 'DHL PARCEL', 'type' => 'dhlparcel', 'isCod' => false];
        }
        if ($config->dpdpickupEnabled && $config->dpdpickupCarrier) {
            $map[(int) $config->dpdpickupCarrier] = ['serviceCode' => 'DPD PICKUP', 'type' => 'dpdpickup', 'isCod' => false];
        }

        return $map;
    }

    /**
     * @param array      $info        Service info (serviceCode, type, isCod)
     * @param int        $carrierId   Carrier instance ID
     * @param int        $cartId      Cart ID
     * @param Config     $config      Module config
     * @param Address    $address     Delivery address
     * @param array|null $savedPickup Previously saved pickup point or null
     * @param bool       $hiddenMode  True when rendered in displayAfterCarrier (JS controls visibility)
     */
    public function renderPickupWidget(
        array $info,
        int $carrierId,
        int $cartId,
        Config $config,
        Address $address,
        ?array $savedPickup,
        bool $hiddenMode
    ) {
        $this->smarty->assign([
            'gk_service_code' => $info['serviceCode'],
            'gk_carrier_type' => $info['type'],
            'gk_carrier_id' => $carrierId,
            'gk_is_cod' => $info['isCod'] ? 'true' : 'false',
            'gk_hidden_mode' => $hiddenMode,
            'cart_id' => $cartId,
            'rest_endpoint' => $this->context->link->getModuleLink($this->name, 'restinterface', [], true),
            'gk_token' => $this->encryptCartId($cartId),
            'baseurl' => 'https://' . $this->context->shop->domain . $this->context->shop->physical_uri,
            'city' => $address->city,
            'postcode' => $address->postcode,
            'country_iso' => Country::getIsoById($address->id_country) ?: 'PL',
            'countries_map_json' => json_encode($this->getGkCountriesMap($config)) ?: '{}',
            'saved_pickup_type' => $savedPickup ? $savedPickup['type'] : null,
            'saved_pickup_code' => $savedPickup ? $savedPickup['code'] : null,
        ]);

        return $this->display(__FILE__, 'views/templates/hooks/carrier_extra_content_17.tpl');
    }

    /**
     * aktualizuje id przewoźnika inPostu
     *
     * @param $params - parametry przewoźnika
     *
     * @return void
     */
    /**
     * Fires after admin saves a tracking number on the order page.
     * $params: ['order' => Order, 'carrier' => OrderCarrier, 'tracking_number' => string]
     * PS already wrote the number to ps_order_carrier before this hook fires.
     */
    public function hookActionAdminOrdersTrackingNumberUpdate($params)
    {
        // Future: forward tracking to GlobKurier API or trigger status change
    }

    public function hookActionUpdateCarrier($params)
    {
        $id_carrier_old = (int) $params['id_carrier'];
        $id_carrier_new = (int) $params['carrier']->id;
        $config = new Config();
        if ($config->inPostCarrier == $id_carrier_old) {
            $config->inPostCarrier = $id_carrier_new;
            $config->update(false);
        }
        if ($config->paczkaRuchCarrier == $id_carrier_old) {
            $config->paczkaRuchCarrier = $id_carrier_new;
            $config->update(false);
        }
    }

    public function hookDisplayHeader($params)
    {
        $config = new Config();
        $code = trim($this->context->controller->php_self);
        if ($code != 'order' && $code != 'order-opc') {
            return;
        }
        if (version_compare(_PS_VERSION_, '8.0.0', '>=') === true) {
            // PrestaShop 8.x and 9.x - use modern asset management
            $this->context->controller->registerStylesheet(
                'module-' . $this->name . '-style',
                'modules/' . $this->name . '/views/css/front.css',
                [
                    'media' => 'all',
                    'priority' => 200,
                ],
            );
            $this->context->controller->registerStylesheet(
                'module-' . $this->name . '-select2-style',
                'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css',
                [
                    'media' => 'all',
                    'priority' => 200,
                ],
            );

            // Load Leaflet Maps CSS - high priority to load before other styles
            $this->context->controller->registerStylesheet(
                'module-' . $this->name . '-leaflet-style',
                'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
                [
                    'server' => 'remote',
                    'media' => 'all',
                    'priority' => 150,
                ],
            );

            $this->context->controller->registerStylesheet(
                'module-' . $this->name . '-MarkerCluster',
                'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css',
                [
                    'server' => 'remote',
                    'media' => 'all',
                    'priority' => 150,
                ],
            );

            $this->context->controller->registerStylesheet(
                'module-' . $this->name . '-MarkerCluster-default',
                'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css',
                [
                    'server' => 'remote',
                    'media' => 'all',
                    'priority' => 150,
                ],
            );

            // Load Leaflet Maps JavaScript
            $this->context->controller->registerJavascript(
                'leaflet-maps-js',
                'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
                [
                    'server' => 'remote',
                    'position' => 'bottom',
                    'priority' => 180,
                ],
            );
            $this->context->controller->registerJavascript(
                'leaflet-markercluster-js',
                'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js',
                [
                    'server' => 'remote',
                    'position' => 'bottom',
                    'priority' => 185,
                ],
            );

            // Load Select2 JavaScript
            $this->context->controller->registerJavascript(
                'select-select2',
                'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js',
                [
                    'server' => 'remote',
                    'position' => 'bottom',
                    'priority' => 200,
                    'attribute' => 'defer',
                ],
            );

            // Load main module JavaScript
            $this->context->controller->registerJavascript(
                'modules-globkuriermodule',
                'modules/' . $this->name . '/views/js/inpost-front-17.js',
                [
                    'position' => 'bottom',
                    'priority' => 250,
                ],
            );
        } elseif (version_compare(_PS_VERSION_, '1.7.0', '>=') === true) {
            // PrestaShop 1.7.x
            $this->context->controller->registerStylesheet(
                'module-' . $this->name . '-style',
                'modules/' . $this->name . '/views/css/front.css',
                [
                    'media' => 'all',
                    'priority' => 200,
                ],
            );
            $this->context->controller->registerStylesheet(
                'module-' . $this->name . '-select2-style',
                'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css',
                [
                    'server' => 'remote',
                    'media' => 'all',
                    'priority' => 200,
                ],
            );

            // Load Leaflet Maps CSS - high priority to load before other styles
            $this->context->controller->registerStylesheet(
                'module-' . $this->name . '-leaflet-style',
                'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
                [
                    'server' => 'remote',
                    'media' => 'all',
                    'priority' => 150,
                ],
            );

            $this->context->controller->registerStylesheet(
                'module-' . $this->name . '-MarkerCluster',
                'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css',
                [
                    'server' => 'remote',
                    'media' => 'all',
                    'priority' => 150,
                ],
            );

            $this->context->controller->registerStylesheet(
                'module-' . $this->name . '-MarkerCluster-default',
                'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css',
                [
                    'server' => 'remote',
                    'media' => 'all',
                    'priority' => 150,
                ],
            );

            // Load Leaflet Maps JavaScript
            $this->context->controller->registerJavascript(
                'leaflet-maps-js',
                'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
                [
                    'server' => 'remote',
                    'position' => 'bottom',
                    'priority' => 180,
                ],
            );

            $this->context->controller->registerJavascript(
                'leaflet-markercluster-js',
                'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js',
                [
                    'server' => 'remote',
                    'position' => 'bottom',
                    'priority' => 185,
                ],
            );

            $this->context->controller->registerJavascript(
                'select-select2',
                'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js',
                [
                    'server' => 'remote',
                    'position' => 'bottom',
                    'priority' => 200,
                    'attribute' => 'defer',
                ],
            );
            $this->context->controller->registerJavascript(
                'modules-globkuriermodule',
                'modules/' . $this->name . '/views/js/inpost-front-17.js',
                [
                    'position' => 'bottom',
                    'priority' => 250,
                ],
            );
        } else {
            $this->context->controller->addCSS($this->_path . 'views/css/front.css', 'all');
            $this->context->controller->addJS($this->_path . 'views/js/inpost-front.js');
        }
    }

    public function hookDisplayBackOfficeHeader($params)
    {
        $this->context->controller->addCSS($this->_path . 'views/css/back.css', 'all');
    }

    public function hookDisplayAdminAfterHeader($params)
    {
        $latestVersion = $this->getLatestGithubVersion();
        if (!$latestVersion || version_compare($latestVersion, $this->version, '<=')) {
            return '';
        }

        $this->context->smarty->assign([
            'gk_currentVersion' => $this->version,
            'gk_latestVersion' => $latestVersion,
            'gk_githubReleaseUrl' => 'https://github.com/globkurier/prestashop-module/releases/latest',
        ]);

        return $this->display(__FILE__, 'views/templates/hooks/github_update_notification.tpl');
    }

    private function getLatestGithubVersion()
    {
        $cacheTime = (int) Configuration::get('GLOBKURIER_GITHUB_CACHE_TIME');
        $cachedVersion = Configuration::get('GLOBKURIER_GITHUB_LATEST_VER');

        if ($cachedVersion && (time() - $cacheTime) < 86400) {
            return $cachedVersion;
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://api.github.com/repos/globkurier/prestashop-module/releases/latest');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'globkuriermodule/' . $this->version);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        $result = curl_exec($ch);
        curl_close($ch);

        if (!$result) {
            return $cachedVersion ?: false;
        }

        $data = json_decode($result, true);
        if (!isset($data['tag_name'])) {
            return $cachedVersion ?: false;
        }

        $version = ltrim($data['tag_name'], 'v');
        Configuration::updateValue('GLOBKURIER_GITHUB_LATEST_VER', $version);
        Configuration::updateValue('GLOBKURIER_GITHUB_CACHE_TIME', time());

        return $version;
    }

    /**
     * Encrypt cart ID for security token
     * Compatible with all PrestaShop versions
     *
     * @param int $cartId
     *
     * @return string
     */
    /**
     * Returns ISO -> GK country ID map, cached in a local JSON file for 7 days.
     * The /countries endpoint is public (no auth required).
     *
     * @param Config $config
     *
     * @return array e.g. ['PL' => 1, 'DE' => 23, ...]
     */
    private function getGkCountriesMap(Config $config)
    {
        $cacheFile = _PS_MODULE_DIR_ . 'globkuriermodule/countries_map.json';
        $ttl = 7 * 24 * 3600;

        if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $ttl) {
            $map = json_decode(file_get_contents($cacheFile), true);
            if (is_array($map) && count($map) > 0) {
                return $map;
            }
        }

        $api = new Globkuriermodule\Common\GlobkurierApi($config->login, $config->password, $config->apiKey);
        $countries = $api->getCountries();

        $map = [];
        foreach ($countries as $c) {
            if (!empty($c['isoCode']) && isset($c['id'])) {
                $map[strtoupper($c['isoCode'])] = (int) $c['id'];
            }
        }

        if ($map) {
            @file_put_contents($cacheFile, json_encode($map));
        }

        return $map;
    }

    private function encryptCartId($cartId)
    {
        // Use hash with salt for security
        $salt = _COOKIE_KEY_ . $this->name;

        return hash('sha256', $cartId . $salt);
    }
}
