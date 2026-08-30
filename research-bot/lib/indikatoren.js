/* Technische Indikatoren aus einer reinen Schlusskurs-Serie.
   Bewusst zustandslos und ohne Netzwerkzugriff, damit sie sich ohne
   Mocking testen lassen - reine Funktionen: Zahlen rein, Zahlen raus. */
'use strict';

function sma(werte, fenster) {
  const raus = new Array(werte.length).fill(null);
  let summe = 0;
  for (let i = 0; i < werte.length; i++) {
    summe += werte[i];
    if (i >= fenster) summe -= werte[i - fenster];
    if (i >= fenster - 1) raus[i] = summe / fenster;
  }
  return raus;
}

function ema(werte, fenster) {
  const raus = new Array(werte.length).fill(null);
  const k = 2 / (fenster + 1);
  let vorherig = null;
  for (let i = 0; i < werte.length; i++) {
    if (i === fenster - 1) {
      // Start mit dem einfachen Durchschnitt der ersten "fenster" Werte.
      let summe = 0;
      for (let j = 0; j <= i; j++) summe += werte[j];
      vorherig = summe / fenster;
      raus[i] = vorherig;
    } else if (i >= fenster) {
      vorherig = werte[i] * k + vorherig * (1 - k);
      raus[i] = vorherig;
    }
  }
  return raus;
}

// RSI nach Wilder: Durchschnitt von Gewinnen/Verlusten ueber "fenster"
// Perioden, danach geglaettet (Wilder-Smoothing, kein einfacher SMA-Roll).
function rsi(werte, fenster) {
  fenster = fenster || 14;
  const raus = new Array(werte.length).fill(null);
  if (werte.length < fenster + 1) return raus;

  let gewinnSumme = 0, verlustSumme = 0;
  for (let i = 1; i <= fenster; i++) {
    const diff = werte[i] - werte[i - 1];
    if (diff >= 0) gewinnSumme += diff; else verlustSumme -= diff;
  }
  let avgGewinn = gewinnSumme / fenster;
  let avgVerlust = verlustSumme / fenster;
  raus[fenster] = avgVerlust === 0 ? 100 : 100 - 100 / (1 + avgGewinn / avgVerlust);

  for (let i = fenster + 1; i < werte.length; i++) {
    const diff = werte[i] - werte[i - 1];
    const gewinn = diff > 0 ? diff : 0;
    const verlust = diff < 0 ? -diff : 0;
    avgGewinn = (avgGewinn * (fenster - 1) + gewinn) / fenster;
    avgVerlust = (avgVerlust * (fenster - 1) + verlust) / fenster;
    raus[i] = avgVerlust === 0 ? 100 : 100 - 100 / (1 + avgGewinn / avgVerlust);
  }
  return raus;
}

function macd(werte, kurz, lang, signalFenster) {
  kurz = kurz || 12; lang = lang || 26; signalFenster = signalFenster || 9;
  const emaKurz = ema(werte, kurz);
  const emaLang = ema(werte, lang);
  const linie = werte.map((_, i) =>
    (emaKurz[i] !== null && emaLang[i] !== null) ? emaKurz[i] - emaLang[i] : null);

  // EMA der MACD-Linie fuer die Signal-Linie - nur auf den Teil anwenden,
  // in dem die Linie schon definiert ist.
  const ersterGueltig = linie.findIndex(x => x !== null);
  let signal = new Array(werte.length).fill(null);
  if (ersterGueltig !== -1) {
    const teil = linie.slice(ersterGueltig).map(x => x);
    const signalTeil = ema(teil, signalFenster);
    signalTeil.forEach((w, i) => { signal[ersterGueltig + i] = w; });
  }

  const histogramm = werte.map((_, i) =>
    (linie[i] !== null && signal[i] !== null) ? linie[i] - signal[i] : null);

  return { linie, signal, histogramm };
}

function letzterWert(reihe) {
  for (let i = reihe.length - 1; i >= 0; i--) if (reihe[i] !== null) return reihe[i];
  return null;
}

// Momentaufnahme der wichtigsten Indikatoren fuer eine Schlusskursreihe -
// das, was der Recherche-Bot pro Ticker ausliefert.
function schnappschuss(closes) {
  const sma20 = letzterWert(sma(closes, 20));
  const sma50 = letzterWert(sma(closes, 50));
  const sma200 = letzterWert(sma(closes, 200));
  const rsi14 = letzterWert(rsi(closes, 14));
  const m = macd(closes);
  const letzterKurs = closes[closes.length - 1];

  return {
    kurs: letzterKurs,
    sma20, sma50, sma200,
    rsi14,
    macd: letzterWert(m.linie),
    macdSignal: letzterWert(m.signal),
    macdHistogramm: letzterWert(m.histogramm),
    // Grobe, rein deskriptive Einordnung - keine Handelsregel.
    ueberSma200: (sma200 !== null && letzterKurs !== null) ? letzterKurs > sma200 : null
  };
}

module.exports = { sma, ema, rsi, macd, schnappschuss };
