// Storyboard panels drawn at runtime in the style of the existing
// hand-drawn boards: bold flat colour, heavy black outlines, comic
// speed-line backgrounds, and a big close-up subject. Same 426x240
// frame and the same caption treatment as CutScene1_1, so the new
// scenes sit alongside the originals instead of next to them.

// Diagonal speed lines behind the subject — straight off the
// existing "jammy gets to business" panel.
function sbSpeedLines(g, x0, y0, w, h, base, streak) {
  g.fillStyle(base, 1);
  g.fillRect(x0, y0, w, h);
  g.fillStyle(streak, 1);
  for (let i = -h; i < w; i += 18) {
    g.beginPath();
    g.moveTo(x0 + i, y0 + h);
    g.lineTo(x0 + i + 8, y0 + h);
    g.lineTo(x0 + i + 8 + h, y0);
    g.lineTo(x0 + i + h, y0);
    g.closePath();
    g.fillPath();
  }
}

// Thick cartoon outline: draw the shape oversized in black first.
function sbInk(g, draw, spread = 3) {
  g.fillStyle(0x000000, 1);
  for (let dx = -spread; dx <= spread; dx++) {
    for (let dy = -spread; dy <= spread; dy++) {
      if (dx * dx + dy * dy > spread * spread) continue;
      draw(g, dx, dy);
    }
  }
}

// Jammy's head: a loaf with a checkered bandana and big cartoon eyes.
function sbJammyHead(g, cx, cy, s, mood) {
  const body = (gg, dx = 0, dy = 0) => {
    gg.fillRect(cx - 34 * s + dx, cy - 30 * s + dy, 68 * s, 64 * s);
    gg.fillEllipse(cx + dx, cy + 32 * s + dy, 68 * s, 16 * s);
    gg.fillEllipse(cx + dx, cy - 30 * s + dy, 68 * s, 16 * s);
  };
  sbInk(g, body, 4);
  g.fillStyle(0xf5d7a8, 1); body(g);
  // Crust shading down the right
  g.fillStyle(0xe0bd88, 1);
  g.fillRect(cx + 16 * s, cy - 28 * s, 18 * s, 60 * s);

  // Bandana
  g.fillStyle(0x000000, 1);
  g.fillRect(cx - 37 * s, cy - 32 * s, 74 * s, 18 * s);
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx - 34 * s, cy - 29 * s, 68 * s, 12 * s);
  g.fillStyle(0xc02030, 1);
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 2; j++) {
      if ((i + j) % 2) continue;
      g.fillRect(cx - 34 * s + i * 7.6 * s, cy - 29 * s + j * 6 * s, 7.6 * s, 6 * s);
    }
  }

  // Eyes
  const eye = (ex) => {
    g.fillStyle(0x000000, 1);
    g.fillEllipse(cx + ex * s, cy - 4 * s, 20 * s, 22 * s);
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(cx + ex * s, cy - 4 * s, 15 * s, 17 * s);
    g.fillStyle(0x000000, 1);
    g.fillEllipse(cx + ex * s + (mood === "side" ? 3 * s : 0), cy - 3 * s, 6 * s, 7 * s);
  };
  eye(-14); eye(14);
  // Brows
  g.fillStyle(0x000000, 1);
  if (mood === "angry") {
    g.fillTriangle(cx - 26 * s, cy - 16 * s, cx - 4 * s, cy - 10 * s, cx - 26 * s, cy - 8 * s);
    g.fillTriangle(cx + 26 * s, cy - 16 * s, cx + 4 * s, cy - 10 * s, cx + 26 * s, cy - 8 * s);
  } else if (mood === "surprised") {
    g.fillRect(cx - 26 * s, cy - 20 * s, 18 * s, 3 * s);
    g.fillRect(cx + 8 * s, cy - 20 * s, 18 * s, 3 * s);
  }
  // Mouth
  g.fillStyle(0x000000, 1);
  if (mood === "surprised") g.fillEllipse(cx, cy + 16 * s, 14 * s, 16 * s);
  else { g.fillRect(cx - 12 * s, cy + 12 * s, 24 * s, 8 * s); g.fillStyle(0xffffff,1);
         g.fillRect(cx - 9 * s, cy + 13 * s, 18 * s, 3 * s); }
}

// PANEL 1 — Jammy gets his Rocket Axe
function buildRocketAxePanel(scn) {
  if (scn.textures.exists("sb-rocketaxe")) return;
  const g = scn.make.graphics({ x: 0, y: 0, add: false });
  sbSpeedLines(g, 0, 0, 426, 240, 0xd83018, 0xf06030);
  // Blast glow behind
  g.fillStyle(0xffd066, 0.9); g.fillCircle(300, 92, 78);
  g.fillStyle(0xfff0b0, 0.9); g.fillCircle(300, 92, 50);

  // The guitar, held up, flames at the tail
  const guitar = (gg, dx = 0, dy = 0) => {
    gg.fillRect(292 + dx, 20 + dy, 16, 76);           // neck
    gg.fillTriangle(262 + dx, 132 + dy, 300 + dx, 92 + dy, 300 + dx, 144 + dy); // V
    gg.fillTriangle(338 + dx, 132 + dy, 300 + dx, 92 + dy, 300 + dx, 144 + dy);
    gg.fillRect(282 + dx, 8 + dy, 36, 18);            // headstock
  };
  sbInk(g, guitar, 4);
  g.fillStyle(0xd82828, 1); guitar(g);
  g.fillStyle(0xff6a5a, 1);
  g.fillTriangle(272, 128, 298, 100, 298, 134);
  g.fillStyle(0x8c5a34, 1); g.fillRect(294, 22, 12, 72);
  g.fillStyle(0xffffff, 1);
  g.fillRect(296, 24, 2, 68); g.fillRect(302, 24, 2, 68);

  // Rocket exhaust, fully inside the art area
  g.fillStyle(0xffd066, 1);
  g.fillTriangle(300, 142, 278, 176, 322, 176);
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(300, 148, 290, 170, 310, 170);

  sbJammyHead(g, 106, 96, 1.0, "surprised");

  g.generateTexture("sb-rocketaxe", 426, 240);
  g.destroy();
}

