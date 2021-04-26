/* eslint-disable no-unused-vars */

/**
 *
 */
class DV360Resource {
  /**
   *
   * @param {string} baseUri
   * @param {string} apiFieldName
   * @param {string} primaryIdField
   * @param {string} filter
   */
  constructor(baseUri, apiFieldName, primaryIdField, filter='') {
    this.baseUri_ = baseUri;
    this.apiFieldName_ = apiFieldName;
    this.primaryIdField_ = primaryIdField;
    this.filter_ = filter;
  }

  /**
     *
     * @param {!object} parameters to substitute in URIs and params
     * @return {!array<!DV360Entity>}
     */
  list(parameters) {
    const resultList = [];
    ApiUtil.executeApiGetRequest(
        this.buildListUri_(parameters),
        (result) => {
          if (Object.keys(result).length === 0) return;
          const rowsData = result[this.apiFieldName_];
          resultList.push(...rowsData);
        });
    return resultList.map((result) => this.convertObjectToEntity(result));
  }

  /**
     * Builds Url that can be used to GET data,
     * using sheet config and sheet filter settings.
     * @private
     * @param {?object} parameters
     * @return {string} uri to append to base DEV360 URL.
     */
  buildListUri_(parameters) {
    let uri = this.baseUri_;
    if (this.filter_ !== '') {
      uri +=
          Util.queryParamSeparator(uri) + `filter=${this.filter_}`;
    }
    return ApiUtil.replaceInputValues(uri, parameters);
  }

  /**
   * Fetches a single entity
   * @param {!object} parameters
   * @return {DV360Entity} fetched entity
   */
  get(parameters) {
    let output = null;
    ApiUtil.executeApiGetRequest(
        this.buildSingleEntityUri_(parameters),
        (result) => {
          output = this.convertObjectToEntity(result);
        });
    return output;
  }

  /**
 *
 * @param {!DV360Entity} entity with target values
 * @return {DV360Entity} updated entity
 */
  update(entity) {
    const original = this.get(entity);
    if (original.getPatchMask(entity) === '') {
      return original;
    }
    let output = null;
    ApiUtil.executeApiPatchRequest(
        this.buildPatchUri_(original, entity),
        entity,
        (result) => {
          output = this.convertObjectToEntity(result);
        }
    );
    return output;
  }

  /**
 *
 * @param {!DV360Entity} entity
 * @return {DV360Entity} created object
 */
  create(entity) {
    let output = null;
    const input = Object.assign({}, entity);
    delete input[this.primaryIdField_];
    ApiUtil.executeApiPostRequest(
        this.buildCreateUri_(entity),
        input,
        (result) => {
          output = this.convertObjectToEntity(result);
        }
    );
    return output;
  }

  /**
 *
 * @param {!DV360Entity} entity to delete
 */
  delete(entity) {
    entity.entityStatus = 'ENTITY_STATUS_ARCHIVED';
    this.update(entity);
    ApiUtil.executeApiDeleteRequest(
        this.buildSingleEntityUri_(entity),
        () => {}
    );
  }

  /**
 *
 */
  convertObjectToEntity() {
    throw new Error('Not implemented');
  }

  /**
 *@private
 * @param {object} params to replace in uri
 * @return {string}
 */
  buildCreateUri_(params) {
    return ApiUtil.replaceInputValues(this.baseUri_, params);
  }

  /**
     * Builds URI for PATCH request
     * @private
     * @param {!DV360Entity} entity for parameters
     * @param {!DV360Entity} modified new values
     * @return {string} uri for PATCH request
     */
  buildPatchUri_(entity, modified) {
    const patchMask = entity.getPatchMask(modified);
    return this.buildSingleEntityUri_(entity)+'?updateMask='+patchMask;
  }

  /**
     * Builds URI for a single-entity request.
     * @private
     * @param {!object} params for entityId and used as query params
     * @return {string} uri for DELETE request
     */
  buildSingleEntityUri_(params) {
    return ApiUtil.replaceInputValues(
        this.baseUri_ + '/' + this.getPrimaryId(params),
        Object.assign({}, params) // to strip methods off object
    );
  }

  /**
     * @param {!DV360Entity} entity to read entityId from
     * @return {string|number} primary id
     */
  getPrimaryId(entity) {
    return entity[this.primaryIdField_];
  }
}

/**
 *
 */
class Advertisers extends DV360Resource {
  /**
   *
   */
  constructor() {
    super('advertisers?partnerId=${partnerId}',
        'advertisers');
  }
  /**
     *
     * @param {!object} result
     * @return {Advertiser}
     */
  convertObjectToEntity(result) {
    return new Advertiser(result);
  }
}

