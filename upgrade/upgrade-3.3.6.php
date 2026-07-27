<?php
/**
 * Copyright since 2007 PrestaShop SA and Contributors
 * PrestaShop is an International Registered Trademark & Property of PrestaShop SA
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License version 3.0
 * that is bundled with this package in the file LICENSE.md.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/AFL-3.0
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@prestashop.com so we can send you a copy immediately.
 *
 * @author    PrestaShop SA and Contributors <contact@prestashop.com>
 * @copyright Since 2007 PrestaShop SA and Contributors
 * @license   https://opensource.org/licenses/AFL-3.0 Academic Free License version 3.0
 */
if (!defined('_PS_VERSION_')) {
    exit;
}

function upgrade_module_3_3_6($module)
{
    $db = Db::getInstance();
    $table = _DB_PREFIX_ . 'gk_orders';

    $columns = $db->executeS('SHOW COLUMNS FROM `' . $table . '` LIKE "tracking_number"');
    if (empty($columns)) {
        $db->execute('ALTER TABLE `' . $table . '` ADD `tracking_number` varchar(255) NULL');
    }

    // displayAfterCarrier renders pickup widgets for all PS versions (1.7 / 8 / 9).
    // displayCarrierExtraContent kept for DB compatibility (hook implementation returns '').
    return (bool) $module->registerHook('actionAdminOrdersTrackingNumberUpdate')
        && (bool) $module->registerHook('displayAfterCarrier')
        && (bool) $module->registerHook('displayCarrierExtraContent');
}
