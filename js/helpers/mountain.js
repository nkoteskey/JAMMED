// Shared kit for the Berry Mountains stages (World 2): the runtime
// tileset, the grid/layer builders every mountain stage lays itself out
// with, the night-sky parallax and snowfall, and the stage hazards that
// 2-2 and 2-3 add on top of 2-1's ice: crumbling ledges, wind gusts,
// jam geysers and the lantern darkness of the mines.

const MountainTiles = {
  E: -1,
  SNOW: 1,
  ROCK: 2,
  ICE: 3,
  CAVE: 4,
  LAKE: 5,
  DEEP: 6,
  WOOD: 7,
  CRACK: 8, // cracked ice: a crumble ledge's resting look (decor only)
  TIMBER: 9, // mine timber
  JAMROCK: 10, // mine rock veined with jam
  JAM: 11, // hot jam pool (death)

  ensureTexture(scn) {
    if (scn.textures.exists("mountain-tiles")) return;
    const g = scn.make.graphics({ x: 0, y: 0, add: false });
    const o = (i) => i * 16;
    // 1 snow top
    g.fillStyle(0xe8f4ff, 1);
    g.fillRect(o(1), 0, 16, 16);
    g.fillStyle(0xffffff, 1);
    g.fillRect(o(1), 0, 16, 4);
    g.fillRect(o(1) + 3, 4, 4, 1);
    g.fillRect(o(1) + 10, 5, 3, 1);
    g.fillStyle(0xc8dcf0, 1);
    g.fillRect(o(1) + 6, 10, 5, 1);
    g.fillRect(o(1) + 1, 13, 3, 1);
    // 2 packed snow / rock body
    g.fillStyle(0x4a5a80, 1);
    g.fillRect(o(2), 0, 16, 16);
    g.fillStyle(0x5a6c96, 1);
    g.fillRect(o(2) + 2, 3, 6, 5);
    g.fillRect(o(2) + 9, 9, 5, 4);
    g.fillStyle(0x384668, 1);
    g.fillRect(o(2), 15, 16, 1);
    g.fillRect(o(2) + 8, 2, 1, 6);
    // 3 ice (slippery) — glassy blue with shine
    g.fillStyle(0x8ed8f8, 1);
    g.fillRect(o(3), 0, 16, 16);
    g.fillStyle(0xd8f4ff, 1);
    g.fillRect(o(3), 0, 16, 2);
    g.fillRect(o(3) + 2, 4, 6, 1);
    g.fillRect(o(3) + 10, 8, 4, 1);
    g.fillStyle(0x5ab0e0, 1);
    g.fillRect(o(3) + 4, 11, 8, 1);
    g.fillRect(o(3), 14, 16, 2);
    // 4 cave rock (dark)
    g.fillStyle(0x2a3450, 1);
    g.fillRect(o(4), 0, 16, 16);
    g.fillStyle(0x384668, 1);
    g.fillRect(o(4) + 1, 2, 7, 6);
    g.fillRect(o(4) + 9, 8, 6, 5);
    g.fillStyle(0x1c2438, 1);
    g.fillRect(o(4), 15, 16, 1);
    // 5 frozen lake surface (death — thin ice)
    g.fillStyle(0x3a6ab0, 1);
    g.fillRect(o(5), 0, 16, 16);
    g.fillStyle(0x8ed8f8, 0.7);
    g.fillRect(o(5), 0, 16, 3);
    g.fillRect(o(5) + 3, 6, 5, 1);
    g.fillRect(o(5) + 10, 10, 4, 1);
    // 6 deep water
    g.fillStyle(0x24488a, 1);
    g.fillRect(o(6), 0, 16, 16);
    g.fillStyle(0x3a6ab0, 1);
    g.fillRect(o(6) + 4, 5, 4, 2);
    g.fillRect(o(6) + 11, 11, 3, 2);
    // 7 lodge wood
    g.fillStyle(0x6a4a30, 1);
    g.fillRect(o(7), 0, 16, 16);
    g.fillStyle(0x8c6440, 1);
    g.fillRect(o(7), 1, 16, 6);
    g.fillRect(o(7), 9, 16, 6);
    g.fillStyle(0x4a3220, 1);
    g.fillRect(o(7), 7, 16, 2);
    g.fillRect(o(7), 15, 16, 1);
    // 8 cracked ice
    g.fillStyle(0xa8e0f8, 1);
    g.fillRect(o(8), 0, 16, 16);
    g.fillStyle(0xd8f4ff, 1);
    g.fillRect(o(8), 0, 16, 2);
    g.fillStyle(0x3a6ab0, 1);
    g.fillRect(o(8) + 2, 3, 1, 5);
    g.fillRect(o(8) + 3, 7, 4, 1);
    g.fillRect(o(8) + 9, 5, 1, 6);
    g.fillRect(o(8) + 10, 10, 4, 1);
    g.fillRect(o(8) + 6, 12, 1, 3);
    // 9 mine timber
    g.fillStyle(0x5a3a1e, 1);
    g.fillRect(o(9), 0, 16, 16);
    g.fillStyle(0x7a5230, 1);
    g.fillRect(o(9), 2, 16, 4);
    g.fillRect(o(9), 10, 16, 4);
    g.fillStyle(0x3a2412, 1);
    g.fillRect(o(9), 7, 16, 1);
    g.fillRect(o(9), 15, 16, 1);
    g.fillStyle(0xc0b090, 1);
    g.fillRect(o(9) + 2, 3, 2, 2);
    g.fillRect(o(9) + 12, 11, 2, 2);
    // 10 mine rock veined with jam
    g.fillStyle(0x3a2c48, 1);
    g.fillRect(o(10), 0, 16, 16);
    g.fillStyle(0x4c3a60, 1);
    g.fillRect(o(10) + 1, 2, 6, 5);
    g.fillRect(o(10) + 9, 9, 6, 4);
    g.fillStyle(0xb0306a, 1);
    g.fillRect(o(10) + 3, 8, 7, 1);
    g.fillRect(o(10) + 9, 3, 1, 5);
    g.fillRect(o(10) + 12, 12, 3, 1);
    g.fillStyle(0x2a1c38, 1);
    g.fillRect(o(10), 15, 16, 1);
    // 11 hot jam pool
    g.fillStyle(0xc23a66, 1);
    g.fillRect(o(11), 0, 16, 16);
    g.fillStyle(0xe85a88, 1);
    g.fillRect(o(11), 0, 16, 3);
    g.fillRect(o(11) + 2, 6, 3, 2);
    g.fillRect(o(11) + 10, 9, 4, 2);
    g.fillStyle(0x8a1c44, 1);
    g.fillRect(o(11) + 6, 12, 5, 1);
    g.generateTexture("mountain-tiles", 12 * 16, 16);
    g.destroy();
  },

  // Empty grids plus the little painters every layout is written with.
  grids(W, H) {
    const T = MountainTiles;
    const grid = () => Array.from({ length: H }, () => Array(W).fill(T.E));
    const ground = grid(), death = grid(), stops = grid(), change = grid();
    const fill = (g, c0, r0, c1, r1, t) => {
      for (let r = r0; r <= r1; r++) {
        if (r < 0 || r >= H) continue;
        for (let c = c0; c <= c1; c++) if (c >= 0 && c < W) g[r][c] = t;
      }
    };
    // Solid ground from `top` down to the bottom row, with the given cap
    const floorWith = (cap, body) => (c0, c1, top = H - 3) => {
      fill(ground, c0, top, c1, top, cap);
      fill(ground, c0, top + 1, c1, H - 1, body);
    };
    return {
      W,
      H,
      ground,
      death,
      stops,
      change,
      fill,
      floor: floorWith(T.SNOW, T.ROCK),
      ice: floorWith(T.ICE, T.ROCK),
      mineFloor: floorWith(T.TIMBER, T.JAMROCK),
      // A pit filled with something deadly (lake or jam) whose surface
      // sits at `surfaceRow`. Clears the floor cap above it too, so a
      // pit cut into a finished floor is actually open.
      pit: (c0, c1, surface, surfaceRow = H - 2) => {
        fill(ground, c0, surfaceRow - 1, c1, H - 1, T.E);
        fill(death, c0, surfaceRow, c1, surfaceRow, surface);
        fill(death, c0, surfaceRow + 1, c1, H - 1, surface === T.LAKE ? T.DEEP : surface);
      },
    };
  },

  // Turn the grids into the scene's tile layers (ground, death, enemy
  // stops, scene change) and remember the ice tile for Jammy's skid.
  makeLayers(scn, g) {
    const T = MountainTiles;
    MountainTiles.ensureTexture(scn);
    const mk = (data) => {
      const map = scn.make.tilemap({ data, tileWidth: 16, tileHeight: 16 });
      const tiles = map.addTilesetImage("mountain-tiles");
      return { map, layer: map.createLayer(0, tiles, 0, 0) };
    };
    const gr = mk(g.ground);
    scn.map = gr.map;
    scn.groundLayer = gr.layer;
    scn.groundLayer.setCollision([T.SNOW, T.ROCK, T.ICE, T.CAVE, T.WOOD, T.CRACK, T.TIMBER, T.JAMROCK]);
    const d = mk(g.death);
    scn.deathBlocksLayer = d.layer;
    scn.deathBlocksLayer.setDepth(3);
    scn.deathBlocksLayer.setCollision([T.LAKE, T.DEEP, T.JAM]);
    const s = mk(g.stops);
    scn.enemyStopBlocksLayer = s.layer;
    scn.enemyStopBlocksLayer.setAlpha(0);
    scn.enemyStopBlocksLayer.setCollision([T.ROCK]);
    const c = mk(g.change);
    scn.sceneChangeLayer = c.layer;
    scn.sceneChangeLayer.setAlpha(0);
    scn.sceneChangeLayer.setCollision([T.ROCK]);
    scn.ICE = T.ICE;
  },

  // Jammy asks the stage every frame whether his feet are on ice.
  isIceAt(scn, x, y) {
    const t = scn.groundLayer.getTileAtWorldXY(x, y);
    return !!(t && t.index === MountainTiles.ICE);
  },

  // Night sky, moon, far peaks and near pines on parallax.
  paintNightSky(scn, opts = {}) {
    const w = scn.map.widthInPixels;
    const bands = opts.bands || [
      [-240, 40, 0x0c1430],
      [40, 110, 0x1a2a5a],
      [110, 170, 0x2a4078],
      [170, 240, 0x3a5a98],
    ];
    const top = opts.skyTop === undefined ? -240 : opts.skyTop;
    const bottom = opts.skyBottom === undefined ? 240 : opts.skyBottom;
    bands.forEach(([y0, y1, c]) => {
      scn.add.rectangle(213, (y0 + y1) / 2, 426, y1 - y0, c).setScrollFactor(0).setDepth(-40);
    });
    if (bottom > 240) scn.add.rectangle(213, (240 + bottom) / 2, 426, bottom - 240, bands[bands.length - 1][2]).setScrollFactor(0).setDepth(-40);
    if (top < -240) scn.add.rectangle(213, (top - 240) / 2, 426, -240 - top, bands[0][2]).setScrollFactor(0).setDepth(-40);
    for (let i = 0; i < 40; i++) {
      const x = (i * 97) % 426, y = (i * 53) % 100;
      scn.add.rectangle(x, y, 1, 1, 0xffffff, 0.8).setScrollFactor(0).setDepth(-39);
    }
    scn.add.circle(340, 46, 18, 0xeef4ff).setScrollFactor(0.05, 1).setDepth(-38);
    scn.add.circle(346, 42, 15, bands[1][2]).setScrollFactor(0.05, 1).setDepth(-38);
    const base = opts.horizon || 180;
    for (let x = -100; x < w + 400; x += 160) {
      const h = 70 + ((x / 160) % 3) * 30;
      scn.add.triangle(x, base, 0, 0, 90, -h, 180, 0, 0x2a3860).setScrollFactor(0.15, 1).setDepth(-36);
      scn.add.triangle(x + 62, base - h + 2, 0, 0, 28, -22, 56, 0, 0xe8f4ff).setScrollFactor(0.15, 1).setDepth(-35);
    }
    if (opts.pines !== false) {
      for (let x = 20; x < w + 300; x += 90) {
        const h = 40 + ((x / 90) % 4) * 10;
        scn.add.triangle(x, base + 12, 0, 0, 14, -h, 28, 0, 0x16304a).setScrollFactor(0.4, 1).setDepth(-30);
        scn.add.triangle(x, base + 12 - h * 0.45, 0, 0, 14, -h * 0.6, 28, 0, 0x1e4060).setScrollFactor(0.4, 1).setDepth(-30);
        scn.add.rectangle(x + 14, base + 10, 4, 8, 0x3a2818).setScrollFactor(0.4, 1).setDepth(-30);
      }
    }
  },

  snowfall(scn, opts = {}) {
    const drift = opts.drift || 30;
    scn.time.addEvent({
      delay: opts.delay || 120,
      loop: true,
      callback: () => {
        const cam = scn.cameras.main;
        const f = scn.add
          .rectangle(cam.scrollX + Phaser.Math.Between(0, 426), cam.scrollY - 4, 2, 2, 0xffffff, 0.8)
          .setDepth(150);
        scn.tweens.add({
          targets: f,
          y: f.y + 260,
          x: f.x + Phaser.Math.Between(-drift, drift) + (opts.wind || 0),
          alpha: 0.2,
          duration: 2600 + Math.random() * 1200,
          onComplete: () => f.destroy(),
        });
      },
    });
  },

  // Stage title card, three lines, fades after two seconds
  titleCard(scn, label, name, hint) {
    const mk = (y, txt, size, tint) =>
      scn.add.bitmapText(213, y, "tempFont", txt, size).setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(tint);
    const items = [mk(92, label, 16, 0xffffff), mk(114, name, 12, 0x9ad8ff), mk(132, hint, 8, 0xffffff)];
    scn.tweens.add({ targets: items, alpha: 0, delay: 2000, duration: 600, onComplete: () => items.forEach((t) => t.destroy()) });
  },
};

