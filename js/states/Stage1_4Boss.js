// Stage 1-5 — THE CANNING FLOOR. The room behind The Jam Works' exit
// door: a single-screen boss arena where the Canning Colossus waits on
// its ceiling rail. Built from the same runtime factory tileset as 1-4.
class Stage1_4Boss extends Phaser.Scene {
  constructor() {
    super({ key: "Stage1_4Boss" });
  }

  preload() {
    scene = this;
  }

  create() {
    this._changing = false;
    this.sound.stopAll();
    this.sound.play("BossBattle", { loop: true, volume: 0.8 });
    this.cameras.main.setBackgroundColor("#14081c");

    // Reuse the factory tileset drawn by Stage 1-4
    if (!this.textures.exists("factory-tiles")) {
      Stage1_4.prototype._buildTilesetTexture.call(this);
    }
    this._buildArena();
    this._paintBackground();

    LevelCommon.createGroups(this);

    this.jammy = new Jammy(60, 150);
    this.jammy.sprite.setDepth(100);
    this.jammy.sprite.setCollideWorldBounds(true);
    // The Heart Container's blessing carried Jammy through the factory;
    // the boss is fought on base hearts.
    LevelCommon.retireHeartBonus(this);
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, 240);

    LevelCommon.wireCollisions(this);

    // Boss projectiles (globs, shockwaves) hurt on touch
    this.physics.add.overlap(this.jammy.sprite, this.enemyProjectiles, (js, p) => {
      if (!this.jammy.alive || !p.active) return;
      this.jammy.takeDamage(p.x);
      if (p.die) p.die();
      else p.destroy();
    });

    // The boss: rail at y=74, feet land at y=156 (floor top 192 - 36)
    this.boss = new CanningColossus(this, 300, 74, 156);
    // Rail graphic
    this.add.rectangle(this.map.widthInPixels / 2, 36, this.map.widthInPixels, 4, 0x5d6680).setDepth(2);
    for (let x = 24; x < this.map.widthInPixels; x += 48) {
      this.add.rectangle(x, 36, 6, 8, 0x8c96b0).setDepth(2);
    }

    // Boss lifebar
    this.bossLifebar = {
      guts: this.add
        .image(this.cameras.main.width - 10, 30, "bossLifebar-guts")
        .setOrigin(1, 0)
        .setScrollFactor(0)
        .setDepth(400),
      outline: this.add
        .image(this.cameras.main.width - 10, 30, "bossLifebar-outline")
        .setOrigin(1, 0)
        .setScrollFactor(0)
        .setDepth(400),
    };
    this.bossLifebar.crop = new Phaser.Geom.Rectangle(0, 0, 91, 12);
    this.bossLabel = this.add
      .bitmapText(this.cameras.main.width - 10, 44, "tempFont", "CANNING COLOSSUS", 8)
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(400)
      .setTintFill(0xff8fb3);

    // A couple of seed pickups so the Seedcaster has a role here
    new SeedAmmoPickup(this, 40, 120);
    new SeedAmmoPickup(this, 386, 120);

    LevelCommon.registerStage(this, 0);
    LevelCommon.unlockRocketAxe(this);
    this._showTitleCard();

