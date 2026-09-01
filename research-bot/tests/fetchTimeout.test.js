'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { fetchMitTimeout } = require('../lib/fetchTimeout');

test('fetchMitTimeout: gibt bei rechtzeitiger Antwort das Ergebnis normal durch', async () => {
  const original = global.fetch;
  global.fetch = async (url, opt) => ({ ok: true, status: 200, text: async () => 'ok:' + url });
  try {
    const geholt = fetchMitTimeout(1000);
    const r = await geholt('https://beispiel.test/x');
    assert.equal(await r.text(), 'ok:https://beispiel.test/x');
  } finally {
    global.fetch = original;
  }
});

test('fetchMitTimeout: wirft eine klare Meldung, wenn das Zeitlimit ueberschritten wird', async () => {
  const original = global.fetch;
  global.fetch = (url, opt) => new Promise((resolve, reject) => {
    opt.signal.addEventListener('abort', () => {
      const e = new Error('aborted');
      e.name = 'AbortError';
      reject(e);
    });
    // absichtlich niemals aufloesen - simuliert einen haengenden Server.
  });
  try {
    const geholt = fetchMitTimeout(20);
    await assert.rejects(() => geholt('https://haengt.test/x'), /Zeitueberschreitung nach 20 ms/);
  } finally {
    global.fetch = original;
  }
});

test('fetchMitTimeout: andere Fehler (nicht Timeout) werden unveraendert durchgereicht', async () => {
  const original = global.fetch;
  global.fetch = async () => { throw new Error('DNS-Fehler'); };
  try {
    const geholt = fetchMitTimeout(1000);
    await assert.rejects(() => geholt('https://kaputt.test/x'), /DNS-Fehler/);
  } finally {
    global.fetch = original;
  }
});
