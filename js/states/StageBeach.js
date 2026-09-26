// HIDDEN — "IS ANYBODY OUT THERE?" (the Beach, from the Trello board)
//
// Unlocked by finding all eight ANT tokens. A bonus stage with no
// enemies to kill: just flying beach balls and wind-blown umbrellas
// to evade, exactly as the board describes it. Bright, warm, and the
// only place in the game where nothing is wrong underneath.
class StageBeach extends Phaser.Scene {
  constructor() { super({ key: "StageBeach" }); }
  preload() { scene = this; }

  create() {
    this.sound.stopAll();
    if (typeof Chip !== "undefined") Chip.stop();
    Chip.play("beach");

    if (typeof SeedOfDestruction !== "undefined") SeedOfDestruction.ensureTexture(this);
    this.cameras.main.setBackgroundColor("#7fd4f0");

    this._buildTilesetTexture();
    this._buildLevel();
    this._paintBackground();

    this.bullets = this.physics.add.group();
    this.collectibles = this.physics.add.group();
    this._breadTotal = 0;
    this.enemies = this.add.group();
    this.enemyProjectiles = this.physics.add.group();

    const sp = checkpointSpawn(this, 56, 150);
    this.jammy = new Jammy(sp.x, sp.y);
    this.jammy.sprite.setDepth(100);
    this.jammy.controlsEnabled = true;
    this.children.bringToTop(this.jammy.sprite);

    initCheckpoints(this, [[900, 192], [1800, 192]], 192);
    setupPlatformerCamera(this, this.jammy, {});
    this.cameras.main.setBounds(0, -140, this.map.widthInPixels, 240 + 140);

    this.physics.add.overlap(this.jammy.sprite, this.collectibles, (j, c) => c.effect());
    this.physics.add.collider(this.jammy.sprite, this.groundLayer);
    this.physics.add.collider(this.jammy.sprite, this.deathBlocksLayer, () =>
      this.jammy.instantDeath());
    this._changing = false;
    this.physics.add.collider(this.jammy.sprite, this.sceneChangeLayer, () => this.changeScene());
    this.physics.add.collider(this.collectibles, this.groundLayer);

    this._buildHazards();

    [[420, 150], [980, 120], [1480, 150], [2050, 116], [2560, 150]]
      .forEach(([x, y]) => new BreadToken(this, x, y));

    this.murmur = new Murmur(this);
    this.murmur.addTrigger(90, "you found every last one of them. the ants said take the day");
    this.murmur.addTrigger(900, "nothing to shoot out here. just dont get flattened");
    this.murmur.addTrigger(2300, "is anybody out there? turns out yes");

    this._buildEnd();
    this._showTitleCard();

    // Anything already killed stays killed across a checkpoint respawn
    trackEnemyDeaths(this);

    const ui = this.scene.get("UIScene");
    if (ui && ui.setWeapon) ui.setWeapon(this.jammy.currentWeapon);
    if (ui && ui.setBread) ui.setBread(BreadToken.collectedIn(this), this._breadTotal || 5);
    if (ui && ui.setAnts) ui.setAnts(AntSecret.count(), AntSecret.TOTAL);
  }

  update() {
    this.jammy.update();
    updatePlatformerCamera(this, this.jammy);
    if (this.murmur) this.murmur.update(this.jammy.sprite.x);
    if (this.hazards) this.hazards.forEach((h) => h.update());
  }

  tryReviveBlubert() {}

