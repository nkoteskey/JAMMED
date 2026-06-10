// Stage 2-1 — ORCHARD ROWS. Concentrate's plantation upstream of the
// Jam Works: identical trees in identical rows, harvest conveyors,
// and canals of teal Drip runoff. First posting of the corporate
// payroll: Tin Soldiers, Canner Drones, and the Ad-Supported Tier.
class Stage2_1 extends Phaser.Scene {
  constructor() {
    super({ key: "Stage2_1" });
  }

  preload() {
    scene = this;
  }

  create() {
    this.sound.stopAll();
    this.sound.play("Level1MusicLoop", { loop: true, volume: 0.8 });

    if (typeof SeedOfDestruction !== "undefined" && SeedOfDestruction.ensureTexture) {
      SeedOfDestruction.ensureTexture(this);
    }

    // Corporate haze — dusk filtered through the Drip
    this.cameras.main.setBackgroundColor("#16323c");

    this._buildTilesetTexture();
    this._buildLevel();
    this._paintBackground();
    this._plantTreeRows();
    this._decorateCanals();

    this.bullets = this.physics.add.group();
    this.collectibles = this.physics.add.group();
    this.enemies = this.add.group();
    this.enemyProjectiles = this.physics.add.group();

    this.jammy = new Jammy(52, 150);
    this.jammy.sprite.setDepth(100);
    this.jammy.controlsEnabled = true;
    this.children.bringToTop(this.jammy.sprite);

    this.cameras.main.startFollow(this.jammy.sprite);
    // Rocket-Axe headroom — open sky above the rows
    this.cameras.main.setBounds(0, -240, this.map.widthInPixels, 240 + 240);

    this.physics.add.overlap(this.jammy.sprite, this.collectibles, (j, c) => c.effect());
    this.physics.add.collider(this.jammy.sprite, this.groundLayer);
    this.physics.add.collider(this.jammy.sprite, this.deathBlocksLayer, () =>
      this.jammy.instantDeath()
    );
    this._changing = false;
    this.physics.add.collider(this.jammy.sprite, this.sceneChangeLayer, () =>
      this.changeScene()
    );
    this.physics.add.collider(this.collectibles, this.groundLayer);
    this.physics.add.collider(this.enemies, this.groundLayer);
    this.physics.add.collider(this.enemies, this.enemyStopBlocksLayer);

    // Harvest conveyors spanning the second and third canals
    this.belts = [
      new ConveyorBelt(this, 82 * 16, 176, 80, 1),
      new ConveyorBelt(this, 128 * 16, 176, 80, -1),
    ];

    // --- Payroll ---
    [350, 900, 1500, 1880, 2350, 2900].forEach((x) => new TinSoldier(this, x, 170));
    [600, 1700, 2600].forEach((x) => new CannerDrone(this, x, 70));
    [[1100, 120], [2030, 105], [2750, 125]].forEach(([x, y]) => new StaticWasp(this, x, y));

    // --- Pickups ---
    [
      [140, 168], [165, 168], [190, 168],
      [664, 130], [680, 110], [696, 130],
      [1180, 168], [1205, 168],
      [1352, 120], [1376, 120],
      [1980, 168], [2005, 168],
      [2480, 130], [2505, 130],
      [2980, 168], [3005, 168],
    ].forEach(([x, y]) => new AntToken(this, x, y));

    new RoyaltyScrap(this, 760, 168, "RECEIPT: 2,400,000 SQUEEZES = 7 ANT");
    new RoyaltyScrap(this, 1620, 150, "NOTICE: YOUR MASTERS REMAIN OUR PROPERTY");
    new RoyaltyScrap(this, 2860, 168, "MEMO: HUSKS TO BE RE-SHELVED AS LISTENERS");

    [[440, 150], [2180, 150]].forEach(([x, y]) => new SeedAmmoPickup(this, x, y));
    const heal = new PowerUp(this, 1750, 150);
    heal.setData("powerUpType", "heal");
    heal.val = 2;

    this.blubert = new Blubert(this, this.jammy);
    this.blubertRevivesLeft = 1;

    // The murmur
    ensureX0XTexture(this);
    this.add.image(372, 218, "x0x-glyph").setDepth(2);
    this.add.image(2210, 218, "x0x-glyph").setDepth(2);
    this.murmur = new Murmur(this);
    this.murmur.addTrigger(180, "concentrate row. fruit aint meant to grow in ranks");
    this.murmur.addTrigger(560, "drones can you. mash attack to break the glass");
    this.murmur.addTrigger(880, "soldiers armor up front. flank them or hit heavy");
    this.murmur.addTrigger(1980, "the wasps dont bite. they interrupt. swat the ads");
    this.murmur.addTrigger(2820, "heard from 3 nodes: the archive gate is ahead. duke is inside");

    this._buildExitGate();
    this._showTitleCard();

    const ui = this.scene.get("UIScene");
    if (ui && ui.setWeapon) ui.setWeapon(this.jammy.currentWeapon);
  }

