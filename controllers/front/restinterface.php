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
class GlobkuriermoduleRestinterfaceModuleFrontController extends ModuleFrontController
{
    /* @var bool authentication token */
    private $tokenAuth = false;

    /* @var integer cart number obtained during authentication */
    private $id_cart;

    /* @var string path to the module folder */
    public $path;

    /* @var bool override */
    public $ssl = true;

    private $pathForCachedPoints;

    // @Override
    public function init()
    {
        $this->page_name = 'restinterface';
        $this->path = _MODULE_DIR_ . $this->module->name;
        parent::init();

        $this->authorize();
        $this->pathForCachedPoints = _PS_MODULE_DIR_ . $this->module->name;
    }

    // @Override
    public function postProcess()
    {
        parent::postProcess();
        if ($this->tokenAuth !== true) {
            http_response_code(403);
            exit;
        }
        if (!$method = Tools::getValue('action')) {
            http_response_code(400);
            exit;
        }
        $method = 'displayAjax' . Tools::ucfirst($method);
        if (!method_exists($this, $method)) {
            http_response_code(404);
            exit;
        }
    }

    /**
     * Saves the InPost pickup point
     *
     * @return bool not significant
     */
    public function displayAjaxSaveInPostPoint()
    {
        $responseData = ['success' => true,
            'message' => '',
        ];

        $point = Tools::getValue('point');
        if (!$point) {
            $responseData = ['success' => false,
                'message' => 'Nie podano punktu odbioru',
            ];
        } else {
            $terminalPickup = new Globkuriermodule\TerminalPickup\TerminalPickupManager();
            $terminalPickup->setInpostPickup($this->id_cart, $point);
        }

        header('Content-Type: application/json');
        echo json_encode($responseData);

        return true;
    }

    /**
     * Saves the Paczka w Ruchu pickup point
     *
     * @return bool not significant
     */
    public function displayAjaxSavePaczkaRuchPoint()
    {
        $responseData = ['success' => true,
            'message' => '',
        ];

        $point = Tools::getValue('point');
        if (!$point) {
            $responseData = ['success' => false,
                'message' => 'Nie podano punktu odbioru',
            ];
        } else {
            $terminalPickup = new Globkuriermodule\TerminalPickup\TerminalPickupManager();
            $terminalPickup->setRuchPickup($this->id_cart, $point);
        }

        header('Content-Type: application/json');
        echo json_encode($responseData);

        return true;
    }

    /**
     * Saves the Pocztex 48 OWP pickup point
     *
     * @return bool not significant
     */
    public function displayAjaxSavePocztex48owpPoint()
    {
        $responseData = ['success' => true, 'message' => ''];
        $point = Tools::getValue('point');
        if (!$point) {
            $responseData = ['success' => false,
                'message' => 'Nie podano punktu odbioru',
            ];
        } else {
            $terminalPickup = new Globkuriermodule\TerminalPickup\TerminalPickupManager();
            $terminalPickup->setPocztex48owpPickup($this->id_cart, $point);
        }
        header('Content-Type: application/json');
        echo json_encode($responseData);

        return true;
    }

    /**
     * Saves the DHL Parcel pickup point
     *
     * @return bool not significant
     */
    public function displayAjaxSaveDhlParcelPoint()
    {
        $responseData = ['success' => true,
            'message' => '',
        ];
        $point = Tools::getValue('point');
        if (!$point) {
            $responseData = ['success' => false,
                'message' => 'Nie podano punktu odbioru',
            ];
        } else {
            $terminalPickup = new Globkuriermodule\TerminalPickup\TerminalPickupManager();
            $terminalPickup->setDhlParcelPickup($this->id_cart, $point);
        }
        header('Content-Type: application/json');
        echo json_encode($responseData);

        return true;
    }

    /**
     * Saves the DPD Pickup pickup point
     *
     * @return bool not significant
     */
    public function displayAjaxSaveDpdPickupPoint()
    {
        $responseData = ['success' => true,
            'message' => '',
        ];
        $point = Tools::getValue('point');
        if (!$point) {
            $responseData = ['success' => false,
                'message' => 'Nie podano punktu odbioru',
            ];
        } else {
            $terminalPickup = new Globkuriermodule\TerminalPickup\TerminalPickupManager();
            $terminalPickup->setDpdPickupPickup($this->id_cart, $point);
        }
        header('Content-Type: application/json');
        echo json_encode($responseData);

        return true;
    }

    /**
     * Removes the entry for the selected InPost pickup point
     *
     * @deprecated use displayAjaxDeletePickupPoint instead
     */
    public function displayAjaxDeleteInPostPoint()
    {
        return $this->displayAjaxDeletePickupPoint();
    }

    /**
     * Removes the entry for the selected pickup point
     *
     * @return bool
     */
    public function displayAjaxDeletePickupPoint()
    {
        $responseData = ['success' => true,
            'message' => '',
        ];
        $terminalPickup = new Globkuriermodule\TerminalPickup\TerminalPickupManager();
        $terminalPickup->deletePickup($this->id_cart);
        header('Content-Type: application/json');
        echo json_encode($responseData);

        return true;
    }

    /**
     * @return bool
     */
    public function displayAjaxCachedTerminalPoints()
    {
        $rawCode = (string) Tools::getValue('serviceCode');
        $serviceCode = preg_match('/^[a-zA-Z0-9_-]{1,64}$/', $rawCode) ? $rawCode : '';
        if (empty($serviceCode)) {
            echo json_encode(['success' => false, 'message' => 'Invalid serviceCode', 'data' => []]);

            return true;
        }
        $fileContent = Tools::file_get_contents($this->pathForCachedPoints . '/' . $serviceCode . '.json');
        if ($fileContent == false) {
            $responseData = [
                'success' => false,
                'message' => 'Cannot find cached terminals from: ' . $this->pathForCachedPoints . '/' . $serviceCode . '.json',
                'data' => [],
            ];
        } else {
            $responseData = [
                'success' => true,
                'message' => '',
                'data' => json_decode($fileContent, true),
            ];
        }
        header('Content-Type: application/json');
        echo json_encode($responseData);

        return true;
    }

    /**
     * Returns the saved pickup point for the cart
     */
    public function displayAjaxGetPickupPoint()
    {
        $terminalPickup = new Globkuriermodule\TerminalPickup\TerminalPickupManager();
        $pickup = $terminalPickup->getByCartId($this->id_cart);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'pickup' => $pickup ? $pickup : null,
        ]);

        return true;
    }

    /**
     * Checks whether the correct token was given for this cart. Protects against
     * unauthorized modification of someone else's cart
     *
     * @return bool the value that was set on $this->tokenAuth
     */
    private function authorize()
    {
        $token = Tools::getValue('token');
        $id_cart = Tools::getValue('id_cart');
        if (!$token || !$id_cart) {
            $this->tokenAuth = false;

            return false;
        }
        if ($token == $this->encryptCartId($id_cart)) {
            $this->tokenAuth = true;
            $this->id_cart = $id_cart;
        } else {
            $this->tokenAuth = false;
        }

        return $this->tokenAuth;
    }

    /**
     * Encrypt cart ID for security token
     * Compatible with all PrestaShop versions
     *
     * @param int $cartId
     *
     * @return string
     */
    private function encryptCartId($cartId)
    {
        // Use hash with salt for security
        $salt = _COOKIE_KEY_ . 'globkuriermodule';

        return hash('sha256', $cartId . $salt);
    }
}
