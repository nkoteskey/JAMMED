// Stage 1-4 — THE JAM WORKS. The fortress stage of World 1: a dark
// preserves factory beyond the sky fields of 1-3. Boiling jam vats
// stand in for lava (with leaping JamBubbles for Podoboos), JamPresses
// for Thwomps, conveyor belts, cherry bats on the rafters, and jam-jar
// sentries on the floor. Everything here is drawn at runtime — the
// tileset, enemies, and door are generated 8-bit pixel art.
class Stage1_4 extends Phaser.Scene {
  constructor() {
    super({ key: "Stage1_4" });
  }

  preload() {
    scene = this;
  }

  create() {
    this.sound.stopAll();
    this.sound.play("BossBattle", { loop: true, volume: 0.7 });

    if (typeof SeedOfDestruction !== "undefined" && SeedOfDestruction.ensureTexture) {
      SeedOfDestruction.ensureTexture(this);
    }

    // Near-black plum — factory interior at night
    this.cameras.main.setBackgroundColor("#14081c");

    this._buildTilesetTexture();
    this._buildLevel();
    this._paintBackground();
    this._decorateVats();

    // Groups
    this.bullets = this.physics.add.group();
    this.collectibles = this.physics.add.group();
    this.enemies = this.add.group();
    this.enemyProjectiles = this.physics.add.group();

    // Jammy
    if (this.jammyData) {
      this.jammy = new Jammy(
        this.jammyData.nextX,
        this.jammyData.nextY,
        this.jammyData.hp,
        this.jammyData.facing
      );
    } else {
      this.jammy = new Jammy(52, 150);
    }
    this.jammy.sprite.setDepth(100);
    this.jammy.controlsEnabled = true;
    this.children.bringToTop(this.jammy.sprite);

    this.cameras.main.startFollow(this.jammy.sprite);
    // Interior stage — ceiling and floor both on screen, no vertical pan
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, 240);

    // Collisions
    this.physics.add.overlap(
      this.jammy.sprite,
      this.collectibles,
      (jammy, collectible) => {
        collectible.effect();
      }
    );
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

    // Conveyor belts (need Jammy to exist first)
    this.belts = [
      new ConveyorBelt(this, 51 * 16, 160, 80, 1),    // over lake, helping
      new ConveyorBelt(this, 62 * 16, 144, 80, -1),   // over lake, fighting
      new ConveyorBelt(this, 124 * 16, 160, 144, 1),  // trench, helping
      new ConveyorBelt(this, 135 * 16, 160, 144, -1), // trench, fighting
    ];

    // --- Enemies ---

    // Jam bubbles leaping from the vats (x, period, first-leap delay)
    [
      [448, 2200, 0],
      [856, 2600, 400],
      [976, 2400, 900],
      [1824, 2300, 200],
      [2120, 2700, 500], // clear of the cols 133-134 girder overhead
      [2976, 2100, 300],
    ].forEach(([x, period, delay]) => {
      new JamBubble(this, x, 208, { period, delay });
    });

    // Jam presses — corridor trio, trench pair over the belts, final pair
    [
      [1224, 176], [1368, 176], [1512, 176],
      [2056, 144], [2224, 144],
      [2536, 176], [2648, 176],
    ].forEach(([x, slamY]) => new JamPress(this, x, 48, slamY));

    // Cherry bats on the rafters
    [944, 1056, 1300, 2176, 2592, 2848].forEach((x) => new CherryBat(this, x, 44));

    // Jar sentries on patrol
    [296, 608, 1440, 2464, 2816].forEach((x) => new JarSentry(this, x, 150));

    // --- Pickups ---

    [
      [130, 172], [150, 172], [170, 172], [190, 172],
      [432, 148], [464, 148],
      [760, 140], [856, 136], [944, 124], [1040, 124],
      [1296, 172], [1440, 172],
      [1735, 108], [1760, 108],
      [1800, 124],
      [2080, 138], [2160, 132], [2240, 138],
      [2560, 172], [2640, 172],
      [2960, 148], [2992, 148],
      [3260, 172], [3290, 172], [3320, 172],
    ].forEach(([x, y]) => new AntToken(this, x, y));

