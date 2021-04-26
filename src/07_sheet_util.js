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
 * @fileoverview This Google Apps Script file contains utility methods that
 * facilitate the interaction with the underlying @link {SpreadsheetApp}, such
 * as reading from and writing data to the associated spreadsheet.
 */

/**
 * Base class to transform entity field to cell value
 * and back into entity field
 */
class CellTranslator {
  /**
   *
   * @param {*} input
   */
  toDisplayValue(input) {
    throw new Error('Not Implemented');
  }

  /**
   *
   * @param {string} cellContent
   */
  toEntityField(cellContent) {
    throw new Error('Not Implemented');
  }
}

/**
 *
 */
class DateTranslator extends CellTranslator {
  /**
   *
   * @param {*} input
   * @return {string}
   */
  toDisplayValue(input) {
    const object = JSON.parse(input);
    const value = `${Object.year}-${Object.month}-${Object.day}`;
    return value;
  }

  /**
   *
   * @param {string} cellContent
   * @return {Object} value ready to put into entity field
   */
  toEntityField(cellContent) {
    const date = new Date(cellContent);
    return {'year': date.getFullYear(),
      'month': date.getMonth()+1,
      'day': date.getDate(),
    };
  }
}

const SheetUtil = {

  DATE_TRANSLATOR: new DateTranslator(),

  /**
   * Returns the value of the given cell for the given sheet.
   * @private
   * @param {string} sheetName: the name of the sheet.
   * @param {string} cellId: the ID of the cell in 'A1 Notation'.
   * @return {string} the value of the cell as maintained in the sheet.
   */
  getCellValue_: function(sheetName, cellId) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const partnerIdCell =
        spreadsheet.getRange(sheetName + '!' + cellId + ':' + cellId);

    return partnerIdCell.getValue();
  },

  writeCellValue: function(sheetName, row, column, value) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName);
    sheet.getRange(row, column, 1, 1).setValues([[value]]);
    SpreadsheetApp.flush();
  },

  /**
   * Writes the given two-dimensional Array of data to the specified
   * sheet, starting from the given range row and column values.
   * @private
   * @param {string} sheetName the name of the sheet.
   * @param {number} rangeStartRow the first row index to write data in.
   *           Minimum value is 1.
   * @param {number} rangeStartCol the first column index to write data to.
   *           Minimum value is 1.
   * @param {!Array<!RowData>} output the two-dimensional
   *   array of data to write.
   */
  outputInRange: function(sheetName, rangeStartRow, rangeStartCol, output) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName);

    sheet
        .getRange(rangeStartRow, rangeStartCol, output.length, output[0].length)
        .setValues(output);
    SpreadsheetApp.flush();
  },

  /**
   * Writes the given two-dimensional Array of data to the specified
   * sheet, appending the data to any already existing data in the
   *
   * @param {string} sheetName: the name of the sheet.
   * @param {number} rangeStartCol: the first column index to write data to.
   *           Minimum value is 1.
   * @param {!Array<!RowData>} output: the two-dimensional
   *   array of data to write.
   */
  appendOutputToRange: function(sheetName, rangeStartCol, output) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName);

    const lastRow = sheet.getLastRow() + 1;

    sheet.getRange(lastRow, rangeStartCol, output.length, output[0].length)
        .setValues(output);
    SpreadsheetApp.flush();
  },

  /**
   * Clears all entity data in the specified sheet.
   *
   * @param {!SheetConfig} sheetConfig for the spreadsheet to clean
   */
  clearData: function(sheetConfig) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetConfig.name);

    sheet.getRange(
        sheetConfig.rangeStartRow,
        sheetConfig.rangeStartCol,
        sheet.getLastRow(),
        sheet.getLastColumn())
        .clearContent();
  },

  /**
   * Returns the row data for the given sheet and range as a two-dimensional
   * Array of length 1.
   *
   * @param {string} sheetName: the name of the sheet.
   * @param {!number} rangeRow: the row index of data to return.
   * @param {!number} rangeStartCol: the first column index of data to return.
   * @return {?Array<!Array<string>>} the two-dimensional
   *   of length 1 representing the row data.
   */
  getRowData: function(sheetName, rangeRow, rangeStartCol) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName);
    const lastCol = sheet.getLastColumn();
    return sheet.getRange(rangeRow, rangeStartCol, 1, lastCol).getValues();
  },

  /**
   * Returns values in header row of selected sheet
   * as a 1-dim Array.
   * @param {!SheetConfig} sheetConfig of selected sheet
   * @return {!Array<!RowData>} array names from header row of the sheet
   */
  getHeaderRowData: function(sheetConfig) {
    return this.getRowData(sheetConfig.name, sheetConfig.headerRow, 1)[0];
  },

  /**
   * Retrieves value of input cell configured in configuration.js
   *
   * @param {!SheetConfig} sheetConfig of selected sheet
   * @return {string} input values
   */
  getInputCellValues: function(sheetConfig) {
    const inputValues = {};
    for (const [name, cellId] of Object.entries(sheetConfig['inputCells'])) {
      const value = SheetUtil.getCellValue_(sheetConfig['name'], cellId);
      inputValues[name] = value;
    }
    return inputValues;
  },

  /**
   * Reads all rows of a sheet designated by sheetConfig
   * and returns cell values as {!Array<!RowData>}
   * @param {!SheetConfig} sheetConfig
   * @return {!Array<string>}
   */
  readDataRows: function(sheetConfig) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
        .getSheetByName(sheetConfig.name);
    const headerRow = this.getHeaderRowData(sheetConfig);
    const rowCount = sheet.getLastRow() - sheetConfig.rangeStartRow + 1;
    const columnCount = headerRow.length - sheetConfig.rangeStartCol + 1;
    if (rowCount<1 || columnCount<1) {
      return [];
    }
    const data = sheet.getRange(
        sheetConfig.rangeStartRow,
        sheetConfig.rangeStartCol,
        rowCount,
        columnCount
    ).getValues();
    return data;
  },
  /**
   * Returns currently selected row (number) for chosen sheet.
   * Throws error if currently selected row isn't in data part of the sheet,
   * or if
   * @param {!SheetConfig} sheetConfig to look into
   * @return {number } row number that's currently selected
   */
  getCurrentlySelectedDataRowNumber: function(sheetConfig) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetConfig.name);
    const rowNumber = sheet.getActiveCell().getRowIndex();
    if (rowNumber < sheetConfig.rangeStartRow) {
      throw new Error(`Selected cell in sheet ${sheetConfig.name}` +
        'is not in data range');
    }
    return rowNumber;
  },

  /**
   * Removes row from the sheet by sheet name and number
   * @param {SheetConfig} sheetConfig
   * @param {!Array<number>} rowNumbers
   */
  deleteSheetRows: function(sheetConfig, rowNumbers) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetConfig.name);

    const reindexedRows = rowNumbers.map((number, index) => number - index);
    reindexedRows.forEach((number) => sheet.deleteRow(number));
  },
};

