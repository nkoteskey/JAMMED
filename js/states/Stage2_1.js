// Stage 2-1 — THE BERRY MOUNTAINS. World 2 opens in the snow: ice
// floors Jammy skids across, icicle caves, Snowberry turrets on the
// ledges, frostbitten Zomberries, and a frozen lake crossed on
// drifting ice floes. Everything drawn at runtime.
class Stage2_1 extends Phaser.Scene {
  constructor() {
    super({ key: "Stage2_1" });
  }

  preload() {
    scene = this;
  }

  create() {
    this._changing = false;
    this.sound.stopAll();
    this.sound.play("Level1MusicLoop", { loop: true, volume: 0.9 });
    this.cameras.main.setBackgroundColor("#1a2a5a");

    this._buildTilesetTexture();
    this._buildLevel();
    this._paintBackground();

    LevelCommon.createGroups(this);

    this.jammy = new Jammy(60, 150);
    this.jammy.sprite.setDepth(100);
    this.children.bringToTop(this.jammy.sprite);
    this.cameras.main.startFollow(this.jammy.sprite, true);
    this.cameras.main.setBounds(0, -240, this.map.widthInPixels, this.map.heightInPixels + 240);

    LevelCommon.wireCollisions(this, { onSceneChange: () => this.changeScene() });

    // Snowballs and shockwaves hurt on touch
    this.physics.add.overlap(this.jammy.sprite, this.enemyProjectiles, (js, p) => {
      if (!this.jammy.alive || !p.active) return;
      this.jammy.takeDamage(p.x);
      if (p.die) p.die();
      else p.destroy();
    });

    this._buildFloes();
    this._spawnEnemies();
    this._spawnPickups();

    // Lost Jam: in the recess above the icicle cave's high shelf
    new LostRecord(this, 1540, 24, "Stage2_1");

    this.blubert = new Blubert(this, this.jammy);
    this.blubertRevivesLeft = 1;

    this._buildExit();
    this._snowfall();
    this._showTitleCard();
    LevelCommon.registerStage(this);
    LevelCommon.unlockRocketAxe(this);

    const ui = this.scene.get("UIScene");
    if (ui && ui.setWeapon) ui.setWeapon(this.jammy.currentWeapon);
  }

  update() {
    this.jammy.update();
    if (this.blubert) this.blubert.update();
    this.enemies.getChildren().forEach((e) => {
      if (e.update) e.update();
    });
    if (this.floes) this.floes.forEach((f) => f.update());
  }

  tryReviveBlubert() {
    LevelCommon.tryReviveBlubert(this);
  }

  // Jammy asks this every frame: is the tile under his feet ice?
  isIceAt(x, y) {
    const t = this.groundLayer.getTileAtWorldXY(x, y);
    return !!(t && t.index === this.ICE);
  }

  // ------------------------------------------------------------------
  _buildTilesetTexture() {
    if (this.textures.exists("mountain-tiles")) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
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
    g.generateTexture("mountain-tiles", 8 * 16, 16);
    g.destroy();
  }

