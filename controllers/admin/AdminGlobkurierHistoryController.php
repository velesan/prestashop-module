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
        $this->module->addTradeDocumentsAssets($this->context->controller);
        $this->context->smarty->assign([
            'gkTradeDocsI18nTpl' => _PS_MODULE_DIR_ . 'globkuriermodule/views/templates/admin/trade_documents_i18n.tpl',
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
        $gkApiEnv = isset($c->gkApiEnv) ? (int) $c->gkApiEnv : 1;
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

    /** Max decoded PDF size GK accepts for a trade document */
    public const TRADE_DOCUMENT_MAX_BYTES = 5242880;

    /**
     * Customs (trade) documents of one shipment: manifest + shipment status/carrier.
     * example URL: index.php?controller=AdminGlobkurierHistory&ajax=1&action=tradeDocuments&hash=...
     */
    public function displayAjaxTradeDocuments()
    {
        try {
            $hash = $this->getOwnedTradeDocumentHash();
            if ($hash === null) {
                return $this->tradeDocumentJson(['ok' => false, 'error' => 'not_found']);
            }

            $api = $this->createTradeDocumentApi();
            $lang = $this->getTradeDocumentLang();
            $manifest = $api->getTradeDocumentManifest($hash, $lang);
            // 404 = carrier/route without a manifest — same as an empty typeList (nothing required)
            if ($manifest['code'] >= 300 && $manifest['code'] !== 404) {
                return $this->tradeDocumentJson(['ok' => false, 'error' => $this->gkErrorMessage($manifest)]);
            }

            $order = $api->request('GET', 'order', ['hash' => $hash], null, $lang);
            $orderJson = ($order['code'] < 300 && is_array($order['json'])) ? $order['json'] : [];
            // The carrier lives under shipment.carrier.name — GET /order has no flat `carrier` key
            $carrier = isset($orderJson['shipment']['carrier']) && is_array($orderJson['shipment']['carrier'])
                ? $orderJson['shipment']['carrier'] : [];

            return $this->tradeDocumentJson([
                'ok' => true,
                'manifest' => $this->normalizeTradeDocumentManifest($manifest['code'] < 300 ? $manifest['json'] : null),
                'gkStatus' => isset($orderJson['status']) ? (string) $orderJson['status'] : null,
                'gkNumber' => isset($orderJson['number']) ? (string) $orderJson['number'] : null,
                'carrierName' => isset($carrier['name']) ? (string) $carrier['name'] : null,
            ]);
        } catch (Throwable $e) {
            return $this->tradeDocumentFatal('tradeDocuments', $e);
        }
    }

    /**
     * Uploads one PDF as a trade document of the shipment. The file arrives base64
     * encoded in a regular POST field ("content"), not as a multipart file: that way
     * only post_max_size (8 MB by default, enough for 5 MB base64-encoded) applies,
     * not upload_max_filesize, which is just 2 MB by default on many hostings.
     * example URL (POST): index.php?controller=AdminGlobkurierHistory&ajax=1&action=tradeDocumentUpload
     */
    public function displayAjaxTradeDocumentUpload()
    {
        try {
            // An over-limit body arrives empty (PHP drops it) - report that as too large
            if (!Tools::getIsset('hash') && isset($_SERVER['CONTENT_LENGTH']) && (int) $_SERVER['CONTENT_LENGTH'] > 0) {
                return $this->tradeDocumentJson(['ok' => false, 'error' => 'file_too_large']);
            }

            $hash = $this->getOwnedTradeDocumentHash();
            if ($hash === null) {
                return $this->tradeDocumentJson(['ok' => false, 'error' => 'not_found']);
            }

            $type = trim((string) Tools::getValue('type', ''));
            $description = Tools::substr(trim((string) Tools::getValue('description', '')), 0, 256);
            if ($type === '' || $description === '') {
                return $this->tradeDocumentJson(['ok' => false, 'error' => 'missing_fields']);
            }

            $content = preg_replace('/^data:[^,]*,/', '', (string) Tools::getValue('content', ''));
            $bytes = base64_decode($content, true);
            if ($bytes === false || strpos($bytes, '%PDF-') !== 0) {
                return $this->tradeDocumentJson(['ok' => false, 'error' => 'invalid_pdf']);
            }
            if (strlen($bytes) > self::TRADE_DOCUMENT_MAX_BYTES) {
                return $this->tradeDocumentJson(['ok' => false, 'error' => 'file_too_large']);
            }

            $name = $this->sanitizeTradeDocumentName((string) Tools::getValue('name', ''));
            $api = $this->createTradeDocumentApi();
            $r = $api->uploadTradeDocument($hash, base64_encode($bytes), $name, $description, $type, $this->getTradeDocumentLang());
            if ($r['code'] >= 300) {
                return $this->tradeDocumentJson(['ok' => false, 'error' => $this->gkErrorMessage($r), 'gkCode' => $r['code']]);
            }

            return $this->tradeDocumentJson(['ok' => true, 'name' => $name, 'gkCode' => $r['code']]);
        } catch (Throwable $e) {
            return $this->tradeDocumentFatal('tradeDocumentUpload', $e);
        }
    }

    /**
     * Deletes one not-yet-synced trade document.
     * GK answers 204 — this always answers 200 with the real GK code in the body,
     * since a 204 response would silently drop the JSON body.
     */
    public function displayAjaxTradeDocumentDelete()
    {
        try {
            $hash = $this->getOwnedTradeDocumentHash();
            $name = (string) Tools::getValue('name', '');
            if ($hash === null || $name === '') {
                return $this->tradeDocumentJson(['ok' => false, 'error' => 'not_found']);
            }

            $api = $this->createTradeDocumentApi();
            $r = $api->deleteTradeDocument($hash, $name, $this->getTradeDocumentLang());
            if ($r['code'] >= 300) {
                return $this->tradeDocumentJson(['ok' => false, 'error' => $this->gkErrorMessage($r), 'gkCode' => $r['code']]);
            }

            return $this->tradeDocumentJson(['ok' => true, 'gkCode' => $r['code']]);
        } catch (Throwable $e) {
            return $this->tradeDocumentFatal('tradeDocumentDelete', $e);
        }
    }

    /**
     * Streams one trade document as a PDF download (JSON on error).
     */
    public function displayAjaxTradeDocumentDownload()
    {
        try {
            $hash = $this->getOwnedTradeDocumentHash();
            $name = (string) Tools::getValue('name', '');
            if ($hash === null || $name === '') {
                return $this->tradeDocumentJson(['ok' => false, 'error' => 'not_found']);
            }

            $api = $this->createTradeDocumentApi();
            $r = $api->downloadTradeDocument($hash, $name, $this->getTradeDocumentLang());
            if ($r['code'] >= 300) {
                return $this->tradeDocumentJson(['ok' => false, 'error' => $this->gkErrorMessage($r), 'gkCode' => $r['code']]);
            }

            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="' . $this->sanitizeTradeDocumentName($name) . '"');
            header('Content-Length: ' . strlen($r['body']));
            echo $r['body'];

            return true;
        } catch (Throwable $e) {
            return $this->tradeDocumentFatal('tradeDocumentDownload', $e);
        }
    }

    /**
     * Sends the shipment's unsynced trade documents to the carrier.
     */
    public function displayAjaxTradeDocumentSync()
    {
        try {
            $hash = $this->getOwnedTradeDocumentHash();
            if ($hash === null) {
                return $this->tradeDocumentJson(['ok' => false, 'error' => 'not_found']);
            }

            $api = $this->createTradeDocumentApi();
            $r = $api->syncTradeDocuments($hash, $this->getTradeDocumentLang());
            if ($r['code'] >= 300) {
                return $this->tradeDocumentJson(['ok' => false, 'error' => $this->gkErrorMessage($r), 'gkCode' => $r['code']]);
            }

            $documents = (is_array($r['json']) && isset($r['json']['documents']) && is_array($r['json']['documents']))
                ? $r['json']['documents'] : [];
            $failed = [];
            foreach ($documents as $doc) {
                if (!is_array($doc) || !isset($doc['status']) || $doc['status'] !== 'SUCCESS') {
                    $docName = is_array($doc) && isset($doc['name']) ? $doc['name'] : '?';
                    $docMessage = is_array($doc) && !empty($doc['message']) ? $doc['message']
                        : (is_array($doc) && isset($doc['status']) ? $doc['status'] : 'ERROR');
                    $failed[] = $docName . ': ' . $docMessage;
                }
            }

            return $this->tradeDocumentJson([
                'ok' => empty($failed),
                'documents' => $documents,
                'error' => $failed ? implode(' ', $failed) : null,
            ]);
        } catch (Throwable $e) {
            return $this->tradeDocumentFatal('tradeDocumentSync', $e);
        }
    }

    /**
     * Returns the requested hash only when it belongs to a shipment placed from this shop.
     *
     * @return string|null
     */
    private function getOwnedTradeDocumentHash()
    {
        $hash = (string) Tools::getValue('hash', '');
        if ($hash === '' || !preg_match('/^[A-Za-z0-9]+$/', $hash)) {
            return null;
        }
        $om = new Globkuriermodule\Order\OrderManager();

        return $om->getByHash($hash) ? $hash : null;
    }

    private function createTradeDocumentApi()
    {
        $c = new Globkuriermodule\Common\Config();
        $gkApiEnv = isset($c->gkApiEnv) ? (int) $c->gkApiEnv : 1;

        return new Globkuriermodule\Common\GlobkurierApi($c->login, $c->password, $c->apiKey, $gkApiEnv);
    }

    private function getTradeDocumentLang()
    {
        $lang = new Language((int) $this->context->cookie->id_lang);

        return $lang->iso_code === 'pl' ? 'pl' : 'en';
    }

    /**
     * Normalizes the raw GK manifest. `documentList` is `[]` when empty and an
     * object keyed by file name otherwise.
     *
     * @param mixed $raw
     *
     * @return array
     */
    private function normalizeTradeDocumentManifest($raw)
    {
        $raw = is_array($raw) ? $raw : [];
        $typeList = isset($raw['typeList']) && is_array($raw['typeList']) ? array_values($raw['typeList']) : [];
        $groups = [];
        if (isset($raw['typeRequiredGroups']) && is_array($raw['typeRequiredGroups'])) {
            foreach ($raw['typeRequiredGroups'] as $group) {
                if (is_array($group)) {
                    $groups[] = array_values($group);
                }
            }
        }
        $documents = [];
        if (isset($raw['documentList']) && is_array($raw['documentList'])) {
            foreach ($raw['documentList'] as $filename => $doc) {
                if (!is_array($doc)) {
                    continue;
                }
                $documents[] = [
                    'filename' => (string) $filename,
                    'name' => isset($doc['name']) ? (string) $doc['name'] : (string) $filename,
                    'description' => isset($doc['description']) ? (string) $doc['description'] : '',
                    'type' => isset($doc['type']) ? (string) $doc['type'] : '',
                    'uploadDate' => isset($doc['uploadDate']) ? $doc['uploadDate'] : null,
                    'isSendToCarrier' => !empty($doc['isSendToCarrier']),
                ];
            }
        }

        return ['typeList' => $typeList, 'typeRequiredGroups' => $groups, 'documents' => $documents];
    }

    /**
     * GK accepts names matching ^[A-Za-z0-9_.\-() ]+$, max 128 chars, ending in .pdf.
     * The same name overwrites an existing (unsynced) document, so keep it stable.
     */
    private function sanitizeTradeDocumentName($fileName)
    {
        $base = preg_replace('/\.pdf$/i', '', (string) $fileName);
        $base = strtr($base, [
            'ą' => 'a', 'ć' => 'c', 'ę' => 'e', 'ł' => 'l', 'ń' => 'n', 'ó' => 'o', 'ś' => 's', 'ź' => 'z', 'ż' => 'z',
            'Ą' => 'A', 'Ć' => 'C', 'Ę' => 'E', 'Ł' => 'L', 'Ń' => 'N', 'Ó' => 'O', 'Ś' => 'S', 'Ź' => 'Z', 'Ż' => 'Z',
        ]);
        $base = trim(preg_replace('/[^A-Za-z0-9_.\-() ]+/', '_', $base));
        if ($base === '') {
            $base = 'document';
        }

        return Tools::substr($base, 0, 124) . '.pdf';
    }

    /**
     * Flattens GK `{fields: {...}}` / `{message}` error bodies into one readable message.
     */
    private function gkErrorMessage(array $response)
    {
        $json = $response['json'];
        if (is_array($json)) {
            if (isset($json['fields']) && is_array($json['fields'])) {
                $messages = [];
                array_walk_recursive($json['fields'], function ($message) use (&$messages) {
                    if (is_string($message) && $message !== '') {
                        $messages[] = $message;
                    }
                });
                if ($messages) {
                    return implode(' ', $messages);
                }
            }
            if (!empty($json['message']) && is_string($json['message'])) {
                return $json['message'];
            }
        }
        $body = trim(strip_tags((string) $response['body']));
        if ($body !== '' && $body !== '[]') {
            return Tools::substr($body, 0, 200);
        }

        return 'HTTP ' . (int) $response['code'];
    }

    private function tradeDocumentJson(array $data)
    {
        header('Content-Type: application/json');
        echo json_encode($data);

        return true;
    }

    private function tradeDocumentFatal($action, Throwable $e)
    {
        Globkuriermodule\Common\Logger::error($action . ' fatal: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
        $data = ['ok' => false, 'error' => $e->getMessage()];
        if (defined('_PS_MODE_DEV_') && _PS_MODE_DEV_) {
            $data['file'] = $e->getFile();
            $data['line'] = $e->getLine();
        }

        return $this->tradeDocumentJson($data);
    }

    /**
     * Method for returning the waybill link
     * example URL: index.php?controller=AdminGlobkurierPlaceOrder&ajax=1&action=getWaybill&gknumber=xc123123
     *
     * @return bool the returned value is not significant
     */
    public function displayAjaxGetWaybill()
    {
        /** @var string shipment number for which we want to download the waybill */
        $number = Tools::getValue('gknumber', null);
        $resData = [];

        try {
            $c = new Globkuriermodule\Common\Config();
            $gkApiEnv = isset($c->gkApiEnv) ? (int) $c->gkApiEnv : 1;
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
