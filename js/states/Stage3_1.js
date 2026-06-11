// Stage 3-1 — THE SIGNAL SPIRE. Concentrate HQ: the floors are
// numbered 100 down to 1, going UP — you literally climb the charts.
// Signal beams, wasp swarms and canner patrols on the way; near the
// top the broadcast starts jamming the game itself. At Floor 1:
// Echo Jammy, the Raisin in his glass lift, and HOLD THE FREQUENCY.
class Stage3_1 extends Phaser.Scene {
  constructor() {
    super({ key: "Stage3_1" });
  }

  preload() {
    scene = this;
  }

  create() {
    this.sound.stopAll();
    this.sound.play("BossBattle", { loop: true, volume: 0.75 });

    if (typeof SeedOfDestruction !== "undefined" && SeedOfDestruction.ensureTexture) {
      SeedOfDestruction.ensureTexture(this);
    }

    this.cameras.main.setBackgroundColor("#0a1218");

    this._buildTilesetTexture();
    this._buildLevel();
    this._paintBackground();

    this.bullets = this.physics.add.group();
    this.collectibles = this.physics.add.group();
    this.enemies = this.add.group();
    this.enemyProjectiles = this.physics.add.group();

    // Spawn on the lobby floor at the bottom of the tower
    this.jammy = new Jammy(60, this.map.heightInPixels - 80);
    this.jammy.sprite.setDepth(100);
    this.jammy.controlsEnabled = true;
    this.children.bringToTop(this.jammy.sprite);

    this.cameras.main.startFollow(this.jammy.sprite);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    this.physics.add.overlap(this.jammy.sprite, this.collectibles, (j, c) => c.effect());
    this.physics.add.collider(this.jammy.sprite, this.groundLayer);
    this.physics.add.collider(this.collectibles, this.groundLayer);
    this.physics.add.collider(this.enemies, this.groundLayer);

    this._buildBeams();
    this._buildClimbEnemies();
    this._buildPickups();
    this._buildFloorSigns();

    this.blubert = new Blubert(this, this.jammy);
    this.blubertRevivesLeft = 1;

    // The murmur
    ensureX0XTexture(this);
    this.murmur = new Murmur(this);
    this._saidIntro = false;

    this._bossStarted = false;
    this._holdPhase = false;
    this._won = false;
    this._nextGlitch = 0;

    this._showTitleCard();

    const ui = this.scene.get("UIScene");
    if (ui && ui.setWeapon) ui.setWeapon(this.jammy.currentWeapon);
  }

  update() {
    this.jammy.update();
    if (this.blubert) this.blubert.update();
    this.enemies.getChildren().forEach((e) => { if (e.update) e.update(); });

    const jy = this.jammy.sprite.y;

    if (!this._saidIntro) {
      this._saidIntro = true;
      this.murmur.say("the spire. floor one hundred. start climbing");
      this.murmur.say("jump, then jump again. ride the axe up");
    }

    // Beam hazards: off -> warn (blinking amber) -> on (hot red)
    if (this.beams) {
      for (const b of this.beams) {
        b.t -= this.game.loop.delta;
        if (b.t <= 0) {
          if (b.state === "off") {
            b.state = "warn";
            b.t = b.warnMs;
          } else if (b.state === "warn") {
            b.state = "on";
            b.t = b.onMs;
            b.outer.setFillStyle(0xff4d6a, 0.95);
            b.core.setFillStyle(0xffffff, 1);
            b.lamps.forEach((l) => l.setFillStyle(0xff4d6a, 1));
          } else {
            b.state = "off";
            b.t = b.offMs;
            b.outer.setFillStyle(0xff4d6a, 0.06);
            b.core.setFillStyle(0xffffff, 0);
            b.lamps.forEach((l) => l.setFillStyle(0x553333, 1));
          }
        }
        if (b.state === "warn") {
          // Fast amber blink while charging
          const blink = Math.floor(this.time.now / 90) % 2 === 0;
          b.outer.setFillStyle(0xffd877, blink ? 0.35 : 0.1);
          b.lamps.forEach((l) => l.setFillStyle(blink ? 0xffd877 : 0x553333, 1));
        }
        if (b.state === "on" && this.jammy.alive &&
            Phaser.Geom.Rectangle.Overlaps(b.outer.getBounds(), this.jammy.sprite.getBounds())) {
          this.jammy.takeDamage();
        }
      }
    }

    // Broadcast interference near the top — the game itself glitches
    if (jy < 760 && !this._won && this.time.now > this._nextGlitch) {
      this._nextGlitch = this.time.now + 1700 + Math.random() * 900;
      this._glitch();
    }

    // Boss trigger at Floor 1
    if (!this._bossStarted && jy < 360) {
      this._startBossFight();
    }

    if (this.murmur) this.murmur.update(this.jammy.sprite.x);
  }

