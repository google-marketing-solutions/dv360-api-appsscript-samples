/** 02_util.js **/
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

const Util = {

  /**
   * Extends an object identified by the @param {original} with the
   * values in @param {extension}. @link {Array} values
   * in @param {extension} will be appended to existing arrays
   * in @param {original}, however all other objects in @param {extension}
   * will override existing counterparts in @param {original}.
   *
   * @param {!Object} original The original object to extend
   * @param {?Object} extension Value to use for extending
   *
   * @return {!Object} the extended object.
   */
  extend: function(original, extension) {
    if (original == 'undefined' ||
      (Object.entries(original).length === 0 &&
        original.constructor === Object)) {
      return extension;
    }
    for (const key in extension) {
      if (extension.hasOwnProperty(key)) {
        if (extension[key] instanceof Array) {
          extension[key].forEach(function(element) {
            original[key].push(element);
          });
        } else {
          original[key] = extension[key];
        }
      }
    }
    return original;
  },

  /**
   * Modifies a url by either appending the @param {key}
   * and @param {value} to the end of the url if the @param {key}
   * was not present or replacing the value of the @param {key}
   * if it existed.
   *
   * @param {string} url The url to modify
   * @param {string} key The key to check if present
   * @param {string} value The value to append / modify
   *
   * @return {string} The modified url
   */
  modifyUrlQueryString: function(url, key, value) {
    if (url.includes(`${key}=`)) {
      const regExp = new RegExp(`${key}=[^&]*`, 'g');
      url = url.replace(regExp, `${key}=` + value);
    } else {
      url += `&${key}=${value}`;
    }
    return url;
  },

  /**
   * Returns '?' if no path params are present, '&' if there already are any.
   * @param {string} url to check for existing parameters
   * @return {string}
   */
  queryParamSeparator: function(url) {
    if (url.indexOf('?') > -1) {
      return '&';
    } else {
      return '?';
    }
  },

  /**
   * Unnests field names in an object, producing array of
   *  'field.nestedfield.subnestedfield'
   * @param {!Object} ob the one to be scanned
   * @return {!Array<string>} dot-nested FQ field names
   */
  listDottedFields: function(ob) {
    return Object.getOwnPropertyNames(Util.flattenObject(ob));
  },

  listFields: function(ob) {
    return Object.getOwnPropertyNames(ob);
  },

  /**
   * Traverses object's sub-structure and converts it
   *  from {a:{b:{c:"value"}}} to {"a.b.c":"value"}
   * @param {!Object} ob
   * @return {Object} Object with the same values but dotted field names
   */
  flattenObject: function(ob) {
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
  },

  /**
   * Retrieves value from nested sub-objects by dot-separated path
   * (aka 'dotted field name')
   * @param {!Object} ob
   * @param {string} fieldName
   * @return {?*} value of given sub-field
   */
  getValueByDottedFieldName: function(ob, fieldName) {
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
  },
  /**
 *
 * @param {!object} ob
 * @param {string} fieldName
 * @param {*} value
 */
  setValueByDottedFieldName: function(ob, fieldName, value) {
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
  },

  /**
   * Reads cell content as JSON or, if it fails, returns it verbatim.
   * @private
   * @param {string} data cell's content
   * @return {!Object|string} object or string if not parseable
   */
  parseCellContent: function(data) {
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
  },

  /**
   * Returns an array containing all elements of left
   * that are not present in right one
   * @param {!array<object>} left
   * @param {!array<object>} right
   * @return {!array<object>}
   */
  difference(left, right) {
    return left.filter((object) => !Util.isIn(object, right));
  },

  /**
   *
   * @param {object} object
   * @param {!array<object>} array
   * @return {boolean}
   */
  isIn(object, array) {
    const filtered = array.filter((member)=>{
      return JSON.stringify(member) === JSON.stringify(object);
    });
    return filtered.length>0;
  },
};
/** end 02_util.js
/** 05_api_util.js **/
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
 * @fileoverview This Google Apps Script file contains utility methods for
 * interacting with the DV360 API using the @link {UrlFetchApp} and
 * @link {ScriptApp} classes. Most of the methods here can be replaced once the
 * API is available as an 'Advanced Google Service' integration within the
 * built-in Apps Script 'Resources' section.
 */

