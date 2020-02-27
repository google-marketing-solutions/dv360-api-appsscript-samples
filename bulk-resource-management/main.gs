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
 * This Google Apps Script file contains methods representing the main
 * entry and interaction points with the associated Google Spreadsheet.
 * The methods here directly utilize the @link {SpreadsheetApp}
 * properties and delegate any functionality beyond that to other
 * modules.
 *
 * @see {configuration.gs} for sheet-specific configuration values.
 */

/**
 * Creates an Add-on menu and accompanying sub-menus to handle different
 * DV360 API operations, grouped by the associated API operation resource.
 */
function onOpen() {
  var advertisersSubMenu = SpreadsheetApp.getUi()
    .createMenu('Advertisers')
    .addItem('List Advertisers', 'listAdvertisers')
    .addItem('Modify Advertisers', 'modifyAdvertisers');

  SpreadsheetApp.getUi()
    .createAddonMenu()
    .addSubMenu(advertisersSubMenu)
    .addToUi();
}

/**
 * Extracts the 'Partner Id' from the 'Advertisers' Sheet and uses it
 * to fetch all associated advertisers from the @link {ApiResource}.
 *
 * @see {api_resources.gs}.
 */
function listAdvertisers() {
  var sheetConfig = SHEET_CONFIG['ADVERTISERS'];
  var partnerId = SheetUtil.getCellValue(
    sheetConfig['name'],
    sheetConfig['inputIdCell']);

  ApiResource.Advertiser.listAdvertisers(partnerId);
}

/**
 * Reads the data table to extract different operations, then
 * delegates processing to each operation's dedicated handler.
 * The operations are defined by the
 * @link {SHEET_CONFIG.SHEET.modificationStatusCol} values.
 *
 * @see {configuration_gs}.
 */
function modifyAdvertisers() {
  var sheetConfig = SHEET_CONFIG['ADVERTISERS'];

  var results = SheetUtil.findInRange(
    ['UPDATE', 'CREATE', 'DELETE'],
    sheetConfig['name'],
    sheetConfig['rangeStartRow'],
    sheetConfig['modificationStatusCol'],
    sheetConfig['modificationStatusCol']);

  var handlers = {
    'CREATE': createAdvertisers,
    'UPDATE': patchAdvertisers,
    'DELETE': deleteAdvertisers,
  }

  for (modification in results) {
    var rows = results[modification];

    if (rows.length !== 0) {
      var method = handlers[modification];
      method(rows);
    }
  }
}

/**
 * Dedicated handler for the CREATE Advertiser operation.
 *
 * @param {advertiserRows}: the affected sheet rows containing
 *          advertisers to be created.
 */
function createAdvertisers(advertiserRows) {
  var sheetConfig = SHEET_CONFIG['ADVERTISERS'];

  var headerData = SheetUtil.getRowData(
    sheetConfig['name'],
    sheetConfig['headerRow'],
    sheetConfig['rangeStartCol']);
  var partnerId = SheetUtil.getCellValue(
    sheetConfig['name'],
    sheetConfig['inputIdCell']);

  advertiserRows.forEach(function(row) {
    var rowData = SheetUtil.getRowData(
      sheetConfig['name'],
      row,
      sheetConfig['rangeStartCol']);

    ApiResource.Advertiser.createAdvertiser(row, rowData, headerData, partnerId);
  });
}

/**
 * Dedicated handler for the PATCH Advertiser operation.
 *
 * @param {advertiserRows}: the affected sheet rows containing
 *          advertisers to be patched.
 */
function patchAdvertisers(advertiserRows) {
  var sheetConfig = SHEET_CONFIG['ADVERTISERS'];

  var headerData = SheetUtil.getRowData(
    sheetConfig['name'],
    sheetConfig['headerRow'],
    sheetConfig['rangeStartCol']);

  advertiserRows.forEach(function(row) {
    var rowData = SheetUtil.getRowData(
      sheetConfig['name'],
      row,
      sheetConfig['rangeStartCol']);

    ApiResource.Advertiser.patchAdvertiser(row, rowData, headerData);
  });
}

/**
 * Dedicated handler for the DELETE Advertiser operation.
 *
 * @param {advertiserRows}: the affected sheet rows containing
 *          advertisers to be deleted.
 */
function deleteAdvertisers(advertiserRows) {
  var sheetConfig = SHEET_CONFIG['ADVERTISERS'];

  advertiserRows.forEach(function(row) {
    var rowData = SheetUtil.getRowData(
      sheetConfig['name'],
      row,
      sheetConfig['primaryIdCol']);

    ApiResource.Advertiser.deleteAdvertiser(row, rowData);
  });
}
