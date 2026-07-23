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
class GlobkuriermoduleGetLabelModuleFrontController extends ModuleFrontController
{
    public function init()
    {
        $this->page_name = 'getlabel';
        parent::init();

        $return = [];
        $hash = isset($_REQUEST['hash']) ? $_REQUEST['hash'] : '';
        $ajax = isset($_REQUEST['ajax']) ? (int) $_REQUEST['ajax'] : 0;
        if (!empty($hash)) {
            $c = new Globkuriermodule\Common\Config();
            $api = new Globkuriermodule\Common\GlobkurierApi($c->login, $c->password, $c->apiKey);
            $api->login();
            $token = $api->getToken();
            $request = $api->getLabel($token, $hash);
            if (strpos($request, 'orderHashes') !== false) {
                $req = json_decode($request, true);
                $fields = $req['fields'];
                $html = '';

                if (!empty($fields)) {
                    foreach ($fields as $field) {
                        $translatedText = $this->module->l(
                            'Package label file is not available for this shipment.',
                            'getLabel'
                        );
                        $html .= $translatedText . '<br />';
                    }
                }
                $return['errors'] = $html;
                $return['status'] = false;
                echo json_encode($return);
                exit;
            }
            if ($ajax) {
                $return['status'] = true;
                echo json_encode($return);
                exit;
            }
            $dir = __DIR__ . '/../../files/' . $hash . '.pdf';
            file_put_contents($dir, $request);
            $size = filesize($dir);
            header('Content-Type: application/pdf');
            header('Content-Length: ' . $size);
            header('Content-Disposition: attachment; filename="' . basename($hash . '.pdf') . '"');
            ob_end_flush();
            @readfile($dir);
            exit;
        }
    }
}