const ApiUtil = {
/**
 * Executes single GET request and fires callback once for each returned page.
 * @param {string} requestUri path to query
 * @param {function(!Object): undefined} callback
 *   executed with each page of response
 * @param {function(!Object): undefined} errback
 *   callback in case of errors
 * @param {function(): undefined} finalCallback
 *   to be called after last result is processed
*/
  executeApiGetRequest: function(
      requestUri,
      callback) {
    const requestParams = {
      'method': 'get',
    };
    ApiUtil.executeGenericRequest_(
        requestUri,
        requestParams,
        callback);
  },

  /**
 * Executes single PATCH request and fires callback.
 * @param {string} requestUri path to query
 * @param {!Object} payload what to include as body
 * @param {function(!Object): undefined} callback
 *   executed with each page of response
 * @param {function(!Object): undefined} errback
 *   callback in case of errors
 */
  executeApiPatchRequest: function(
      requestUri,
      payload,
      callback) {
    const requestParams = {
      method: 'patch',
      payload: JSON.stringify(payload),
    };
    ApiUtil.executeGenericRequest_(
        requestUri,
        requestParams,
        callback
    );
  },

  /**
 * Executes single CREATE request and fires callback.
 * @param {string} requestUri path to query
 * @param {!Object} payload what to include as body
 * @param {function(!Object): undefined} callback
 *   executed with each page of response
 * @param {function(!Object): undefined} errback
 *   callback in case of errors
 */
  executeApiPostRequest: function(
      requestUri,
      payload,
      callback) {
    const requestParams = {
      method: 'post',
      payload: JSON.stringify(payload),
    };
    ApiUtil.executeGenericRequest_(
        requestUri,
        requestParams,
        callback
    );
  },
  /**
 * Executes single DELETE request and fires callback.
 * @param {string} requestUri path to query
 * @param {function(!Object): undefined} callback
 *   executed with each page of response
 * @param {function(!Object): undefined} errback
 *   callback in case of errors
 */
  executeApiDeleteRequest: function(
      requestUri,
      callback) {
    const requestParams = {
      method: 'delete',
    };
    ApiUtil.executeGenericRequest_(
        requestUri,
        requestParams,
        callback
    );
  },
  /**
 * Runs REST request using UrlFetchApp. Handles paging, executing
 * callbacks and errors. No retries.
 * Will call callback once per resulting page.
 * Will call errback when there's non-2XX response.
 * @private
 * @param {string} requestUri path to call
 * @param {!Object} requestParams params to include (UrlFetchApp format)
 * @param {function(!Object): undefined} callback to be called once per page
 * @param {function(!Object): undefined} errback in case of errors
 * @param {function(): undefined} finalCallback
 *   to be called after last result is processed
 */
  executeGenericRequest_: function(
      requestUri,
      requestParams,
      callback) {
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
          JSON.parse(response.getContentText()) : {};
      callback(result);
      morePages = result.nextPageToken != undefined;
      if (morePages) {
        url = baseUrl +
           Util.queryParamSeparator(baseUrl) +
           `pageToken=${result.nextPageToken}`;
      }
    }
  },

  /**
   * Takes in a string with placeholders like ${variable}
   * and replaces them with values found in selected sheet's top part.
   * @param {string} input (partial) uri with placeholders
   * @param {?object} params values to replace in input
   * @return {string} uri with replaced placeholders
   */
  replaceInputValues(input, params) {
    let output = input;
    if (params == null) {
      return input;
    }
    for (const [name, value] of Object.entries(params)) {
      output = output.replace('${' + name + '}', value);
    }
    return output;
  },

  /**
   * Constructs the fully-qualified URL to the DV360 API using the
   * given @param {requestUri}.
   * @private
   * @param {string} requestUri: the URI of the specific Resource to request.
   * @return {string} representing the fully-qualified DV360 API URL.
   */
  buildApiUrl_(requestUri) {
    const apiEndpoint = 'https://displayvideo.googleapis.com';
    const apiVersion = 'v1';

    return `${apiEndpoint}/${apiVersion}/${requestUri}`;
  },

  /**
   * Constructs the options to use for the DV360 API request, extending
   * some default options with the given @param {requestParams}.
   * @private
   * @param {!Object} requestParams: the options to use for the request.
   * @return {!Object} representing the extended request options to use.
   * @see {utils.gs} @link {Util.extend}.
   */
  buildApiParams_(requestParams) {
    const token = ScriptApp.getOAuthToken();
    let params = {
      contentType: 'application/json',
      headers:
        {Authorization: `Bearer ${token}`, Accept: 'application/json'},
      muteHttpExceptions: true,
    };
    params = Util.extend(params, requestParams);

    return params;
  },
};
/** end 05_api_util.js
/** 01_dv360.js **/
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
/** end 01_dv360.js
