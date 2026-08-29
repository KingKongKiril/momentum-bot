# Spiel

Arbeitsstand fuer das Helden-Spiel: Charaktere, ihre Skill-Baeume und die
Mechaniken dahinter. Reine Design-Dokumente, noch kein Code.

| Datei | Inhalt |
| --- | --- |
| [`mechaniken.md`](mechaniken.md) | Die Systeme in Prosa: Seltenheiten, Rollen, Skill-Baum-Aufbau, Statuseffekte, Kernmechaniken, offene Punkte |
| [`mechaniken.json`](mechaniken.json) | Dasselbe strukturiert – das gemeinsame Vokabular, gegen das die Helden geprueft werden |
| [`helden/`](helden/) | Ein Steckbrief plus JSON-Eintrag pro Held, dazu die Artworks |

## Helden

| Held | Rolle | Seltenheit |
| --- | --- | --- |
| [Igne – Der Ruß-Pyroman](helden/igne-russ-pyroman.md) | Bereichsschaden (AoE) | Gewöhnlich (GWN) |
| [Glut-Ritter](helden/glut-ritter.md) | Nahkampf-Tank | Selten (SLT) |

## Konsistenz

`mechaniken.json` ist die Referenzliste. Die Tests unter
`tests/spiel-daten.test.js` pruefen bei jedem `npm test`, dass jeder Held nur
Rollen, Seltenheiten und Faehigkeitstypen benutzt, die dort definiert sind,
dass der Skill-Baum die vorgegebene Form hat (3 Zweige, Stufen 2/3/4) und dass
Bild und Steckbrief zu jedem JSON-Eintrag existieren.

Neues Vokabular gehoert also erst nach `mechaniken.json`, dann in den Helden.
