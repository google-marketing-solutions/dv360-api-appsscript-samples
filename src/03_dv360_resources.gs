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
 * Base class for an endpoint to interact with a single Entity
 * Contains common operations that can be performed on every Entity in DV360
 */
class DV360Resource {
  /**
   * @param {string} baseUri
   * @param {string} apiFieldName
   * @param {string} primaryIdField
   * @param {string=} filter
   */
  constructor(baseUri, apiFieldName, primaryIdField, filter = '') {
    /** @private @const {string} */
    this.baseUri_ = baseUri;
    /** @private @const {string} */
    this.apiFieldName_ = apiFieldName;
    /** @private @const {string} */
    this.primaryIdField_ = primaryIdField;
    /** @private @const {string} */
    this.filter_ = filter;
  }

  /**
   * Fetches all Entities that API will return for given parameters.
   * @param {!Object} parameters to substitute in URIs and params
   * @return {!Array<!DV360Entity>}
   */
  list(parameters) {
    const resultList = [];
    ApiUtil.executeApiGetRequest(this.buildListUri_(parameters), (result) => {
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
      uri = Util.modifyUrlQueryString(uri, 'filter', this.filter_);
    }
    return ApiUtil.replaceInputValues(uri, parameters);
  }

  /**
   * Fetches a single entity.
   * @param {!Object} parameters
   * @return {!DV360Entity} fetched entity
   */
  get(parameters) {
    let output = null;
    ApiUtil.executeApiGetRequest(
        this.buildSingleEntityUri_(parameters), (result) => {
          output = this.convertObjectToEntity(result);
        });
    return output;
  }

  /**
   * Updates an entity (found by parameter's entityID).
   * @param {!DV360Entity} entity with target values
   * @return {!DV360Entity} updated entity
   */
  update(entity) {
    const original = this.get(entity);
    if (original.getPatchMask(entity) === '') {
      return original;
    }
    let output = null;
    ApiUtil.executeApiPatchRequest(
        this.buildPatchUri_(original, entity), entity, (result) => {
          output = this.convertObjectToEntity(result);
        });
    return output;
  }

  /**
   * Creates entity on API side.
   * @param {!DV360Entity} entity
   * @return {!DV360Entity} created object
   */
  create(entity) {
    let output = null;
    const input = Object.assign({}, entity);
    delete input[this.primaryIdField_];
    ApiUtil.executeApiPostRequest(
        this.buildCreateUri_(entity), input, (result) => {
          output = this.convertObjectToEntity(result);
        });
    return output;
  }

  /**
   * Archives and deletes an Entity.
   * @param {!DV360Entity} entity to delete
   */
  delete(entity) {
    entity.entityStatus = 'ENTITY_STATUS_ARCHIVED';
    this.update(entity);
    ApiUtil.executeApiDeleteRequest(
        this.buildSingleEntityUri_(entity), () => {});
  }

  /**
   * Abstract method to make an appropriate DV360Entity out of generic Object.
   */
  convertObjectToEntity() {
    throw new Error('Not implemented');
  }

  /**
   * Builds an URI for a CREATE request
   * @private
   * @param {!Object} params to replace in uri
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
    return this.buildSingleEntityUri_(entity) + '?updateMask=' + patchMask;
  }

  /**
   * Builds URI for a single-entity request.
   * @private
   * @param {!Object} params for entityId and used as query params
   * @return {string} uri for a single entity
   */
  buildSingleEntityUri_(params) {
    return ApiUtil.replaceInputValues(
        this.baseUri_ + '/' + this.getPrimaryId(params),
        Object.assign({}, params)  // to strip methods off object
    );
  }

  /**
   * Reads primary ID field from Entity. Used by generic Resource methods.
   * @param {!DV360Entity} entity to read entityId from
   * @return {string|number} primary id
   */
  getPrimaryId(entity) {
    return entity[this.primaryIdField_];
  }
}

/**
 * Resource interacting with Advertiser entities.
 */
class Advertisers extends DV360Resource {
  /** */
  constructor() {
    super('advertisers?partnerId=${partnerId}', 'advertisers');
  }
  /**
   * Casts generic object into an Advertiser.
   * @param {!Object} result
   * @return {!Advertiser}
   */
  convertObjectToEntity(result) {
    return new Advertiser(result);
  }
}

/**
 * Resource interacting with Campaign entities
 */
class Campaigns extends DV360Resource {
  /** */
  constructor() {
    super('advertisers/${advertiserId}/campaigns', 'campaigns', 'campaignId');
  }

  /**
   * Casts generic object into a Campaign.
   * @param {!Object} result
   * @return {!Campaign}
   */
  convertObjectToEntity(result) {
    return new Campaign(result);
  }
}

/**
 * Resource interacting with InsertionOrder entities.
 */
class InsertionOrders extends DV360Resource {
  /** */
  constructor() {
    super(
        'advertisers/${advertiserId}/insertionOrders', 'insertionOrders',
        'insertionOrderId', 'campaignId=${campaignId}');
  }

  /**
   * Casts generic object into an Insertion Order.
   * @param {!Object} result
   * @return {!InsertionOrder}
   */
  convertObjectToEntity(result) {
    return new InsertionOrder(result);
  }
}

/**
 * Resource interacting with LineItem entities.
 */
class LineItems extends DV360Resource {
  /** */
  constructor() {
    super(
        'advertisers/${advertiserId}/lineItems', 'lineItems', 'lineItemId',
        'campaignId=${campaignId} AND insertionOrderId=${insertionOrderId}');
  }