  tryReviveBlubert() {
    if (this.blubert || !this.jammy || (this.blubertRevivesLeft || 0) <= 0) return;
    this.blubertRevivesLeft -= 1;
    this.blubert = new Blubert(this, this.jammy);
  }

  // ------------------------------------------------------------------
  _buildTilesetTexture() {
    if (this.textures.exists("spire-tiles")) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const o = (i) => i * 16;

    // 1: steel tower panel
    g.fillStyle(0x1a2630, 1);
    g.fillRect(o(1), 0, 16, 16);
    g.fillStyle(0x24343f, 1);
    g.fillRect(o(1) + 1, 1, 14, 14);
    g.fillStyle(0x314452, 1);
    g.fillRect(o(1) + 1, 1, 14, 2);
    g.fillStyle(0x101820, 1);
    g.fillRect(o(1) + 7, 1, 1, 14);

    // 2: grate platform
    g.fillStyle(0x31445e, 1);
    g.fillRect(o(2), 0, 16, 4);
    g.fillStyle(0x4a6078, 1);
    g.fillRect(o(2), 0, 16, 1);
    g.fillStyle(0x1a2630, 1);
    g.fillRect(o(2), 4, 16, 4);
    g.fillStyle(0x31445e, 1);
    g.fillRect(o(2) + 2, 4, 2, 4);
    g.fillRect(o(2) + 8, 4, 2, 4);
    g.fillRect(o(2) + 14, 4, 2, 4);

    // 3: teal accent panel
    g.fillStyle(0x14383a, 1);
    g.fillRect(o(3), 0, 16, 16);
    g.fillStyle(0x1d5a5a, 1);
    g.fillRect(o(3) + 1, 1, 14, 14);
    g.fillStyle(0x2ab8b0, 1);
    g.fillRect(o(3) + 1, 1, 14, 2);

    g.generateTexture("spire-tiles", 4 * 16, 16);
    g.destroy();
  }

  _buildLevel() {
    const W = 27, H = 160;
    const E = -1, PANEL = 1, GRATE = 2, ACCENT = 3;
    const grid = () => Array.from({ length: H }, () => Array(W).fill(E));
    const ground = grid();
    const fill = (g, c0, r0, c1, r1, t) => {
      for (let r = r0; r <= r1; r++)
        for (let c = c0; c <= c1; c++) g[r][c] = t;
    };

    // Tower shell
    fill(ground, 0, 0, 1, H - 1, PANEL);
    fill(ground, W - 2, 0, W - 1, H - 1, PANEL);
    fill(ground, 0, 0, W - 1, 1, PANEL);
    fill(ground, 2, H - 4, W - 3, H - 1, PANEL); // lobby floor
    // Accent stripes up the shaft
    for (let r = 8; r < H - 4; r += 24) {
      ground[r][0] = ACCENT; ground[r][1] = ACCENT;
      ground[r][W - 2] = ACCENT; ground[r][W - 1] = ACCENT;
    }

    // Zigzag ledges, bottom to top. 80px vertical steps — this climb
    // is the Rocket Axe's showcase: jump, then jump again to boost.
    this.ledges = [];
    let side = 0;
    for (let r = H - 10; r > 24; r -= 5) {
      if (side === 0) fill(ground, 2, r, 8, r, GRATE);
      else if (side === 1) fill(ground, 11, r, 15, r, GRATE);
      else fill(ground, 18, r, 24, r, GRATE);
      this.ledges.push({ r, side });
      side = (side + 1) % 3;
    }

    // Boss arena: a wide stage near the top with open air above
    fill(ground, 4, 20, 22, 20, GRATE);

    const map = this.make.tilemap({ data: ground, tileWidth: 16, tileHeight: 16 });
    const tiles = map.addTilesetImage("spire-tiles");
    this.map = map;
    this.groundLayer = map.createLayer(0, tiles, 0, 0);
    this.groundLayer.setCollision([PANEL, GRATE, ACCENT]);

    // Other classes (PowerUp, SeedOfDestruction) probe these layer
    // references and add colliders — give them a tile-less layer so
    // the colliders exist but never fire.
    const emptyMap = this.make.tilemap({ data: grid(), tileWidth: 16, tileHeight: 16 });
    const emptyTiles = emptyMap.addTilesetImage("spire-tiles");
    const emptyLayer = emptyMap.createLayer(0, emptyTiles, 0, 0);
    emptyLayer.setAlpha(0);
    this.deathBlocksLayer = emptyLayer;
    this.sceneChangeLayer = emptyLayer;
    this.enemyStopBlocksLayer = emptyLayer;
  }

