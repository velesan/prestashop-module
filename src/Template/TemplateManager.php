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

class TemplateManager
{
    const TABLE = 'globkurier_template';

    /** @return TemplateModel[] */
    public function getAll()
    {
        $rows = \Db::getInstance()->executeS(
            'SELECT * FROM `' . _DB_PREFIX_ . self::TABLE . '`
             ORDER BY `is_default` DESC, `date_add` ASC'
        );
        if (!is_array($rows)) {
            return [];
        }
        $result = [];
        foreach ($rows as $row) {
            $result[] = TemplateModel::fromRow($row);
        }
        return $result;
    }

    /** @return TemplateModel|null */
    public function getById($id)
    {
        $row = \Db::getInstance()->getRow(
            'SELECT * FROM `' . _DB_PREFIX_ . self::TABLE . '`
             WHERE `id_template` = ' . (int)$id
        );
        return $row ? TemplateModel::fromRow($row) : null;
    }

    /** @return TemplateModel|null */
    public function getDefault()
    {
        $row = \Db::getInstance()->getRow(
            'SELECT * FROM `' . _DB_PREFIX_ . self::TABLE . '`
             WHERE `is_default` = 1
             LIMIT 1'
        );
        return $row ? TemplateModel::fromRow($row) : null;
    }

    /**
     * Znajduje szablon powiązany z danym id_carrier z PrestaShop.
     * Jeśli nie znajdzie, zwraca null (wywołujący powinien sięgnąć po getDefault()).
     *
     * @param int $carrierId
     * @return TemplateModel|null
     */
    public function getByCarrierId($carrierId)
    {
        if (!$carrierId) {
            return null;
        }
        $row = \Db::getInstance()->getRow(
            'SELECT * FROM `' . _DB_PREFIX_ . self::TABLE . '`
             WHERE `ps_carrier_id` = ' . (int)$carrierId . '
             LIMIT 1'
        );
        return $row ? TemplateModel::fromRow($row) : null;
    }

    /**
     * Zapisuje nowy szablon. Ustawia id_template po zapisie.
     *
     * @param TemplateModel $t
     * @return bool
     */
    public function create(TemplateModel $t)
    {
        $now = date('Y-m-d H:i:s');
        $ok = \Db::getInstance()->insert(self::TABLE, $this->toDbRow($t, $now, $now));
        if ($ok) {
            $t->idTemplate = (int)\Db::getInstance()->Insert_ID();
            if ($t->isDefault) {
                $this->clearOtherDefaults($t->idTemplate);
            }
        }
        return (bool)$ok;
    }

    /**
     * Aktualizuje istniejący szablon.
     *
     * @param TemplateModel $t
     * @return bool
     */
    public function update(TemplateModel $t)
    {
        if (!$t->idTemplate) {
            return false;
        }
        $now = date('Y-m-d H:i:s');
        $ok = \Db::getInstance()->update(
            self::TABLE,
            $this->toDbRow($t, null, $now),
            '`id_template` = ' . (int)$t->idTemplate
        );
        if ($ok && $t->isDefault) {
            $this->clearOtherDefaults($t->idTemplate);
        }
        return (bool)$ok;
    }

    /**
     * Usuwa szablon po ID.
     *
     * @param int $id
     * @return bool
     */
    public function delete($id)
    {
        return (bool)\Db::getInstance()->delete(
            self::TABLE,
            '`id_template` = ' . (int)$id
        );
    }

    /**
     * Ustawia dany szablon jako domyślny (zdejmuje flagę z pozostałych).
     *
     * @param int $id
     * @return bool
     */
    public function setDefault($id)
    {
        $db = \Db::getInstance();
        $db->execute(
            'UPDATE `' . _DB_PREFIX_ . self::TABLE . '` SET `is_default` = 0'
        );
        return (bool)$db->execute(
            'UPDATE `' . _DB_PREFIX_ . self::TABLE . '`
             SET `is_default` = 1, `date_upd` = \'' . pSQL(date('Y-m-d H:i:s')) . '\'
             WHERE `id_template` = ' . (int)$id
        );
    }

    /**
     * Tworzy domyślny szablon migracyjny z obecnej konfiguracji modułu.
     * Wywoływane raz podczas upgradu, gdy tabela jest pusta.
     *
     * @param \Globkuriermodule\Common\Config $config
     * @return bool
     */
    public function createFromConfig($config)
    {
        $t = new TemplateModel();
        $t->name        = 'Domyślna przesyłka';
        $t->packageList = 'PARCEL';
        $t->length      = $config->defaultDepth  ? (float)$config->defaultDepth  : null;
        $t->width       = $config->defaultWidth  ? (float)$config->defaultWidth  : null;
        $t->height      = $config->defaultHeight ? (float)$config->defaultHeight : null;
        $t->weight      = $config->defaultWeight ? (float)$config->defaultWeight : null;
        $t->quantity    = 1;
        $t->contents    = $config->defaultContent    ?: null;
        $t->gkProductId = $config->defaultServiceCode ? (int)$config->defaultServiceCode : null;
        $t->isDefault   = 1;

        $legacyMap = ['T' => 1, 'O' => 2, 'P' => 9, 'D' => 4, 'COD' => 6];
        $pt = $config->defaultPaymentType;
        if ($pt) {
            $t->paymentType = isset($legacyMap[$pt]) ? $legacyMap[$pt] : (int)$pt;
        }

        return $this->create($t);
    }

