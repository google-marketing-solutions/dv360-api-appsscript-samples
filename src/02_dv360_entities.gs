/* eslint-disable no-unused-vars */
/**
 * @license
 *
 * Copyright 2021 Google LLC
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
 * Base (abstract) class representing a DV360 Entity.
 */
class DV360Entity {
  /**
   * Shorthand to mass-rewrite values into new Entity.
   * Doesn't do any checks.
   * @param {!Object} obj
   * @param {!Array<string>} fieldList that must exist
   */
  constructor(obj, fieldList) {
    /** @private */
    this.fieldList_ = fieldList;
    Object.assign(this, obj);
  }

  /**
   * Checks if all fields that should be defined for this entity
   * do indeed have values assigned.
   */
  verifyRequiredFields() {
    this.fieldList_.forEach((field) => {
      if (obj[field] == null) {
        throw new Error(`Required field ${field} is undefined`);
      }
    });
  }

  /**
   * Produces comma-separated string of fields that differ between this
   * (original) and given other object (for use in PATCH calls).
   * @private
   * @param {!DV360Entity} modified object to compare 'this' with
   * @return {string} patch mask for DV360 API
   */
  getPatchMask(modified) {
    const changedFields =
        Object.getOwnPropertyNames(modified)
            .filter((field) => field != this.primaryIdField_)
            .filter((field) => field != 'updateTime')
            .filter(
                (field) => Util.getValueByDottedFieldName(modified, field) !=
                    Util.getValueByDottedFieldName(this, field));
    const mask = changedFields.join(',');
    return mask;
  }

  /**
   * Abstract method for listing Targetting Options assigned
   * to this entity (not all Entities should have this method implemented).
   * @return {!Array<!AssignedTargetingOption>}
   */
  listTargetingOptions() {
    return [];
  }
}
/**
 * Advertised entity.
 */
class Advertiser extends DV360Entity {
  /**
   * @param {!Object} obj
   */
  constructor(obj) {
    super(obj, [
      'name',
      'advertiserId',
      'partnerId',
      'displayName',
      'entityStatus',
      'updateTime',
      'generalConfig',
      'adServerConfig',
      'creativeConfig',
      'dataAccessConfig',
      'integrationDetails',
      'servingConfig',
    ]);
  }

  /**
   * Fetches all Campaigns of this Advertiser.
   * @return {!Array<!Campaign>}
   */
  listCampaigns() {
    return DV360.Campaigns.list({advertiserId: this.advertiserId});
  }
}

/**
 * Campaign Entity.
 */
class Campaign extends DV360Entity {
  /**
   * @param {!Object} obj
   */
  constructor(obj) {
    super(obj, [
      'name',
      'advertiserId',
      'campaignId',
      'displayName',
      'entityStatus',
      'updateTime',
      'campaignGoal',
      'campaignFlight',
      'frequencyCap',
    ]);
  }

  /**
   * Fetches all Insertion Orders of this Campaign.
   * @return {!Array<!InsertionOrder>}
   */
  listInsertionOrders() {
    return DV360.InsertionOrders.list(
        {advertiserId: this.advertiserId, campaignId: this.campaignId});
  }
}

/**
 * Insertion Order Entity.
 */
class InsertionOrder extends DV360Entity {
  /**
   * @param {!Object} obj
   */
  constructor(obj) {
    super(obj, [
      'name',
      'advertiserId',
      'campaignId',
      'insertionOrderId',
      'displayName',
      'insertionOrderType',
      'entityStatus',
      'updateTime',
      'partnerCosts',
      'pacing',
      'frequencyCap',
      'integrationDetails',
      'performanceGoal',
      'budget',
      'bidStrategy',
    ]);
  }
  /**
   * Fetches Line Items under this Insertion Order
   * @return {!Array<!LineItem>}
   */
  listLineItems() {
    return DV360.LineItems.list({
      advertiserId: this.advertiserId,
      campaignId: this.campaignId,
      insertionOrderId: this.insertionOrderId
    });
  }
}

/**
 * Line Item Entity.
 */
class LineItem extends DV360Entity {
  /**
   * @param {!Object} obj
   */
  constructor(obj) {
    super(obj, [
      'name',
      'advertiserId',
      'campaignId',
      'insertionOrderId',
      'lineItemId',
      'displayName',
      'lineItemType',
      'entityStatus',
      'updateTime',
      'partnerCosts',
      'flight',
      'budget',
      'pacing',
      'frequencyCap',
      'partnerRevenueModel',
      'conversionCounting',
      'creativeIds',
      'bidStrategy',
      'integrationDetails',
      'inventorySourceIds',
      'targetingExpansion',
      'warningMessages',
      'mobileApp',
    ]);
  }
  /**
   * Fetches all Targeting Options of this Line Item.
   * This includes inherited and non-inherited TOs.
   * @return {!Array<!AssignedTargetingOption>}
   */
  listTargetingOptions() {
    return DV360.LineItemTargetingOptions.list({
      advertiserId: this.advertiserId,
      lineItemId: this.lineItemId,
    });
  }
  /**
   * Replaces currently assigned Targeting Options of this Line Item
   * with the given Array.
   * @param {!Array<!AssignedTargetingOption>} newOptions
   * @return {!Array<!AssignedTargetingOption>} updated list
   */
  updateTargetingOptions(newOptions) {
    return DV360.LineItemTargetingOptions.bulkUpdate(this, newOptions);
  }
}

/**
 * Creative Entity.
 */
class Creative extends DV360Entity {
  /**
   * @param {!Object} obj
   */
  constructor(obj) {
    super(obj, [
      'name',
      'advertiserId',
      'creativeId',
      'cmPlacementId',
      'displayName',
      'entityStatus',
      'updateTime',
      'createTime',
      'creativeType',
      'hostingSource',
      'dynamic',
      'dimensions',
      'additionalDimensions',
      'mediaDuration',
      'creativeAttributes',
      'reviewStatus',
      'assets',
      'exitEvents',
      'timerEvents',
      'counterEvents',
      'appendedTag',
      'integrationCode',
      'notes',
      'iasCampaignMonitoring',
      'companionCreativeIds',
      'skippable',
      'skipOffset',
      'progressOffset',
      'universalAdId',
      'thirdPartyUrls',
      'transcodes',
      'trackerUrls',
      'jsTrackerUrl',
      'cmTrackingAd',
      'obaIcon',
      'thirdPartyTag',
      'requireMraid',
      'requireHtml5',
      'requirePingForAttribution',
      'expandingDirection',
      'expandOnHover',
      'vastTagUrl',
      'vpaid',
      'html5Video',
      'lineItemIds',
      'mp3Audio',
      'oggAudio',
    ]);
  }
}

/**
 * Targeting Option that is assigned to another Entity (e.g. Line Item).
 */
class AssignedTargetingOption extends DV360Entity {
  /**
   * @param {!Object} obj
   */
  constructor(obj) {
    super(obj, [
      'name',
      'assignedTargetingOptionId',
      'targetingType',
      'inheritance',
    ]);
  }
}

/**
 * General Targeting Option (i.e. available to be assigned).
 */
class TargetingOption extends DV360Entity {
  /**
   * @param {!Object} obj
   */
  constructor(obj) {
    super(obj, [
      'name',
      'targetingOptionId',
      'targetingType',
    ]);
  }
}
