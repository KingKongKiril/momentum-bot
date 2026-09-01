/* Recherche-Bot: eigener, dauerhaft laufender Dienst, getrennt vom
   Momentum-Bot selbst.

   Zweck: alles holen, was ein Browser aus CORS-Gruenden nicht selbst
   holen darf (Kursdaten, Nachrichten-Feeds), plus Dinge, die reine
   Rechenarbeit sind (technische Indikatoren, Makro-Kalender) - und
   ueber HTTP mit offenen CORS-Headern bereitstellen, damit bot.html
   das Ergebnis direkt per fetch() abholen kann.

   Bewusst getrennt von der Backtest-Logik in bot-core.js: die
   zusaetzlichen Signale (Sentiment, Makro) sind Kontext fuer den
   Menschen, keine Eingabe in die Momentum-Rechnung. Wer sie dort
   einbauen wuerde, ohne den Effekt sauber out-of-sample zu testen,
   baut sich genau die Art Data-Snooping, vor der der Bot an anderer
   Stelle ausdruecklich warnt. */
'use strict';

const http = require('http');
const config = require('./config');
const { holeKurse } = require('./lib/kurse');
const { holeSentiment } = require('./lib/sentiment');
const { naechsteEreignisse } = require('./lib/makro');
const { schnappschuss } = require('./lib/indikatoren');

// ---------- Zustand ----------
// Letzter bekannter guter Stand pro Datenart, plus Fehler des letzten
// Versuchs. Ein fehlgeschlagener Refresh loescht nie die vorherigen
// guten Daten - eine leere Antwort waere schlechter als eine leicht
// veraltete.
const zustand = {
  kurse: { csv: null, indikatoren: null, geladen: [], fehler: [], stand: null },
  sentiment: { daten: null, stand: null },
  makro: { daten: null, stand: null },
  letzterFehler: {}
};

// Verhindert ueberlappende Refreshs: faellt ein Durchlauf (trotz
// Fetch-Timeout in kurse.js/sentiment.js) laenger aus als sein eigenes
// Intervall, soll der naechste Tick warten statt einen zweiten
// parallel loslaufen zu lassen.
const laeuft = { kurse: false, sentiment: false };

async function aktualisiereKurse() {
  if (laeuft.kurse) { console.warn('[kurse] vorheriger Refresh laeuft noch, dieser Tick wird uebersprungen'); return; }
  laeuft.kurse = true;
  try {
    const { csv, proTicker, geladen, fehler } = await holeKurse(config.ticker);
    const indikatoren = {};
    for (const t of Object.keys(proTicker)) {
      indikatoren[t] = schnappschuss(proTicker[t].map(p => p.close));
    }
    zustand.kurse = { csv, indikatoren, geladen, fehler, stand: new Date().toISOString() };
    delete zustand.letzterFehler.kurse;
  } catch (e) {
    zustand.letzterFehler.kurse = { nachricht: e.message, zeit: new Date().toISOString() };
    console.error('[kurse] Refresh fehlgeschlagen:', e.message);
  } finally {
    laeuft.kurse = false;
  }
}

async function aktualisiereSentiment() {
  if (laeuft.sentiment) { console.warn('[sentiment] vorheriger Refresh laeuft noch, dieser Tick wird uebersprungen'); return; }
  laeuft.sentiment = true;
  try {
    const daten = await holeSentiment(config.rssFeeds);
    zustand.sentiment = { daten, stand: new Date().toISOString() };
    delete zustand.letzterFehler.sentiment;
  } catch (e) {
    zustand.letzterFehler.sentiment = { nachricht: e.message, zeit: new Date().toISOString() };
    console.error('[sentiment] Refresh fehlgeschlagen:', e.message);
  } finally {
    laeuft.sentiment = false;
  }
}

function aktualisiereMakro() {
  // Reine Rechnung, kein Netzwerk - kann nicht fehlschlagen.
  zustand.makro = { daten: naechsteEreignisse(new Date()), stand: new Date().toISOString() };
}

function planeIntervall(fn, minuten) {
  fn();
  return setInterval(fn, minuten * 60 * 1000);
}

// ---------- HTTP ----------
function sendeJson(res, code, obj) {
  const text = JSON.stringify(obj, null, 2);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': config.corsOrigin,
    'Cache-Control': 'no-store'
  });
  res.end(text);
}

function sendeCsv(res, code, text) {
  res.writeHead(code, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Access-Control-Allow-Origin': config.corsOrigin,
    'Cache-Control': 'no-store'
  });
  res.end(text);
}

