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

// PANEL — Jammy gets his Rocket Axe.
// This one happens AFTER the Watermelon goes down: the band's guitar
// tech comes out the stage door with the old axe rebuilt, a booster
// bolted to the tail. The tech is a backlit silhouette in the doorway
// — no invented face to sit badly next to the artist's sprites.
function buildRocketAxePanel(scn) {
  if (scn.textures.exists("sb-rocketaxe")) return;
  const g = scn.make.graphics({ x: 0, y: 0, add: false });
  const GROUND = 168;
  sbSpeedLines(g, 0, 0, 426, 240, 0xd83018, 0xf06030);

  // Ground haze so the sprites have something to stand against
  g.fillStyle(0x8c1810, 1); g.fillRect(0, GROUND, 426, 240 - GROUND);
  g.fillStyle(0xa82414, 1); g.fillRect(0, GROUND, 426, 6);

  // --- Stage door, open, light spilling out
  g.fillStyle(0x3a0a06, 1); g.fillRect(292, 44, 122, GROUND - 44);
  g.fillStyle(0xffd9a0, 1); g.fillRect(300, 52, 106, GROUND - 52);
  g.fillStyle(0xfff2cf, 1); g.fillRect(300, 52, 106, 8);
  // light pooling out onto the ground
  g.fillStyle(0xffd9a0, 0.22);
  g.fillPoints([
    { x: 300, y: GROUND }, { x: 406, y: GROUND },
    { x: 426, y: 210 }, { x: 250, y: 210 },
  ], true);

  // --- The guitar tech, silhouetted in the doorway, cap turned
  // backwards, one arm out holding the axe toward Jammy.
  const fx = 352;
  g.fillStyle(0x140806, 1);
  g.fillRect(fx - 12, 128, 9, GROUND - 128);      // legs
  g.fillRect(fx + 3, 128, 9, GROUND - 128);
  g.fillRect(fx - 16, 94, 32, 38);                // torso
  g.fillRect(fx - 46, 100, 32, 9);                // arm, reaching left
  g.fillCircle(fx, 86, 11);                       // head
  g.fillRect(fx - 11, 74, 23, 7);                 // cap
  g.fillRect(fx + 9, 79, 13, 5);                  // brim, turned backwards
  g.fillRect(fx - 20, GROUND - 3, 40, 3);         // boots flat on the sill
  // road case at his feet
  g.fillRect(fx + 22, 142, 34, GROUND - 142);
  g.fillStyle(0x3a1a10, 1); g.fillRect(fx + 25, 145, 28, 6);
  // coiled cable on the floor
  g.lineStyle(3, 0x140806, 1);
  g.strokeEllipse(fx - 66, GROUND - 7, 40, 14);
  g.strokeEllipse(fx - 62, GROUND - 3, 30, 10);

  // Blast glow behind Jammy
  g.fillStyle(0xffd066, 0.85); g.fillCircle(152, 100, 84);
  g.fillStyle(0xfff0b0, 0.85); g.fillCircle(152, 100, 56);

  g.generateTexture("sb-rocketaxe", 426, 240);
  g.destroy();
}

