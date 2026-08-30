'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { stooqSymbol, stooqUrl, parseStooqCsv, mergeReihen, holeKurse } = require('../lib/kurse');

test('stooqSymbol/stooqUrl: haengt .us an und baut die erwartete URL', () => {
  assert.equal(stooqSymbol('SPY'), 'spy.us');
  assert.equal(stooqUrl('SPY'), 'https://stooq.com/q/d/l/?s=spy.us&i=d');
});

test('parseStooqCsv: liest Date/Close aus einer gueltigen Antwort', () => {
  const csv = 'Date,Open,High,Low,Close,Volume\n' +
    '2024-01-02,470,472,469,471.5,1000\n' +
    '2024-01-03,471,473,470,472.3,1200';
  const r = parseStooqCsv(csv);
  assert.equal(r.length, 2);
  assert.deepEqual(r[0], { datum: '2024-01-02', close: 471.5 });
});

test('parseStooqCsv: wirft bei unbekanntem Symbol / Fehlerantwort', () => {
  assert.throws(() => parseStooqCsv('N/D'), /Unerwartetes Antwortformat/);
});

test('parseStooqCsv: ueberspringt unvollstaendige oder ungueltige Zeilen', () => {
  const csv = 'Date,Open,High,Low,Close,Volume\n' +
    '2024-01-02,470,472,469,471.5,1000\n' +
    '2024-01-03,471,473,470,-1,1200\n' +
    'garbage-line';
  const r = parseStooqCsv(csv);
  assert.equal(r.length, 1);
});

test('mergeReihen: nur Daten, an denen ALLE Ticker einen Kurs haben', () => {
  const proTicker = {
    SPY: [{ datum: '2024-01-02', close: 100 }, { datum: '2024-01-03', close: 101 }],
    SHY: [{ datum: '2024-01-02', close: 50 }] // fehlt am 03.
  };
  const csv = mergeReihen(proTicker);
  const zeilen = csv.trim().split('\n');
  assert.equal(zeilen.length, 2); // Header + genau ein gemeinsamer Tag
  assert.equal(zeilen[0], 'Date,SPY,SHY');
  assert.equal(zeilen[1], '2024-01-02,100,50');
});

test('mergeReihen: wirft, wenn es keine gemeinsamen Handelstage gibt', () => {
  const proTicker = {
    SPY: [{ datum: '2024-01-02', close: 100 }],
    SHY: [{ datum: '2024-01-03', close: 50 }]
  };
  assert.throws(() => mergeReihen(proTicker), /Keine gemeinsamen Handelstage/);
});

// ---------- holeKurse mit injiziertem Fetch (kein echtes Netzwerk) ----------

function fakeFetch(antworten) {
  return async url => {
    for (const [muster, text] of Object.entries(antworten)) {
      if (url.includes(muster)) {
        return { ok: true, status: 200, text: async () => text };
      }
    }
    return { ok: false, status: 404, text: async () => 'not found' };
  };
}

test('holeKurse: fuehrt mehrere Ticker zusammen', async () => {
  const csvSpy = 'Date,Open,High,Low,Close,Volume\n2024-01-02,1,1,1,100,1\n2024-01-03,1,1,1,101,1';
  const csvShy = 'Date,Open,High,Low,Close,Volume\n2024-01-02,1,1,1,50,1\n2024-01-03,1,1,1,50.1,1';
  const fetchImpl = fakeFetch({ 'spy.us': csvSpy, 'shy.us': csvShy });

  const { csv, proTicker, geladen, fehler } = await holeKurse(['SPY', 'SHY'], fetchImpl);
  assert.deepEqual(geladen.sort(), ['SHY', 'SPY']);
  assert.equal(fehler.length, 0);
  assert.equal(csv.trim().split('\n').length, 3); // Header + 2 Tage
  assert.equal(proTicker.SPY.length, 2);
});

test('holeKurse: ein fehlerhafter Ticker wird uebersprungen, die anderen liefern trotzdem', async () => {
  const csvSpy = 'Date,Open,High,Low,Close,Volume\n2024-01-02,1,1,1,100,1';
  const fetchImpl = fakeFetch({ 'spy.us': csvSpy }); // shy.us liefert 404 -> Fehler

  const { geladen, fehler } = await holeKurse(['SPY', 'SHY'], fetchImpl);
  assert.deepEqual(geladen, ['SPY']);
  assert.equal(fehler.length, 1);
  assert.equal(fehler[0].ticker, 'SHY');
});

test('holeKurse: wirft nur, wenn WIRKLICH kein Ticker geladen werden konnte', async () => {
  const fetchImpl = fakeFetch({}); // alles 404
  await assert.rejects(() => holeKurse(['SPY', 'SHY'], fetchImpl), /Kein einziger Ticker/);
});
