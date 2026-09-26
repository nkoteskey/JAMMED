// Stage 4-1 — STADIUM OF LOVE. The finale, from the Trello board.
//
// Concentrate's own arena, sold out, every screen in the city carrying
// it. Jammy comes in through the service tunnel past their security,
// walks out onto the stage, and the last fight isn't a fight: it's a
// set. The Raisin plays a phrase, you play it back — the board's
// "circles pressed in certain orders like guitar hero but side
// scrolling" — and the crowd decides who they came to see.
class Stage4_1 extends Phaser.Scene {
  constructor() { super({ key: "Stage4_1" }); }
  preload() { scene = this; }

  create() {
    this.sound.stopAll();
    if (typeof Chip !== "undefined") Chip.stop();
    Chip.play("stadium");

    if (typeof SeedOfDestruction !== "undefined") SeedOfDestruction.ensureTexture(this);
    this.cameras.main.setBackgroundColor("#0b0716");

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

    initCheckpoints(this, [[620, 192], [1240, 192]], 192);
    setupPlatformerCamera(this, this.jammy, {});
    this.cameras.main.setBounds(0, -160, this.map.widthInPixels, 240 + 160);

    this.physics.add.overlap(this.jammy.sprite, this.collectibles, (j, c) => c.effect());
    this.physics.add.collider(this.jammy.sprite, this.groundLayer);
    this.physics.add.collider(this.jammy.sprite, this.deathBlocksLayer, () =>
      this.jammy.instantDeath());
    this.physics.add.collider(this.collectibles, this.groundLayer);
    this.physics.add.collider(this.enemies, this.groundLayer);
    this.physics.add.collider(this.enemies, this.enemyStopBlocksLayer);

    // Their security on the way in
    [360, 780, 1120, 1520].forEach((x) => new TinSoldier(this, x, 170));
    [[560, 96], [1340, 96]].forEach(([x, y]) => new CannerDrone(this, x, y));
    [[900, 112], [1700, 112]].forEach(([x, y]) => new StaticWasp(this, x, y));

    [[140, 168], [700, 118], [1050, 168], [1420, 116], [1860, 168]]
      .forEach(([x, y]) => new BreadToken(this, x, y));
    new RoyaltyScrap(this, 980, 166, "TONIGHT ONLY - SOLD OUT - ARTIST FEE: 0");
    new SeedAmmoPickup(this, 1180, 150);
    const heal = new PowerUp(this, 1760, 150);
    heal.setData("powerUpType", "heal");
    heal.val = 2;

    this.blubert = new Blubert(this, this.jammy);
    this.blubertRevivesLeft = 1;

    ensureX0XTexture(this);
    addX0XTag(this, 300, 214, { depth: 2 });
    new AntSecret(this, 700, 84);

    this.murmur = new Murmur(this);
    this.murmur.addTrigger(90, "service tunnel. theyre already playing");
    this.murmur.addTrigger(700, "every screen in the city is carrying this show");
    this.murmur.addTrigger(1500, "the stage is past the barrier. dont fight him. play");

    this._showTitleCard();

    this._phase = "approach";
    this._raisinHp = 3;
    this._crowd = 0.55;      // 0 = their crowd, 1 = yours
    this._changing = false;

    const ui = this.scene.get("UIScene");
    if (ui && ui.setWeapon) ui.setWeapon(this.jammy.currentWeapon);
    if (ui && ui.setBread) ui.setBread(BreadToken.collectedIn(this), this._breadTotal || 5);
    if (ui && ui.setAnts) ui.setAnts(AntSecret.count(), AntSecret.TOTAL);
  }

  update() {
    if (this._phase === "duel") {
      // Movement is locked during the set — and Jammy's A/D handlers
      // fire on the same keys as the note lanes, so neutralise them
      // rather than trusting controlsEnabled.
      const j = this.jammy;
      j.leftIsDown = false; j.rightIsDown = false;
      j.walkingLeft = false; j.walkingRight = false;
      if (j.sprite.body) j.sprite.body.setVelocityX(0);
      if (this.duel) this.duel.update();
      return;
    }

    this.jammy.update();
    updatePlatformerCamera(this, this.jammy);
    updateForegroundProps(this, this.jammy);
    updateX0XTags(this, this.jammy);
    if (this.blubert) this.blubert.update();
    this.enemies.getChildren().forEach((e) => { if (e.update) e.update(); });
    if (this.murmur) this.murmur.update(this.jammy.sprite.x);

    if (this._phase === "approach" && this.jammy.sprite.x > 1980) {
      this._beginShow();
    }
  }

