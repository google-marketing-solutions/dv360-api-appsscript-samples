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
   * @param {string} uri path used as basis for API calls
   * @param {string} apiFieldName name of array in GET response
   * @param {!Object} inputCells where to find common parameters to queries
   * @param {string} filter part of URI to narrow GET results
   */
  constructor(sheetName, uri, apiFieldName, inputCells, filter = '') {
    if (!sheetName || !uri || !apiFieldName || !inputCells) {
      throw new Error('Incorrect config!');
    }
    /** @const {string} */
    this.name = sheetName;
    /** @const {string} */
    this.uri = uri;
    /** @const {string} */
    this.apiFieldName = apiFieldName;
    /** @const {!Object} */
    this.inputCells = inputCells;
    /** @const {string} */
    this.filter = filter;
    /** @const {number} */
    this.headerRow = 4;
    /** @const {number} */
    this.rangeStartRow = 5;
    /** @const {number} */
    this.rangeStartCol = 1;
    /** @const {number} */
    this.primaryIdCol = 2;
  }
}

// eslint-disable-next-line no-unused-vars
const SHEET_CONFIG = {
  ADVERTISERS: new SheetConfig(
      'Advertisers',
      'advertisers?partnerId=${partnerId}',
      'advertisers',
      {partnerId: 'B1'}),
  CAMPAIGNS: new SheetConfig(
      'Campaigns',
      'advertisers/${advertiserId}/campaigns',
      'campaigns',
      {advertiserId: 'C1'}),
  INSERTION_ORDERS: new SheetConfig(
      'Insertion Orders',
      'advertisers/${advertiserId}/insertionOrders',
      'insertionOrders',
      {advertiserId: 'C1', campaignId: 'C2'},
      'campaignId=${campaignId}'),
  LINE_ITEMS: new SheetConfig(
      'Line Items',
      'advertisers/${advertiserId}/lineItems',
      'lineItems',
      {advertiserId: 'C1', campaignId: 'C2', insertionOrderId: 'C3'},
      'campaignId=${campaignId} AND insertionOrderId=${insertionOrderId}'),
  CREATIVES: new SheetConfig(
      'Creatives',
      'advertisers/${advertiserId}/creatives',
      'creatives',
      {advertiserId: 'C1', campaignId: 'C2'},
      'campaignId=${campaignId}'),
};
