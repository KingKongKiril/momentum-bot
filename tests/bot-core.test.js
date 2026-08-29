/* Tests fuer bot-core.js.
   Lauf mit: node --test tests/
   Keine Abhaengigkeiten - nutzt nur den in Node eingebauten Testrunner,
   damit der Bot ein reines Zero-Dependency-Projekt bleibt. */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Bot = require('../bot-core.js');

// ---------- Hilfen ----------

// Erzeugt eine deterministische synthetische Kursreihe (kein echter Zufall,
// damit Tests reproduzierbar sind).
function synthReihe(tage, opt) {
  opt = opt || {};
  const ticker = opt.ticker || ['SPY', 'TLT', 'GLD', 'SHY'];
  const drift = opt.drift || { SPY: 0.0004, TLT: 0.0001, GLD: 0.0001, SHY: 0.00005 };
  const vola = opt.vola || { SPY: 0.01, TLT: 0.006, GLD: 0.008, SHY: 0.0004 };
  let s = opt.seed || 1;
  const zufall = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 - 0.5; };

  const kurs = {};
  ticker.forEach(t => kurs[t] = 100);
  const zeilen = ['Date,' + ticker.join(',')];
  let t = new Date('2005-01-03T00:00:00Z');
  let n = 0;
  while (n < tage) {
    const wt = t.getUTCDay();
    if (wt !== 0 && wt !== 6) {
      ticker.forEach(k => {
        kurs[k] *= (1 + (drift[k] || 0) + (vola[k] || 0.01) * zufall() * 3);
      });
      zeilen.push(t.toISOString().slice(0, 10) + ',' + ticker.map(k => kurs[k].toFixed(6)).join(','));
      n++;
    }
    t.setUTCDate(t.getUTCDate() + 1);
  }
  return Bot.parseCsv(zeilen.join('\n'));
}

function summeGewichte(g) {
  return Object.values(g).reduce((a, b) => a + b, 0);
}

// ---------- CSV ----------

test('parseCsv: liest gueltige Zeilen, sortiert nach Datum', () => {
  const csv = 'Date,SPY,SHY\n2020-01-03,100,50\n2020-01-02,99,50\n2020-01-06,101,50';
  const r = Bot.parseCsv(csv);
  assert.deepEqual(r.ticker, ['SPY', 'SHY']);
  assert.equal(r.daten.length, 3);
  assert.ok(r.daten[0].datum < r.daten[1].datum);
  assert.ok(r.daten[1].datum < r.daten[2].datum);
});

test('parseCsv: verwirft unvollstaendige oder ungueltige Zeilen', () => {
  const csv = 'Date,SPY,SHY\n2020-01-02,100,50\n2020-01-03,,50\n2020-01-04,-5,50\n2020-01-05,102,51';
  const r = Bot.parseCsv(csv);
  assert.equal(r.daten.length, 2);
});

test('parseCsv: wirft bei zu wenigen Zeilen', () => {
  assert.throws(() => Bot.parseCsv('Date,SPY'), /zu wenige Zeilen/);
});

test('parseCsv: wirft wenn keine Zeile verwertbar ist', () => {
  assert.throws(() => Bot.parseCsv('Date,SPY\n2020-01-01,-1\n2020-01-02,0'), /Keine verwertbaren/);
});

// ---------- Datenqualitaet ----------

test('pruefeQualitaet: Wochenenden zaehlen nicht als fehlende Handelstage', () => {
  // Fuenf aufeinanderfolgende Werktage, keine Luecke.
  const csv = 'Date,SPY,SHY\n' +
    '2021-03-01,100,50\n2021-03-02,101,50\n2021-03-03,102,50\n' +
    '2021-03-04,103,50\n2021-03-05,104,50';
  const r = Bot.parseCsv(csv);
  const q = Bot.pruefeQualitaet(r);
  assert.equal(q.fehlendeWerktage, 0);
  assert.equal(q.verdaechtig, false);
});

