/* Konfiguration ueber Umgebungsvariablen, mit denselben Defaults wie
   das Beispiel-Universum im Bot selbst - damit "Live-Kurse laden" ohne
   weitere Anpassung sofort etwas Sinnvolles liefert. */
'use strict';

const path = require('path');

function liste(env, standard) {
  const roh = process.env[env];
  return roh ? roh.split(',').map(s => s.trim()).filter(Boolean) : standard;
}

function zahl(env, standard) {
  const roh = process.env[env];
  const n = roh !== undefined ? parseFloat(roh) : NaN;
  return isFinite(n) && n > 0 ? n : standard;
}

module.exports = {
  port: zahl('PORT', 8787),
  corsOrigin: process.env.CORS_ORIGIN || '*',

  ticker: liste('TICKER', ['SPY', 'TLT', 'GLD', 'DBC', 'SHY']),

  // RSS-Feed-URLs sind erfahrungsgemaess nicht ewig stabil - deshalb
  // ueber Umgebungsvariable ueberschreibbar (Komma-getrennt).
  rssFeeds: liste('RSS_FEEDS', [
    'https://www.cnbc.com/id/100003114/device/rss/rss.html',
    'https://feeds.marketwatch.com/marketwatch/topstories/'
  ]),

  // Aktualisierungsintervalle in Minuten.
  intervallKurseMin: zahl('INTERVALL_KURSE_MIN', 15),
  intervallSentimentMin: zahl('INTERVALL_SENTIMENT_MIN', 60),
  intervallMakroMin: zahl('INTERVALL_MAKRO_MIN', 24 * 60),

  // Zwischenspeicher auf Platte, damit ein Neustart nicht mit leeren
  // Daten beginnt. Leerer Wert deaktiviert die Persistenz.
  cacheDatei: process.env.CACHE_DATEI !== undefined
    ? process.env.CACHE_DATEI
    : path.join(__dirname, '.cache', 'zustand.json')
};
