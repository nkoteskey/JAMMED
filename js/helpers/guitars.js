// Guitar collection — every guitar Jammy finds is a different model
// with its own weapon. The collection lives on the global `game` object
// so it survives scene changes and deaths within a play session.
//
//   getGuitarCollection()      -> { owned: [ids], equipped: id }
//   GUITAR_CATALOG[id]         -> { name, weapon, labelColor, desc }
//   ensureGuitarTextures(scn)  -> generates "guitar-<id>" pixel art

const GUITAR_CATALOG = {
  "crimson-v": {
    name: "CRIMSON V",
    weapon: "sonic",
    labelColor: 0xffee88,
    desc: ["SONIC WAVES", "FAST + RELIABLE"],
  },
  "desert-seedcaster": {
    name: "SEEDCASTER",
    weapon: "seed",
    labelColor: 0xff9966,
    desc: ["LOBS SEED BOMBS", "NEEDS SEED AMMO"],
  },
  "royal-bass": {
    name: "ROYAL BASS",
    weapon: "bass",
    labelColor: 0xb08cff,
    desc: ["GROUND QUAKE WAVE", "PIERCES ENEMIES"],
  },
};

function getGuitarCollection() {
  if (typeof game === "undefined" || !game) {
    // Pre-boot fallback — sonic-only loadout
    return { owned: ["crimson-v"], equipped: "crimson-v" };
  }
  if (!game.guitarCollection) {
    game.guitarCollection = { owned: ["crimson-v"], equipped: "crimson-v" };
  }
  return game.guitarCollection;
}

function ensureGuitarTextures(scn) {
  if (scn.textures.exists("guitar-crimson-v")) return;
  let g;

  // Crimson V — the flying V Jammy starts with. 22x36, head up.
  g = scn.make.graphics({ x: 0, y: 0, add: false });
  // headstock + tuners
  g.fillStyle(0x3a2818, 1);
  g.fillRect(8, 0, 6, 7);
  g.fillStyle(0xd8d8e8, 1);
  g.fillRect(6, 1, 2, 2);
  g.fillRect(14, 1, 2, 2);
  g.fillRect(6, 4, 2, 2);
  g.fillRect(14, 4, 2, 2);
  // neck
  g.fillStyle(0x8c5a34, 1);
  g.fillRect(9, 7, 4, 13);
  g.fillStyle(0xd8a868, 1);
  g.fillRect(9, 9, 4, 1);
  g.fillRect(9, 13, 4, 1);
  g.fillRect(9, 17, 4, 1);
  // V body — two red wings
  g.fillStyle(0xd82828, 1);
  g.fillTriangle(11, 20, 0, 24, 8, 36);
  g.fillTriangle(11, 20, 22, 24, 14, 36);
  g.fillStyle(0xff6a5a, 1);
  g.fillTriangle(11, 21, 4, 24, 9, 31);
  // strings + bridge
  g.fillStyle(0xf0f0f8, 1);
  g.fillRect(10, 20, 1, 8);
  g.fillRect(12, 20, 1, 8);
  g.fillStyle(0x3a2818, 1);
  g.fillRect(8, 27, 7, 2);
  g.generateTexture("guitar-crimson-v", 22, 36);
  g.destroy();

  // Seedcaster — a desert acoustic. 22x36.
  g = scn.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x3a2818, 1);
  g.fillRect(8, 0, 6, 6);
  g.fillStyle(0xd8d8e8, 1);
  g.fillRect(6, 1, 2, 2);
  g.fillRect(14, 1, 2, 2);
  g.fillStyle(0x8c5a34, 1);
  g.fillRect(9, 6, 4, 12);
  g.fillStyle(0xd8a868, 1);
  g.fillRect(9, 8, 4, 1);
  g.fillRect(9, 12, 4, 1);
  // rounded body with waist
  g.fillStyle(0xd8a868, 1);
  g.fillCircle(11, 22, 7);
  g.fillCircle(11, 29, 9);
  g.fillStyle(0xf0cb98, 1);
  g.fillCircle(9, 27, 4);
  // soundhole + bridge
  g.fillStyle(0x4a2a14, 1);
  g.fillCircle(11, 24, 3);
  g.fillStyle(0x3a2818, 1);
  g.fillRect(7, 31, 9, 2);
  // strings
  g.fillStyle(0xf0f0f8, 1);
  g.fillRect(10, 18, 1, 13);
  g.fillRect(12, 18, 1, 13);
  g.generateTexture("guitar-desert-seedcaster", 22, 38);
  g.destroy();

  // Royal Bass — deep purple thunder machine. 22x40, longer neck.
  g = scn.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x2a1838, 1);
  g.fillRect(8, 0, 6, 8);
  g.fillStyle(0xffd877, 1);
  g.fillRect(6, 1, 2, 2);
  g.fillRect(14, 1, 2, 2);
  g.fillRect(6, 5, 2, 2);
  g.fillRect(14, 5, 2, 2);
  g.fillStyle(0x5d4037, 1);
  g.fillRect(9, 8, 4, 16);
  g.fillStyle(0xb08cff, 1);
  g.fillRect(9, 11, 4, 1);
  g.fillRect(9, 16, 4, 1);
  g.fillRect(9, 21, 4, 1);
  // offset body with cutaway horn
  g.fillStyle(0x5028a0, 1);
  g.fillCircle(10, 31, 8);
  g.fillCircle(15, 28, 6);
  g.fillTriangle(16, 21, 20, 24, 14, 27);
  g.fillStyle(0x7a50d0, 1);
  g.fillCircle(8, 29, 4);
  // pickup + lightning sticker
  g.fillStyle(0x1a0a22, 1);
  g.fillRect(7, 29, 9, 3);
  g.fillStyle(0xffd877, 1);
  g.fillTriangle(13, 33, 11, 36, 13, 36);
  g.fillTriangle(13, 36, 15, 33, 13, 33);
  // two fat bass strings
  g.fillStyle(0xf0f0f8, 1);
  g.fillRect(10, 24, 1, 8);
  g.fillRect(12, 24, 1, 8);
  g.generateTexture("guitar-royal-bass", 22, 40);
  g.destroy();
}