// PANEL 2 — The introduction of Blubert
function buildBlubertPanel(scn) {
  if (scn.textures.exists("sb-blubert")) return;
  const g = scn.make.graphics({ x: 0, y: 0, add: false });
  sbSpeedLines(g, 0, 0, 426, 240, 0x2a4ea8, 0x3f68c8);
  g.fillStyle(0x89b6ff, 0.55); g.fillCircle(290, 84, 78);

  // Blubert: a round blue drone with a big single-lens eye and rotor
  const blu = (gg, dx = 0, dy = 0) => {
    gg.fillCircle(292 + dx, 86 + dy, 52);
    gg.fillRect(228 + dx, 22 + dy, 128, 12);   // rotor bar
    gg.fillRect(286 + dx, 26 + dy, 12, 14);    // mast
  };
  sbInk(g, blu, 4);
  g.fillStyle(0x2f6ad0, 1); g.fillCircle(292, 86, 52);
  g.fillStyle(0x4f92f0, 1); g.fillCircle(280, 74, 33);
  g.fillStyle(0x1a3f86, 1); g.fillRect(228, 22, 128, 12);
  g.fillRect(286, 26, 12, 14);
  // Lens
  g.fillStyle(0x000000, 1); g.fillCircle(298, 90, 29);
  g.fillStyle(0xffffff, 1); g.fillCircle(298, 90, 23);
  g.fillStyle(0x2a2a44, 1); g.fillCircle(301, 92, 11);
  g.fillStyle(0xffd066, 1); g.fillCircle(301, 92, 6);
  g.fillStyle(0xffffff, 1); g.fillCircle(290, 81, 6);
  // Scan beam sweeping down-left toward Jammy
  g.fillStyle(0xffd066, 0.30);
  g.fillTriangle(298, 106, 138, 158, 176, 162);

  sbJammyHead(g, 92, 104, 0.92, "side");

  g.generateTexture("sb-blubert", 426, 240);
  g.destroy();
}

// Shared cutscene runner matching CutScene1_1's presentation:
// fade the panel in, then the caption, then advance on input.
function runStoryboard(scn, textureKey, caption, nextScene, tint, burst) {
  const fade = 450;
  scn.cameras.main.setBackgroundColor("#000000");
  const bg = scn.add.sprite(0, 0, textureKey).setAlpha(0).setOrigin(0);

  // Caption sits on its own band — the hand-drawn panels are busy and
  // bare text over them is unreadable.
  const band = scn.add.rectangle(213, 202, 426, 76, 0x000000, 0.72).setAlpha(0);
  const rule = scn.add.rectangle(213, 164, 426, 2, tint || 0xd8f878, 0.9).setAlpha(0);
  const shadow = scn.add.bitmapText(scn.cameras.main.centerX + 1, 175,
    "8-bit-mono", caption, 12)
    .setOrigin(0.5, 0).setMaxWidth(370).setTint(0x000000).setAlpha(0);
  const body = scn.add.bitmapText(scn.cameras.main.centerX, 174,
    "8-bit-mono", caption, 12)
    .setOrigin(0.5, 0).setMaxWidth(370).setTint(tint || 0xd8f878).setAlpha(0);

  if (burst) {
    const bx = burst.x !== undefined ? burst.x : 320;
    const by = burst.y !== undefined ? burst.y : 52;
    const sh = scn.add.bitmapText(bx + 2, by + 2, "tempFont", burst.text, 16)
      .setOrigin(0.5).setTintFill(0x000000).setAngle(-8);
    const tx = scn.add.bitmapText(bx, by, "tempFont", burst.text, 16)
      .setOrigin(0.5).setTintFill(burst.color || 0xffd066).setAngle(-8);
    scn.tweens.add({ targets: [sh, tx], scale: 1.08, duration: 420,
      yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  let ready = false;
  scn.tweens.add({
    targets: bg, alpha: 1, duration: fade,
    onComplete: () => scn.tweens.add({
      targets: [band, rule, shadow, body], alpha: 1, duration: fade,
      onComplete: () => {
        ready = true;
        const hint = scn.add.bitmapText(418, 232,
          "tempFont", "ANY BUTTON >", 8)
          .setOrigin(1, 0.5).setTintFill(0xffffff);
        scn.tweens.add({ targets: hint, alpha: 0.2, duration: 600,
          yoyo: true, repeat: -1 });
      },
    }),
  });

  const go = () => {
    if (!ready) return;
    ready = false;
    scn.cameras.main.fadeOut(400, 0, 0, 0);
    scn.cameras.main.once("camerafadeoutcomplete", () => scn.scene.start(nextScene));
  };
  scn.input.on("pointerdown", go);
  scn.input.keyboard.on("keydown", go);
  // Never strand the player on a cutscene
  scn.time.delayedCall(9000, go);
}