  update() {
    this.jammy.update();
    if (this.blubert) this.blubert.update();
    this.enemies.getChildren().forEach((e) => { if (e.update) e.update(); });
    this.belts.forEach((b) => b.update());
    if (this.murmur) this.murmur.update(this.jammy.sprite.x);
  }

  tryReviveBlubert() {
    if (this.blubert || !this.jammy || (this.blubertRevivesLeft || 0) <= 0) return;
    this.blubertRevivesLeft -= 1;
    this.blubert = new Blubert(this, this.jammy);
  }

  // ------------------------------------------------------------------
  _buildTilesetTexture() {
    if (this.textures.exists("orchard-tiles")) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const o = (i) => i * 16;

    // 1: tilled topsoil with furrow lines
    g.fillStyle(0x4a3424, 1);
    g.fillRect(o(1), 0, 16, 16);
    g.fillStyle(0x5e4430, 1);
    g.fillRect(o(1), 0, 16, 3);
    g.fillStyle(0x2e1f14, 1);
    g.fillRect(o(1) + 2, 0, 2, 3);
    g.fillRect(o(1) + 8, 0, 2, 3);
    g.fillRect(o(1) + 13, 0, 2, 3);
    g.fillStyle(0x3a2818, 1);
    g.fillRect(o(1) + 4, 7, 5, 1);
    g.fillRect(o(1) + 10, 11, 4, 1);

    // 2: topsoil with a sad uniform sprout
    g.fillStyle(0x4a3424, 1);
    g.fillRect(o(2), 0, 16, 16);
    g.fillStyle(0x5e4430, 1);
    g.fillRect(o(2), 0, 16, 3);
    g.fillStyle(0x2e1f14, 1);
    g.fillRect(o(2) + 5, 0, 2, 3);
    g.fillRect(o(2) + 11, 0, 2, 3);
    g.fillStyle(0x3e7a58, 1);
    g.fillRect(o(2) + 7, 0, 2, 2);
    g.fillStyle(0x3a2818, 1);
    g.fillRect(o(2) + 2, 9, 5, 1);

    // 3: soil body
    g.fillStyle(0x3e2c1e, 1);
    g.fillRect(o(3), 0, 16, 16);
    g.fillStyle(0x2e1f14, 1);
    g.fillRect(o(3) + 3, 4, 4, 3);
    g.fillRect(o(3) + 10, 10, 4, 3);
    g.fillStyle(0x55402c, 1);
    g.fillRect(o(3) + 11, 3, 2, 2);

    // 4: clay base
    g.fillStyle(0x32241a, 1);
    g.fillRect(o(4), 0, 16, 16);
    g.fillStyle(0x241a10, 1);
    g.fillRect(o(4), 4, 16, 2);
    g.fillRect(o(4), 11, 16, 2);

    // 5: shipping crate (solid platform)
    g.fillStyle(0x6e4e2e, 1);
    g.fillRect(o(5), 0, 16, 16);
    g.fillStyle(0x8a653e, 1);
    g.fillRect(o(5) + 1, 1, 14, 14);
    g.fillStyle(0x5a3e22, 1);
    g.fillRect(o(5) + 1, 7, 14, 2);
    g.fillRect(o(5) + 7, 1, 2, 14);
    g.fillStyle(0x2ab8b0, 1); // teal stencil
    g.fillRect(o(5) + 3, 3, 3, 3);

    // 6: Drip surface
    g.fillStyle(0x1d8a82, 1);
    g.fillRect(o(6), 0, 16, 16);
    g.fillStyle(0x3ec8c0, 1);
    g.fillRect(o(6), 0, 16, 3);
    g.fillRect(o(6) + 3, 3, 4, 2);
    g.fillRect(o(6) + 11, 3, 3, 2);
    g.fillStyle(0x7fe8e0, 1);
    g.fillRect(o(6) + 5, 0, 2, 2);
    g.fillStyle(0x14605a, 1);
    g.fillRect(o(6) + 6, 9, 3, 3);

    // 7: Drip body
    g.fillStyle(0x14605a, 1);
    g.fillRect(o(7), 0, 16, 16);
    g.fillStyle(0x0d4540, 1);
    g.fillRect(o(7) + 2, 3, 4, 4);
    g.fillRect(o(7) + 10, 9, 4, 3);
    g.fillStyle(0x1d8a82, 1);
    g.fillRect(o(7) + 12, 2, 2, 2);

    g.generateTexture("orchard-tiles", 8 * 16, 16);
    g.destroy();
  }