  tryReviveBlubert() {
    if (this.blubert || !this.jammy || (this.blubertRevivesLeft || 0) <= 0) return;
    this.blubertRevivesLeft -= 1;
    this.blubert = new Blubert(this, this.jammy);
  }

  // ------------------------------------------------------------------
  _buildTilesetTexture() {
    if (this.textures.exists("stadium-tiles")) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const o = (i) => i * 16;
    // 1: painted concourse block
    g.fillStyle(0x241a3a, 1); g.fillRect(o(1), 0, 16, 16);
    g.fillStyle(0x2f2350, 1); g.fillRect(o(1) + 1, 1, 14, 14);
    g.fillStyle(0x3d2f68, 1); g.fillRect(o(1) + 1, 1, 14, 2);
    // 2: concourse floor
    g.fillStyle(0x1c1430, 1); g.fillRect(o(2), 0, 16, 16);
    g.fillStyle(0x342a55, 1); g.fillRect(o(2), 0, 16, 4);
    g.fillStyle(0x4a3c72, 1); g.fillRect(o(2), 0, 16, 1);
    g.fillStyle(0x140e26, 1); g.fillRect(o(2) + 7, 4, 2, 12);
    // 3: stage deck (blonde ply, taped)
    g.fillStyle(0x8a6a3e, 1); g.fillRect(o(3), 0, 16, 16);
    g.fillStyle(0xab8850, 1); g.fillRect(o(3), 0, 16, 4);
    g.fillStyle(0x6a5030, 1); g.fillRect(o(3) + 7, 0, 1, 16);
    g.fillStyle(0x2a2233, 1); g.fillRect(o(3) + 2, 9, 12, 2);
    // 4: steel truss
    g.fillStyle(0x3a4058, 1); g.fillRect(o(4), 0, 16, 16);
    g.fillStyle(0x5a6280, 1); g.fillRect(o(4), 2, 16, 3);
    g.fillRect(o(4), 11, 16, 3);
    g.fillStyle(0x2a3048, 1);
    g.fillRect(o(4) + 2, 5, 3, 6); g.fillRect(o(4) + 11, 5, 3, 6);
    // 5: crowd barrier
    g.fillStyle(0x4a4256, 1); g.fillRect(o(5), 0, 16, 16);
    g.fillStyle(0x6d6382, 1); g.fillRect(o(5), 1, 16, 3);
    g.fillRect(o(5), 8, 16, 3);
    g.fillStyle(0x322c40, 1); g.fillRect(o(5) + 6, 3, 4, 13);
    // 6: pit (deadly) — under the stage
    g.fillStyle(0x0a0614, 1); g.fillRect(o(6), 0, 16, 16);
    g.fillStyle(0x140c22, 1); g.fillRect(o(6), 0, 16, 2);
    g.generateTexture("stadium-tiles", 7 * 16, 16);
    g.destroy();
  }

  _buildLevel() {
    const W = 200, H = 15;
    const E = -1, WALL = 1, FLOOR = 2, DECK = 3, TRUSS = 4, RAIL = 5, PIT = 6;
    const grid = () => Array.from({ length: H }, () => Array(W).fill(E));
    const ground = grid(), death = grid(), stops = grid(), change = grid();
    const fill = (g, c0, r0, c1, r1, t) => {
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) g[r][c] = t;
    };

    fill(ground, 0, 0, 1, H - 1, WALL);
    fill(ground, W - 2, 0, W - 1, H - 1, WALL);
    fill(ground, 0, 0, W - 1, 1, WALL);          // concourse ceiling

    // Service tunnel floor, with two service pits to cross
    this.floors = [[2, 44], [50, 96], [102, 118]];
    this.floors.forEach(([a, b]) => {
      fill(ground, a, 12, b, 12, FLOOR);
      fill(ground, a, 13, b, 14, WALL);
    });
    this.pits = [[45, 49], [97, 101]];
    this.pits.forEach(([a, b]) => fill(death, a, 13, b, 14, PIT));

