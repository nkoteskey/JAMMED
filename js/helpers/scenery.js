// Foreground depth + ambient weather.
//
// Level 1 (the hand-authored reference) reads richer than the newer
// stages largely because it has a ForegroundLayer: things that pass
// IN FRONT of the player. Parallax behind you is scenery; parallax in
// front of you is depth. These helpers give every stage both, plus
// the airborne particulate that sells an environment as a place.

// Registers a prop and remembers it so it can fade when the player
// walks behind it — without this, a near-plane silhouette parked over
// the play lane simply hides Jammy.
function _fgAdd(scn, img) {
  scn._fgProps = scn._fgProps || [];
  img._fgBaseAlpha = img.alpha;
  scn._fgProps.push(img);
  return img;
}

// Call once per frame from a scene's update().
function updateForegroundProps(scn, jammy) {
  if (!scn._fgProps || !jammy || !jammy.sprite) return;
  const cam = scn.cameras.main;
  const jx = jammy.sprite.x, jy = jammy.sprite.y;
  for (const p of scn._fgProps) {
    // Prop screen x accounting for its own scroll factor
    const px = p.x - cam.scrollX * p.scrollFactorX + cam.scrollX;
    const near = Math.abs(px - jx) < 34 && Math.abs(p.y + p.displayHeight / 2 - jy) < 190;
    const want = near ? p._fgBaseAlpha * 0.28 : p._fgBaseAlpha;
    p.alpha += (want - p.alpha) * 0.18;
  }
}

