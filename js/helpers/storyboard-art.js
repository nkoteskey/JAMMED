// Traced storyboard panels.
//
// These are traced from the artist's own pen-and-pencil drawings on
// the JAMMED Trello board — the same way the four original boards in
// assets/img/storyboards/ were made. Flat colour, heavy ink outline,
// comic backdrop behind the traced figures.
//
//   sb-rocketaxe : "Jammy gets his Rocket Axe" (card: Rocket Axe,
//                  photo.jpg) — Jammy riding the flying V, booster
//                  lit, a watermelon snapper lunging underneath.
//   sb-blubert   : "The introduction of Blubert" (card: The
//                  introduction of Blubert, IMG_2484.JPG) — Jammy
//                  kneeling in the alley by the Jam Junkers lot,
//                  reaching under a beat-up box: "It's okay little
//                  buddy."

// --- inking -----------------------------------------------------------
// Heavy cartoon outline: draw the silhouette in black, offset in a
// disc, then lay the flats on top. Matches the originals' thick line.
function sbaInk(g, draw, spread) {
  g.fillStyle(0x1a1118, 1);
  for (let dx = -spread; dx <= spread; dx++) {
    for (let dy = -spread; dy <= spread; dy++) {
      if (dx * dx + dy * dy > spread * spread) continue;
      draw(g, dx, dy);
    }
  }
}

function sbaLines(g, w, h, base, streak) {
  g.fillStyle(base, 1);
  g.fillRect(0, 0, w, h);
  g.fillStyle(streak, 1);
  for (let i = -h; i < w; i += 20) {
    g.fillPoints([
      { x: i, y: h }, { x: i + 9, y: h },
      { x: i + 9 + h, y: 0 }, { x: i + h, y: 0 },
    ], true);
  }
}

