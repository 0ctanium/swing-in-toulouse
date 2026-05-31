/**
 * Extract a JSON object assigned to a key inside Facebook's embedded payloads.
 * Adapted from facebook-event-scraper's findJsonInString helper.
 */
(function initScrapJson(global) {
  /**
   * @param {string} dataString
   * @param {string} key
   * @param {(value: Record<string, unknown>) => boolean} [isDesiredValue]
   */
  function findJsonInString(dataString, key, isDesiredValue) {
    const prefix = `"${key}":`;
    let startPosition = 0;

    while (true) {
      let idx = dataString.indexOf(prefix, startPosition);
      if (idx === -1) {
        return { startIndex: -1, endIndex: -1, jsonData: null };
      }

      idx += prefix.length;
      const startIndex = idx;
      const startCharacter = dataString[startIndex];

      if (
        startCharacter === "n" &&
        dataString.slice(startIndex, startIndex + 4) === "null"
      ) {
        return { startIndex, endIndex: startIndex + 3, jsonData: null };
      }

      if (startCharacter !== "{" && startCharacter !== "[") {
        throw new Error(`Invalid start character: ${startCharacter}`);
      }

      const endCharacter = startCharacter === "{" ? "}" : "]";
      let nestedLevel = 0;
      let isIndexInString = false;

      while (idx < dataString.length - 1) {
        idx++;

        if (dataString[idx] === '"' && dataString[idx - 1] !== "\\") {
          isIndexInString = !isIndexInString;
        } else if (dataString[idx] === endCharacter && !isIndexInString) {
          if (nestedLevel === 0) {
            break;
          }
          nestedLevel--;
        } else if (dataString[idx] === startCharacter && !isIndexInString) {
          nestedLevel++;
        }
      }

      const jsonDataString = dataString.slice(startIndex, idx + 1);
      const jsonData = JSON.parse(jsonDataString);

      if (!isDesiredValue || isDesiredValue(jsonData)) {
        return { startIndex, endIndex: idx, jsonData };
      }

      startPosition = idx;
    }
  }

  /**
   * @param {string} dataString
   * @param {string} key
   */
  function findAllJsonInString(dataString, key) {
    const prefix = `"${key}":`;
    /** @type {Record<string, unknown>[]} */
    const results = [];
    let startPosition = 0;

    while (true) {
      let idx = dataString.indexOf(prefix, startPosition);
      if (idx === -1) {
        return results;
      }

      idx += prefix.length;
      const startIndex = idx;
      const startCharacter = dataString[startIndex];

      if (
        startCharacter === "n" &&
        dataString.slice(startIndex, startIndex + 4) === "null"
      ) {
        startPosition = startIndex + 4;
        continue;
      }

      if (startCharacter !== "{" && startCharacter !== "[") {
        startPosition = idx + 1;
        continue;
      }

      const endCharacter = startCharacter === "{" ? "}" : "]";
      let nestedLevel = 0;
      let isIndexInString = false;
      let cursor = idx;

      while (cursor < dataString.length - 1) {
        cursor++;

        if (dataString[cursor] === '"' && dataString[cursor - 1] !== "\\") {
          isIndexInString = !isIndexInString;
        } else if (dataString[cursor] === endCharacter && !isIndexInString) {
          if (nestedLevel === 0) {
            break;
          }
          nestedLevel--;
        } else if (dataString[cursor] === startCharacter && !isIndexInString) {
          nestedLevel++;
        }
      }

      try {
        const jsonDataString = dataString.slice(startIndex, cursor + 1);
        results.push(JSON.parse(jsonDataString));
      } catch {
        // Skip malformed blocks and keep scanning.
      }

      startPosition = cursor + 1;
    }
  }

  global.ScrapExt = global.ScrapExt || {};
  global.ScrapExt.findJsonInString = findJsonInString;
  global.ScrapExt.findAllJsonInString = findAllJsonInString;
})(globalThis);
