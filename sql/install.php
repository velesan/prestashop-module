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
$sql = [];

$sql[] = 'CREATE TABLE IF NOT EXISTS `' . _DB_PREFIX_ . 'gk_orders` (
   `gk_id` varchar(255) NOT NULL,
   `hash` varchar(255),
   `order_id` int(11),
   `crate_date` datetime NOT NULL,
   `receiver` varchar(255) NOT NULL,
   `content` varchar(255) NOT NULL,
   `weight` int(10) NOT NULL,
   `carrier` varchar(255) NOT NULL,
   `comments` varchar(255),
   `cod` float,
   `payment` varchar(255) NOT NULL,
   `tracking_number` varchar(255) NULL,
   PRIMARY KEY  (`gk_id`)
   ) ENGINE=' . _MYSQL_ENGINE_ . ' DEFAULT CHARSET=utf8';

$sql[] = 'CREATE TABLE IF NOT EXISTS `' . _DB_PREFIX_ . 'gk_log` (
   `id` int(11) NOT NULL AUTO_INCREMENT,
   `data` datetime NOT NULL,
   `type` varchar(64) NOT NULL,
   `content` text NOT NULL,
   PRIMARY KEY  (`id`)
   ) ENGINE=' . _MYSQL_ENGINE_ . ' DEFAULT CHARSET=utf8';

$sql[] = 'CREATE TABLE IF NOT EXISTS `' . _DB_PREFIX_ . 'gk_terminal_pickup` (
   `cart_id` int(11) NOT NULL,
   `type` varchar(32) NOT NULL,
   `code` varchar(32) NOT NULL,
   PRIMARY KEY  (`cart_id`)
   ) ENGINE=' . _MYSQL_ENGINE_ . ' DEFAULT CHARSET=utf8';

foreach ($sql as $query) {
    if (Db::getInstance()->execute($query) == false) {
        return false;
    }
}
