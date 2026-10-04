// Stage 2-3 — THE PRESERVE MINES. Inside the mountain, where Baron
// Pectin's crews drill the jam veins. Dark but for Jammy's lantern,
// warm enough that every guitar plays again. Jam pools with geysers on
// a rhythm, Marmalurkers leaping out of the jam, minecart rails over
// the deep pit (the Glacier Slide grinds them), a timber maze with
// pineapple grenades, and at the bottom of the shaft the foreman
// himself: COUNT CURRANT on his drill-cart.
class Stage2_3 extends Phaser.Scene {
  constructor() {
    super({ key: "Stage2_3" });
  }

  preload() {
    scene = this;
  }

  create() {
    this._changing = false;
    this.sound.stopAll();
    this.sound.play(this.cache.audio.exists("DeepPreserve") ? "DeepPreserve" : "BossBattle", { loop: true, volume: 0.85 });
    this.cameras.main.setBackgroundColor("#0a0612");
    this.coldStage = false;

    this._buildLevel();
    this._paintBackground();

    LevelCommon.createGroups(this);

    this.jammy = new Jammy(40, 170);
    this.jammy.sprite.setDepth(100);
    this.children.bringToTop(this.jammy.sprite);
    this.cameras.main.startFollow(this.jammy.sprite, true);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    LevelCommon.wireCollisions(this, { onSceneChange: () => this.changeScene() });

    this.physics.add.overlap(this.jammy.sprite, this.enemyProjectiles, (js, p) => {
      if (!this.jammy.alive || !p.active) return;
      this.jammy.takeDamage(p.x);
      if (p.die) p.die();
      else p.destroy();
    });

    this._buildHazards();
    this._spawnEnemies();
    this._spawnPickups();
    this._decorate();

    this.blubert = new Blubert(this, this.jammy);
    this.blubertRevivesLeft = 1;

    MineLantern.attach(this);
    MountainTiles.titleCard(this, "STAGE 2-3", "THE PRESERVE MINES", "THE FURNACES KEEP YOUR GUITARS WARM - MIND THE JAM");
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
    if (this.geysers) this.geysers.forEach((g) => g.update());
    MineLantern.update(this);
  }

  tryReviveBlubert() {
    LevelCommon.tryReviveBlubert(this);
  }

  // ------------------------------------------------------------------
  _buildLevel() {
    const W = 220, H = 15;
    const T = MountainTiles;
    const { E, ROCK, CAVE, JAM, TIMBER, JAMROCK } = T;
    const g = T.grids(W, H);
    const { ground, death, stops, change, fill, mineFloor, pit } = g;

    fill(ground, 0, 0, 0, H - 1, JAMROCK);
    fill(ground, W - 1, 0, W - 1, H - 1, JAMROCK);
    // Mine ceiling the whole way
    fill(ground, 0, 0, W - 1, 1, JAMROCK);

    // S1: entry drift (1-30)
    mineFloor(1, 30, 12);
    pit(14, 16, JAM, 13);
    stops[11][13] = ROCK;
    stops[11][17] = ROCK;

    // S2: geyser gallery (31-70): four jam pools, a geyser in each
    mineFloor(31, 70, 12);
    [[36, 38], [46, 48], [56, 58], [66, 68]].forEach(([a, b]) => pit(a, b, JAM, 13));
    fill(ground, 41, 8, 43, 8, TIMBER); // walkway over the second pool
    fill(ground, 51, 7, 53, 7, TIMBER);

    // S3: the deep pit, crossed on minecart rails (71-110)
    mineFloor(71, 80, 12);
    pit(81, 108, JAM, 13);
    mineFloor(109, 118, 12);
    stops[11][80] = ROCK;
    stops[11][109] = ROCK;

    // S4: timber maze (119-160)
    mineFloor(119, 160, 12);
    [[122, 125, 9], [128, 131, 6], [134, 138, 8], [141, 144, 10], [147, 150, 7], [153, 157, 9]].forEach(([a, b, r]) => fill(ground, a, r, b, r, TIMBER));
    [[126, 127], [139, 140], [151, 152]].forEach(([a, b]) => pit(a, b, JAM, 13));
    // Lost Jam nook carved into the ceiling over the maze
    fill(ground, 134, 2, 138, 4, E);
    fill(ground, 134, 1, 138, 1, JAMROCK);

    // S5: the shaft floor, Count Currant's arena (161-200)
    mineFloor(161, 200, 12);
    fill(ground, 161, 2, 200, 2, JAMROCK); // low drilling ceiling
    for (let r = 3; r <= 11; r++) {
      stops[r][163] = ROCK;
      stops[r][199] = ROCK;
    }
    // Beyond the arena: the lift shaft, opened once the Count is beaten
    fill(ground, 201, 2, 219, 11, JAMROCK);
    fill(ground, 202, 3, 206, 11, E); // the cage itself is open
    fill(ground, 201, 12, 219, 12, TIMBER);
    this.liftCols = [201, 205];
    fill(change, 203, 8, 204, 11, ROCK);

    T.makeLayers(this, g);
    this.lvl = g;
  }

