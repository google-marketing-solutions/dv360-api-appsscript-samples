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
 *
 * @see {api_util.gs}.
 * @see {sheet_util.gs}.
 */

/**
 * Runs a testing routine.
 * Left here to have it available for debugging right after
 * reloading of Apps Script project.
 */
function test() {
  console.time('test');
  const resources = new ApiResource(SHEET_CONFIG['ADVERTISERS']);
  resources.download();
  // resources.uploadChanges();
  console.timeEnd('test');
}

/**
 * Base class for all API resources editable in DV360.
 * Responsible for reading and writing data in appropriate sheets
 * and for calling ApiUtil's REST methods using this data.
 */
class ApiResource {
  /**
   * Builds ApiResource object.
   * @param {!SheetConfig} sheetConfig configuration of current sheet
   */
  constructor(sheetConfig) {
    /** @private @const {!SheetConfig} */
    this.sheetConfig_ = sheetConfig;
    /** @private @const {!Array<string>} */
    this.headerFields_ = SheetUtil.getHeaderRowData(this.sheetConfig_);
  }

  /**
   * Cleans the sheet and lists all entities from DV360 API,
   * essentially displaying current state of data.
   */
  download() {
    SheetUtil.clearRange(
        this.sheetConfig_.name, this.sheetConfig_.rangeStartRow,
        this.sheetConfig_.rangeStartCol);
    ApiUtil.executeApiGetRequest(
        this.buildGetUrl_(),
        (result) => {
          this.getHandler_(result);
        },
        (error) => {
          throw new Error(error.message);
        });
  }

  /**
   * Pushes changes from sheet to API.
   * Creates, patches and deletes entries.
   */
  uploadChanges() {
    const objectData = this.readAllEntitiesFromSheet_();
    this.createNewEntities_(objectData);
    this.patchModifiedData_(objectData);
    this.deleteMarkedEntries_(objectData);
  }

  /**
   * Prints output from API GET into the sheet.
   * @private
   * @param {!Object} result single 'row' of GET response.
   */
  getHandler_(result) {
    if (Object.keys(result).length === 0) return;
    const rowsData = result[this.sheetConfig_.apiFieldName].map(
        (resultRow) => this.buildSheetRowData_(resultRow));
    SheetUtil.appendOutputToRange(
        this.sheetConfig_.name, this.sheetConfig_.rangeStartCol, rowsData);
  }

  /**
   * Reads all rows and constructs parameter set for modifications.
   * Each entry contains:
   * payload, raw data in JSON format (that tracks API's state) and
   * patchMask - a list of FQ names of fields that differ
   *  between raw data and sheet's content
   * entityId and sheetIndex added for convenience.
   * @private
   * @return {!Array<!RowData>} Entities constructed using data from sheet.
   */
  readAllEntitiesFromSheet_() {
    const dataRows = SheetUtil.readDataRows(this.sheetConfig_);
    const primaryIdColumnIndex = this.sheetConfig_.primaryIdCol - 1;
    const rawDataColumnIndex = this.headerFields_.indexOf('_rawData');
    const objectData = dataRows.map((row, index) => {
      const payload = this.buildPayloadObject_(row);
      const rawData = row[rawDataColumnIndex];
      const patchMask = this.patchMask_(payload, rawData);

      return new RowData(
          row[primaryIdColumnIndex], rawData, payload, patchMask, index);
    });
    return objectData;
  }

  /**
   * Sends one CREATE request per each row that is to be created.
   * @private
   * @param {!Array<!RowData>} objectData All of current sheet's data state
   */
  createNewEntities_(objectData) {
    objectData.filter(this.isDataNew_).forEach((data) => {
      ApiUtil.executeApiCreateRequest(
          this.buildCreateUri_(), data.payload,
          (response) => this.modificationCallback_(data, response),
          (response) => this.modificationErrback_(data, response));
    });
  }

  /**
   * Sends one PATCH request per each row that differs
   * between raw data and actual column values.
   * @private
   * @param {!Array<!RowData>} objectData All of current sheet's data state
   */
  patchModifiedData_(objectData) {
    objectData.filter(this.isDataUpdated_).forEach((data) => {
      ApiUtil.executeApiPatchRequest(
          this.buildPatchUri_(data), data.payload,
          (response) => this.modificationCallback_(data, response),
          (response) => this.modificationErrback_(data, response));
    });
  }

