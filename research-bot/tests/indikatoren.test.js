'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { sma, ema, rsi, macd, schnappschuss } = require('../lib/indikatoren');

test('sma: einfacher gleitender Durchschnitt, null vor dem ersten vollen Fenster', () => {
  const werte = [1, 2, 3, 4, 5, 6];
  const s = sma(werte, 3);
  assert.deepEqual(s.slice(0, 2), [null, null]);
  assert.equal(s[2], 2);   // (1+2+3)/3
  assert.equal(s[3], 3);   // (2+3+4)/3
  assert.equal(s[5], 5);   // (4+5+6)/3
});

test('ema: startet mit dem SMA der ersten "fenster" Werte', () => {
  const werte = [1, 2, 3, 4, 5];
  const e = ema(werte, 3);
  assert.equal(e[0], null);
  assert.equal(e[1], null);
  assert.equal(e[2], 2); // SMA(1,2,3)
  assert.ok(e[3] > e[2]); // steigende Serie -> EMA steigt mit
});

test('rsi: durchgaengig steigende Serie ergibt RSI nahe 100', () => {
  const werte = [];
  for (let i = 0; i < 30; i++) werte.push(100 + i);
  const r = rsi(werte, 14);
  const letzter = r[r.length - 1];
  assert.ok(letzter > 95, `RSI ${letzter} sollte nahe 100 liegen`);
});

test('rsi: durchgaengig fallende Serie ergibt RSI nahe 0', () => {
  const werte = [];
  for (let i = 0; i < 30; i++) werte.push(200 - i);
  const r = rsi(werte, 14);
  const letzter = r[r.length - 1];
  assert.ok(letzter < 5, `RSI ${letzter} sollte nahe 0 liegen`);
});

test('rsi: konstante Serie ohne Bewegung ergibt RSI 100 (kein Verlust)', () => {
  const werte = new Array(20).fill(100);
  const r = rsi(werte, 14);
  assert.equal(r[14], 100);
});

test('rsi: null vor Ablauf des Fensters, und leer wenn zu wenig Daten', () => {
  const kurz = [1, 2, 3];
  const r = rsi(kurz, 14);
  assert.ok(r.every(x => x === null));
});

test('macd: Linie ist erst ab dem laengeren EMA-Fenster definiert', () => {
  const werte = Array.from({ length: 40 }, (_, i) => 100 + i * 0.5);
  const m = macd(werte, 12, 26, 9);
  assert.equal(m.linie[24], null); // vor Fenster 26 (Index 25) noch nicht
  assert.ok(m.linie[25] !== null);
  // Stetig steigende Kurve -> MACD-Linie ueber der Signal-Linie moeglich,
  // vor allem aber: Histogramm ist die Differenz der beiden.
  const i = m.linie.length - 1;
  assert.ok(Math.abs(m.histogramm[i] - (m.linie[i] - m.signal[i])) < 1e-9);
});

test('schnappschuss: liefert die erwarteten Felder und ueberSma200-Flag', () => {
  const werte = Array.from({ length: 260 }, (_, i) => 100 + i * 0.1);
  const s = schnappschuss(werte);
  assert.equal(s.kurs, werte[werte.length - 1]);
  assert.ok(s.sma20 !== null && s.sma50 !== null && s.sma200 !== null);
  assert.equal(s.ueberSma200, s.kurs > s.sma200);
  assert.ok(s.rsi14 > 0 && s.rsi14 <= 100);
});

test('schnappschuss: mit zu wenig Daten bleiben SMA200/RSI null statt zu crashen', () => {
  const werte = [100, 101, 102, 103, 104];
  const s = schnappschuss(werte);
  assert.equal(s.sma200, null);
  assert.equal(s.rsi14, null);
  assert.equal(s.kurs, 104);
});
