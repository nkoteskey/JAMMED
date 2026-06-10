// Stage 2-2 — THE ARCHIVE. Concentrate's vault of masters: jars to
// the ceiling, every label a name. Nearly combat-free on purpose —
// this is the level where the player decides they're angry. Duke
// Cassis's jar is here, and at the exit a scanner arch exposes what
// Blubert's scan has been doing all along.
class Stage2_2 extends Phaser.Scene {
  constructor() {
    super({ key: "Stage2_2" });
  }

  preload() {
    scene = this;
  }

  create() {
    this.sound.stopAll();
    // Muffled, slowed — music heard through a sealed door
    this.sound.play("Level1MusicLoop", { loop: true, volume: 0.22, rate: 0.82 });

    if (typeof SeedOfDestruction !== "undefined" && SeedOfDestruction.ensureTexture) {
      SeedOfDestruction.ensureTexture(this);
    }

    this.cameras.main.setBackgroundColor("#0d1a1e");

    this._buildTilesetTexture();
    this._buildLevel();
    this._buildShelves();

    this.bullets = this.physics.add.group();
    this.collectibles = this.physics.add.group();
    this.enemies = this.add.group();
    this.enemyProjectiles = this.physics.add.group();

    this.jammy = new Jammy(52, 150);
    this.jammy.sprite.setDepth(100);
    this.jammy.controlsEnabled = true;
    this.children.bringToTop(this.jammy.sprite);

    this.cameras.main.startFollow(this.jammy.sprite);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, 240);

    this.physics.add.overlap(this.jammy.sprite, this.collectibles, (j, c) => c.effect());
    this.physics.add.collider(this.jammy.sprite, this.groundLayer);
    this.physics.add.collider(this.jammy.sprite, this.deathBlocksLayer, () =>
      this.jammy.instantDeath()
    );
    this._changing = false;
    // Scene restarts reuse the instance — every progression flag must
    // be re-armed here or a death after the trigger softlocks the run.
    this._scannerStarted = false;
    this._dukeFreed = false;
    this.physics.add.collider(this.jammy.sprite, this.sceneChangeLayer, () =>
      this.changeScene()
    );
    this.physics.add.collider(this.collectibles, this.groundLayer);
    this.physics.add.collider(this.enemies, this.groundLayer);
    this.physics.add.collider(this.enemies, this.enemyStopBlocksLayer);

    // Sparse patrols — the Archive trusts its locks. Soldiers walk
    // the stacks, not the scanner: nothing may camp the exit beat.
    [700, 1300].forEach((x) => new CannerDrone(this, x, 70));
    [1090, 1240].forEach((x) => new TinSoldier(this, x, 170));

    [[300, 168], [840, 168], [1180, 168]].forEach(([x, y]) => new AntToken(this, x, y));
    new RoyaltyScrap(this, 980, 164, "INDEX: 11,408 MASTERS. 0 RELEASED");

    this.blubert = new Blubert(this, this.jammy);
    this.blubertRevivesLeft = 1;

    this._buildDukePedestal();
    this._buildScannerArch();

    // The murmur — reading the labels
    ensureX0XTexture(this);
    this.add.image(420, 150, "x0x-glyph").setDepth(2);
    this.murmur = new Murmur(this);
    this.murmur.addTrigger(200, "quiet now. read the labels");
    this.murmur.addTrigger(620, "names on the jars. their name on the keys");
    this.murmur.addTrigger(1080, "eleven thousand masters. none of them ever go home");
    this.murmur.addTrigger(1400, "thats duke ahead. the seal answers to heavy strings");

    this._showTitleCard();

    // Dim archive light
    this.add.rectangle(213, 120, 426, 240, 0x0a1418, 0.18)
      .setScrollFactor(0).setDepth(150);

