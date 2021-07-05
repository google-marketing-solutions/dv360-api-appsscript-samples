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
 * @fileoverview This Google Apps Script file contains general utility methods
 * used by the different modules in this application.
 */

class Util {
  /**
   * Extends an object identified by 'original' with the values in 'extension'.
   * 'extension' will be returned if 'original' is null, otherwise 'original'
   * will get extended. Array values in 'extension' will be appended to existing
   * arrays in 'original', however all other objects in 'extension' will
   * override existing counterparts in 'original'. The plain JS type of
   * 'original' will be preserved (if it wasn't null or undefined - i.e. passing
   * an instance of a specific class will not be overrided, rather extended).
   *
   * @param {?Object<string, *>} original The original object to extend, which
   *     may be null
   * @param {!Object<string, *>} extension The value to use for extending
   * @return {!Object<string, *>} The extended object
   */
  static extend(original, extension) {
    if (original == null) {
      return extension;
    }
    for (const key in extension) {
      if (extension.hasOwnProperty(key)) {
        const extensionValue = extension[key];
        const originalValue = original[key];
        if (Array.isArray(extensionValue) && Array.isArray(originalValue)) {
          originalValue.push(...extensionValue);
        } else {
          original[key] = extension[key];
        }
      }
    }
    return original;
  }


  /**
   * Modifies a url by either appending the 'key' and 'value' to the end of the
   * url if the 'key' was not present or replacing the value of the 'key' if it
   * existed. Multiple values for the same key will all be replaced by a single
   * key-value pair at the first seen key location. Assumes that all params have
   * already been URL encoded.
   *
   * @param {string} url The url to modify
   * @param {string} key The key to check if present
   * @param {string} value The value to append / modify
   * @return {string} The modified url
   */
  static modifyUrlQueryString(url, key, value) {
    let baseUrl, queryString, fragment;

    if (url.indexOf('?') !== -1) {
      [baseUrl, queryString] = url.split('?');
      fragment = queryString.indexOf('#') !== -1 ?
          queryString.substring(queryString.indexOf('#')) :
          '';
      queryString = queryString.replace(fragment, '');
      const regExp = new RegExp(`(^|&)${key}=[^&]*`, 'g');
      const matches = queryString.match(regExp);

      if (matches) {
        let modified = false;

        matches.forEach((match) => {
          let replacement = '';

          if (!modified) {
            const val = match.substring(match.indexOf('=') + 1);
            replacement = match.replace(val, value);
            modified = true;
          }
          queryString = queryString.replace(match, replacement);
        });
      } else {
        const separator = queryString.length > 0 ? '&' : '';
        queryString += `${separator}${key}=${value}`;
      }
    } else {
      baseUrl = url;
      queryString = `${key}=${value}`;
      fragment = '';
    }
    return `${baseUrl}?${queryString}${fragment}`;
  }

  /**
   * Unnests field names in an object, producing array of
   *  'field.nestedfield.subnestedfield'
   * @param {!Object<string, *>} ob the one to be scanned
   * @return {!Array<string>} dot-nested FQ field names
   */
  static listDottedFields(ob) {
    return Object.getOwnPropertyNames(Util.flattenObject(ob));
  }

  /**
   * Traverses object's sub-structure and converts it
   *  from {a:{b:{c:"value"}}} to {"a.b.c":"value"}
   * @param {!Object<string, *>} ob
   * @return {!Object<string, *>} Object with the same values but dotted field
   *     names
   */
  static flattenObject(ob) {
    const toReturn = {};
    let flatObject;

    for (const i in ob) {
      if (!ob.hasOwnProperty(i)) {
        continue;
      }
      if ((typeof ob[i]) === 'object') {
        flatObject = this.flattenObject(ob[i]);
        for (const x in flatObject) {
          if (!flatObject.hasOwnProperty(x)) {
            continue;
          }
          toReturn[i + (!!isNaN(x) ? '.' + x : '')] = flatObject[x];
        }
      } else {
        toReturn[i] = ob[i];
      }
    }
    return toReturn;
  }

