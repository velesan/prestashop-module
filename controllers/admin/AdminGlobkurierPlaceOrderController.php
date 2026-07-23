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
if (!defined('_PS_VERSION_')) {
    exit;
}
class AdminGlobkurierPlaceOrderController extends ModuleAdminController
{
    private $link;

    public function __construct()
    {
        $this->table = 'configuration';
        $this->display = 'view';
        $this->bootstrap = true;
        $this->meta_title = 'Zamawianie przesyłki globkurier';
        parent::__construct();
        $this->path = $this->path ? $this->path : _MODULE_DIR_ . $this->module->name;
        $this->link = new Link();
    }

    // @Override
    public function renderView()
    {
        $c = new Globkuriermodule\Common\Config();
        $api = new Globkuriermodule\Common\GlobkurierApi($c->login, $c->password, $c->apiKey);
        $moduleApiUrl = $this->link->getAdminLink('AdminGlobkurierPlaceOrder');
        $country_name = '';
        $sender_country_iso = $c->defaultCountryCode ? $c->defaultCountryCode : 'PL';

        if (!$api->isUserAuthorized()) {
            return $this->displayAuthFail();
        }

        $this->context->controller->addJqueryUI('ui.datepicker');
        // Angular removed; Vue/jQuery app will be added later
        $this->context->controller->addJS($this->path . '/views/js/newParcelApp.jquery.js');

        if (!empty($c->defaultCountryCode)) {
            $sender_country_id = Country::getByIso($c->defaultCountryCode);
            $country_name = new Country($sender_country_id);
        }

        $lang = new Language((int) $this->context->cookie->id_lang);

        $this->context->smarty->assign([
            'orderId' => Tools::getValue('order_id'),
            'moduleApiUrl' => $moduleApiUrl,
            'config' => $c,
            'token' => $api->getToken(),
            'globClientId' => $api->getClientId(),
            'service' => 'PICKUP',
            'iso_code' => $lang->iso_code,
            'sender_country_iso' => $sender_country_iso,
        ]);

        if (Tools::getValue('order_id')) {
            $order = new Order(Tools::getValue('order_id'));
            $customer = new Customer($order->id_customer);

            if (Tools::getValue('invoice_address')) {
                $adress = new Address($order->id_address_invoice);
            } else {
                $adress = new Address($order->id_address_delivery);
            }

            // Carrier chosen in the PrestaShop order
            $prestaCarrierId = !empty($order->id_carrier) ? (int) $order->id_carrier : null;
            $prestaCarrierName = null;
            $carrierLimits = ['max_weight' => 0, 'max_width' => 0, 'max_height' => 0, 'max_depth' => 0];
            if ($prestaCarrierId) {
                try {
                    if (class_exists('Carrier')) {
                        $carrier = new Carrier($prestaCarrierId);
                        if (Validate::isLoadedObject($carrier)) {
                            // PS tworzy nowy rekord przy każdej edycji przewoźnika — szukamy
                            // aktualnej (nieskasowanej) wersji przez id_reference
                            $currentId = (int) Db::getInstance()->getValue(
                                'SELECT id_carrier FROM ' . _DB_PREFIX_ . 'carrier
                                 WHERE id_reference = ' . (int) $carrier->id_reference . '
                                 AND deleted = 0
                                 ORDER BY id_carrier DESC'
                            );
                            if ($currentId && $currentId !== $prestaCarrierId) {
                                $current = new Carrier($currentId);
                                if (Validate::isLoadedObject($current)) {
                                    $carrier = $current;
                                }
                            }
                            if ($carrier->name !== '') {
                                $prestaCarrierName = $carrier->name;
                            }
                            $carrierLimits = [
                                'max_weight' => (float) $carrier->max_weight,
                                'max_width'  => (float) $carrier->max_width,
                                'max_height' => (float) $carrier->max_height,
                                'max_depth'  => (float) $carrier->max_depth,
                            ];
                        }
                    }
                } catch (\Throwable $e) {
                    $prestaCarrierName = null;
                }
            }

            $country = new Country($adress->id_country);
            $receiver_country_iso = $country->iso_code ? $country->iso_code : 'PL';

            $tpm = new Globkuriermodule\TerminalPickup\TerminalPickupManager();

            $codeTerminal = null;
            $splitedAddress = null;
            $terminalPickup = $tpm->getByCartId($order->id_cart);
            $terminalType = null;
            if ($terminalPickup && is_array($terminalPickup)) {
                $codeTerminal = isset($terminalPickup['code']) ? $terminalPickup['code'] : null;
                $terminalType = isset($terminalPickup['type']) ? $terminalPickup['type'] : null;
            }
            if ($splitter = $this->getSplittedAddres($adress)) {
                $splitedAddress = [
                    'street' => $splitter->getStreet(),
                    'houseNumber' => $splitter->getHouseNumber(),
                    'apartmentNumber' => $splitter->getApartmentNumber(),
                ];
            }

            $orderProductsWeight = 0;
            $catalogProductsWeight = 0;
            try {
                foreach ($order->getProducts() as $product) {
                    $orderProductsWeight += (float) $product['product_weight'] * (int) $product['product_quantity'];
                }
            } catch (\Exception $e) {
            }
            if ($orderProductsWeight <= 0) {
                try {
                    foreach ($order->getProducts() as $product) {
                        $p = new Product((int) $product['product_id']);
                        $weight = Validate::isLoadedObject($p) ? (float) $p->weight : 0;
                        if (!empty($product['product_attribute_id'])) {
                            $combination = new Combination((int) $product['product_attribute_id']);
                            if (Validate::isLoadedObject($combination)) {
                                $weight += (float) $combination->weight;
                            }
                        }
                        $catalogProductsWeight += $weight * (int) $product['product_quantity'];
                    }
                } catch (\Exception $e) {
                }
            }

            $this->context->smarty->assign([
                'adress' => $adress,
                'splitedAddress' => $splitedAddress,
                'country' => $country,
                'customer' => $customer,
                'terminalCode' => $codeTerminal,
                'terminalType' => $terminalType,
                'receiver_country_iso' => $receiver_country_iso,
                'presta_carrier_id' => $prestaCarrierId,
                'presta_carrier_name' => $prestaCarrierName,
                'carrier_limits' => $carrierLimits,
                'order_products_weight' => $orderProductsWeight,
                'catalog_products_weight' => $catalogProductsWeight,
                'effective_products_weight' => max($orderProductsWeight, $catalogProductsWeight),
            ]);
        } else {
            $this->context->smarty->assign([
                'adress' => [],
                'splitedAddress' => null,
                'country' => $country_name,
                'customer' => [],
                'terminalCode' => null,
                'terminalType' => null,
                'receiver_country_iso' => 'PL',
                'presta_carrier_id' => null,
                'presta_carrier_name' => null,
                'carrier_limits' => ['max_weight' => 0, 'max_width' => 0, 'max_height' => 0, 'max_depth' => 0],
                'order_products_weight' => 0,
                'catalog_products_weight' => 0,
                'effective_products_weight' => 0,
            ]);
        }

        $urlRedirect = $_SERVER['HTTP_REFERER'];
        if (strpos($urlRedirect, 'view') === false) {
            $urlRedirect = $this->context->link->getAdminLink('AdminGlobkurierHistory');
        }

        $this->context->smarty->assign([
            'urlRedirect' => $urlRedirect,
        ]);

        return $this->module->display($this->path, 'views/templates/admin/new_parcel_page.tpl');
    }

