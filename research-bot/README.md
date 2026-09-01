# Recherche-Bot

Ein eigenstaendiger, dauerhaft laufender Dienst - getrennt vom
Momentum-Bot in `bot.html`. Er holt, was ein Browser aus
CORS-Gruenden nicht selbst holen darf, plus reine Rechenarbeit:

- **Live-Kurse** von [Stooq](https://stooq.com) (kein API-Key noetig),
  als CSV im selben Format, das `bot-core.js` ohnehin erwartet.
- **Nachrichten-Sentiment**: Schlagzeilen aus konfigurierbaren
  RSS-Feeds, grob per Woerterzaehlung bewertet.
- **Makro-Kalender**: naechste FOMC-Termine und
  Non-Farm-Payrolls-Termine.
- **Technische Indikatoren**: SMA20/50/200, RSI(14), MACD - pro
  Ticker, aus den geladenen Kursen berechnet.

Alles wird per HTTP mit offenen CORS-Headern bereitgestellt, damit
`bot.html` es direkt per `fetch()` abholen kann, egal wo die Seite
gehostet ist.

## Warum ein eigener Dienst?

`bot.html` laeuft komplett im Browser - das ist Absicht, siehe die
Haupt-`ANLEITUNG.md`. Aber ein Browser darf aus CORS-Gruenden weder
Stooq/Yahoo noch die meisten RSS-Feeds direkt anfragen. Ein
Server-Prozess unterliegt dieser Einschraenkung nicht: er holt die
Daten serverseitig und reicht sie mit eigenen (offenen) CORS-Headern
weiter durch.

## Wichtig: was das NICHT ist

- **Keine Anlageberatung, keine Order-Ausfuehrung.** Der Dienst holt
  und rechnet, er handelt nichts.
- **Sentiment ist keine Sprachanalyse.** `lib/sentiment.js` zaehlt
  Schlagwoerter aus einer festen Liste (`lib/lexikon.js`). Es versteht
  keine Verneinung ("nicht so schlecht wie befuerchtet"), keine Ironie,
  keinen Kontext. Als grober Tagesindikator brauchbar, mehr nicht.
- **Der FOMC-Kalender ist eine Tabelle, keine Regel.** Sie veraltet.
  `lib/makro.js` meldet das (`fomcVeraltet`), wenn der letzte
  eingetragene Termin in der Vergangenheit liegt - dann in der Datei
  gegen die [offizielle Fed-Quelle](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm)
  aktualisieren. Non-Farm-Payrolls dagegen ist eine feste Regel
  (erster Freitag im Monat) und veraltet nie.
- **Sentiment und Makro fliessen nicht in die Momentum-Rechnung ein.**
  `bot-core.js` bleibt unveraendert: dieselbe, auditierbare
  Momentum-Strategie wie zuvor. Die zusaetzlichen Signale erscheinen in
  `bot.html` als separater "Kontext"-Block fuer den menschlichen Blick.
  Wer sie ungetestet in eine Handelsregel einbaut, baut sich genau die
  Art Data-Snooping, vor der der Bot an anderer Stelle ausdruecklich
  warnt (siehe Walk-Forward- und Regime-Abschnitte).

## Starten

```
cd research-bot
npm start
```

Standardmaessig auf Port 8787, mit dem Beispieluniversum
`SPY,TLT,GLD,DBC,SHY`. Keine Abhaengigkeiten (nur Node-Bordmittel -
`http`, globales `fetch`), kein `npm install` noetig.

Testen: `npm test` (Node-eigener Testrunner, keine Abhaengigkeiten).

## Einbinden in bot.html

`bot.html` hat einen Abschnitt "Live-Recherche" direkt unter dem
CSV-Upload:

1. Server-Adresse eintragen (z. B. `http://localhost:8787`, wird im
   Browser gemerkt).
2. **Live-Kurse laden** ersetzt den manuellen CSV-Upload durch
   `GET /kurse.csv` - direkt kompatibel mit `Bot.parseCsv`.
3. **Kontext anzeigen** holt `GET /signal.json` und zeigt Sentiment,
   Makro-Termine und technische Indikatoren in einer eigenen Box - rein
   informativ, unabhaengig von der Momentum-Rechnung darunter.

## Konfiguration (Umgebungsvariablen)

| Variable | Standard | Bedeutung |
|---|---|---|
| `PORT` | `8787` | HTTP-Port |
| `CORS_ORIGIN` | `*` | `Access-Control-Allow-Origin` |
| `TICKER` | `SPY,TLT,GLD,DBC,SHY` | Kursuniversum, Komma-getrennt |
| `RSS_FEEDS` | zwei Finanz-RSS-Feeds | Komma-getrennte Feed-URLs |
| `INTERVALL_KURSE_MIN` | `15` | Kurs-Refresh in Minuten |
| `INTERVALL_SENTIMENT_MIN` | `60` | Sentiment-Refresh in Minuten |
| `INTERVALL_MAKRO_MIN` | `1440` | Makro-Refresh in Minuten |

RSS-Feed-URLs sind erfahrungsgemaess nicht ewig stabil - bricht ein
Feed weg, ueber `RSS_FEEDS` durch einen aktuellen ersetzen.

## Hosting

Ein `node server.js`, das dauerhaft laeuft - z. B.:

- Auf einem eigenen Rechner/Raspberry Pi, der ohnehin an ist.
- Ein kostenloses Tier bei Render, Fly.io o.ae. (Node-Buildpack,
  Startbefehl `npm start`, Port aus `PORT`).
- `pm2` oder ein systemd-Service auf einem VPS, damit er einen
  Absturz/Neustart uebersteht.

Der Dienst haelt bei einem fehlgeschlagenen Refresh (Netzwerkfehler,
Feed nicht erreichbar) immer die letzten guten Daten - er liefert
nie eine leere Antwort nur weil ein einzelner Abruf misslang, siehe
`GET /health` fuer den Status des letzten Versuchs. Jeder Netzwerk-Abruf
hat ein 10-Sekunden-Timeout und ueberlappende Refreshs werden
uebersprungen statt parallel zu laufen - ein einzelner haengender
Server (Stooq, ein RSS-Feed) kann den Dienst also nicht dauerhaft
blockieren.

## Endpunkte

- `GET /health` - Status, letzte Aktualisierung je Datenart, letzter
  Fehler (falls einer aufgetreten ist).
- `GET /kurse.csv` - zusammengefuehrte Kurse aller konfigurierten
  Ticker, `Bot.parseCsv`-kompatibel.
- `GET /signal.json` - Kurse-Metadaten, Indikatoren pro Ticker,
  Sentiment, Makro-Termine.
