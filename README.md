# momentum-bot
Multi-Asset Momentum: Backtest, Walk-Forward und Paper-Trading

Laeuft komplett im Browser (`start.html`), keine Abhaengigkeiten, kein
Build-Schritt. Zwei Handelsmodi: monatliche Positionshaltung oder
taegliches Rebalancing (Day-Trading) - siehe `ANLEITUNG.md`.

Optional: [`research-bot/`](research-bot/README.md) ist ein separater,
selbst gehosteter Dienst, der live Kurse, Nachrichten-Sentiment,
Makro-Termine und technische Indikatoren liefert - fuer `bot.html` als
Ersatz fuer den manuellen CSV-Upload und als zusaetzlichen
Kontext-Block. Rein additiv: die Momentum-Rechnung in `bot-core.js`
bleibt unveraendert.

## Tests

Die Kernlogik in `bot-core.js` hat eine Testsuite unter `tests/`, die
nur den in Node eingebauten Testrunner nutzt (keine Abhaengigkeiten):

```
npm test
```

Dieser Befehl findet rekursiv auch die Tests unter `research-bot/tests/`
mit; fuer nur den Recherche-Bot: `cd research-bot && npm test`.