  /**
   * Casts generic object into a Line Item.
   * @param {!Object} result
   * @return {!LineItem}
   */
  convertObjectToEntity(result) {
    return new LineItem(result);
  }
}
/**
 * Resource interacting with Creative entities.
 */
class Creatives extends DV360Resource {
  /** */
  constructor() {
    super(
        'advertisers/${advertiserId}/creatives', 'creatives', 'creativeId',
        'lineItemIds:${lineItemId}');
  }

  /**
   * Casts generic object into a Creative.
   * @param {!Object} result
   * @return {!Creative}
   */
  convertObjectToEntity(result) {
    return new Creative(result);
  }
}

/**
 * Abstract TargetingOption Resource; base for entity-specific
 * targeting optons flavors.
 */
class AssignedTargetingOptions extends DV360Resource {
  /**
   * @param {string} uri
   * @param {string} apiFieldName
   */
  constructor(uri, apiFieldName) {
    super(uri, apiFieldName, 'assignedTargetingOptionId');
  }

  /**
   * Casts generic object into an Assigned Targeting Option.
   * @param {!Object} result
   * @return {!AssignedTargetingOption}
   */
  convertObjectToEntity(result) {
    return new AssignedTargetingOption(result);
  }
}

/**
 * Resource interacting with Targeting Options assigned to Line Item
 */
class LineItemTargetingOptions extends AssignedTargetingOptions {
  /**
   *
   */
  constructor() {
    super(
        'advertisers/${advertiserId}' +
            '/lineItems/${lineItemId}:bulkListLineItemAssignedTargetingOptions',
        'assignedTargetingOptions');
  }
  /**
   * Overwrites all LineItem's TargetingOptions with a given Array.
   * @param {!LineItem} lineItem to update
   * @param {!Array<!AssignedTargetingOption>} newOptions to instate
   * @return {!Array<!AssignedTargetingOption>} newly created options
   */
  bulkUpdate(lineItem, newOptions) {
    const oldOptions = lineItem.listTargetingOptions();
    const creationRequests = this.createRequests_(newOptions, oldOptions);
    const deletionRequests = this.deleteRequests(newOptions, oldOptions);
    const payload = {
      deleteRequests: deletionRequests,
      createRequests: creationRequests
    };
    const postUri = ApiUtil.replaceInputValues(
        'advertisers/${advertiserId}/lineItems/' +
            '${lineItemId}:bulkEditLineItemAssignedTargetingOptions',
        lineItem);
    let output = [];
    ApiUtil.executeApiPostRequest(postUri, payload, (response) => {
      output = response.createdAssignedTargetingOptions || [];
    });
    return output;
  }

  /**
   * Builds Create part of the TO's update POST request payload.
   * @param {!Array<!AssignedTargetingOption>} newOptions
   * @param {!Array<!AssignedTargetingOption>} oldOptions
   * @return {!Array<!Object>} creation requests
   */
  createRequests_(newOptions, oldOptions) {
    const optionsToCreate = Util.difference(newOptions, oldOptions);
    const creationRequests =
        this.collectUniqueTypes(optionsToCreate).map((type) => {
          return {
            targetingType: type,
            assignedTargetingOptions: optionsToCreate.filter(
                (option) => option.targetingType === type)
          };
        });
    return creationRequests;
  }

  /**
   * Builds Delete part of TO's update POST request payload.
   * @param {!Array<!AssignedTargetingOption>} newOptions
   * @param {!Array<!AssignedTargetingOption>} oldOptions
   * @return {!Array<!Object>} deletion requests
   */
  deleteRequests(newOptions, oldOptions) {
    const optionsToDelete = Util.difference(oldOptions, newOptions);
    const deletionRequests =
        this.collectUniqueTypes(optionsToDelete).map((type) => {
          return {
            targetingType: type,
            assignedTargetingOptionIds:
                optionsToDelete
                    .filter((option) => option.targetingType === type)
                    .map((option) => option.assignedTargetingOptionId),
          };
        });
    return deletionRequests;
  }

  /**
   * Collects targeting types as set (for de-duplication)
   * @param {!Array<!AssignedTargetingOption>} options
   * @return {!Array<!Object>} targeting types
   */
  collectUniqueTypes(options) {
    const types = new Set(options.map((option) => option.targetingType));
    return [...types];
  }
}
/**
 * Resource interacting with non-assigned (account-level) targeting options.
 */
class AllTargetingOptions extends DV360Resource {
  /** */
  constructor() {
    super(
        'targetingTypes/${targetingType}/' +
            'targetingOptions?advertiserId=${advertiserId}',
        'targetingOptions', 'targetingOptionId');
  }

  /**
   * Casts generic object as Targeting Option.
   * @param {!Object} result
   * @return {!TargetingOption}
   */
  convertObjectToEntity(result) {
    return new TargetingOption(result);
  }
}

/**
 * Global access to Resources
 */
const DV360 = {
  Advertisers: new Advertisers(),
  Campaigns: new Campaigns(),
  InsertionOrders: new InsertionOrders(),
  LineItems: new LineItems(),
  Creatives: new Creatives(),
  LineItemTargetingOptions: new LineItemTargetingOptions(),
  SearchTargetingOptions: new AllTargetingOptions(),
  /**
   * Entry point for fluent API.
   * @param {string} partnerId
   * @return {!Array<!Advertiser>}
   */
  listAdvertisers: function(partnerId) {
    return DV360.Advertisers.list({partnerId: partnerId});
  },
};
