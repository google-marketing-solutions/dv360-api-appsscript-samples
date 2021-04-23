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

  /**
   * Traverses object's sub-structure and converts it
   *  from {a:{b:{c:"value"}}} to {"a.b.c":"value"}
   * @param {!Object} ob
   * @return {!Object} Object with the same values but dotted field names
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
   * @return {*} value of given sub-field
   */
  getValueByDottedFieldName: function(ob, fieldName) {
    if (fieldName.indexOf('.') == -1) {
      return ob[fieldName];
    } else {
      const firstDotIndex = fieldName.indexOf('.');
      const subObject = ob[fieldName.substring(0, firstDotIndex)];
      const subFieldPath = fieldName.substring(firstDotIndex + 1);
      return Util.getValueByDottedFieldName(subObject, subFieldPath);
    }
  },
};
