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
 * Base class for all API resources editable in DV360.
 * Responsible for reading and writing data in appropriate sheets
 * and for calling ApiUtil's REST methods using this data.
 */
class DV360Sheet {
  /**
   * Builds ApiResource object.
   * @param {!SheetConfig} sheetConfig configuration of current sheet
   */
  constructor(sheetConfig) {
    /** @private @const {!SheetConfig} */
    this.sheetConfig_ = sheetConfig;
    /** @private @const {!Array<string>} */
    this.headerFields_ = SheetUtil.getHeaderRowData(this.sheetConfig_);
    /** @private @const {!DV360Resource} */
    this.dv360resource_ = this.sheetConfig_.dv360resource;
    this.rawDataColumnName_ = '_rawData';
    this.logsColumnName_ = '_logs';
    this.actionColumnName_ = 'action';
    this.targetingOptionsColumnName_ = '_targetingOptions';
    this.targetingOptionsPlaceholder_ = '<placeholder for targeting options>';
  }

  /**
   * Cleans the sheet and lists all entities from DV360 API,
   * essentially displaying current state of data.
   */
  download() {
    SheetUtil.clearData(this.sheetConfig_);
    const parameters = SheetUtil.getInputCellValues(this.sheetConfig_);
    const entities = this.dv360resource_.list(parameters);
    if (entities.length > 0) {
      const rowsData =
          entities.map((result) => this.buildSheetRowData_(result));
      SheetUtil.appendOutputToRange(
          this.sheetConfig_.name, this.sheetConfig_.rangeStartCol, rowsData);
      this.fillTargetingOptions_(entities);
    }
  }

  /**
   * Fetches targeting options for entities and puts them into
   * appropriate sheet column.
   * Indexing matters - entities need to be in the exact same
   * order as sheet rows, otherwise it'll all fall into pieces.
   * @param {!Array<!DV360Entity>} entities to fetch TOs for
   */
  fillTargetingOptions_(entities) {
    const targetingOptionsColumnNumber = this.sheetConfig_.rangeStartCol +
        this.headerFields_.indexOf(this.targetingOptionsColumnName_);
    if (targetingOptionsColumnNumber > 0) {
      entities.forEach((entity, index) => {
        const rowNumber = this.sheetConfig_.rangeStartRow + index;
        let value = 'Targeting Options not found!';
        if (entity.listTargetingOptions != null) {
          const assignedTargetingOptions = entity.listTargetingOptions();
          value = JSON.stringify(assignedTargetingOptions);
        }
        SheetUtil.writeCellValue(
            this.sheetConfig_.name, rowNumber, targetingOptionsColumnNumber,
            value);
      });
    }
  }

  /**
   * @return {!Array<!DV360Entity>}
   */
  getAllData() {
    const dataRows = SheetUtil.readDataRows(this.sheetConfig_);
    const rawDataColumnIndex =
        this.headerFields_.indexOf(this.rawDataColumnName_);
    return dataRows.map((row) => {
      const json = row[rawDataColumnIndex];
      const obj = JSON.parse(json);
      return this.dv360resource_.convertObjectToEntity(obj);
    });
  }

  /**
   * Pushes changes from sheet to API.
   * Creates, patches and deletes entries.
   */
  uploadChanges() {
    const rowsData = this.readAllEntitiesFromSheet_();
    this.createNewEntities_(
        rowsData.filter((data) => data.action === 'CREATE'));
    this.updateData_(rowsData.filter((data) => data.action === 'MODIFY'));
    this.deleteEntries_(rowsData.filter((data) => data.action === 'DELETE'));
  }

  /**
   * Reads all rows and constructs parameter set for modifications.
   * Each entry contains:
   * payload object,
   * index that tracks sheet row's index
   * action CREATE/MODIFY/DELETE/'' what to do with payload
   * targetingOptions if present in sheet
   * @private
   * @return {!Array<!RowData>} Entities constructed using data from sheet.
   */
  readAllEntitiesFromSheet_() {
    const dataRows = SheetUtil.readDataRows(this.sheetConfig_);
    const actionColumnIndex =
        this.headerFields_.indexOf(this.actionColumnName_);
    const targetingOptionsColumnIndex =
        this.headerFields_.indexOf(this.targetingOptionsColumnName_);
    const objectData = dataRows.map((row, index) => {
      const payload = this.buildPayloadObject_(row);
      const action = row[actionColumnIndex];
      const targetingOptions = this.translateTargetingOptionsFromCell(
          row[targetingOptionsColumnIndex]);

      return new RowData(payload, index, action, targetingOptions);
    });
    return objectData;
  }

  /**
   *
   * @param {string} targetingOptionsData
   * @return {!Array<!AssignedTargetingOption>}
   */
  translateTargetingOptionsFromCell(targetingOptionsData) {
    // read targeting options
    if (targetingOptionsData != null && targetingOptionsData !== '' &&
        targetingOptionsData !== this.targetingOptionsPlaceholder_) {
      return JSON.parse(targetingOptionsData).map((to) => {
        return DV360.LineItemTargetingOptions.convertObjectToEntity(to);
      });
    } else {
      return [];
    }
  }