  _buildHazards() {
    const surface = 13 * 16;
    [[37, 0], [47, 900], [57, 1800], [67, 600]].forEach(([c, phase]) => new JamGeyser(this, c * 16 + 8, surface, { phase, period: 2600, upMs: 900 }));
    // Geysers under the timber maze
    [[126, 300], [139, 1300], [151, 2100]].forEach(([c, phase]) => new JamGeyser(this, c * 16 + 16, surface, { phase, period: 2400, upMs: 800 }));
    // Minecart rails across the deep pit
    LevelCommon.addGrindRail(this, 81 * 16, 93 * 16, 11 * 16 + 2, 1);
    LevelCommon.addGrindRail(this, 96 * 16, 108 * 16, 10 * 16 + 2, 1);
  }

  _spawnEnemies() {
    const surface = 13 * 16;
    // Entry
    new Marmalurker(this, 15 * 16 + 8, surface);
    [21, 27].forEach((c) => new Grapeshot(this, c * 16, 11 * 16));
    // Gallery
    new Marmalurker(this, 47 * 16 + 8, surface);
    new Marmalurker(this, 67 * 16 + 8, surface);
    new Pineapple(this, 61 * 16, 11 * 16 - 4);
    // Deep pit: drones over the rails, lurkers in the jam below
    [86, 100].forEach((c) => new Blueberry(this, c * 16, 7 * 16).setPosition(c * 16, 7 * 16));
    [90, 104].forEach((c) => new Marmalurker(this, c * 16 + 8, surface));
    // Maze
    [123, 142, 155].forEach((c) => new Grapeshot(this, c * 16 + 8, 11 * 16));
    new Pineapple(this, 129 * 16 + 8, 6 * 16 - 4);
    new Pineapple(this, 148 * 16 + 8, 7 * 16 - 4);
    [126, 151].forEach((c) => new Marmalurker(this, c * 16 + 16, surface));
    // The foreman
    this.count = new CountCurrant(this, 190 * 16, 11 * 16 - 20, {
      arenaL: 164 * 16,
      arenaR: 199 * 16,
      ceilingY: 3 * 16,
      wakeRange: 210,
      onDefeated: () => this._openLift(),
    });
  }

  _spawnPickups() {
    const X = (c) => c * 16 + 8;
    [
      [X(5), 170], [X(11), 170],
      [X(20), 170], [X(26), 170],
      [X(37), 150], [X(42), 110], [X(47), 150], [X(52), 94], [X(57), 150], [X(67), 150],
      [X(84), 150], [X(92), 150], [X(99), 134], [X(107), 134],
      [X(123), 124], [X(129), 76], [X(136), 108], [X(142), 140], [X(148), 92], [X(155), 124],
      [X(166), 170], [X(196), 170],
    ].forEach(([x, y]) => new AntToken(this, x, y));
    // Bread: over the gallery walkway, above the second rail, over the maze's last timber
    [[X(42), 92], [X(102), 118], [X(155), 108]].forEach(([x, y]) => new BreadToken(this, x, y));

    [[X(28), 170], [X(76), 170], [X(116), 170]].forEach(([x, y]) => new SeedAmmoPickup(this, x, y));
    const p = new PowerUp(this, X(159), 11 * 16 + 6);
    p.setData("powerUpType", "heal");
    p.val = 2;

    // Lost Jam: in the nook carved into the ceiling over the maze, a
    // Rocket Axe hop up from the timber walkway below it
    new LostRecord(this, X(136), 3 * 16 + 8, "Stage2_3");
  }