function baueSignal() {
  return {
    erzeugt: new Date().toISOString(),
    kurse: {
      stand: zustand.kurse.stand,
      geladen: zustand.kurse.geladen,
      fehler: zustand.kurse.fehler,
      letzterFehler: zustand.letzterFehler.kurse || null
    },
    indikatoren: zustand.kurse.indikatoren,
    sentiment: Object.assign({}, zustand.sentiment.daten, {
      stand: zustand.sentiment.stand,
      letzterFehler: zustand.letzterFehler.sentiment || null
    }),
    makro: Object.assign({}, zustand.makro.daten, { stand: zustand.makro.stand }),
    hinweis: 'Sentiment ist eine grobe Woerterzaehlung auf Schlagzeilen, ' +
      'keine echte Sprachanalyse. Makro- und Sentiment-Daten sind Kontext ' +
      'fuer den Menschen - sie fliessen nicht in die Momentum-Rechnung ein.'
  };
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': config.corsOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  const url = new URL(req.url, 'http://localhost');

  if (req.method !== 'GET') {
    sendeJson(res, 405, { fehler: 'Nur GET wird unterstuetzt' });
    return;
  }

  if (url.pathname === '/health') {
    sendeJson(res, 200, {
      status: 'ok',
      uptimeSekunden: Math.round(process.uptime()),
      letzteAktualisierung: {
        kurse: zustand.kurse.stand,
        sentiment: zustand.sentiment.stand,
        makro: zustand.makro.stand
      },
      letzterFehler: zustand.letzterFehler
    });
    return;
  }

  if (url.pathname === '/kurse.csv') {
    if (!zustand.kurse.csv) {
      sendeJson(res, 503, { fehler: 'Noch keine Kursdaten geladen - kurz warten und erneut versuchen' });
      return;
    }
    sendeCsv(res, 200, zustand.kurse.csv);
    return;
  }

  if (url.pathname === '/signal.json') {
    sendeJson(res, 200, baueSignal());
    return;
  }

  sendeJson(res, 404, { fehler: 'Unbekannter Pfad', bekannt: ['/health', '/kurse.csv', '/signal.json'] });
});

function start() {
  // Globales fetch gibt es erst ab Node 18 - ohne das schlagen alle
  // Refreshs sofort und dauerhaft fehl, aber der Server wuerde trotzdem
  // "laeuft" melden. Lieber direkt beim Start klar sagen, woran es liegt.
  if (typeof fetch !== 'function') {
    console.error(`Node 18 oder neuer wird benoetigt (globales fetch fehlt). ` +
      `Installierte Version: ${process.version}. Node aktualisieren, z.B. ueber https://nodejs.org`);
    process.exit(1);
  }

  planeIntervall(aktualisiereKurse, config.intervallKurseMin);
  planeIntervall(aktualisiereSentiment, config.intervallSentimentMin);
  planeIntervall(aktualisiereMakro, config.intervallMakroMin);

  // Ohne diesen Handler wirft ein Server-Fehler (z.B. Port schon belegt)
  // eine unbehandelte Exception und reisst den ganzen Prozess mit runter -
  // fuer einen Dienst, der dauerhaft laufen soll, eine klare Meldung wert.
  server.on('error', err => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${config.port} ist bereits belegt. ` +
        `Anderen Port setzen (z.B. "PORT=8788 npm start") oder den blockierenden Prozess beenden.`);
    } else {
      console.error('Server-Fehler:', err.message);
    }
    process.exit(1);
  });

  server.listen(config.port, () => {
    console.log(`Recherche-Bot laeuft auf http://localhost:${config.port}`);
    console.log(`  Ticker: ${config.ticker.join(', ')}`);
    console.log(`  Aktualisierung Kurse alle ${config.intervallKurseMin} Min, ` +
      `Sentiment alle ${config.intervallSentimentMin} Min, Makro alle ${config.intervallMakroMin} Min`);
    console.log('');
    console.log(`  Naechster Schritt: bot.html im Browser oeffnen -> Abschnitt`);
    console.log(`  "Live-Recherche" -> Server-Adresse "http://localhost:${config.port}" eintragen.`);
    console.log('  Dieses Fenster muss offen bleiben, solange der Dienst laufen soll (Strg+C zum Beenden).');
  });
}

if (require.main === module) start();

module.exports = { server, zustand, baueSignal, start };
