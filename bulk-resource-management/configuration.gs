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
 * @fileoverview This Google Apps Script file contains configuration values for
 * the associated Google Spreadsheet. Please get in contact with your
 * designated DV360 representative to obtain a copy of a template
 * spreadsheet that can be used for bulk management.
 */

/**
 * Configuration for each sheet in the associated spreadsheet.
 *
 * @param {string} name: the name of the sheet.
 * @param {string} inputIdCell: the cell value of the main input ID
 *           upon which menu operations will work.
 * @param {int!} headerRow: the header row value of the data table.
 * @param {int!} rangeStartRow: the start row value of the data table.
 * @param {int!} rangeStartCol: the start column value of the data table.
 * @param {int!} primaryIdCol: the column value representing the
 *           entity's primary Id.
 * @param {int!} modificationStatusCol: the column value representing
 *           the modific ation status of the associated row.
 *           One of READ | CREATE | UPDATE | DELETE.
 */
var SHEET_CONFIG = {
  'ADVERTISERS': {
    'name': 'Advertisers',
    'inputIdCell': 'B1',
    'headerRow': 3,
    'rangeStartRow': 4,
    'rangeStartCol': 1,
    'primaryIdCol': 6,
    'modificationStatusCol': 7
  },
  'CAMPAIGNS': {},
  'INSERTION_ORDERS': {},
  'LINE_ITEMS': {},
  'CREATIVES': {}
};