  _buildTilesetTexture() {
    if (this.textures.exists("beach-tiles")) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const o = (i) => i * 16;
    // 1: sand surface
    g.fillStyle(0xf0dca0, 1); g.fillRect(o(1), 0, 16, 16);
    g.fillStyle(0xfff0c8, 1); g.fillRect(o(1), 0, 16, 3);
    g.fillStyle(0xd8bc80, 1);
    g.fillRect(o(1) + 3, 6, 5, 1); g.fillRect(o(1) + 9, 11, 4, 1);
    g.fillStyle(0xffffff, 1); g.fillRect(o(1) + 11, 1, 2, 1);
    // 2: sand with a shell
    g.fillStyle(0xf0dca0, 1); g.fillRect(o(2), 0, 16, 16);
    g.fillStyle(0xfff0c8, 1); g.fillRect(o(2), 0, 16, 3);
    g.fillStyle(0xff9ab8, 1); g.fillRect(o(2) + 5, 0, 4, 3);
    g.fillStyle(0xffd0e0, 1); g.fillRect(o(2) + 6, 1, 2, 1);
    // 3: packed wet sand
    g.fillStyle(0xd8bc80, 1); g.fillRect(o(3), 0, 16, 16);
    g.fillStyle(0xc0a468, 1);
    g.fillRect(o(3) + 2, 4, 5, 2); g.fillRect(o(3) + 9, 10, 5, 2);
    // 4: boardwalk plank
    g.fillStyle(0xb08040, 1); g.fillRect(o(4), 0, 16, 8);
    g.fillStyle(0xd0a060, 1); g.fillRect(o(4), 0, 16, 2);
    g.fillStyle(0x8a5f30, 1); g.fillRect(o(4) + 7, 0, 1, 8);
    g.fillRect(o(4), 8, 16, 2);
    // 5: sea (deadly — the undertow)
    g.fillStyle(0x2f9ad8, 1); g.fillRect(o(5), 0, 16, 16);
    g.fillStyle(0x7fd4f0, 1); g.fillRect(o(5), 0, 16, 3);
    g.fillStyle(0xffffff, 1); g.fillRect(o(5) + 3, 0, 4, 1);
    g.fillRect(o(5) + 10, 2, 3, 1);
    // 6: deep sea
    g.fillStyle(0x1d6ea8, 1); g.fillRect(o(6), 0, 16, 16);
    g.fillStyle(0x15588a, 1); g.fillRect(o(6) + 4, 6, 5, 2);
    g.generateTexture("beach-tiles", 7 * 16, 16);
    g.destroy();
  }

  _buildLevel() {
    const W = 190, H = 15;
    const E = -1, SAND = 1, SHELL = 2, WET = 3, PLANK = 4, SEA = 5, DEEP = 6;
    const grid = () => Array.from({ length: H }, () => Array(W).fill(E));
    const ground = grid(), death = grid(), stops = grid(), change = grid();
    const fill = (g, c0, r0, c1, r1, t) => {
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) g[r][c] = t;
    };
    fill(ground, 0, 0, 1, H - 1, SAND);
    fill(ground, W - 2, 0, W - 1, H - 1, SAND);

    this.floors = [[2, 46], [52, 96], [102, 146], [152, 187]];
    this.floors.forEach(([a, b]) => {
      for (let c = a; c <= b; c++) {
        ground[12][c] = (c * 5) % 13 === 0 ? SHELL : SAND;
        ground[13][c] = WET; ground[14][c] = WET;
      }
    });
    // Tide channels between the sand bars
    this.channels = [[47, 51], [97, 101], [147, 151]];
    this.channels.forEach(([a, b]) => {
      fill(death, a, 13, b, 13, SEA);
      fill(death, a, 14, b, 14, DEEP);
    });
    // Boardwalk sections to hop
    fill(ground, 22, 9, 30, 9, PLANK);
    fill(ground, 60, 8, 68, 8, PLANK);
    fill(ground, 112, 9, 120, 9, PLANK);
    fill(ground, 160, 8, 168, 8, PLANK);

    fill(change, 183, 4, 184, 11, SAND);

