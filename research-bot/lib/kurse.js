/* Kursdaten von Stooq - kein API-Key noetig, liefert taegliche
   Schlusskurse als CSV. Der Browser darf Yahoo/Stooq nicht direkt
   anfragen (CORS), ein Server-Prozess schon - das ist der ganze Sinn
   dieses Dienstes.

   Trennung: holeKurs() macht Netzwerk-I/O, alles andere ist eine reine
   Funktion und ohne Netz testbar. */
'use strict';

// Stooq erwartet US-Ticker mit ".us"-Suffix.
function stooqSymbol(ticker) {
  return ticker.toLowerCase() + '.us';
}

function stooqUrl(ticker) {
  return `https://stooq.com/q/d/l/?s=${encodeURIComponent(stooqSymbol(ticker))}&i=d`;
}

// Stooq liefert: Date,Open,High,Low,Close,Volume
// Bei unbekanntem Symbol liefert Stooq eine Fehlermeldung statt CSV
// ("N/D" oder eine Textzeile ohne Kommas) - das wird hier erkannt.
function parseStooqCsv(text) {
  const zeilen = text.trim().split(/\r?\n/).filter(z => z.trim());
  if (zeilen.length < 2 || !/^Date,/i.test(zeilen[0])) {
    throw new Error('Unerwartetes Antwortformat (Symbol unbekannt oder Stooq nicht erreichbar)');
  }
  const raus = [];
  for (let i = 1; i < zeilen.length; i++) {
    const teile = zeilen[i].split(',');
    if (teile.length < 5) continue;
    const datum = teile[0].trim();
    const close = parseFloat(teile[4]);
    if (/^\d{4}-\d{2}-\d{2}$/.test(datum) && isFinite(close) && close > 0) {
      raus.push({ datum, close });
    }
  }
  if (!raus.length) throw new Error('Keine verwertbaren Kurszeilen erhalten');
  return raus;
}

// Fuehrt die pro-Ticker-Serien zu einer Bot.parseCsv-kompatiblen CSV
// zusammen: eine Zeile pro Datum, aber NUR fuer Daten, an denen JEDER
// Ticker einen Kurs hat - genau die Vollstaendigkeitsregel, die
// bot-core.js beim Einlesen ohnehin durchsetzt.
function mergeReihen(proTicker) {
  const ticker = Object.keys(proTicker);
  if (!ticker.length) throw new Error('Keine Kursreihen zum Zusammenfuehren');

  const karten = {};
  for (const t of ticker) {
    const m = new Map();
    for (const { datum, close } of proTicker[t]) m.set(datum, close);
    karten[t] = m;
  }

  // Schnittmenge aller Datumswerte.
  let daten = [...karten[ticker[0]].keys()];
  for (const t of ticker.slice(1)) {
    const m = karten[t];
    daten = daten.filter(d => m.has(d));
  }
  daten.sort();

  if (!daten.length) throw new Error('Keine gemeinsamen Handelstage ueber alle Ticker');

  const zeilen = ['Date,' + ticker.join(',')];
  for (const d of daten) {
    zeilen.push(d + ',' + ticker.map(t => karten[t].get(d)).join(','));
  }
  return zeilen.join('\n');
}

// Orchestriert den Abruf. fetchImpl ist injizierbar, damit sich die
// Fehlerbehandlung ohne echtes Netzwerk testen laesst.
async function holeKurse(ticker, fetchImpl) {
  fetchImpl = fetchImpl || fetch;
  const proTicker = {};
  const fehler = [];

  await Promise.all(ticker.map(async t => {
    try {
      const antwort = await fetchImpl(stooqUrl(t));
      if (!antwort.ok) throw new Error(`HTTP ${antwort.status}`);
      const text = await antwort.text();
      proTicker[t] = parseStooqCsv(text);
    } catch (e) {
      fehler.push({ ticker: t, fehler: e.message });
    }
  }));

  const brauchbar = Object.keys(proTicker);
  if (!brauchbar.length) {
    throw new Error('Kein einziger Ticker konnte geladen werden: ' +
      fehler.map(f => `${f.ticker} (${f.fehler})`).join('; '));
  }

  const csv = mergeReihen(proTicker);
  return { csv, proTicker, geladen: brauchbar, fehler };
}

module.exports = { stooqSymbol, stooqUrl, parseStooqCsv, mergeReihen, holeKurse };