/**
 *
 */
class Campaigns extends DV360Resource {
  /**
     *
     */
  constructor() {
    super('advertisers/${advertiserId}/campaigns',
        'campaigns',
        'campaignId');
  }

  /**
     *
     * @param {!object} result
     * @return {Campaign}
     */
  convertObjectToEntity(result) {
    return new Campaign(result);
  }
}


/**
 *
 */
class InsertionOrders extends DV360Resource {
  /**
 *
 */
  constructor() {
    super('advertisers/${advertiserId}/insertionOrders',
        'insertionOrders',
        'insertionOrderId',
        'campaignId=${campaignId}');
  }

  /**
       *
       * @param {!object} result
       * @return {InsertionOrder}
       */
  convertObjectToEntity(result) {
    return new InsertionOrder(result);
  }
}

/**
 *
 */
class LineItems extends DV360Resource {
  /**
   *
   */
  constructor() {
    super('advertisers/${advertiserId}/lineItems',
        'lineItems',
        'lineItemId',
        'campaignId=${campaignId} AND insertionOrderId=${insertionOrderId}');
  }

  /**
         *
         * @param {!object} result
         * @return {InsertionOrder}
         */
  convertObjectToEntity(result) {
    return new LineItem(result);
  }
}
/**
 *
 */
class Creatives extends DV360Resource {
  /**
     *
     */
  constructor() {
    super('advertisers/${advertiserId}/creatives',
        'creatives',
        'creativeId',
        'lineItemIds:${lineItemId}'
    );
  }

  /**
   * @param {!object} result
   * @return {Creative}
   */
  convertObjectToEntity(result) {
    return new Creative(result);
  }
}
/**
 *
 */
class TargetingOptions extends DV360Resource {
  /**
     *
     * @param {string} uri
     * @param {string} apiFieldName
     */
  constructor(uri, apiFieldName) {
    super(uri, apiFieldName, 'assignedTargetingOptionId');
  }

  /**
   * @param {!object} result
   * @return {AssignedTargetingOption}
   */
  convertObjectToEntity(result) {
    return new AssignedTargetingOption(result);
  }
}

/**
 *
 */
class LineItemTargetingOptions extends TargetingOptions {
  /**
     *
     */
  constructor() {
    super('advertisers/${advertiserId}'+
        '/lineItems/${lineItemId}:bulkListLineItemAssignedTargetingOptions',
    'assignedTargetingOptions'
    );
  }
  /**
 * @param {!LineItem} lineItem to update
 * @param {!array<AssignedTargetingOption>} newOptions to instate
 * @return {array<AssignedTargetingOption>} newly created options
 */
  bulkUpdate(lineItem, newOptions) {
    const oldOptions = lineItem.listTargetingOptions();
    const creationRequests = this.createRequests_(newOptions, oldOptions);
    const deletionRequests = this.deleteRequests(newOptions, oldOptions);
    const payload = {
      deleteRequests: deletionRequests,
      createRequests: creationRequests};
    const postUri = ApiUtil.replaceInputValues(
        'advertisers/${advertiserId}/lineItems/'+
        '${lineItemId}:bulkEditLineItemAssignedTargetingOptions',
        lineItem
    );
    let output = [];
    ApiUtil.executeApiPostRequest(
        postUri,
        payload,
        (response) => {
          output = response.createdAssignedTargetingOptions || [];
        }
    );
    return output;
  }

  /**
   *
   * @param {!Array<!AssignedTargetingOption>} newOptions
   * @param {!Array<!AssignedTargetingOption>} oldOptions
   * @return {!Array<object>} creation requests
   */
  createRequests_(newOptions, oldOptions) {
    const optionsToCreate = Util.difference(newOptions, oldOptions);
    const creationRequests = this.collectUniqueTypes(optionsToCreate)
        .map((type) => {
          return {
            targetingType: type,
            assignedTargetingOptions: optionsToCreate
                .filter((option) => option.targetingType === type)};
        });
    return creationRequests;
  }

  /**
 *
 * @param {!Array<!AssignedTargetingOption>} newOptions
 * @param {!Array<!AssignedTargetingOption>} oldOptions
 * @return {!Array<object>} deletion requests
 */
  deleteRequests(newOptions, oldOptions) {
    const optionsToDelete = Util.difference(oldOptions, newOptions);
    const deletionRequests = this.collectUniqueTypes(optionsToDelete)
        .map((type) => {
          return {
            targetingType: type,
            assignedTargetingOptionIds: optionsToDelete
                .filter((option) => option.targetingType === type)
                .map((option) => option.assignedTargetingOptionId),
          };
        });
    return deletionRequests;
  }