    const mk = (data) => {
      const map = this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 });
      return { map, layer: map.createLayer(0, map.addTilesetImage("beach-tiles"), 0, 0) };
    };
    const gnd = mk(ground);
    this.map = gnd.map;
    this.groundLayer = gnd.layer;
    this.groundLayer.setCollision([SAND, SHELL, WET, PLANK]);
    const d = mk(death);
    this.deathBlocksLayer = d.layer;
    this.deathBlocksLayer.setDepth(3);
    this.deathBlocksLayer.setCollision([SEA, DEEP]);
    const s = mk(stops);
    this.enemyStopBlocksLayer = s.layer;
    this.enemyStopBlocksLayer.setAlpha(0);
    const c = mk(change);
    this.sceneChangeLayer = c.layer;
    this.sceneChangeLayer.setAlpha(0);
    this.sceneChangeLayer.setCollision([SAND]);
  }

  _paintBackground() {
    const w = this.map.widthInPixels;
    [[0, 70, 0x63c8ec], [70, 120, 0x8fdcf4], [120, 240, 0xb8ecf8]]
      .forEach(([y0, y1, c]) =>
        this.add.rectangle(213, (y0 + y1) / 2, 426, y1 - y0, c)
          .setScrollFactor(0).setDepth(-40));
    // Sun
    this.add.circle(340, 46, 26, 0xfff0b0).setScrollFactor(0.1, 1).setDepth(-36);
    this.add.circle(340, 46, 34, 0xfff8d8, 0.35).setScrollFactor(0.1, 1).setDepth(-37);
    // Sea horizon behind the sand
    this.add.rectangle(213, 156, 426, 44, 0x2f9ad8).setScrollFactor(0).setDepth(-34);
    this.add.rectangle(213, 135, 426, 3, 0x7fd4f0).setScrollFactor(0).setDepth(-33);
    // Whitecaps ride a slow parallax across the whole map width
    for (let i = 0; i * 44 < w; i++) {
      this.add.rectangle(i * 44, 142 + (i % 3) * 6, 20, 2, 0xffffff, 0.75)
        .setScrollFactor(0.25, 1).setDepth(-33);
    }
    // Clouds and gulls
    Cloud.ensureTextures(this);
    for (let x = 80; x < w; x += 260) {
      this.add.image(x, 40 + (Math.floor(x / 260) % 3) * 16,
        "pixel-cloud-" + (1 + (Math.floor(x / 260) % 2)))
        .setScrollFactor(0.3, 1).setDepth(-30);
    }
    for (let i = 0; i < 6; i++) {
      const gx = 120 + i * 190, gy = 60 + (i % 3) * 18;
      const gull = this.add.container(gx, gy).setScrollFactor(0.4, 1).setDepth(-28);
      const l = this.add.rectangle(-4, 0, 7, 2, 0xffffff);
      const r = this.add.rectangle(4, 0, 7, 2, 0xffffff);
      gull.add([l, r]);
      this.tweens.add({ targets: [l, r], angle: { from: -18, to: 14 },
        duration: 700 + i * 90, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      this.tweens.add({ targets: gull, x: gx + 90, y: gy - 10,
        duration: 7000 + i * 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
  }

  // Beach balls and wind-blown umbrellas — the board's two hazards.
  // Neither can be killed; they're all evasion.
  _buildHazards() {
    if (!this.textures.exists("beach-ball")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      const cols = [0xff4d6a, 0xffd066, 0x4fa8f0, 0xffffff];
      for (let i = 0; i < 4; i++) {
        g.fillStyle(cols[i], 1);
        g.slice(11, 11, 11, Phaser.Math.DegToRad(i * 90), Phaser.Math.DegToRad((i + 1) * 90));
        g.fillPath();
      }
      g.fillStyle(0xffffff, 1); g.fillCircle(11, 11, 3);
      g.lineStyle(1, 0xc8385a, 1); g.strokeCircle(11, 11, 10);
      g.generateTexture("beach-ball", 22, 22);
      g.destroy();

      const u = this.make.graphics({ x: 0, y: 0, add: false });
      u.fillStyle(0xff4d6a, 1);
      u.slice(16, 16, 15, Math.PI, 0); u.fillPath();
      u.fillStyle(0xffffff, 1);
      u.slice(16, 16, 15, Math.PI * 1.25, Math.PI * 1.5); u.fillPath();
      u.slice(16, 16, 15, Math.PI * 1.75, Math.PI * 2); u.fillPath();
      u.fillStyle(0x8a5f30, 1); u.fillRect(15, 14, 2, 18);
      u.generateTexture("beach-umbrella", 32, 32);
      u.destroy();
    }

    this.hazards = [];

    // Bouncing beach balls
    [360, 700, 1120, 1560, 1980, 2400].forEach((x, i) => {
      const ball = this.physics.add.sprite(x, 120, "beach-ball");
      ball.setDepth(60);
      ball.body.setCircle(11);
      ball.body.setBounce(1, 1);
      ball.body.setAllowGravity(true);
      ball.body.setVelocity(i % 2 === 0 ? 70 : -70, -140);
      this.physics.add.collider(ball, this.groundLayer);
      this.physics.add.overlap(ball, this.jammy.sprite, () => {
        if (this.jammy.alive) this.jammy.takeDamage();
      });
      this.hazards.push({
        update: () => {
          if (!ball.active) return;
          ball.rotation += ball.body.velocity.x * 0.0004;
          // Keep them lively — a stalled ball is no hazard
          if (Math.abs(ball.body.velocity.x) < 40) {
            ball.body.setVelocityX(ball.body.velocity.x >= 0 ? 70 : -70);
          }
          if (ball.body.blocked.down) ball.body.setVelocityY(-190);
          if (ball.y > 230) { ball.setPosition(x, 80); ball.body.setVelocity(70, 0); }
        },
      });
    });

    // Umbrellas tumbling in on the wind, right to left
    this.time.addEvent({
      delay: 3200, loop: true,
      callback: () => {
        const cam = this.cameras.main;
        const um = this.physics.add.sprite(cam.scrollX + 450,
          150 + Math.random() * 30, "beach-umbrella");
        um.setDepth(61);
        um.body.setAllowGravity(false);
        um.body.setSize(22, 22);
        um.body.setVelocityX(-(110 + Math.random() * 60));
        const ov = this.physics.add.overlap(um, this.jammy.sprite, () => {
          if (this.jammy.alive) this.jammy.takeDamage();
        });
        this.tweens.add({ targets: um, angle: 360, duration: 1400, repeat: -1 });
        this.tweens.add({ targets: um, y: um.y - 26, duration: 900,
          yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        this.time.delayedCall(9000, () => {
          if (ov) ov.destroy();
          if (um.active) um.destroy();
        });
      },
    });
  }

  _buildEnd() {
    const x = 2930;
    this.add.rectangle(x, 150, 6, 84, 0x8a5f30).setDepth(2);
    this.add.rectangle(x + 18, 118, 34, 24, 0xff4d6a).setDepth(2);
    this.add.bitmapText(x, 92, "tempFont", "HOME", 8)
      .setOrigin(0.5).setTintFill(0xffffff).setDepth(2);
  }

  _showTitleCard() {
    const a = this.add.bitmapText(213, 92, "tempFont", "HIDDEN STAGE", 16)
      .setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0xffffff);
    const b = this.add.bitmapText(213, 114, "tempFont", "IS ANYBODY OUT THERE?", 12)
      .setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0xfff0b0);
    this.tweens.add({
      targets: [a, b], alpha: 0, delay: 1900, duration: 600,
      onComplete: () => { a.destroy(); b.destroy(); },
    });
  }

  changeScene() {
    if (this._changing) return;
    this._changing = true;
    clearCheckpoints(this);
    this.jammy.controlsEnabled = false;
    this.cameras.main.fadeOut(600, 255, 255, 255);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("StageSelect"));
  }
}
