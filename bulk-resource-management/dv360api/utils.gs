/**
 * @license
 *
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview This Google Apps Script file contains utility methods for
 * interacting with the DV360 API using the @link {UrlFetchApp} and
 * @link {ScriptApp} classes. Most of the methods here can be replaced once the
 * API is available as an 'Advanced Google Service' integration within the
 * built-in Apps Script 'Resources' section.
 */

var ApiUtil = {

  /**
   * Wrapper method for building and executing a GET request to the DV360
   * API. Delegates to @link {ApiUtil.executeApiGetRequest} for paged response
   * handling.
   *
   * @param {string} requestUri: the URI of the specific GET Resource to
   *     request.
   * @param {Object!} requestParams: the options to use for the GET request.
   * @param {Object!} requestCallback: the method to call after the request has
   *           executed successfully.
   */
  prepareAndExecuteApiGetRequest: function(
      requestUri, requestParams, requestCallback) {
    var url = this.buildApiUrl(requestUri);
    var params = this.buildApiParams(requestParams);

    console.info(`Executing API GET [${requestUri}]`);
    this.executeApiGetRequest(url, params, requestCallback);
    console.info(`API GET [${requestUri}] executed successfully!`);
  },

  /**
   * Executes a GET request to the DV360 API and keeps track of paged
   * responses up to the value of 'maxPages'. Delegates to
   * @link {ApiUtil.executeApiRequest} for the concrete request and
   * response handling.
   *
   * @param {string} url: the url of the GET request.
   * @param {Object!} params: the options to use for the GET request.
   * @param {Object!} requestCallback: the method to call after the request has
   *           executed successfully.
   */
  executeApiGetRequest(url, params, requestCallback) {
    var maxPages = 50;
    var pageCount = 1;
    var pageToken;

    do {
      if (pageCount > maxPages / 2) {
        console.log(
            'Fetching results page: ' + pageCount +
            '... Will not fetch more than ' + maxPages + ' pages!');
      } else {
        console.log(`Fetching results page: ${pageCount}...`);
      }
      var result = this.executeApiRequest(url, params, true);
      console.log(`...Outputting results page: ${pageCount}`);
      this.handleResponse(result, requestCallback, pageCount === 1);

      pageToken = result['nextPageToken'];

      if (pageToken !== 'undefined') {
        url = Util.modifyUrlQueryString(url, 'pageToken', pageToken);
      }
      pageCount++;
    } while (pageToken && pageCount < maxPages);
  },

  /**
   * Wrapper method for building and executing a non-GET request to the DV360
   * API. Delegates to @link {ApiUtil.executeApiRequest} for the concrete
   * response handling.
   *
   * @param {string} requestMethod: the non-GET HTTP method.
   * @param {string} requestUri: the URI of the specific Resource to request.
   * @param {Object!} requestParams: the options to use for the request.
   * @param {boolean} retryOnFailure}: whether the operation should be retried
   *           in case of failure or not.
   * @param {Object!} requestCallback}: the method to call after the request has
   *           executed successfully.
   * @param {Object?} requestCallbackParams}: params to pass when calling
   *           the @param {requestCallback}.
   */
  prepareAndExecuteApiRequest: function(
      requestMethod, requestUri, requestParams, retryOnFailure, requestCallback,
      requestCallbackParams) {
    var url = this.buildApiUrl(requestUri);
    var params = this.buildApiParams(requestParams);

    console.info(`Executing API ${requestMethod} [${requestUri}]`);
    var result = this.executeApiRequest(url, params, retryOnFailure);
    this.handleResponse(result, requestCallback, requestCallbackParams);
    console.info(`API ${requestMethod} [${requestUri}] executed successfully!`);
  },

  /**
   * Executes a request to the DV360 API, handling errors and response
   * data parsing. Re-attempts failed executions up to the value of
   * 'maxRetries'.
   *
   * @param {string} url: the url of the request.
   * @param {Object!} params: the options to use for the request.
   * @param {boolean} retryOnFailure: whether the operation should be retried
   *           in case of failure or not.
   * @param {int?} operationCount: the number of failed attempts made.
   *
   * @return {Object!} representing the parsed JSON response data, or an
   *           empty object for empty responses.
   */
  executeApiRequest(url, params, retryOnFailure, operationCount) {
    operationCount = Util.coalesce(operationCount, 0);
    var maxRetries = 3;

    try {
      var response = UrlFetchApp.fetch(url, params);

      if (response.getResponseCode() / 100 != 2) {
        throw ({
          'code': response.getResponseCode(),
          'message': response.getContentText()
        });
      }
      return response.getContentText() ? JSON.parse(response.getContentText()) :
                                         {};
    } catch (e) {
      console.error(`Operation failed with exception: ${e}`);

      if (retryOnFailure && operationCount < maxRetries) {
        console.info(`Retrying operation for a max of ${maxRetries} times...`);

        this.refreshAuthToken(params);
        operationCount += 1;
        this.executeApiRequest(url, params, retryOnFailure, operationCount);
      } else {
        console.warn(
            'Retry on failure not supported or all retries ' +
            'have been exhausted... Failing!');
        throw new Error(
            'Sorry an error ocurred, please check your input and try again!');
      }
    }
  },

  /**
   * Constructs the fully-qualified URL to the DV360 API using the
   * given @param {requestUri}.
   *
   * @param {string} requestUri: the URI of the specific Resource to request.
   *
   * @return {string} representing the fully-qualified DV360 API URL.
   */
  buildApiUrl(requestUri) {
    var apiEndpoint = 'https://displayvideo.googleapis.com';
    var apiVersion = 'v1beta';

    return `${apiEndpoint}/${apiVersion}/${requesUri}`;
  },

  /**
   * Constructs the options to use for the DV360 API request, extending
   * some default options with the given @param {requestParams}.
   *
   * @param {Object!} requestParams: the options to use for the request.
   *
   * @return {Object!} representing the extended request options to use.
   * @see {utils.gs} @link {Util.extend}.
   */
  buildApiParams(requestParams) {
    var token = ScriptApp.getOAuthToken();
    var params = {
      'contentType': 'application/json',
      'headers':
          {'Authorization': `Bearer ${token}`, 'Accept': 'application/json'}
    };
    params = Util.extend(params, requesParams);

    return params;
  },

  /**
   * Refreshes the OAuth2 client token used for authentication against
   * the DV360 API by fetching it from the underlying @link {ScriptApp}
   * and modifying the @param {params} of the request directly (i.e.
   * there is no return value for this method).
   *
   * @param {Object!} params: the options to use for the request.
   */
  refreshAuthToken(params) {
    var token = ScriptApp.getOAuthToken();
    params['headers']['Authorization'] = `Bearer ${token}`;
  },

  /**
   * Wrapper method for triggering the given @param {callback} method,
   * passing in the @param {callbackParams} along with the parsed
   * API response.
   *
   * @param {Object!} response: the parsed API response data.
   * @param {Object!} callback: the method to trigger.
   * @param {Object?} callbackParams: the params to pass when
   *           calling @param {callback}.
   */
  handleResponse(response, callback, callbackParams) {
    callback(response, callbackParams);
  },

};