  /**
   * Sends one DELETE request per each row marked for deletion.
   * @private
   * @param {!Array<!RowData>} objectData All of current sheet's data state
   */
  deleteMarkedEntries_(objectData) {
    objectData.filter(this.isDataMarkedForDeletion_).forEach((data) => {
      ApiUtil.executeApiDeleteRequest(
          this.buildDeleteUri_(data), data.payload,
          (response) => this.modificationCallback_(data, response),
          (response) => this.modificationErrback_(data, response));
    });
  }

  /**
   * Handles result of successful modification API call.
   * Takes a single API response as input and prints:
   * 1. OK marker into _logs column
   * 2. new raw data as returned from API
   * 3. primary ID if present in response (aka not for DELETE)
   * @private
   * @param {!RowData} data Original data
   * @param {!Object} response Object returned from API
   */
  modificationCallback_(data, response) {
    const rowNumber = data.sheetIndex + this.sheetConfig_.rangeStartRow;
    this.writeIntoSheetRow_(
        rowNumber, headerFields_.indexOf('_rawData') + 1,
        JSON.stringify(response));
    const primaryIdFieldName =
        this.headerFields_[this.sheetConfig_.primaryIdCol - 1];
    const primaryIdValue = response[primaryIdFieldName];
    if (primaryIdValue !== null && primaryIdValue !== 'undefined') {
      this.writeIntoSheetRow_(
          rowNumber, this.sheetConfig_.primaryIdCol, primaryIdValue);
    }
    this.writeIntoSheetRow_(rowNumber, this.getLogsColumnNumber_(), 'OK');
  }

  /**
   * Puts error message into _logs column.
   * @private
   * @param {!RowData} data original row's data
   * @param {!Error} error Error thrown from API call
   */
  modificationErrback_(data, error) {
    this.writeIntoSheetRow_(
        data.sheetIndex + this.sheetConfig_.rangeStartRow,
        this.getLogsColumnNumber_(), error.message);
  }

  /**
   * Translates one row of API GET request result into a map
   * that can be written to the sheet (keyed by header fields).
   * @private
   * @param {!Object} apiResult single object returned by API
   * @return {!Object} map of header-selected values
   */
  buildSheetRowData_(apiResult) {
    const output = this.headerFields_.map((field) => {
      if (field.length === 0 || field === '_logs') {
        return '';
      }
      if (field === '_rawData') {
        return JSON.stringify(apiResult);
      }
      let value = Util.getValueByDottedFieldName(apiResult, field);
      if (typeof value !== 'string') {
        value = JSON.stringify(value);
      }
      return value;
    });
    return output;
  }

  /**
   * Decides if an object described in sheet has been updated vs _rawData.
   * Requires patch mask to be non-empty and entity ID to be present.
   * @private
   * @param {!RowData} data of a single sheet row
   * @return {boolean} true if this row has been modified
   */
  isDataUpdated_(data) {
    return data.patchMask.length > 0 && data.entityId !== '';
  }

  /**
   * Decides if this row's data should be CREATEd in DV360.
   * Raw data is empty and entity ID is empty
   * @private
   * @param {!RowData} data of a single sheet row
   * @return {boolean} true if this row represents new entity
   */
  isDataNew_(data) {
    return data.entityId === '' && data.rawData === '';
  }

  /**
   * Checks if DELETE should be called. Triggered by DELETE marker in _rawData
   * - and, of course, primary ID must be present.
   * @private
   * @param {!RowData} data
   * @return {boolean} true if this row is to be deleted
   */
  isDataMarkedForDeletion_(data) {
    return data.entityId !== '' && data.rawData === 'DELETE';
  }

  /**
   * Outputs single value into single cell.
   * @private
   * @param {number} rowIndex
   * @param {number} colIndex
   * @param {string} message
   */
  writeIntoSheetRow_(rowIndex, colIndex, message) {
    SheetUtil.outputInRange(this.sheetConfig_.name, rowIndex, colIndex, [
      [message],
    ]);
  }

