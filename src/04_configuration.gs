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
 */
class SheetConfig {
  /**
   * Creates a new SheetConfig object
   * @param {string} sheetName name of sheet controlled by this config
   * @param {!DV360Resource} dv360resource resource to query
   * @param {!Object} inputCells where to find common parameters to queries
   * @param {number=} headerRow row number of field naming header
   * @param {!Array<!CellTranslator>=} cellTranslators
   */
  constructor(
      sheetName, dv360resource, inputCells, headerRow = 4,
      cellTranslators = {}) {
    if (!sheetName || !dv360resource || !inputCells) {
      throw new Error('Incorrect config!');
    }
    /** @const {string} */
    this.name = sheetName;
    /** @const {!DV360Resource} */
    this.dv360resource = dv360resource;
    /** @const {!Object} */
    this.inputCells = inputCells;
    /** @const {number} */
    this.headerRow = headerRow;
    /** @const {number} */
    this.rangeStartRow = headerRow + 1;
    /** @const {number} */
    this.rangeStartCol = 1;
    /** @const {number} */
    this.primaryIdCol = 3;
    /** @const {!Object} */
    this.cellTranslators = cellTranslators;
  }
}

// eslint-disable-next-line no-unused-vars
const DATE_TRANSLATOR = new DateTranslator();
const SHEET_CONFIG = {
  ADVERTISERS:
      new SheetConfig('Advertisers', DV360.Advertisers, {partnerId: 'B1'}, 4),
  CAMPAIGNS:
      new SheetConfig('Campaigns', DV360.Campaigns, {advertiserId: 'C1'}, 4, {
        'campaignFlight.plannedDates.startDate': DATE_TRANSLATOR,
        'campaignFlight.plannedDates.endDate': DATE_TRANSLATOR,
      }),
  INSERTION_ORDERS: new SheetConfig(
      'Insertion Orders', DV360.InsertionOrders,
      {advertiserId: 'C1', campaignId: 'C2'}),
  LINE_ITEMS: new SheetConfig(
      'Line Items', DV360.LineItems,
      {advertiserId: 'C1', campaignId: 'C2', insertionOrderId: 'C3'}, 4, {
        'flight.dateRange.startDate': DATE_TRANSLATOR,
        'flight.dateRange.endDate': DATE_TRANSLATOR,
      }),
  CREATIVES: new SheetConfig(
      'Creatives', DV360.Creatives, {advertiserId: 'C1', lineItemId: 'C3'}),
  TARGETING_OPTIONS: new SheetConfig(
      'Targeting Options', DV360.LineItemTargetingOptions,
      {advertiserId: 'C1', lineItemId: 'C4'}, 5),
  TARGETING_OPTIONS_SEARCH: new SheetConfig(
      'Search Targeting Options', DV360.SearchTargetingOptions,
      {advertiserId: 'C1', targetingType: 'C2'}),
};