    // Truss platforms overhead in the tunnel
    fill(ground, 20, 8, 27, 8, TRUSS);
    fill(ground, 60, 7, 68, 7, TRUSS);
    fill(ground, 84, 9, 92, 9, TRUSS);

    // The barrier, then the stage deck itself — a wide flat arena
    fill(ground, 119, 10, 120, 11, RAIL);
    fill(ground, 121, 12, 197, 12, DECK);
    fill(ground, 121, 13, 197, 14, WALL);
    // riser at the back of the stage
    fill(ground, 176, 10, 190, 10, DECK);

    const mk = (data) => {
      const map = this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 });
      return { map, layer: map.createLayer(0, map.addTilesetImage("stadium-tiles"), 0, 0) };
    };
    const gnd = mk(ground);
    this.map = gnd.map;
    this.groundLayer = gnd.layer;
    this.groundLayer.setCollision([WALL, FLOOR, DECK, TRUSS, RAIL]);
    const d = mk(death);
    this.deathBlocksLayer = d.layer;
    this.deathBlocksLayer.setDepth(3);
    this.deathBlocksLayer.setCollision([PIT]);
    const st = mk(stops);
    this.enemyStopBlocksLayer = st.layer;
    this.enemyStopBlocksLayer.setAlpha(0);
    const c = mk(change);
    this.sceneChangeLayer = c.layer;
    this.sceneChangeLayer.setAlpha(0);
  }

  _paintBackground() {
    const w = this.map.widthInPixels;
    [[0, 70, 0x0b0716], [70, 130, 0x140c26], [130, 240, 0x1c1234]]
      .forEach(([y0, y1, c]) =>
        this.add.rectangle(213, (y0 + y1) / 2, 426, y1 - y0, c)
          .setScrollFactor(0).setDepth(-40));

    // Concourse: strip lights and doorways
    for (let x = 0; x < 2000; x += 120) {
      this.add.rectangle(x, 28, 60, 4, 0x6a5cc0, 0.4)
        .setScrollFactor(0.3, 1).setDepth(-30);
      this.add.rectangle(x + 40, 130, 34, 60, 0x0f0a1e)
        .setScrollFactor(0.3, 1).setDepth(-31);
    }

    // Speaker stacks flanking the stage
    [1990, 3160].forEach((x) => {
      for (let i = 0; i < 4; i++) {
        this.add.rectangle(x, 168 - i * 26, 44, 24, 0x171024).setDepth(4);
        this.add.circle(x, 168 - i * 26, 8, 0x2a2038).setDepth(5);
        this.add.circle(x, 168 - i * 26, 3, 0x0d0916).setDepth(5);
      }
    });

    addForegroundProps(this, "works", { step: 520 });
  }

  // The arena is a fixed-camera set piece, so everything in it is
  // screen-fixed. Parallax layers positioned in world space do not
  // line up once the camera stops following and pans.
  _buildArenaSet() {
    const F = (o) => o.setScrollFactor(0);

    // Tiered bowl behind the stage
    this.crowdDots = [];
    for (let tier = 0; tier < 4; tier++) {
      const y = 92 - tier * 15;
      const shade = [0x2a1f46, 0x32254f, 0x3a2b5c, 0x433166][tier];
      F(this.add.rectangle(213, y, 426, 15, shade)).setDepth(200 + tier);
      for (let i = 0; i < 22; i++) {
        const d = F(this.add.circle(8 + i * 20 + (tier % 2) * 10, y - 3, 2.3,
          tier > 1 ? 0x6d5f9c : 0x554a7e)).setDepth(206 + tier);
        this.crowdDots.push({ o: d, base: y - 3, ph: Math.random() * 6.28 });
      }
    }
    // Stage deck line the two of them stand on
    F(this.add.rectangle(213, 110, 426, 8, 0x8a6a3e)).setDepth(214);
    F(this.add.rectangle(213, 107, 426, 2, 0xab8850)).setDepth(215);

    // Jumbotron
    F(this.add.rectangle(213, 36, 176, 46, 0x0a0712)).setDepth(216);
    this.jumbo = F(this.add.rectangle(213, 36, 168, 38, 0x1d2b52)).setDepth(217);
    this.jumboText = F(this.add.bitmapText(213, 25, "tempFont", "TONIGHT", 10)
      .setOrigin(0.5)).setTintFill(0x7fe8e0).setDepth(218);
    this.jumboSub = F(this.add.bitmapText(213, 41, "tempFont", "STADIUM OF LOVE", 8)
      .setOrigin(0.5)).setTintFill(0xeef8f6).setDepth(218);
    this.tweens.add({ targets: this.jumbo, fillAlpha: 0.7,
      duration: 1400, yoyo: true, repeat: -1 });

    // Rig lamps sweeping the stage
    for (let i = 0; i < 5; i++) {
      const x = 42 + i * 86;
      F(this.add.rectangle(x, 14, 44, 6, 0x2a3048)).setDepth(216);
      const lamp = F(this.add.circle(x, 20, 4, 0xffe9a8, 0.9)).setDepth(216);
      const beam = F(this.add.triangle(0, 0, x, 22, x - 28, 112, x + 28, 112,
        0xffe9a8, 0.06)).setDepth(203);
      this.tweens.add({ targets: [lamp, beam], alpha: { from: 0.9, to: 0.2 },
        duration: 800 + i * 140, yoyo: true, repeat: -1 });
    }

    // Scrim below the deck: the world tilemap is still behind all of
    // this and its planks read as floating debris under the lanes.
    F(this.add.rectangle(213, 180, 426, 124, 0x0a0714, 0.92)).setDepth(214);

    // Crowd sway
    this.time.addEvent({
      delay: 60, loop: true,
      callback: () => {
        const t = this.time.now / 320;
        this.crowdDots.forEach((c) => { c.o.y = c.base + Math.sin(t + c.ph) * 2; });
      },
    });
  }

  // ------------------------------------------------------------------
  _beginShow() {
    this._phase = "intro";
    this.jammy.controlsEnabled = false;
    this.jammy.sprite.body.setVelocityX(0);
    this.cameras.main.stopFollow();
    this.cameras.main.setScroll(2540, 0);
    Chip.play("duel");

    this._buildArenaSet();
    const ui = this.scene.get("UIScene");
    if (ui && ui.setDuelMode) ui.setDuelMode(true);
    if (this.jammy.gamepad && this.jammy.gamepad.setVisible) {
      this.jammy.gamepad.setVisible(false);
    }

    // Both performers are screen-fixed stand-ins. The real Jammy has a
    // physics body that belongs to the world; moving it into screen
    // space just gets it resolved against level geometry.
    this.jammy.sprite.setVisible(false);
    if (this.jammy.sprite.body) this.jammy.sprite.body.setEnable(false);
    if (this.blubert && this.blubert.sprite) this.blubert.sprite.setVisible(false);
    this.jammyStage = this.add.sprite(92, 94, "jammy", "resting-right2")
      .setScrollFactor(0).setScale(1.5).setDepth(220);
    this.jammyStage.play("resting-right");

    if (!this.textures.exists("the-raisin")) this._raisinTexture();
    this.raisin = this.add.image(338, 86, "the-raisin")
      .setScrollFactor(0).setScale(2.0).setDepth(220).setAlpha(0);
    this.tweens.add({ targets: this.raisin, alpha: 1, y: 90, duration: 700 });
    this.tweens.add({ targets: this.raisin, y: 84,
      duration: 1100, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    this.jumboText.setText("THE RAISIN");
    this.jumboSub.setText("SOLD OUT");

    const lines = [
      "RAISIN: YOU CAME ALL THIS WAY TO PLAY MY ROOM.",
      "RAISIN: THEY'RE NOT HERE FOR YOU, KID.",
      "RAISIN: LET'S LET THEM DECIDE.",
    ];
    lines.forEach((txt, i) => {
      this.time.delayedCall(900 + i * 1800, () => {
        const t = this.add.bitmapText(213, 132, "tempFont", txt, 8)
          .setOrigin(0.5).setScrollFactor(0).setDepth(380).setTintFill(0xd8d4ca);
        this.tweens.add({
          targets: t, alpha: 0, delay: 1500, duration: 300,
          onComplete: () => t.destroy(),
        });
      });
    });

    this.time.delayedCall(900 + lines.length * 1800, () => this._startDuel());
  }

  _raisinTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x3a4258, 1); g.fillRect(2, 10, 16, 14);
    g.fillStyle(0x4a5470, 1); g.fillRect(3, 11, 14, 12);
    g.fillStyle(0xeef8f6, 1); g.fillRect(8, 11, 4, 6);
    g.fillStyle(0x2ab8b0, 1); g.fillRect(9, 11, 2, 5);
    g.fillStyle(0x3e2452, 1); g.fillEllipse(10, 6, 9, 8);
    g.fillStyle(0x2a1838, 1);
    g.fillRect(7, 3, 5, 1); g.fillRect(6, 6, 7, 1); g.fillRect(8, 8, 4, 1);
    g.fillStyle(0xffffff, 1); g.fillRect(7, 4, 2, 2); g.fillRect(11, 4, 2, 2);
    g.fillStyle(0x000000, 1); g.fillRect(8, 5, 1, 1); g.fillRect(12, 5, 1, 1);
    g.fillStyle(0xffd877, 1); g.fillRect(17, 18, 2, 2);
    g.generateTexture("the-raisin", 20, 24);
    g.destroy();
  }

  _startDuel() {
    this._phase = "duel";
    this._buildDuelHud();

    this.duel = new RhythmDuel(this, {
      bpm: 150,
      approachMs: 2000,
      laneY: [142, 163, 184, 205],
      onHit: (perfect) => {
        this._crowd = Phaser.Math.Clamp(this._crowd + (perfect ? 0.035 : 0.022), 0, 1);
        this._updateCrowd();
      },
      onMiss: () => {
        this._crowd = Phaser.Math.Clamp(this._crowd - 0.05, 0, 1);
        this._updateCrowd();
        this.cameras.main.shake(90, 0.003);
        if (this._crowd <= 0) this._loseRound();
      },
      onComplete: (r) => this._roundOver(r),
    });

    this._round = 1;
    this._playRound();
  }

  _buildDuelHud() {
    this.add.rectangle(216, 122, 232, 10, 0x0d0a16, 0.88)
      .setScrollFactor(0).setDepth(330);
    this.crowdBar = this.add.rectangle(102, 122, 0, 6, 0xffd24a)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(331);
    this.add.bitmapText(340, 122, "tempFont", "CROWD", 8)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(331).setTintFill(0xffffff);
    this.roundText = this.add.bitmapText(8, 118, "tempFont", "", 8)
      .setScrollFactor(0).setDepth(331).setTintFill(0xeef8f6);
    this._updateCrowd();
  }

  _updateCrowd() {
    if (this.crowdBar) this.crowdBar.width = 228 * this._crowd;
    // The bowl literally lights up as they come over to you
    if (this.crowdDots) {
      const lit = this._crowd > 0.7;
      this.crowdDots.forEach((c, i) => {
        if (i % 3) return;
        c.o.fillColor = lit ? 0xffd24a : (this._crowd > 0.45 ? 0x8d7ec0 : 0x554a7e);
      });
    }
  }

  // Call and response: he plays it, you play it back.
  _playRound() {
    const charts = [
      // round 1 — four notes, plain
      [[0, 2], [1, 1], [2, 0], [3, 1], [4, 2], [5, 3], [6, 2], [7, 1]],
      // round 2 — doubles and a run
      [[0, 0], [0.5, 1], [1, 2], [1.5, 3], [2, 2], [2.5, 1], [3, 0],
       [4, 3], [4.5, 2], [5, 1], [5.5, 0], [6, 1], [6.5, 2], [7, 3]],
      // round 3 — the encore
      [[0, 1], [0.5, 2], [1, 1], [1.5, 0], [2, 3], [2.5, 2], [3, 3], [3.5, 1],
       [4, 0], [4.25, 1], [4.5, 2], [4.75, 3], [5, 2], [5.5, 1], [6, 0],
       [6.5, 3], [7, 2], [7.5, 1], [8, 0], [8.5, 2], [9, 3], [9.5, 1], [10, 0]],
    ];
    const chart = charts[Math.min(this._round - 1, charts.length - 1)]
      .map(([beat, lane]) => ({ beat, lane }));

    this.roundText.setText(`ROUND ${this._round} / 3`);
    const call = this.add.bitmapText(213, 100, "tempFont",
      this._round === 3 ? "ENCORE - PLAY IT BACK" : "PLAY IT BACK", 12)
      .setOrigin(0.5).setScrollFactor(0).setDepth(380).setTintFill(0xffd24a);
    this.tweens.add({
      targets: call, alpha: 0, delay: 1000, duration: 400,
      onComplete: () => call.destroy(),
    });

    this.duel.hits = 0; this.duel.misses = 0; this.duel.combo = 0;
    this.duel.start(chart);
  }

  _roundOver(r) {
    const ratio = r.total ? r.hits / r.total : 0;
    if (ratio < 0.5) return this._loseRound();

    this._raisinHp -= 1;
    this.cameras.main.flash(220, 255, 210, 120);
    if (this.raisin) {
      this.raisin.setTintFill(0xffffff);
      this.time.delayedCall(90, () => this.raisin && this.raisin.clearTint());
      this.tweens.add({ targets: this.raisin, x: this.raisin.x + 14,
        duration: 90, yoyo: true, repeat: 2 });
    }
    if (this._raisinHp <= 0) return this._win();

    this._round += 1;
    this.time.delayedCall(1600, () => this._playRound());
  }

  _loseRound() {
    this._phase = "lost";
    if (this.duel) this.duel.running = false;
    Chip.stop();
    const t = this.add.bitmapText(213, 150, "tempFont", "THEY WALKED OUT", 14)
      .setOrigin(0.5).setScrollFactor(0).setDepth(400).setTintFill(0xff6666);
    const s = this.add.bitmapText(213, 172, "tempFont", "PRESS ANY BUTTON TO PLAY IT AGAIN", 8)
      .setOrigin(0.5).setScrollFactor(0).setDepth(400).setTintFill(0xffffff);
    const retry = () => {
      t.destroy(); s.destroy();
      this._crowd = 0.55;
      this._raisinHp = 3;
      this._round = 1;
      this._updateCrowd();
      this._phase = "duel";
      Chip.play("duel");
      this._playRound();
    };
    this.input.keyboard.once("keydown", retry);
    this.input.once("pointerdown", retry);
  }

  _win() {
    this._phase = "won";
    if (this.duel) { this.duel.running = false; this.duel.setVisible(false); }
    Chip.play("victory");
    this.cameras.main.flash(600, 255, 240, 180);
    this._crowd = 1;
    this._updateCrowd();

    if (this.raisin) {
      this.tweens.add({
        targets: this.raisin, alpha: 0, y: this.raisin.y + 18,
        duration: 1400,
      });
    }
    this.jumboText.setText("JAMMY");
    this.jumboSub.setText("FRESH-SQUEEZED");

    const t1 = this.add.bitmapText(213, 150, "tempFont", "FRESH-SQUEEZED.", 16)
      .setOrigin(0.5).setScrollFactor(0).setDepth(400).setTintFill(0xffd877);
    const t2 = this.add.bitmapText(213, 176, "tempFont",
      "THE ROOM WAS NEVER HIS", 8)
      .setOrigin(0.5).setScrollFactor(0).setDepth(400).setTintFill(0xeef8f6);

    // The bowl goes gold
    this.crowdDots.forEach((c, i) => {
      this.time.delayedCall(i * 6, () => { c.o.fillColor = 0xffd24a; });
    });

    this.time.delayedCall(4200, () => {
      this.cameras.main.fadeOut(1000, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        clearCheckpoints(this);
        const ui2 = this.scene.get("UIScene");
        if (ui2 && ui2.setDuelMode) ui2.setDuelMode(false);
        this.scene.start("EndCredits");
      });
    });
  }

  _showTitleCard() {
    const a = this.add.bitmapText(213, 92, "tempFont", "STAGE 4-1", 16)
      .setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0xffd8e8);
    const b = this.add.bitmapText(213, 114, "tempFont", "STADIUM OF LOVE", 12)
      .setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0xff9ac0);
    this.tweens.add({
      targets: [a, b], alpha: 0, delay: 1800, duration: 600,
      onComplete: () => { a.destroy(); b.destroy(); },
    });
  }
}
