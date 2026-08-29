# Helden

Sammlung der Helden-Steckbriefe. Jeder Held hat zwei Dateien:

- `<held-id>.md` – lesbarer Steckbrief inkl. Sprecher-Skript und Bild
- ein Eintrag in `helden.json` – dieselben Daten strukturiert, damit sie
  weiterverarbeitet werden koennen (Skill-Baum, Tooltips, Export)

Bilder liegen unter `bilder/<held-id>.png`.

Rollen, Seltenheiten und Faehigkeitstypen kommen aus
[`../mechaniken.json`](../mechaniken.json) – neue Begriffe dort zuerst
ergaenzen, sonst schlagen die Tests fehl.

## Bestand

| Held | Rolle | Seltenheit | Steckbrief |
| --- | --- | --- | --- |
| Igne – Der Ruß-Pyroman | Bereichsschaden (AoE) | Gewöhnlich (GWN) | [igne-russ-pyroman.md](igne-russ-pyroman.md) |
| Glut-Ritter | Nahkampf-Tank | Selten (SLT) | [glut-ritter.md](glut-ritter.md) |

## Aufbau von `helden.json`

```
version            Schema-Version der Datei
helden[]           Liste aller Helden
  id               ASCII-Kennung, identisch mit dem Dateinamen
  name, titel      Anzeigename und Beiname (titel = null, wenn keiner)
  seltenheit       Klartext, plus seltenheitKuerzel (z. B. "GWN")
  rolle, waffe     Kampfrolle und Ausruestung
  fokus            Ein-Satz-Zusammenfassung der Spielweise
  bild             Pfad relativ zu diesem Ordner
  intro            Sprecher-Text fuer das Spotlight
  gameplayTipp     Empfohlene Kombination (null, wenn noch keine)

Dazu genau EINE der beiden Formen:

Form A – Skill-Baum (Igne, Glut-Ritter)
  zweige[]         Die drei Skill-Zweige
    id, name       Kennung und Anzeigename
    position       "links" | "mitte" | "rechts" (Lage im Skill-Baum)
    untertitel     Kurzbeschreibung des Zweigs
    faehigkeiten[] Faehigkeiten von oben nach unten
      id, name     Kennung und Anzeigename
      typ          z. B. "Aktive Fähigkeit", "Passive Fähigkeit", "Aura"
      stufe        Ebene im Skill-Baum (2 = oberste Reihe, 4 = unterste)
      beschreibung Wirkung im Klartext

Form B – feste Slots mit Zahlen (Ignis)
  fraktion         Zugehoerigkeit, siehe mechaniken.json
  powerLevel       Gesamtstaerke des Helden
  optik            Pose, Ruestung, Fluegel, Waffe, Hintergrund
  werte            hp, angriff, verteidigung, tempo
  ausruestung[]    Vier Slots mit Wertboni
    id, name       Kennung und Anzeigename
    slot           "waffe" | "kopf" | "brust" | "haende"
    bonus          Wertname -> Zahl (Prozente als Anteil, 0.15 = 15 %)
  faehigkeiten[]   Genau vier, in dieser Reihenfolge
    slot           "passiv" | "aktiv1" | "aktiv2" | "ultimativ"
    id, name, typ  wie oben
    zielart        "einzelziel" | "flaeche" | "alle-gegner"
    abklingzeit    Runden (fehlt beim Passiv)
    werte          Schaden, Prozentsaetze, Dauern
    beschreibung   Wirkung im Klartext
```

## Neuen Helden aufnehmen

1. Bild als `bilder/<held-id>.png` ablegen.
2. Steckbrief `<held-id>.md` nach dem Muster von `igne-russ-pyroman.md`
   schreiben.
3. Eintrag in `helden.json` ergaenzen und die Tabellen in dieser Datei und
   in [`../README.md`](../README.md) erweitern.
4. `npm test` laufen lassen – die Tests pruefen Form und Vokabular.