  _paintBackground() {
    // Rock darkness with faint far-wall veins of jam
    const w = this.map.widthInPixels;
    this.add.rectangle(213, 120, 426, 240, 0x16101e).setScrollFactor(0).setDepth(-40);
    for (let x = 30; x < w; x += 70) {
      const h = 30 + ((x / 70) % 4) * 14;
      this.add.rectangle(x, 60 + ((x / 70) % 5) * 28, 2, h, 0x6a2050, 0.5).setScrollFactor(0.5, 1).setDepth(-30);
    }
    // Timber props every so often
    for (let x = 64; x < w; x += 128) {
      this.add.rectangle(x, 120, 6, 160, 0x3a2412).setScrollFactor(0.7, 1).setDepth(-20);
      this.add.rectangle(x, 44, 60, 6, 0x3a2412).setScrollFactor(0.7, 1).setDepth(-20);
    }
  }

  _decorate() {
    // Hanging lanterns along the drifts: pools of warm light in the dark
    [6, 20, 34, 50, 64, 76, 112, 120, 132, 146, 158, 170, 182, 194].forEach((c) => {
      const x = c * 16 + 8, y = 2 * 16 + 10;
      this.add.rectangle(x, y - 6, 1, 8, 0x8c6440).setDepth(5);
      this.add.rectangle(x, y + 2, 6, 8, 0x3a2818).setDepth(5);
      const flame = this.add.circle(x, y + 2, 2, 0xffd9a0).setDepth(6);
      const glow = this.add.circle(x, y + 2, 28, 0xffb050, 0.12).setDepth(4);
      this.tweens.add({ targets: [flame, glow], alpha: 0.6, duration: 300 + (c % 5) * 60, yoyo: true, repeat: -1 });
    });
    // Furnace glow at the gallery
    const f = this.add.rectangle(33 * 16, 10 * 16, 24, 32, 0x2a1408).setDepth(5);
    this.add.rectangle(33 * 16, 11 * 16, 14, 10, 0xff7a22).setDepth(6);
    this.add.rectangle(33 * 16, 11 * 16 + 2, 8, 6, 0xffd066).setDepth(7);
    this.tweens.add({ targets: f, alpha: 0.8, duration: 200, yoyo: true, repeat: -1 });
    // Warning board before the shaft
    this.add.bitmapText(161 * 16 + 8, 6 * 16, "tempFont", "SHAFT 9", 8).setOrigin(0.5).setTintFill(0xffd9a0).setDepth(5);
    this.add.bitmapText(161 * 16 + 8, 6 * 16 + 10, "tempFont", "FOREMAN ON DUTY", 8).setOrigin(0.5).setTintFill(0xc8a0ff).setDepth(5);
    // The lift: a timber cage, dark until the foreman is beaten
    const lx = 203 * 16 + 16;
    this.liftCage = this.add.rectangle(lx, 10 * 16, 30, 64, 0x3a2412, 0.9).setDepth(5);
    this.liftGate = this.add.rectangle(201 * 16 + 8, 10 * 16, 14, 64, 0x5a3a1e).setDepth(6);
    this.liftLabel = this.add.bitmapText(lx, 6 * 16, "tempFont", "LIFT", 8).setOrigin(0.5).setTintFill(0x8a7a92).setDepth(5);
    // The gate is solid while the Count works: a wall tile in the ground
    for (let r = 3; r <= 11; r++) this.groundLayer.putTileAt(MountainTiles.TIMBER, 201, r);
  }

  _openLift() {
    this.time.delayedCall(2600, () => {
      if (this._changing) return;
      for (let r = 3; r <= 11; r++) this.groundLayer.removeTileAt(201, r);
      this.tweens.add({ targets: this.liftGate, alpha: 0, duration: 400 });
      this.liftLabel.setTintFill(0xffd9a0);
      const t = this.add
        .bitmapText(213, 180, "tempFont", "THE LIFT IS RUNNING - RIDE IT UP", 8)
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(300)
        .setTintFill(0x8ce070);
      this.tweens.add({ targets: t, alpha: 0, delay: 2200, duration: 400, onComplete: () => t.destroy() });
      this.sound.play("powerUpSound", { volume: 0.6, rate: 0.9 });
    });
  }

  changeScene() {
    LevelCommon.finishStage(this, "CutSceneToBeContinued");
  }
}