  _paintBackground() {
    const h = this.map.heightInPixels;
    // Interior shaft glow strips + window slits with night sky
    for (let y = 80; y < h; y += 220) {
      this.add.rectangle(213, y, 280, 3, 0x2ab8b0, 0.12)
        .setScrollFactor(0.4).setDepth(-20);
    }
    for (let y = 140; y < h; y += 300) {
      this.add.rectangle(70, y, 18, 40, 0x0d2030)
        .setScrollFactor(0.6).setDepth(-19);
      this.add.rectangle(356, y + 130, 18, 40, 0x0d2030)
        .setScrollFactor(0.6).setDepth(-19);
      this.add.rectangle(70, y - 8, 4, 4, 0xffd9a0, 0.8)
        .setScrollFactor(0.6).setDepth(-18);
    }
    // Cable bundles running the full shaft
    [110, 320].forEach((x) => {
      this.add.rectangle(x, h / 2, 3, h, 0x101820)
        .setScrollFactor(0.85).setDepth(-15);
    });
  }

  _buildBeams() {
    // Signal beams across the shaft. Three readable states:
    //   off  — barely-there guide line so the lane is predictable
    //   warn — blinking amber charge-up (your cue to commit or wait)
    //   on   — hot red bar with a white core; this is the only state
    //          that damages
    this.beams = [];
    const mk = (x, y, w, onMs, offMs, phase) => {
      const outer = this.add.rectangle(x, y, w, 9, 0xff4d6a, 0.06);
      outer.setDepth(50);
      const core = this.add.rectangle(x, y, w, 3, 0xffffff, 0);
      core.setDepth(51);
      // Emitter housings with a status lamp at both ends
      [-1, 1].forEach((s) => {
        this.add.rectangle(x + s * (w / 2 + 5), y, 10, 16, 0x14383a).setDepth(52);
      });
      const lampL = this.add.rectangle(x - w / 2 - 5, y, 4, 4, 0x553333).setDepth(53);
      const lampR = this.add.rectangle(x + w / 2 + 5, y, 4, 4, 0x553333).setDepth(53);
      this.beams.push({
        outer, core, lamps: [lampL, lampR],
        state: "off", t: phase, onMs, offMs, warnMs: 550,
      });
    };
    mk(213, 2210, 330, 800, 1500, 300);
    mk(213, 1920, 330, 750, 1400, 800);
    mk(213, 1630, 330, 800, 1300, 100);
    mk(213, 1340, 330, 700, 1300, 500);
    mk(213, 1050, 330, 750, 1200, 200);
    mk(213, 700, 330, 700, 1200, 650);
    mk(213, 540, 330, 650, 1100, 50);
  }

  _buildClimbEnemies() {
    [[140, 2120], [290, 1530], [140, 950]].forEach(([x, y]) => {
      const w = new StaticWasp(this, x, y);
      w.homeX = x; w.homeY = y;
    });
    [[300, 2000], [120, 1200], [300, 620]].forEach(([x, y]) => new CannerDrone(this, x, y));
  }

