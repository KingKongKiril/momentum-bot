'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { bewerteText, parseRssTitel, holeSentiment } = require('../lib/sentiment');

test('bewerteText: erkennt positive und negative Woerter', () => {
  const pos = bewerteText('Stocks surge to record highs as earnings beat estimates');
  assert.ok(pos.score > 0, `score ${pos.score} sollte positiv sein`);

  const neg = bewerteText('Markets plunge amid recession fears and layoffs');
  assert.ok(neg.score < 0, `score ${neg.score} sollte negativ sein`);
});

test('bewerteText: neutraler Text ohne Lexikon-Treffer ergibt score 0', () => {
  const r = bewerteText('Company announces quarterly shareholder meeting date');
  assert.equal(r.score, 0);
  assert.equal(r.treffer, 0);
});

test('bewerteText: leerer Text crasht nicht', () => {
  const r = bewerteText('');
  assert.equal(r.score, 0);
});

test('parseRssTitel: extrahiert Artikeltitel, ueberspringt den Feed-Titel', () => {
  const xml = `<?xml version="1.0"?>
    <rss><channel>
      <title>MarketWatch Top Stories</title>
      <item><title>Stocks rally as inflation cools</title></item>
      <item><title>Tech shares slump after earnings miss</title></item>
    </channel></rss>`;
  const titel = parseRssTitel(xml);
  assert.deepEqual(titel, ['Stocks rally as inflation cools', 'Tech shares slump after earnings miss']);
});

test('parseRssTitel: dekodiert CDATA und HTML-Entities', () => {
  const xml = `<rss><channel><title>Feed</title>
    <item><title><![CDATA[Fed &amp; markets: rates on hold]]></title></item>
    </channel></rss>`;
  const titel = parseRssTitel(xml);
  assert.deepEqual(titel, ['Fed & markets: rates on hold']);
});

test('parseRssTitel: leere/kaputte Eingabe ergibt leere Liste, kein Crash', () => {
  assert.deepEqual(parseRssTitel(''), []);
  assert.deepEqual(parseRssTitel('<rss><channel><title>Nur Feed-Titel</title></channel></rss>'), []);
});

// ---------- holeSentiment mit injiziertem Fetch ----------

function fakeFetch(text, ok) {
  return async () => ({ ok: ok !== false, status: ok === false ? 500 : 200, text: async () => text });
}

test('holeSentiment: aggregiert Schlagzeilen mehrerer Feeds', async () => {
  const feed1 = `<rss><channel><title>F1</title>
    <item><title>Stocks surge on strong earnings</title></item></channel></rss>`;
  const feed2 = `<rss><channel><title>F2</title>
    <item><title>Markets tumble amid recession fears</title></item></channel></rss>`;

  let anfrage = 0;
  const fetchImpl = async () => {
    anfrage++;
    return { ok: true, status: 200, text: async () => (anfrage === 1 ? feed1 : feed2) };
  };

  const r = await holeSentiment(['https://a.example/rss', 'https://b.example/rss'], fetchImpl);
  assert.equal(r.anzahlSchlagzeilen, 2);
  assert.equal(r.anzahlBewertet, 2);
  assert.ok(r.top.length > 0);
});

test('holeSentiment: ein fehlgeschlagener Feed wird als Fehler gemeldet, nicht als Crash', async () => {
  const feedOk = `<rss><channel><title>F</title>
    <item><title>Stocks rally to new highs</title></item></channel></rss>`;
  let anfrage = 0;
  const fetchImpl = async () => {
    anfrage++;
    if (anfrage === 1) return { ok: true, status: 200, text: async () => feedOk };
    return { ok: false, status: 500, text: async () => 'error' };
  };

  const r = await holeSentiment(['https://a.example/rss', 'https://b.example/rss'], fetchImpl);
  assert.equal(r.anzahlSchlagzeilen, 1);
  assert.equal(r.fehler.length, 1);
});

test('holeSentiment: Mittelwert wird nur ueber bewertete Schlagzeilen gebildet', async () => {
  const feed = `<rss><channel><title>F</title>
    <item><title>Company announces new product lineup</title></item>
    <item><title>Stocks surge to record highs</title></item></channel></rss>`;
  const r = await holeSentiment(['https://a.example/rss'], fakeFetch(feed));
  assert.equal(r.anzahlSchlagzeilen, 2);
  assert.equal(r.anzahlBewertet, 1); // nur die zweite Schlagzeile hat Lexikon-Treffer
  assert.ok(r.mittelwert > 0);
});