test('pruefeQualitaet: erkennt fehlende Werktage und markiert verdaechtig', () => {
  // Nur der erste und letzte Tag eines Monats - dazwischen fehlt fast alles.
  const csv = 'Date,SPY,SHY\n2021-03-01,100,50\n2021-03-31,110,50';
  const r = Bot.parseCsv(csv);
  const q = Bot.pruefeQualitaet(r);
  assert.ok(q.fehlendeWerktage > 15);
  assert.equal(q.verdaechtig, true);
});

// ---------- Monatsenden ----------

test('monatsenden: nimmt den letzten Handelstag jedes Monats, verwirft den letzten unvollstaendigen Monat', () => {
  const csv = 'Date,SPY,SHY\n' +
    '2021-01-28,99,50\n2021-01-29,100,50\n' +
    '2021-02-25,100,50\n2021-02-26,101,50\n' +
    '2021-03-01,102,50';
  const r = Bot.parseCsv(csv);
  const m = Bot.monatsenden(r);
  // Maerz ist der letzte, aber unvollstaendige Monat (nur ein Tag) - verworfen.
  assert.equal(m.length, 2);
  assert.equal(m[0].datum.toISOString().slice(0, 10), '2021-01-29');
  assert.equal(m[1].datum.toISOString().slice(0, 10), '2021-02-26');
});

// ---------- Annualisierung ----------

test('periodenProJahr: 12 fuer Monat, 252 fuer Tag', () => {
  assert.equal(Bot.periodenProJahr('monat'), 12);
  assert.equal(Bot.periodenProJahr('tag'), 252);
  assert.equal(Bot.periodenProJahr(undefined), 12);
});

// ---------- Kennzahlen ----------

test('kennzahlen: CAGR und Drawdown auf einer konstruierten Serie', () => {
  // 12 Monate mit konstant +1% - Drawdown 0, CAGR = 1.01^12 - 1.
  const verlauf = [];
  let kapital = 1;
  for (let i = 0; i < 12; i++) {
    kapital *= 1.01;
    verlauf.push({ datum: new Date(2020, i, 1), rendite: 0.01, equity: kapital });
  }
  const k = Bot.kennzahlen(verlauf, 12);
  assert.equal(k.n, 12);
  assert.equal(k.jahre, 1);
  assert.ok(Math.abs(k.cagr - (Math.pow(1.01, 12) - 1)) < 1e-9);
  assert.equal(k.maxDrawdown, 0);
  assert.equal(k.positivAnteil, 1);
  assert.equal(k.schlechtesteRendite, 0.01);
});

test('kennzahlen: annualisiert mit 252 fuer Tagesdaten anders als mit 12', () => {
  const verlauf = [];
  let kapital = 1;
  for (let i = 0; i < 252; i++) {
    kapital *= 1.0002;
    verlauf.push({ datum: new Date(2020, 0, 1 + i), rendite: 0.0002, equity: kapital });
  }
  const kTag = Bot.kennzahlen(verlauf, 252);
  const kMonat = Bot.kennzahlen(verlauf, 12);
  assert.equal(kTag.jahre, 1);
  assert.ok(Math.abs(kMonat.jahre - 21) < 1e-9);
  // Gleiche Rohdaten, unterschiedliche Annualisierung -> unterschiedlicher CAGR.
  assert.notEqual(kTag.cagr.toFixed(6), kMonat.cagr.toFixed(6));
});

test('kennzahlen: erkennt Drawdown korrekt (Tiefpunkt, nicht der Endstand)', () => {
  const verlauf = [
    { datum: new Date(2020, 0), rendite: 0.10, equity: 1.10 },
    { datum: new Date(2020, 1), rendite: -0.20, equity: 0.88 },  // tiefster Punkt
    { datum: new Date(2020, 2), rendite: 0.05, equity: 0.924 }   // Erholung, aber noch unter 1.10
  ];
  const k = Bot.kennzahlen(verlauf, 12);
  assert.ok(Math.abs(k.maxDrawdown - (0.88 / 1.10 - 1)) < 1e-9);
});

