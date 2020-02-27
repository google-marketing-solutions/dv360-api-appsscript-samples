/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * This Google Apps Script file contains utility methods that facilitate
 * the interaction with the underlying @link {SpreadsheetApp}, such as
 * reading from and writing data to the associated spreadsheet.
 */

var SheetUtil = {

  /**
   * Returns the value of the given cell for the given sheet.
   *
   * @param {sheetName}: the name of the sheet.
   * @param {cellId}: the ID of the cell in 'A1 Notation'.
   *
   * @return the value of the cell as maintained in the sheet.
   */
  getCellValue: function(sheetName, cellId) {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var partnerIdCell = spreadsheet.getRange(sheetName + '!' + cellId + ':' + cellId);

    return partnerIdCell.getValue();
  },

  /**
   * Writes the given two-dimensional array of data to the specified
   * sheet, starting from the given range row and column values.
   *
   * @param {sheetName}: the name of the sheet.
   * @param {rangeStartRow}: the first row index to write data in.
   *          Minimum value is 1.
   * @param {rangeStartCol}: the first column index to write data to.
   *          Minimum value is 1.
   * @param {output}: the two-dimensional array of data to write.
   */
  outputInRange: function(sheetName, rangeStartRow, rangeStartCol, output) {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(sheetName);

    sheet
      .getRange(rangeStartRow, rangeStartCol, output.length, output[0].length)
      .setValues(output);
  },

  /**
   * Writes the given two-dimensional array of data to the specified
   * sheet, appending the data to any already existing data in the
   * specified range.
   *
   * @param {sheetName}: the name of the sheet.
   * @param {rangeStartCol}: the first column index to write data to.
   *          Minimum value is 1.
   * @param {output}: the two-dimensional array of data to write.
   */
  appendOutputToRange: function(sheetName, rangeStartCol, output) {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(sheetName);

    var lastRow = sheet.getLastRow() + 1;

    sheet
      .getRange(lastRow, rangeStartCol, output.length, output[0].length)
      .setValues(output);
  },

  /**
   * Clears all data in the specified range of the given sheet.
   *
   * @param {sheetName}: the name of the sheet.
   * @param {rangeStartRow}: the first row index of data.
   * @param {rangeStartCol}: the first column index of data.
   */
  clearRange: function(sheetName, rangeStartRow, rangeStartCol) {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(sheetName);

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    sheet
      .getRange(rangeStartRow, rangeStartCol, lastRow, lastCol)
      .clearContent();
  },

  /**
   * Returns the row data for the given sheet and range as a two-dimensional
   * array of length 1.
   *
   * @param {sheetName}: the name of the sheet.
   * @param {rangeRow}: the row index of data to return.
   * @param {rangeStartCol}: the first column index of data to return.
   *
   * @return the two-dimensional array of length 1 representing the row data.
   */
  getRowData: function(sheetName, rangeRow, rangeStartCol) {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(sheetName);

    var lastCol = sheet.getLastColumn();

    return sheet
      .getRange(rangeRow, rangeStartCol, 1, lastCol)
      .getValues();
  },

  /**
   * Searches for all rows matching any of the given @param {values} within
   * the specified sheet and range.
   *
   * @param {values}: array of values to search for in the given range.
   * @param {sheetName}: the name of the sheet.
   * @param {rangeStartRow}: the starting row index of data to search in.
   * @param {rangeStartCol}: the first column index of data to search in.
   * @param {rangeEndCol}: the last column index of data to search in.
   *
   * @return {Object} containing a two-dimensional array of matched rows
   *          for each value in @param {values}.
   */
  findInRange: function(values, sheetName, rangeStartRow, rangeStartCol, rangeEndCol) {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(sheetName);

    var lastRow = sheet.getLastRow();
    var range = sheet
      .getRange(rangeStartRow, rangeStartCol, lastRow, Math.max(rangeEndCol - rangeStartCol, 1))
      .getValues();
    var results = {};

    values.forEach(function(value) {
      results[value] = [];
    });

    for (var row = 0; row < range.length; row++) {
      for (var col = 0; col < range[row].length; col++) {
        values.forEach(function(value) {
          if (range[row][col] == value) {
            results[value].push(rangeStartRow + row);
          }
        });
      }
    }
    return results;
  },

  /**
   * Deletes a row in the given sheet.
   *
   * @param {sheetName}: the name of the sheet.
   * @param {row}: the row index to delete.
   */
  deleteRow: function(sheetName, row) {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(sheetName);

    sheet.deleteRow(row);
  },

};