function _fgTex(scn, key, draw, w, h) {
  if (scn.textures.exists(key)) return;
  const g = scn.make.graphics({ x: 0, y: 0, add: false });
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

// Props drawn at scrollFactor > 1 so they slide past faster than the
// world — the classic NES "you are inside this place" trick.
function addForegroundProps(scn, kind, opts = {}) {
  const w = scn.map ? scn.map.widthInPixels : 3000;
  const depth = opts.depth !== undefined ? opts.depth : 120;
  const sf = opts.scrollFactor || 1.22;
  const step = opts.step || 340;
  const yBase = opts.y !== undefined ? opts.y : 240;

  if (kind === "works") {
    // Foundry: hanging chain clusters and a dripping pipe elbow
    _fgTex(scn, "fg-chain", (g) => {
      g.fillStyle(0x1a0e22, 1);
      for (let y = 0; y < 90; y += 7) { g.fillRect(2, y, 4, 5); g.fillRect(0, y + 3, 8, 3); }
      g.fillStyle(0x32204a, 1);
      for (let y = 0; y < 90; y += 7) g.fillRect(3, y, 1, 5);
    }, 8, 90);
    _fgTex(scn, "fg-pipe", (g) => {
      g.fillStyle(0x1a0e22, 1); g.fillRect(0, 0, 54, 14);
      g.fillStyle(0x2a1838, 1); g.fillRect(0, 2, 54, 8);
      g.fillStyle(0x140820, 1); g.fillRect(14, 0, 6, 14); g.fillRect(38, 0, 6, 14);
      g.fillStyle(0xc23a66, 1); g.fillRect(24, 12, 3, 6);
    }, 54, 18);
    for (let x = 180; x < w; x += step) {
      const kind2 = (x / step) % 2 < 1;
      if (kind2) _fgAdd(scn, scn.add.image(x, 30, "fg-chain").setOrigin(0.5, 0).setScrollFactor(sf, 1).setDepth(depth));
      else _fgAdd(scn, scn.add.image(x, 22, "fg-pipe").setScrollFactor(sf, 1).setDepth(depth));
    }
  }

  if (kind === "orchard") {
    // Plantation: irrigation standpipes and low crate stacks up close
    _fgTex(scn, "fg-standpipe", (g) => {
      g.fillStyle(0x08201c, 1); g.fillRect(4, 0, 10, 70);
      g.fillStyle(0x0f342e, 1); g.fillRect(6, 0, 4, 70);
      g.fillStyle(0x08201c, 1); g.fillRect(0, 10, 18, 7); g.fillRect(0, 48, 18, 7);
      g.fillStyle(0x1d8a82, 0.6); g.fillRect(8, 66, 3, 5);
    }, 18, 74);
    _fgTex(scn, "fg-crates", (g) => {
      g.fillStyle(0x0d2a22, 1);
      g.fillRect(0, 12, 26, 22); g.fillRect(26, 20, 22, 14);
      g.fillStyle(0x143d32, 1);
      g.fillRect(2, 14, 22, 18); g.fillRect(28, 22, 18, 10);
      g.fillStyle(0x08201c, 1);
      g.fillRect(2, 22, 22, 2); g.fillRect(12, 14, 2, 18);
    }, 48, 34);
    for (let x = 220; x < w; x += step) {
      if ((x / step) % 2 < 1) _fgAdd(scn, scn.add.image(x, yBase - 74, "fg-standpipe").setOrigin(0.5, 0).setScrollFactor(sf, 1).setDepth(depth));
      else _fgAdd(scn, scn.add.image(x, yBase - 6, "fg-crates").setOrigin(0.5, 1).setScrollFactor(sf, 1).setDepth(depth));
    }
  }

  if (kind === "mesa") {
    // Desert: near-side cactus and rock silhouettes, warm-dark
    _fgTex(scn, "fg-cactus", (g) => {
      g.fillStyle(0x3a1f33, 1);
      g.fillRect(10, 0, 10, 64);
      g.fillRect(2, 18, 8, 6); g.fillRect(2, 8, 6, 14);
      g.fillRect(20, 28, 8, 6); g.fillRect(22, 16, 6, 16);
    }, 30, 64);
    _fgTex(scn, "fg-rocks", (g) => {
      g.fillStyle(0x3a1f33, 1);
      g.fillRect(0, 14, 30, 18); g.fillRect(24, 8, 22, 24); g.fillRect(40, 18, 20, 14);
    }, 60, 32);
    for (let x = 260; x < w; x += step) {
      if ((x / step) % 2 < 1) _fgAdd(scn, scn.add.image(x, yBase - 4, "fg-cactus").setOrigin(0.5, 1).setScrollFactor(sf, 1).setDepth(depth));
      else _fgAdd(scn, scn.add.image(x, yBase - 2, "fg-rocks").setOrigin(0.5, 1).setScrollFactor(sf, 1).setDepth(depth));
    }
  }

  if (kind === "archive") {
    // Vault: the near edge of shelving units sliding past
    _fgTex(scn, "fg-shelfedge", (g) => {
      g.fillStyle(0x0a1418, 1); g.fillRect(0, 0, 14, 150);
      g.fillStyle(0x12242c, 1); g.fillRect(2, 0, 10, 150);
      g.fillStyle(0x0a1418, 1);
      for (let y = 8; y < 150; y += 34) g.fillRect(0, y, 14, 5);
    }, 14, 150);
    for (let x = 240; x < w; x += step * 0.7) {
      _fgAdd(scn, scn.add.image(x, 30, "fg-shelfedge").setOrigin(0.5, 0).setScrollFactor(sf, 1).setDepth(depth));
    }
  }

  if (kind === "cold") {
    // Cold room: frost-caked uprights and hanging plastic strip curtains
    _fgTex(scn, "fg-frostpost", (g) => {
      g.fillStyle(0x071620, 1); g.fillRect(0, 0, 12, 150);
      g.fillStyle(0x0e2a38, 1); g.fillRect(2, 0, 8, 150);
      g.fillStyle(0xbfe8f8, 0.35);
      g.fillRect(1, 20, 3, 18); g.fillRect(8, 70, 3, 22); g.fillRect(2, 118, 3, 14);
    }, 12, 150);
    _fgTex(scn, "fg-curtain", (g) => {
      for (let i = 0; i < 7; i++) {
        g.fillStyle(0xbfe8f8, 0.13 + (i % 2) * 0.05);
        g.fillRect(i * 8, 0, 6, 64);
      }
    }, 56, 64);
    for (let x = 300; x < w; x += step) {
      if ((x / step) % 2 < 1) _fgAdd(scn, scn.add.image(x, 28, "fg-frostpost").setOrigin(0.5, 0).setScrollFactor(sf, 1).setDepth(depth));
      else _fgAdd(scn, scn.add.image(x, 24, "fg-curtain").setOrigin(0.5, 0).setScrollFactor(sf * 0.92, 1).setDepth(depth));
    }
  }

  if (kind === "beach") {
    _fgTex(scn, "fg-palm", (g) => {
      g.fillStyle(0x4a3018, 1); g.fillRect(14, 28, 8, 82);
      g.fillStyle(0x2f6f2a, 1);
      [[0,18],[8,4],[22,0],[34,8],[30,24]].forEach(([px,py]) => {
        g.fillEllipse(px + 6, py + 10, 26, 12);
      });
      g.fillStyle(0xc9a227, 1);
      g.fillRect(16, 26, 4, 4); g.fillRect(21, 29, 4, 4);
    }, 44, 110);
    _fgTex(scn, "fg-chair", (g) => {
      g.fillStyle(0x1f5f7a, 1);
      g.fillRect(0, 14, 34, 6);
      g.fillRect(24, 0, 6, 18);
      g.fillStyle(0xffffff, 1);
      g.fillRect(2, 15, 6, 4); g.fillRect(14, 15, 6, 4);
      g.fillStyle(0x8a5f30, 1);
      g.fillRect(2, 20, 3, 8); g.fillRect(28, 18, 3, 10);
    }, 34, 28);
    for (let x = 240; x < w; x += step) {
      if ((x / step) % 2 < 1) _fgAdd(scn, scn.add.image(x, yBase - 2, "fg-palm").setOrigin(0.5, 1).setScrollFactor(sf, 1).setDepth(depth));
      else _fgAdd(scn, scn.add.image(x, yBase - 2, "fg-chair").setOrigin(0.5, 1).setScrollFactor(sf, 1).setDepth(depth));
    }
  }

  if (kind === "mound") {
    // Nest: root buttresses and earth arches framing the tunnel
    _fgTex(scn, "fg-root", (g) => {
      g.fillStyle(0x140b05, 1);
      g.fillRect(6, 0, 12, 120);
      g.fillRect(0, 26, 10, 10); g.fillRect(16, 60, 12, 9);
      g.fillStyle(0x24150b, 1);
      g.fillRect(8, 0, 6, 120);
    }, 28, 120);
    for (let x = 260; x < w; x += step) {
      _fgAdd(scn, scn.add.image(x, 22, "fg-root").setOrigin(0.5, 0).setScrollFactor(sf, 1).setDepth(depth));
    }
  }
}

// Airborne particulate. Emits within the camera view only, so a long
// stage costs the same as a short one.
function addAmbientWeather(scn, kind) {
  const cam = () => scn.cameras.main;
  const spawn = (cfg) => {
    scn.time.addEvent({
      delay: cfg.delay, loop: true,
      callback: () => {
        const c = cam();
        const x = c.scrollX + Math.random() * 440 - 8;
        const o = cfg.make(x);
        if (!o) return;
        scn.tweens.add(Object.assign({ targets: o }, cfg.tween(o, x),
          { onComplete: () => o.destroy() }));
      },
    });
  };

  if (kind === "works") {
    // Cinders rising off the vats
    spawn({
      delay: 260,
      make: (x) => scn.add.rectangle(x, 232, 2, 2,
        Math.random() < 0.5 ? 0xff7a22 : 0xffd066, 0.8).setDepth(72),
      tween: (o, x) => ({ y: 30 + Math.random() * 90, x: x + (Math.random() * 50 - 25),
        alpha: 0, duration: 2600 + Math.random() * 1600 }),
    });
  }
  if (kind === "mesa") {
    // Wind-blown sand streaking low and fast
    spawn({
      delay: 190,
      make: (x) => scn.add.rectangle(x - 30, 120 + Math.random() * 90, 5, 1, 0xf0d49a, 0.5)
        .setDepth(72),
      tween: (o) => ({ x: o.x + 260 + Math.random() * 160, alpha: 0,
        duration: 1300 + Math.random() * 700 }),
    });
  }
  if (kind === "orchard") {
    // Drip mist blowing off the canals
    spawn({
      delay: 240,
      make: (x) => scn.add.circle(x, 200 + Math.random() * 30, 1.5, 0x7fe8e0, 0.45).setDepth(72),
      tween: (o, x) => ({ y: 90 + Math.random() * 60, x: x + (Math.random() * 70 - 20),
        alpha: 0, scale: 2, duration: 3200 + Math.random() * 1400 }),
    });
  }
  if (kind === "archive") {
    // Dust in the cold light — the only thing moving in the room
    spawn({
      delay: 420,
      make: (x) => scn.add.rectangle(x, Math.random() * 200, 1, 1, 0xd8e8f0, 0.4).setDepth(72),
      tween: (o, x) => ({ y: o.y + 60, x: x + (Math.random() * 24 - 12),
        alpha: 0, duration: 4200 + Math.random() * 2000 }),
    });
  }
  if (kind === "spire") {
    // Broadcast static sleeting through the shaft
    spawn({
      delay: 130,
      make: (x) => scn.add.rectangle(x, cam().scrollY - 6, 1, 3 + Math.random() * 4,
        0x7fe8e0, 0.32).setDepth(72),
      tween: (o) => ({ y: o.y + 300, alpha: 0, duration: 900 + Math.random() * 500 }),
    });
  }
}
