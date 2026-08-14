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
class GlobkurierApi
{
    const API_BASE_PROD = 'https://api.globkurier.pl/v1/';
    const API_BASE_TEST = 'https://test.api.globkurier.pl/v1/';

    private $baseApiUrl;

    /** @var string user login in globkurier.pl */
    private $login;

    /** @var string user password */
    private $password;

    /** @var string user api key */
    private $apiKey;

    /** @var int user id in globkurier.pl */
    private $clientId;

    /** @var string */
    private $token;

    /** @var string */
    private $pathForCachedPointsCalledFromAdmin;

    public function __construct($login = null, $password = null, $apiKey = null, $env = 1)
    {
        $this->login = $login;
        $this->password = $password;
        $this->apiKey = $apiKey;
        $this->baseApiUrl = ((int)$env === 0) ? self::API_BASE_TEST : self::API_BASE_PROD;
        $this->pathForCachedPointsCalledFromAdmin = _PS_MODULE_DIR_ . 'globkuriermodule/';
    }

    public function getBaseApiUrl()
    {
        return $this->baseApiUrl;
    }

    /**
     * Probuje zalogowac uzytkowanika i pobrac token autoryzacyjny
     *
     * @throws \Exception jest server odpowie z kodem > 299 lub nie udalo sie uzyskac tokena
     */
    public function login()
    {
        if (!$this->login || !$this->password) {
            throw new \Exception('Login and password must be set');
        }

        $url = $this->baseApiUrl . 'auth/login';
        $data = [
            'email' => $this->login,
            'password' => $this->password,
        ];

        $r = $this->sendJSONRequest($url, null, $data, 'POST');

        if (!isset($r['token'])) {
            throw new \Exception('Login failed');
        }

        $this->token = $r['token'];
        // Set clientId if available in response
        if (isset($r['clientId'])) {
            $this->clientId = $r['clientId'];
        }

        return $this;
    }

    /**
     * Checks if user is authorized by globkurier server.
     * Remeber to set login, password and apiKey first.
     * If user is authorized method will set $clientId var
     * Also receives token
     *
     * @return bool
     */
    public function isUserAuthorized()
    {
        try {
            $this->login();
        } catch (\Exception $e) {
            return false;
        }

        return true;
    }

    /**
     * Pobiera i zwraca link z ktorego mozna pobrac list przewozowy
     *
     * @param $gkNumber - numer przesylki dla ktorej ma zostac pobrany list
     *
     * @return string - adres url z ktorego mozna pobrac list
     */
    public function getWaybillUrl($gkNumber)
    {
        $url = $this->baseApiUrl . 'services/label/';
        $data = [
            'LOGIN' => $this->login,
            'PASSWORD' => $this->password,
            'APIKEY' => $this->apiKey,
            'GKNUMBER' => $gkNumber,
        ];
        $query = http_build_query($data);

        $r = $this->sendHttpRequest($url, $query);
        $r = json_decode($r, true);

        if ($r['status'] != true) {
            $errorMsg = $r['error'] ? $r['error'] : 'Nie udało się pobrać listu przewozowego';
            Logger::error('Błąd podczas pobierania listu przewozowego: ' . $errorMsg);

            throw new \Exception($errorMsg);
        }

        return $r['url'];
    }

    /**
     * Pobiera liste terminali dla InPostu
     *
     * @return true
     */
    public function cacheInPostPoints()
    {
        $url = $this->baseApiUrl . 'points?productId=418';
        $r = $this->sendJSONRequest($url);
        $terminals = [];
        if (!empty($r)) {
            $terminals = $r;
        }
        file_put_contents($this->pathForCachedPointsCalledFromAdmin . 'PACZKOMAT.json', json_encode($terminals));

        return true;
    }

    /**
     * Pobiera liste terminali dla Paczka w Ruchu
     *
     * @return true
     */
    public function cachePaczkaWRuchuPoints()
    {
        $url = $this->baseApiUrl . 'points?productId=1551';
        $r = $this->sendJSONRequest($url);
        $terminals = $r ? $r : [];
        file_put_contents($this->pathForCachedPointsCalledFromAdmin . 'PACZKA_W_RUCHU.json', json_encode($terminals));

        return true;
    }

    /**
     * Pobiera listę krajów
     *
     * @return array lista krajów
     */
    public function getCountries()
    {
        $url = $this->baseApiUrl . 'countries';
        $r = $this->sendJSONRequest($url);

        return $r ? $r : [];
    }

