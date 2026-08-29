# Spielmechaniken

Sammelstelle fuer die Systeme hinter den Helden, abgeleitet aus den bisherigen
Steckbriefen. Was noch offen oder widerspruechlich ist, steht unten unter
[Offene Punkte](#offene-punkte).

## Kampfsystem

**Rundenbasiert.** Ignis nennt Abklingzeiten und Debuff-Dauern in Runden
(3, 4, 7 Runden), die Geschwindigkeit bestimmt die Zugreihenfolge. Die
aelteren Steckbriefe von Igne und Glut-Ritter rechnen dagegen in Sekunden
("Schaden pro Sekunde", "in den letzten 4 Sekunden") – das ist noch
aufzuloesen.

## Seltenheitsstufen

| Kuerzel | Stufe | Rang | Bisher |
| --- | --- | --- | --- |
| GWN | Gewöhnlich | 1 | Igne – Der Ruß-Pyroman |
| SLT | Selten | 2 | Glut-Ritter |
| LGD | Legendär | 3 | Ignis, Der Aschenkaiser |

## Rollen

| Rolle | Aufgabe | Bisher |
| --- | --- | --- |
| Bereichsschaden (AoE) | Schaden auf Gruppen, Debuffs streuen | Igne |
| Nahkampf-Tank | Schaden aufnehmen, Front halten, kontern | Glut-Ritter |
| Magischer Carry | Hoher Einzel- und Flaechenschaden aus der zweiten Reihe | Ignis |

## Fraktionen

| Fraktion | Helden |
| --- | --- |
| Die Aschenwächter | Ignis, Der Aschenkaiser |

Nur Ignis hat bisher eine Fraktion. Ob Igne und der Glut-Ritter ebenfalls
einer angehoeren und was Fraktionen im Kampf bewirken, ist offen.

## Werte

| Wert | Bedeutung |
| --- | --- |
| HP | Trefferpunkte |
| Angriff | Grundlage des ausgeteilten Schadens |
| Verteidigung | Mindert eingehenden Schaden |
| Geschwindigkeit | Bestimmt die Zugreihenfolge |
| Kritische Trefferchance | Anteil kritischer Treffer, bisher nur ueber Ausruestung |
| Power Level | Gesamtstaerke des Helden (Ignis: 9500) |

Bisher hat nur Ignis Zahlen: HP 2800, Angriff 1200, Verteidigung 950,
Geschwindigkeit 80.

## Ausruestung

Vier Slots, jeder gibt additive Wertboni:

| Slot | Beispiel bei Ignis | Bonus |
| --- | --- | --- |
| Waffe | Die Flamme der Urschöpfung | +450 Angriff, +15 % Krit-Chance |
| Helm | Krone des Vulkanfürsten | +600 HP, +100 Verteidigung |
| Brustplatte | Basalt-Aura-Harnisch | +350 Verteidigung, +400 HP |
| Handschuhe | Sonnen-Handschuhe | +20 Geschwindigkeit, +150 Angriff |

## Faehigkeiten: zwei Formen

Die Helden liegen bisher in **zwei unterschiedlichen Formen** vor. Beide sind
gespeichert, welche gilt, ist noch nicht entschieden.

### Form A – Skill-Baum (Igne, Glut-Ritter)

- **Drei Zweige** nebeneinander – links, mitte, rechts. Jeder Zweig hat ein
  eigenes Thema (Ruestung, Konter, Waffen-Meisterschaft).
- **Drei Ebenen** pro Zweig, von oben nach unten freigeschaltet:

  | Ebene | Bedeutung |
  | --- | --- |
  | Lv 2 | Einstiegsfaehigkeit des Zweigs |
  | Lv 3 | Ausbau, deutlich staerkere Wirkung |
  | Lv 4 | Ultimative Faehigkeit bzw. Ultimative Meisterschaft |

- **Zweige haengen zusammen.** Die Pfeile laufen nicht nur senkrecht: eine
  Lv-3-Faehigkeit kann auf eine Ultimative im Nachbarzweig fuehren. Der Baum
  ist ein Netz, kein reiner Strang.
- **Waffen-Meisterschaft** ist immer der rechte Zweig und endet in einer
  passiven Ultimativen, die den Kampfstil des Helden verstaerkt.

Macht neun Faehigkeiten pro Held.

### Form B – Feste Slots (Ignis)

Vier belegte Faehigkeiten mit konkreten Zahlen und Abklingzeiten:

| Slot | Abklingzeit bei Ignis |
| --- | --- |
| Passiv | keine |
| Aktiv 1 | 3 Runden |
| Aktiv 2 | 4 Runden |
| Ultimativ | 7 Runden |

Auf der Heldenkarte ist zusaetzlich ein Faehigkeitsbaum mit gesperrten Knoten
zu sehen – vermutlich das Bindeglied zu Form A, aber nicht belegt.

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
| Ultimative Faehigkeit | Staerkster aktiver Effekt |
| Ultimative Meisterschaft | Passive Lv-4-Faehigkeit, veraendert den Kampfstil |

## Zielarten

Einzelziel, Flaeche (AoE) und alle Gegner. Ignis deckt alle drei ab:
Magma-Kompression trifft einzeln, Vulkanausbruch eine Flaeche, Kataklysmus das
gesamte gegnerische Team.

## Schadensarten

- **Feuer- / Hitzeschaden** – die tragende Schadensart aller drei Helden.
- **Magieschaden** – Magma-Kompression; Verhaeltnis zu Feuerschaden offen.
- **Physischer Schaden** – Waffentreffer, z. B. Verbrennender Hieb.

## Statuseffekte

| Effekt | Wirkung | Quelle (Beispiel) |
| --- | --- | --- |
| Brand | Schaden ueber Zeit, stapelbar bzw. verlaengerbar | Brennende Gasse, Hitzewelle |
| Zonen-Brand | Brennender Boden schadet ueber mehrere Runden im Bereich | Kataklysmus (6 Runden) |
| Ruestung schmelzen | Senkt gegnerische Ruestung | Glut-Aura, Magma-Kompression (40 %) |
| Blenden | Senkt gegnerische Trefferchance | Ruß-Wolke |
| Verlangsamen | Senkt Bewegungs- oder Angriffstempo | Ruß-Wolke, Vulkanausbruch (50 %) |
| Betaeubung | Ziel ist kurz handlungsunfaehig | Verbrennender Hieb |
| Betaeubungs-Immunitaet | Held ignoriert Betaeubungen zeitweise | Unerschütterlicher Vulkan |
| Schutzschild | Absorbiert Schaden, gespeist aus erlittenem Schaden | Ur-Hitze (20 %) |

## Kernmechaniken

Die eigentlichen Stellschrauben des Spiels:

- **Schaden ueber Zeit (DoT).** Brand ist die Basis, Flaechen ticken weiter.
- **Zonen-Kontrolle.** Brennender Boden bleibt nach dem Einschlag liegen –
  Feuer-Teppich, Magmafeld, Kataklysmus.
- **Debuff-Verlaengerung.** Meister des Rußes verdoppelt die Dauer aller
  aktiven Brand-Debuffs auf dem Schlachtfeld, also global.
- **Kettenreaktion.** Brennende Gegner detonieren beim Tod und uebertragen ihre
  Debuffs auf Umstehende.
- **Schadensreflexion.** Ein Teil des erhaltenen Nahkampfschadens geht zurueck.
- **Skalierung mit erlittenem Schaden.** Haertung erhoeht die Ruestung anhand
  des kassierten Schadens – der Tank wird im Kampfverlauf haerter.
- **Schadensumwandlung in Schild.** Ur-Hitze macht aus 20 % des erlittenen
  Schadens einen Schutzschild. Verwandtes Muster, anderes Ergebnis.
- **Schaden speichern und entladen.** Lava-Eruption sammelt den Schaden eines
  Zeitfensters und zuendet ihn als Explosion.
- **Ruestungsbruch.** Prozentuale Ruestungssenkung fuer eine feste Dauer
  (Magma-Kompression: 40 % ueber 3 Runden).
- **Schadensabsorption.** Schilde und Maentel fangen Schaden ab, teils mit
  Konterschaden.
- **Schildbruch.** Der naechste Angriff durchschlaegt gegnerische Schilde.
- **Verbuendeten-Verstaerkung.** Auren erhoehen Werte aller Verbuendeten im
  Umkreis.
- **Abklingzeiten.** Aktive Faehigkeiten sind gestaffelt: je staerker, desto
  laenger die Pause. Ultimative liegen deutlich hoeher.
- **Ausruestung.** Vier Slots mit additiven Wertboni, die ins Power Level
  einfliessen.

## Synergien zwischen den Helden

Alle drei arbeiten mit derselben Waehrung: **Hitze und Brand-Debuffs.** Das
traegt schon jetzt eine Aufstellung:

- Der Glut-Ritter haelt die Gegner mit Schmelztiegel-Schild auf einem Fleck.
- Hitzewelle, Glut-Aura und Magma-Kompression schmelzen die Ruestung – die drei
  Ruestungssenkungen muessen noch gegeneinander abgestimmt werden.
- Igne setzt die Gruppe in Brand, Ignis raeumt mit Kataklysmus ab und laesst
  den Boden brennen.
- Meister des Rußes verlaengert alles, was brennt, Inferno-Explosion macht aus
  jedem Tod eine Kettenreaktion.

## Offene Punkte

Widersprueche zuerst:

- **Runden oder Sekunden?** Ignis rechnet in Runden, Igne und Glut-Ritter in
  Sekunden und DPS.
- **Welche Heldenform gilt?** Skill-Baum mit neun Faehigkeiten (Form A) oder
  vier feste Slots (Form B)? Oder ist Form B die Auswahl aus Form A?
- **Ignis' Bild widerspricht seinen Daten.** Die Karte nennt Brennende Aura,
  Aschen-Explosion, Sengende Ketten und Feuersturm, die Daten Ur-Hitze,
  Magma-Kompression, Vulkanausbruch und Kataklysmus.

Dann die Luecken:

- **Werte fehlen** fuer Igne und den Glut-Ritter (HP, Angriff, Verteidigung,
  Geschwindigkeit).
- **Sprecher-Skript fehlt** fuer Ignis (Intro und Gameplay-Tipp).
- **Power Level**: wie berechnet es sich aus Werten und Ausruestung?
- **Ressourcen**: Abklingzeiten sind da – gibt es zusaetzlich Mana o. ae.?
- **Level-Kurve**: Wie kommt ein Held von Lv 1 auf Lv 4, und was kann er auf
  Lv 1?
- **Stapeln**: Wie oft stapelt Brand, wie addieren sich zwei
  Ruestungs-Debuffs?
- **Fraktionen**: Wirkung im Spiel, und wem gehoeren Igne und Glut-Ritter an?
- **Magieschaden gegen Feuerschaden**: zwei Arten oder dieselbe?
- **Teamgroesse**: Wie viele Helden stehen gleichzeitig im Kampf?
