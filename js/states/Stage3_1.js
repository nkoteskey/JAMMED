// Stage 3-1 — THE SILENT MOUND. The ant colony that went quiet before
// the game began. Deliberately the Archive's mirror image: the same
// wall-of-cells architecture, but these cells hold SEEDS, not jars —
// preservation that belongs to whoever grew it. Jar room, seed room.
//
// The colony wakes in proportion to every ANT banked across the whole
// run, so the level is literally brighter and busier for a player who
// collected. Concentrate has sent canners down to seal the vault; the
// stage ends with the colony marching out alongside Jammy.
class Stage3_1 extends Phaser.Scene {
  constructor() {
    super({ key: "Stage3_1" });
  }

  preload() { scene = this; }

  create() {
    this.sound.stopAll();
    if (typeof Chip !== "undefined") Chip.stop();
    Chip.play("mound");

    if (typeof SeedOfDestruction !== "undefined") SeedOfDestruction.ensureTexture(this);

    this.cameras.main.setBackgroundColor("#160d07");

    // How awake is the colony? Everything below scales off this.
    const banked = (typeof game !== "undefined" && game && game.antTokensCollected)
      ? (game.antTokensCollected.level1 || 0) : 0;
    this.banked = banked;
    this.wake = Phaser.Math.Clamp(banked / 28, 0, 1);

    this._buildTilesetTexture();
    this._buildLevel();
    this._paintBackground();
    this._buildSeedCells();
    addForegroundProps(this, "mound", { step: 420 });

    this.bullets = this.physics.add.group();
    this.collectibles = this.physics.add.group();
    this._breadTotal = 0; // scene instances persist across restart()
    this.enemies = this.add.group();
    this.enemyProjectiles = this.physics.add.group();

    const sp = checkpointSpawn(this, 56, 150);
    this.jammy = new Jammy(sp.x, sp.y);
    this.jammy.sprite.setDepth(100);
    this.jammy.controlsEnabled = true;
    this.children.bringToTop(this.jammy.sprite);

    // Checkpoints — x0x relay posts the murmur remembers you at
    initCheckpoints(this, [[800, 192], [1560, 192]], 192);

    setupPlatformerCamera(this, this.jammy, {});
    this.cameras.main.setBounds(0, -160, this.map.widthInPixels, 240 + 160);

    this.physics.add.overlap(this.jammy.sprite, this.collectibles, (j, c) => c.effect());
    this.physics.add.collider(this.jammy.sprite, this.groundLayer);
    this.physics.add.collider(this.jammy.sprite, this.deathBlocksLayer, () =>
      this.jammy.instantDeath());
    this._changing = false;
    this.physics.add.collider(this.jammy.sprite, this.sceneChangeLayer, () => this.changeScene());
    this.physics.add.collider(this.collectibles, this.groundLayer);
    this.physics.add.collider(this.enemies, this.groundLayer);
    this.physics.add.collider(this.enemies, this.enemyStopBlocksLayer);

    this._buildAntBridges();
    this._spawnColonyLife();

    // Concentrate came down here to seal the vault. They do not belong.
    [[620, 96], [1420, 96], [2180, 96]].forEach(([x, y]) => new CannerDrone(this, x, y));
    [880, 1700, 2320].forEach((x) => new TinSoldier(this, x, 170));
    [[1150, 110], [1980, 110]].forEach(([x, y]) => new StaticWasp(this, x, y));

    [[336, 118], [820, 110], [1290, 116], [1900, 108], [2500, 166]]
      .forEach(([x, y]) => new BreadToken(this, x, y));
    new RoyaltyScrap(this, 980, 168, "NO RECEIPTS DOWN HERE. NOBODY IS SELLING ANYTHING");
    new SeedAmmoPickup(this, 1600, 150);
    const heal = new PowerUp(this, 2000, 150);
    heal.setData("powerUpType", "heal");
    heal.val = 2;

    this.blubert = new Blubert(this, this.jammy);
    this.blubertRevivesLeft = 1;

    ensureX0XTexture(this);
    this.add.image(800, 214, "x0x-glyph").setDepth(2);
    this.murmur = new Murmur(this);
    this.murmur.addTrigger(120, "the mound. quiet since before the outbreak");
    this.murmur.addTrigger(300,
      banked > 16 ? "you brought a lot back. listen to it wake"
      : banked > 6 ? "some of them are stirring. you brought enough to matter"
      : "not much came back with you. it will be a thin march");
    this.murmur.addTrigger(1000, "cells not jars. a seed waits. a jar only keeps");
    this.murmur.addTrigger(1500, "canners came down to seal the vault. they do not belong here");
    this.murmur.addTrigger(2500, "the colony is with you. take it to the tower");

    this._buildVaultGate();
    this._showTitleCard();

    const ui = this.scene.get("UIScene");
    if (ui && ui.setWeapon) ui.setWeapon(this.jammy.currentWeapon);
    if (ui && ui.setBread) ui.setBread(BreadToken.collectedIn(this), this._breadTotal || 5);
  }