    /**
     * Probuje wydzielic z adresu numer ulicy/mieszkania. Bierze pod uwage rowniez
     * pole address2, z tego wzgledu, ze niektore sklepy dziela adres na dwa pola
     *
     * @param Address $address - intancja adresu
     * @return AddressSplitter\AddressSplitter|null w przypadku nieudanego podzialu zwraca null
     */
    private function getSplittedAddres(Address $address)
    {
        $splitter = new AddressSplitter\AddressSplitter();
        if (!empty($address->address2) && $splitter->split($address->address1 . ' ' . $address->address2)) {
            return $splitter;
        }

        $splitter = new AddressSplitter\AddressSplitter();
        if ($splitter->split($address->address1)) {
            return $splitter;
        } else {
            return null;
        }
    }

    // strona z informacja, ze uzytkownik musi sie najpierw zalogowac
    private function displayAuthFail()
    {
        $this->context->smarty->assign([
            'configureUrl' => $this->link->getAdminLink('AdminModules') . '&configure=' . $this->module->name,
        ]);

        if (version_compare(_PS_VERSION_, '1.6.0', '>=') === true) {
            return $this->module->display($this->path, 'views/templates/admin/auth_fail_v16.tpl');
        } else {
            return $this->module->display($this->path, 'views/templates/admin/auth_fail_v15.tpl');
        }
    }

    // @Override
    public function postProcess()
    {
        return parent::postProcess();
    }

    /**
     * Szkielet metody do zapisywania logów z zamawianych przesyłek
     * przykladowy adres: index.php?controller=AdminGlobkurierPlaceOrder&ajax=1&action=logXml
     * @return bool zwracana zmienna nie ma znaczenia
     */
    public function displayAjaxLogXml()
    {
        // w zmiennej $xml docelowo bedzie cała zawartość pliku
        $xml = Tools::getValue('xmlRequest', null);

        $data = [
            'success' => Globkuriermodule\Common\Logger::xmlRequest($xml),
            'xml' => $xml,
        ];

        header('Content-Type: application/json');
        echo json_encode($data);
        return true;
    }

