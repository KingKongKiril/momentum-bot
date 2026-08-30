'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { zustand, baueSignal } = require('../server');

test('baueSignal: liefert eine konsistente Struktur auch ganz ohne Daten (Kaltstart)', () => {
  const sig = baueSignal();
  assert.ok(sig.erzeugt);
  assert.equal(sig.kurse.stand, null);
  assert.equal(sig.indikatoren, null);
  assert.ok(sig.hinweis.includes('keine echte Sprachanalyse'));
});

test('baueSignal: spiegelt zustand.kurse/sentiment/makro wider, sobald gesetzt', () => {
  zustand.kurse = {
    csv: 'Date,SPY\n2024-01-02,100',
    indikatoren: { SPY: { kurs: 100 } },
    geladen: ['SPY'], fehler: [], stand: '2024-01-02T00:00:00.000Z'
  };
  zustand.sentiment = { daten: { mittelwert: 0.2, anzahlSchlagzeilen: 3 }, stand: '2024-01-02T00:00:00.000Z' };
  zustand.makro = { daten: { ereignisse: [] }, stand: '2024-01-02T00:00:00.000Z' };

  const sig = baueSignal();
  assert.equal(sig.kurse.geladen[0], 'SPY');
  assert.equal(sig.indikatoren.SPY.kurs, 100);
  assert.equal(sig.sentiment.mittelwert, 0.2);
  assert.deepEqual(sig.makro.ereignisse, []);
});

test('baueSignal: ein gemeldeter letzter Fehler taucht auf, ohne die guten Daten zu loeschen', () => {
  zustand.letzterFehler.kurse = { nachricht: 'Zeitueberschreitung', zeit: '2024-01-03T00:00:00.000Z' };
  const sig = baueSignal();
  assert.equal(sig.kurse.letzterFehler.nachricht, 'Zeitueberschreitung');
  assert.ok(sig.kurse.geladen.includes('SPY')); // alte guten Daten noch da
  delete zustand.letzterFehler.kurse;
});
