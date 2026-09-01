/* Zwischenspeicherung des Zustands auf Platte.

   Ohne das ist der Dienst nach jedem Neustart leer, bis der erste
   Refresh durchgelaufen ist (Sekunden bis - bei einem haengenden
   Ticker trotz Timeout - bis zu zehn Sekunden). Mit einer einfachen
   JSON-Datei uebersteht der letzte gute Stand einen Neustart, und
   bot.html bekommt sofort etwas Sinnvolles statt eines 503.

   Bewusst nur "best effort": schlaegt Lesen oder Schreiben fehl (Platte
   voll, keine Schreibrechte, kaputte Datei), wird das nicht als Fehler
   behandelt - der Dienst laeuft dann einfach so weiter, wie er es vor
   dieser Funktion ohnehin tat. */
'use strict';

const fs = require('fs');
const path = require('path');

function speichere(daten, dateipfad) {
  try {
    fs.mkdirSync(path.dirname(dateipfad), { recursive: true });
    // Erst in eine temporaere Datei schreiben und dann umbenennen -
    // ein Absturz mitten im Schreiben darf die vorherige gute Datei
    // nicht durch eine halb geschriebene, kaputte ersetzen.
    const temp = dateipfad + '.tmp';
    fs.writeFileSync(temp, JSON.stringify(daten), 'utf8');
    fs.renameSync(temp, dateipfad);
    return true;
  } catch (e) {
    return false;
  }
}

function lade(dateipfad) {
  try {
    const text = fs.readFileSync(dateipfad, 'utf8');
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

module.exports = { speichere, lade };
