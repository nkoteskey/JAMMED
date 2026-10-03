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
    attachment: "SONIC PICKUP",
    weapon: "sonic",
    labelColor: 0xffee88,
    body: 0xd82828,
    highlight: 0xff6a5a,
    desc: ["SONIC WAVES", "FAST + RELIABLE"],
  },
  "desert-seedcaster": {
    name: "SEEDCASTER",
    attachment: "SEED LAUNCHER",
    weapon: "seed",
    labelColor: 0xff9966,
    body: 0xd8a868,
    highlight: 0xf0cb98,
    desc: ["LOBS SEED BOMBS", "NEEDS SEED AMMO"],
  },
  "royal-bass": {
    name: "ROYAL BASS",
    attachment: "QUAKE AMP",
    weapon: "bass",
    labelColor: 0xb08cff,
    body: 0x5028a0,
    highlight: 0x7a50d0,
    desc: ["GROUND QUAKE WAVE", "PIERCES ENEMIES"],
  },
  "glacier-slide": {
    name: "GLACIER SLIDE",
    attachment: "SLIDE BAR",
    weapon: "slide",
    labelColor: 0x9ad8ff,
    body: 0x8ed8f8,
    highlight: 0xd8f4ff,
    desc: ["BOUNCING ECHO NOTES", "DOWN+MOVE: POWER SLIDE / GRIND RAILS"],
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
  Object.keys(GUITAR_CATALOG).forEach((id) => {
    const cat = GUITAR_CATALOG[id];
    const g = scn.make.graphics({ x: 0, y: 0, add: false });
    // The Flying V, 22x36, head up — same silhouette for every model
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
    // V body in this model's finish
    g.fillStyle(cat.body, 1);
    g.fillTriangle(11, 20, 0, 24, 8, 36);
    g.fillTriangle(11, 20, 22, 24, 14, 36);
    g.fillStyle(cat.highlight, 1);
    g.fillTriangle(11, 21, 4, 24, 9, 31);
    // strings + bridge
    g.fillStyle(0xf0f0f8, 1);
    g.fillRect(10, 20, 1, 8);
    g.fillRect(12, 20, 1, 8);
    g.fillStyle(0x3a2818, 1);
    g.fillRect(8, 27, 7, 2);
    // The weapon attachment bolted to the right wing
    if (cat.weapon === "seed") {
      g.fillStyle(0x4a2a14, 1);
      g.fillRect(13, 29, 7, 4); // launcher tube
      g.fillStyle(0xf0c899, 1);
      g.fillRect(18, 30, 3, 2); // seed in the muzzle
    } else if (cat.weapon === "bass") {
      g.fillStyle(0x1a0a22, 1);
      g.fillRect(13, 28, 7, 6); // amp box
      g.fillStyle(0xffd877, 1);
      g.fillRect(15, 29, 1, 2);
      g.fillRect(16, 31, 1, 2); // bolt
      g.fillRect(17, 29, 1, 2);
    } else if (cat.weapon === "slide") {
      g.fillStyle(0xf4fbff, 1);
      g.fillRect(6, 23, 11, 2); // chrome slide bar across the strings
      g.fillStyle(0x8ec4d8, 1);
      g.fillRect(6, 25, 11, 1);
    } else {
      g.fillStyle(0x1a0a22, 1);
      g.fillRect(13, 29, 6, 3); // stock pickup
    }
    g.generateTexture("guitar-" + id, 22, 36);
    g.destroy();
  });
}