// A ledge of cracked ice. Stand on it and it shivers, then drops away;
// it grows back a few seconds later. One-way, so you can jump up
// through it. `w` is in tiles.
class CrumbleLedge extends Phaser.GameObjects.TileSprite {
  static ensureTexture(scn) {
    if (scn.textures.exists("cracked-ice")) return;
    const g = scn.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xa8e0f8, 1);
    g.fillRect(0, 0, 16, 16);
    g.fillStyle(0xd8f4ff, 1);
    g.fillRect(0, 0, 16, 2);
    g.fillStyle(0x3a6ab0, 1);
    g.fillRect(2, 3, 1, 5);
    g.fillRect(3, 7, 4, 1);
    g.fillRect(9, 5, 1, 6);
    g.fillRect(10, 10, 4, 1);
    g.fillRect(6, 12, 1, 3);
    g.fillStyle(0x5ab0e0, 1);
    g.fillRect(0, 14, 16, 2);
    g.generateTexture("cracked-ice", 16, 16);
    g.destroy();
  }

  constructor(scn, x, y, w = 2) {
    CrumbleLedge.ensureTexture(scn);
    super(scn, x, y, w * 16, 16, "cracked-ice");
    scn.add.existing(this);
    scn.physics.add.existing(this);
    this.setDepth(54);
    this.homeX = x;
    this.homeY = y;
    this.state = "solid";
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.setSize(w * 16, 10);
    this.body.setOffset(0, 0);
    this.body.checkCollision.down = false;
    this.body.checkCollision.left = false;
    this.body.checkCollision.right = false;
    scn.physics.add.collider(scn.jammy.sprite, this, () => this._stepped());
    if (!scn.crumbleLedges) scn.crumbleLedges = [];
    scn.crumbleLedges.push(this);
  }

  _stepped() {
    if (this.state !== "solid") return;
    const jb = this.scene.jammy.sprite.body;
    if (!jb.touching.down || jb.bottom > this.body.top + 6) return;
    this.state = "shiver";
    this.scene.sound.play("enemyHitSound", { volume: 0.25, rate: 2.4 });
    this.scene.tweens.add({
      targets: this,
      x: { from: this.homeX - 1, to: this.homeX + 1 },
      duration: 40,
      yoyo: true,
      repeat: 10,
      onComplete: () => this._fall(),
    });
  }

  _fall() {
    if (this.state !== "shiver") return;
    this.state = "falling";
    this.x = this.homeX;
    this.body.checkCollision.up = false;
    this.body.setAllowGravity(true);
    this.body.setImmovable(false);
    this.body.setVelocityY(40);
    for (let i = 0; i < 4; i++) {
      const c = this.scene.add.rectangle(this.x + Phaser.Math.Between(-12, 12), this.y, 2, 3, 0xd8f4ff).setDepth(80);
      this.scene.tweens.add({ targets: c, y: c.y + 30, alpha: 0, duration: 400, onComplete: () => c.destroy() });
    }
    this.scene.tweens.add({ targets: this, alpha: 0, duration: 700, delay: 200 });
    this.scene.time.delayedCall(3200, () => this._regrow());
  }

  _regrow() {
    if (!this.scene || !this.body) return;
    this.body.setAllowGravity(false);
    this.body.setVelocity(0, 0);
    this.body.setImmovable(true);
    this.setPosition(this.homeX, this.homeY);
    this.body.reset(this.homeX, this.homeY);
    this.body.checkCollision.up = true;
    this.setAlpha(0);
    this.state = "regrow";
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 500,
      onComplete: () => {
        this.state = "solid";
      },
    });
  }
}

