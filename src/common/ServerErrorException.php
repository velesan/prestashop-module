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
 *  @copyright 2017-2017 Silver Rose Wiktor Koźmiński
 *  @license   LICENSE.txt
 */

namespace Globkuriermodule\Common;

if (!defined('_PS_VERSION_')) {
    exit;
}
class ServerErrorException extends \Exception
{
    /** @var array */
    protected $request;

    /** @var array */
    protected $response;

    public function __construct($message, array $requestData, array $responseData)
    {
        $this->request = $requestData;
        $this->response = $responseData;
        parent::__construct($message, 0, null);
    }

    /**
     * Gets the value of request.
     *
     * @return array
     */
    public function getRequest()
    {
        return $this->request;
    }

    /**
     * Sets the value of request.
     *
     * @param array $request the request
     *
     * @return self
     */
    protected function setRequest(array $request)
    {
        $this->request = $request;

        return $this;
    }

    /**
     * Gets the value of response.
     *
     * @return array
     */
    public function getResponse()
    {
        return $this->response;
    }

    /**
     * Sets the value of response.
     *
     * @param array $response the response
     *
     * @return self
     */
    protected function setResponse(array $response)
    {
        $this->response = $response;

        return $this;
    }
}