  /**
   * Retrieves value from nested sub-objects by dot-separated path
   * (aka 'dotted field name')
   * @param {!Object<string, *>} ob
   * @param {string} fieldName
   * @return {*|undefined} value of given sub-field
   */
  static getValueByDottedFieldName(ob, fieldName) {
    if (ob == null) {
      return undefined;
    } else if (fieldName.indexOf('.') == -1) {
      return ob[fieldName];
    } else {
      const firstDotIndex = fieldName.indexOf('.');
      const subObject = ob[fieldName.substring(0, firstDotIndex)];
      const subFieldPath = fieldName.substring(firstDotIndex + 1);
      return Util.getValueByDottedFieldName(subObject, subFieldPath);
    }
  }

  /**
   * @param {!Object<string, *>} ob
   * @param {string} fieldName
   * @param {*} value
   */
  static setValueByDottedFieldName(ob, fieldName, value) {
    if (fieldName.indexOf('.') == -1) {
      ob[fieldName] = value;
    } else {
      const firstDotIndex = fieldName.indexOf('.');
      const firstLevelFieldName = fieldName.substring(0, firstDotIndex);
      const subObject = ob[firstLevelFieldName] || {};
      ob[firstLevelFieldName] = subObject;
      const subFieldPath = fieldName.substring(firstDotIndex + 1);
      Util.setValueByDottedFieldName(subObject, subFieldPath, value);
    }
  }

  /**
   * Reads cell content as JSON or, if it fails, returns it verbatim.
   * @private
   * @param {string} data cell's content
   * @return {!Object<string, *>|string} object or string if not parseable
   */
  static parseCellContent(data) {
    if (data === '' || data == null) {
      return '';
    }
    if (typeof data != 'string') {
      return data.toString();
    }
    if (data.indexOf('{') < 0) {
      return data;
    }
    try {
      return JSON.parse(data);
    } catch (error) {
      // In case not pareseable, return original.
      return data.toString();
    }
  }

  /**
   * Returns an array containing all elements of left
   * that are not present in right one
   * @param {!Array<!Object>} left
   * @param {!Array<!Object>} right
   * @return {!Array<!Object>}
   */
  static difference(left, right) {
    return left.filter((object) => !Util.isIn(object, right));
  }

  /**
   *
   * @param {!Object<string, *>} object
   * @param {!Array<!Object>} array
   * @return {boolean}
   */
  static isIn(object, array) {
    const filtered = array.filter((member) => {
      return JSON.stringify(member) === JSON.stringify(object);
    });
    return filtered.length > 0;
  }
}

class ApiUtil {
  /**
   * Executes single GET request and fires callback once for each returned page.
   * @param {string} requestUri path to query
   * @param {function(!Object<string, *>): undefined} callback
   *   executed with each page of response
   */
  static executeApiGetRequest(requestUri, callback) {
    const requestParams = {
      'method': 'get',
    };
    ApiUtil.executeGenericRequest_(requestUri, requestParams, callback);
  }

  /**
   * Executes single PATCH request and fires callback.
   * @param {string} requestUri path to query
   * @param {!Object<string, *>} payload what to include as body
   * @param {function(!Object<string, *>): undefined} callback
   *   executed with each page of response
   */
  static executeApiPatchRequest(requestUri, payload, callback) {
    const requestParams = {
      method: 'patch',
      payload: JSON.stringify(payload),
    };
    ApiUtil.executeGenericRequest_(requestUri, requestParams, callback);
  }

  /**
   * Executes single CREATE request and fires callback.
   * @param {string} requestUri path to query
   * @param {!Object<string, *>} payload what to include as body
   * @param {function(!Object<string, *>): undefined} callback
   *   executed with each page of response
   */
  static executeApiPostRequest(requestUri, payload, callback) {
    const requestParams = {
      method: 'post',
      payload: JSON.stringify(payload),
    };
    ApiUtil.executeGenericRequest_(requestUri, requestParams, callback);
  }

  /**
   * Executes single DELETE request and fires callback.
   * @param {string} requestUri path to query
   * @param {function(!Object<string, *>): undefined} callback
   *   executed with each page of response
   */
  static executeApiDeleteRequest(requestUri, callback) {
    const requestParams = {
      method: 'delete',
    };
    ApiUtil.executeGenericRequest_(requestUri, requestParams, callback);
  }