    /**
     * Szkielet metody do zapisywania logów z zamawianych przesyłek
     * przykladowy adres: index.php?controller=AdminGlobkurierPlaceOrder&ajax=1&action=getLogs
     * @return bool zwracana zmienna nie ma znaczenia
     */
    public function displayAjaxGetLogs()
    {
        $logs = Globkuriermodule\Common\Logger::getLogs();
        $string = '';
        foreach ($logs as $log) {
            $string = $string . $log['id'] . ';' . $log['data'] . ';' . $log['type'] . ';' . $log['content'] . '\n';
        }

        header('Content-Type: application/csv');
        header('Content-Disposition: attachment; filename=log-globkurier.csv');
        header('Content-Length: ' . strlen($string));

        echo $string;
        return true;
    }

    /**
     * Szkielet metody do zapisywania odpowiedzi z serwera
     * przykladowy adres: index.php?controller=AdminGlobkurierPlaceOrder&ajax=1&action=logServerResponse
     * @return bool zwracana zmienna nie ma znaczenia
     */
    public function displayAjaxLogServerResponse()
    {
        // w zmiennej $content docelowo bedzie cała zawartość pliku
        $content = Tools::getValue('serverResponse', null);

        $data = [
            'success' => Globkuriermodule\Common\Logger::serverResponse($content),
        ];

        header('Content-Type: application/json');
        echo json_encode($data);
        return true;
    }

    /**
     * Szkielet metody do zapisywania nowych zamówień kurierskich do bazy danych
     * przykladowy adres: index.php?controller=AdminGlobkurierPlaceOrder&ajax=1&action=addNewGlobOrder
     * @return bool zwracana zmienna nie ma znaczenia
     */
    public function displayAjaxAddNewGlobOrder()
    {
        // w zmiennej $data docelowo bedzie cała zawartość pliku
        $data = Tools::getValue('data', null);
        $decode = json_decode($data, true);

        $order = new Globkuriermodule\Order\OrderModel();
        $order->gkId = $decode['gkId'];
        $order->hash = isset($decode['hash']) ? $decode['hash'] : '';
        $order->orderId = $decode['orderId'];
        $order->crateDate = $decode['crateDate'];
        $order->receiver = $decode['receiver'];
        $order->content = $decode['content'];
        $order->weight = $decode['weight'];
        $order->carrier = $decode['carrier'];
        $order->comments = $decode['comments'];
        $order->cod = $decode['cod'];
        $order->payment = $decode['payment'];

        $om = new Globkuriermodule\Order\OrderManager();
        $success = $om->create($order);

        $trackingNumber = null;
        if ($success && !empty($order->hash)) {
            try {
                $c = new Globkuriermodule\Common\Config();
                $api = new Globkuriermodule\Common\GlobkurierApi($c->login, $c->password, $c->apiKey);
                $api->login();
                $response = $api->getOrder($order->hash, $order->gkId);
                $tn = isset($response['trackingNumber']) ? $response['trackingNumber'] : null;
                if ($tn !== null) {
                    $om->updateTrackingNumber($order->gkId, $tn);
                    $trackingNumber = $tn;
                }
            } catch (\Exception $e) {
                // tracking niedostępny jeszcze — JS polling uzupełni
            }
        }

        $d = [
            'success' => $success,
            'trackingNumber' => $trackingNumber,
        ];

        header('Content-Type: application/json');
        echo json_encode($d);
        return true;
    }

    /**
     * Zapisuje numer śledzenia przesyłki pobrany przez JS z /v1/order/tracking
     * przykladowy adres: index.php?controller=AdminGlobkurierPlaceOrder&ajax=1&action=saveTrackingNumber
     */
    public function displayAjaxSaveTrackingNumber()
    {
        $gkId = Tools::getValue('gkId');
        $trackingNumber = Tools::getValue('trackingNumber');
        $success = false;
        if ($gkId && $trackingNumber) {
            $om = new Globkuriermodule\Order\OrderManager();
            $success = $om->updateTrackingNumber($gkId, $trackingNumber);
        }
        header('Content-Type: application/json');
        echo json_encode(['success' => $success]);
        return true;
    }

    /**
     * przykladowy adres: index.php?controller=AdminGlobkurierPlaceOrder&ajax=1&action=getAllPickupPoints
     * @return bool zwracana zmienna nie ma znaczenia
     */
    public function displayAjaxGetAllPickupPoints()
    {
        $c = new Globkuriermodule\Common\Config();
        $api = new Globkuriermodule\Common\GlobkurierApi($c->login, $c->password, $c->apiKey);

        $api->cacheInPostPoints();
        $api->cachePaczkaWRuchuPoints();

        return true;
    }
}