// A gust corridor: while Jammy is inside it the wind carries him along
// `dir`: `strength` px/s in the air (nearly his own walking speed, so a
// headwind jump falls short and a tailwind overshoots), less on the
// ground, more on ice. The stage zeroes jammy.windPush, runs the zones,
// then Jammy's walk code adds the push on top of his own speed.
class WindZone {
  constructor(scn, x0, y0, x1, y1, dir = 1, strength = 100) {
    this.scene = scn;
    this.rect = new Phaser.Geom.Rectangle(x0, y0, x1 - x0, y1 - y0);
    this.dir = dir;
    this.strength = strength;
    this.nextStreak = 0;
    if (!scn.windZones) scn.windZones = [];
    scn.windZones.push(this);
  }

  update() {
    const s = this.scene;
    const now = s.time.now;
    const cam = s.cameras.main;
    const onScreen = Phaser.Geom.Rectangle.Overlaps(this.rect, cam.worldView);
    if (onScreen && now >= this.nextStreak) {
      this.nextStreak = now + 70;
      const y = Phaser.Math.Between(this.rect.top, this.rect.bottom);
      const x = this.dir > 0 ? this.rect.left : this.rect.right;
      const st = s.add.rectangle(x, y, 12, 1, 0xd8f4ff, 0.55).setDepth(52);
      s.tweens.add({ targets: st, x: x + this.dir * this.rect.width, alpha: 0, duration: 500, onComplete: () => st.destroy() });
    }
    const j = s.jammy;
    if (!j || !j.alive || !j.sprite.body) return;
    const b = j.sprite.body;
    if (!Phaser.Geom.Rectangle.Contains(this.rect, j.sprite.x, j.sprite.y)) return;
    const grounded = b.blocked.down || b.touching.down;
    const push = this.strength * (grounded ? (j.onIce ? 0.7 : 0.3) : 1);
    j.windPush = (j.windPush || 0) + this.dir * push;
  }
}

