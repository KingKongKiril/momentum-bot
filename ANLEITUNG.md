# Bot aufs Handy bringen

Es braucht keine APK. Der Bot rechnet ohnehin komplett lokal - eine
installierte Web-App verhaelt sich identisch, nur ohne Umweg ueber
einen Play-Store.

## 1. Dateien hochladen

Auf github.com ein neues Repository anlegen (oeffentlich).
Ueber die GitHub-App oder die Weboberflaeche diese Dateien hochladen:

    docs/start.html
    docs/bot.html
    docs/bot-core.js
    docs/journal.html
    docs/index.html
    docs/manifest.json
    docs/sw.js
    docs/icon.svg

Wichtig: alle in denselben Ordner `docs`. Ohne `bot-core.js` rechnet
der Bot nicht.

## 2. Seite freischalten

Im Repository: Settings -> Pages -> Source auf `main` und Ordner
auf `/docs` stellen. Nach ein bis zwei Minuten ist die Seite
erreichbar unter:

    https://DEINNAME.github.io/REPOSITORY/start.html

## 3. Als App installieren

Diese Adresse am Handy oeffnen. Dann:

- **Android/Chrome:** Menue (drei Punkte) -> "Zum Startbildschirm
  hinzufuegen" oder "App installieren"
- **iPhone/Safari:** Teilen-Symbol -> "Zum Home-Bildschirm"

Danach startet der Bot mit eigenem Icon im Vollbild und
funktioniert auch ohne Internet.

## 4. Daten laden

Der Bot kann Kursdaten nicht selbst holen - Yahoo blockiert direkte
Browser-Anfragen. Einmal im Monat in Colab:

    python src/data.py

Das erzeugt `universum_daily.csv`. Diese Datei im Bereich **Bot**
laden. Sie bleibt im Browser gespeichert, bis du sie ersetzt.

## Monatsablauf

1. Neue CSV in Colab erzeugen und in den Bot laden
2. Vormonat im **Paper-Trading** bewerten
3. Neues Signal ansehen und eintragen
4. Fertig - naechster Monat

Dauert etwa fuenf Minuten. Mehr ist nicht zu tun, und mehr waere
auch nicht besser.

## Handelsmodus

Im Bereich **Bot** unter Einstellungen laesst sich der Handelsmodus
umstellen:

- **Monatlich (Positionen halten)** - der urspruengliche Modus. Signal
  und Backtest laufen auf Monatsenden, Umschichtung einmal im Monat.
- **Taeglich (Day-Trading)** - Signal und Backtest laufen auf jedem
  einzelnen Handelstag der geladenen CSV. Das bedeutet deutlich mehr
  Umschichtung und damit deutlich mehr Kosten je Zeiteinheit - der Bot
  zeigt das in den Kennzahlen.

Wichtig: der Datenweg aus Schritt 4 (einmal im Monat eine CSV aus
Colab) bleibt bei Day-Trading derselbe. Ein Signal ist nur so aktuell
wie die zuletzt geladene Zeile der CSV - fuer ein tagesaktuelles
Signal muss die CSV an jedem Handelstag neu erzeugt und geladen
werden, sonst ist das Signal tage- bis wochenalt. Der Bot weist im
Day-Trading-Modus darauf hin, wie alt der letzte Datenpunkt ist.

## Live-Daten statt monatlichem Colab-Upload (optional)

Wer den manuellen Colab-Schritt (oder das taegliche Neuladen im
Day-Trading-Modus) nicht von Hand machen will, kann stattdessen den
[`research-bot/`](research-bot/README.md) selbst hosten - ein
eigenstaendiger, dauerhaft laufender Dienst, der Kursdaten automatisch
holt und dazu Nachrichten-Sentiment, Makro-Termine und technische
Indikatoren liefert.

Im Bereich **Bot** gibt es dafuer den Abschnitt "Live-Recherche": dort
die Server-Adresse eintragen, dann **Live-Kurse laden** (ersetzt den
CSV-Upload) und optional **Kontext anzeigen** (zeigt Sentiment/Makro/
Indikatoren in einer eigenen Box). Das ist rein additiv - die
Momentum-Rechnung selbst bleibt exakt dieselbe wie beim manuellen
CSV-Upload, nur die Datenquelle ist eine andere.

Das braucht einen eigenen, dauerhaft laufenden Server (Details und
Hosting-Optionen in `research-bot/README.md`) - ohne das laeuft der
Bot weiterhin genauso wie zuvor mit dem manuellen Colab-Upload.