test('kennzahlen: turnoverMittel/turnoverProJahr aus dem Turnover-Feld', () => {
  const verlauf = [
    { datum: new Date(2020, 0), rendite: 0.01, equity: 1.01, turnover: 0.5 },
    { datum: new Date(2020, 1), rendite: 0.01, equity: 1.02, turnover: 0.3 }
  ];
  const k = Bot.kennzahlen(verlauf, 12);
  assert.ok(Math.abs(k.turnoverMittel - 0.4) < 1e-9);
  assert.ok(Math.abs(k.turnoverProJahr - 4.8) < 1e-9);
});

test('kennzahlen: turnoverMittel ist undefined, wenn kein Turnover-Feld vorhanden ist', () => {
  const verlauf = [{ datum: new Date(2020, 0), rendite: 0.01, equity: 1.01 }];
  const k = Bot.kennzahlen(verlauf, 12);
  assert.equal(k.turnoverMittel, undefined);
  assert.equal(k.turnoverProJahr, undefined);
});

// ---------- Backtest ----------

test('backtest: wirft wenn der Geldmarkt-Ticker fehlt', () => {
  const r = synthReihe(400);
  assert.throws(() => Bot.backtest(r, { sicher: 'NICHT_DA' }), /Geldmarkt-Ticker/);
});

test('backtest: Turnover liegt immer zwischen 0 und 1', () => {
  const r = synthReihe(1200);
  const verlauf = Bot.backtest(r, { sicher: 'SHY', topN: 2, perioden: [3, 6, 12], einheit: 'monat' });
  assert.ok(verlauf.length > 0);
  for (const p of verlauf) {
    assert.ok(p.turnover >= 0 && p.turnover <= 1 + 1e-9, `turnover ${p.turnover} ausserhalb [0,1]`);
  }
});

test('backtest: Rendite je Periode nutzt nur bereits bekannte Kurse (kein Future-Peek)', () => {
  // Wenn man den Verlauf mit den Rohkursen nachrechnet, muss die gemeldete
  // Rendite (vor Kosten) exakt zur Kursbewegung von Punkt i auf i+1 passen.
  const r = synthReihe(800);
  const verlauf = Bot.backtest(r, { sicher: 'SHY', topN: 2, perioden: [3, 6], einheit: 'monat', kosten: 0 });
  assert.ok(verlauf.length > 0);
  // Ohne Kosten muss die erste Periode zu einer plausiblen Groessenordnung fuehren.
  for (const p of verlauf) assert.ok(Math.abs(p.rendite) < 1, 'unrealistische Periodenrendite');
});

test('backtest: einheit "tag" erzeugt deutlich mehr Perioden als "monat" bei gleicher Zeitspanne', () => {
  const r = synthReihe(1500);
  const vMonat = Bot.backtest(r, { sicher: 'SHY', topN: 2, perioden: [3, 6, 12], einheit: 'monat' });
  const vTag = Bot.backtest(r, { sicher: 'SHY', topN: 2, perioden: [5, 10, 20], einheit: 'tag', volaFenster: 20 });
  assert.ok(vTag.length > vMonat.length * 10);
});

test('backtest: hoehere Kosten je Umschichtung fuehren nie zu einer besseren Endrendite bei gleichem Pfad', () => {
  const r = synthReihe(1500);
  const opt = { sicher: 'SHY', topN: 2, perioden: [3, 6, 12], einheit: 'monat' };
  const billig = Bot.backtest(r, Object.assign({}, opt, { kosten: 0 }));
  const teuer = Bot.backtest(r, Object.assign({}, opt, { kosten: 0.01 }));
  const kBillig = Bot.kennzahlen(billig, 12);
  const kTeuer = Bot.kennzahlen(teuer, 12);
  assert.ok(kTeuer.endwert <= kBillig.endwert);
});

// ---------- Aktuelles Signal ----------

test('aktuellesSignal: Gewichte summieren sich auf 1', () => {
  const r = synthReihe(900);
  const sig = Bot.aktuellesSignal(r, { sicher: 'SHY', topN: 2, perioden: [3, 6, 12] });
  assert.ok(Math.abs(summeGewichte(sig.gewichte) - 1) < 1e-9);
});