// --- Jammy, traced from the Rocket Axe drawing ------------------------
// A jam jar: cream body, lid rim, checkered bandana with trailing
// ends, big round eyes, lavender limbs, red hi-tops.
function sbaJammy(g, cx, cy, s) {
  const R = (x, y, w, h) => [cx + x * s, cy + y * s, w * s, h * s];
  const E = (x, y, rx, ry) => [cx + x * s, cy + y * s, rx * s, ry * s];

  // silhouette (limbs first so the body overlaps them)
  const sil = (gg, dx = 0, dy = 0) => {
    const o = (a) => [a[0] + dx, a[1] + dy, a[2], a[3]];
    // arms
    gg.fillRect(...o(R(-40, -6, 16, 7)));
    gg.fillRect(...o(R(-44, -4, 8, 20)));
    gg.fillRect(...o(R(24, -8, 18, 7)));
    gg.fillRect(...o(R(38, -6, 8, 16)));
    // fists
    gg.fillEllipse(...[cx - 40 * s + dx, cy + 17 * s + dy, 15 * s, 14 * s]);
    gg.fillEllipse(...[cx + 43 * s + dx, cy + 11 * s + dy, 15 * s, 14 * s]);
    // legs
    gg.fillRect(...o(R(-15, 24, 10, 26)));
    gg.fillRect(...o(R(7, 24, 10, 26)));
    // shoes
    gg.fillRect(...o(R(-24, 47, 22, 10)));
    gg.fillRect(...o(R(5, 47, 22, 10)));
    // body + rim
    gg.fillRect(...o(R(-28, -26, 56, 52)));
    gg.fillEllipse(...[cx + dx, cy - 26 * s + dy, 58 * s, 15 * s]);
    gg.fillEllipse(...[cx + dx, cy + 26 * s + dy, 56 * s, 13 * s]);
    // bandana tails
    gg.fillPoints([
      { x: cx - 30 * s + dx, y: cy - 34 * s + dy },
      { x: cx - 48 * s + dx, y: cy - 40 * s + dy },
      { x: cx - 44 * s + dx, y: cy - 31 * s + dy },
      { x: cx - 30 * s + dx, y: cy - 28 * s + dy },
    ], true);
  };
  sbaInk(g, sil, 3);

  // limbs (lavender)
  g.fillStyle(0xa79ad0, 1);
  g.fillRect(...R(-40, -6, 16, 7));
  g.fillRect(...R(-44, -4, 8, 20));
  g.fillRect(...R(24, -8, 18, 7));
  g.fillRect(...R(38, -6, 8, 16));
  g.fillRect(...R(-15, 24, 10, 26));
  g.fillRect(...R(7, 24, 10, 26));
  // fists
  g.fillStyle(0xf4f2ee, 1);
  g.fillEllipse(cx - 40 * s, cy + 17 * s, 13 * s, 12 * s);
  g.fillEllipse(cx + 43 * s, cy + 11 * s, 13 * s, 12 * s);
  // shoes
  g.fillStyle(0xd2352c, 1);
  g.fillRect(...R(-24, 47, 22, 8));
  g.fillRect(...R(5, 47, 22, 8));
  g.fillStyle(0xf4f2ee, 1);
  g.fillRect(...R(-24, 54, 22, 3));
  g.fillRect(...R(5, 54, 22, 3));

  // jar body
  g.fillStyle(0xeee7da, 1);
  g.fillRect(...R(-28, -26, 56, 52));
  g.fillEllipse(cx, cy + 26 * s, 56 * s, 13 * s);
  g.fillStyle(0xded4c2, 1);          // shading down the right
  g.fillRect(...R(14, -24, 14, 50));
  // waistband
  g.fillStyle(0xa79ad0, 1);
  g.fillRect(...R(-28, 18, 56, 8));
  // lid rim
  g.fillStyle(0xf8f6f2, 1);
  g.fillEllipse(cx, cy - 26 * s, 58 * s, 15 * s);
  g.fillStyle(0xded4c2, 1);
  g.fillEllipse(cx, cy - 24 * s, 50 * s, 10 * s);
  g.fillStyle(0xf8f6f2, 1);
  g.fillEllipse(cx, cy - 27 * s, 50 * s, 10 * s);

  // bandana: red/white check across the brow
  g.fillStyle(0xf4f2ee, 1);
  g.fillRect(...R(-29, -34, 58, 11));
  g.fillStyle(0xb8332c, 1);
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 2; j++) {
      if ((i + j) % 2) continue;
      g.fillRect(cx + (-29 + i * 5.8) * s, cy + (-34 + j * 5.5) * s, 5.8 * s, 5.5 * s);
    }
  }
  // tails
  g.fillStyle(0xf4f2ee, 1);
  g.fillPoints([
    { x: cx - 31 * s, y: cy - 33 * s },
    { x: cx - 47 * s, y: cy - 39 * s },
    { x: cx - 43 * s, y: cy - 31 * s },
    { x: cx - 31 * s, y: cy - 29 * s },
  ], true);

  // face
  g.fillStyle(0x1a1118, 1);
  g.fillEllipse(cx - 13 * s, cy - 11 * s, 19 * s, 19 * s);
  g.fillEllipse(cx + 13 * s, cy - 11 * s, 19 * s, 19 * s);
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(cx - 13 * s, cy - 11 * s, 15 * s, 15 * s);
  g.fillEllipse(cx + 13 * s, cy - 11 * s, 15 * s, 15 * s);
  g.fillStyle(0x1a1118, 1);
  g.fillEllipse(cx - 13 * s, cy - 11 * s, 7 * s, 8 * s);
  g.fillEllipse(cx + 13 * s, cy - 11 * s, 7 * s, 8 * s);
  // brows
  g.fillPoints([
    { x: cx - 23 * s, y: cy - 22 * s }, { x: cx - 5 * s, y: cy - 19 * s },
    { x: cx - 5 * s, y: cy - 16 * s }, { x: cx - 23 * s, y: cy - 18 * s },
  ], true);
  g.fillPoints([
    { x: cx + 23 * s, y: cy - 22 * s }, { x: cx + 5 * s, y: cy - 19 * s },
    { x: cx + 5 * s, y: cy - 16 * s }, { x: cx + 23 * s, y: cy - 18 * s },
  ], true);
  // open mouth
  g.fillEllipse(cx + 1 * s, cy + 6 * s, 17 * s, 11 * s);
}