  /**
   * Runs REST request using UrlFetchApp. Handles paging, executing
   * callbacks and errors. No retries.
   * Will call callback once per resulting page.
   * Will call errback when there's non-2XX response.
   * @private
   * @param {string} requestUri path to call
   * @param {!Object<string, string>} requestParams params to include
   *     (UrlFetchApp format)
   * @param {function(!Object<string, *>): undefined} callback to be called once
   *     per page
   */
  static executeGenericRequest_(requestUri, requestParams, callback) {
    const baseUrl = ApiUtil.buildApiUrl_(requestUri);
    const params = ApiUtil.buildApiParams_(requestParams);

    let url = baseUrl;
    let morePages = true;
    while (morePages) {
      console.log(`Fetching ${params.method} request from ${url}`);
      const response = UrlFetchApp.fetch(url, params);
      if (response.getResponseCode() / 100 !== 2) {
        throw new Error(response.getContentText());
      }
      const result = response.getContentText() ?
          JSON.parse(response.getContentText()) :
          {};
      callback(result);
      morePages = result.nextPageToken != undefined;
      if (morePages) {
        url = Util.modifyUrlQueryString(url, 'pageToken', result.nextPageToken);
      }
    }
  }

  /**
   * Takes in a string with placeholders like ${variable}
   * and replaces them with values found in selected sheet's top part.
   * @param {string} input (partial) uri with placeholders
   * @param {?Object<string, string>} params values to replace in input
   * @return {string} uri with replaced placeholders
   */
  static replaceInputValues(input, params) {
    let output = input;
    if (params == null) {
      return input;
    }
    for (const [name, value] of Object.entries(params)) {
      output = output.replace('${' + name + '}', value);
    }
    return output;
  }

  /**
   * Constructs the fully-qualified URL to the DV360 API using the
   * given @param {requestUri}.
   * @private
   * @param {string} requestUri: the URI of the specific Resource to request.
   * @return {string} representing the fully-qualified DV360 API URL.
   */
  static buildApiUrl_(requestUri) {
    const apiEndpoint = 'https://displayvideo.googleapis.com';
    const apiVersion = 'v1';

    return `${apiEndpoint}/${apiVersion}/${requestUri}`;
  }

  /**
   * Constructs the options to use for the DV360 API request, extending
   * some default options with the given @param {requestParams}.
   * @private
   * @param {!Object<string, string>} requestParams: the options to use for the
   *     request.
   * @return {!Object<string, *>} representing the extended request options to
   *     use.
   * @see {utils.gs} @link {Util.extend}.
   */
  static buildApiParams_(requestParams) {
    const token = ScriptApp.getOAuthToken();
    let params = {
      contentType: 'application/json',
      headers: {Authorization: `Bearer ${token}`, Accept: 'application/json'},
      muteHttpExceptions: true,
    };
    params = Util.extend(params, requestParams);

    return params;
  }
}

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
    const value = `${object.year}-${object.month}-${object.day}`;
    return value;
  }

  /**
   *
   * @param {string} cellContent
   * @return {!Object} value ready to put into entity field
   */
  toEntityField(cellContent) {
    const date = new Date(cellContent);
    return {
      'year': date.getFullYear(),
      'month': date.getMonth() + 1,
      'day': date.getDate(),
    };
  }
}

class SheetUtil {
  /**
   * Returns the value of the given cell for the given sheet.
   * @private
   * @param {string} sheetName: the name of the sheet.
   * @param {string} cellId: the ID of the cell in 'A1 Notation'.
   * @return {string} the value of the cell as maintained in the sheet.
   */
  static getCellValue_(sheetName, cellId) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const partnerIdCell =
        spreadsheet.getRange(sheetName + '!' + cellId + ':' + cellId);