    const ui = this.scene.get("UIScene");
    if (ui && ui.setWeapon) ui.setWeapon(this.jammy.currentWeapon);
  }

  update() {
    this.jammy.update();
    this.enemies.getChildren().forEach((e) => {
      if (e.update) e.update();
    });
    const boss = this.boss;
    if (boss && boss.active) {
      const hp = Math.max(0, boss.hp);
      this.bossLifebar.crop.width = Math.round((91 / boss.maxHP) * hp);
      this.bossLifebar.guts.setCrop(this.bossLifebar.crop);
    }
  }

  onBossPhase(phase) {
    if (phase === 2) {
      this.bossLabel.setText("THE JAM INSIDE");
      const t = this.add
        .bitmapText(213, 100, "tempFont", "IT'S LOOSE!", 14)
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(300)
        .setTintFill(0xff6a9a);
      this.tweens.add({ targets: t, alpha: 0, delay: 1100, duration: 400, onComplete: () => t.destroy() });
    }
  }

  bossDefeated() {
    if (this._changing) return;
    this.jammy.invincible = true;
    this.enemyProjectiles.getChildren().forEach((p) => p.destroy());
    const run = getRunState();
    if (run) run.bossesBeaten = (run.bossesBeaten || 0) + 1;
    this.time.delayedCall(2000, () => {
      LevelCommon.finishStage(this, "CutSceneBaronPectin");
    });
  }

  // 27x15 arena: brick shell, floor at row 12, two low girder steps
  _buildArena() {
    const W = 27, H = 15;
    const E = -1, BRICK = 1, STAIN = 2, GIRDER = 3, PIPE = 4;
    const grid = Array.from({ length: H }, () => Array(W).fill(E));
    const fill = (c0, r0, c1, r1, t) => {
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) grid[r][c] = t;
    };
    fill(0, 0, W - 1, 1, BRICK);
    fill(0, 0, 0, H - 1, BRICK);
    fill(W - 1, 0, W - 1, H - 1, BRICK);
    fill(0, 12, W - 1, 14, BRICK);
    for (let c = 1; c < W - 1; c++) if ((c * 7) % 5 === 0) grid[12][c] = STAIN;
    fill(1, 2, 1, 11, PIPE);
    fill(W - 2, 2, W - 2, 11, PIPE);
    // Side steps so Jammy can get height to shoot the jar
    fill(2, 10, 4, 10, GIRDER);
    fill(W - 5, 10, W - 3, 10, GIRDER);

    const map = this.make.tilemap({ data: grid, tileWidth: 16, tileHeight: 16 });
    const tiles = map.addTilesetImage("factory-tiles");
    this.map = map;
    this.groundLayer = map.createLayer(0, tiles, 0, 0);
    this.groundLayer.setCollision([BRICK, STAIN, GIRDER, PIPE]);
  }

  _paintBackground() {
    const w = this.map.widthInPixels;
    // Big round window, conveyor of sealed jars along the back wall
    const win = this.add.container(213, 80).setDepth(-30);
    win.add(this.add.circle(0, 0, 44, 0x2a1838));
    win.add(this.add.circle(0, 0, 38, 0x412a52));
    win.add(this.add.circle(0, 0, 34, 0x180c26));
    win.add(this.add.rectangle(0, 0, 68, 3, 0x2a1838));
    win.add(this.add.rectangle(0, 0, 3, 68, 0x2a1838));
    win.add(this.add.circle(0, 0, 32, 0xeab0d0, 0.1));
    // Shelves of canned Zomberries — the factory's output
    for (let row = 0; row < 2; row++) {
      const y = 120 + row * 34;
      this.add.rectangle(w / 2, y + 12, w - 40, 3, 0x32204a).setDepth(-20);
      for (let x = 30; x < w - 20; x += 24) {
        if (Math.abs(x - 213) < 50 && row === 0) continue;
        const jar = this.add.container(x, y).setDepth(-20);
        jar.add(this.add.rectangle(0, 2, 12, 16, 0x5d6680, 0.5));
        jar.add(this.add.rectangle(0, 5, 10, 9, (x * 7) % 3 === 0 ? 0xc23a66 : 0x4060e0, 0.8));
        jar.add(this.add.rectangle(0, -6, 14, 3, 0x8c96b0));
      }
    }
    // Warm glow from below
    const glow = this.add.rectangle(w / 2, 200, w, 40, 0xff4d7a, 0.08).setDepth(3);
    this.tweens.add({ targets: glow, alpha: 0.03, duration: 900, yoyo: true, repeat: -1 });
  }

  _showTitleCard() {
    const t1 = this.add
      .bitmapText(213, 92, "tempFont", "STAGE 1-5", 16)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(300)
      .setTintFill(0xffd9e8);
    const t2 = this.add
      .bitmapText(213, 114, "tempFont", "THE CANNING FLOOR", 12)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(300)
      .setTintFill(0xff8fb3);
    this.tweens.add({
      targets: [t1, t2],
      alpha: 0,
      delay: 1700,
      duration: 600,
      onComplete: () => {
        t1.destroy();
        t2.destroy();
      },
    });
  }
}