// --- the flying V, traced --------------------------------------------
function sbaFlyingV(g, cx, cy, s) {
  const P = (x, y) => ({ x: cx + x * s, y: cy + y * s });
  // Body: a true V — flat top deck (Jammy stands here), left wing out
  // to the booster, right wing dropping away, notch between them.
  // Deep notch at N so the two wings read as a V, not a kite
  const body = [P(-26, -16), P(-78, 2), P(-6, 16), P(2, 66), P(32, 26), P(20, -14)];
  const neck = [P(20, -14), P(30, -22), P(92, -74), P(82, -84)];

  const sil = (gg, dx = 0, dy = 0) => {
    const off = (a) => a.map((p) => ({ x: p.x + dx, y: p.y + dy }));
    gg.fillPoints(off(body), true);
    gg.fillPoints(off(neck), true);
    gg.fillEllipse(cx + 90 * s + dx, cy - 80 * s + dy, 24 * s, 17 * s);
    gg.fillRect(cx - 88 * s + dx, cy - 6 * s + dy, 15 * s, 11 * s);
  };
  sbaInk(g, sil, 3);

  g.fillStyle(0xd2352c, 1);
  g.fillPoints(body, true);
  g.fillStyle(0xe8574a, 1);   // highlight on the upper wing face
  g.fillPoints([P(-24, -12), P(-68, 2), P(-14, 12), P(-6, -2)], true);

  // neck + frets
  g.fillStyle(0xc9a06a, 1);
  g.fillPoints(neck, true);
  g.fillStyle(0xf0e2c8, 1);
  for (let i = 1; i < 8; i++) {
    const t = i / 8;
    const ax = 20 + (92 - 20) * t, ay = -14 + (-74 - -14) * t;
    g.fillRect(cx + ax * s, cy + ay * s, 7 * s, 2.6 * s);
  }
  // headstock + tuners
  g.fillStyle(0xc9a06a, 1);
  g.fillEllipse(cx + 90 * s, cy - 80 * s, 22 * s, 15 * s);
  g.fillStyle(0x4a3524, 1);
  [[83, -87], [92, -85], [96, -77], [85, -74]].forEach(([x, y]) =>
    g.fillCircle(cx + x * s, cy + y * s, 2.5 * s));
  // pickups + knobs
  g.fillStyle(0xf4f2ee, 1);
  g.fillRect(cx - 8 * s, cy + 2 * s, 10 * s, 4 * s);
  g.fillRect(cx + 4 * s, cy - 6 * s, 10 * s, 4 * s);
  g.fillStyle(0x8c8f9a, 1);
  g.fillCircle(cx - 2 * s, cy + 24 * s, 2.8 * s);
  g.fillCircle(cx + 8 * s, cy + 18 * s, 2.8 * s);

  // booster on the left wing tip, flame streaming back
  g.fillStyle(0x9aa0ae, 1);
  g.fillRect(cx - 88 * s, cy - 6 * s, 15 * s, 11 * s);
  g.fillStyle(0xf2a51e, 1);
  g.fillPoints([P(-88, -6), P(-134, 4), P(-88, 7)], true);
  g.fillPoints([P(-88, -3), P(-122, 18), P(-88, 8)], true);
  g.fillStyle(0xf2e02a, 1);
  g.fillPoints([P(-89, -3), P(-116, 3), P(-89, 6)], true);
}

