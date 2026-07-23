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
namespace Globkuriermodule\Common;
if (!defined('_PS_VERSION_')) {
    exit;
}
class Logger
{
    public static function error($content)
    {
        return self::log('error', $content);
    }

    public static function xmlRequest($content)
    {
        return self::log('xml_request', $content);
    }

    public static function serverResponse($content)
    {
        return self::log('server_response', $content);
    }

    public static function log($logType, $c)
    {
        $content = $c;

        $results = \Db::getInstance()->insert('gk_log', [
            'data' => date('Y-m-d H:i:s'),
            'type' => pSQL($logType),
            'content' => pSQL($content),
        ]);

        if (!$results) {
            return false;
        }
        return true;
    }

    public static function getLogs()
    {
        $logs = [];
        $sql = 'SELECT * FROM ' . _DB_PREFIX_ . 'gk_log';
        $logs = \Db::getInstance()->executeS($sql);

        foreach ($logs as $k => $log) {
            if (isset($log['content']) && $log['content']) {
                $logs[$k] = $log['content'];
            }
        }
        return $logs;
    }
}
