# momentum-bot
Multi-Asset Momentum: Backtest, Walk-Forward und Paper-Trading

Laeuft komplett im Browser (`start.html`), keine Abhaengigkeiten, kein
Build-Schritt. Zwei Handelsmodi: monatliche Positionshaltung oder
taegliches Rebalancing (Day-Trading) - siehe `ANLEITUNG.md`.

## Tests

Die Kernlogik in `bot-core.js` hat eine Testsuite unter `tests/`, die
nur den in Node eingebauten Testrunner nutzt (keine Abhaengigkeiten):

```
npm test
```

## Spiel

Unter `spiel/` liegt ein davon unabhaengiges Projekt: Helden-Steckbriefe und
Spielmechaniken fuer ein Helden-Spiel. Siehe [`spiel/README.md`](spiel/README.md).