  _buildPickups() {
    [
      [80, 2330], [120, 2330],
      [213, 1880], [213, 1590],
      [340, 1300], [90, 1010],
      [213, 660], [213, 470],
    ].forEach(([x, y]) => new AntToken(this, x, y));
    new RoyaltyScrap(this, 213, 2100, "TOP OF THE CHARTS. NOTHING GROWS UP HERE");
    new SeedAmmoPickup(this, 340, 1740);
    const heal = new PowerUp(this, 100, 700);
    heal.setData("powerUpType", "heal");
    heal.val = 2;
  }

  _buildFloorSigns() {
    // Floors count DOWN as you climb — this is the chart
    const signs = [
      [2480, "FLOOR 100"], [2120, "FLOOR 80"], [1760, "FLOOR 60"],
      [1400, "FLOOR 40"], [1040, "FLOOR 20"], [680, "FLOOR 10"],
      [380, "FLOOR 1"],
    ];
    signs.forEach(([y, label]) => {
      this.add.rectangle(213, y, 70, 14, 0x14383a).setDepth(2);
      this.add.bitmapText(213, y, "tempFont", label, 8)
        .setOrigin(0.5).setTintFill(0x7fe8e0).setDepth(3);
    });
    this.add.image(60, 2476, "x0x-glyph").setDepth(2);
    this.add.image(360, 700, "x0x-glyph").setDepth(2);
  }

  // Broadcast interference — brief, telegraphed, harmless but unnerving
  _glitch() {
    this.cameras.main.shake(70, 0.002);
    const flash = this.add.rectangle(213, 120, 426, 240, 0x7fe8e0, 0.05)
      .setScrollFactor(0).setDepth(380);
    this.time.delayedCall(90, () => flash.destroy());
    const ui = this.scene.get("UIScene");
    if (ui && ui.weaponLabel && !this.jammy.muted) {
      const old = ui.weaponLabel.text;
      ui.weaponLabel.setText("----");
      this.time.delayedCall(160, () => {
        if (!this.jammy.muted) ui.weaponLabel.setText(old);
      });
    }
  }

  // ------------------------------------------------------------------
  _startBossFight() {
    this._bossStarted = true;
    this.murmur.say("floor one. they grew something out of your samples");

    // Echo health bar
    this.echoBarBg = this.add.rectangle(213, 26, 204, 10, 0x101820)
      .setScrollFactor(0).setDepth(360);
    this.echoBar = this.add.rectangle(213, 26, 200, 6, 0x7fe8e0)
      .setScrollFactor(0).setDepth(361);
    this.echoLabel = this.add.bitmapText(213, 12, "tempFont", "ECHO JAMMY", 8)
      .setOrigin(0.5).setScrollFactor(0).setDepth(361).setTintFill(0x7fe8e0);

    this.echo = new EchoJammy(this, 340, 250, {
      left: 50, right: 26 * 16 - 50, floorY: 20 * 16,
    });

    this.events.once("echo-defeated", () => this._startHoldPhase());
  }

  updateEchoHealthbar(hp, maxHp) {
    if (!this.echoBar) return;
    this.echoBar.width = Math.max(0, (hp / maxHp) * 200);
  }

  _startHoldPhase() {
    if (this._holdPhase) return;
    this._holdPhase = true;
    if (this.echoBar) { this.echoBar.destroy(); this.echoBarBg.destroy(); this.echoLabel.destroy(); }

    // The Raisin descends in his glass lift. He does not fight.
    this._raisinScene(() => {
      this.murmur.say("hold the frequency. one whole song. the colony is coming");
      this._buildHoldUI();
      this._holdStart = this.time.now;
      this._holdDurationMs = 35000;
      this._spawnHoldWaves();
      if (typeof game !== "undefined" && game && game.dukeFreed) {
        this._spawnDuke();
      }
      this._holdTimer = this.time.addEvent({
        delay: 250,
        loop: true,
        callback: () => this._tickHold(),
      });
    });
  }