// --- watermelon snapper, traced from the same page --------------------
function sbaSnapper(g, cx, cy, s) {
  const P = (x, y) => ({ x: cx + x * s, y: cy + y * s });
  // Jaws splayed apart, gullet wide — the lunge pose from the page
  const left = [P(-26, 42), P(-42, -6), P(-40, -40), P(-14, -10), P(-8, 42)];
  const right = [P(26, 42), P(42, -4), P(38, -38), P(12, -8), P(8, 42)];
  const sil = (gg, dx = 0, dy = 0) => {
    const off = (a) => a.map((p) => ({ x: p.x + dx, y: p.y + dy }));
    gg.fillPoints(off(left), true);
    gg.fillPoints(off(right), true);
  };
  sbaInk(g, sil, 3);

  g.fillStyle(0x2f6b2a, 1);
  g.fillPoints(left, true);
  g.fillPoints(right, true);
  g.fillStyle(0x1e4a1c, 1);   // rind stripes
  for (let i = -38; i < -12; i += 8) g.fillRect(cx + i * s, cy - 30 * s, 3 * s, 70 * s);
  for (let i = 16; i < 40; i += 8) g.fillRect(cx + i * s, cy - 30 * s, 3 * s, 70 * s);
  // gullet + teeth
  g.fillStyle(0xc4324a, 1);
  g.fillPoints([P(-9, 40), P(-14, -10), P(0, -30), P(13, -8), P(9, 40)], true);
  g.fillStyle(0xf0e6d8, 1);
  for (let i = 0; i < 7; i++) {
    const y = -18 + i * 8;
    const w = 13 - i * 0.7;
    g.fillPoints([P(-w, y), P(-w + 6, y + 4), P(-w, y + 8)], true);
    g.fillPoints([P(w, y + 4), P(w - 6, y + 8), P(w, y + 12)], true);
  }
  // vine + leaves
  g.fillStyle(0x2f6b2a, 1);
  g.fillRect(cx + 26 * s, cy + 18 * s, 22 * s, 4 * s);
  g.fillEllipse(cx + 50 * s, cy + 12 * s, 16 * s, 9 * s);
  g.fillRect(cx - 48 * s, cy + 26 * s, 22 * s, 4 * s);
  g.fillEllipse(cx - 52 * s, cy + 20 * s, 15 * s, 9 * s);
}

// --- PANEL: Jammy gets his Rocket Axe ---------------------------------
function buildRocketAxePanel(scn) {
  if (scn.textures.exists("sb-rocketaxe")) return;
  const g = scn.make.graphics({ x: 0, y: 0, add: false });
  sbaLines(g, 426, 188, 0xd8442a, 0xe9633c);
  g.fillStyle(0xf2c04a, 0.85); g.fillCircle(196, 86, 92);
  g.fillStyle(0xf7dc86, 0.9); g.fillCircle(196, 86, 62);
  // ground haze under the action
  g.fillStyle(0x8f2a18, 1); g.fillRect(0, 176, 426, 12);

  sbaFlyingV(g, 190, 132, 0.86);
  sbaJammy(g, 176, 66, 0.82);
  sbaSnapper(g, 356, 128, 0.72);

  g.generateTexture("sb-rocketaxe", 426, 188);
  g.destroy();
}

