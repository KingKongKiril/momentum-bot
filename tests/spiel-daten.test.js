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
const erlaubtePositionen = new Set(mechaniken.skillbaum.positionen);
const erlaubteStufen = new Set(mechaniken.skillbaum.ebenen.map((e) => e.stufe));

test('Helden-IDs sind eindeutig', () => {
  const ids = helden.map((h) => h.id);
  assert.strictEqual(new Set(ids).size, ids.length);
});

for (const held of helden) {
  test(`${held.id}: Rolle und Seltenheit sind in mechaniken.json definiert`, () => {
    assert.ok(rollenNamen.has(held.rolle), `unbekannte Rolle: ${held.rolle}`);
    assert.ok(
      seltenheitKuerzel.has(held.seltenheitKuerzel),
      `unbekannte Seltenheit: ${held.seltenheitKuerzel}`
    );
  });

  test(`${held.id}: Bild existiert`, () => {
    assert.ok(fs.existsSync(path.join(heldenDir, held.bild)), `fehlt: ${held.bild}`);
  });

  test(`${held.id}: Steckbrief existiert`, () => {
    assert.ok(fs.existsSync(path.join(heldenDir, `${held.id}.md`)));
  });

  test(`${held.id}: Skill-Baum hat die vorgegebene Form`, () => {
    assert.strictEqual(held.zweige.length, mechaniken.skillbaum.zweigeProHeld);
    assert.deepStrictEqual(
      held.zweige.map((z) => z.position),
      mechaniken.skillbaum.positionen
    );
    for (const zweig of held.zweige) {
      assert.ok(erlaubtePositionen.has(zweig.position));
      assert.deepStrictEqual(
        zweig.faehigkeiten.map((f) => f.stufe),
        [...erlaubteStufen],
        `${zweig.id}: Stufen muessen aufsteigend je einmal vorkommen`
      );
    }
  });

  test(`${held.id}: Faehigkeitstypen sind in mechaniken.json definiert`, () => {
    for (const zweig of held.zweige) {
      for (const f of zweig.faehigkeiten) {
        assert.ok(typNamen.has(f.typ), `unbekannter Typ bei ${f.name}: ${f.typ}`);
      }
    }
  });

  test(`${held.id}: Pflichtfelder sind gefuellt`, () => {
    for (const feld of ['id', 'name', 'seltenheit', 'rolle', 'waffe', 'fokus', 'intro', 'gameplayTipp']) {
      assert.ok(
        typeof held[feld] === 'string' && held[feld].length > 0,
        `${feld} fehlt oder ist leer`
      );
    }
    for (const zweig of held.zweige) {
      for (const f of zweig.faehigkeiten) {
        assert.ok(f.beschreibung.length > 0, `${f.name}: Beschreibung fehlt`);
      }
    }
  });
}

test('Faehigkeits-IDs sind je Held eindeutig', () => {
  for (const held of helden) {
    const ids = held.zweige.flatMap((z) => z.faehigkeiten.map((f) => f.id));
    assert.strictEqual(new Set(ids).size, ids.length, `${held.id}: doppelte Faehigkeits-ID`);
  }
});