  _raisinScene(onDone) {
    if (!this.textures.exists("the-raisin")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      // Giant grey suit, tiny wrinkled head
      g.fillStyle(0x3a4258, 1);
      g.fillRect(2, 10, 16, 14);
      g.fillStyle(0x4a5470, 1);
      g.fillRect(3, 11, 14, 12);
      g.fillStyle(0xeef8f6, 1);
      g.fillRect(8, 11, 4, 6); // shirt
      g.fillStyle(0x2ab8b0, 1);
      g.fillRect(9, 11, 2, 5); // teal tie
      // The head: a raisin
      g.fillStyle(0x3e2452, 1);
      g.fillEllipse(10, 6, 9, 8);
      g.fillStyle(0x2a1838, 1);
      g.fillRect(7, 3, 5, 1);
      g.fillRect(6, 6, 7, 1);
      g.fillRect(8, 8, 4, 1);
      g.fillStyle(0xffffff, 1);
      g.fillRect(7, 4, 2, 2);
      g.fillRect(11, 4, 2, 2);
      g.fillStyle(0x000000, 1);
      g.fillRect(8, 5, 1, 1);
      g.fillRect(12, 5, 1, 1);
      // Gold ring
      g.fillStyle(0xffd877, 1);
      g.fillRect(17, 18, 2, 2);
      g.generateTexture("the-raisin", 20, 24);
      g.destroy();
    }

    const lift = this.add.container(213, 120);
    lift.setDepth(120);
    const box = this.add.rectangle(0, 0, 44, 56, 0xbfe8f4, 0.25);
    box.setStrokeStyle(2, 0x8c96b0, 1);
    lift.add(box);
    lift.add(this.add.rectangle(0, -30, 50, 6, 0x3a4258));
    lift.add(this.add.image(0, 8, "the-raisin"));
    lift.y = 60;
    this.tweens.add({ targets: lift, y: 200, duration: 1400, ease: "Sine.easeOut" });

    const lines = [
      "RAISIN: YOU AGAIN. EVERYONE COMES UP EVENTUALLY.",
      "RAISIN: I SQUEEZED MYSELF FIRST, KID. IT'S CALLED COMMITMENT.",
      "RAISIN: FRESH DOESN'T SCALE. SQUEEZE HIM.",
    ];
    lines.forEach((txt, i) => {
      this.time.delayedCall(1600 + i * 2100, () => {
        const t = this.add.bitmapText(213, 100, "tempFont", txt, 8)
          .setOrigin(0.5).setScrollFactor(0).setDepth(380).setTintFill(0xd8d4ca);
        this.tweens.add({
          targets: t, alpha: 0, delay: 1800, duration: 300,
          onComplete: () => t.destroy(),
        });
      });
    });

    this.time.delayedCall(1600 + lines.length * 2100, () => {
      this.tweens.add({
        targets: lift, y: 40, duration: 1200, ease: "Sine.easeIn",
        onComplete: () => lift.destroy(),
      });
      onDone();
    });
  }

  _buildHoldUI() {
    this.holdBarBg = this.add.rectangle(213, 26, 244, 12, 0x101820)
      .setScrollFactor(0).setDepth(360);
    this.holdBar = this.add.rectangle(213 - 120, 26, 0, 8, 0xffd877)
      .setScrollFactor(0).setDepth(361).setOrigin(0, 0.5);
    this.holdLabel = this.add.bitmapText(213, 12, "tempFont", "BROADCAST OVERWRITE", 8)
      .setOrigin(0.5).setScrollFactor(0).setDepth(361).setTintFill(0xffd877);
  }

  _tickHold() {
    if (this._won || !this.jammy.alive) return;
    const frac = Math.min(1, (this.time.now - this._holdStart) / this._holdDurationMs);
    if (this.holdBar) this.holdBar.width = 240 * frac;
    if (frac >= 1) this._win();
  }

