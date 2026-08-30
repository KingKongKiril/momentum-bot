/* Kernlogik des Momentum-Bots.
   Bewusst von der Oberflaeche getrennt, damit sie testbar ist.
   Portierung von src/momentum.py - die Ergebnisse muessen
   uebereinstimmen. */

(function (global) {
  'use strict';

  // ---------- CSV ----------
  function parseCsv(text) {
    const zeilen = text.trim().split(/\r?\n/).filter(z => z.trim());
    if (zeilen.length < 2) throw new Error('CSV enthaelt zu wenige Zeilen');

    const kopf = zeilen[0].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    const ticker = kopf.slice(1).filter(Boolean);
    const daten = [];

    for (let i = 1; i < zeilen.length; i++) {
      const teile = zeilen[i].split(',');
      const datum = new Date(teile[0].trim().slice(0, 10) + 'T00:00:00Z');
      if (isNaN(datum)) continue;
      const werte = {};
      let vollstaendig = true;
      for (let j = 0; j < ticker.length; j++) {
        const v = parseFloat(teile[j + 1]);
        if (!isFinite(v) || v <= 0) { vollstaendig = false; break; }
        werte[ticker[j]] = v;
      }
      if (vollstaendig) daten.push({ datum, werte });
    }
    if (!daten.length) throw new Error('Keine verwertbaren Zeilen gefunden');
    daten.sort((a, b) => a.datum - b.datum);
    return { ticker, daten };
  }

  // ---------- Datenqualitaet ----------
  function pruefeQualitaet(reihe) {
    const { daten } = reihe;
    const gesehen = new Set();
    let doppelte = 0;
    for (const z of daten) {
      const s = z.datum.toISOString().slice(0, 10);
      if (gesehen.has(s)) doppelte++;
      gesehen.add(s);
    }

    // Fehlende Werktage. Wochenenden sind KEINE Luecken -
    // dieser Fehler hat das Projekt zwei Anlaeufe gekostet.
    let erwartet = 0;
    const start = daten[0].datum, ende = daten[daten.length - 1].datum;
    for (let t = new Date(start); t <= ende; t.setUTCDate(t.getUTCDate() + 1)) {
      const wt = t.getUTCDay();
      if (wt !== 0 && wt !== 6) erwartet++;
    }
    const fehlend = Math.max(0, erwartet - gesehen.size);
    const jahre = Math.max((ende - start) / 3.15576e10, 1e-9);

    return {
      zeilen: daten.length,
      von: start, bis: ende,
      doppelte,
      erwarteteWerktage: erwartet,
      fehlendeWerktage: fehlend,
      fehlendProJahr: fehlend / jahre,
      // Rund 9 Boersenfeiertage pro Jahr sind normal
      verdaechtig: fehlend / jahre > 15
    };
  }

  // ---------- Monatsenden ----------
  function monatsenden(reihe) {
    const raus = [];
    for (let i = 0; i < reihe.daten.length; i++) {
      const jetzt = reihe.daten[i].datum;
      const naechster = reihe.daten[i + 1];
      const letzterImMonat = !naechster ||
        naechster.datum.getUTCMonth() !== jetzt.getUTCMonth() ||
        naechster.datum.getUTCFullYear() !== jetzt.getUTCFullYear();
      if (letzterImMonat) raus.push(reihe.daten[i]);
    }
    // Der letzte Monat ist unvollstaendig und wird verworfen.
    // Sonst wird ein Bruchteil eines Monats als volle
    // Monatsrendite interpretiert.
    return raus.slice(0, -1);
  }

  // ---------- Handelspunkte (Monat oder Tag) ----------
  /* Alle Funktionen unten rechnen auf einer Folge von "Punkten" -
     mal Monatsenden, mal jedem einzelnen Handelstag. Fuer
     Day-Trading braucht es keine Sonderbehandlung des letzten
     Punktes: jede Zeile der CSV ist bereits ein abgeschlossener
     Schlusskurs, anders als ein unvollstaendiger laufender Monat. */
  function handelspunkte(reihe, einheit) {
    return einheit === 'tag' ? reihe.daten.slice() : monatsenden(reihe);
  }

  // Anzahl Punkte pro Jahr - fuer Annualisierung von Rendite und Sharpe.
  function periodenProJahr(einheit) {
    return einheit === 'tag' ? 252 : 12;
  }

  function tagePlus(d, n) {
    const t = new Date(d);
    t.setUTCDate(t.getUTCDate() + n);
    return t;
  }

  // ---------- Volatilitaet ----------
  // Rechnet an jedem uebergebenen Punkt (Monatsende oder Handelstag)
  // die annualisierte Vola aus den vorangehenden taeglichen Renditen.
  function volaAmPunkt(reihe, punkte, fenster) {
    const werte = [];
    let zeiger = 0;
    for (const m of punkte) {
      while (zeiger < reihe.daten.length - 1 &&
             reihe.daten[zeiger + 1].datum <= m.datum) zeiger++;
      const v = {};
      for (const t of reihe.ticker) {
        const r = [];
        for (let i = Math.max(1, zeiger - fenster + 1); i <= zeiger; i++) {
          r.push(reihe.daten[i].werte[t] / reihe.daten[i - 1].werte[t] - 1);
        }
        if (r.length < 5) { v[t] = NaN; continue; }
        const m0 = r.reduce((a, b) => a + b, 0) / r.length;
        const varianz = r.reduce((a, b) => a + (b - m0) ** 2, 0) / (r.length - 1);
        v[t] = Math.sqrt(varianz) * Math.sqrt(252);
      }
      werte.push(v);
    }
    return werte;
  }

  // ---------- Momentum ----------
  function momentum(monate, i, perioden, ticker) {
    const m = {};
    for (const t of ticker) {
      let summe = 0, gueltig = 0;
      for (const p of perioden) {
        if (i - p < 0) continue;
        summe += monate[i].werte[t] / monate[i - p].werte[t] - 1;
        gueltig++;
      }
      m[t] = gueltig === perioden.length ? summe / gueltig : NaN;
    }
    return m;
  }

  // ---------- Auswahl und Gewichtung ----------
  function gewichte(mom, vola, ticker, sicher, topN) {
    const kandidaten = ticker
      .filter(t => t !== sicher && isFinite(mom[t]) && mom[t] > mom[sicher])
      .sort((a, b) => mom[b] - mom[a])
      .slice(0, topN);

    const g = {};
    let summe = 0;
    if (kandidaten.length) {
      // Inverse Volatilitaetsgewichtung: ohne sie dominiert die
      // schwankungsstaerkste Anlage das gesamte Risiko.
      const inv = kandidaten.map(t => (isFinite(vola[t]) && vola[t] > 0) ? 1 / vola[t] : 0);
      const invSumme = inv.reduce((a, b) => a + b, 0);
      if (invSumme > 0) {
        kandidaten.forEach((t, k) => {
          g[t] = (inv[k] / invSumme) * (kandidaten.length / topN);
          summe += g[t];
        });
      }
    }
    g[sicher] = Math.max(0, 1 - summe);
    return { gewichte: g, gewaehlt: kandidaten };
  }

  // ---------- Backtest ----------
  function backtest(reihe, opt) {
    const o = Object.assign({
      sicher: 'SHY', topN: 4, perioden: [3, 6, 12],
      volaFenster: 60, kosten: 0.002, einheit: 'monat'
    }, opt || {});

    if (!reihe.ticker.includes(o.sicher)) {
      throw new Error(`Geldmarkt-Ticker ${o.sicher} fehlt in den Daten`);
    }

    // einheit 'monat': Positionen werden am Monatsende neu gewichtet.
    // einheit 'tag': an jedem Handelstag - deutlich mehr Umschichtung,
    // die Kosten je Umschichtung schlagen entsprechend oefter zu.
    const punkte = handelspunkte(reihe, o.einheit);
    const vola = volaAmPunkt(reihe, punkte, o.volaFenster);
    const start = Math.max(...o.perioden);

    let kapital = 1, alt = {};
    const verlauf = [];

    for (let i = start; i < punkte.length - 1; i++) {
      const mom = momentum(punkte, i, o.perioden, reihe.ticker);
      if (!isFinite(mom[o.sicher])) continue;

      const { gewichte: g, gewaehlt } = gewichte(mom, vola[i], reihe.ticker, o.sicher, o.topN);

      // Gewichte aus Periode i auf die Rendite von i+1 anwenden.
      // Man handelt nie zu einem Kurs, den man erst spaeter kennt.
      let r = 0;
      for (const t in g) {
        if (g[t] <= 0) continue;
        r += g[t] * (punkte[i + 1].werte[t] / punkte[i].werte[t] - 1);
      }

      let umschichtung = 0;
      const alleTicker = new Set([...Object.keys(g), ...Object.keys(alt)]);
      for (const t of alleTicker) umschichtung += Math.abs((g[t] || 0) - (alt[t] || 0));
      // Turnover als "eine Seite" des Portfolioumsatzes - 100 % Turnover
      // heisst: das gesamte Portfolio wurde in dieser Periode ausgetauscht.
      const turnover = umschichtung / 2;
      r -= turnover * o.kosten;

      kapital *= (1 + r);
      verlauf.push({
        datum: punkte[i + 1].datum, rendite: r, equity: kapital,
        gewaehlt, cash: g[o.sicher], turnover
      });
      alt = g;
    }

    if (!verlauf.length) throw new Error('Zu wenige Perioden fuer einen Backtest');
    return verlauf;
  }

  // ---------- Kennzahlen ----------
  // periodenProJahrWert: 12 fuer Monatsrenditen, 252 fuer Tagesrenditen.
  // mitTurnover: false spart die Turnover-Aggregation - genutzt im
  // Walk-Forward-Kandidatenvergleich, der pro Fenster viele Backtests
  // durchrechnet und davon nur den Sharpe liest.
  function kennzahlen(verlauf, periodenProJahrWert, mitTurnover) {
    periodenProJahrWert = periodenProJahrWert || 12;
    if (mitTurnover === undefined) mitTurnover = true;
    const r = verlauf.map(v => v.rendite);
    const eq = verlauf.map(v => v.equity);
    const jahre = r.length / periodenProJahrWert;
    const mittel = r.reduce((a, b) => a + b, 0) / r.length;
    const std = Math.sqrt(r.reduce((a, b) => a + (b - mittel) ** 2, 0) / (r.length - 1));
    const sharpe = std > 0 ? (mittel / std) * Math.sqrt(periodenProJahrWert) : 0;

    let spitze = -Infinity, maxDd = 0;
    for (const w of eq) {
      if (w > spitze) spitze = w;
      maxDd = Math.min(maxDd, w / spitze - 1);
    }

    // Turnover fehlt nur, wenn jemand verlauf-Eintraege selbst zusammenbaut
    // statt sie aus backtest() zu beziehen (z.B. in Tests) - dann bleibt
    // das Feld undefiniert.
    let turnoverMittel;
    if (mitTurnover) {
      const turnoverWerte = verlauf.map(v => v.turnover).filter(x => x !== undefined);
      turnoverMittel = turnoverWerte.length
        ? turnoverWerte.reduce((a, b) => a + b, 0) / turnoverWerte.length : undefined;
    }

    return {
      n: r.length, periodenProJahr: periodenProJahrWert, jahre,
      endwert: eq[eq.length - 1],
      cagr: Math.pow(eq[eq.length - 1], 1 / jahre) - 1,
      maxDrawdown: maxDd,
      sharpe,
      positivAnteil: r.filter(x => x > 0).length / r.length,
      schlechtesteRendite: Math.min(...r),
      // Standardfehler: ein gemessener Sharpe ist eine Schaetzung,
      // kein Messwert.
      sharpeFehler: Math.sqrt((1 + 0.5 * sharpe ** 2) / jahre),
      turnoverMittel,
      // Wie oft das Portfolio rechnerisch pro Jahr komplett ausgetauscht wird.
      turnoverProJahr: turnoverMittel !== undefined ? turnoverMittel * periodenProJahrWert : undefined
    };
  }

  // ---------- Hebel ----------
  function hebel(verlauf, faktor, finanzierungPa, marginSchwelle, periodenProJahrWert) {
    finanzierungPa = finanzierungPa === undefined ? 0.06 : finanzierungPa;
    marginSchwelle = marginSchwelle === undefined ? 0.30 : marginSchwelle;
    periodenProJahrWert = periodenProJahrWert || 12;
    const kosten = finanzierungPa / periodenProJahrWert * (faktor - 1);

    let kapital = 1, aktiv = true, liquidationen = 0;
    let spitze = -Infinity, maxDd = 0;

    for (const v of verlauf) {
      let rEff;
      if (aktiv) {
        rEff = faktor * v.rendite - kosten;
        const quote = faktor > 0 ? (1 + faktor * v.rendite) / faktor : 1;
        if (quote < marginSchwelle) { liquidationen++; aktiv = false; }
      } else {
        // Nach Zwangsliquidation laeuft der Rest ungehebelt weiter -
        // die Erholung findet ohne einen statt.
        rEff = v.rendite;
      }
      kapital = Math.max(kapital * (1 + rEff), 1e-9);
      if (kapital > spitze) spitze = kapital;
      maxDd = Math.min(maxDd, kapital / spitze - 1);
    }

    const jahre = verlauf.length / periodenProJahrWert;
    return {
      faktor, endwert: kapital,
      cagr: Math.pow(kapital, 1 / jahre) - 1,
      maxDrawdown: maxDd,
      liquidationen,
      finanzierung: finanzierungPa * (faktor - 1)
    };
  }

  function kelly(verlauf, risikofreiPa, periodenProJahrWert) {
    risikofreiPa = risikofreiPa === undefined ? 0.036 : risikofreiPa;
    periodenProJahrWert = periodenProJahrWert || 12;
    const r = verlauf.map(v => v.rendite);
    const mittel = r.reduce((a, b) => a + b, 0) / r.length;
    const std = Math.sqrt(r.reduce((a, b) => a + (b - mittel) ** 2, 0) / (r.length - 1));
    const mu = mittel * periodenProJahrWert, sigma = std * Math.sqrt(periodenProJahrWert);
    const ueberschuss = mu - risikofreiPa;
    return {
      renditePa: mu, volaPa: sigma,
      sharpe: ueberschuss / sigma,
      kelly: ueberschuss / (sigma * sigma),
      halbKelly: ueberschuss / (sigma * sigma) / 2
    };
  }

  // ---------- Aktuelles Signal ----------
  function aktuellesSignal(reihe, opt) {
    const o = Object.assign({
      sicher: 'SHY', topN: 4, perioden: [3, 6, 12], volaFenster: 60, einheit: 'monat'
    }, opt || {});
    const punkte = handelspunkte(reihe, o.einheit);
    if (!punkte.length) {
      // Bei einheit 'monat' braucht es mindestens einen vollstaendig
      // abgeschlossenen Monat - monatsenden() verwirft den laufenden.
      throw new Error(o.einheit === 'tag'
        ? 'Zu wenige Daten fuer ein Signal - mindestens ein Handelstag noetig'
        : 'Zu wenige Daten fuer ein Signal - mindestens ein vollstaendig abgeschlossener Monat noetig');
    }
    const vola = volaAmPunkt(reihe, punkte, o.volaFenster);
    const i = punkte.length - 1;
    const mom = momentum(punkte, i, o.perioden, reihe.ticker);
    const { gewichte: g, gewaehlt } = gewichte(mom, vola[i], reihe.ticker, o.sicher, o.topN);
    return { basis: punkte[i].datum, momentum: mom, vola: vola[i], gewichte: g, gewaehlt };
  }

  // ---------- Teilzeitraum ----------
  function ausschnitt(reihe, von, bis) {
    return {
      ticker: reihe.ticker,
      daten: reihe.daten.filter(z => z.datum >= von && z.datum < bis)
    };
  }

  function jahrePlus(d, n) {
    const t = new Date(d);
    t.setUTCFullYear(t.getUTCFullYear() + n);
    return t;
  }

  // ---------- Walk-Forward ----------
  /* Der haerteste Test ohne Zeitablauf.

     Parameter werden ausschliesslich auf Vergangenheitsdaten
     gewaehlt und dann auf dem naechsten, ungesehenen Abschnitt
     angewendet. Aneinandergereiht ergibt sich ein Verlauf, in dem
     nie Zukunftswissen steckte.

     Faellt das Ergebnis deutlich gegenueber dem festen Backtest ab,
     hing dessen gute Zahl daran, die richtigen Parameter zu kennen -
     und die kennt man im Voraus nie. */
  const WF_KANDIDATEN_MONAT = [];
  [3, 4, 5, 6].forEach(n =>
    [[3, 6, 12], [1, 3, 6], [6, 12], [2, 4, 8, 12]].forEach(p =>
      WF_KANDIDATEN_MONAT.push({ topN: n, perioden: p })));

  // Tages-Pendant der Monatskandidaten, grob im selben Verhaeltnis
  // (~20 Handelstage je Monat).
  const WF_KANDIDATEN_TAG = [];
  [2, 3, 4, 5, 6].forEach(n =>
    [[5, 10, 20], [3, 5, 10], [10, 20], [5, 10, 20, 60]].forEach(p =>
      WF_KANDIDATEN_TAG.push({ topN: n, perioden: p })));

  function walkForward(reihe, opt) {
    const einheit = (opt && opt.einheit) || 'monat';
    const istTag = einheit === 'tag';
    const o = Object.assign({
      sicher: 'SHY', einheit,
      // In Jahren (monat) bzw. Kalendertagen (tag).
      trainingsfenster: istTag ? 365 : 8,
      handelsfenster: istTag ? 90 : 1,
      // Vorlauf vor dem Handelsfenster fuer die Momentum-Berechnung -
      // liegt vollstaendig in der Vergangenheit, ist also kein
      // Zukunftswissen.
      vorlauf: istTag ? 120 : 2,
      kosten: 0.002,
      kandidaten: istTag ? WF_KANDIDATEN_TAG : WF_KANDIDATEN_MONAT
    }, opt || {});

    const schritt = (d, n) => istTag ? tagePlus(d, n) : jahrePlus(d, n);
    const ppj = periodenProJahr(einheit);
    const minTraining = istTag ? 120 : 500;
    const minHandel = istTag ? 40 : 300;
    const minSchritteBacktest = istTag ? 15 : 6;

    const start = reihe.daten[0].datum;
    const ende = reihe.daten[reihe.daten.length - 1].datum;
    const abschnitte = [];
    const protokoll = [];

    let fenster = new Date(start);
    let notbremse = 0;

    while (notbremse++ < 60) {
      const trainEnde = schritt(fenster, o.trainingsfenster);
      if (trainEnde >= ende) break;

      const handelEnde = schritt(trainEnde, o.handelsfenster);
      const training = ausschnitt(reihe, fenster, trainEnde);
      const handel = ausschnitt(reihe, schritt(trainEnde, -o.vorlauf),
        handelEnde < ende ? handelEnde : new Date(ende.getTime() + 864e5));

      if (training.daten.length < minTraining || handel.daten.length < minHandel) break;

      let bester = null, besterWert = -Infinity;
      for (const k of o.kandidaten) {
        try {
          const v = backtest(training, Object.assign({ sicher: o.sicher, kosten: o.kosten, einheit }, k));
          if (v.length < minSchritteBacktest) continue;
          const s = kennzahlen(v, ppj, false).sharpe;
          if (isFinite(s) && s > besterWert) { besterWert = s; bester = k; }
        } catch (e) { /* Kandidat unbrauchbar */ }
      }

      if (!bester) { fenster = schritt(fenster, o.handelsfenster); continue; }

      try {
        const v = backtest(handel, Object.assign({ sicher: o.sicher, kosten: o.kosten, einheit }, bester));
        const echt = v.filter(p => p.datum >= trainEnde);
        if (echt.length) {
          abschnitte.push(...echt);
          protokoll.push({
            trainingBis: trainEnde,
            topN: bester.topN,
            perioden: bester.perioden.join('/'),
            sharpeTraining: besterWert,
            n: echt.length,
            rendite: echt.reduce((a, p) => a * (1 + p.rendite), 1) - 1
          });
        }
      } catch (e) { /* Abschnitt unbrauchbar */ }

      fenster = schritt(fenster, o.handelsfenster);
    }

    if (!abschnitte.length) throw new Error('Zu wenige Daten fuer Walk-Forward');

    abschnitte.sort((a, b) => a.datum - b.datum);
    const gesehen = new Set();
    const verlauf = [];
    let kapital = 1;
    for (const p of abschnitte) {
      const s = p.datum.toISOString().slice(0, 10);
      if (gesehen.has(s)) continue;
      gesehen.add(s);
      kapital *= (1 + p.rendite);
      verlauf.push(Object.assign({}, p, { equity: kapital }));
    }

    const k = kennzahlen(verlauf, ppj);
    const trainingMittel = protokoll.reduce((a, p) => a + p.sharpeTraining, 0) / protokoll.length;
    const kombis = protokoll.map(p => p.topN + '/' + p.perioden);
    const zaehler = {};
    kombis.forEach(x => zaehler[x] = (zaehler[x] || 0) + 1);
    const haeufigste = Object.entries(zaehler).sort((a, b) => b[1] - a[1])[0];

    return {
      verlauf, protokoll, kennzahlen: k,
      sharpeTraining: trainingMittel,
      // Die Luecke ist das Mass fuer Overfitting
      luecke: trainingMittel - k.sharpe,
      stabilitaet: {
        durchlaeufe: protokoll.length,
        verschiedene: Object.keys(zaehler).length,
        haeufigste: haeufigste[0],
        anteilHaeufigste: haeufigste[1] / protokoll.length,
        wechsel: kombis.filter((x, i) => i > 0 && x !== kombis[i - 1]).length
      }
    };
  }

  // ---------- Regime ----------
  /* Eine Gesamtrendite verdeckt, dass eine Strategie in
     verschiedenen Marktphasen voellig unterschiedlich funktioniert.

     Vorbehalt: Regime werden aus den Daten selbst bestimmt, also im
     Nachhinein. Diese Analyse dient dem Verstaendnis, nicht der
     Steuerung. Wer daraus eine Handelsregel ableitet, baut
     Zukunftswissen ein. */
  function regime(reihe, verlauf, referenz, anleihe, opt) {
    referenz = referenz || 'SPY';
    anleihe = anleihe || 'IEF';
    const o = Object.assign({ einheit: 'monat' }, opt || {});
    if (!reihe.ticker.includes(referenz)) return null;
    const hatAnleihe = reihe.ticker.includes(anleihe);

    const ppj = periodenProJahr(o.einheit);
    // Trendfenster in Punkten: 6 Monate, oder bei Tagesdaten das
    // Aequivalent von rund einem halben Jahr Handelstagen.
    const trendFenster = o.trendFenster || (o.einheit === 'tag' ? 126 : 6);
    // Bei Tagesdaten gibt es ein Vielfaches mehr Punkte je Regime -
    // eine Mindestgroesse von 3 waere fast immer erfuellt und
    // bedeutungslos.
    const minGroesse = o.minGroesse || (o.einheit === 'tag' ? 20 : 3);

    const punkte = handelspunkte(reihe, o.einheit);
    const index = {};
    punkte.forEach((m, i) => index[m.datum.toISOString().slice(0, 10)] = i);

    let hoch = -Infinity;
    const zuordnung = {};
    for (let i = trendFenster; i < punkte.length; i++) {
      const kurs = punkte[i].werte[referenz];
      hoch = Math.max(hoch, kurs);
      const trend = kurs / punkte[i - trendFenster].werte[referenz] - 1;
      const anlTrend = hatAnleihe
        ? punkte[i].werte[anleihe] / punkte[i - trendFenster].werte[anleihe] - 1 : 1;

      let r = 'Bulle';
      if (trend < 0) r = (anlTrend < 0) ? 'Zinsschock' : 'Baer';
      else if (kurs < hoch * 0.95) r = 'Erholung';
      zuordnung[punkte[i].datum.toISOString().slice(0, 10)] = r;
    }

    const gruppen = {};
    for (const p of verlauf) {
      const s = p.datum.toISOString().slice(0, 10);
      const r = zuordnung[s];
      if (!r) continue;
      const i = index[s];
      if (i === undefined || i < 1) continue;
      const refRendite = punkte[i].werte[referenz] / punkte[i - 1].werte[referenz] - 1;
      (gruppen[r] = gruppen[r] || []).push({ rendite: p.rendite, referenz: refRendite, cash: p.cash });
    }

    const gesamt = Object.values(gruppen).reduce((a, g) => a + g.length, 0);
    return Object.entries(gruppen)
      .filter(([, g]) => g.length >= minGroesse)
      .map(([name, g]) => {
        const stratPa = Math.pow(g.reduce((a, x) => a * (1 + x.rendite), 1), ppj / g.length) - 1;
        const refPa = Math.pow(g.reduce((a, x) => a * (1 + x.referenz), 1), ppj / g.length) - 1;
        return {
          regime: name, n: g.length, anteil: g.length / gesamt,
          strategiePa: stratPa, referenzPa: refPa, vorsprung: stratPa - refPa,
          positive: g.filter(x => x.rendite > 0).length / g.length,
          cashMittel: g.reduce((a, x) => a + (x.cash || 0), 0) / g.length
        };
      })
      .sort((a, b) => b.n - a.n);
  }

  // ---------- Durststrecken ----------
  /* Ein Drawdown von 16 Prozent klingt ertraeglich. Drei Jahre
     unter dem alten Hoechststand zu sitzen ist etwas anderes - und
     der Grund, warum die meisten eine Strategie im ungeeignetsten
     Moment aufgeben. */
  function durststrecken(verlauf, anzahl) {
    anzahl = anzahl || 5;
    let hoch = -Infinity;
    const phasen = [];
    let start = null, tiefster = 0;

    verlauf.forEach((p, i) => {
      hoch = Math.max(hoch, p.equity);
      const dd = p.equity / hoch - 1;
      if (dd < -0.001) {
        if (start === null) { start = p.datum; tiefster = dd; }
        tiefster = Math.min(tiefster, dd);
      } else if (start !== null) {
        phasen.push({ von: start, bis: p.datum, tiefster, n: 0 });
        phasen[phasen.length - 1].n =
          verlauf.filter(x => x.datum >= start && x.datum <= p.datum).length;
        start = null;
      }
    });
    if (start !== null) {
      const letzte = verlauf[verlauf.length - 1].datum;
      phasen.push({
        von: start, bis: letzte, tiefster, laufend: true,
        n: verlauf.filter(x => x.datum >= start).length
      });
    }
    return phasen.sort((a, b) => b.n - a.n).slice(0, anzahl);
  }

  // ---------- Zufallsvergleich ----------
  /* Nullhypothese: zufaellig gewaehlte Anlagen bei gleicher
     Periodenzahl. Schlaegt eine Strategie den Zufall nicht, traegt
     ihr Signal nichts bei. */
  function zufallsvergleich(reihe, verlauf, opt) {
    const o = Object.assign({ sicher: 'SHY', laeufe: 500, seed: 42, einheit: 'monat' }, opt || {});
    const punkte = handelspunkte(reihe, o.einheit);
    const anlagen = reihe.ticker.filter(t => t !== o.sicher);
    if (punkte.length < 3) return null;

    const renditen = [];
    for (let i = 1; i < punkte.length; i++) {
      for (const t of anlagen) {
        renditen.push(punkte[i].werte[t] / punkte[i - 1].werte[t] - 1);
      }
    }

    let s = o.seed;
    const zufall = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };

    const n = verlauf.length;
    const mittelwerte = [];
    for (let l = 0; l < o.laeufe; l++) {
      let summe = 0;
      for (let i = 0; i < n; i++) {
        summe += renditen[Math.floor(zufall() * renditen.length)];
      }
      mittelwerte.push(summe / n);
    }
    mittelwerte.sort((a, b) => a - b);

    const eigen = verlauf.reduce((a, p) => a + p.rendite, 0) / n;
    return {
      zufallMittel: mittelwerte.reduce((a, b) => a + b, 0) / o.laeufe,
      p05: mittelwerte[Math.floor(o.laeufe * 0.05)],
      p95: mittelwerte[Math.floor(o.laeufe * 0.95)],
      strategie: eigen,
      anteilSchlechter: mittelwerte.filter(x => x < eigen).length / o.laeufe
    };
  }

  const api = {
    parseCsv, pruefeQualitaet, monatsenden, periodenProJahr, backtest,
    kennzahlen, hebel, kelly, aktuellesSignal,
    walkForward, regime, durststrecken, zufallsvergleich
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.Bot = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
