<?php
/**
 * 2007-2026 PrestaShop
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
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
 *  @author    PrestaShop SA <contact@prestashop.com>
 * @copyright 2007-2026 PrestaShop SA
 *  @license   http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 *  International Registered Trademark & Property of PrestaShop SA
 */
if (!defined('_PS_VERSION_')) {
    exit;
}
class GlobkuriermodulegetAdditionalInfoModuleFrontController extends ModuleFrontController
{
    public function init()
    {
        parent::init();
        $request = [];

        $id_cart = (int) $this->context->cart->id;
        if ($id_cart > 0) {
            $request['id_cart'] = $id_cart;
            $gk_terminal = Db::getInstance()->getRow('SELECT * FROM `' . _DB_PREFIX_ . 'gk_terminal_pickup` WHERE `cart_id` = ' . (int) $id_cart);
            if (!empty($gk_terminal)) {
                $request['punkt'] = $gk_terminal['code'];
                $request['type'] = $gk_terminal['type'];
            } else {
                $request['error'] = 'Punkt nie istnieje';
            }
        } else {
            $request['error'] = 'Koszyk nie istnieje';
        }
        echo json_encode($request);
        exit;
    }
}