// A column of hot jam that erupts from a pool on a rhythm: bubbles warn,
// the column shoots up and hurts, then sinks. Not shootable.
class JamGeyser extends Phaser.Physics.Arcade.Sprite {
  static ensureTexture(scn) {
    if (scn.textures.exists("jam-column")) return;
    const g = scn.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xc23a66, 1);
    g.fillRect(2, 6, 12, 58);
    g.fillStyle(0xe85a88, 1);
    g.fillRect(4, 0, 8, 8);
    g.fillRect(4, 10, 2, 40);
    g.fillStyle(0xff9ab8, 1);
    g.fillRect(6, 2, 3, 3);
    g.fillRect(9, 20, 2, 12);
    g.generateTexture("jam-column", 16, 64);
    g.destroy();
  }

  constructor(scn, x, surfaceY, opts = {}) {
    JamGeyser.ensureTexture(scn);
    super(scn, x, surfaceY, "jam-column");
    scn.add.existing(this);
    scn.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setDepth(58);
    this.surfaceY = surfaceY;
    this.height64 = 64;
    this.period = opts.period || 2800;
    this.phase = opts.phase || 0;
    this.upMs = opts.upMs || 900;
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.setSize(10, 60);
    this.body.setOffset(3, 2);
    this.body.setEnable(false);
    this.setScale(1, 0.02);
    this.nextAt = null;
    this.state = "down";
    scn.physics.add.overlap(scn.jammy.sprite, this, () => {
      if (this.state === "up" && this.scene.jammy.alive) this.scene.jammy.takeDamage(this.x);
    });
    if (!scn.geysers) scn.geysers = [];
    scn.geysers.push(this);
  }

  update() {
    if (!this.active || !this.scene) return;
    const s = this.scene;
    const now = s.time.now;
    if (this.nextAt === null) this.nextAt = now + 600 + this.phase;
    if (this.state === "down" && now >= this.nextAt) {
      this.state = "warn";
      for (let i = 0; i < 5; i++) {
        s.time.delayedCall(i * 90, () => {
          if (!this.active) return;
          const b = s.add.circle(this.x + Phaser.Math.Between(-6, 6), this.surfaceY - 2, 2, 0xe85a88, 0.9).setDepth(57);
          s.tweens.add({ targets: b, y: b.y - 10, alpha: 0, duration: 300, onComplete: () => b.destroy() });
        });
      }
      s.time.delayedCall(480, () => this._erupt());
    }
  }

  _erupt() {
    if (!this.active) return;
    const s = this.scene;
    this.state = "up";
    this.body.setEnable(true);
    const cam = s.cameras.main;
    if (Math.abs(this.x - (cam.scrollX + 213)) < 300) s.sound.play("laserSound", { volume: 0.3, rate: 0.5 });
    s.tweens.add({
      targets: this,
      scaleY: 1,
      duration: 140,
      ease: "Quad.easeOut",
      onComplete: () => {
        s.time.delayedCall(this.upMs, () => {
          if (!this.active) return;
          this.state = "sink";
          this.body.setEnable(false);
          s.tweens.add({
            targets: this,
            scaleY: 0.02,
            duration: 380,
            ease: "Sine.easeIn",
            onComplete: () => {
              this.state = "down";
              this.nextAt = s.time.now + this.period;
            },
          });
        });
      },
    });
  }
}