  _spawnHoldWaves() {
    // Interruptions keep coming until the song lands
    this._waveTimer = this.time.addEvent({
      delay: 6000,
      loop: true,
      callback: () => {
        if (this._won) return;
        new StaticWasp(this, 70, 260);
        new StaticWasp(this, 360, 240);
      },
    });
    this.time.delayedCall(12000, () => { if (!this._won) new CannerDrone(this, 100, 230); });
    this.time.delayedCall(24000, () => { if (!this._won) new CannerDrone(this, 330, 230); });

    // The colony arrives — ants streaming across the stage, scaled by
    // every ANT token banked this run
    if (!this.textures.exists("colony-ant")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x6e1136, 1);
      g.fillRect(0, 1, 2, 2);
      g.fillRect(2, 0, 3, 3);
      g.fillRect(5, 1, 2, 2);
      g.generateTexture("colony-ant", 7, 4);
      g.destroy();
    }
    const banked = (typeof game !== "undefined" && game && game.antTokensCollected)
      ? (game.antTokensCollected.level1 || 0) : 0;
    const perWave = Math.min(2 + Math.floor(banked / 3), 12);
    this._antTimer = this.time.addEvent({
      delay: 2400,
      loop: true,
      callback: () => {
        for (let i = 0; i < perWave; i++) {
          const fromLeft = i % 2 === 0;
          const ant = this.add.image(fromLeft ? 60 : 366, 314, "colony-ant");
          ant.setDepth(99);
          ant.setFlipX(!fromLeft);
          this.tweens.add({
            targets: ant,
            x: fromLeft ? 366 : 60,
            duration: 2000 + Math.random() * 800,
            delay: i * 120,
            onComplete: () => ant.destroy(),
          });
        }
      },
    });
  }

  _spawnDuke() {
    // Duke takes the corner of the stage and lays down covering fire
    this.duke = this.add.image(90, 302, "duke-cassis").setDepth(99);
    const tag = this.add.bitmapText(90, 278, "tempFont", "DUKE", 8)
      .setOrigin(0.5).setTintFill(0xb08cff).setDepth(99);
    this.tweens.add({ targets: tag, alpha: 0, delay: 2400, duration: 400, onComplete: () => tag.destroy() });
    this._dukeTimer = this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => {
        if (this._won || !this.duke) return;
        this._dukeDir = this._dukeDir === "right" ? "left" : "right";
        // His bass quake sweeps the stage, clearing the interruptions
        new BassWave(this, this.duke.x, this.duke.y + 4,
          this._dukeDir === "left" && this.duke.x > 213 ? "left" : "right");
      },
    });
  }

  _win() {
    if (this._won) return;
    this._won = true;
    if (this._holdTimer) this._holdTimer.destroy();
    if (this._waveTimer) this._waveTimer.destroy();
    if (this._antTimer) this._antTimer.destroy();
    if (this._dukeTimer) this._dukeTimer.destroy();
    this.jammy.invincible = true;

    // Every remaining interruption dies with the broadcast
    this.enemies.getChildren().slice().forEach((e) => {
      if (e && !e.dead && e.die) e.die();
    });
    this.sound.stopAll();
    this.sound.play("startGameSound", { volume: 0.9 });
    this.cameras.main.flash(600, 255, 240, 180);

    const t1 = this.add.bitmapText(213, 86, "tempFont", "FRESH-SQUEEZED.", 16)
      .setOrigin(0.5).setScrollFactor(0).setDepth(400).setTintFill(0xffd877);
    const t2 = this.add.bitmapText(213, 112, "tempFont", "THE BROADCAST IS A JAM SESSION NOW", 8)
      .setOrigin(0.5).setScrollFactor(0).setDepth(400).setTintFill(0xd8f4f0);
    this.time.delayedCall(2600, () => {
      this.murmur.say("the music keeps itself now");
    });
    this.time.delayedCall(5400, () => {
      this.cameras.main.fadeOut(900, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("EndCredits");
      });
    });
  }

  _showTitleCard() {
    const t1 = this.add.bitmapText(213, 92, "tempFont", "STAGE 3-1", 16)
      .setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0xd8f4f0);
    const t2 = this.add.bitmapText(213, 114, "tempFont", "THE SIGNAL SPIRE", 12)
      .setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0x7fe8e0);
    this.tweens.add({
      targets: [t1, t2], alpha: 0, delay: 1700, duration: 600,
      onComplete: () => { t1.destroy(); t2.destroy(); },
    });
  }
}