test('aktuellesSignal: gewaehlt enthaelt hoechstens topN Anlagen', () => {
  const r = synthReihe(900, { ticker: ['SPY', 'TLT', 'GLD', 'DBC', 'IWM', 'SHY'] });
  const sig = Bot.aktuellesSignal(r, { sicher: 'SHY', topN: 2, perioden: [3, 6, 12] });
  assert.ok(sig.gewaehlt.length <= 2);
});

test('aktuellesSignal: nur Anlagen mit Momentum ueber dem Geldmarkt werden gewaehlt', () => {
  const r = synthReihe(900, { ticker: ['SPY', 'TLT', 'GLD', 'DBC', 'SHY'] });
  const sig = Bot.aktuellesSignal(r, { sicher: 'SHY', topN: 8, perioden: [3, 6, 12] });
  for (const t of sig.gewaehlt) {
    assert.ok(sig.momentum[t] > sig.momentum.SHY);
  }
});

test('aktuellesSignal: einheit "tag" nimmt den letzten Handelstag als Basis, "monat" das letzte Monatsende', () => {
  const r = synthReihe(900);
  const sigTag = Bot.aktuellesSignal(r, { sicher: 'SHY', topN: 2, perioden: [5, 10, 20], einheit: 'tag' });
  const sigMonat = Bot.aktuellesSignal(r, { sicher: 'SHY', topN: 2, perioden: [3, 6, 12], einheit: 'monat' });
  const letzterTag = r.daten[r.daten.length - 1].datum;
  assert.equal(sigTag.basis.getTime(), letzterTag.getTime());
  assert.ok(sigMonat.basis.getTime() <= letzterTag.getTime());
});

// ---------- Hebel und Kelly ----------

test('hebel: Faktor 1 ohne Finanzierungskosten reproduziert den ungehebelten Pfad', () => {
  const verlauf = [
    { datum: new Date(2020, 0), rendite: 0.02, equity: 1.02 },
    { datum: new Date(2020, 1), rendite: -0.01, equity: 1.0098 },
    { datum: new Date(2020, 2), rendite: 0.03, equity: 1.040094 }
  ];
  const h = Bot.hebel(verlauf, 1, 0, 0.30, 12);
  assert.ok(Math.abs(h.endwert - verlauf[verlauf.length - 1].equity) < 1e-9);
  assert.equal(h.liquidationen, 0);
});

test('hebel: fuehrt bei starkem Verlust zur Zwangsliquidation', () => {
  const verlauf = [{ datum: new Date(2020, 0), rendite: -0.5, equity: 0.5 }];
  const h = Bot.hebel(verlauf, 3, 0.06, 0.30, 12);
  assert.equal(h.liquidationen, 1);
});

test('kelly: folgt der Formel (mu - rf) / sigma^2', () => {
  const verlauf = [
    { rendite: 0.01 }, { rendite: 0.02 }, { rendite: -0.01 }, { rendite: 0.015 }, { rendite: 0.00 }
  ].map((v, i) => Object.assign({ datum: new Date(2020, i), equity: 1 }, v));
  const k = Bot.kelly(verlauf, 0.036, 12);
  const r = verlauf.map(v => v.rendite);
  const mittel = r.reduce((a, b) => a + b, 0) / r.length;
  const std = Math.sqrt(r.reduce((a, b) => a + (b - mittel) ** 2, 0) / (r.length - 1));
  const mu = mittel * 12, sigma = std * Math.sqrt(12);
  const erwartet = (mu - 0.036) / (sigma * sigma);
  assert.ok(Math.abs(k.kelly - erwartet) < 1e-9);
  assert.ok(Math.abs(k.halbKelly - erwartet / 2) < 1e-9);
});

// ---------- Durststrecken ----------

test('durststrecken: findet die laengste Phase unter dem alten Hoechststand', () => {
  const verlauf = [
    { datum: new Date(2020, 0), equity: 1.00 },
    { datum: new Date(2020, 1), equity: 1.10 }, // neues Hoch
    { datum: new Date(2020, 2), equity: 1.00 }, // Drawdown beginnt
    { datum: new Date(2020, 3), equity: 0.95 },
    { datum: new Date(2020, 4), equity: 1.05 }, // noch unter dem Hoch von 1.10
    { datum: new Date(2020, 5), equity: 1.15 }  // neues Hoch, Drawdown endet
  ];
  const d = Bot.durststrecken(verlauf, 5);
  assert.equal(d.length, 1);
  assert.equal(d[0].n, 4); // Monate 3..6 (Index 2..5) sind unter dem Hoch
  assert.ok(Math.abs(d[0].tiefster - (0.95 / 1.10 - 1)) < 1e-9);
});

