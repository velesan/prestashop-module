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
 * Upgrade script 3.3.5 → 3.3.6
 *
 * Changes:
 *  1. Add `tracking_number` column to gk_orders (if missing)
 *  2. Create globkurier_template table (idempotent)
 *  3. Migrate existing config settings into a default template (one-time, if table empty)
 */
function upgrade_module_3_3_6($module)
{
    $db = Db::getInstance();
    $prefix = _DB_PREFIX_;

    /* ── 1. Add tracking_number to gk_orders if the table exists ── */
    $tableExists = $db->executeS(
        'SHOW TABLES LIKE \'' . pSQL($prefix . 'gk_orders') . '\''
    );
    if ($tableExists) {
        $colExists = $db->executeS(
            'SHOW COLUMNS FROM `' . $prefix . 'gk_orders` LIKE \'tracking_number\''
        );
        if (empty($colExists)) {
            if (!$db->execute(
                'ALTER TABLE `' . $prefix . 'gk_orders`
                 ADD COLUMN `tracking_number` VARCHAR(255) DEFAULT NULL AFTER `payment`'
            )) {
                return false;
            }
        }
    }

    /* ── 2. Create globkurier_template (idempotent) ── */
    if (!$db->execute('
        CREATE TABLE IF NOT EXISTS `' . $prefix . 'globkurier_template` (
            `id_template`    INT UNSIGNED    NOT NULL AUTO_INCREMENT,
            `gk_template_id` INT             DEFAULT NULL
                COMMENT "ID szablonu w GlobKurier API",
            `name`           VARCHAR(255)    NOT NULL,
            `package_list`   VARCHAR(50)     NOT NULL DEFAULT "PARCEL"
                COMMENT "PARCEL | DOX | PALLET",
            `length`         DECIMAL(8,2)    DEFAULT NULL,
            `width`          DECIMAL(8,2)    DEFAULT NULL,
            `height`         DECIMAL(8,2)    DEFAULT NULL,
            `weight`         DECIMAL(8,2)    DEFAULT NULL,
            `quantity`       INT             NOT NULL DEFAULT 1,
            `contents`       VARCHAR(255)    DEFAULT NULL,
            `gk_product_id`  INT             DEFAULT NULL
                COMMENT "ID usługi/produktu GlobKurier",
            `gk_addons`      TEXT            DEFAULT NULL
                COMMENT "JSON: wybrane dodatki",
            `payment_type`   INT             DEFAULT NULL
                COMMENT "null = używa globalnego domyślnego",
            `is_default`     TINYINT(1)      NOT NULL DEFAULT 0,
            `ps_carrier_id`  INT             DEFAULT NULL
                COMMENT "id_carrier z PrestaShop (auto-dopasowanie)",
            `gk_sync_at`     DATETIME        DEFAULT NULL
                COMMENT "ostatnia synchronizacja z GK API",
            `date_add`       DATETIME        NOT NULL,
            `date_upd`       DATETIME        NOT NULL,
            PRIMARY KEY (`id_template`),
            KEY `idx_ps_carrier`  (`ps_carrier_id`),
            KEY `idx_gk_template` (`gk_template_id`),
            KEY `idx_default`     (`is_default`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ')) {
        return false;
    }

    /* ── 3. One-time migration: config → default template ── */
    $count = (int) $db->getValue(
        'SELECT COUNT(*) FROM `' . $prefix . 'globkurier_template`'
    );
    if ($count === 0) {
        try {
            $config = new Globkuriermodule\Common\Config();
            if ($config->defaultWeight || $config->defaultServiceCode || $config->defaultContent) {
                $manager = new Globkuriermodule\Template\TemplateManager();
                $manager->createFromConfig($config);
            }
        } catch (\Exception $e) {
            // Migration is optional — do not abort the upgrade on failure
        }
    }

    // Register hooks first - registerHook() writes to ps_hook_module.
    // displayAfterCarrier renders pickup widgets for all PS versions (1.7 / 8 / 9).
    // displayCarrierExtraContent kept for DB compatibility (hook implementation returns '').
    $hooksRegistered = (bool) $module->registerHook('actionAdminOrdersTrackingNumberUpdate')
        && (bool) $module->registerHook('displayAfterCarrier')
        && (bool) $module->registerHook('displayCarrierExtraContent');

    // Clear cache LAST, after all DB writes above, so nothing in between
    // can repopulate a stale value.
    //
    // From PS 1.7.7+, back office pages are increasingly rendered via
    // Symfony, so a full Tools::clearAllCache() (Smarty + XML + Symfony/Sf2
    // + media cache) is needed. Below that, the legacy Smarty-only cache
    // (Tools::clearSmartyCache()) is enough and cheaper.
    if (Tools::version_compare(_PS_VERSION_, '1.7.7.0', '>=')) {
        Tools::clearAllCache();
    } else {
        Tools::clearSmartyCache();
    }

    // IMPORTANT: none of the calls above clear PrestaShop's own key/value
    // Cache layer (classes/Cache.php - file/APCu/Redis depending on
    // Performance settings). Hook::getHookModuleList() caches the full
    // hook<->module association list under the key 'hook_module_list' and
    // reads it straight from Cache::retrieve() if present, so a freshly
    // registerHook()'d hook (e.g. displayAfterCarrier for the paczkomat
    // widget) can stay invisible on the front office until this is cleared
    // - even though the row already exists in ps_hook_module. This is why
    // a manual "Clear cache" in the BO fixes it but the calls above alone
    // don't.
    Cache::clean('*');

    // CCC (Combine, Compress and Cache) cache - combined/minified CSS & JS
    // files stored under themes/<theme>/cache/. Not touched by the calls
    // above, so cleared explicitly here.
    Media::clearCache();

    // Invalidate OPcache for the module entry point so the server loads
    // the updated PHP file immediately instead of serving stale bytecode.
    if (function_exists('opcache_invalidate')) {
        opcache_invalidate(dirname(__FILE__, 2) . '/globkuriermodule.php', true);
    }

    return $hooksRegistered;
}