// PANEL 2 — The introduction of Blubert.
// An alley, not a hero shot: brick, a dumpster, the beat-up box from
// the drawing, and trash on the ground. Blubert is found here hurt,
// so the staging has to read as "someone is down" — the scene lays
// him on the floor in his stunned frames, it does not hover him.
function buildBlubertPanel(scn) {
  if (scn.textures.exists("sb-blubert")) return;
  const g = scn.make.graphics({ x: 0, y: 0, add: false });
  const GROUND = 150;

  // Night alley wall
  g.fillStyle(0x121a30, 1); g.fillRect(0, 0, 426, GROUND);
  g.fillStyle(0x1a2542, 1);
  for (let y = 0; y < GROUND; y += 13) {
    for (let x = (y / 13) % 2 ? -16 : 0; x < 426; x += 36) {
      g.fillRect(x + 2, y + 2, 32, 9);
    }
  }
  // Fire escape shadow high on the wall
  g.fillStyle(0x0d1424, 1);
  g.fillRect(58, 0, 6, 62); g.fillRect(140, 0, 6, 48);
  for (let y = 10; y < 62; y += 12) g.fillRect(58, y, 88, 3);

  // Ground
  g.fillStyle(0x0c1220, 1); g.fillRect(0, GROUND, 426, 240 - GROUND);
  g.fillStyle(0x18223c, 1); g.fillRect(0, GROUND, 426, 4);

  // A single streetlamp pool, off to the left
  g.fillStyle(0xf2d08a, 0.07); g.fillCircle(150, GROUND, 130);
  g.fillStyle(0xf2d08a, 0.07); g.fillCircle(150, GROUND, 84);
  g.fillStyle(0xf2d08a, 0.06); g.fillCircle(150, GROUND, 46);

  // --- Dumpster, right
  const dx = 330, dy = GROUND;
  g.fillStyle(0x0a1018, 1);                       // ink
  g.fillRect(dx - 62, dy - 66, 124, 68);
  g.fillStyle(0x24503a, 1);                       // body
  g.fillRect(dx - 59, dy - 62, 118, 62);
  g.fillStyle(0x2f6a4c, 1);
  g.fillRect(dx - 59, dy - 62, 118, 8);
  g.fillStyle(0x1a3a2a, 1);                       // panel seams
  g.fillRect(dx - 30, dy - 54, 3, 54);
  g.fillRect(dx + 18, dy - 54, 3, 54);
  g.fillStyle(0x0a1018, 1);                       // lid, tipped open
  g.fillRect(dx - 66, dy - 78, 132, 14);
  g.fillStyle(0x2f6a4c, 1);
  g.fillRect(dx - 63, dy - 75, 126, 9);
  g.fillStyle(0x16281c, 1);                       // wheels
  g.fillCircle(dx - 42, dy + 2, 6); g.fillCircle(dx + 42, dy + 2, 6);
  // spilled trash beside it
  g.fillStyle(0x3a4256, 1);
  g.fillRect(dx - 84, dy - 12, 18, 12);
  g.fillRect(dx - 96, dy - 7, 14, 7);
  g.fillStyle(0x4a5468, 1);
  g.fillRect(dx - 82, dy - 10, 8, 4);

  // --- The beat-up box, tipped on its side, mouth facing left
  const bx = 246, by = GROUND;
  g.fillStyle(0x0a1018, 1);
  g.fillRect(bx - 34, by - 40, 74, 40);
  g.fillStyle(0x7a6040, 1);                       // near face
  g.fillRect(bx - 31, by - 37, 68, 37);
  g.fillStyle(0x8d7049, 1);
  g.fillRect(bx - 31, by - 37, 68, 5);
  g.fillStyle(0x5c472e, 1);                       // dark interior at the mouth
  g.fillRect(bx - 31, by - 31, 26, 31);
  // crushed corner + torn flap
  g.fillStyle(0x6a5336, 1);
  g.fillPoints([
    { x: bx + 14, y: by - 37 }, { x: bx + 37, y: by - 30 },
    { x: bx + 37, y: by - 37 },
  ], true);
  g.fillStyle(0x0a1018, 1);
  g.fillRect(bx - 6, by - 40, 4, 10);
  g.fillStyle(0x8d7049, 1);
  g.fillPoints([
    { x: bx - 32, y: by - 36 }, { x: bx - 48, y: by - 44 },
    { x: bx - 44, y: by - 33 },
  ], true);
  // tape
  g.fillStyle(0xb9a179, 1);
  g.fillRect(bx + 2, by - 37, 7, 37);

  // scattered debris on the ground
  g.fillStyle(0x263050, 1);
  [[96, 8], [118, 5], [190, 6], [286, 5], [72, 4]].forEach(([x, w]) =>
    g.fillRect(x, GROUND - w + 1, w * 2, w));

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
  const band = scn.add.rectangle(213, 204, 426, 72, 0x0d0a12, 0.9).setAlpha(0);
  const rule = scn.add.rectangle(213, 168, 426, 2, tint || 0xd8f878, 0.9).setAlpha(0);
  const shadow = scn.add.bitmapText(scn.cameras.main.centerX + 1, 177,
    "8-bit-mono", caption, 10)
    .setOrigin(0.5, 0).setMaxWidth(392).setTint(0x000000).setAlpha(0);
  const body = scn.add.bitmapText(scn.cameras.main.centerX, 176,
    "8-bit-mono", caption, 10)
    .setOrigin(0.5, 0).setMaxWidth(392).setTint(tint || 0xd8f878).setAlpha(0);

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
        const hint = scn.add.bitmapText(420, 8,
          "tempFont", "ANY BUTTON >", 8)
          .setOrigin(1, 0).setTintFill(0xffffff).setAlpha(0.85);
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
