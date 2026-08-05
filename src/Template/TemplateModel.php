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
 *
 * @author    PrestaShop SA <contact@prestashop.com>
 * @copyright 2007-2026 PrestaShop SA
 * @license   https://opensource.org/licenses/AFL-3.0 Academic Free License 3.0 (AFL-3.0)
 */
namespace Globkuriermodule\Template;

if (!defined('_PS_VERSION_')) {
    exit;
}

class TemplateModel
{
    /** @var int|null */
    public $idTemplate;

    /** @var int|null ID szablonu po stronie GlobKurier API (do synchronizacji) */
    public $gkTemplateId;

    /** @var string */
    public $name = '';

    /** @var string PARCEL|DOX|PALLET */
    public $packageList = 'PARCEL';

    /** @var float|null */
    public $length;

    /** @var float|null */
    public $width;

    /** @var float|null */
    public $height;

    /** @var float|null */
    public $weight;

    /** @var int */
    public $quantity = 1;

    /** @var string|null */
    public $contents;

    /** @var string ISO 3166-1 alpha-2 sender country code */
    public $senderCountry = 'PL';

    /** @var string ISO 3166-1 alpha-2 recipient country code */
    public $recipientCountry = 'PL';

    /** @var int|null ID produktu/usługi GlobKurier */
    public $gkProductId;

    /** @var string|null JSON: wybrane dodatki */
    public $gkAddons;

    /** @var int|null ID metody płatności GK; null = użyj globalnego default */
    public $paymentType;

    /** @var int 1 = szablon domyślny */
    public $isDefault = 0;

    /** @var int|null id_carrier z PrestaShop — powiązanie szablonu z metodą dostawy */
    public $psCarrierId;

    /** @var string|null Data ostatniej synchronizacji z GK API */
    public $gkSyncAt;

    /** @var string */
    public $dateAdd = '';

    /** @var string */
    public $dateUpd = '';

    /**
     * Tworzy model z tablicy (np. wiersza z bazy danych).
     *
     * @param array $row
     * @return self
     */
    public static function fromRow(array $row)
    {
        $m = new self();
        $m->idTemplate   = isset($row['id_template'])    ? (int)$row['id_template']    : null;
        $m->gkTemplateId = isset($row['gk_template_id']) ? (int)$row['gk_template_id'] : null;
        $m->name         = isset($row['name'])           ? (string)$row['name']        : '';
        $m->packageList  = isset($row['package_list'])   ? (string)$row['package_list'] : 'PARCEL';
        $m->length       = isset($row['length'])         ? (float)$row['length']       : null;
        $m->width        = isset($row['width'])          ? (float)$row['width']        : null;
        $m->height       = isset($row['height'])         ? (float)$row['height']       : null;
        $m->weight       = isset($row['weight'])         ? (float)$row['weight']       : null;
        $m->quantity     = isset($row['quantity'])       ? (int)$row['quantity']       : 1;
        $m->contents       = isset($row['contents'])          ? (string)$row['contents']          : null;
        $m->senderCountry  = isset($row['sender_country'])    ? (string)$row['sender_country']    : 'PL';
        $m->recipientCountry = isset($row['recipient_country']) ? (string)$row['recipient_country'] : 'PL';
        $m->gkProductId    = isset($row['gk_product_id']) && $row['gk_product_id'] ? (int)$row['gk_product_id'] : null;
        $m->gkAddons     = isset($row['gk_addons'])     ? $row['gk_addons']           : null;
        $m->paymentType  = isset($row['payment_type'])  && $row['payment_type'] !== null ? (int)$row['payment_type'] : null;
        $m->isDefault    = isset($row['is_default'])    ? (int)$row['is_default']     : 0;
        $m->psCarrierId  = isset($row['ps_carrier_id']) && $row['ps_carrier_id'] ? (int)$row['ps_carrier_id'] : null;
        $m->gkSyncAt     = (isset($row['gk_sync_at']) && $row['gk_sync_at'] && $row['gk_sync_at'] !== '0000-00-00 00:00:00') ? $row['gk_sync_at'] : null;
        $m->dateAdd      = isset($row['date_add'])       ? $row['date_add']            : '';
        $m->dateUpd      = isset($row['date_upd'])       ? $row['date_upd']            : '';
        return $m;
    }

    /**
     * Konwertuje do tablicy do wyeksportowania do JS/JSON.
     *
     * @return array
     */
    public function toArray()
    {
        return [
            'id_template'    => $this->idTemplate,
            'gk_template_id' => $this->gkTemplateId,
            'name'           => $this->name,
            'package_list'   => $this->packageList,
            'length'         => $this->length,
            'width'          => $this->width,
            'height'         => $this->height,
            'weight'         => $this->weight,
            'quantity'       => $this->quantity,
            'contents'          => $this->contents,
            'sender_country'    => $this->senderCountry,
            'recipient_country' => $this->recipientCountry,
            'gk_product_id'     => $this->gkProductId,
            'gk_addons'      => $this->gkAddons,
            'payment_type'   => $this->paymentType,
            'is_default'     => $this->isDefault,
            'ps_carrier_id'  => $this->psCarrierId,
            'gk_sync_at'     => $this->gkSyncAt,
        ];
    }
}
