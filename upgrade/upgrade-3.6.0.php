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

/**
 * Upgrade script 3.5.0 → 3.6.0
 *
 * Changes:
 *  1. Add nullable `has_customs` column to gk_orders (idempotent). Set when a
 *     shipment is placed; NULL for shipments placed before this version, which
 *     therefore don't offer the customs documents panel in the history.
 */
function upgrade_module_3_6_0($module)
{
    $db = Db::getInstance();
    $prefix = _DB_PREFIX_;

    $tableExists = $db->executeS(
        'SHOW TABLES LIKE \'' . pSQL($prefix . 'gk_orders') . '\''
    );
    if ($tableExists) {
        $colExists = $db->executeS(
            'SHOW COLUMNS FROM `' . $prefix . 'gk_orders` LIKE \'has_customs\''
        );
        if (empty($colExists)) {
            if (!$db->execute(
                'ALTER TABLE `' . $prefix . 'gk_orders`
                 ADD COLUMN `has_customs` TINYINT(1) NULL DEFAULT NULL AFTER `tracking_number`'
            )) {
                return false;
            }
        }
    }

    $module->clearAllCaches();

    return true;
}
