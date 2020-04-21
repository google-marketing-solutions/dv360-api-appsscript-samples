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
 * @fileoverview This Google Apps Script file represents the different DV360
 * API resources and the operations that can be triggered on them.
 * The API resources are organized in separate namespaces for better
 * portability.
 * The general approach here is that each method delegates to
 * @link {ApiUtil} for request handling, and provides a callback
 * to handle the API response, which in turn utilizes @link {SheetUtil}
 * for writing the output to the associated Spreadsheet.
 *
 * @see {api_utils.gs}.
 * @see {sheet_utils.gs}.
 */

var ApiResource = {

  /**
   * Namespace representing the 'Advertiser' resource of the
   * DV360 API.
   */
  Advertiser: {

    /**
     * Lists available advertisers for the given partner ID.
     *
     * @param {string} partnerId: the partner ID to use.
     */
    listAdvertisers: function(partnerId) {
      var uri = `advertisers?partnerId=${partnerId}`;
      var params = {'method': 'get'};
      var callback = ApiResource.Advertiser.handleListAdvertisers;

      ApiUtil.prepareAndExecuteApiGetRequest(uri, params, callback);
    },

    /**
     * Response handler for the @link {ApiResource.Advertiser.listAdvertisers}
     * method.
     *
     * @param {Object!} result: the API response JSON object.
     * @param {boolean} overwrite: whether to overwrite the existing sheet data
     *           or to append to it.
     */
    handleListAdvertisers: function(result, overwrite) {
      var advertisers = [];

      result['advertisers'].forEach(function(advertiser) {
        advertisers.push(
            ApiResource.Advertiser.buildAdvertiserOutput(advertiser));
      });

      var sheetConfig = SHEET_CONFIG['ADVERTISERS'];

      if (overwrite) {
        SheetUtil.clearRange(
            sheetConfig['name'], sheetConfig['rangeStartRow'],
            sheetConfig['rangeStartCol']);
        SheetUtil.outputInRange(
            sheetConfig['name'], sheetConfig['rangeStartRow'],
            sheetConfig['rangeStartCol'], advertisers);
      } else {
        SheetUtil.appendOutputToRange(
            sheetConfig['name'], sheetConfig['rangeStartCol'], advertisers);
      }
    },

    /**
     * Creates a new advertiser resource.
     *
     * @param {int!} advertiserRow: row index of the advertiser data to create.
     * @param {array!} advertiserRowData: two-dimensional array of length 1
     *           representing the advertiser data values.
     * @param {array!} advertiserHeaderData: two-dimensional array of length 1
     *           representing the advertiser data keys.
     * @param {string} advertiserPartnerId: the partner ID associated with the
     *           advertiser to be created.
     */
    createAdvertiser: function(
        advertiserRow, advertiserRowData, advertiserHeaderData,
        advertiserPartnerId) {
      var advertiserPayload = ApiResource.Advertiser.buildAdvertiserPayload(
          advertiserRowData, advertiserHeaderData, advertiserPartnerId, true);

      var uri = 'advertisers';
      var method = 'POST';
      var params = {
        'method': method,
        'payload': JSON.stringify(advertiserPayload)
      };
      var callback = ApiResource.Advertiser.handleUpsertAdvertiser;

      ApiUtil.prepareAndExecuteApiRequest(
          method, uri, params, false, callback, advertiserRow);
    },

    /**
     * Response handler for the @link {ApiResource.Advertiser.createAdvertiser}
     * or the @link {ApiResource.Advertiser.patchAdvertiser}.
     *
     * @param {Object!} result: the API response JSON object.
     * @param {int!} advertiserRow: row index of the advertiser that was
     *           created or updated.
     */
    handleUpsertAdvertiser: function(result, advertiserRow) {
      var advertiserOutput =
          ApiResource.Advertiser.buildAdvertiserOutput(result);
      var sheetConfig = SHEET_CONFIG['ADVERTISERS'];

      SheetUtil.outputInRange(
          sheetConfig['name'], advertiserRow, sheetConfig['rangeStartCol'],
          [advertiserOutput]);
    },

    /**
     * Modifies the values of an existing advertiser resource.
     *
     * @param {int!} advertiserRow: row index of the advertiser data to create.
     * @param {array!} advertiserRowData: two-dimensional array of length 1
     *           representing the advertiser data values.
     * @param {array!} advertiserHeaderData: two-dimensional array of length 1
     *           representing the advertiser data keys.
     */
    patchAdvertiser: function(
        advertiserRow, advertiserRowData, advertiserHeaderData) {
      var advertiserPayload = ApiResource.Advertiser.buildAdvertiserPayload(
          advertiserRowData, advertiserHeaderData);
      var advertiserId = advertiserPayload['advertiserId'];
      var updateMask = ApiResource.Advertiser.buildAdvertiserPatchUpdateMask(
          advertiserHeaderData);

      var uri = `advertisers/${advertiserId}?updateMask=${updateMask}`;
      var method = 'PATCH';
      var params = {
        'method': method,
        'payload': JSON.stringify(advertiserPayload)
      };
      var callback = ApiResource.Advertiser.handleUpsertAdvertiser;

      ApiUtil.prepareAndExecuteApiRequest(
          method, uri, params, true, callback, advertiserRow);
    },

    /**
     * Deletes an existing advertiser resource.
     *
     * @param {int!} advertiserRow: row index of the advertiser data to create.
     * @param {array!} advertiserRowData: two-dimensional array of length 1
     *           representing the advertiser data values.
     */
    deleteAdvertiser: function(advertiserRow, advertiserRowData) {
      var advertiserId = advertiserRowData[0][0];

      var uri = `advertisers/${advertiserId}`;
      var method = 'DELETE';
      var params = {'method': method};
      var callback = ApiResource.Advertiser.handleDeleteAdvertiser;

      ApiUtil.prepareAndExecuteApiRequest(
          method, uri, params, true, callback, advertiserRow);
    },

    /**
     * Response handler for the @link {ApiResource.Advertiser.deleteAdvertiser}.
     *
     * @param {Object!} result: the API response JSON object.
     * @param {int!} advertiserRow: row index of the advertiser that was
     *           created or updated.
     */
    handleDeleteAdvertiser: function(result, advertiserRow) {
      var sheetConfig = SHEET_CONFIG['ADVERTISERS'];

      SheetUtil.deleteRow(sheetConfig['name'], advertiserRow);
    },

    /**
     * Retrieves the data for an existing advertiser by advertiser ID.
     *
     * @param {string} advertiserId: the advertiser ID to use.
     */
    getAdvertiser: function(advertiserId) {
      var uri = `advertisers/${advertiserId}`;
      var params = {'method': 'get'};
      var callback = ApiResource.Advertiser.handleGetAdvertiser;

      ApiUtil.prepareAndExecuteApiGetRequest(uri, params, callback);
    },

    /**
     * Response handler for the @link {ApiResource.Advertiser.getAdvertiser}.
     *
     * @param {Object!} result: the API response JSON object.
     */
    handleGetAdvertiser: function(result) {
      var advertiserId = result['advertiserId'];
      var sheetConfig = SHEET_CONFIG['ADVERTISERS'];

      var results = SheetUtil.findInRange(
          [advertiserId], sheetConfig['name'], sheetConfig['rangeStartRow'],
          sheetConfig['primaryIdCol'], sheetConfig['primaryIdCol']);

      if (results[advertiserId].length !== 0) {
        var advertiserOutput =
            ApiResource.Advertiser.buildAdvertiserOutput(result);

        SheetUtil.outputInRange(
            sheetConfig['name'], results[advertiserId][0],
            sheetConfig['rangeStartCol'], [advertiserOutput]);
      }
    },

    /**
     * Constructs the data to output in the sheet from the given advertiser
     * API response.
     *
     * @param {Object!} advertiser: the advertiser object as received from the
     *     API.
     *
     * @return {array!} two-dimensional array representing the advertiser output
     *           ready for writing to the sheet.
     */
    buildAdvertiserOutput(advertiser) {
      var advertiserOutput = [
        advertiser['displayName'], advertiser['entityStatus'],
        JSON.stringify(advertiser['generalConfig']),
        JSON.stringify(advertiser['adServerConfig']),
        JSON.stringify(advertiser['creativeConfig']),
        advertiser['advertiserId'], 'READ'
      ];

      return advertiserOutput;
    },

    /**
     * Constructs the payload to send for
     * @link {ApiResource.Advertiser.createAdvertiser}
     * or @link {ApiResource.Advertiser.patchAdvertiser}.
     *
     * @param {array!} advertiserRowData: two-dimensional array of length 1
     *           representing the advertiser data values.
     * @param {array!} advertiserHeaderData: two-dimensional array of length 1
     *           representing the advertiser data keys.
     * @param {string} advertiserPartnerId: the partner ID associated with the
     *           advertiser to be created.
     * @param {boolean} create: boolean representing whether the payload will be
     *           used for the @link {ApiResource.Advertiser.createAdvertiser}
     *           operation. Some fields need to be removed for the Create
     *           operation to succeed.
     *
     * @return {Object!} representing JSON payload to be sent along with the API
     *           request.
     */
    buildAdvertiserPayload(
        advertiserRowData, advertiserHeaderData, advertiserPartnerId, create) {
      var payload = {};

      if (advertiserPartnerId !== 'undefined') {
        payload['partnerId'] = advertiserPartnerId;
      }
      for (var col = 0; col < advertiserHeaderData[0].length; col++) {
        var colName = advertiserHeaderData[0][col];
        var colValue = advertiserRowData[0][col];

        if (colName === 'MODIFICATION_STATUS' || colValue === '' ||
            (create === true && colName === 'advertiserId')) {
          continue;
        }
        try {
          var json = JSON.parse(colValue);

          if (create === true && colName === 'generalConfig' &&
              'timeZone' in json) {
            delete json['timeZone'];
          }
          payload[colName] = json;
        } catch (e) {
          // ignore e
          payload[colName] = colValue;
        }
      }
      return payload;
    },

    /**
     * Constructs the advertiser updateMask value for the PATCH Advertiser
     * request. The updateMask consists of comma-separated advertiser property
     * keys that have changed.
     *
     * @param {array!} advertiserHeaderData: two-dimensional array of length 1
     *           representing the advertiser data keys.
     *
     * @return {string} representing the comma-separated advertiser property
     *           keys that have changed
     */
    buildAdvertiserPatchUpdateMask(advertiserHeaderData) {
      var cols = advertiserHeaderData[0].filter(function(col) {
        return col !== 'MODIFICATION_STATUS' && col !== 'advertiserId';
      });
      return cols.join(',');
    },

  },

};
