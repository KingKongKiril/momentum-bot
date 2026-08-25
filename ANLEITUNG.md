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
