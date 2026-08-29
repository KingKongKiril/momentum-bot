# Spielmechaniken

Sammelstelle fuer die Systeme hinter den Helden. Alles hier ist aus den
bisherigen Helden-Steckbriefen abgeleitet – noch ohne Zahlenwerte. Was noch
offen ist, steht unten unter [Offene Punkte](#offene-punkte).

## Seltenheitsstufen

| Kuerzel | Stufe | Bisher |
| --- | --- | --- |
| GWN | Gewöhnlich | Igne – Der Ruß-Pyroman |
| SLT | Selten | Glut-Ritter |

Weitere Stufen sind noch nicht festgelegt.

## Rollen

| Rolle | Aufgabe | Bisher |
| --- | --- | --- |
| Bereichsschaden (AoE) | Schaden auf Gruppen, Debuffs streuen | Igne |
| Nahkampf-Tank | Schaden aufnehmen, Front halten, kontern | Glut-Ritter |

## Skill-Baum

Alle Helden nutzen bisher denselben Aufbau:

- **Drei Zweige** nebeneinander – links, mitte, rechts. Jeder Zweig hat ein
  eigenes Thema (z. B. Ruestung, Konter, Waffen-Meisterschaft).
- **Drei Ebenen** pro Zweig, von oben nach unten freigeschaltet:

  | Ebene | Bedeutung |
  | --- | --- |
  | Lv 2 | Einstiegsfaehigkeit des Zweigs |
  | Lv 3 | Ausbau, deutlich staerkere Wirkung |
  | Lv 4 | Ultimative Faehigkeit bzw. Ultimative Meisterschaft |

- **Zweige haengen zusammen.** Die Pfeile in den Skill-Baeumen laufen nicht nur
  senkrecht: eine Lv-3-Faehigkeit kann auf eine Ultimative im Nachbarzweig
  fuehren. Der Baum ist also ein Netz, kein reiner Strang.
- **Waffen-Meisterschaft** ist bisher immer der rechte Zweig und endet in einer
  passiven Ultimativen, die den gesamten Kampfstil des Helden verstaerkt.

## Faehigkeitstypen

| Typ | Wirkung |
| --- | --- |
| Aktive Faehigkeit | Wird gezielt gezuendet, hat Wirkdauer bzw. Zielzone |
| Passiv | Dauerhaft aktiv, kein Einsatz noetig (auch: „Passive Fähigkeit") |
| Aura | Wirkt im Umkreis auf Verbuendete und/oder Gegner |
| Flaechenschaden | Verwandelt eine Zone in eine anhaltende Schadensflaeche |
| AoE-Schwaechung | Schwaecht mehrere Gegner im Umkreis gleichzeitig |
| Debuff | Schwaecht Gegner, ohne primaer Schaden zu machen |
| Defensiv | Schuetzt den Helden selbst |
| Verstaerkung | Laedt den naechsten Angriff auf |
| Nahkampf | Direkter Waffenangriff |
| Ultimative Faehigkeit | Staerkster aktiver Effekt, Ebene Lv 4 |
| Ultimative Meisterschaft | Passive Lv-4-Faehigkeit, veraendert den Kampfstil |

## Schadensarten

- **Feuer- / Hitzeschaden** – die tragende Schadensart beider bisheriger Helden.
- **Physischer Schaden** – Waffentreffer, z. B. Verbrennender Hieb.

## Statuseffekte

| Effekt | Wirkung | Quelle (Beispiel) |
| --- | --- | --- |
| Brand | Schaden ueber Zeit, stapelbar bzw. verlaengerbar | Brennende Gasse, Hitzewelle |
| Ruestung schmelzen | Senkt gegnerische Ruestung | Glut-Aura, Hitzewelle |
| Blenden | Senkt gegnerische Trefferchance | Ruß-Wolke |
| Verlangsamen | Senkt Bewegungs- oder Angriffstempo | Ruß-Wolke, Schmelztiegel-Schild |
| Betaeubung | Ziel ist kurz handlungsunfaehig | Verbrennender Hieb |
| Betaeubungs-Immunitaet | Held ignoriert Betaeubungen zeitweise | Unerschütterlicher Vulkan |

## Kernmechaniken

Diese Muster tauchen bei mehreren Helden auf und sind die eigentlichen
Stellschrauben des Spiels:

- **Schaden ueber Zeit (DoT).** Brand ist die Basis. Flaechen wie der
  Feuer-Teppich ticken pro Sekunde weiter.
- **Debuff-Verlaengerung.** Meister des Rußes verdoppelt die Dauer aller
  aktiven Brand-Debuffs auf dem Schlachtfeld – wirkt also global, nicht nur auf
  Ignes eigene Effekte.
- **Kettenreaktion.** Inferno-Explosion laesst brennende Gegner beim Tod
  detonieren und uebertraegt die Debuffs auf Umstehende. Aus einem Brand
  koennen so Wellen werden.
- **Schadensreflexion.** Gluehende Vergeltung wirft einen Teil des erhaltenen
  Nahkampfschadens zurueck; Meister der Magma-Schneide verstaerkt genau das.
- **Skalierung mit erlittenem Schaden.** Haertung erhoeht die Ruestung anhand
  des bereits kassierten Schadens – der Tank wird im Verlauf des Kampfes
  haerter, nicht schwaecher.
- **Schaden speichern und entladen.** Lava-Eruption sammelt den Schaden der
  letzten 4 Sekunden und zuendet ihn als Explosion. Erstes Beispiel fuer ein
  Zeitfenster als Ressource.
- **Schadensabsorption.** Schmelztiegel-Schild und Asche-Mantel fangen
  eingehenden Schaden ab, Asche-Mantel kontert zusaetzlich im Nahkampf.
- **Schildbruch.** Glut-Aufladung laesst den naechsten Angriff gegnerische
  Schilde durchschlagen.
- **Verbuendeten-Verstaerkung.** Glut-Aura erhoeht den Feuerschaden aller
  Verbuendeten im Umkreis – erster Hinweis auf Team-Synergien zwischen Helden.

## Synergien zwischen den Helden

Beide bisherigen Helden arbeiten mit derselben Waehrung: **Brand-Debuffs und
Hitze.** Das traegt schon jetzt eine Kombination:

- Der Glut-Ritter steht in der Ansammlung und haelt die Gegner mit
  Schmelztiegel-Schild auf einem Fleck.
- Hitzewelle und Glut-Aura schmelzen die Ruestung, Ignes Feuer-Teppich setzt
  die Gruppe in Brand.
- Meister des Rußes verlaengert alle Brand-Effekte, Inferno-Explosion macht aus
  jedem Tod eine Kettenreaktion.

## Offene Punkte

Noch nicht festgelegt und vor dem ersten Prototyp zu klaeren:

- **Zahlenwerte**: Schaden, Ruestung, Trefferpunkte, Prozentsaetze der Passiven
- **Cooldowns und Kosten**: Gibt es Mana, Hitze oder eine andere Ressource?
- **Level-Kurve**: Wie kommt ein Held von Lv 1 auf Lv 4? Skillpunkte oder fest?
- **Lv 1**: Der Baum beginnt bei Lv 2 – was hat ein Held davor?
- **Stapeln**: Wie oft stapelt Brand, wie addieren sich zwei Ruestungs-Debuffs?
- **Weitere Seltenheitsstufen** ueber GWN und SLT hinaus
- **Weitere Elemente** neben Feuer – oder bleibt das Spiel bei Hitze?
- **Teamgroesse**: Wie viele Helden stehen gleichzeitig im Kampf?
