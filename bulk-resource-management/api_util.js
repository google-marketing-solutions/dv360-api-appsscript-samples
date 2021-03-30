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

const ApiUtil = {
/**
 * Executes single GET request and fires callback once for each returned page.
 * @param {string} requestUri path to query
 * @param {function(!Object): undefined} callback
 *   executed with each page of response
 * @param {function(!Object): undefined} errback
 *   callback in case of errors
 * @param {?Array<!Object>} callbackParams
 *   static parameters for callback/errback
 */
  executeApiGetRequest: function(
      requestUri,
      callback,
      errback,
      callbackParams) {
    const requestParams = {
      'method': 'get',
    };
    ApiUtil.executeGenericRequest_(
        requestUri,
        requestParams,
        callback,
        errback,
        callbackParams);
  },

  /**
 * Executes single PATCH request and fires callback.
 * @param {string} requestUri path to query
 * @param {!Object} payload what to include as body
 * @param {function(!Object): undefined} callback
 *   executed with each page of response
 * @param {function(!Object): undefined} errback
 *   callback in case of errors
 * @param {?Array<!Object>} callbackParams
 *   static parameters for callback/errback
 */
  executeApiPatchRequest: function(
      requestUri,
      payload,
      callback,
      errback,
      callbackParams) {
    const requestParams = {
      method: 'patch',
      payload: JSON.stringify(payload),
    };
    ApiUtil.executeGenericRequest_(
        requestUri,
        requestParams,
        callback,
        errback,
        callbackParams
    );
  },

  /**
 * Executes single CREATE request and fires callback.
 * @param {string} requestUri path to query
 * @param {!Object} payload what to include as body
 * @param {function(!Object): undefined} callback
 *   executed with each page of response
 * @param {function(!Object): undefined} errback
 *   callback in case of errors
 * @param {?Array<!Object>} callbackParams
 *   static parameters for callback/errback
 */
  executeApiCreateRequest: function(
      requestUri,
      payload,
      callback,
      errback,
      callbackParams) {
    const requestParams = {
      method: 'post',
      payload: JSON.stringify(payload),
    };
    ApiUtil.executeGenericRequest_(
        requestUri,
        requestParams,
        callback,
        errback,
        callbackParams
    );
  },
  /**
 * Executes single DELETE request and fires callback.
 * @param {string} requestUri path to query
 * @param {?Object} payload ignored
 * @param {function(!Object): undefined} callback
 *   executed with each page of response
 * @param {function(!Object): undefined} errback
 *   callback in case of errors
 * @param {?Array<!Object>} callbackParams
 *   static parameters for callback/errback
 */
  executeApiDeleteRequest: function(
      requestUri,
      payload,
      callback,
      errback,
      callbackParams) {
    const requestParams = {
      method: 'delete',
    };
    ApiUtil.executeGenericRequest_(
        requestUri,
        requestParams,
        callback,
        errback,
        callbackParams
    );
  },
  /**
 * Runs REST request using UrlFetchApp. Handles paging, executing
 * callbacks and errors. No retries.
 * Will call callback once per resulting page.
 * Will call errback when there's non-2XX response.
 * @private
 * @param {string} requestUri path to call
 * @param {!Object} requestParams params to include (UrlFetchApp format)
 * @param {function(!Object): undefined} callback to be called once per page
 * @param {function(!Object): undefined} errback in case of errors
 * @param {?Array<!Object>} callbackParams common parameters to callbacks
 */
  executeGenericRequest_: function(
      requestUri,
      requestParams,
      callback,
      errback,
      callbackParams) {
    const baseUrl = ApiUtil.buildApiUrl_(requestUri);
    const params = ApiUtil.buildApiParams_(requestParams);

    let url = baseUrl;
    let morePages = true;
    try {
      while (morePages) {
        console.log(`Fetching ${params.method} request from ${url}`);
        const response = UrlFetchApp.fetch(url, params);
        if (response.getResponseCode() / 100 !== 2) {
          throw new Error(response.getContentText());
        }
        const result = response.getContentText() ?
          JSON.parse(response.getContentText()) : {};
        callback(result, callbackParams);
        morePages = result.nextPageToken != undefined;
        if (morePages) {
          url = baseUrl +
           Util.queryParamSeparator(baseUrl) +
           `pageToken=${result.nextPageToken}`;
        }
      }
    } catch (error) {
      errback(error, callbackParams);
    }
  },

  /**
   * Takes in a string with placeholders like ${variable}
   * and replaces them with values found in selected sheet's top part.
   * @param {!SheetConfig} sheetConfig where to find inputs
   * @param {string} input (partial) uri with placeholders
   * @return {string} uri with replaced placeholders
   */
  replaceInputValues(sheetConfig, input) {
    let output = input;
    const params = SheetUtil.getInputCellValues(sheetConfig);
    for (const [name, value] of Object.entries(params)) {
      output = output.replace('${' + name + '}', value);
    }
    return output;
  },

  /**
   * Constructs the fully-qualified URL to the DV360 API using the
   * given @param {requestUri}.
   * @private
   * @param {string} requestUri: the URI of the specific Resource to request.
   * @return {string} representing the fully-qualified DV360 API URL.
   */
  buildApiUrl_(requestUri) {
    const apiEndpoint = 'https://displayvideo.googleapis.com';
    const apiVersion = 'v1';

    return `${apiEndpoint}/${apiVersion}/${requestUri}`;
  },

  /**
   * Constructs the options to use for the DV360 API request, extending
   * some default options with the given @param {requestParams}.
   * @private
   * @param {!Object} requestParams: the options to use for the request.
   * @return {!Object} representing the extended request options to use.
   * @see {utils.gs} @link {Util.extend}.
   */
  buildApiParams_(requestParams) {
    const token = ScriptApp.getOAuthToken();
    let params = {
      contentType: 'application/json',
      headers:
        {Authorization: `Bearer ${token}`, Accept: 'application/json'},
      muteHttpExceptions: true,
    };
    params = Util.extend(params, requestParams);

    return params;
  },
};
