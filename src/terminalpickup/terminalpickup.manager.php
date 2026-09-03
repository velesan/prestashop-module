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

namespace Globkuriermodule\TerminalPickup;

if (!defined('_PS_VERSION_')) {
    exit;
}
class TerminalPickupManager
{
    /**
     * Returns the data of the selected terminal by cart id
     *
     * @param int $id - the cart id
     *
     * @return array|false - array with terminal data, or false if not found
     */
    public function getByCartId($id)
    {
        $sql = 'SELECT * FROM ' . _DB_PREFIX_ . 'gk_terminal_pickup WHERE `cart_id` = ' . (int) $id;
        $row = \Db::getInstance()->getRow($sql);
        if (!$row) {
            return false;
        }

        return $row;
    }

    /**
     * Adds / updates a record with 'ruch' in the type column
     *
     * @param $cartId - the cart id
     * @param $code - the terminal code
     *
     * @return bool - true on successful creation/update
     */
    public function setRuchPickup($cartId, $code)
    {
        return (bool) $this->setPickup($cartId, 'ruch', $code);
    }

    /**
     * Adds / updates a record with 'pocztex48owp' in the type column
     *
     * @param $cartId - the cart id
     * @param $code - the terminal code
     *
     * @return bool - true on successful creation/update
     */
    public function setPocztex48owpPickup($cartId, $code)
    {
        return (bool) $this->setPickup($cartId, 'pocztex48owp', $code);
    }

    /**
     * Adds / updates a record with 'dhlparcel' in the type column
     *
     * @param $cartId - the cart id
     * @param $code - the terminal code
     *
     * @return bool - true on successful creation/update
     */
    public function setDhlParcelPickup($cartId, $code)
    {
        return (bool) $this->setPickup($cartId, 'dhlparcel', $code);
    }

    /**
     * Adds / updates a record with 'dpdpickup' in the type column
     *
     * @param $cartId - the cart id
     * @param $code - the terminal code
     *
     * @return bool - true on successful creation/update
     */
    public function setDpdPickupPickup($cartId, $code)
    {
        return (bool) $this->setPickup($cartId, 'dpdpickup', $code);
    }

    /**
     * Adds / updates a record with 'inpost' in the type column
     *
     * @param $cartId - the cart id
     * @param $code - the parcel locker code
     *
     * @return bool - true on successful creation/update
     */
    public function setInpostPickup($cartId, $code)
    {
        return (bool) $this->setPickup($cartId, 'inpost', $code);
    }

    /**
     * Adds / updates a record with 'globbox' in the type column
     *
     * @param $cartId - the cart id
     * @param $code - the globbox code
     *
     * @return bool - true on successful creation/update
     */
    public function setGlobboxPickup($cartId, $code)
    {
        return (bool) $this->setPickup($cartId, 'globbox', $code);
    }

    public function setPickup($cartId, $service, $code)
    {
        $pickup = $this->getByCartId($cartId);
        $data = [
            'type' => pSQL($service),
            'code' => pSQL($code),
        ];
        $r = false;
        if ($pickup != null) {
            $r = \Db::getInstance()->update('gk_terminal_pickup', $data, 'cart_id = ' . (int) $cartId);
        } else {
            $data['cart_id'] = (int) $cartId;
            $r = \Db::getInstance()->insert('gk_terminal_pickup', $data);
        }

        return $r ? true : false;
    }

    /**
     * Removes a record by cart id
     *
     * @param $cart_id - the cart id
     *
     * @return bool - true on successful deletion
     */
    public function deletePickup($cartId)
    {
        $sql = 'DELETE FROM ' . _DB_PREFIX_ . 'gk_terminal_pickup WHERE cart_id = ' . (int) $cartId;
        $results = \Db::getInstance()->execute($sql);
        if (!$results) {
            return false;
        }

        return true;
    }
}