    [[530, 150], [1180, 150], [1944, 150], [2400, 150]].forEach(
      ([x, y]) => new SeedAmmoPickup(this, x, y)
    );

    [[1736, 100], [3060, 150]].forEach(([x, y]) => {
      const p = new PowerUp(this, x, y);
      p.setData("powerUpType", "heal");
      p.val = 2;
    });

    // The Royal Bass guitar waits atop the staircase plateau —
    // ground-quake wave that pierces a whole row of enemies.
    new GuitarPickup(this, 1764, 102, "royal-bass");

    // Blubert companion, one revive like 1-3
    this.blubert = new Blubert(this, this.jammy);
    this.blubertRevivesLeft = 1;

    this._buildExitDoor();
    this._showTitleCard();

    // Concentrate dressing: the Jam Works is an acquisition now.
    // Stamped signage at the entry, royalty scraps deeper in, the
    // murmur whispering what this place really is.
    ensureConcentrateTextures(this);
    ensureX0XTexture(this);
    const sign = this.add.container(150, 84);
    sign.setDepth(1);
    sign.add(this.add.rectangle(0, 0, 132, 26, 0xeef8f6));
    sign.add(this.add.rectangle(0, -11, 132, 4, 0x2ab8b0));
    sign.add(this.add.image(-54, 1, "drip-droplet").setScale(0.8));
    sign.add(this.add.bitmapText(6, -5, "tempFont", "CONCENTRATE", 8)
      .setOrigin(0.5).setTintFill(0x118a84));
    sign.add(this.add.bitmapText(6, 5, "tempFont", "PRESERVES DIV.", 8)
      .setOrigin(0.5).setTintFill(0x4a6a68));
    this.add.image(540, 150, "x0x-glyph").setDepth(1);
    this.add.image(3320, 150, "x0x-glyph").setDepth(1);

    new RoyaltyScrap(this, 1330, 156);
    new RoyaltyScrap(this, 2700, 156, "RECEIPT: EXPOSURE BONUS = 0 ANT");

    this.murmur = new Murmur(this);
    this.murmur.addTrigger(260, "preserves division. names on the labels. their name on the keys");
    this.murmur.addTrigger(1650, "the presses answer to the tower. so does something flying closer to you");
    this.murmur.addTrigger(3000, "duke is in the archive past the orchards. bring his bass");

