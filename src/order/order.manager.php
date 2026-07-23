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
namespace Globkuriermodule\Order;
if (!defined('_PS_VERSION_')) {
    exit;
}
class OrderManager
{
    public function __construct()
    {
    }

    /**
     * Liczba wszystkich zamówień GK
     */
    public function getCount()
    {
        return (int) \Db::getInstance()->getValue('SELECT COUNT(*) FROM ' . _DB_PREFIX_ . 'gk_orders');
    }

    /**
     * Pobiera stronę zamówień GK z numerem śledzenia z ps_order_carrier (do porównania)
     * @param int $limit
     * @param int $offset
     * @return OrderModel[]
     */
    public function getAll($limit = 20, $offset = 0)
    {
        $sql = 'SELECT gko.*, oc.tracking_number AS oc_tracking_number
                FROM ' . _DB_PREFIX_ . 'gk_orders gko
                LEFT JOIN ' . _DB_PREFIX_ . 'order_carrier oc ON gko.order_id = oc.id_order
                ORDER BY gko.crate_date DESC
                LIMIT ' . (int) $limit . ' OFFSET ' . (int) $offset;
        $results = \Db::getInstance()->executeS($sql);
        $orders = [];
        foreach ($results as $row) {
            $order = new OrderModel();
            $this->assignMySqlDataToOrder($row, $order);
            $orders[] = $order;
        }
        return $orders;
    }

    /**
     * Zwraca obiekt typu order po id zamówienia
     * @param $orderId - id zamowienia
     * @return array - tablica obiektów typu zamowienie z wszystkimi jego wartościami
     * @throws \Exception
     */
    public function getByOrderId($orderId)
    {
        // Check if orderId is null or empty or less than 0
        if ($orderId === null || $orderId === '' || $orderId <= 0) {
            return [];
        }

        $orders = [];
        $sql = 'SELECT * FROM ' . _DB_PREFIX_ . 'gk_orders WHERE order_id = ' . (int) $orderId;
        $results = \Db::getInstance()->executeS($sql);
        foreach ($results as $row) {
            $orders[] = $this->getByGkId($row['gk_id']);
        }

        return $orders;
    }

    /**
     * Zwraca obiekt typu order po id globkuriera (id wysyłki)
     * @param $gkId - id globkuriera (id wysyłki)
     * @return OrderModel - obiekt typu zamowienie z wszystkimi jego wartościami
     * @throws \Exception
     */
    public function getByGkId($gkId)
    {
        $order = new OrderModel();
        $sql = 'SELECT gko.*, oc.tracking_number AS oc_tracking_number
                FROM ' . _DB_PREFIX_ . 'gk_orders gko
                LEFT JOIN ' . _DB_PREFIX_ . 'order_carrier oc ON gko.order_id = oc.id_order
                WHERE gko.gk_id = "' . pSQL($gkId) . '"';
        $row = \Db::getInstance()->getRow($sql);

        if (!$row) {
            throw new \Exception("Error, don't find order with this Id.");
        }

        $this->assignMySqlDataToOrder($row, $order);

        return $order;
    }

    /**
     * Tworzy nowe zamówienie i wkłada je do bazy danych
     * @param $orderToCreate - obiekt typu zamowienie który ma zostac utowrzony
     * @return bool - true w przy pomyslnego utworzenia
     */
    public function create(OrderModel $orderToCreate)
    {
        if (!$orderToCreate->crateDate) {
            $orderToCreate->crateDate = date('Y-m-d H:i:s');
        }

        $results = \Db::getInstance()->insert('gk_orders', [
            'gk_id' => pSQL($orderToCreate->gkId),
            'hash' => pSQL($orderToCreate->hash),
            'order_id' => (int) $orderToCreate->orderId,
            'crate_date' => pSQL($orderToCreate->crateDate),
            'receiver' => pSQL($orderToCreate->receiver),
            'content' => pSQL($orderToCreate->content),
            'weight' => (int) $orderToCreate->weight,
            'carrier' => pSQL($orderToCreate->carrier),
            'comments' => pSQL($orderToCreate->comments),
            'cod' => (float) $orderToCreate->cod,
            'payment' => pSQL($orderToCreate->payment),
        ]);

        if (!$results) {
            return false;
        }
        return true;
    }

    /**
     * Zwraca wszystkie zamówienia bez przypisanego tracking number (bez limitu czasu)
     * Sortuje malejąco po dacie, żeby pierwsze wystąpienie danego order_id to było najnowsze
     * @return OrderModel[]
     */
    public function getAllWithoutTracking()
    {
        $sql = 'SELECT * FROM ' . _DB_PREFIX_ . 'gk_orders
                WHERE (tracking_number IS NULL OR tracking_number = "")
                AND order_id > 0
                ORDER BY crate_date DESC';
        $results = \Db::getInstance()->executeS($sql);
        $orders = [];
        foreach ($results as $row) {
            $order = new OrderModel();
            $this->assignMySqlDataToOrder($row, $order);
            $orders[] = $order;
        }
        return $orders;
    }