  update() {
    this.jammy.update();
    updatePlatformerCamera(this, this.jammy);
    updateForegroundProps(this, this.jammy);
    if (this.blubert) this.blubert.update();
    this.enemies.getChildren().forEach((e) => { if (e.update) e.update(); });
    if (this.murmur) this.murmur.update(this.jammy.sprite.x);
    if (this.bridges) this.bridges.forEach((b) => b.update());
  }

  tryReviveBlubert() {
    if (this.blubert || !this.jammy || (this.blubertRevivesLeft || 0) <= 0) return;
    this.blubertRevivesLeft -= 1;
    this.blubert = new Blubert(this, this.jammy);
  }

  // ------------------------------------------------------------------
  _buildTilesetTexture() {
    if (this.textures.exists("mound-tiles")) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const o = (i) => i * 16;

    // 1: packed earth wall, tunnelled smooth
    g.fillStyle(0x2e1c10, 1); g.fillRect(o(1), 0, 16, 16);
    g.fillStyle(0x412a18, 1); g.fillRect(o(1) + 1, 1, 14, 14);

    g.fillStyle(0x54381f, 1); g.fillRect(o(1) + 1, 1, 14, 2);
    g.fillStyle(0x24150b, 1);
    g.fillRect(o(1) + 4, 6, 3, 2); g.fillRect(o(1) + 10, 11, 3, 2);

    // 2: chamber floor — tamped earth with a lighter tread line
    g.fillStyle(0x4a3018, 1); g.fillRect(o(2), 0, 16, 16);
    g.fillStyle(0x6b4726, 1); g.fillRect(o(2), 0, 16, 3);
    g.fillStyle(0x8a5f34, 1); g.fillRect(o(2), 0, 16, 1);
    g.fillStyle(0x33200f, 1);
    g.fillRect(o(2) + 3, 6, 5, 1); g.fillRect(o(2) + 9, 10, 4, 1);
    g.fillStyle(0x5c3b1e, 1); g.fillRect(o(2) + 11, 4, 2, 2);

    // 3: deep earth
    g.fillStyle(0x33200f, 1); g.fillRect(o(3), 0, 16, 16);
    g.fillStyle(0x24150b, 1);
    g.fillRect(o(3) + 2, 3, 5, 3); g.fillRect(o(3) + 10, 9, 4, 3);
    g.fillStyle(0x452c15, 1); g.fillRect(o(3) + 12, 2, 2, 2);

    // 4: honeycomb seed-cell wall (lit) — warm amber
    g.fillStyle(0x4a3018, 1); g.fillRect(o(4), 0, 16, 16);
    g.fillStyle(0xc98a34, 1);
    g.fillRect(o(4) + 2, 2, 5, 5); g.fillRect(o(4) + 9, 2, 5, 5);
    g.fillRect(o(4) + 2, 9, 5, 5); g.fillRect(o(4) + 9, 9, 5, 5);
    g.fillStyle(0xffd877, 1);
    g.fillRect(o(4) + 3, 3, 3, 3); g.fillRect(o(4) + 10, 3, 3, 3);
    g.fillRect(o(4) + 3, 10, 3, 3); g.fillRect(o(4) + 10, 10, 3, 3);
    g.fillStyle(0x8a5f34, 1);
    g.fillRect(o(4) + 7, 0, 2, 16); g.fillRect(o(4), 7, 16, 2);

    // 5: honeycomb cell wall (dark — a cell nobody refilled)
    g.fillStyle(0x4a3018, 1); g.fillRect(o(5), 0, 16, 16);
    g.fillStyle(0x3a2412, 1);
    g.fillRect(o(5) + 2, 2, 5, 5); g.fillRect(o(5) + 9, 2, 5, 5);
    g.fillRect(o(5) + 2, 9, 5, 5); g.fillRect(o(5) + 9, 9, 5, 5);
    g.fillStyle(0x8a5f34, 1);
    g.fillRect(o(5) + 7, 0, 2, 16); g.fillRect(o(5), 7, 16, 2);

    // 6: root beam platform
    g.fillStyle(0x6b4726, 1); g.fillRect(o(6), 0, 16, 7);
    g.fillStyle(0x8a5f34, 1); g.fillRect(o(6), 0, 16, 2);
    g.fillStyle(0x452c15, 1); g.fillRect(o(6), 7, 16, 3);
    g.fillStyle(0x33200f, 1);
    g.fillRect(o(6) + 3, 2, 2, 4); g.fillRect(o(6) + 11, 3, 2, 3);

    // 7: sinkhole (deadly) — a shaft that goes down forever
    g.fillStyle(0x0e0704, 1); g.fillRect(o(7), 0, 16, 16);
    g.fillStyle(0x1c1108, 1); g.fillRect(o(7), 0, 16, 2);

    g.generateTexture("mound-tiles", 8 * 16, 16);
    g.destroy();
  }