    // Sync UI weapon indicator
    const ui = this.scene.get("UIScene");
    if (ui && ui.setWeapon) ui.setWeapon(this.jammy.currentWeapon);
  }

  update() {
    this.jammy.update();
    if (this.murmur) this.murmur.update(this.jammy.sprite.x);
    if (this.blubert) this.blubert.update();
    this.enemies.getChildren().forEach((enemy) => {
      if (enemy.update) enemy.update();
    });
    this.belts.forEach((b) => b.update());
  }

  tryReviveBlubert() {
    if (this.blubert || !this.jammy || (this.blubertRevivesLeft || 0) <= 0) return;
    this.blubertRevivesLeft -= 1;
    this.blubert = new Blubert(this, this.jammy);
    if (this.blubert.sprite) {
      this.blubert.sprite.setScale(0.2);
      this.blubert.sprite.setAlpha(0.2);
      this.tweens.add({
        targets: this.blubert.sprite,
        scaleX: 1, scaleY: 1, alpha: 1,
        duration: 260, ease: "Back.easeOut",
      });
    }
  }

  // ------------------------------------------------------------------
  // Tileset — 8 hand-pixeled 16x16 tiles drawn into one strip texture.
  // Index 0 is intentionally blank (data-tilemap quirk safety); real
  // tiles start at 1.
  _buildTilesetTexture() {
    if (this.textures.exists("factory-tiles")) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const o = (i) => i * 16; // x-offset of tile i in the strip

    const brick = (x) => {
      g.fillStyle(0x2a1230, 1); // mortar
      g.fillRect(x, 0, 16, 16);
      g.fillStyle(0x5a3a5e, 1);
      // top course
      g.fillRect(x + 0, 1, 7, 6);
      g.fillRect(x + 8, 1, 8, 6);
      // offset bottom course
      g.fillRect(x + 0, 9, 3, 6);
      g.fillRect(x + 4, 9, 7, 6);
      g.fillRect(x + 12, 9, 4, 6);
      // bevels
      g.fillStyle(0x7a567e, 1);
      g.fillRect(x + 0, 1, 7, 1);
      g.fillRect(x + 8, 1, 8, 1);
      g.fillRect(x + 4, 9, 7, 1);
      g.fillStyle(0x3a1f3e, 1);
      g.fillRect(x + 0, 6, 7, 1);
      g.fillRect(x + 8, 6, 8, 1);
      g.fillRect(x + 4, 14, 7, 1);
    };

    // 1: castle brick
    brick(o(1));

    // 2: jam-stained brick
    brick(o(2));
    g.fillStyle(0xc23a66, 1);
    g.fillRect(o(2) + 3, 0, 2, 6);
    g.fillRect(o(2) + 10, 0, 3, 9);
    g.fillRect(o(2) + 10, 9, 1, 2);
    g.fillStyle(0xe0608a, 1);
    g.fillRect(o(2) + 3, 0, 2, 1);
    g.fillRect(o(2) + 10, 0, 3, 1);

    // 3: steel girder platform
    g.fillStyle(0xb8c0d0, 1);
    g.fillRect(o(3), 0, 16, 3);
    g.fillStyle(0x6a7288, 1);
    g.fillRect(o(3), 3, 16, 1);
    g.fillStyle(0x4c5468, 1);
    g.fillRect(o(3), 4, 16, 10);
    g.fillStyle(0x67708c, 1);
    g.fillRect(o(3) + 3, 4, 2, 10);  // strut
    g.fillRect(o(3) + 11, 4, 2, 10); // strut
    g.fillStyle(0x39405a, 1);
    g.fillRect(o(3), 14, 16, 2);
    g.fillStyle(0xe8eef4, 1);
    g.fillRect(o(3) + 1, 1, 2, 1);  // bolts
    g.fillRect(o(3) + 7, 1, 2, 1);
    g.fillRect(o(3) + 13, 1, 2, 1);

    // 4: vertical pipe
    g.fillStyle(0x46506a, 1);
    g.fillRect(o(4) + 2, 0, 12, 16);
    g.fillStyle(0x66708a, 1);
    g.fillRect(o(4) + 4, 0, 8, 16);
    g.fillStyle(0x96a0ba, 1);
    g.fillRect(o(4) + 10, 0, 2, 16); // highlight stripe
    g.fillStyle(0x7e88a2, 1);       // flanges
    g.fillRect(o(4), 0, 16, 3);
    g.fillRect(o(4), 13, 16, 3);
    g.fillStyle(0x39405a, 1);
    g.fillRect(o(4), 2, 16, 1);
    g.fillRect(o(4), 13, 16, 1);

    // 5: riveted vat-rim block
    g.fillStyle(0x39405a, 1);
    g.fillRect(o(5), 0, 16, 16);
    g.fillStyle(0x7e88a2, 1);
    g.fillRect(o(5) + 1, 1, 14, 14);
    g.fillStyle(0xaab4ce, 1);
    g.fillRect(o(5) + 1, 1, 14, 2);
    g.fillRect(o(5) + 1, 1, 2, 14);
    g.fillStyle(0xdde4f0, 1);
    g.fillRect(o(5) + 3, 3, 2, 2);
    g.fillRect(o(5) + 11, 3, 2, 2);
    g.fillRect(o(5) + 3, 11, 2, 2);
    g.fillRect(o(5) + 11, 11, 2, 2);

    // 6: boiling jam surface
    g.fillStyle(0xa02050, 1);
    g.fillRect(o(6), 0, 16, 16);
    g.fillStyle(0xe84d80, 1);
    g.fillRect(o(6), 0, 16, 3);
    // wave bumps
    g.fillRect(o(6) + 2, 3, 3, 2);
    g.fillRect(o(6) + 9, 3, 4, 2);
    g.fillStyle(0xff9ab8, 1);
    g.fillRect(o(6) + 3, 0, 2, 2);  // glints
    g.fillRect(o(6) + 11, 0, 2, 1);
    g.fillStyle(0xc23a66, 1);
    g.fillRect(o(6) + 5, 8, 3, 3);  // rising bubbles
    g.fillRect(o(6) + 12, 11, 2, 2);

    // 7: deep jam
    g.fillStyle(0x8c1844, 1);
    g.fillRect(o(7), 0, 16, 16);
    g.fillStyle(0x6e1136, 1);
    g.fillRect(o(7) + 2, 3, 4, 4);
    g.fillRect(o(7) + 10, 9, 4, 3);
    g.fillRect(o(7) + 5, 12, 3, 3);
    g.fillStyle(0xc23a66, 1);
    g.fillRect(o(7) + 12, 2, 2, 2);
    g.fillRect(o(7) + 4, 9, 1, 1);

    g.generateTexture("factory-tiles", 8 * 16, 16);
    g.destroy();
  }

  // ------------------------------------------------------------------
  // Level layout — grids built in code, one section at a time, then
  // turned into data tilemaps (ground / jam-death / enemy-stop /
  // scene-change), mirroring the layer names every other class expects.
  _buildLevel() {
    const W = 220, H = 15;
    const E = -1, BRICK = 1, STAIN = 2, GIRDER = 3, PIPE = 4, RIM = 5, JAMTOP = 6, JAM = 7;
    const grid = () => Array.from({ length: H }, () => Array(W).fill(E));
    const ground = grid(), death = grid(), stops = grid(), change = grid();
    const fill = (g, c0, r0, c1, r1, t) => {
      for (let r = r0; r <= r1; r++)
        for (let c = c0; c <= c1; c++) g[r][c] = t;
    };

    // Shell: ceiling, side walls
    fill(ground, 0, 0, W - 1, 1, BRICK);
    fill(ground, 0, 0, 1, H - 1, BRICK);
    fill(ground, W - 2, 0, W - 1, H - 1, BRICK);

    // Floor spans — the gaps between them are the jam vats
    const floors = [[2, 25], [30, 45], [70, 110], [117, 123], [144, 183], [188, 217]];
    floors.forEach(([a, b]) => fill(ground, a, 12, b, 14, BRICK));

    // Staircase up to the plateau over pit 2
    fill(ground, 101, 11, 102, 14, BRICK);
    fill(ground, 103, 10, 104, 14, BRICK);
    fill(ground, 105, 9, 106, 14, BRICK);
    fill(ground, 107, 8, 110, 14, BRICK);

    // Deterministic jam-stain sprinkle on walkable brick + ceiling
    for (let c = 2; c < W - 2; c++) {
      for (const r of [1, 12, 13, 14]) {
        if (ground[r][c] === BRICK && (c * 13 + r * 7) % 11 === 0) {
          ground[r][c] = STAIN;
        }
      }
    }

    // Girder platforms
    fill(ground, 46, 10, 48, 10, GIRDER);   // lake entry
    fill(ground, 58, 9, 59, 9, GIRDER);     // between lake belts
    fill(ground, 112, 9, 113, 9, GIRDER);   // pit-2 crossing
    fill(ground, 133, 10, 134, 10, GIRDER); // between trench belts

    // Riveted rim caps marking every vat edge
    [25, 30, 45, 70, 117, 123, 144, 183, 188].forEach((c) => (ground[12][c] = RIM));

    // Decorative-but-solid wall pipes framing the stage
    fill(ground, 2, 2, 2, 11, PIPE);
    fill(ground, 217, 2, 217, 11, PIPE);

    // Jam vats (cols) — shared with the glow/bubble decorator
    this.vatRanges = [[26, 29], [46, 69], [111, 116], [124, 143], [184, 187]];
    this.vatRanges.forEach(([a, b]) => {
      fill(death, a, 13, b, 13, JAMTOP);
      fill(death, a, 14, b, 14, JAM);
    });

    // Invisible enemy fences penning sentries into their arenas
    [71, 99, 145, 182].forEach((c) => (stops[11][c] = BRICK));

    // Scene-change column just past the exit door
    fill(change, 212, 2, 213, 11, BRICK);

    const mkLayer = (data) => {
      const map = this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 });
      const tiles = map.addTilesetImage("factory-tiles");
      return { map, layer: map.createLayer(0, tiles, 0, 0) };
    };

    const gnd = mkLayer(ground);
    this.map = gnd.map;
    this.groundLayer = gnd.layer;
    this.groundLayer.setCollision([BRICK, STAIN, GIRDER, PIPE, RIM]);

    const dth = mkLayer(death);
    this.deathBlocksLayer = dth.layer;
    this.deathBlocksLayer.setDepth(3);
    this.deathBlocksLayer.setCollision([JAMTOP, JAM]);

    const stp = mkLayer(stops);
    this.enemyStopBlocksLayer = stp.layer;
    this.enemyStopBlocksLayer.setAlpha(0);
    this.enemyStopBlocksLayer.setCollision([BRICK]);

    const chg = mkLayer(change);
    this.sceneChangeLayer = chg.layer;
    this.sceneChangeLayer.setAlpha(0);
    this.sceneChangeLayer.setCollision([BRICK]);
  }

  // ------------------------------------------------------------------
  // Parallax factory interior: round windows far back, vat silhouettes
  // and ceiling pipework in the middle, wall-panel seams up close.
  _paintBackground() {
    const w = this.map.widthInPixels;

    // Far: huge round foundry windows with moonlight
    for (let x = 300; x < w - 200; x += 560) {
      const win = this.add.container(x, 74);
      win.setScrollFactor(0.15);
      win.setDepth(-30);
      win.add(this.add.circle(0, 0, 36, 0x2a1838));
      win.add(this.add.circle(0, 0, 31, 0x412a52));
      win.add(this.add.circle(0, 0, 28, 0x180c26));
      win.add(this.add.rectangle(0, 0, 56, 3, 0x2a1838));
      win.add(this.add.rectangle(0, 0, 3, 56, 0x2a1838));
      win.add(this.add.circle(0, 0, 26, 0xeab0d0, 0.10));
      win.add(this.add.circle(-8, -8, 9, 0xeab0d0, 0.12));
    }

    // Mid: brooding vat silhouettes with risers and gauges
    for (let x = 180; x < w; x += 430) {
      const vat = this.add.container(x, 168);
      vat.setScrollFactor(0.35);
      vat.setDepth(-20);
      vat.add(this.add.rectangle(0, 0, 92, 72, 0x241430));
      vat.add(this.add.rectangle(0, -40, 100, 10, 0x32204a));
      vat.add(this.add.rectangle(28, -66, 12, 44, 0x2a1838)); // riser pipe
      vat.add(this.add.rectangle(-30, 40, 10, 14, 0x190e24)); // legs
      vat.add(this.add.rectangle(30, 40, 10, 14, 0x190e24));
      vat.add(this.add.circle(-22, -14, 8, 0x32204a));         // gauge
      vat.add(this.add.circle(-22, -14, 6, 0x180c26));
      vat.add(this.add.rectangle(-20, -16, 5, 1, 0xc23a66));   // needle
      // Simmer glow at the rim
      vat.add(this.add.rectangle(0, -44, 84, 4, 0xff4d7a, 0.18));
    }

    // Mid: continuous ceiling pipe with hanger brackets
    this.add.rectangle(w / 2, 26, w, 7, 0x2a1838)
      .setScrollFactor(0.35).setDepth(-19);
    for (let x = 60; x < w; x += 120) {
      this.add.rectangle(x, 20, 3, 12, 0x32204a)
        .setScrollFactor(0.35).setDepth(-19);
    }

    // Near: wall panel seams + hanging chains
    for (let x = 48; x < w; x += 96) {
      this.add.rectangle(x, 120, 2, 240, 0x20102e, 0.8)
        .setScrollFactor(0.65).setDepth(-10);
    }
    for (let x = 230; x < w; x += 470) {
      const len = 26 + ((x / 470) % 3) * 14;
      this.add.rectangle(x, 32 + len / 2, 2, len, 0x32204a)
        .setScrollFactor(0.65).setDepth(-10);
      this.add.circle(x + 1, 32 + len, 4, 0x32204a)
        .setScrollFactor(0.65).setDepth(-10);
    }

    // Slow steam wisps drifting up from the mid vats
    for (let x = 180; x < w; x += 430) {
      const puff = this.add.circle(x + 10, 120, 7, 0x9a8aa8, 0.10);
      puff.setScrollFactor(0.35);
      puff.setDepth(-18);
      this.tweens.add({
        targets: puff,
        y: 64,
        alpha: 0,
        scale: 2.0,
        duration: 3800 + (x % 1000),
        repeat: -1,
        delay: x % 1700,
      });
    }
  }

  // Hot glow over every vat plus an endless trickle of surface bubbles.
  _decorateVats() {
    this.vatRanges.forEach(([a, b]) => {
      const x0 = a * 16, x1 = (b + 1) * 16;
      const glow = this.add.rectangle(
        (x0 + x1) / 2, 222, x1 - x0 + 24, 52, 0xff4d7a, 0.10
      );
      glow.setDepth(4);
      this.tweens.add({
        targets: glow,
        alpha: 0.05,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });

    this.time.addEvent({
      delay: 360,
      loop: true,
      callback: () => {
        const [a, b] = this.vatRanges[Phaser.Math.Between(0, this.vatRanges.length - 1)];
        const x = Phaser.Math.Between(a * 16 + 4, (b + 1) * 16 - 4);
        const bub = this.add.circle(x, 212, 1 + Math.random() * 2, 0xe8638c, 0.9);
        bub.setDepth(5);
        this.tweens.add({
          targets: bub,
          y: 204 - Math.random() * 4,
          alpha: 0,
          scale: 1.8,
          duration: 420,
          ease: "Quad.easeOut",
          onComplete: () => bub.destroy(),
        });
      },
    });
  }

  _buildExitDoor() {
    if (!this.textures.exists("factory-door")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      // 40x56 riveted double door
      g.fillStyle(0x39405a, 1);
      g.fillRect(0, 0, 40, 56);
      g.fillStyle(0x5d6680, 1);
      g.fillRect(3, 3, 16, 50);
      g.fillRect(21, 3, 16, 50);
      g.fillStyle(0x7e88a2, 1);
      g.fillRect(3, 3, 16, 2);
      g.fillRect(21, 3, 16, 2);
      // Porthole windows glowing warm
      g.fillStyle(0x2c3248, 1);
      g.fillCircle(11, 16, 6);
      g.fillCircle(29, 16, 6);
      g.fillStyle(0xffd9a0, 1);
      g.fillCircle(11, 16, 4);
      g.fillCircle(29, 16, 4);
      // Rivets and kick plates
      g.fillStyle(0xdde4f0, 1);
      [[5, 6], [16, 6], [23, 6], [34, 6], [5, 46], [16, 46], [23, 46], [34, 46]]
        .forEach(([x, y]) => g.fillRect(x, y, 2, 2));
      g.fillStyle(0x2c3248, 1);
      g.fillRect(3, 48, 16, 5);
      g.fillRect(21, 48, 16, 5);
      // Handles
      g.fillStyle(0xb8c2da, 1);
      g.fillRect(16, 28, 2, 6);
      g.fillRect(22, 28, 2, 6);
      g.generateTexture("factory-door", 40, 56);
      g.destroy();
    }

    this.add.image(3400, 164, "factory-door").setDepth(1);
    const sign = this.add.bitmapText(3400, 122, "tempFont", "EXIT", 10)
      .setOrigin(0.5)
      .setTintFill(0xff8fb3)
      .setDepth(1);
    this.tweens.add({
      targets: sign,
      alpha: 0.35,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });
  }

  _showTitleCard() {
    const t1 = this.add.bitmapText(213, 92, "tempFont", "STAGE 1-4", 16)
      .setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0xffd9e8);
    const t2 = this.add.bitmapText(213, 114, "tempFont", "THE JAM WORKS", 12)
      .setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0xff8fb3);
    this.tweens.add({
      targets: [t1, t2],
      alpha: 0,
      delay: 1700,
      duration: 600,
      onComplete: () => { t1.destroy(); t2.destroy(); },
    });
  }

  changeScene() {
    if (this._changing) return;
    this._changing = true;
    this.jammy.controlsEnabled = false;
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      // Upstream — to Concentrate's plantation
      this.scene.start("Stage2_1");
    });
  }
}
