/* eslint-disable no-unused-vars */
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
 * @fileoverview This Google Apps Script file contains methods representing the
 * main entry and interaction points with the associated Google Spreadsheet.
 * The methods here directly utilize the @link {SpreadsheetApp}
 * properties and delegate any functionality beyond that to other
 * modules.
 *
 * @see {configuration.gs} for sheet-specific configuration values.
 */

/**
 * Downloads list of advertisers and fills the sheet with data.
 */
function downloadAdvertisers() {
  const resource = new DV360Sheet(SHEET_CONFIG.ADVERTISERS);
  resource.download();
}

/**
 * Downloads and displays campaigns for selected advertiser
 */
function downloadCampaigns() {
  const resource = new DV360Sheet(SHEET_CONFIG.CAMPAIGNS);
  resource.download();
}

/**
 * Upload changes from campaign sheet to DV360.
 */
function uploadCampaigns() {
  const resource = new DV360Sheet(SHEET_CONFIG.CAMPAIGNS);
  resource.uploadChanges();
}

/**
 * Downloads insertion orders for selected campaign.
 */
function downloadInsertionOrders() {
  const resource = new DV360Sheet(SHEET_CONFIG.INSERTION_ORDERS);
  resource.download();
}

/**
 * Uploads changes to insertion orders to DV360.
 */
function uploadInsertionOrders() {
  const resource = new DV360Sheet(SHEET_CONFIG.INSERTION_ORDERS);
  resource.uploadChanges();
}

/**
 * Downloads all line items of selected IO into the sheet.
 */
function downloadLineItems() {
  const resource = new DV360Sheet(SHEET_CONFIG.LINE_ITEMS);
  resource.download();
}

/**
 * Upload all changes from the sheet into DV360
 */
function uploadLineItems() {
  const resource = new DV360Sheet(SHEET_CONFIG.LINE_ITEMS);
  resource.uploadChanges();
}

/**
 * Lists all creatives
 */
function downloadCreatives() {
  const resource = new DV360Sheet(SHEET_CONFIG.CREATIVES);
  resource.download();
}
/**
 *
 */
function downloadTargetingOptions() {
  const resource = new DV360Sheet(SHEET_CONFIG.TARGETING_OPTIONS);
  resource.download();
}
/**
 *
 */
function searchTargetingOptions() {
  const resource = new DV360Sheet(SHEET_CONFIG.TARGETING_OPTIONS_SEARCH);
  resource.download();
}