  _buildLevel() {
    const W = 190, H = 15;
    const E = -1, WALL = 1, FLOOR = 2, DEEP = 3, CELL = 4, CELLD = 5, ROOT = 6, PIT = 7;
    const grid = () => Array.from({ length: H }, () => Array(W).fill(E));
    const ground = grid(), death = grid(), stops = grid(), change = grid();
    const fill = (g, c0, r0, c1, r1, t) => {
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) g[r][c] = t;
    };

    fill(ground, 0, 0, W - 1, 2, WALL);     // earth ceiling
    fill(ground, 0, 0, 1, H - 1, WALL);
    fill(ground, W - 2, 0, W - 1, H - 1, WALL);

    // Chamber floors with sinkholes between them
    this.floors = [[2, 40], [45, 86], [91, 130], [135, 187]];
    this.floors.forEach(([a, b]) => {
      fill(ground, a, 12, b, 12, FLOOR);
      fill(ground, a, 13, b, 14, DEEP);
    });
    this.pits = [[41, 44], [87, 90], [131, 134]];
    this.pits.forEach(([a, b]) => fill(death, a, 13, b, 14, PIT));

    // Honeycomb seed-cell banks along the back wall. How many are lit
    // depends on how much ANT the player banked — the colony's
    // pantry, restocked by the run they actually played.
    this.cellBanks = [[6, 16], [26, 36], [52, 62], [70, 80],
                      [96, 106], [114, 124], [140, 150], [158, 172]];
    this.cellBanks.forEach(([a, b], i) => {
      const lit = i / this.cellBanks.length < this.wake;
      fill(ground, a, 9, b, 11, lit ? CELL : CELLD);
    });

    // Root-beam platforms to climb
    fill(ground, 20, 8, 25, 8, ROOT);
    fill(ground, 47, 7, 52, 7, ROOT);
    fill(ground, 64, 9, 69, 9, ROOT);
    fill(ground, 100, 7, 106, 7, ROOT);
    fill(ground, 118, 9, 123, 9, ROOT);
    fill(ground, 152, 8, 158, 8, ROOT);
    fill(ground, 172, 7, 178, 7, ROOT);

    [3, 39, 46, 85, 92, 129, 136, 186].forEach((c) => (stops[11][c] = WALL));
    fill(change, 183, 4, 184, 11, WALL);