// --- PANEL: The introduction of Blubert -------------------------------
function buildBlubertPanel(scn) {
  if (scn.textures.exists("sb-blubert")) return;
  const g = scn.make.graphics({ x: 0, y: 0, add: false });
  // Night alley
  g.fillStyle(0x1d2a4a, 1); g.fillRect(0, 0, 426, 188);
  g.fillStyle(0x26365c, 1); g.fillRect(0, 0, 426, 96);
  // Brick back wall
  g.fillStyle(0x2f3f68, 1);
  for (let y = 0; y < 150; y += 12) {
    for (let x = (y / 12) % 2 ? -12 : 0; x < 426; x += 34) {
      g.fillRect(x + 2, y + 2, 30, 8);
    }
  }
  // Pool of light from off-panel
  g.fillStyle(0xf2d08a, 0.10); g.fillCircle(150, 150, 120);
  g.fillStyle(0xf2d08a, 0.10); g.fillCircle(150, 150, 74);

  // --- Jam Junkers lot on the right: shelving + signage board
  const rack = (gg, dx = 0, dy = 0) => {
    gg.fillRect(286 + dx, 40 + dy, 8, 108);
    gg.fillRect(414 + dx, 40 + dy, 8, 108);
    gg.fillRect(286 + dx, 40 + dy, 136, 7);
    gg.fillRect(286 + dx, 84 + dy, 136, 7);
    gg.fillRect(286 + dx, 128 + dy, 136, 7);
  };
  sbaInk(g, rack, 2);
  g.fillStyle(0x6d5a44, 1); rack(g);
  g.fillStyle(0x8a7355, 1);
  g.fillRect(286, 40, 136, 3); g.fillRect(286, 84, 136, 3);
  // crates on the shelves
  g.fillStyle(0x56462f, 1);
  g.fillRect(298, 58, 30, 24); g.fillRect(336, 62, 26, 20); g.fillRect(376, 56, 34, 26);
  g.fillRect(300, 102, 26, 24); g.fillRect(352, 100, 32, 26);
  // sign board
  const sign = (gg, dx = 0, dy = 0) => gg.fillRect(292 + dx, 12 + dy, 126, 24);
  sbaInk(g, sign, 2);
  g.fillStyle(0xd9c79a, 1); g.fillRect(292, 12, 126, 24);

  // --- the beat-up box, tipped over
  const box = (gg, dx = 0, dy = 0) => {
    gg.fillPoints([
      { x: 214 + dx, y: 152 + dy }, { x: 260 + dx, y: 142 + dy },
      { x: 266 + dx, y: 172 + dy }, { x: 216 + dx, y: 176 + dy },
    ], true);
    gg.fillPoints([
      { x: 260 + dx, y: 142 + dy }, { x: 282 + dx, y: 150 + dy },
      { x: 288 + dx, y: 176 + dy }, { x: 266 + dx, y: 172 + dy },
    ], true);
  };
  sbaInk(g, box, 3);
  g.fillStyle(0x9b7a4f, 1);
  g.fillPoints([{x:214,y:152},{x:260,y:142},{x:266,y:172},{x:216,y:176}], true);
  g.fillStyle(0x7d6140, 1);
  g.fillPoints([{x:260,y:142},{x:282,y:150},{x:288,y:176},{x:266,y:172}], true);
  // torn flap + tape
  g.fillStyle(0x6b5233, 1);
  g.fillPoints([{x:222,y:150},{x:246,y:145},{x:240,y:138},{x:220,y:144}], true);

  // --- Blubert, just visible under the lip of the box
  const blu = (gg, dx = 0, dy = 0) => gg.fillCircle(240 + dx, 170 + dy, 15);
  sbaInk(g, blu, 3);
  g.fillStyle(0x3358b8, 1); g.fillCircle(240, 170, 15);
  g.fillStyle(0x5f86e0, 1); g.fillCircle(236, 165, 8);
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(235, 168, 9, 10); g.fillEllipse(246, 168, 9, 10);
  g.fillStyle(0x1a1118, 1);
  g.fillEllipse(236, 169, 4, 5); g.fillEllipse(247, 169, 4, 5);
  // little prop
  g.fillStyle(0x1a1118, 1); g.fillRect(232, 152, 17, 3);
  g.fillRect(239, 152, 3, 6);

  // --- Jammy kneeling, reaching into the box
  const kx = 152, ky = 116, s = 0.62;
  const kneel = (gg, dx = 0, dy = 0) => {
    // back leg folded flat on the ground, front knee up
    gg.fillRect(kx - 38 * s + dx, ky + 44 * s + dy, 48 * s, 13 * s);
    gg.fillRect(kx - 22 * s + dx, ky + 22 * s + dy, 13 * s, 26 * s);
    gg.fillRect(kx + 10 * s + dx, ky + 24 * s + dy, 13 * s, 34 * s);
    gg.fillRect(kx + 6 * s + dx, ky + 52 * s + dy, 30 * s, 12 * s);
    // reaching arm out to the box, back arm bracing
    gg.fillRect(kx + 24 * s + dx, ky + 2 * s + dy, 62 * s, 10 * s);
    gg.fillEllipse(kx + 92 * s + dx, ky + 8 * s + dy, 17 * s, 16 * s);
    gg.fillRect(kx - 42 * s + dx, ky + 4 * s + dy, 16 * s, 10 * s);
    gg.fillEllipse(kx - 46 * s + dx, ky + 18 * s + dy, 15 * s, 14 * s);
    // jar body
    gg.fillRect(kx - 30 * s + dx, ky - 26 * s + dy, 60 * s, 54 * s);
    gg.fillEllipse(kx + dx, ky - 26 * s + dy, 62 * s, 16 * s);
    gg.fillEllipse(kx + dx, ky + 28 * s + dy, 60 * s, 14 * s);
  };
  sbaInk(g, kneel, 3);
  g.fillStyle(0xa79ad0, 1);
  g.fillRect(kx - 38 * s, ky + 44 * s, 48 * s, 13 * s);
  g.fillRect(kx - 22 * s, ky + 22 * s, 13 * s, 26 * s);
  g.fillRect(kx + 10 * s, ky + 24 * s, 13 * s, 34 * s);
  g.fillRect(kx + 24 * s, ky + 2 * s, 62 * s, 10 * s);
  g.fillRect(kx - 42 * s, ky + 4 * s, 16 * s, 10 * s);
  g.fillStyle(0xf4f2ee, 1);
  g.fillEllipse(kx + 92 * s, ky + 8 * s, 15 * s, 14 * s);
  g.fillEllipse(kx - 46 * s, ky + 18 * s, 13 * s, 12 * s);
  g.fillStyle(0xd2352c, 1);
  g.fillRect(kx + 6 * s, ky + 52 * s, 30 * s, 9 * s);
  g.fillRect(kx - 38 * s, ky + 50 * s, 20 * s, 7 * s);
  g.fillStyle(0xf4f2ee, 1);
  g.fillRect(kx + 6 * s, ky + 60 * s, 30 * s, 4 * s);
  // jar body
  g.fillStyle(0xeee7da, 1);
  g.fillRect(kx - 30 * s, ky - 26 * s, 60 * s, 54 * s);
  g.fillEllipse(kx, ky + 28 * s, 60 * s, 14 * s);
  g.fillStyle(0xded4c2, 1);
  g.fillRect(kx + 14 * s, ky - 24 * s, 16 * s, 52 * s);
  g.fillStyle(0xa79ad0, 1);
  g.fillRect(kx - 30 * s, ky + 19 * s, 60 * s, 9 * s);
  g.fillStyle(0xf8f6f2, 1);
  g.fillEllipse(kx, ky - 26 * s, 62 * s, 16 * s);
  g.fillStyle(0xded4c2, 1);
  g.fillEllipse(kx, ky - 24 * s, 53 * s, 11 * s);
  g.fillStyle(0xf8f6f2, 1);
  g.fillEllipse(kx, ky - 27 * s, 53 * s, 11 * s);
  // bandana
  g.fillStyle(0xf4f2ee, 1);
  g.fillRect(kx - 31 * s, ky - 35 * s, 62 * s, 12 * s);
  g.fillStyle(0xb8332c, 1);
  for (let i = 0; i < 10; i++) for (let j = 0; j < 2; j++) {
    if ((i + j) % 2) continue;
    g.fillRect(kx + (-31 + i * 6.2) * s, ky + (-35 + j * 6) * s, 6.2 * s, 6 * s);
  }
  // face, turned toward the box
  g.fillStyle(0x1a1118, 1);
  g.fillEllipse(kx + 4 * s, ky - 12 * s, 20 * s, 20 * s);
  g.fillEllipse(kx + 26 * s, ky - 12 * s, 20 * s, 20 * s);
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(kx + 4 * s, ky - 12 * s, 16 * s, 16 * s);
  g.fillEllipse(kx + 26 * s, ky - 12 * s, 16 * s, 16 * s);
  g.fillStyle(0x1a1118, 1);
  g.fillEllipse(kx + 8 * s, ky - 11 * s, 7 * s, 8 * s);
  g.fillEllipse(kx + 30 * s, ky - 11 * s, 7 * s, 8 * s);
  g.fillEllipse(kx + 17 * s, ky + 7 * s, 15 * s, 8 * s);

  // --- speech balloon (text drawn by the scene)
  const bub = (gg, dx = 0, dy = 0) => {
    gg.fillEllipse(140 + dx, 32 + dy, 168, 50);
    gg.fillPoints([
      { x: 126 + dx, y: 52 + dy }, { x: 146 + dx, y: 50 + dy },
      { x: 132 + dx, y: 74 + dy },
    ], true);
  };
  sbaInk(g, bub, 3);
  g.fillStyle(0xf8f6f2, 1);
  g.fillEllipse(140, 32, 162, 44);
  g.fillPoints([{x:128,y:50},{x:144,y:48},{x:134,y:70}], true);

  g.generateTexture("sb-blubert", 426, 188);
  g.destroy();
}
