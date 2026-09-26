// Storyboard panels.
//
// The four original boards are traces of the artist's own drawings,
// and nothing generated from primitives is going to sit next to them
// honestly. So these panels don't draw the characters at all — they
// compose the GAME'S OWN hand-drawn sprites at poster scale
// (nearest-neighbour, integer-ish scaling so the pixels stay crisp)
// over a dramatic backdrop. The characters are the artist's art;
// only the staging is code.
//
// If/when hand-drawn panel art exists for a scene, drop the PNG in
// assets/img/storyboards/ and pass its key to runStoryboard instead
// — everything below is the fallback, not the goal.

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

// PANEL 1 backdrop — Jammy gets his Rocket Axe
function buildRocketAxePanel(scn) {
  if (scn.textures.exists("sb-rocketaxe")) return;
  const g = scn.make.graphics({ x: 0, y: 0, add: false });
  sbSpeedLines(g, 0, 0, 426, 240, 0xd83018, 0xf06030);
  // Blast glow behind
  g.fillStyle(0xffd066, 0.85); g.fillCircle(152, 100, 84);
  g.fillStyle(0xfff0b0, 0.85); g.fillCircle(152, 100, 56);

  // Ground haze so the sprite has something to stand against
  g.fillStyle(0x8c1810, 1); g.fillRect(0, 168, 426, 72);
  g.fillStyle(0xa82414, 1); g.fillRect(0, 168, 426, 6);
  g.generateTexture("sb-rocketaxe", 426, 240);
  g.destroy();
}

// PANEL 2 — The introduction of Blubert
function buildBlubertPanel(scn) {
  if (scn.textures.exists("sb-blubert")) return;
  const g = scn.make.graphics({ x: 0, y: 0, add: false });
  sbSpeedLines(g, 0, 0, 426, 240, 0x2a4ea8, 0x3f68c8);
  g.fillStyle(0x89b6ff, 0.5); g.fillCircle(288, 88, 74);

  g.fillStyle(0x16306e, 1); g.fillRect(0, 168, 426, 72);
  g.fillStyle(0x1d3f8c, 1); g.fillRect(0, 168, 426, 6);
  g.generateTexture("sb-blubert", 426, 240);
  g.destroy();
}

// Place one of the game's real sprite frames at poster scale.
// Nearest-neighbour keeps the artist's pixels readable when blown up.
function sbSprite(scn, key, frame, x, y, scale, flip) {
  const tex = scn.textures.get(key);
  if (tex && tex.setFilter) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  const img = frame ? scn.add.image(x, y, key, frame) : scn.add.image(x, y, key);
  img.setScale(scale);
  if (flip) img.setFlipX(true);
  return img;
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
