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
class AdminGlobkurierHistoryController extends ModuleAdminController
{
    private $link;

    public function __construct()
    {
        $this->table = 'configuration';
        $this->display = 'view';
        $this->bootstrap = true;
        $this->meta_title = 'Przesyłki zamówione przez GlobKurier';
        parent::__construct();
        $this->path = $this->path ? $this->path : _MODULE_DIR_ . $this->module->name;
        $this->link = new Link();
    }

    // @Override
    public function renderView()
    {
        $allowedPerPage = [10, 20, 50, 100];
        $perPage = (int) Tools::getValue('perPage', 20);
        if (!in_array($perPage, $allowedPerPage)) {
            $perPage = 20;
        }
        $page = max(1, (int) Tools::getValue('page', 1));

        $orderManager = new Globkuriermodule\Order\OrderManager();
        $total = $orderManager->getCount();
        $totalPages = max(1, (int) ceil($total / $perPage));
        if ($page > $totalPages) {
            $page = $totalPages;
        }
        $offset = ($page - 1) * $perPage;
        $orders = $orderManager->getAll($perPage, $offset);

        $baseUrl = $this->link->getAdminLink('AdminGlobkurierHistory');
        $this->context->smarty->assign([
            'orders' => $orders,
            'total' => $total,
            'page' => $page,
            'perPage' => $perPage,
            'totalPages' => $totalPages,
            'prevPage' => $page - 1,
            'nextPage' => $page + 1,
            'pFrom' => max(1, $page - 3),
            'pTo' => min($totalPages, $page + 3),
            'historyBaseUrl' => $baseUrl,
            'orderDetailsUrl' => $this->link->getAdminLink('AdminOrders') . '&vieworder',
            'moduleApiUrl' => $baseUrl,
            'urlModule' => $this->link->getModuleLink('globkuriermodule', 'getLabel'),
        ]);

        return $this->module->display($this->path, 'views/templates/admin/history_page.tpl');
    }

    // @Override
    public function postProcess()
    {
        return parent::postProcess();
    }

    /**
     * Auto-sync: fetches missing tracking codes from GK API for orders
     * that have no tracking_number in gk_orders (current page only).
     * Does NOT update ps_order_carrier.
     */
    public function displayAjaxAutoSyncTracking()
    {
        $allowedPerPage = [10, 20, 50, 100];
        $perPage = (int) Tools::getValue('perPage', 20);
        if (!in_array($perPage, $allowedPerPage)) {
            $perPage = 20;
        }
        $page = max(1, (int) Tools::getValue('page', 1));
        $offset = ($page - 1) * $perPage;

        $om = new Globkuriermodule\Order\OrderManager();
        $orders = $om->getAll($perPage, $offset);

        $missing = array_filter($orders, function ($o) {
            return $o->hash && !$o->trackingNumber;
        });

        if (empty($missing)) {
            header('Content-Type: application/json');
            echo json_encode(['success' => true, 'trackings' => []]);

            return true;
        }

        $c = new Globkuriermodule\Common\Config();
        $gkApiEnv = isset($c->gkApiEnv) ? (int)$c->gkApiEnv : 1;
        $api = new Globkuriermodule\Common\GlobkurierApi($c->login, $c->password, $c->apiKey, $gkApiEnv);

        try {
            $api->login();
        } catch (Exception $e) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'error' => 'Login failed: ' . $e->getMessage()]);

            return true;
        }

        $trackings = [];
        foreach ($missing as $order) {
            try {
                $response = $api->getOrder($order->hash, $order->gkId);
                $tn = isset($response['trackingNumber']) ? $response['trackingNumber'] : null;
                if ($tn) {
                    $om->updateGkOrderTracking($order->gkId, $tn);
                    $trackings[$order->gkId] = [
                        'gkTracking' => $tn,
                        'psTracking' => $order->psTrackingNumber,
                    ];
                }
            } catch (Exception $e) {
                // skip — missing tracking on one order should not block others
            }
        }

        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'trackings' => $trackings]);

        return true;
    }

    /**
     * Updates tracking in ps_order_carrier for a single GK order.
     * Triggered by the per-row "Update in order" button.
     */
    public function displayAjaxUpdateCarrierTracking()
    {
        $gkId = Tools::getValue('gkId');
        if (!$gkId) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'error' => 'Missing gkId']);

            return true;
        }

        $om = new Globkuriermodule\Order\OrderManager();
        $order = null;

        try {
            $order = $om->getByGkId($gkId);
        } catch (Exception $e) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'error' => 'Order not found']);

            return true;
        }

        if (!$order->trackingNumber) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'error' => 'No GK tracking number to copy']);

            return true;
        }

        $success = $om->updatePsCarrierTracking($gkId, $order->trackingNumber);
        header('Content-Type: application/json');
        echo json_encode(['success' => $success, 'trackingNumber' => $order->trackingNumber]);

        return true;
    }

    /**
     * Metoda do zwracania linku do listu przewozowego
     * przykladowy adres: index.php?controller=AdminGlobkurierPlaceOrder&ajax=1&action=getWaybill&gknumber=xc123123
     *
     * @return bool zwracana zmienna nie ma znaczenia
     */
    public function displayAjaxGetWaybill()
    {
        /** @var string numer przesylki dla ktorej chcemy pobrać list przewozowy */
        $number = Tools::getValue('gknumber', null);
        $resData = [];

        try {
            $c = new Globkuriermodule\Common\Config();
            $gkApiEnv = isset($c->gkApiEnv) ? (int)$c->gkApiEnv : 1;
            $api = new Globkuriermodule\Common\GlobkurierApi($c->login, $c->password, $c->apiKey, $gkApiEnv);
            $url = $api->getWaybillUrl($number);
            $resData['success'] = true;
            $resData['url'] = $url;
        } catch (Exception $e) {
            $resData['success'] = false;
            $resData['error'] = $e->getMessage();
        }
        header('Content-Type: application/json');
        echo json_encode($resData);

        return true;
    }
}
