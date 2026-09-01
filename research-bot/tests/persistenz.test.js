'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { speichere, lade } = require('../lib/persistenz');

function tempDatei() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rb-test-')), 'zustand.json');
}

test('speichere/lade: Daten kommen unveraendert zurueck', () => {
  const datei = tempDatei();
  const daten = { kurse: { csv: 'Date,SPY\n2024-01-01,100' }, stand: '2024-01-01T00:00:00.000Z' };
  assert.equal(speichere(daten, datei), true);
  assert.deepEqual(lade(datei), daten);
});

test('speichere: legt fehlende Verzeichnisse an', () => {
  const basis = fs.mkdtempSync(path.join(os.tmpdir(), 'rb-test-'));
  const datei = path.join(basis, 'tief', 'verschachtelt', 'zustand.json');
  assert.equal(speichere({ x: 1 }, datei), true);
  assert.deepEqual(lade(datei), { x: 1 });
});

test('lade: gibt null zurueck, wenn die Datei nicht existiert', () => {
  assert.equal(lade('/nicht/vorhanden/zustand.json'), null);
});

test('lade: gibt null zurueck bei kaputtem JSON statt zu werfen', () => {
  const datei = tempDatei();
  fs.mkdirSync(path.dirname(datei), { recursive: true });
  fs.writeFileSync(datei, '{kaputt: json,,,');
  assert.equal(lade(datei), null);
});

test('speichere: schlaegt strukturell fehl (Pfadsegment ist eine Datei, kein Verzeichnis), ohne zu werfen', () => {
  // Kein chmod-Trick, der liefe unter root ins Leere - stattdessen ein
  // Pfad, der strukturell nie ein gueltiges Verzeichnis werden kann.
  const basis = fs.mkdtempSync(path.join(os.tmpdir(), 'rb-test-'));
  const dateiAlsHindernis = path.join(basis, 'ist-eine-datei');
  fs.writeFileSync(dateiAlsHindernis, 'x');
  const unmoeglich = path.join(dateiAlsHindernis, 'zustand.json');

  assert.equal(speichere({ x: 1 }, unmoeglich), false);
});