  /**
   * Sends one CREATE request per each row that is to be created.
   * @private
   * @param {!Array<!RowData>} rowsData All of current sheet's data state
   */
  createNewEntities_(rowsData) {
    rowsData.forEach((data) => {
      try {
        const newPayload = this.replaceSheetParameters_(data.payload);
        const newEntity = this.dv360resource_.create(newPayload);
        const newTargetingOptions =
            this.updateTargetingOptions_(newEntity, data.targetingOptions);
        this.modificationCallback_(newEntity, data.sheetIndex);
        this.writeOutTargetingOptions(
            JSON.stringify(newTargetingOptions), data.sheetIndex);
      } catch (error) {
        this.handleAPIError_(data, error);
      }
    });
  }

  /**
   *
   * @param {!DV360Entity} entity
   * @param {!Array<!AssignedTargetingOption>} targetingOptions
   * @return {!Array<!AssignedTargetingOption>}
   */
  updateTargetingOptions_(entity, targetingOptions) {
    if (entity.updateTargetingOptions != null) {
      const newTargetingOptions =
          this.prepareTargetingOptions_(targetingOptions, entity);
      entity.updateTargetingOptions(newTargetingOptions);
      return newTargetingOptions;
    }
    return targetingOptions;
  }
  /**
   *
   * @param {string} targetingOptions stringified
   * @param {number} sheetIndex
   */
  writeOutTargetingOptions(targetingOptions, sheetIndex) {
    if (this.headerFields_.indexOf(this.targetingOptionsColumnName_) > -1) {
      const rowNumber = this.sheetConfig_.rangeStartRow + sheetIndex;
      const targetingOptionsColumnNumber = this.sheetConfig_.rangeStartCol +
          this.headerFields_.indexOf(this.targetingOptionsColumnName_);
      SheetUtil.writeCellValue(
          this.sheetConfig_.name, rowNumber, targetingOptionsColumnNumber,
          targetingOptions);
    }
  }
  /**
   *
   * @param {!Array<!AssignedTargetingOption>} targetingOptions
   * @param {!DV360Entity} entity
   * @return {!Array<!AssignedTargetingOption>} after parameter replacement
   */
  prepareTargetingOptions_(targetingOptions, entity) {
    return targetingOptions.map((to) => {
      const out = Object.assign({}, to);
      out.name = out.name.replace(
          /advertisers\/.*\/lineItems\/.*\/targetingTypes/,
          `advertisers/${entity.advertiserId}/lineItems` +
              `/${entity.lineItemId}/targetingTypes`);
      return out;
    });
  }
  /**
   *
   * @param {!DV360Entity} payload
   * @return {!DV360Entity} modified payload
   */
  replaceSheetParameters_(payload) {
    const params = SheetUtil.getInputCellValues(this.sheetConfig_);
    Object.entries(params).forEach((entry) => {
      payload[entry[0]] = entry[1];
    });
    return payload;
  }

  /**
   * Sends one PATCH request per each row that differs
   * between raw data and actual column values.
   * @private
   * @param {!Array<!RowData>} objectData All of current sheet's data state
   */
  updateData_(objectData) {
    objectData.forEach((data) => {
      try {
        const updatedEntity = this.dv360resource_.update(data.payload);
        const updatedTargetingOptions =
            this.updateTargetingOptions_(updatedEntity, data.targetingOptions);
        this.modificationCallback_(updatedEntity, data.sheetIndex);
        this.writeOutTargetingOptions(
            JSON.stringify(updatedTargetingOptions), data.sheetIndex);
      } catch (error) {
        this.handleAPIError_(data, error);
      }
    });
  }

  /**
   * Sends one DELETE request per each row marked for deletion.
   * @private
   * @param {!Array<!RowData>} objectData All of current sheet's data state
   */
  deleteEntries_(objectData) {
    const rowNumbersToDelete = [];
    objectData.forEach((data) => {
      try {
        this.dv360resource_.delete(data.payload);
        const rowNumber = data.sheetIndex + this.sheetConfig_.rangeStartRow;
        rowNumbersToDelete.push(rowNumber);
        this.writeIntoSheetRow(
            rowNumber, this.getLogsColumnNumber_(), ['DELETED']);
      } catch (error) {
        this.handleAPIError_(data, error);
      }
    });
    SheetUtil.deleteSheetRows(this.sheetConfig_, rowNumbersToDelete);
  }

