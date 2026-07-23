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
     * Zwraca dane wybranego terminalu po id koszyka
     *
     * @param int $id - id koszyka
     *
     * @return array|false - tablica z danymi terminalu lub false jeśli nie znaleziono
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
     * Dodaje / zmienia rekord z fraza 'ruch' w kolumnie type
     *
     * @param $cartId - id koszyka
     * @param $code - kod terminalu
     *
     * @return bool - true w przy pomyślnego utworzenia/zmiany
     */
    public function setRuchPickup($cartId, $code)
    {
        return (bool) $this->setPickup($cartId, 'ruch', $code);
    }

    /**
     * Dodaje / zmienia rekord z fraza 'pocztex48owp' w kolumnie type
     *
     * @param $cartId - id koszyka
     * @param $code - kod terminalu
     *
     * @return bool - true w przy pomyślnego utworzenia/zmiany
     */
    public function setPocztex48owpPickup($cartId, $code)
    {
        return (bool) $this->setPickup($cartId, 'pocztex48owp', $code);
    }

    /**
     * Dodaje / zmienia rekord z fraza 'dhlparcel' w kolumnie type
     *
     * @param $cartId - id koszyka
     * @param $code - kod terminalu
     *
     * @return bool - true w przy pomyślnego utworzenia/zmiany
     */
    public function setDhlParcelPickup($cartId, $code)
    {
        return (bool) $this->setPickup($cartId, 'dhlparcel', $code);
    }

    /**
     * Dodaje / zmienia rekord z fraza 'dpdpickup' w kolumnie type
     *
     * @param $cartId - id koszyka
     * @param $code - kod terminalu
     *
     * @return bool - true w przy pomyślnego utworzenia/zmiany
     */
    public function setDpdPickupPickup($cartId, $code)
    {
        return (bool) $this->setPickup($cartId, 'dpdpickup', $code);
    }

    /**
     * Dodaje / zmienia rekord z fraza 'inpost' w kolumnie type
     *
     * @param $cartId - id koszyka
     * @param $code - kod paczkomatu
     *
     * @return bool - true w przy pomyślnego utworzenia/zmiany
     */
    public function setInpostPickup($cartId, $code)
    {
        return (bool) $this->setPickup($cartId, 'inpost', $code);
    }

    /**
     * Dodaje / zmienia rekord z fraza 'globbox' w kolumnie type
     *
     * @param $cartId - id koszyka
     * @param $code - kod globbox
     *
     * @return bool - true w przy pomyślnego utworzenia/zmiany
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
     * Usuwa rekord po id koszyka
     *
     * @param $cart_id - id koszyka
     *
     * @return bool - true w przy pomyślnego usunięcia
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
