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

function upgrade_module_3_3_0($module)
{
    $success = true;

    // 1. Update hooks - change from displayAdminOrder to displayAdminOrderMainBottom
    $success &= $module->unregisterHook('displayAdminOrder');
    $success &= $module->registerHook('displayAdminOrderMainBottom');

    $filesToRemove = [
        'views/js/angular.min.js',
        'views/js/configApp.261.js',
        'views/js/newParcelApp.261.js',
        'views/templates/partials/globAdditionalInformation_en.html',
        'views/templates/partials/globAdditionalInformation_pl.html',
        'views/templates/partials/globDiscountCodeAndSummary_en.html',
        'views/templates/partials/globDiscountCodeAndSummary_pl.html',
        'views/templates/partials/globServiceOptions_en.html',
        'views/templates/partials/globServiceOptions_pl.html',
        'views/templates/partials/globServices_en.html',
        'views/templates/partials/globServices_pl.html',
        'views/templates/partials/globTerminalPicker_en.html',
        'views/templates/partials/globTerminalPicker_pl.html',
    ];

    $success = true;
    $modulePath = dirname(__FILE__) . '/../';

    foreach ($filesToRemove as $file) {
        $filePath = $modulePath . $file;
        if (file_exists($filePath)) {
            if (!unlink($filePath)) {
                $success = false;
                error_log('Globkurier: Failed to remove file: ' . $file);
            }
        }
    }

    // Remove partials directory if empty
    $partialsDir = $modulePath . 'views/templates/partials/';
    if (is_dir($partialsDir)) {
        $files = array_diff(scandir($partialsDir), ['.', '..']);
        if (empty($files)) {
            rmdir($partialsDir);
        }
    }

    // Return combined success of hook registration and file removal
    return $success;
}
