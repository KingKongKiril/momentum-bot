'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { ersterFreitagDesMonats, naechsteNfp, naechsteEreignisse, FOMC_TERMINE } = require('../lib/makro');

test('ersterFreitagDesMonats: findet den korrekten ersten Freitag', () => {
  // Februar 2024 beginnt an einem Donnerstag -> erster Freitag ist der 2.
  const d = ersterFreitagDesMonats(2024, 1); // Monat 0-indiziert: 1 = Februar
  assert.equal(d.toISOString().slice(0, 10), '2024-02-02');
  assert.equal(d.getUTCDay(), 5);
});

test('ersterFreitagDesMonats: funktioniert auch wenn der Monat mit Freitag beginnt', () => {
  // Maerz 2024 beginnt an einem Freitag.
  const d = ersterFreitagDesMonats(2024, 2);
  assert.equal(d.toISOString().slice(0, 10), '2024-03-01');
});

test('naechsteNfp: liefert die angeforderte Anzahl kuenftiger erster Freitage', () => {
  const ab = new Date('2024-01-10T00:00:00Z');
  const termine = naechsteNfp(ab, 3);
  assert.equal(termine.length, 3);
  assert.equal(termine[0].toISOString().slice(0, 10), '2024-02-02');
  for (let i = 1; i < termine.length; i++) assert.ok(termine[i] > termine[i - 1]);
});

test('naechsteNfp: ein Termin am Stichtag selbst zaehlt noch mit', () => {
  const ersterFreitag = ersterFreitagDesMonats(2024, 5); // Juni 2024
  const termine = naechsteNfp(ersterFreitag, 1);
  assert.equal(termine[0].getTime(), ersterFreitag.getTime());
});

test('naechsteEreignisse: FOMC- und NFP-Termine chronologisch sortiert innerhalb des Fensters', () => {
  const ab = new Date('2024-01-01T00:00:00Z');
  const r = naechsteEreignisse(ab, 60);
  assert.ok(r.ereignisse.length > 0);
  for (let i = 1; i < r.ereignisse.length; i++) {
    assert.ok(r.ereignisse[i].datum >= r.ereignisse[i - 1].datum);
  }
  assert.ok(r.ereignisse.every(e => e.datum >= ab && e.datum <= new Date(ab.getTime() + 60 * 864e5)));
});

test('naechsteEreignisse: meldet fomcVeraltet, wenn die Tabelle keine kuenftigen Termine mehr hat', () => {
  const weitInDerZukunft = new Date(
    new Date(FOMC_TERMINE[FOMC_TERMINE.length - 1] + 'T00:00:00Z').getTime() + 400 * 864e5);
  const r = naechsteEreignisse(weitInDerZukunft, 45);
  assert.equal(r.fomcVeraltet, true);
  assert.ok(r.hinweis && r.hinweis.includes('makro.js'));
  assert.ok(!r.ereignisse.some(e => e.typ === 'FOMC'));
});

test('naechsteEreignisse: ein Termin von heute bleibt drin, auch wenn "ab" spaeter am selben Tag liegt', () => {
  // FOMC_TERMINE[0] ist Mitternacht UTC - "ab" wird auf denselben
  // Kalendertag gesetzt, aber 23 Stunden spaeter.
  const heute = new Date(FOMC_TERMINE[0] + 'T00:00:00Z');
  const spaeterAmTag = new Date(heute.getTime() + 23 * 3600 * 1000);
  const r = naechsteEreignisse(spaeterAmTag, 1);
  assert.ok(r.ereignisse.some(e => e.typ === 'FOMC' && e.datum.getTime() === heute.getTime()),
    'der heutige FOMC-Termin sollte trotz spaeter Tageszeit noch im Fenster sein');
});

test('naechsteEreignisse: ohne fomcVeraltet ist der Hinweis null', () => {
  const r = naechsteEreignisse(new Date('2024-01-01T00:00:00Z'), 30);
  assert.equal(r.fomcVeraltet, false);
  assert.equal(r.hinweis, null);
});
