'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

// server.js liest config.js, die CACHE_DATEI beim require() aus der
// Umgebung liest - fuer isolierte Tests wird das Modul pro Test frisch
// geladen, mit der Umgebungsvariable auf einen temporaeren Pfad gesetzt.
function frischesServerModul(cacheDatei) {
  process.env.CACHE_DATEI = cacheDatei;
  delete require.cache[require.resolve('../config')];
  delete require.cache[require.resolve('../server')];
  return require('../server');
}

test('server: ein erfolgreicher Refresh persistiert, ein Neustart stellt ihn wieder her', () => {
  const cacheDatei = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rb-server-')), 'zustand.json');

  const erste = frischesServerModul(cacheDatei);
  erste.zustand.kurse = {
    csv: 'Date,SPY\n2024-01-01,100', indikatoren: null,
    geladen: ['SPY'], fehler: [], stand: '2024-01-01T00:00:00.000Z'
  };
  erste.persistiere();

  const zweite = frischesServerModul(cacheDatei);
  assert.equal(zweite.zustand.kurse.csv, null); // frisches Modul, noch nicht wiederhergestellt
  const wiederhergestellt = zweite.wiederherstellen();
  assert.equal(wiederhergestellt, true);
  assert.equal(zweite.zustand.kurse.csv, 'Date,SPY\n2024-01-01,100');
  assert.deepEqual(zweite.zustand.kurse.geladen, ['SPY']);
});

test('server: wiederherstellen() ohne vorhandene Cache-Datei liefert false, Zustand bleibt leer', () => {
  const cacheDatei = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rb-server-')), 'gibts-nicht.json');
  const mod = frischesServerModul(cacheDatei);
  assert.equal(mod.wiederherstellen(), false);
  assert.equal(mod.zustand.kurse.csv, null);
});

test('server: leerer CACHE_DATEI-Wert deaktiviert Persistenz vollstaendig', () => {
  const mod = frischesServerModul('');
  mod.zustand.kurse = { csv: 'Date,SPY\n2024-01-01,100', indikatoren: null, geladen: ['SPY'], fehler: [], stand: 'x' };
  // Darf nicht werfen, auch wenn nichts zu tun ist.
  mod.persistiere();
  assert.equal(mod.wiederherstellen(), false);
});

test('server: baueSignal() bleibt konsistent mit wiederhergestellten Daten', () => {
  const cacheDatei = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rb-server-')), 'zustand.json');
  const erste = frischesServerModul(cacheDatei);
  erste.zustand.makro = { daten: { ereignisse: [{ typ: 'NFP', datum: '2024-02-02', beschreibung: 'x' }] }, stand: '2024-01-01T00:00:00.000Z' };
  erste.persistiere();

  const zweite = frischesServerModul(cacheDatei);
  zweite.wiederherstellen();
  const sig = zweite.baueSignal();
  assert.equal(sig.makro.ereignisse[0].typ, 'NFP');
});