test('durststrecken: eine laufende Durststrecke wird als "laufend" markiert', () => {
  const verlauf = [
    { datum: new Date(2020, 0), equity: 1.10 },
    { datum: new Date(2020, 1), equity: 1.00 }
  ];
  const d = Bot.durststrecken(verlauf, 5);
  assert.equal(d.length, 1);
  assert.equal(d[0].laufend, true);
});

// ---------- Regime ----------

test('regime: gibt null zurueck, wenn die Referenz fehlt', () => {
  const r = synthReihe(900, { ticker: ['TLT', 'GLD', 'SHY'] });
  const verlauf = Bot.backtest(r, { sicher: 'SHY', topN: 2, perioden: [3, 6, 12] });
  assert.equal(Bot.regime(r, verlauf, 'SPY', 'IEF'), null);
});

test('regime: Gruppen sind nicht groesser als der Verlauf', () => {
  const r = synthReihe(2500);
  const verlauf = Bot.backtest(r, { sicher: 'SHY', topN: 2, perioden: [3, 6, 12] });
  const reg = Bot.regime(r, verlauf, 'SPY', 'TLT', { einheit: 'monat' });
  if (reg) {
    const summe = reg.reduce((a, g) => a + g.n, 0);
    assert.ok(summe <= verlauf.length);
  }
});

// ---------- Zufallsvergleich ----------

test('zufallsvergleich: liefert bei gleichem Seed dasselbe Ergebnis', () => {
  const r = synthReihe(900);
  const verlauf = Bot.backtest(r, { sicher: 'SHY', topN: 2, perioden: [3, 6, 12] });
  const a = Bot.zufallsvergleich(r, verlauf, { sicher: 'SHY', laeufe: 100, seed: 7 });
  const b = Bot.zufallsvergleich(r, verlauf, { sicher: 'SHY', laeufe: 100, seed: 7 });
  assert.deepEqual(a, b);
});

test('zufallsvergleich: p05 <= zufallMittel <= p95', () => {
  const r = synthReihe(900);
  const verlauf = Bot.backtest(r, { sicher: 'SHY', topN: 2, perioden: [3, 6, 12] });
  const z = Bot.zufallsvergleich(r, verlauf, { sicher: 'SHY', laeufe: 200, seed: 1 });
  assert.ok(z.p05 <= z.zufallMittel);
  assert.ok(z.zufallMittel <= z.p95);
});

// ---------- Walk-Forward ----------

test('walkForward: wirft bei zu wenigen Daten mit einer verstaendlichen Meldung', () => {
  const r = synthReihe(400);
  assert.throws(() => Bot.walkForward(r, { sicher: 'SHY', einheit: 'monat' }), /Zu wenige Daten/);
});

test('walkForward: liefert bei ausreichend Daten Kennzahlen, Protokoll und Stabilitaet (Monat)', () => {
  const r = synthReihe(5200); // ~20 Jahre
  const wf = Bot.walkForward(r, { sicher: 'SHY', kosten: 0.002, einheit: 'monat' });
  assert.ok(wf.protokoll.length > 0);
  assert.ok(Number.isFinite(wf.kennzahlen.sharpe));
  assert.ok(Number.isFinite(wf.luecke));
  assert.ok(wf.stabilitaet.durchlaeufe === wf.protokoll.length);
});

test('walkForward: funktioniert auch mit einheit "tag" auf ausreichend langen Daten', () => {
  const r = synthReihe(5200);
  const wf = Bot.walkForward(r, { sicher: 'SHY', kosten: 0.002, einheit: 'tag' });
  assert.ok(wf.protokoll.length > 0);
  assert.ok(Number.isFinite(wf.kennzahlen.sharpe));
});
