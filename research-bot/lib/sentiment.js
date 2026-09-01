/* Schlagzeilen-Stimmung aus RSS-Feeds.

   Wichtiger Vorbehalt, der auch im Bot angezeigt wird: das ist ein
   Zaehl-Lexikon auf Ueberschriften, keine echte Sprachanalyse. Es
   versteht keine Verneinung ("nicht so schlecht wie befuerchtet"),
   keine Ironie und keinen Kontext. Als grober Indikator fuer die
   Marktstimmung des Tages brauchbar, nicht als Handelssignal. */
'use strict';

const { POSITIV, NEGATIV } = require('./lexikon');
const { fetchMitTimeout } = require('./fetchTimeout');

// Reine Bewertung eines einzelnen Textes. score in [-1, 1].
function bewerteText(text) {
  const woerter = text.toLowerCase().match(/[a-zäöüß-]+/g) || [];
  if (!woerter.length) return { score: 0, treffer: 0 };

  let pos = 0, neg = 0;
  for (const w of woerter) {
    if (POSITIV.includes(w)) pos++;
    if (NEGATIV.includes(w)) neg++;
  }
  const treffer = pos + neg;
  const score = treffer ? (pos - neg) / treffer : 0;
  return { score, treffer, positiv: pos, negativ: neg };
}

// Extrahiert <title>...</title> aus RSS/Atom-XML per Regex statt eines
// vollen XML-Parsers - reicht fuer die schlichten Feeds, die hier
// genutzt werden, und haelt den Dienst dependency-frei.
function parseRssTitel(xml) {
  const titel = [];
  const re = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/gi;
  let m;
  let erster = true;
  while ((m = re.exec(xml)) !== null) {
    // Der erste Treffer ist meist der Feed-Titel selbst, nicht ein
    // Artikel - wird uebersprungen.
    if (erster) { erster = false; continue; }
    const t = m[1]
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .trim();
    if (t) titel.push(t);
  }
  return titel;
}

// Orchestriert den Abruf mehrerer Feeds. fetchImpl injizierbar fuer Tests,
// sonst mit Timeout - ein haengender Feed darf den Refresh-Zyklus nicht
// auf unbestimmte Zeit blockieren.
async function holeSentiment(feedUrls, fetchImpl, maxProFeed) {
  fetchImpl = fetchImpl || fetchMitTimeout(10000);
  maxProFeed = maxProFeed || 15;

  const alleSchlagzeilen = [];
  const fehler = [];

  await Promise.all(feedUrls.map(async url => {
    try {
      const antwort = await fetchImpl(url);
      if (!antwort.ok) throw new Error(`HTTP ${antwort.status}`);
      const xml = await antwort.text();
      const titel = parseRssTitel(xml).slice(0, maxProFeed);
      for (const t of titel) alleSchlagzeilen.push({ titel: t, quelle: url });
    } catch (e) {
      fehler.push({ feed: url, fehler: e.message });
    }
  }));

  const bewertet = alleSchlagzeilen.map(h => Object.assign({}, h, bewerteText(h.titel)));
  const mitTreffer = bewertet.filter(h => h.treffer > 0);
  const mittelwert = mitTreffer.length
    ? mitTreffer.reduce((a, h) => a + h.score, 0) / mitTreffer.length : 0;

  return {
    anzahlSchlagzeilen: bewertet.length,
    anzahlBewertet: mitTreffer.length,
    mittelwert,
    // Extremste Schlagzeilen in beide Richtungen - fuer den
    // menschlichen Blick, nicht als Beleg fuer den Mittelwert.
    top: bewertet.slice().sort((a, b) => b.score - a.score).slice(0, 5),
    flop: bewertet.slice().sort((a, b) => a.score - b.score).slice(0, 5),
    fehler
  };
}

module.exports = { bewerteText, parseRssTitel, holeSentiment };