    /**
     * Send http reqest to given url and returns response
     *
     * @param $url
     * @param $data
     *
     * @return bool|string
     */
    private function sendHttpRequest($url, $data = '')
    {
        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
        $result = curl_exec($curl);
        curl_close($curl);

        return $result;
    }

    private function sendJSONRequest($url, $token = null, $data = [], $method = null)
    {
        $headers = [];
        if (is_array($data) && count($data) && $method == null) {
            $method = 'POST';
        }

        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);

        if ($method != 'GET' && $method != null) {
            curl_setopt($curl, CURLOPT_CUSTOMREQUEST, $method);
        }

        if (is_array($data) && count($data)) {
            $jsonData = json_encode($data);
            curl_setopt($curl, CURLOPT_POSTFIELDS, $jsonData);
            $headers[] = 'Content-Type: application/json';
            $headers[] = 'Content-Length: ' . strlen($jsonData);
        }

        if ($token) {
            $headers[] = 'x-auth-token: ' . $token;
        }

        curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
        $result = curl_exec($curl);
        $resInfo = curl_getinfo($curl);
        usleep(40000);
        curl_close($curl);
        $r = json_decode($result, true);

        if ((int) $resInfo['http_code'] > 299) {
            throw new ServerErrorException('HTTP code means error', $data, $r ? $r : []);
        }

        return $r;
    }

    /**
     * Gets the value of login.
     *
     * @return string
     */
    public function getLogin()
    {
        return $this->login;
    }

    /**
     * Sets the value of login.
     *
     * @param $login - the login
     *
     * @return self
     */
    public function setLogin($login)
    {
        $this->login = $login;

        return $this;
    }

    /**
     * Gets the value of password.
     *
     * @return string
     */
    public function getPassword()
    {
        return $this->password;
    }

    /**
     * Sets the value of password.
     *
     * @param $password - the password
     *
     * @return self
     */
    public function setPassword($password)
    {
        $this->password = $password;

        return $this;
    }

    /**
     * Gets the value of apiKey.
     *
     * @return string
     */
    public function getApiKey()
    {
        return $this->apiKey;
    }

    /**
     * Sets the value of apiKey.
     *
     * @param $apiKey - the api key
     *
     * @return self
     */
    public function setApiKey($apiKey)
    {
        $this->apiKey = $apiKey;

        return $this;
    }

    /**
     * Gets the value of apiKey.
     *
     * @return int|null
     */
    public function getClientId()
    {
        if (!$this->clientId) {
            $this->isUserAuthorized();
        }

        return $this->clientId;
    }

    /**
     * @return mixed
     */
    public function getToken()
    {
        return $this->token;
    }

    /**
     * Pobiera dane zamówienia z GlobKurier API — w tym trackingNumber od przewoźnika.
     *
     * @param string $hash hash zamówienia
     * @param string|null $number numer zamówienia GK (opcjonalnie, np. "GK260522105311")
     *
     * @return array dane zamówienia
     */
    /**
     * Pobiera listę szablonów przesyłek z GlobKurier API.
     * GET /v1/order/productTemplate
     *
     * @param int $limit
     * @param int $offset
     * @return array
     */
    public function getTemplates($limit = 100, $offset = 0)
    {
        $url = $this->baseApiUrl . 'order/productTemplate?limit=' . (int)$limit . '&offset=' . (int)$offset;
        $result = $this->sendJSONRequest($url, $this->token, [], 'GET');
        if (is_array($result) && isset($result['results'])) {
            return $result['results'];
        }
        return [];
    }

    /**
     * Pobiera dostępne metody płatności dla konta (bez kontekstu produktu).
     *
     * @return array
     */
    public function getPayments()
    {
        $url = $this->baseApiUrl . 'order/payments';

        return $this->sendJSONRequest($url, $this->token, [], 'GET');
    }

    public function getOrder($hash, $number = null)
    {
        $params = ['hash' => $hash];
        if ($number) {
            $params['number'] = $number;
        }
        $url = $this->baseApiUrl . 'order?' . http_build_query($params);

        return $this->sendJSONRequest($url, $this->token, [], 'GET');
    }

    public function getLabel($token, $hash)
    {
        $curl = curl_init();

        curl_setopt_array($curl, [
            CURLOPT_URL => $this->baseApiUrl . 'order/labels?orderHashes[0]=' . $hash,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'GET',
            CURLOPT_HTTPHEADER => [
                'x-auth-token: ' . $token,
            ],
        ]);

        $response = curl_exec($curl);

        curl_close($curl);

        return $response;
    }
}
