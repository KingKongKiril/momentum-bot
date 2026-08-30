/* Makro-Kalender: wichtige wiederkehrende US-Wirtschaftstermine.

   Zwei sehr unterschiedliche Verlaesslichkeitsstufen, absichtlich nicht
   vermischt:

   1. NFP (Non-Farm Payrolls): immer der erste Freitag des Monats -
      eine feste Regel, niemals veraltet, keine Tabelle noetig.

   2. FOMC-Sitzungen: das Datum steht nicht aus einer Regel fest,
      sondern wird von der Fed selbst festgelegt und hier als Tabelle
      gefuehrt. Diese Tabelle veraltet zwangslaeufig - deshalb prueft
      naechsteEreignisse(), ob der letzte bekannte Termin schon in der
      Vergangenheit liegt, und meldet das explizit statt einfach still
      keine weiteren Termine mehr zu zeigen.

      Quelle zum Abgleichen/Aktualisieren:
      https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm

   CPI-Veroeffentlichungen haben kein festes Datum (Bureau of Labor
   Statistics, ueblicherweise Mitte des Monats) - hier bewusst nur als
   grobe Woche ausgewiesen, nicht als Tageszahl, um keine falsche
   Praezision vorzutaeuschen. */
'use strict';

// Stand: siehe Quelle oben. Bei Bedarf ergaenzen/aktualisieren.
const FOMC_TERMINE = [
  '2026-01-28', '2026-03-18', '2026-04-29', '2026-06-17',
  '2026-07-29', '2026-09-16', '2026-10-28', '2026-12-09'
];

function zuDatum(s) {
  return new Date(s + 'T00:00:00Z');
}

function ersterFreitagDesMonats(jahr, monatNull) {
  const d = new Date(Date.UTC(jahr, monatNull, 1));
  const wochentag = d.getUTCDay(); // 0=So .. 6=Sa
  const versatz = (5 - wochentag + 7) % 7; // Tage bis zum naechsten Freitag
  d.setUTCDate(1 + versatz);
  return d;
}

// Naechste(r) NFP-Termin(e) ab einem Stichtag, "anzahl" Monate voraus.
function naechsteNfp(ab, anzahl) {
  anzahl = anzahl || 2;
  const raus = [];
  let jahr = ab.getUTCFullYear(), monat = ab.getUTCMonth();
  while (raus.length < anzahl) {
    const termin = ersterFreitagDesMonats(jahr, monat);
    if (termin >= ab) raus.push(termin);
    monat++;
    if (monat > 11) { monat = 0; jahr++; }
  }
  return raus;
}

// Alle Ereignisse (FOMC + NFP) in den naechsten "tageVoraus" Tagen ab
// "ab", chronologisch sortiert.
function naechsteEreignisse(ab, tageVoraus) {
  ab = ab || new Date();
  tageVoraus = tageVoraus || 45;
  // Ereignis-Daten stehen immer auf Mitternacht UTC. Verglichen wird
  // deshalb auf Tagesbasis, nicht auf den exakten Aufrufzeitpunkt -
  // sonst faellt ein Termin von heute schon nach Mitternacht UTC
  // faelschlich aus dem Fenster, obwohl er noch bevorsteht.
  const abTag = new Date(Date.UTC(ab.getUTCFullYear(), ab.getUTCMonth(), ab.getUTCDate()));
  const grenze = new Date(abTag.getTime() + tageVoraus * 864e5);

  const ereignisse = [];

  const fomcDaten = FOMC_TERMINE.map(zuDatum);
  for (const d of fomcDaten) {
    if (d >= abTag && d <= grenze) {
      ereignisse.push({ typ: 'FOMC', datum: d, beschreibung: 'FOMC-Zinsentscheid' });
    }
  }

  for (const d of naechsteNfp(abTag, 3)) {
    if (d <= grenze) {
      ereignisse.push({ typ: 'NFP', datum: d, beschreibung: 'US-Arbeitsmarktbericht (Non-Farm Payrolls)' });
    }
  }

  ereignisse.sort((a, b) => a.datum - b.datum);

  const letzterFomc = fomcDaten[fomcDaten.length - 1];
  const fomcVeraltet = !letzterFomc || letzterFomc < abTag;

  return {
    ab, tageVoraus,
    ereignisse,
    fomcVeraltet,
    hinweis: fomcVeraltet
      ? 'FOMC-Terminliste enthaelt keine Termine mehr in der Zukunft - ' +
        'in research-bot/lib/makro.js gegen die Fed-Quelle aktualisieren.'
      : null
  };
}

module.exports = { ersterFreitagDesMonats, naechsteNfp, naechsteEreignisse, FOMC_TERMINE };