    /**
     * Synchronizuje listę szablonów z GlobKurier API.
     * Istniejące (po gk_template_id) są aktualizowane, nowe tworzone.
     *
     * @param array $apiTemplates  tablica z odpowiedzi GET /v1/order/productTemplate
     * @return array ['created' => int, 'updated' => int]
     */
    public function syncFromApi(array $apiTemplates)
    {
        $created = 0;
        $updated = 0;
        $now = date('Y-m-d H:i:s');

        foreach ($apiTemplates as $apiTmpl) {
            if (empty($apiTmpl['id'])) {
                continue;
            }
            $gkId = (int)$apiTmpl['id'];
            $existing = \Db::getInstance()->getRow(
                'SELECT * FROM `' . _DB_PREFIX_ . self::TABLE . '`
                 WHERE `gk_template_id` = ' . $gkId
            );

            $shipment = isset($apiTmpl['shipment']) && is_array($apiTmpl['shipment']) ? $apiTmpl['shipment'] : [];

            if ($existing) {
                \Db::getInstance()->update(
                    self::TABLE,
                    [
                        'name'           => pSQL(isset($apiTmpl['name']) ? $apiTmpl['name'] : ''),
                        'length'         => isset($shipment['length'])   ? (float)$shipment['length']   : null,
                        'width'          => isset($shipment['width'])    ? (float)$shipment['width']    : null,
                        'height'         => isset($shipment['height'])   ? (float)$shipment['height']   : null,
                        'weight'         => isset($shipment['weight'])   ? (float)$shipment['weight']   : null,
                        'quantity'       => isset($shipment['quantity']) ? (int)$shipment['quantity']   : 1,
                        'contents'       => pSQL(isset($apiTmpl['content']) ? $apiTmpl['content'] : ''),
                        'gk_product_id'  => isset($shipment['productId']) ? (int)$shipment['productId'] : null,
                        'gk_sync_at'     => pSQL($now),
                        'date_upd'       => pSQL($now),
                    ],
                    '`id_template` = ' . (int)$existing['id_template']
                );
                $updated++;
            } else {
                $t = new TemplateModel();
                $t->gkTemplateId = $gkId;
                $t->name         = isset($apiTmpl['name']) ? (string)$apiTmpl['name'] : ('GK #' . $gkId);
                $t->length       = isset($shipment['length'])    ? (float)$shipment['length']   : null;
                $t->width        = isset($shipment['width'])     ? (float)$shipment['width']    : null;
                $t->height       = isset($shipment['height'])    ? (float)$shipment['height']   : null;
                $t->weight       = isset($shipment['weight'])    ? (float)$shipment['weight']   : null;
                $t->quantity     = isset($shipment['quantity'])  ? (int)$shipment['quantity']   : 1;
                $t->contents     = isset($apiTmpl['content'])   ? (string)$apiTmpl['content']  : null;
                $t->gkProductId  = isset($shipment['productId'])? (int)$shipment['productId']  : null;
                $t->gkSyncAt     = $now;
                $this->create($t);
                $created++;
            }
        }

        return ['created' => $created, 'updated' => $updated];
    }

    // ── private helpers ──────────────────────────────────────────────────────

    private function toDbRow(TemplateModel $t, $dateAdd, $dateUpd)
    {
        $row = [
            'gk_template_id' => $t->gkTemplateId !== null ? (int)$t->gkTemplateId : null,
            'name'           => pSQL($t->name),
            'package_list'   => pSQL($t->packageList),
            'length'         => $t->length  !== null ? (float)$t->length  : null,
            'width'          => $t->width   !== null ? (float)$t->width   : null,
            'height'         => $t->height  !== null ? (float)$t->height  : null,
            'weight'         => $t->weight  !== null ? (float)$t->weight  : null,
            'quantity'       => (int)$t->quantity,
            'contents'       => $t->contents  !== null ? pSQL($t->contents)  : null,
            'gk_product_id'  => $t->gkProductId  !== null ? (int)$t->gkProductId  : null,
            'gk_addons'      => $t->gkAddons !== null ? pSQL($t->gkAddons) : null,
            'payment_type'   => $t->paymentType  !== null ? (int)$t->paymentType  : null,
            'is_default'     => (int)$t->isDefault,
            'ps_carrier_id'  => $t->psCarrierId !== null ? (int)$t->psCarrierId : null,
            'gk_sync_at'     => $t->gkSyncAt ? pSQL($t->gkSyncAt) : null,
            'date_upd'       => pSQL($dateUpd),
        ];
        if ($dateAdd !== null) {
            $row['date_add'] = pSQL($dateAdd);
        }
        return $row;
    }

    private function clearOtherDefaults($keepId)
    {
        \Db::getInstance()->execute(
            'UPDATE `' . _DB_PREFIX_ . self::TABLE . '`
             SET `is_default` = 0
             WHERE `id_template` != ' . (int)$keepId
        );
    }
}