  _buildLevel() {
    const W = 200, H = 15;
    const E = -1, TOP = 1, SPROUT = 2, SOIL = 3, CLAY = 4, CRATE = 5, DRIPTOP = 6, DRIP = 7;
    const grid = () => Array.from({ length: H }, () => Array(W).fill(E));
    const ground = grid(), death = grid(), stops = grid(), change = grid();
    const fill = (g, c0, r0, c1, r1, t) => {
      for (let r = r0; r <= r1; r++)
        for (let c = c0; c <= c1; c++) g[r][c] = t;
    };

    // Dirt berms at both ends keep Jammy in the rows
    fill(ground, 0, 6, 1, 14, SOIL);
    fill(ground, W - 2, 6, W - 1, 14, SOIL);

    // Floor spans (surface at row 12, y=192) with Drip canals between
    this.floorSpans = [[2, 40], [44, 82], [86, 128], [132, 168], [172, 197]];
    this.floorSpans.forEach(([a, b]) => {
      fill(ground, a, 12, b, 12, TOP);
      fill(ground, a, 13, b, 13, SOIL);
      fill(ground, a, 14, b, 14, CLAY);
    });
    // Sprout variants sprinkled along the surface
    for (let c = 2; c < W - 2; c++) {
      if (ground[12][c] === TOP && (c * 17 + 5) % 9 === 0) ground[12][c] = SPROUT;
    }

    // Drip canals
    this.canals = [[41, 43], [83, 85], [129, 131], [169, 171]];
    this.canals.forEach(([a, b]) => {
      fill(death, a, 13, b, 13, DRIPTOP);
      fill(death, a, 14, b, 14, DRIP);
    });

    // Crate stacks and floating crate platforms
    fill(ground, 24, 10, 25, 11, CRATE);
    fill(ground, 52, 9, 54, 9, CRATE);
    fill(ground, 70, 10, 71, 11, CRATE);
    fill(ground, 100, 9, 102, 9, CRATE);
    fill(ground, 118, 10, 119, 11, CRATE);
    fill(ground, 146, 9, 148, 9, CRATE);
    fill(ground, 160, 10, 161, 11, CRATE);
    fill(ground, 184, 9, 186, 9, CRATE);

    // Soldier fences at canal approaches (enemies only)
    [3, 39, 45, 81, 87, 127, 133, 167, 173, 196].forEach((c) => (stops[11][c] = SOIL));

    // Exit gate trigger near the right berm
    fill(change, 192, 4, 193, 11, SOIL);

    const mkLayer = (data) => {
      const map = this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 });
      const tiles = map.addTilesetImage("orchard-tiles");
      return { map, layer: map.createLayer(0, tiles, 0, 0) };
    };

    const gnd = mkLayer(ground);
    this.map = gnd.map;
    this.groundLayer = gnd.layer;
    this.groundLayer.setCollision([TOP, SPROUT, SOIL, CLAY, CRATE]);

    const dth = mkLayer(death);
    this.deathBlocksLayer = dth.layer;
    this.deathBlocksLayer.setDepth(3);
    this.deathBlocksLayer.setCollision([DRIPTOP, DRIP]);

    const stp = mkLayer(stops);
    this.enemyStopBlocksLayer = stp.layer;
    this.enemyStopBlocksLayer.setAlpha(0);
    this.enemyStopBlocksLayer.setCollision([SOIL]);

    const chg = mkLayer(change);
    this.sceneChangeLayer = chg.layer;
    this.sceneChangeLayer.setAlpha(0);
    this.sceneChangeLayer.setCollision([SOIL]);
  }

  _paintBackground() {
    const w = this.map.widthInPixels;

    // Dusk-through-haze bands
    [
      [0, 60, 0x10262e],
      [60, 110, 0x16323c],
      [110, 150, 0x1e4a4a],
      [150, 240, 0x2a6058],
    ].forEach(([y0, y1, c]) => {
      this.add.rectangle(213, (y0 + y1) / 2, 426, y1 - y0, c)
        .setScrollFactor(0).setDepth(-40);
    });

    // Far tree rows, receding ranks of identical dark blocks
    for (let x = 0; x < 1100; x += 46) {
      this.add.rectangle(x, 158, 18, 14, 0x12362e)
        .setScrollFactor(0.15, 1).setDepth(-35);
      this.add.rectangle(x, 169, 3, 10, 0x0d2620)
        .setScrollFactor(0.15, 1).setDepth(-35);
    }

    // The pipeline on trestles, carrying the Drip to the Works
    this.add.rectangle(w * 0.3, 110, w, 8, 0x14383a)
      .setScrollFactor(0.3, 1).setDepth(-30);
    for (let x = 30; x < w; x += 140) {
      this.add.rectangle(x, 130, 5, 40, 0x14383a)
        .setScrollFactor(0.3, 1).setDepth(-30);
    }
    // Droplet tanks along the line
    for (let x = 180; x < w; x += 560) {
      this.add.rectangle(x, 92, 34, 30, 0x1d5a5a)
        .setScrollFactor(0.3, 1).setDepth(-30);
      this.add.rectangle(x, 75, 10, 8, 0x14383a)
        .setScrollFactor(0.3, 1).setDepth(-30);
    }

    // Harvester silhouettes parked in the haze
    for (let x = 420; x < w; x += 900) {
      const h = this.add.container(x, 150).setScrollFactor(0.3, 1).setDepth(-29);
      h.add(this.add.rectangle(0, 0, 70, 26, 0x0f2e2a));
      h.add(this.add.rectangle(-22, -20, 22, 16, 0x0f2e2a));
      h.add(this.add.circle(-22, 16, 9, 0x0a201c));
      h.add(this.add.circle(20, 16, 9, 0x0a201c));
    }

    // Billboards on the gameplay plane
    addDripBillboard(this, 700, 120);
    addDripBillboard(this, 2400, 116);
  }

  // Identical trees, evenly spaced — the monoculture, on the gameplay plane
  _plantTreeRows() {
    if (!this.textures.exists("orchard-tree")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      // Perfect square canopy on a straight trunk: unsettlingly tidy
      g.fillStyle(0x1d4a3a, 1);
      g.fillRect(0, 0, 40, 30);
      g.fillStyle(0x2f5e46, 1);
      g.fillRect(2, 2, 36, 26);
      g.fillStyle(0x3e7a58, 1);
      g.fillRect(2, 2, 36, 4);
      // Identical berries in a grid
      g.fillStyle(0xc23a66, 1);
      for (let yy = 9; yy < 26; yy += 8)
        for (let xx = 6; xx < 36; xx += 10) g.fillRect(xx, yy, 3, 3);
      // Trunk
      g.fillStyle(0x4a3424, 1);
      g.fillRect(17, 30, 6, 26);
      g.fillStyle(0x5e4430, 1);
      g.fillRect(18, 30, 2, 26);
      g.generateTexture("orchard-tree", 40, 56);
      g.destroy();
    }
    // One tree every 11 columns, skipping canals
    for (let c = 8; c < this.map.width - 6; c += 11) {
      const overCanal = this.canals.some(([a, b]) => c >= a - 2 && c <= b + 2);
      if (overCanal) continue;
      this.add.image(c * 16, 192 - 28, "orchard-tree").setDepth(3);
    }
  }

  _decorateCanals() {
    this.canals.forEach(([a, b]) => {
      const x0 = a * 16, x1 = (b + 1) * 16;
      const glow = this.add.rectangle((x0 + x1) / 2, 224, x1 - x0 + 20, 40, 0x3ec8c0, 0.12);
      glow.setDepth(4);
      this.tweens.add({
        targets: glow, alpha: 0.05,
        duration: 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
      });
    });
    this.time.addEvent({
      delay: 420,
      loop: true,
      callback: () => {
        const [a, b] = this.canals[Phaser.Math.Between(0, this.canals.length - 1)];
        const x = Phaser.Math.Between(a * 16 + 4, (b + 1) * 16 - 4);
        const bub = this.add.circle(x, 212, 1 + Math.random() * 2, 0x7fe8e0, 0.9);
        bub.setDepth(5);
        this.tweens.add({
          targets: bub, y: 204, alpha: 0, scale: 1.6,
          duration: 400, onComplete: () => bub.destroy(),
        });
      },
    });
  }

  _buildExitGate() {
    const x = 3070;
    // Teal gate posts + lintel, the Archive beyond
    this.add.rectangle(x - 24, 144, 10, 96, 0x14383a).setDepth(2);
    this.add.rectangle(x + 24, 144, 10, 96, 0x14383a).setDepth(2);
    this.add.rectangle(x, 96, 70, 12, 0x14383a).setDepth(2);
    this.add.bitmapText(x, 96, "tempFont", "ARCHIVE", 8)
      .setOrigin(0.5).setTintFill(0x7fe8e0).setDepth(3);
    const glowDoor = this.add.rectangle(x, 150, 38, 84, 0x7fe8e0, 0.16).setDepth(2);
    this.tweens.add({
      targets: glowDoor, alpha: 0.3,
      duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });
  }

  _showTitleCard() {
    const t1 = this.add.bitmapText(213, 92, "tempFont", "STAGE 2-1", 16)
      .setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0xd8f4f0);
    const t2 = this.add.bitmapText(213, 114, "tempFont", "ORCHARD ROWS", 12)
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
      this.scene.start("Stage2_2");
    });
  }
}