    return partnerIdCell.getValue();
  }

  /**
   * Writes the given value to the given cell in the given sheet.
   * @private
   * @param {string} sheetName The name of the sheet.
   * @param {number} row The row of the cell
   * @param {number} column The column of the cell
   * @param {string} value The value to write in the cell
   */
  static writeCellValue(sheetName, row, column, value) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName);
    sheet.getRange(row, column, 1, 1).setValues([[value]]);
    SpreadsheetApp.flush();
  }

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
  static outputInRange(sheetName, rangeStartRow, rangeStartCol, output) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName);

    sheet
        .getRange(rangeStartRow, rangeStartCol, output.length, output[0].length)
        .setValues(output);
    SpreadsheetApp.flush();
  }

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
  static appendOutputToRange(sheetName, rangeStartCol, output) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName);

    const lastRow = sheet.getLastRow() + 1;

    sheet.getRange(lastRow, rangeStartCol, output.length, output[0].length)
        .setValues(output);
    SpreadsheetApp.flush();
  }

  /**
   * Clears all entity data in the specified sheet.
   *
   * @param {!SheetConfig} sheetConfig for the spreadsheet to clean
   */
  static clearData(sheetConfig) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetConfig.name);

    sheet
        .getRange(
            sheetConfig.rangeStartRow, sheetConfig.rangeStartCol,
            sheet.getLastRow(), sheet.getLastColumn())
        .clearContent();
  }

  /**
   * Returns the row data for the given sheet and range as a two-dimensional
   * Array of length 1.
   *
   * @param {string} sheetName: the name of the sheet.
   * @param {number} rangeRow: the row index of data to return.
   * @param {number} rangeStartCol: the first column index of data to return.
   * @return {?Array<!Array<string>>} the two-dimensional
   *   of length 1 representing the row data.
   */
  static getRowData(sheetName, rangeRow, rangeStartCol) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName);
    const lastCol = sheet.getLastColumn();
    return sheet.getRange(rangeRow, rangeStartCol, 1, lastCol).getValues();
  }

  /**
   * Returns values in header row of selected sheet
   * as a 1-dim Array.
   * @param {!SheetConfig} sheetConfig of selected sheet
   * @return {!Array<!RowData>} array names from header row of the sheet
   */
  static getHeaderRowData(sheetConfig) {
    return this.getRowData(sheetConfig.name, sheetConfig.headerRow, 1)[0];
  }

  /**
   * Retrieves value of input cell configured in configuration.js
   *
   * @param {!SheetConfig} sheetConfig of selected sheet
   * @return {string} input values
   */
  static getInputCellValues(sheetConfig) {
    const inputValues = {};
    for (const [name, cellId] of Object.entries(sheetConfig['inputCells'])) {
      const value = SheetUtil.getCellValue_(sheetConfig['name'], cellId);
      inputValues[name] = value;
    }
    return inputValues;
  }

  /**
   * Reads all rows of a sheet designated by sheetConfig
   * and returns cell values as {!Array<!RowData>}
   * @param {!SheetConfig} sheetConfig
   * @return {!Array<string>}
   */
  static readDataRows(sheetConfig) {
    const sheet =
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetConfig.name);
    const headerRow = this.getHeaderRowData(sheetConfig);
    const rowCount = sheet.getLastRow() - sheetConfig.rangeStartRow + 1;
    const columnCount = headerRow.length - sheetConfig.rangeStartCol + 1;
    if (rowCount < 1 || columnCount < 1) {
      return [];
    }
    const data = sheet
                     .getRange(
                         sheetConfig.rangeStartRow, sheetConfig.rangeStartCol,
                         rowCount, columnCount)
                     .getValues();
    return data;
  }

  /**
   * Returns currently selected row (number) for chosen sheet.
   * Throws error if currently selected row isn't in data part of the sheet,
   * or if
   * @param {!SheetConfig} sheetConfig to look into
   * @return {number } row number that's currently selected
   */
  static getCurrentlySelectedDataRowNumber(sheetConfig) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetConfig.name);
    const rowNumber = sheet.getActiveCell().getRowIndex();
    if (rowNumber < sheetConfig.rangeStartRow) {
      throw new Error(
          `Selected cell in sheet ${sheetConfig.name}` +
          'is not in data range');
    }
    return rowNumber;
  }

  /**
   * Removes row from the sheet by sheet name and number
   * @param {!SheetConfig} sheetConfig
   * @param {!Array<number>} rowNumbers
   */
  static deleteSheetRows(sheetConfig, rowNumbers) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetConfig.name);

    const reindexedRows = rowNumbers.map((number, index) => number - index);
    reindexedRows.forEach((number) => sheet.deleteRow(number));
  }
}
