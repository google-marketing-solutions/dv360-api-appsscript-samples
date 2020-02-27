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
 * This Google Apps Script file contains general utility methods
 * used by the different modules in this application.
 */

var Util = {

  /**
   * Extends an object identified by the @param {original} with the
   * values in @param {extension}. @link {Array} values in
   * @param {extension} will be appended to existing arrays in
   * @param {original}, however all other objects in @param {extension}
   * will override existing counterparts in @param {original}.
   *
   * @param {original}: the original object to extend.
   * @param {extension}: the value to use for extending.
   *
   * @return {Object} the extended object.
   */
  extend: function(original, extension) {

    if (original == undefined ||
        (Object.entries(original).length === 0 &&
        original.constructor === Object)) {
      return extension;
    }
    for (var key in extension) {
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
   * Modifies a url by either appending the @param {key} and
   * @param {value} to the end of the url if the @param {key}
   * was not present or replacing the value of the @param {key}
   * if it existed. The method assumes the value to change is the
   * *last* value in the url query string.
   *
   * @param {url}: the url to modify.
   * @param {key}: the key to check if present.
   * @param {value}: the value to append / modify.
   *
   * @return {String} the modified url.
   */
  modifyUrlQueryString: function(url, key, value) {

    if (url.includes(`${key}=`)) {
      var regExp = new RegExp(`${key}=.*`, 'g');
      url = url.replace(regExp, `${key}=` + value);
    } else {
      url += `&${key}=${value}`;
    }
    return url;
  },

  /**
   * Returns the first non-null argument in the given arguments list.
   *
   * @param {arguments}: default parameter representing all
   *          method arguments.
   *
   * @return the first non-null argument.
   */
  coalesce: function() {

    for (var i = 0; i < arguments.length; i++) {

      if (arguments[i] != undefined) {
        return arguments[i];
      }
    }
    return undefined;
  },

};
