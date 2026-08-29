# Spiel

Arbeitsstand fuer das Helden-Spiel: Charaktere, ihre Skill-Baeume und die
Mechaniken dahinter. Reine Design-Dokumente, noch kein Code.

| Datei | Inhalt |
| --- | --- |
| [`mechaniken.md`](mechaniken.md) | Die Systeme in Prosa: Seltenheiten, Rollen, Skill-Baum-Aufbau, Statuseffekte, Kernmechaniken, offene Punkte |
| [`mechaniken.json`](mechaniken.json) | Dasselbe strukturiert – das gemeinsame Vokabular, gegen das die Helden geprueft werden |
| [`helden/`](helden/) | Ein Steckbrief plus JSON-Eintrag pro Held, dazu die Artworks |

## Helden

| Held | Rolle | Seltenheit | Form |
| --- | --- | --- | --- |
| [Igne – Der Ruß-Pyroman](helden/igne-russ-pyroman.md) | Bereichsschaden (AoE) | Gewöhnlich (GWN) | Skill-Baum |
| [Glut-Ritter](helden/glut-ritter.md) | Nahkampf-Tank | Selten (SLT) | Skill-Baum |
| [Ignis, Der Aschenkaiser](helden/ignis-aschenkaiser.md) | Magischer Carry | Legendär (LGD) | Slots + Werte |

## Konsistenz

`mechaniken.json` ist die Referenzliste. Die Tests unter
`tests/spiel-daten.test.js` pruefen bei jedem `npm test`, dass jeder Held nur
Rollen, Seltenheiten und Faehigkeitstypen benutzt, die dort definiert sind,
dass die jeweilige Heldenform stimmt und dass Bild und Steckbrief zu jedem
JSON-Eintrag existieren.

Es gibt zwei Formen, beide sind zulaessig (siehe `mechaniken.md`):

- **Skill-Baum** – `zweige` mit 3 Zweigen à 3 Stufen (Igne, Glut-Ritter)
- **Slots** – `faehigkeiten` mit Passiv / Aktiv 1 / Aktiv 2 / Ultimativ, dazu
  `werte` und `ausruestung` (Ignis)

Geprueft wird ausserdem, dass Abklingzeiten positive Rundenzahlen sind, die
Ultimative am laengsten abklingt, Ausruestungs-Slots nicht doppelt belegt sind
und Fraktionen auf existierende Helden zeigen.

Neues Vokabular gehoert also erst nach `mechaniken.json`, dann in den Helden.