    /**
     * Zwraca zamówienia z ostatnich 48h bez przypisanego tracking number
     * @return OrderModel[]
     */
    public function getWithoutTracking48h()
    {
        $sql = 'SELECT gko.*, oc.tracking_number AS oc_tracking_number
                FROM ' . _DB_PREFIX_ . 'gk_orders gko
                LEFT JOIN ' . _DB_PREFIX_ . 'order_carrier oc ON gko.order_id = oc.id_order
                WHERE (oc.tracking_number IS NULL OR oc.tracking_number = "")
                AND gko.crate_date >= DATE_SUB(NOW(), INTERVAL 48 HOUR)
                ORDER BY gko.crate_date DESC';
        $results = \Db::getInstance()->executeS($sql);
        $orders = [];
        foreach ($results as $row) {
            $order = new OrderModel();
            $this->assignMySqlDataToOrder($row, $order);
            $orders[] = $order;
        }
        return $orders;
    }

    /**
     * Zapisuje tracking w tabeli gk_orders (per GK zamówienie)
     * @param string $gkId
     * @param string $trackingNumber
     * @return bool
     */
    public function updateGkOrderTracking($gkId, $trackingNumber)
    {
        return (bool) \Db::getInstance()->update(
            'gk_orders',
            ['tracking_number' => pSQL($trackingNumber)],
            'gk_id = "' . pSQL($gkId) . '"'
        );
    }

    /**
     * Zapisuje tracking w ps_order_carrier tylko gdy pole jest jeszcze puste.
     * Używa PS ObjectModel per https://devdocs.prestashop-project.org/1.7/faq/shipping/
     * @param string $gkId
     * @param string $trackingNumber
     * @return bool
     */
    public function updatePsCarrierTracking($gkId, $trackingNumber)
    {
        $row = \Db::getInstance()->getRow(
            'SELECT order_id FROM ' . _DB_PREFIX_ . 'gk_orders WHERE gk_id = "' . pSQL($gkId) . '"'
        );
        if (!$row || !(int) $row['order_id']) {
            return false;
        }

        $order = new \Order((int) $row['order_id']);
        if (!\Validate::isLoadedObject($order)) {
            return false;
        }

        $idOrderCarrier = $order->getIdOrderCarrier();
        if (!$idOrderCarrier) {
            return false;
        }

        $orderCarrier = new \OrderCarrier((int) $idOrderCarrier);
        if (!\Validate::isLoadedObject($orderCarrier)) {
            return false;
        }

        if (!empty($orderCarrier->tracking_number)) {
            return true; // already set — do not overwrite
        }

        $orderCarrier->tracking_number = pSQL($trackingNumber);
        return (bool) $orderCarrier->save();
    }

    /**
     * Aktualizuje tracking zarówno w gk_orders jak i ps_order_carrier.
     * Używane po złożeniu zamówienia — wtedy to zamówienie jest z definicji najnowszym GK dla tego PS order.
     * @param string $gkId
     * @param string $trackingNumber
     * @return bool
     */
    public function updateTrackingNumber($gkId, $trackingNumber)
    {
        $this->updateGkOrderTracking($gkId, $trackingNumber);
        return $this->updatePsCarrierTracking($gkId, $trackingNumber);
    }

    private function assignMySqlDataToOrder($mysqlData, $order)
    {
        $order->gkId = $mysqlData['gk_id'];
        $order->hash = $mysqlData['hash'];
        $order->orderId = $mysqlData['order_id'];
        $order->crateDate = $mysqlData['crate_date'];
        $order->receiver = $mysqlData['receiver'];
        $order->content = $mysqlData['content'];
        $order->weight = $mysqlData['weight'];
        $order->carrier = $mysqlData['carrier'];
        $order->comments = $mysqlData['comments'];
        $order->cod = $mysqlData['cod'];
        $order->payment = $mysqlData['payment'];
        $order->paymentName = $this->translatePaymentName($mysqlData['payment']);
        $order->trackingNumber = !empty($mysqlData['tracking_number']) ? $mysqlData['tracking_number'] : null;
        $order->psTrackingNumber = isset($mysqlData['oc_tracking_number']) && $mysqlData['oc_tracking_number'] !== ''
            ? $mysqlData['oc_tracking_number'] : null;
    }

    private function translatePaymentName($paymentCode)
    {
        switch ($paymentCode) {
            case 'T':case 1:
                $name = 'Przelew';

                break;
            case 'O':case 2:
                $name = 'Online';

                break;
            case 'P':case 3:
                $name = 'Prepaid';

                break;
            case 'D':
                $name = 'Odroczona';

                break;
            case 'COD':
                $name = 'Na koszt odbiorcy';

                break;
            default:
                $name = 'Inny';
        }
        return $name;
    }
}