  /**
   * Handles result of successful modification API call.
   * Takes a single API response as input and prints:
   * 1. OK marker into _logs column
   * 2. new raw data as returned from API
   * 3. primary ID if present in response (aka not for DELETE)
   * @private
   * @param {?DV360Entity} response Object returned from API
   * @param {number} sheetIndex row of original object
   */
  modificationCallback_(response, sheetIndex) {
    const rowNumber = sheetIndex + this.sheetConfig_.rangeStartRow;
    const sheetRowData = this.buildSheetRowData_(response);
    this.writeIntoSheetRow(
        rowNumber, this.sheetConfig_.rangeStartCol, sheetRowData);
    this.writeIntoSheetRow(rowNumber, this.getLogsColumnNumber_(), ['OK']);
  }

  /**
   * Puts error message into _logs column.
   * @private
   * @param {!RowData} data original row's data
   * @param {!Error} error Error thrown from API call
   */
  handleAPIError_(data, error) {
    this.writeIntoSheetRow(
        data.sheetIndex + this.sheetConfig_.rangeStartRow,
        this.getLogsColumnNumber_(), [error.message]);
  }

  /**
   * Translates one row of API GET request result into a map
   * that can be written to the sheet (keyed by header fields).
   * @private
   * @param {!DV360Entity} entity single object returned by API
   * @return {!Array<string>} array of header-selected values
   */
  buildSheetRowData_(entity) {
    const output = this.headerFields_.map((field) => {
      if (field.length === 0 || field === this.logsColumnName_ ||
          field === this.actionColumnName_) {
        return '';
      }
      if (field === this.rawDataColumnName_) {
        return JSON.stringify(entity);
      }
      let value = '';
      if (field === this.targetingOptionsColumnName_) {
        value = this.targetingOptionsPlaceholder_;
      } else {
        value = Util.getValueByDottedFieldName(entity, field);
        if (typeof value !== 'string') {
          value = JSON.stringify(value);
        }
      }
      return this.translateValueIntoCell(field, value);
    });
    return output;
  }

  /**
   * @param {string} fieldName
   * @param {string} value
   * @return {string} translated value
   */
  translateValueIntoCell(fieldName, value) {
    let output = value;
    const translator = this.sheetConfig_.cellTranslators[fieldName];
    if (translator != null && value != null) {
      output = translator.toDisplayValue(value);
    }
    return output;
  }

  /**
   *
   * @param {string} fieldName
   * @param {string} cellValue
   * @return {*} value to put into the field
   */
  translateCellIntoValue(fieldName, cellValue) {
    let output = cellValue;
    const translator = this.sheetConfig_.cellTranslators[fieldName];
    if (translator != null) {
      output = translator.toEntityField(cellValue);
    }
    return output;
  }

  /**
   * Outputs single value into single cell.
   * @private
   * @param {number} rowNumber
   * @param {number} colNumber
   * @param {!Array<string>} rowData
   */
  writeIntoSheetRow(rowNumber, colNumber, rowData) {
    SheetUtil.outputInRange(this.sheetConfig_.name, rowNumber, colNumber, [
      rowData,
    ]);
  }

  /**
   * Constructs payload object that can be used to communicate with DV360 API.
   * @private
   * @param {!Array<string>} rowData Cell values of a single sheet row
   * @return {!DV360Entity} full-fledged API-useable object
   */
  buildPayloadObject_(rowData) {
    const payloadObject = {};
    this.headerFields_.forEach((field, index) => {
      if (this.fieldNameIsSpecial_(field)) {
        return;
      }
      const value = Util.parseCellContent(rowData[index]);
      if (value === '') {
        return;
      }
      const translatedValue = this.translateCellIntoValue(field, value);
      Util.setValueByDottedFieldName(payloadObject, field, translatedValue);
    });
    return this.dv360resource_.convertObjectToEntity(payloadObject);
  }
  /**
   *
   * @param {string} field name of the field
   * @return {boolean} true if payload should ignore the field
   */
  fieldNameIsSpecial_(field) {
    return field === this.rawDataColumnName_ ||
        field === this.logsColumnName_ || field === this.actionColumnName_ ||
        field === this.targetingOptionsColumnName_;
  }

  /**
   * Calculates which column to put logs into.
   * @private
   * @return {number} 1-based number of logs column;
   */
  getLogsColumnNumber_() {
    return this.headerFields_.indexOf(this.logsColumnName_) + 1;
  }
}

/**
 * Object representation of a single modifiable
 *  entity (current sheet row's data vs _rawData)
 */
class RowData {
  /**
   * Creates a data representation of a single entity & sheet row.
   * @param {!DV360Entity} payload new value to be uploaded
   * @param {number} sheetIndex index of row within the sheet
   * @param {string} action what to do with this row's data
   * @param {?Array<!AssignedTargetingOption>} targetingOptions if defined
   */
  constructor(payload, sheetIndex, action, targetingOptions) {
    /** @const {!DV360Entity} */
    this.payload = payload;
    /** @const {number} */
    this.sheetIndex = sheetIndex;
    /** @const {string} */
    this.action = action;
    /** @const {?Array<!TargetingOption>} */
    this.targetingOptions = targetingOptions;
  }
}