  /**
 *
 * @param {!array<AssignedTargetingOption>} options
 * @return {array<object>} targeting types
  */
  collectUniqueTypes(options) {
    const types = new Set(
        options.map((option) => option.targetingType));
    return [...types];
  }
}
/**
 *
 */
class AllTargetingOptions extends DV360Resource {
  /**
     *
     */
  constructor() {
    super('targetingTypes/${targetingType}/'+
    'targetingOptions?advertiserId=${advertiserId}',
    'targetingOptions',
    'targetingOptionId'
    );
  }

  /**
   * @param {!object} result
   * @return {TargetingOption}
   */
  convertObjectToEntity(result) {
    return new TargetingOption(result);
  }
}


/** ENTITIES********************************************************/
/**
 *
 */
class DV360Entity {
  /**
 * Error-prone shorthand without directly defining fields
 * @param {!object} obj
 * @param {!array<!string>} fieldList that must exist
 */
  constructor(obj, fieldList) {
    // fieldList.forEach((field) => {
    //   if (obj[field] == null) {
    //     throw new Error(`Input field ${field} is undefined`);
    //   }
    // });
    Object.assign(this, obj);
  }

  /**
   * Produces comma-separated string of fields that differ between this
   * (original) and given other object (for use in PATCH calls).
   * @private
   * @param {!DV360Entity} modified object to compare 'this' with
   * @return {string} patch mask for DV360 API
   */
  getPatchMask(modified) {
    const changedFields = Util.listFields(modified)
        .filter((field) => field != this.primaryIdField_)
        .filter((field) => field != 'updateTime')
        .filter(
            (field) =>
              Util.getValueByDottedFieldName(modified, field) !=
          Util.getValueByDottedFieldName(this, field)
        );
    const mask = changedFields.join(',');
    return mask;
  }

  /**
   *
   * @return {!array<AssignedTargetingOption>}
   */
  listTargetingOptions() {
    return [];
  }
}
/**
   *
   */
class Advertiser extends DV360Entity {
  /**
 *
 * @param {!object} obj
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
   *
   * @return {!array<!Campaign>}
   */
  listCampaigns() {
    return DV360.Campaigns.list({advertiserId: this.advertiserId});
  }
}

/**
 *
 */
class Campaign extends DV360Entity {
  /**
 *
 * @param {!object} obj
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
   *
   * @return {!array<!InsertionOrder>}
   */
  listInsertionOrders() {
    return DV360.InsertionOrders.list({
      advertiserId: this.advertiserId,
      campaignId: this.campaignId});
  }
}

/**
 *
 */
class InsertionOrder extends DV360Entity {
/**
 *
 * @param {!object} obj
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
 *
 * @return {!array<!LineItem>}
 */
  listLineItems() {
    return DV360.LineItems.list({
      advertiserId: this.advertiserId,
      campaignId: this.campaignId,
      insertionOrderId: this.insertionOrderId});
  }
}

/**
 *
 */
class LineItem extends DV360Entity {
/**
 *
 * @param {!object} obj
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
   * @return {!array<!AssignedTargetingOption>}
   */
  listTargetingOptions() {
    return DV360.LineItemTargetingOptions.list({
      advertiserId: this.advertiserId,
      lineItemId: this.lineItemId,
    });
  }
  /**
 *
 * @param {!array<AssignedTargetingOption>} newOptions
 * @return {array<AssignedTargetingOption>} updated list
 */
  updateTargetingOptions(newOptions) {
    return DV360.LineItemTargetingOptions.bulkUpdate(this, newOptions);
  }
}
/**
 *
 */
class Creative extends DV360Entity {
  /**
     *
     * @param {!object} obj
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
 *
 */
class AssignedTargetingOption extends DV360Entity {
  /**
     *
     * @param {!object} obj
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
 *
 */
class TargetingOption extends DV360Entity {
  /**
     *
     * @param {!object} obj
     */
  constructor(obj) {
    super(obj, [
      'name',
      'targetingOptionId',
      'targetingType',
    ]);
  }
}

const DV360 = {
  Advertisers: new Advertisers(),
  Campaigns: new Campaigns(),
  InsertionOrders: new InsertionOrders(),
  LineItems: new LineItems(),
  Creatives: new Creatives(),
  LineItemTargetingOptions: new LineItemTargetingOptions(),
  SearchTargetingOptions: new AllTargetingOptions(),
  listAdvertisers: function(partnerId) {
    return DV360.Advertisers.list({partnerId: partnerId});
  },
};
