# Helden

Sammlung der Helden-Steckbriefe. Jeder Held hat zwei Dateien:

- `<held-id>.md` – lesbarer Steckbrief inkl. Sprecher-Skript und Bild
- ein Eintrag in `helden.json` – dieselben Daten strukturiert, damit sie
  weiterverarbeitet werden koennen (Skill-Baum, Tooltips, Export)

Bilder liegen unter `bilder/<held-id>.png`.

## Bestand

| Held | Rolle | Seltenheit | Steckbrief |
| --- | --- | --- | --- |
| Igne – Der Ruß-Pyroman | Bereichsschaden (AoE) | Gewöhnlich (GWN) | [igne-russ-pyroman.md](igne-russ-pyroman.md) |

## Aufbau von `helden.json`

```
version            Schema-Version der Datei
helden[]           Liste aller Helden
  id               ASCII-Kennung, identisch mit dem Dateinamen
  name, titel      Anzeigename und Beiname
  seltenheit       Klartext, plus seltenheitKuerzel (z. B. "GWN")
  rolle, waffe     Kampfrolle und Ausruestung
  fokus            Ein-Satz-Zusammenfassung der Spielweise
  bild             Pfad relativ zu diesem Ordner
  intro            Sprecher-Text fuer das Spotlight
  zweige[]         Die drei Skill-Zweige
    id, name       Kennung und Anzeigename
    position       "links" | "mitte" | "rechts" (Lage im Skill-Baum)
    untertitel     Kurzbeschreibung des Zweigs
    faehigkeiten[] Faehigkeiten von oben nach unten
      id, name     Kennung und Anzeigename
      typ          z. B. "Aktive Fähigkeit", "Passive Fähigkeit", "Aura"
      stufe        Ebene im Skill-Baum (2 = oberste Reihe, 4 = unterste)
      beschreibung Wirkung im Klartext
  gameplayTipp     Empfohlene Kombination
```

## Neuen Helden aufnehmen

1. Bild als `bilder/<held-id>.png` ablegen.
2. Steckbrief `<held-id>.md` nach dem Muster von `igne-russ-pyroman.md`
   schreiben.
3. Eintrag in `helden.json` ergaenzen und die Tabelle oben erweitern.