  _buildLevel() {
    const W = 210, H = 15;
    const E = -1, SNOW = 1, ROCK = 2, ICE = 3, CAVE = 4, LAKE = 5, DEEP = 6, WOOD = 7;
    this.ICE = ICE;
    const grid = () => Array.from({ length: H }, () => Array(W).fill(E));
    const ground = grid(), death = grid(), stops = grid(), change = grid();
    const fill = (g, c0, r0, c1, r1, t) => {
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (c >= 0 && c < W) g[r][c] = t;
    };
    const floor = (c0, c1, top = 12) => {
      fill(ground, c0, top, c1, top, SNOW);
      fill(ground, c0, top + 1, c1, 14, ROCK);
    };
    const ice = (c0, c1, top = 12) => {
      fill(ground, c0, top, c1, top, ICE);
      fill(ground, c0, top + 1, c1, 14, ROCK);
    };

    // Walls
    fill(ground, 0, 0, 0, 14, ROCK);
    fill(ground, W - 1, 0, W - 1, 14, ROCK);

    // Section 1: snowfield with ice patches (cols 1-44)
    floor(1, 14);
    ice(15, 24);
    floor(25, 30);
    ice(31, 40);
    floor(41, 44);
    // ledges
    fill(ground, 18, 9, 21, 9, SNOW);
    fill(ground, 34, 8, 37, 8, SNOW);
    fill(ground, 35, 9, 36, 9, ROCK);

    // Gap 45-48 (pit to deep water)
    fill(death, 45, 13, 48, 13, LAKE);
    fill(death, 45, 14, 48, 14, DEEP);

    // Section 2: steps up to the icicle cave (cols 49-70)
    floor(49, 56);
    floor(57, 62, 11);
    floor(63, 70, 10);

    // Section 3: icicle cave (cols 71-110): ceiling + floor, ice floor inside
    fill(ground, 71, 0, 110, 2, CAVE);
    fill(ground, 71, 3, 74, 3, CAVE);
    fill(ground, 96, 3, 110, 3, CAVE);
    ice(71, 84, 10);
    floor(85, 90, 10);
    ice(91, 104, 10);
    floor(105, 110, 10);
    // small cave pit
    fill(ground, 88, 10, 88, 14, E);
    fill(ground, 89, 10, 89, 14, E);
    fill(death, 88, 14, 89, 14, DEEP);
    fill(ground, 88, 11, 89, 13, CAVE);
    // High shelf for the Lost Jam, under a recess cut into the cave roof
    // so there is headroom to stand on it. Rocket Axe up from the floor
    // of the yeti's arena, starting under the recess.
    fill(ground, 84, 1, 103, 3, E);
    fill(ground, 92, 4, 103, 4, SNOW);
    fill(ground, 92, 5, 103, 5, ROCK);
    fill(ground, 66, 6, 69, 6, SNOW);

    // Section 4: frozen lake (cols 111-150) — floes carry you across
    fill(death, 111, 13, 150, 13, LAKE);
    fill(death, 111, 14, 150, 14, DEEP);
    fill(ground, 124, 9, 126, 9, SNOW); // mid-lake rock
    fill(ground, 124, 10, 126, 14, ROCK);
    fill(death, 124, 13, 126, 14, E);
    fill(ground, 138, 8, 140, 8, SNOW);
    fill(ground, 138, 9, 140, 14, ROCK);
    fill(death, 138, 13, 140, 14, E);

    // Section 5: climb to the lodge (cols 151-208)
    floor(151, 160);
    ice(161, 172);
    floor(173, 180, 11);
    floor(181, 188, 10);
    ice(189, 196, 9);
    floor(197, 208, 9);
    // lodge
    fill(ground, 200, 4, 208, 4, WOOD);
    fill(ground, 200, 5, 200, 8, WOOD);
    fill(ground, 208, 5, 208, 8, WOOD);
    fill(change, 206, 5, 207, 8, ROCK);
    // Enemy fences: only at the pit and cave mouths, so the Frostberries
    // chase across the ice patches instead of stopping at their edges
    [44, 71, 110, 151].forEach((c) => (stops[11][c] = ROCK));
    [57, 63].forEach((c) => (stops[9][c] = ROCK));

    // Deterministic snow sparkle: swap a few snow tops for ice-free tops (none) — keep simple
    const mk = (data) => {
      const map = this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 });
      const tiles = map.addTilesetImage("mountain-tiles");
      return { map, layer: map.createLayer(0, tiles, 0, 0) };
    };
    const g = mk(ground);
    this.map = g.map;
    this.groundLayer = g.layer;
    this.groundLayer.setCollision([SNOW, ROCK, ICE, CAVE, WOOD]);
    const d = mk(death);
    this.deathBlocksLayer = d.layer;
    this.deathBlocksLayer.setDepth(3);
    this.deathBlocksLayer.setCollision([LAKE, DEEP]);
    const s = mk(stops);
    this.enemyStopBlocksLayer = s.layer;
    this.enemyStopBlocksLayer.setAlpha(0);
    this.enemyStopBlocksLayer.setCollision([ROCK]);
    const c = mk(change);
    this.sceneChangeLayer = c.layer;
    this.sceneChangeLayer.setAlpha(0);
    this.sceneChangeLayer.setCollision([ROCK]);
  }

  // Ice floes drifting on the lake: one-way platforms on a slow loop
  _buildFloes() {
    this.floes = [];
    const mkFloe = (x, y, w, dx, period) => {
      if (!this.textures.exists("ice-floe")) {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xd8f4ff, 1);
        g.fillRect(0, 0, 16, 8);
        g.fillStyle(0xffffff, 1);
        g.fillRect(0, 0, 16, 2);
        g.fillStyle(0x8ed8f8, 1);
        g.fillRect(0, 6, 16, 2);
        g.generateTexture("ice-floe", 16, 8);
        g.destroy();
      }
      const plat = this.add.tileSprite(x, y, w, 8, "ice-floe").setDepth(54);
      this.physics.add.existing(plat);
      plat.body.setAllowGravity(false);
      plat.body.setImmovable(true);
      plat.body.checkCollision.down = false;
      plat.body.checkCollision.left = false;
      plat.body.checkCollision.right = false;
      this.physics.add.collider(this.jammy.sprite, plat);
      const start = this.time.now;
      const omega = (Math.PI * 2) / (period / 1000);
      this.floes.push({
        update: () => {
          const t = (this.time.now - start) / 1000;
          const targetX = x + Math.sin(t * omega) * dx;
          const vx = dx * omega * Math.cos(t * omega) + (targetX - plat.x) * 2;
          plat.body.setVelocityX(vx);
          // Arcade doesn't carry riders sideways: do it by hand
          if (this.jammy.alive && this.jammy.sprite.body.touching.down) {
            const jb = this.jammy.sprite.body;
            if (Math.abs(jb.bottom - plat.body.top) < 4 && jb.right > plat.body.left && jb.left < plat.body.right) {
              this.jammy.sprite.x += (vx * this.game.loop.delta) / 1000;
            }
          }
        },
      });
    };
    mkFloe(1860, 196, 64, 40, 3200);
    mkFloe(2110, 180, 48, 60, 2600);
    mkFloe(2300, 196, 64, 40, 3000);
  }

  _spawnEnemies() {
    // Frostberries on the snowfield and the climb
    [300, 560, 2560, 2900].forEach((x) => new Frostberry(this, x, 160));
    new Frostberry(this, 1400, 120);
    // Snowberry turrets on ledges
    [[560, 112], [1070, 132], [2250, 112], [3000, 112]].forEach(([x, y]) => new Snowberry(this, x, y));
    // The Abominable Blueberry guards the back of the icicle cave behind
    // an ice wall; beating him shatters it.
    this._buildIceWall(104);
    this.yeti = new YetiBerry(this, 1560, 140, {
      arenaL: 85 * 16,
      arenaR: 104 * 16,
      ceilingY: 58,
      wakeRange: 200,
      onDefeated: () => this._shatterIceWall(),
    });
    // Icicles across the cave ceiling
    for (let c = 76; c <= 108; c += 3) {
      if (c === 88 || c === 91 || c >= 94) continue; // the yeti's arena gets its own
      new Icicle(this, c * 16 + 8, 58);
    }
    // Pineapple grenades on the final climb — explosions on ice are a treat
    [2650, 2960].forEach((x) => new Pineapple(this, x, 140));

    // Clouds of drones over the lake
    [1950, 2200].forEach((x) => new Blueberry(this, x, 100).setPosition(x, 100));
  }

  _buildIceWall(col) {
    this.iceWallCol = col;
    for (let r = 4; r <= 9; r++) this.groundLayer.putTileAt(this.ICE, col, r);
    this.groundLayer.setCollision([1, 2, this.ICE, 4, 7]);
    this.iceWallSign = this.add
      .bitmapText(col * 16 + 8, 52, "tempFont", "ICE WALL", 8)
      .setOrigin(0.5)
      .setTintFill(0x9ad8ff)
      .setDepth(5);
  }

  _shatterIceWall() {
    const col = this.iceWallCol;
    for (let r = 4; r <= 9; r++) {
      this.groundLayer.removeTileAt(col, r);
      for (let i = 0; i < 3; i++) {
        const c = this.add.rectangle(col * 16 + 8, r * 16 + 8, 3, 3, 0xbfe8ff).setDepth(80);
        this.tweens.add({
          targets: c,
          x: c.x + Phaser.Math.Between(-30, 30),
          y: c.y + Phaser.Math.Between(10, 50),
          alpha: 0,
          duration: 600,
          onComplete: () => c.destroy(),
        });
      }
    }
    if (this.iceWallSign) this.iceWallSign.destroy();
    this.sound.play("enemyHitSound", { rate: 0.5, volume: 0.9 });
    const t = this.add
      .bitmapText(213, 100, "tempFont", "THE WAY IS CLEAR", 12)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(300)
      .setTintFill(0x8ce070);
    this.tweens.add({ targets: t, alpha: 0, delay: 1400, duration: 400, onComplete: () => t.destroy() });
  }

  _spawnPickups() {
    // The Glacier Slide waits on the first ledge — grab it before the ice
    new GuitarPickup(this, 312, 118, "glacier-slide");

    // Grind rails: one shortcut over the lake (Rocket Axe up to it), one
    // down the final climb toward the lodge.
    LevelCommon.addGrindRail(this, 1776, 2400, 96, 1);
    [1840, 1920, 2000, 2080, 2160, 2240, 2320].forEach((x) => new AntToken(this, x, 80));
    LevelCommon.addGrindRail(this, 2600, 2880, 130, 1);

    [
      [250, 150], [280, 150], [310, 150],
      [560, 110], [590, 110],
      [930, 120], [960, 120], [990, 120],
      [1250, 120], [1300, 120], [1350, 120],
      [1420, 46], [1460, 46], [1500, 46],
      [1860, 160], [2110, 140], [2300, 160],
      [2000, 120], [2220, 104],
      [2700, 150], [2740, 150], [2780, 150],
      [3060, 120], [3100, 120],
    ].forEach(([x, y]) => new AntToken(this, x, y));
    [[700, 140], [2050, 110]].forEach(([x, y]) => new SeedAmmoPickup(this, x, y));
    const p = new PowerUp(this, 1700, 150);
    p.setData("powerUpType", "heal");
    p.val = 2;
  }

  _paintBackground() {
    const w = this.map.widthInPixels;
    // Night sky bands + stars
    [
      [-240, 40, 0x0c1430],
      [40, 110, 0x1a2a5a],
      [110, 170, 0x2a4078],
      [170, 240, 0x3a5a98],
    ].forEach(([y0, y1, c]) => {
      this.add.rectangle(213, (y0 + y1) / 2, 426, y1 - y0, c).setScrollFactor(0).setDepth(-40);
    });
    for (let i = 0; i < 40; i++) {
      const x = (i * 97) % 426, y = (i * 53) % 100;
      this.add.rectangle(x, y, 1, 1, 0xffffff, 0.8).setScrollFactor(0).setDepth(-39);
    }
    // Moon
    this.add.circle(340, 46, 18, 0xeef4ff).setScrollFactor(0.05, 1).setDepth(-38);
    this.add.circle(346, 42, 15, 0x1a2a5a).setScrollFactor(0.05, 1).setDepth(-38);
    // Far peaks
    for (let x = -100; x < w + 400; x += 160) {
      const h = 70 + ((x / 160) % 3) * 30;
      this.add.triangle(x, 180, 0, 0, 90, -h, 180, 0, 0x2a3860).setScrollFactor(0.15, 1).setDepth(-36);
      this.add.triangle(x + 62, 180 - h + 2, 0, 0, 28, -22, 56, 0, 0xe8f4ff).setScrollFactor(0.15, 1).setDepth(-35);
    }
    // Near pines
    for (let x = 20; x < w + 300; x += 90) {
      const h = 40 + ((x / 90) % 4) * 10;
      const t = this.add.triangle(x, 192, 0, 0, 14, -h, 28, 0, 0x16304a).setScrollFactor(0.4, 1).setDepth(-30);
      this.add.triangle(x, 192 - h * 0.45, 0, 0, 14, -h * 0.6, 28, 0, 0x1e4060).setScrollFactor(0.4, 1).setDepth(-30);
      this.add.rectangle(x + 14, 190, 4, 8, 0x3a2818).setScrollFactor(0.4, 1).setDepth(-30);
    }
  }

  _snowfall() {
    this.time.addEvent({
      delay: 120,
      loop: true,
      callback: () => {
        const cam = this.cameras.main;
        const f = this.add
          .rectangle(cam.scrollX + Phaser.Math.Between(0, 426), cam.scrollY - 4, 2, 2, 0xffffff, 0.8)
          .setDepth(150);
        this.tweens.add({
          targets: f,
          y: f.y + 260,
          x: f.x + Phaser.Math.Between(-30, 30),
          alpha: 0.2,
          duration: 2600 + Math.random() * 1200,
          onComplete: () => f.destroy(),
        });
      },
    });
  }

  _buildExit() {
    // Lodge door with a warm glow at the top of the climb
    const x = 3304, y = 120;
    this.add.rectangle(x, y, 20, 32, 0x3a2818).setDepth(1);
    this.add.rectangle(x, y - 2, 14, 24, 0xffd9a0, 0.9).setDepth(1);
    this.add.rectangle(x, y - 2, 2, 24, 0x3a2818).setDepth(1);
    this.add.rectangle(x, y - 2, 14, 2, 0x3a2818).setDepth(1);
    const glow = this.add.circle(x, y, 26, 0xffd9a0, 0.15).setDepth(1);
    this.tweens.add({ targets: glow, alpha: 0.05, duration: 800, yoyo: true, repeat: -1 });
    this.add.bitmapText(x, y - 30, "tempFont", "LODGE", 8).setOrigin(0.5).setTintFill(0xffd9a0).setDepth(1);
  }

  _showTitleCard() {
    const t1 = this.add
      .bitmapText(213, 92, "tempFont", "STAGE 2-1", 16)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(300)
      .setTintFill(0xffffff);
    const t2 = this.add
      .bitmapText(213, 114, "tempFont", "THE BERRY MOUNTAINS", 12)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(300)
      .setTintFill(0x9ad8ff);
    const t3 = this.add
      .bitmapText(213, 132, "tempFont", "WATCH YOUR FOOTING ON THE ICE", 8)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(300)
      .setTintFill(0xffffff);
    this.tweens.add({
      targets: [t1, t2, t3],
      alpha: 0,
      delay: 2000,
      duration: 600,
      onComplete: () => {
        t1.destroy();
        t2.destroy();
        t3.destroy();
      },
    });
  }

  changeScene() {
    LevelCommon.finishStage(this, "CutSceneToBeContinued");
  }
}