// Lantern darkness for the mines: a big radial mask that follows Jammy
// so only the lamp's circle around him is lit. Depth sits under the HUD.
const MineLantern = {
  ensureTexture(scn, radius = 132) {
    const key = "lantern-mask";
    if (scn.textures.exists(key)) return key;
    const size = 1024;
    const tex = scn.textures.createCanvas(key, size, size);
    const ctx = tex.getContext();
    const grad = ctx.createRadialGradient(size / 2, size / 2, radius * 0.55, size / 2, size / 2, radius * 1.6);
    grad.addColorStop(0, "rgba(6,2,10,0)");
    grad.addColorStop(0.55, "rgba(6,2,10,0.55)");
    grad.addColorStop(1, "rgba(6,2,10,0.86)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    tex.refresh();
    return key;
  },

  attach(scn) {
    const key = MineLantern.ensureTexture(scn);
    const img = scn.add.image(0, 0, key).setDepth(140);
    img.setScrollFactor(1);
    scn.lanternMask = img;
    // A warm flicker on the lamp itself
    scn.tweens.add({ targets: img, alpha: 0.92, duration: 180, yoyo: true, repeat: -1 });
    return img;
  },

  update(scn) {
    if (!scn.lanternMask || !scn.jammy || !scn.jammy.sprite) return;
    scn.lanternMask.setPosition(scn.jammy.sprite.x, scn.jammy.sprite.y - 6);
  },
};