    const ui = this.scene.get("UIScene");
    if (ui && ui.setWeapon) ui.setWeapon(this.jammy.currentWeapon);
  }

  update() {
    this.jammy.update();
    if (this.blubert) this.blubert.update();
    this.enemies.getChildren().forEach((e) => { if (e.update) e.update(); });
    if (this.murmur) this.murmur.update(this.jammy.sprite.x);

    // Scanner arch sequence trigger
    if (!this._scannerStarted && this.jammy.sprite.x > 1845) {
      this._runScannerSequence();
    }
  }

  tryReviveBlubert() {
    if (this.blubert || !this.jammy || (this.blubertRevivesLeft || 0) <= 0) return;
    this.blubertRevivesLeft -= 1;
    this.blubert = new Blubert(this, this.jammy);
  }

  // ------------------------------------------------------------------
  _buildTilesetTexture() {
    if (this.textures.exists("archive-tiles")) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const o = (i) => i * 16;

    // 1: pale corporate panel
    g.fillStyle(0x24383e, 1);
    g.fillRect(o(1), 0, 16, 16);
    g.fillStyle(0x2e4850, 1);
    g.fillRect(o(1) + 1, 1, 14, 14);
    g.fillStyle(0x3a5a64, 1);
    g.fillRect(o(1) + 1, 1, 14, 2);

    // 2: glossy floor
    g.fillStyle(0x1a2c32, 1);
    g.fillRect(o(2), 0, 16, 16);
    g.fillStyle(0x2e4850, 1);
    g.fillRect(o(2), 0, 16, 3);
    g.fillStyle(0x7fe8e0, 0.25);
    g.fillRect(o(2) + 2, 0, 4, 1);
    g.fillStyle(0x101e22, 1);
    g.fillRect(o(2), 10, 16, 6);

    // 3: floor base
    g.fillStyle(0x101e22, 1);
    g.fillRect(o(3), 0, 16, 16);
    g.fillStyle(0x0a1418, 1);
    g.fillRect(o(3), 6, 16, 2);

    g.generateTexture("archive-tiles", 4 * 16, 16);
    g.destroy();
  }

  _buildLevel() {
    const W = 140, H = 15;
    const E = -1, PANEL = 1, FLOOR = 2, BASE = 3;
    const grid = () => Array.from({ length: H }, () => Array(W).fill(E));
    const ground = grid(), death = grid(), stops = grid(), change = grid();
    const fill = (g, c0, r0, c1, r1, t) => {
      for (let r = r0; r <= r1; r++)
        for (let c = c0; c <= c1; c++) g[r][c] = t;
    };

    fill(ground, 0, 0, W - 1, 1, PANEL);       // ceiling
    fill(ground, 0, 0, 1, H - 1, PANEL);       // walls
    fill(ground, W - 2, 0, W - 1, H - 1, PANEL);
    fill(ground, 2, 12, W - 3, 12, FLOOR);     // glossy floor
    fill(ground, 2, 13, W - 3, 14, BASE);

    // Exit trigger behind the scanner arch
    fill(change, 134, 2, 135, 11, PANEL);

    const mkLayer = (data) => {
      const map = this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 });
      const tiles = map.addTilesetImage("archive-tiles");
      return { map, layer: map.createLayer(0, tiles, 0, 0) };
    };
    const gnd = mkLayer(ground);
    this.map = gnd.map;
    this.groundLayer = gnd.layer;
    this.groundLayer.setCollision([PANEL, FLOOR, BASE]);

    const dth = mkLayer(death);
    this.deathBlocksLayer = dth.layer;
    this.deathBlocksLayer.setAlpha(0);
    this.deathBlocksLayer.setCollision([PANEL]);

    const stp = mkLayer(stops);
    this.enemyStopBlocksLayer = stp.layer;
    this.enemyStopBlocksLayer.setAlpha(0);
    this.enemyStopBlocksLayer.setCollision([PANEL]);

    const chg = mkLayer(change);
    this.sceneChangeLayer = chg.layer;
    this.sceneChangeLayer.setAlpha(0);
    this.sceneChangeLayer.setCollision([PANEL]);
  }

  // Steel shelf units stacked with sealed masters, names underneath
  _buildShelves() {
    if (!this.textures.exists("archive-shelf")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      const jam = [0xc23a66, 0xd07a2a, 0x8a5cf0, 0x3e9c40, 0xc8285c];
      g.fillStyle(0x3a5a64, 1);
      g.fillRect(0, 0, 64, 44);
      g.fillStyle(0x16262c, 1);
      g.fillRect(2, 2, 60, 18);
      g.fillRect(2, 24, 60, 18);
      for (let row = 0; row < 2; row++) {
        for (let i = 0; i < 5; i++) {
          const x = 5 + i * 12, y = 6 + row * 22;
          g.fillStyle(0x8c96b0, 1);
          g.fillRect(x + 1, y, 6, 2);
          g.fillStyle(jam[(i + row * 2) % jam.length], 0.85);
          g.fillRect(x, y + 2, 8, 10);
          g.fillStyle(0xffffff, 0.35);
          g.fillRect(x + 1, y + 3, 1, 8);
          // tiny label
          g.fillStyle(0xd8d4ca, 1);
          g.fillRect(x + 2, y + 7, 4, 3);
        }
      }
      g.generateTexture("archive-shelf", 64, 44);
      g.destroy();
    }

    const names = [
      "MARMALADE JONES", "PEACHES LEFEVRE", "B.B. BRAMBLE",
      "GOOSEBERRY HILL", "THE CITRUS SISTERS", "LIL KUMQUAT",
      "PLUM DELUXE", "FIG NEWMAN", "MISS APRICOT", "OLD MEDLAR",
    ];
    let n = 0;
    for (let x = 180; x < 1800; x += 160) {
      this.add.image(x, 116, "archive-shelf").setDepth(2);
      this.add.image(x, 166, "archive-shelf").setDepth(2);
      if (n < names.length) {
        this.add.bitmapText(x, 142, "tempFont", names[n], 8)
          .setOrigin(0.5).setTintFill(0x6a8a90).setDepth(2);
        n++;
      }
    }
  }

  _buildDukePedestal() {
    // Duke's display jar on a lit pedestal
    if (!this.textures.exists("duke-jar")) {
      let g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x8c96b0, 1);
      g.fillRect(3, 0, 22, 5);
      g.fillStyle(0xbfe8f4, 0.4);
      g.fillRect(0, 5, 28, 35);
      g.lineStyle(1, 0x8ec4d8, 0.9);
      g.strokeRect(0, 5, 28, 35);
      // The silhouette inside
      g.fillStyle(0x241430, 0.95);
      g.fillCircle(14, 16, 7);
      g.fillRect(9, 21, 10, 14);
      g.fillStyle(0xffffff, 0.5);
      g.fillRect(3, 7, 2, 30);
      g.generateTexture("duke-jar", 28, 40);
      g.destroy();

      // Duke himself — tall blackcurrant in shades
      g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x2a1838, 1);
      g.fillCircle(9, 8, 8);
      g.fillStyle(0x3e2452, 1);
      g.fillCircle(9, 7, 7);
      g.fillStyle(0x101018, 1);
      g.fillRect(3, 5, 5, 3); // shades
      g.fillRect(10, 5, 5, 3);
      g.fillRect(8, 6, 2, 1);
      g.fillStyle(0x2a1838, 1);
      g.fillRect(5, 15, 8, 12); // slim body
      g.fillRect(4, 27, 4, 3);  // feet
      g.fillRect(10, 27, 4, 3);
      g.generateTexture("duke-cassis", 18, 30);
      g.destroy();
    }

    const x = 1500, y = 162;
    this.add.rectangle(x, 192, 56, 8, 0x3a5a64).setDepth(2);
    this.add.rectangle(x, 199, 44, 8, 0x24383e).setDepth(2);
    const spot = this.add.rectangle(x, 150, 60, 90, 0x7fe8e0, 0.07).setDepth(2);
    this.tweens.add({
      targets: spot, alpha: 0.5, duration: 1200, yoyo: true, repeat: -1,
    });
    this.add.bitmapText(x, 122, "tempFont", "DUKE CASSIS - BASS", 8)
      .setOrigin(0.5).setTintFill(0xb08cff).setDepth(2);

    this.dukeJar = this.physics.add.sprite(x, y, "duke-jar");
    this.dukeJar.body.setAllowGravity(false);
    this.dukeJar.body.setImmovable(true);
    this.dukeJar.setDepth(56);
    this.dukeJar.dead = false;
    this.dukeJar.invincible = false;
    // Heavy hits only — the seal answers to the bass (or a seed blast)
    this.dukeJar.takeDamage = (val = 1) => {
      if (this._dukeFreed) return;
      if (val < 2) {
        this.dukeJar.setTintFill(0xffffff);
        this.time.delayedCall(50, () => this.dukeJar.active && this.dukeJar.clearTint());
        this.sound.play("enemyHitSound", { rate: 1.9, volume: 0.25 });
        this.murmur.say("heavier. the bass");
        return;
      }
      this._freeDuke();
    };
    this.enemies.add(this.dukeJar);

    // Guarantee the player can do it: if the Royal Bass was somehow
    // skipped in 1-4, it waits here beside its owner.
    new GuitarPickup(this, x - 60, 152, "royal-bass");
  }

  _freeDuke() {
    if (this._dukeFreed) return;
    this._dukeFreed = true;
    if (typeof game !== "undefined" && game) game.dukeFreed = true;

    const x = this.dukeJar.x, y = this.dukeJar.y;
    // Shatter
    for (let i = 0; i < 8; i++) {
      const ang = Math.random() * Math.PI * 2;
      const shard = this.add.triangle(x, y, 0, 4, 3, 0, 6, 4, 0xcfeefb, 0.9);
      shard.setDepth(80);
      this.tweens.add({
        targets: shard,
        x: x + Math.cos(ang) * 30, y: y + Math.sin(ang) * 20 + 12,
        angle: 220, alpha: 0, duration: 420,
        onComplete: () => shard.destroy(),
      });
    }
    this.sound.play("enemyDeathSound", { rate: 1.4 });
    this.dukeJar.destroy();

    const duke = this.add.image(x, y + 4, "duke-cassis").setDepth(60);
    duke.setScale(0.3);
    this.tweens.add({
      targets: duke, scaleX: 1, scaleY: 1, y: y - 2,
      duration: 300, ease: "Back.easeOut",
    });
    const line = this.add.bitmapText(x, y - 40, "tempFont", "DUKE: SEE YOU AT THE SPIRE.", 8)
      .setOrigin(0.5).setTintFill(0xb08cff).setDepth(60);
    this.murmur.say("good node, jammy. the band is getting back together");
    this.time.delayedCall(2200, () => {
      this.tweens.add({
        targets: duke, x: x + 220, alpha: 0, duration: 900,
        onComplete: () => duke.destroy(),
      });
      this.tweens.add({ targets: line, alpha: 0, duration: 500, onComplete: () => line.destroy() });
    });
  }

  _buildScannerArch() {
    const x = 1960;
    this.scannerParts = [
      this.add.rectangle(x - 26, 144, 8, 96, 0x14383a).setDepth(55),
      this.add.rectangle(x + 26, 144, 8, 96, 0x14383a).setDepth(55),
      this.add.rectangle(x, 94, 64, 10, 0x14383a).setDepth(55),
    ];
    this.scanBeam = this.add.rectangle(x, 146, 6, 92, 0x7fe8e0, 0.5).setDepth(55);
    this.tweens.add({
      targets: this.scanBeam, alpha: 0.15,
      duration: 600, yoyo: true, repeat: -1,
    });
    // Hard gate until the beacon is purged
    this.scannerGate = this.add.rectangle(x + 60, 144, 10, 96, 0x2ab8b0, 0.35);
    this.scannerGate.setDepth(55);
    this.physics.add.existing(this.scannerGate);
    this.scannerGate.body.setAllowGravity(false);
    this.scannerGate.body.setImmovable(true);
    this.physics.add.collider(this.jammy.sprite, this.scannerGate);
  }

  _runScannerSequence() {
    this._scannerStarted = true;
    const beam = this.scanBeam;
    beam.fillColor = 0xff4444;
    this.sound.play("enemyHitSound", { rate: 0.45, volume: 0.7 });
    this.cameras.main.shake(180, 0.004);
    this.murmur.say("scanner says a beacon is here. its not you, jammy");

    this.time.delayedCall(1800, () => {
      this.murmur.say("its your scout. he sings to their tower. he didnt know");
      if (this.blubert && this.blubert.sprite) {
        this.blubert.sprite.setTint(0x2ab8b0);
        this.tweens.add({
          targets: this.blubert.sprite, alpha: 0.3,
          duration: 120, yoyo: true, repeat: 6,
        });
      }
    });

    this.time.delayedCall(4200, () => {
      // Blubert purges the beacon himself: flies into the arch and
      // overloads the scanner. The choreography is cosmetic — the
      // gate opens on a fixed clock either way (his follow AI fights
      // tweens, so never gate progression on a tween completing).
      if (this.blubert && this.blubert.sprite) {
        this.tweens.add({
          targets: this.blubert.sprite,
          x: 1960, y: 140,
          duration: 700,
          ease: "Sine.easeIn",
        });
      }
      this.time.delayedCall(750, () => {
        this.cameras.main.flash(220, 127, 232, 224);
        this.cameras.main.shake(200, 0.006);
        if (this.cache.audio.exists("shortExplosion")) {
          this.sound.play("shortExplosion", { volume: 0.6 });
        }
        if (this.blubert && this.blubert.sprite) {
          this.blubert.sprite.clearTint();
          this.blubert.sprite.setAlpha(1);
        }
        if (this.scanBeam) { this.scanBeam.destroy(); this.scanBeam = null; }
        if (this.scannerGate) { this.scannerGate.destroy(); this.scannerGate = null; }
        this.murmur.say("he purged the beacon himself. good node");
        this.murmur.say("the tower is blind now. go say hello");
      });
    });
  }

  _showTitleCard() {
    const t1 = this.add.bitmapText(213, 92, "tempFont", "STAGE 2-2", 16)
      .setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0xd8f4f0);
    const t2 = this.add.bitmapText(213, 114, "tempFont", "THE ARCHIVE", 12)
      .setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0x7fe8e0);
    this.tweens.add({
      targets: [t1, t2], alpha: 0, delay: 1700, duration: 600,
      onComplete: () => { t1.destroy(); t2.destroy(); },
    });
  }

  changeScene() {
    if (this._changing) return;
    this._changing = true;
    this.jammy.controlsEnabled = false;
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("Stage3_1");
    });
  }
}