  /**
   * Produces comma-separated string of fields that differ between sheet
   * and original raw data (for use in PATCH calls).
   * @private
   * @param {!Object} payloadObject constructed from sheet row
   * @param {string} rawData JSON found in _rawData
   * @return {string} patch mask for DV360 API
   */
  patchMask_(payloadObject, rawData) {
    if (rawData === '' || rawData === 'DELETE') return '';
    const oldData = JSON.parse(rawData);
    const changedFields =
        Util.listDottedFields(payloadObject)
            .filter(
                (field) =>
                    Util.getValueByDottedFieldName(payloadObject, field) !=
                    Util.getValueByDottedFieldName(oldData, field));
    const mask = changedFields.join(',');
    return mask;
  }

  /**
   * Constructs payload object that can be used to communicate with DV360 API.
   * @private
   * @param {!Array<string>} rowData Cell values of a single sheet row
   * @return {!Object} full-fledged API-useable object
   */
  buildPayloadObject_(rowData) {
    const primaryIdFieldIndex = this.sheetConfig_.primaryIdCol - 1;
    const payloadHeaderFields = this.headerFields_.filter(
        (field) => field !== '_rawData' && field !== '_logs');
    const parsedEntries = payloadHeaderFields.map((field, index) => {
      const data = rowData[index];
      if (index === primaryIdFieldIndex && data === '') {
        return [];  // to avoid empty ID when creating entities
      }
      const parsed = this.parseCellContent_(data);
      return [field, parsed];
    });
    return Object.fromEntries(parsedEntries);
  }

  /**
   * Reads cell content as JSON or, if it fails, returns it verbatim.
   * @private
   * @param {string} data cell's content
   * @return {!Object|string} object or string if not parseable
   */
  parseCellContent_(data) {
    try {
      return JSON.parse(data);
    } catch (error) {
      // In case not pareseable, return original.
      return data;
    }
  }

  /**
   * Builds Url that can be used to GET data,
   * using sheet config and sheet filter settings.
   * @private
   * @return {string} uri to append to base DEV360 URL.
   */
  buildGetUrl_() {
    let uri = this.sheetConfig_.uri;
    if (this.sheetConfig_.filter != '') {
      uri +=
          Util.queryParamSeparator(uri) + `filter=${this.sheetConfig_.filter}`;
    }
    return ApiUtil.replaceInputValues(this.sheetConfig_, uri);
  }

  /**
   * Builds URI for PATCH request
   * @private
   * @param {*} dataObject for entityId
   * @return {string} uri for PATCH request
   */
  buildPatchUri_(dataObject) {
    return ApiUtil.replaceInputValues(
        this.sheetConfig_,
        this.sheetConfig_.uri + '/' + dataObject.entityId +
            '?updateMask=' + dataObject.patchMask);
  }

  /**
   * Builds URI for CREATE requests.
   * @private
   * @return {string} uri for CREATE request
   */
  buildCreateUri_() {
    return ApiUtil.replaceInputValues(this.sheetConfig_, this.sheetConfig_.uri);
  }

  /**
   * Builds URI for DELETE request.
   * @private
   * @param {*} dataObject for entityId
   * @return {string} uri for DELETE request
   */
  buildDeleteUri_(dataObject) {
    return ApiUtil.replaceInputValues(
        this.sheetConfig_, this.sheetConfig_.uri + '/' + dataObject.entityId);
  }

  /**
   * Calculates which column to put logs into.
   * @private
   * @return {number} 1-based number of logs column;
   */
  getLogsColumnNumber_() {
    return headerFields_.indexOf('_logs') + 1;
  }
}

/**
 * Object representation of a single modifiable
 *  entity (current sheet row's data vs _rawData)
 */
class RowData {
  /**
   * Creates a data representation of a single entity & sheet row.
   * @param {string} entityId ID of object in a row
   * @param {string} rawData original data from API
   * @param {?Object} payload new value to be uploaded
   * @param {string} patchMask list of modified fields
   * @param {number} sheetIndex index of row within the sheet
   */
  constructor(entityId, rawData, payload, patchMask, sheetIndex) {
    /** @const {string} */
    this.entityId = entityId;
    /** @const {string} */
    this.rawData = rawData;
    /** @const {?Object} */
    this.payload = payload;
    /** @const {string} */
    this.patchMask = patchMask;
    /** @const {number} */
    this.sheetIndex = sheetIndex;
  }
}
