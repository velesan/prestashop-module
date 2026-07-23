<?php
/**
 * globkuriermodule Prestashop module
 *
 * NOTICE OF LICENSE
 *
 * This file is licenced under the Software License Agreement.
 * With the purchase or the installation of the software in your application
 * you accept the licence agreement.
 *
 * You must not modify, adapt or create derivative works of this source code
 *
 *  @author    Wiktor Koźmiński
 *  @copyright 2017-2023 Silver Rose Wiktor Koźmiński
 *  @license   LICENSE.txt
 */

namespace Globkuriermodule\Common;

if (!defined('_PS_VERSION_')) {
    exit;
}
/* Configuration class, stored all config in one DB record in JSON */
class Config
{
    public const CONFIG_COLUMN_NAME = 'wk_globkurier_config';

    /** Poniżej są dane kofiguracyjne, które można wykorzystać w formularzu */
    public $defaultSenderName;

    public $defaultSenderPersonName;

    public $defaultSenderStreet;

    public $defaultSenderHouseNumber;

    public $defaultSenderApartmentNumber;

    public $defaultSenderCity;

    public $defaultSenderPostCode;

    public $defaultCountryCode;

    public $defaultSenderEmail;

    public $defaultSenderPhoneNumber;

    public $defaultWeight;

    public $defaultWidth;

    public $defaultHeight;

    public $defaultDepth;

    public $defaultContent;

    public $defaultServiceCode;

    public $defaultServiceName;

    public $defaultPaymentType;

    public $defaultCodAccount;

    public $defaultCodAccountHolderName;

    public $defaultCodAccountHolderAddr1;

    public $defaultCodAccountHolderAddr2;

    public $inPostEnabled;

    public $inPostCarrier;

    public $inPostCODEnabled;

    public $inPostCODCarrier;

    public $defaultInPostPoint;

    public $paczkaRuchEnabled;

    public $paczkaRuchCarrier;

    public $pocztex48owpEnabled;

    public $pocztex48owpCarrier;

    public $dhlparcelEnabled;

    public $dhlparcelCarrier;

    public $dpdpickupEnabled;

    public $dpdpickupCarrier;

    public $globboxEnabled;

    public $login;

    public $password;

    public $apiKey;

    /** @deprecated No longer used - replaced with Leaflet maps */
    public $googleMapsApiKey;

    /** --- */
    public function __construct($initialLoad = true)
    {
        if ($initialLoad) {
            $this->load();
        }
    }

    /**
     * Purges (removes) current configuration from presta db
     *
     * @return void
     */
    public static function purge()
    {
        \Configuration::deleteByName(self::CONFIG_COLUMN_NAME);
    }

    /**
     * Saves current config into DB.
     *
     * @param $getPostValues - if set to true, get post values with config_ prefix
     *
     * @return bool
     */
    public function update($getPostValues = true)
    {
        if ($getPostValues) {
            $this->assignPostValues();
        }

        $json = json_encode($this);

        return (bool) \Configuration::updateValue(self::CONFIG_COLUMN_NAME, $json);
    }

    /**
     * Loads config from DB.
     *
     * @return bool false if values couldn't been loaded
     */
    public function load()
    {
        $json = \Configuration::get(self::CONFIG_COLUMN_NAME);
        if ($json === false) {
            return false;
        }

        $values = json_decode($json, true);

        if (is_array($values)) {
            foreach ($values as $key => $v) {
                if (property_exists($this, $key)) {
                    $this->$key = $v;
                }
            }
        }

        return true;
    }

    /**
     * Assign post values with prefix 'config_' to class vars.
     *
     * @return void
     */
    private function assignPostValues()
    {
        foreach (array_keys(get_object_vars($this)) as $key) {
            $v = \Tools::getValue('config_' . $key);
            if ($v !== false) {
                $this->$key = $v;
            }
        }
    }
}
