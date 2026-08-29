const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const spielDir = path.join(__dirname, '..', 'spiel');
const heldenDir = path.join(spielDir, 'helden');
const helden = JSON.parse(fs.readFileSync(path.join(heldenDir, 'helden.json'), 'utf8')).helden;
const mechaniken = JSON.parse(fs.readFileSync(path.join(spielDir, 'mechaniken.json'), 'utf8'));

const typNamen = new Set();
for (const typ of mechaniken.faehigkeitstypen) {
  typNamen.add(typ.name);
  for (const alias of typ.aliase || []) typNamen.add(alias);
}
const rollenNamen = new Set(mechaniken.rollen.map((r) => r.name));
const seltenheitKuerzel = new Set(mechaniken.seltenheiten.map((s) => s.kuerzel));
const fraktionsNamen = new Set((mechaniken.fraktionen || []).map((f) => f.name));
const erlaubteStufen = mechaniken.skillbaum.ebenen.map((e) => e.stufe);
const faehigkeitsSlots = mechaniken.faehigkeitsSlots.map((s) => s.id);
const ausruestungsSlots = new Set(mechaniken.ausruestungsSlots.map((s) => s.id));
const werteIds = new Set(mechaniken.werte.map((w) => w.id));
const zielarten = new Set(mechaniken.zielarten.map((z) => z.id));

// Helden liegen in einer von zwei Formen vor - siehe mechaniken.md:
//   "skillbaum"  drei Zweige mit je drei Stufen (Igne, Glut-Ritter)
//   "slots"      vier feste Faehigkeits-Slots plus Werte (Ignis)
const form = (held) => (held.zweige ? 'skillbaum' : 'slots');

test('Helden-IDs sind eindeutig', () => {
  const ids = helden.map((h) => h.id);
  assert.strictEqual(new Set(ids).size, ids.length);
});

test('jeder Held hat genau eine der beiden Formen', () => {
  for (const held of helden) {
    assert.notStrictEqual(
      Boolean(held.zweige),
      Boolean(held.faehigkeiten),
      `${held.id}: braucht entweder zweige oder faehigkeiten, nicht beides und nicht keines`
    );
  }
});

for (const held of helden) {
  test(`${held.id}: Rolle, Seltenheit und Fraktion sind definiert`, () => {
    assert.ok(rollenNamen.has(held.rolle), `unbekannte Rolle: ${held.rolle}`);
    assert.ok(
      seltenheitKuerzel.has(held.seltenheitKuerzel),
      `unbekannte Seltenheit: ${held.seltenheitKuerzel}`
    );
    if (held.fraktion) {
      assert.ok(fraktionsNamen.has(held.fraktion), `unbekannte Fraktion: ${held.fraktion}`);
    }
  });

  test(`${held.id}: Bild und Steckbrief existieren`, () => {
    assert.ok(fs.existsSync(path.join(heldenDir, held.bild)), `fehlt: ${held.bild}`);
    assert.ok(fs.existsSync(path.join(heldenDir, `${held.id}.md`)), 'Steckbrief fehlt');
  });

  test(`${held.id}: Pflichtfelder sind gefuellt`, () => {
    for (const feld of ['id', 'name', 'seltenheit', 'rolle', 'waffe', 'fokus', 'bild']) {
      assert.ok(
        typeof held[feld] === 'string' && held[feld].length > 0,
        `${feld} fehlt oder ist leer`
      );
    }
  });

  if (form(held) === 'skillbaum') {
    test(`${held.id}: Skill-Baum hat die vorgegebene Form`, () => {
      assert.strictEqual(held.zweige.length, mechaniken.skillbaum.zweigeProHeld);
      assert.deepStrictEqual(
        held.zweige.map((z) => z.position),
        mechaniken.skillbaum.positionen
      );
      for (const zweig of held.zweige) {
        assert.deepStrictEqual(
          zweig.faehigkeiten.map((f) => f.stufe),
          erlaubteStufen,
          `${zweig.id}: Stufen muessen aufsteigend je einmal vorkommen`
        );
      }
    });
  } else {
    test(`${held.id}: Faehigkeits-Slots sind vollstaendig und in der Reihenfolge`, () => {
      assert.deepStrictEqual(held.faehigkeiten.map((f) => f.slot), faehigkeitsSlots);
    });

    test(`${held.id}: Abklingzeiten und Zielarten sind plausibel`, () => {
      for (const f of held.faehigkeiten) {
        if (f.slot === 'passiv') {
          assert.ok(f.abklingzeit === undefined, 'Passiv hat keine Abklingzeit');
        } else {
          assert.ok(
            Number.isInteger(f.abklingzeit) && f.abklingzeit > 0,
            `${f.name}: Abklingzeit muss eine positive ganze Rundenzahl sein`
          );
        }
        if (f.zielart) assert.ok(zielarten.has(f.zielart), `unbekannte Zielart: ${f.zielart}`);
      }
      const aktive = held.faehigkeiten.filter((f) => f.abklingzeit !== undefined);
      const ultimativ = held.faehigkeiten.find((f) => f.slot === 'ultimativ');
      for (const f of aktive) {
        if (f !== ultimativ) {
          assert.ok(
            f.abklingzeit <= ultimativ.abklingzeit,
            `${f.name}: darf nicht laenger abklingen als die Ultimative`
          );
        }
      }
    });

    test(`${held.id}: Werte und Ausruestung nutzen bekannte Felder`, () => {
      for (const wert of Object.keys(held.werte || {})) {
        assert.ok(werteIds.has(wert), `unbekannter Wert: ${wert}`);
      }
      const belegt = new Set();
      for (const teil of held.ausruestung || []) {
        assert.ok(ausruestungsSlots.has(teil.slot), `unbekannter Slot: ${teil.slot}`);
        assert.ok(!belegt.has(teil.slot), `Slot doppelt belegt: ${teil.slot}`);
        belegt.add(teil.slot);
        for (const wert of Object.keys(teil.bonus)) {
          assert.ok(werteIds.has(wert), `unbekannter Bonuswert bei ${teil.name}: ${wert}`);
        }
      }
    });
  }

  test(`${held.id}: Faehigkeitstypen sind definiert und Beschreibungen gefuellt`, () => {
    const alle = held.zweige
      ? held.zweige.flatMap((z) => z.faehigkeiten)
      : held.faehigkeiten;
    for (const f of alle) {
      assert.ok(typNamen.has(f.typ), `unbekannter Typ bei ${f.name}: ${f.typ}`);
      assert.ok(f.beschreibung.length > 0, `${f.name}: Beschreibung fehlt`);
    }
    const ids = alle.map((f) => f.id);
    assert.strictEqual(new Set(ids).size, ids.length, 'doppelte Faehigkeits-ID');
  });
}

test('Seltenheitsraenge sind eindeutig und aufsteigend', () => {
  const raenge = mechaniken.seltenheiten.map((s) => s.rang);
  assert.deepStrictEqual(raenge, [...raenge].sort((a, b) => a - b));
  assert.strictEqual(new Set(raenge).size, raenge.length);
});

test('Fraktionen verweisen auf existierende Helden', () => {
  const ids = new Set(helden.map((h) => h.id));
  for (const fraktion of mechaniken.fraktionen || []) {
    for (const heldId of fraktion.helden || []) {
      assert.ok(ids.has(heldId), `${fraktion.name}: unbekannter Held ${heldId}`);
    }
  }
});