    const mk = (data) => {
      const map = this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 });
      return { map, layer: map.createLayer(0, map.addTilesetImage("mound-tiles"), 0, 0) };
    };
    const gnd = mk(ground);
    this.map = gnd.map;
    this.groundLayer = gnd.layer;
    this.groundLayer.setCollision([WALL, FLOOR, DEEP, CELL, CELLD, ROOT]);

    const d = mk(death);
    this.deathBlocksLayer = d.layer;
    this.deathBlocksLayer.setDepth(3);
    this.deathBlocksLayer.setCollision([PIT]);

    const s = mk(stops);
    this.enemyStopBlocksLayer = s.layer;
    this.enemyStopBlocksLayer.setAlpha(0);
    this.enemyStopBlocksLayer.setCollision([WALL]);

    const c = mk(change);
    this.sceneChangeLayer = c.layer;
    this.sceneChangeLayer.setAlpha(0);
    this.sceneChangeLayer.setCollision([WALL]);
  }

  _paintBackground() {
    const w = this.map.widthInPixels;
    [[0, 70, 0x120a05], [70, 130, 0x190f07], [130, 240, 0x22150a]]
      .forEach(([y0, y1, c]) =>
        this.add.rectangle(213, (y0 + y1) / 2, 426, y1 - y0, c)
          .setScrollFactor(0).setDepth(-40));

    // Receding tunnel mouths
    for (let x = 0; x < 1100; x += 118) {
      this.add.ellipse(x, 150, 70, 96, 0x0d0704)
        .setScrollFactor(0.16, 1).setDepth(-35);
      this.add.ellipse(x, 150, 54, 78, 0x080402)
        .setScrollFactor(0.16, 1).setDepth(-34);
    }

    // Hanging roots
    for (let x = 30; x < w; x += 86) {
      const len = 20 + ((x * 7) % 30);
      this.add.rectangle(x, 48 + len / 2, 3, len, 0x3a2412)
        .setScrollFactor(0.45, 1).setDepth(-25);
      this.add.circle(x, 48 + len, 3, 0x452c15)
        .setScrollFactor(0.45, 1).setDepth(-25);
    }

    // Glow-spore lanterns, denser when the colony is awake
    const lanterns = 4 + Math.round(this.wake * 14);
    for (let i = 0; i < lanterns; i++) {
      const x = 90 + (i * (w - 200)) / Math.max(1, lanterns - 1);
      const y = 40 + ((i * 37) % 60);
      const glow = this.add.circle(x, y, 14, 0xffd877, 0.10).setDepth(-20);
      const core = this.add.circle(x, y, 3, 0xffe9a8, 0.9).setDepth(-19);
      this.tweens.add({
        targets: [glow, core], alpha: { from: 0.9, to: 0.35 },
        duration: 1200 + (i % 5) * 300, yoyo: true, repeat: -1,
      });
      this.tweens.add({
        targets: [glow, core], y: y + 6,
        duration: 2600 + (i % 4) * 400, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
      });
    }

    // Drifting motes of seed-fluff in the warm air
    this.time.addEvent({
      delay: 320, loop: true,
      callback: () => {
        const cam = this.cameras.main;
        const x = cam.scrollX + Math.random() * 426;
        const m = this.add.circle(x, 210, 1.5, 0xffe9a8, 0.6).setDepth(70);
        this.tweens.add({
          targets: m, y: 20 + Math.random() * 60, x: x + (Math.random() * 60 - 30),
          alpha: 0, duration: 5200 + Math.random() * 2000,
          onComplete: () => m.destroy(),
        });
      },
    });
  }

  // Seeds visible inside the lit cells — the thesis, on a wall.
  _buildSeedCells() {
    if (!this.textures.exists("cell-seed")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xd4a676, 1);
      g.fillEllipse(4, 5, 7, 9);
      g.fillStyle(0xf0c899, 1);
      g.fillEllipse(3, 3, 3, 3);
      g.fillStyle(0x7e5a34, 1);
      g.fillRect(3, 8, 2, 2);
      g.generateTexture("cell-seed", 8, 11);
      g.destroy();
    }
    this.cellBanks.forEach(([a, b], i) => {
      const lit = i / this.cellBanks.length < this.wake;
      if (!lit) return;
      for (let c = a + 1; c < b; c += 2) {
        const s = this.add.image(c * 16 + 8, 10 * 16 + 8, "cell-seed");
        s.setDepth(4);
        s.setAlpha(0.9);
        this.tweens.add({
          targets: s, y: s.y - 2,
          duration: 1400 + ((c * 37) % 800), yoyo: true, repeat: -1, ease: "Sine.easeInOut",
        });
      }
    });
  }

  // Living bridges: columns of ants that link across the sinkholes.
  // They only form if enough of the colony woke up, so a player who
  // skipped the tokens has to Rocket-Axe the gaps instead.
  _buildAntBridges() {
    if (!this.textures.exists("bridge-ant")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x6e1136, 1);
      g.fillRect(0, 2, 3, 3); g.fillRect(3, 1, 4, 4); g.fillRect(7, 2, 3, 3);
      g.fillStyle(0xc23a66, 1);
      g.fillRect(4, 2, 2, 2);
      g.fillStyle(0x2a0a18, 1);
      g.fillRect(0, 5, 2, 1); g.fillRect(4, 5, 2, 1); g.fillRect(8, 5, 2, 1);
      g.generateTexture("bridge-ant", 10, 6);
      g.destroy();
    }
    this.bridges = [];
    if (this.wake < 0.34) return; // too few came back

    this.pits.forEach(([a, b], idx) => {
      const x0 = a * 16, x1 = (b + 1) * 16;
      const w = x1 - x0;
      const y = 12 * 16 + 2;
      const plat = this.add.tileSprite(x0 + w / 2, y, w, 6, "bridge-ant");
      plat.setDepth(55);
      this.physics.add.existing(plat);
      plat.body.setAllowGravity(false);
      plat.body.setImmovable(true);
      plat.body.checkCollision.down = false;
      plat.body.checkCollision.left = false;
      plat.body.checkCollision.right = false;
      this.physics.add.collider(this.jammy.sprite, plat);
      this.bridges.push({
        update: () => { plat.tilePositionX += 0.35 + idx * 0.1; },
      });
    });
  }

  // Ambient colony: ants streaming along the floor, more of them the
  // more the player banked. Pure atmosphere, no collision.
  _spawnColonyLife() {
    if (!this.textures.exists("bridge-ant")) return;
    const rate = Math.max(160, 900 - this.wake * 700);
    this.time.addEvent({
      delay: rate, loop: true,
      callback: () => {
        const cam = this.cameras.main;
        const fromLeft = Math.random() < 0.5;
        const y = 186 + Math.random() * 4;
        const a = this.add.image(
          cam.scrollX + (fromLeft ? -12 : 438), y, "bridge-ant");
        a.setDepth(58);
        a.setFlipX(!fromLeft);
        this.tweens.add({
          targets: a, x: a.x + (fromLeft ? 470 : -470),
          duration: 3000 + Math.random() * 1500,
          onComplete: () => a.destroy(),
        });
      },
    });
  }

  _buildVaultGate() {
    const x = 2930;
    // The seed vault door: a great honeycomb iris, warm behind it
    this.add.circle(x, 152, 34, 0x2e1c10).setDepth(1);
    this.add.circle(x, 152, 29, 0x6b4726).setDepth(1);
    const iris = this.add.circle(x, 152, 23, 0xffd877, 0.75).setDepth(2);
    this.tweens.add({
      targets: iris, alpha: 0.4, scale: 0.94,
      duration: 1100, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      this.add.rectangle(x + Math.cos(ang) * 26, 152 + Math.sin(ang) * 26, 6, 6, 0x8a5f34)
        .setAngle(45).setDepth(2);
    }
    this.add.bitmapText(x, 106, "tempFont", "TO THE SPIRE", 8)
      .setOrigin(0.5).setTintFill(0xffd877).setDepth(2);
  }

  _showTitleCard() {
    const a = this.add.bitmapText(213, 92, "tempFont", "STAGE 3-1", 16)
      .setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0xffe9a8);
    const b = this.add.bitmapText(213, 114, "tempFont", "THE SILENT MOUND", 12)
      .setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0xffd877);
    this.tweens.add({
      targets: [a, b], alpha: 0, delay: 1700, duration: 600,
      onComplete: () => { a.destroy(); b.destroy(); },
    });
  }

  changeScene() {
    if (this._changing) return;
    this._changing = true;
    clearCheckpoints(this);
    this.jammy.controlsEnabled = false;
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("Stage3_2"));
  }
}
