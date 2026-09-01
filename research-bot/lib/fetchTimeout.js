/* fetch() mit Timeout ueber AbortController.

   Ohne Timeout haengt ein einzelner nicht antwortender Server (Stooq,
   ein RSS-Feed) den kompletten Refresh-Zyklus auf unbestimmte Zeit auf.
   Fuer einen Dienst, der dauerhaft laufen soll und alle paar Minuten
   neu abruft, wuerde das mit der Zeit zu einem wachsenden Haufen
   haengender Requests fuehren - genau das soll das hier verhindern. */
'use strict';

function fetchMitTimeout(ms) {
  return async function (url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      return await fetch(url, { signal: controller.signal });
    } catch (e) {
      if (e.name === 'AbortError') throw new Error(`Zeitueberschreitung nach ${ms} ms`);
      throw e;
    } finally {
      clearTimeout(timer);
    }
  };
}

module.exports = { fetchMitTimeout };
