// Stage 1-3 — SUNSET MESA. Jammy's first stage with Blubert and the
// Rocket Axe, so it is built like a tutorial world: each section
// introduces one idea with a sign and a safe first encounter, then
// mixes them at the end. Built in code (sections below), painted with
// the desert tileset.
class Stage1_3 extends Phaser.Scene {
  constructor() {
    super({ key: "Stage1_3" });
  }

  preload() {
    scene = this;
  }

  create() {
    this._changing = false;
    this.sound.stopAll();
    this.sound.play("Level1MusicLoop", { loop: true });

    if (typeof SeedOfDestruction !== "undefined" && SeedOfDestruction.ensureTexture) {
      SeedOfDestruction.ensureTexture(this);
    }
    this.cameras.main.setBackgroundColor("#c84890");

    this._buildLevel();
    this._paintSky();
    this._buildDesertTiles();
    this._scatterDesertDecor();

    LevelCommon.createGroups(this);

    this.jammy = new Jammy(60, 100);
    this.jammy.sprite.setDepth(100);
    this.children.bringToTop(this.jammy.sprite);
    this.cameras.main.startFollow(this.jammy.sprite, true);
    this.cameras.main.setBounds(0, -320, this.map.widthInPixels, this.map.heightInPixels + 320);

    LevelCommon.wireCollisions(this);
    // Cactus needles
    this.physics.add.overlap(this.jammy.sprite, this.enemyProjectiles, (js, p) => {
      if (!this.jammy.alive || !p.active) return;
      this.jammy.takeDamage(p.x);
      p.destroy();
    });

    this.fruitPlatforms = this.physics.add.group({ allowGravity: false, immovable: true });
    this.physics.add.collider(this.jammy.sprite, this.fruitPlatforms);
    this.hornedRigs = [];

    this._populate();

    this.blubert = new Blubert(this, this.jammy);
    this.blubertRevivesLeft = 1;

    this._showTitleCard();
    LevelCommon.registerStage(this);
    LevelCommon.unlockRocketAxe(this);
    this._blubertBanner();

    const ui = this.scene.get("UIScene");
    if (ui && ui.setWeapon) ui.setWeapon(this.jammy.currentWeapon);
  }

  update() {
    this.jammy.update();
    if (this.blubert) this.blubert.update();
    this.enemies.getChildren().forEach((enemy) => {
      if (enemy.update) enemy.update();
    });
    if (this.hornedRigs) this.hornedRigs.forEach((r) => r.update());
  }

  tryReviveBlubert() {
    LevelCommon.tryReviveBlubert(this);
  }

  // ------------------------------------------------------------------
  // Layout. Columns are 16px; the floor's top row is 11 (y=176) unless a
  // section raises it. Pits get quicksand at the bottom.
  _buildLevel() {
    const W = 352, H = 15;
    this.SAND = 1; this.QUICK = 8;
    const grid = () => Array.from({ length: H }, () => Array(W).fill(-1));
    const ground = grid(), death = grid();
    this.groundTop = Array(W).fill(null);
    const floor = (c0, c1, top = 11) => {
      for (let c = c0; c <= c1; c++) {
        for (let r = top; r < H; r++) ground[r][c] = 1;
        this.groundTop[c] = top;
      }
    };
    const pit = (c0, c1) => {
      for (let c = c0; c <= c1; c++) {
        death[13][c] = 8;
        death[14][c] = 8;
        this.groundTop[c] = null;
      }
    };
    // Walls at both ends
    floor(0, 0, 0);
    floor(W - 1, W - 1, 0);

    // A: welcome strip
    floor(1, 52);
    // B: Rocket Axe — long gap, then a mesa wall
    pit(53, 66);
    floor(67, 78);
    floor(79, 96, 5);
    floor(97, 103, 8);
    floor(104, 112);
    // C: Seedcaster + bushes
    floor(113, 115, 10); // pedestal
    floor(116, 121);
    floor(122, 123, 9); // low wall to lob over
    floor(124, 170);
    // D: sky drones
    floor(171, 215);
    // E: cactus
    floor(216, 250);
    // F: fruit planks over the ground, snappers down in the pits between
    floor(251, 260);
    pit(261, 267);
    floor(268, 282);
    pit(283, 289);
    // G: pineapples + finale (a raised ledge for the near-miss lesson,
    // and a mound with a snapper on top)
    floor(290, 350);
    floor(302, 305, 8);
    floor(326, 329, 9);

    this.pitCols = [[53, 66], [261, 267], [283, 289]];

    const mk = (data) => {
      const map = this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 });
      const tiles = map.addTilesetImage("desert-tiles");
      return { map, layer: map.createLayer(0, tiles, 0, 0) };
    };
    this._ensureDesertTileset();
    const g = mk(ground);
    this.map = g.map;
    this.groundLayer = g.layer;
    this.groundLayer.setAlpha(0); // collision only; visuals painted below
    this.groundLayer.setCollision([1]);
    const d = mk(death);
    this.deathBlocksLayer = d.layer;
    this.deathBlocksLayer.setDepth(1);
    this.deathBlocksLayer.setCollision([8]);
  }

  // Sections, each a lesson. Signs are small wooden boards with text.
  _populate() {
    const X = (c) => c * 16 + 8;
    const FLOOR = 160; // walking y for ground-level enemies

    // --- A: welcome ---
    // One signpost names the stage; everything after is taught by the
    // layout itself (each new idea is staged as its own small challenge).
    new AntToken(this, X(13), 136);
    new Raspberry(this, X(36), FLOOR);
    this._sign(X(6), "SUNSET MESA", "HEAD EAST");

    // --- B: Rocket Axe ---
    // Tokens trace the flight path of a running jump followed straight
    // away by the Rocket Axe, so a fast run collects them all.
    const edge = 53 * 16;
    [[40, 126], [100, 34], [160, -24], [220, -45]].forEach(([dx, y]) => new AntToken(this, edge + dx, y));
    [84, 96].forEach((c) => new AntToken(this, X(c), 56));
    // Bread: tucked at the back of the mesa top, a hop above the tokens
    new BreadToken(this, X(102), 30);
    new Raspberry(this, X(90), 64);

    // --- C: Seedcaster, then bushes one at a time ---
    new GuitarPickup(this, X(114), 140, "desert-seedcaster");
    new SeedAmmoPickup(this, X(116), 150);
    new BushZomberry(this, X(132), 176);
    new SeedAmmoPickup(this, X(138), 150);
    // Three bushes: one hides a Zomberry, two are decoys
    new Bush(this, X(147), 176);
    new BushZomberry(this, X(154), 176);
    new Bush(this, X(161), 176);
    new AntToken(this, X(157), 136);
    new SeedAmmoPickup(this, X(167), 150);

    // --- D: sky drones ---
    this.decoyClouds = [new Cloud(this, X(180), 50), new Cloud(this, X(204), 58)];
    this.cloudBlueberries = [new CloudBlueberry(this, X(190), 56), new CloudBlueberry(this, X(210), 52)];
    this.cloudBlueberries.forEach((b) => this.enemies.add(b));
    new AntToken(this, X(196), 128);
    new Raspberry(this, X(208), FLOOR);

    // --- E: needle cactus ---
    this.cactuses = [new NeedleCactus(this, X(224), 158)];
    this.cactuses.push(new NeedleCactus(this, X(238), 158), new NeedleCactus(this, X(246), 158));
    new AntToken(this, X(242), 96);
    // Bread: high between the needle cactuses, where standing still is risky
    new BreadToken(this, X(232), 84);
    const heal = new PowerUp(this, X(249), 150);
    heal.setData("powerUpType", "heal");

    // --- F: horned-fruit planks + snappers ---
    // The planks hang high over the ground: walk under and the fruit
    // drops on you; climb them for the tokens and the Lost Jam above.
    // The pits between hold Watermelon Snappers that lunge at anything
    // crossing, so the hop needs height.
    this._buildFruitPlatform({ x: X(256), y: 68, w: 74, amp: 10, period: 2400,
      fruits: [{ ox: -22, len: 44 }, { ox: 18, len: 56 }] }, 0);
    [254, 258].forEach((c) => new AntToken(this, X(c), 42));
    // Lost Jam: high above the first plank — plank, then Rocket Axe
    new LostRecord(this, X(256), -16, "Stage1_3");
    new WatermelonSnapper(this, X(264), 204);
    this._buildFruitPlatform({ x: X(272), y: 72, w: 74, amp: 12, period: 2800,
      fruits: [{ ox: -24, len: 40 }, { ox: 0, len: 56 }, { ox: 24, len: 46 }] }, 1);
    this._buildFruitPlatform({ x: X(279), y: 40, w: 60, amp: 10, period: 2200,
      fruits: [{ ox: -14, len: 50 }, { ox: 16, len: 36 }] }, 2);
    [270, 274].forEach((c) => new AntToken(this, X(c), 46));
    [277, 281].forEach((c) => new AntToken(this, X(c), 14));
    // Bread: above the highest plank
    new BreadToken(this, X(284), -10);
    new WatermelonSnapper(this, X(286), 204);

    // --- G: pineapples and the finale ---
    new Pineapple(this, X(296), FLOOR);
    new Pineapple(this, X(304), 112); // on the ledge: the blast just misses it
    new SeedAmmoPickup(this, X(308), 150);
    new BushZomberry(this, X(313), 176);
    new Bush(this, X(318), 176);
    this.cactuses.push(new NeedleCactus(this, X(322), 158));
    // A mound with a snapper on top: get over both
    new WatermelonSnapper(this, X(328), 144);
    new CloudBlueberry(this, X(332), 54);
    [316, 338].forEach((c) => new AntToken(this, X(c), 128));
    // Final fruit platform with the secret exit high above it
    this._buildFruitPlatform({ x: X(336), y: 62, w: 92, amp: 22, period: 2200,
      fruits: [{ ox: -30, len: 60 }, { ox: 0, len: 36 }, { ox: 30, len: 50 }] }, 3);
    this._buildSecretExit(X(336));
    this._buildExitPortal(X(345), 158);
  }

  _sign(x, line1, line2, groundY) {
    const gy = typeof groundY === "number" ? groundY : 176;
    this.add.rectangle(x, gy - 10, 3, 20, 0x8c5a34).setDepth(3);
    const w = Math.max(line1.length, (line2 || "").length) * 6 + 12;
    const h = line2 ? 24 : 14;
    this.add.rectangle(x, gy - 20 - h / 2, w, h, 0xd8a868).setStrokeStyle(1, 0x6e4527).setDepth(3);
    this.add.bitmapText(x, gy - 20 - h / 2 - (line2 ? 5 : 0), "tempFont", line1, 8).setOrigin(0.5).setTintFill(0x3a2818).setDepth(4);
    if (line2) this.add.bitmapText(x, gy - 20 - h / 2 + 5, "tempFont", line2, 8).setOrigin(0.5).setTintFill(0x6e4527).setDepth(4);
  }

  _blubertBanner() {
    const run = getRunState();
    if (!run || run.blubertBannerShown) return;
    run.blubertBannerShown = true;
    const t1 = this.add.bitmapText(213, 180, "tempFont", "BLUBERT JOINED THE BAND", 12)
      .setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0x8cc8ff).setAlpha(0);
    const t2 = this.add.bitmapText(213, 196, "tempFont", "HE SCOUTS AHEAD AND SPOTS HIDDEN ZOMBERRIES", 8)
      .setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0xffffff).setAlpha(0);
    this.tweens.add({ targets: [t1, t2], alpha: 1, delay: 7000, duration: 400 });
    this.tweens.add({ targets: [t1, t2], alpha: 0, delay: 11000, duration: 600, onComplete: () => { t1.destroy(); t2.destroy(); } });
  }

  _buildFruitPlatform(cfg, index) {
    const { x, y, w, amp, period, fruits } = cfg;
    this._ensurePlankTexture();
    const plat = this.add.tileSprite(x, y, w, 8, "wood-platform");
    plat.setDepth(54);
    this.physics.add.existing(plat);
    plat.body.setAllowGravity(false);
    plat.body.setImmovable(true);
    plat.body.checkCollision.down = false;
    plat.body.checkCollision.left = false;
    plat.body.checkCollision.right = false;
    this.fruitPlatforms.add(plat);

    const vineGfx = this.add.graphics();
    vineGfx.setDepth(53);
    const hfs = fruits.map((f) => {
      const hf = new HornedFruit(this);
      hf.setPosition(x + f.ox, y + f.len);
      hf.setDepth(53);
      return { hf, ox: f.ox, len: f.len };
    });
    const phase = index * 600;
    const startTime = this.time.now - phase;
    const baseY = y;
    const omega = (Math.PI * 2) / (period / 1000);
    this.hornedRigs.push({
      update: () => {
        // Drive the bob with velocity so the physics step moves the
        // platform and Jammy rides it instead of flickering between
        // "standing" and "falling" every frame.
        const t = (this.time.now - startTime) / 1000;
        const targetY = baseY + Math.sin(t * omega) * amp;
        const vy = amp * omega * Math.cos(t * omega) + (targetY - plat.y) * 2;
        plat.body.setVelocityY(vy);
        const py = plat.y;
        vineGfx.clear();
        for (const { hf, ox, len } of hfs) {
          if (!hf || !hf.scene) continue;
          const fx = x + ox;
          if (!hf.dropped) {
            hf.x = fx;
            hf.y = py + len;
            hf.baseY = hf.y;
            const topY = py + 3;
            const botY = hf.y - 6;
            vineGfx.lineStyle(2, 0x2f6a2a, 1);
            vineGfx.beginPath();
            vineGfx.moveTo(fx, topY);
            vineGfx.lineTo(fx, botY);
            vineGfx.strokePath();
            vineGfx.fillStyle(0x2f6a2a, 1);
            const vineLen = botY - topY;
            const steps = Math.max(3, Math.floor(vineLen / 6));
            for (let s = 1; s < steps; s++) {
              const ty = topY + (vineLen * s) / steps;
              const side = s % 2 === 0 ? -1 : 1;
              vineGfx.fillTriangle(fx, ty, fx + side * 4, ty - 2, fx + side * 4, ty + 2);
            }
          }
        }
      },
    });
  }

  // ------------------------------------------------------------------
  // Desert tileset: 1-3 sand tops, 4-5 loose sand, 6-7 sandstone,
  // 8 quicksand (the pit floor).
  _ensureDesertTileset() {
    if (this.textures.exists("desert-tiles")) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const o = (i) => i * 16;
    const SAND = 0xe8c878, SANDLT = 0xf8e0a0, SANDDK = 0xc89850, SANDMD = 0xe0bc70,
      PEB = 0xa88858, PEBLT = 0xd8c098, STONE = 0xc87848, STONEDK = 0xb05c34, STONELT = 0xd88858;
    const sandTop = (x, seed) => {
      g.fillStyle(SAND, 1); g.fillRect(x, 0, 16, 16);
      g.fillStyle(SANDLT, 1); g.fillRect(x, 0, 16, 2);
      g.fillRect(x + ((seed * 5) % 9), 2, 4, 1); g.fillRect(x + ((seed * 11) % 11), 2, 2, 2);
      g.fillStyle(SANDDK, 1);
      g.fillRect(x + ((seed * 7) % 6), 5 + (seed % 3), 6, 1);
      g.fillRect(x + 8 + ((seed * 3) % 5), 9 + ((seed * 2) % 3), 5, 1);
      g.fillRect(x + ((seed * 13) % 8), 13, 4, 1);
      g.fillStyle(SANDMD, 1);
      g.fillRect(x + ((seed * 17) % 14), 7, 1, 1); g.fillRect(x + ((seed * 23) % 14), 11, 1, 1);
    };
    sandTop(o(1), 1); sandTop(o(2), 2);
    g.fillStyle(PEB, 1); g.fillRect(o(2) + 10, 1, 4, 3);
    g.fillStyle(PEBLT, 1); g.fillRect(o(2) + 11, 1, 2, 1);
    sandTop(o(3), 3);
    g.fillStyle(0xb89c50, 1); g.fillRect(o(3) + 3, 0, 1, 3); g.fillRect(o(3) + 5, 0, 1, 2); g.fillRect(o(3) + 7, 1, 1, 2);
    const sandBody = (x, seed) => {
      g.fillStyle(SANDMD, 1); g.fillRect(x, 0, 16, 16);
      g.fillStyle(SANDDK, 1);
      g.fillRect(x + ((seed * 7) % 7), 3 + (seed % 4), 5, 1); g.fillRect(x + 7 + ((seed * 5) % 6), 10 + (seed % 3), 5, 1);
      g.fillStyle(SAND, 1); g.fillRect(x + ((seed * 11) % 12), 6, 2, 2); g.fillRect(x + ((seed * 13) % 12), 13, 2, 1);
    };
    sandBody(o(4), 1); sandBody(o(5), 4);
    g.fillStyle(PEB, 1); g.fillRect(o(5) + 4, 7, 5, 4); g.fillRect(o(5) + 10, 9, 3, 3);
    g.fillStyle(PEBLT, 1); g.fillRect(o(5) + 5, 8, 2, 1);
    const stone = (x, seed) => {
      g.fillStyle(STONE, 1); g.fillRect(x, 0, 16, 16);
      g.fillStyle(STONEDK, 1); g.fillRect(x, 3 + (seed % 2), 16, 2); g.fillRect(x, 11 - (seed % 2), 16, 2);
      g.fillStyle(STONELT, 1); g.fillRect(x, 0, 16, 1); g.fillRect(x + ((seed * 7) % 9), 7, 6, 1);
    };
    stone(o(6), 1); stone(o(7), 2);
    g.fillStyle(0x8c4828, 1); g.fillRect(o(7) + 6, 5, 1, 3); g.fillRect(o(7) + 7, 8, 1, 3); g.fillRect(o(7) + 6, 11, 1, 2);
    // 8: quicksand — darker, swirled
    g.fillStyle(0xb8903c, 1); g.fillRect(o(8), 0, 16, 16);
    g.fillStyle(0x9c7830, 1); g.fillRect(o(8) + 2, 3, 6, 2); g.fillRect(o(8) + 9, 9, 5, 2); g.fillRect(o(8) + 4, 12, 3, 1);
    g.fillStyle(0xd0a850, 1); g.fillRect(o(8) + 10, 2, 3, 1); g.fillRect(o(8) + 1, 8, 4, 1);
    g.generateTexture("desert-tiles", 9 * 16, 16);
    g.destroy();
  }

  // Paint sand / stone over the invisible collision grid, following the
  // terrain: the top solid tile of each column is a sand lip, the next
  // is loose sand, everything below is sandstone.
  _buildDesertTiles() {
    const W = this.map.width, H = this.map.height;
    const pick = (c, opts, salt) => opts[(c * 31 + salt * 17 + ((c * 13) >> 2)) % opts.length];
    const data = [];
    for (let r = 0; r < H; r++) {
      const row = [];
      for (let c = 0; c < W; c++) {
        const top = this.groundTop[c];
        if (top === null || r < top) row.push(-1);
        else if (r === top) row.push(pick(c, [1, 1, 2, 1, 3, 1, 2, 1, 1, 3], 1));
        else if (r === top + 1) row.push(pick(c, [4, 4, 5, 4, 4, 5, 4], 2));
        else row.push(pick(c, [6, 6, 7, 6, 7, 6], r));
      }
      data.push(row);
    }
    const vmap = this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 });
    const ts = vmap.addTilesetImage("desert-tiles");
    this.desertLayer = vmap.createLayer(0, ts, 0, 0);
    this.desertLayer.setDepth(1);
  }

  _scatterDesertDecor() {
    const mk = (key, w, h, draw) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      draw(g);
      g.generateTexture(key, w, h);
      g.destroy();
    };
    mk("desert-dune", 42, 10, (g) => {
      g.fillStyle(0xf0d490, 1); g.fillRect(8, 4, 26, 4); g.fillRect(2, 8, 38, 2);
      g.fillStyle(0xf8e0a0, 1); g.fillRect(10, 4, 12, 2);
      g.fillStyle(0xc89850, 1); g.fillRect(4, 9, 10, 1);
    });
    mk("desert-rocks", 18, 10, (g) => {
      g.fillStyle(0x8c6a48, 1); g.fillRect(2, 4, 8, 6); g.fillRect(9, 6, 7, 4);
      g.fillStyle(0xb08c60, 1); g.fillRect(3, 4, 4, 2); g.fillRect(10, 6, 3, 2);
      g.fillStyle(0x6a4e34, 1); g.fillRect(2, 9, 14, 1);
    });
    mk("desert-skull", 16, 10, (g) => {
      g.fillStyle(0xe8e0c8, 1); g.fillRect(4, 2, 8, 6); g.fillRect(0, 0, 4, 3); g.fillRect(12, 0, 4, 3); g.fillRect(6, 8, 4, 2);
      g.fillStyle(0x3a2818, 1); g.fillRect(5, 4, 2, 2); g.fillRect(9, 4, 2, 2);
    });
    let x = 90, i = 0;
    while (x < this.map.widthInPixels - 80) {
      const c = Math.floor(x / 16);
      const top = this.groundTop[c];
      if (top !== null) {
        const y = top * 16 - 4;
        const kind = i % 3;
        if (kind === 0) this.add.image(x, y, "desert-dune").setDepth(2);
        else if (kind === 1) this.add.image(x, y, "desert-rocks").setDepth(2);
        else this.add.image(x, y, "desert-dune").setDepth(2).setFlipX(true);
      }
      x += 210 + ((i * 73) % 160);
      i++;
    }
    this.add.image(1234, 172, "desert-skull").setDepth(2);
    this.add.image(4700, 172, "desert-skull").setDepth(2).setFlipX(true);
  }

  _paintSky() {
    const bands = [
      [0, 70, 0xc84890],
      [70, 115, 0xe06898],
      [115, 150, 0xf5a8b8],
      [150, 240, 0xffc9a0],
    ];
    bands.forEach(([y0, y1, color]) => {
      this.add.rectangle(213, (y0 + y1) / 2, 426, y1 - y0, color)
        .setScrollFactor(0)
        .setDepth(-40);
    });

    // Sun — gritty dithered pixel disc with stripe cuts, half-sunk
    // behind the skyline
    this._ensureSunTexture();
    this.add.circle(330, 132, 38, 0xffe2a8, 0.30)
      .setScrollFactor(0.12, 1)
      .setDepth(-38);
    this.add.image(330, 132, "mesa-sun")
      .setScrollFactor(0.12, 1)
      .setDepth(-37);

    // Parallax layers must cover the whole (long) level
    const limit = this.map.widthInPixels * 0.22 + 480;

    // Far skyline — a second, paler row of towers behind the near one
    for (let x = 20; x < limit; x += 64) {
      const h = 24 + ((x * 5) % 20);
      this.add.rectangle(x, 176 - h / 2, 30, h, 0xc06090)
        .setScrollFactor(0.14, 1)
        .setDepth(-36);
    }

    // City skyline silhouette — Level 1's city, far below this skyway.
    // Modest heights: only rooftops peek over the horizon line.
    const bld = [
      [0, 40, 30], [36, 26, 26], [70, 48, 34], [110, 30, 22], [136, 58, 38],
      [180, 36, 30], [216, 50, 26], [248, 28, 30], [284, 62, 40], [330, 44, 28],
      [364, 32, 24], [392, 52, 34], [432, 38, 26], [462, 28, 30], [498, 60, 36],
      [540, 46, 28], [574, 34, 24], [604, 50, 32], [642, 30, 26], [674, 54, 36],
      [716, 40, 28], [750, 48, 26], [782, 32, 30], [818, 58, 38], [862, 42, 28],
      [896, 30, 26], [928, 46, 32],
    ];
    const bldAll = [];
    for (let off = 0; off < limit; off += 960) bld.forEach(([x, h, w]) => bldAll.push([x + off, h, w]));
    bldAll.forEach(([x, h, w]) => {
      this.add.rectangle(x + w / 2, 176 - h / 2, w, h, 0xa04878)
        .setScrollFactor(0.2, 1)
        .setDepth(-35);
      // A few lit windows per tower
      for (let i = 0; i < 3; i++) {
        const wx = x + 4 + ((x * 7 + i * 13) % (w - 8));
        const wy = 176 - 6 - ((x * 11 + i * 23) % (h - 10));
        this.add.rectangle(wx, wy, 2, 3, 0xffd9a0, 0.9)
          .setScrollFactor(0.2, 1)
          .setDepth(-35);
      }
      // Antenna on the tall ones
      if (h > 52) {
        this.add.rectangle(x + w / 2, 176 - h - 6, 2, 12, 0xa04878)
          .setScrollFactor(0.2, 1)
          .setDepth(-35);
      }
    });

    // Thin haze drifting just over the rooftops
    for (let x = 0; x < limit; x += 170) {
      const puffY = 164 + ((x / 170) % 3) * 4;
      this.add.ellipse(x + 40, puffY, 120, 10, 0xffc8d8, 0.35)
        .setScrollFactor(0.22, 1)
        .setDepth(-34);
    }
  }
  _ensureSunTexture() {
    if (this.textures.exists("mesa-sun")) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const R = 27, C = 32; // radius, center
    const cutRows = new Set([8, 9, 14, 15, 20, 21]); // dy bands to skip
    for (let dy = -R + 1; dy < R; dy += 2) {
      if (cutRows.has(dy) || cutRows.has(dy + 1)) continue;
      // stepped half-width, quantized to chunky 2px
      const hw = Math.floor(Math.sqrt(R * R - dy * dy) / 2) * 2;
      if (hw <= 0) continue;
      g.fillStyle(0xffb850, 1);
      g.fillRect(C - hw, C + dy, hw * 2, 2);
      // rim dither flecks just outside the edge, alternating rows
      if ((dy & 2) === 0 && hw < R - 2) {
        g.fillStyle(0xe89048, 1);
        g.fillRect(C - hw - 2, C + dy, 2, 2);
        g.fillRect(C + hw, C + dy, 2, 2);
      }
    }
    // hotter core, offset up-left
    for (let dy = -19; dy < 1; dy += 2) {
      const hw = Math.floor(Math.sqrt(361 - dy * dy) / 2) * 2 - 2;
      if (hw <= 0) continue;
      g.fillStyle(0xffd877, 1);
      g.fillRect(C - 3 - hw, C - 5 + dy, hw * 2, 2);
    }
    for (let dy = -11; dy < -1; dy += 2) {
      const hw = Math.floor(Math.sqrt(121 - dy * dy) / 2) * 2 - 2;
      if (hw <= 0) continue;
      g.fillStyle(0xfff0b0, 1);
      g.fillRect(C - 6 - hw, C - 8 + dy, hw * 2, 2);
    }
    g.generateTexture("mesa-sun", 64, 64);
    g.destroy();
  }
  _ensurePlankTexture() {
    if (this.textures.exists("wood-platform")) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    // 16x8 plank segment
    g.fillStyle(0xa87848, 1);
    g.fillRect(0, 0, 16, 8);
    g.fillStyle(0xd8a868, 1);
    g.fillRect(0, 0, 16, 2);
    g.fillStyle(0x7a5430, 1);
    g.fillRect(7, 0, 1, 8);   // plank seam
    g.fillRect(2, 4, 3, 1);   // grain
    g.fillRect(11, 5, 3, 1);
    g.fillStyle(0x6e4527, 1);
    g.fillRect(0, 7, 16, 1);
    g.fillStyle(0x3a2818, 1); // nails
    g.fillRect(3, 1, 1, 1);
    g.fillRect(12, 1, 1, 1);
    g.generateTexture("wood-platform", 16, 8);
    g.destroy();
  }
  _showTitleCard() {
    const t1 = this.add.bitmapText(213, 92, "tempFont", "STAGE 1-3", 16)
      .setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0xffffff);
    const t2 = this.add.bitmapText(213, 114, "tempFont", "SUNSET MESA", 12)
      .setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0xffc9a0);
    this.tweens.add({
      targets: [t1, t2],
      alpha: 0,
      delay: 1700,
      duration: 600,
      onComplete: () => { t1.destroy(); t2.destroy(); },
    });
  }

  _buildSecretExit(x) {
    // A zig-zag of three hard clouds above the last fruit platform:
    // rocket LEFT off the platform onto the low cloud, RIGHT onto the
    // middle one, LEFT again onto the top one, which carries the
    // portal. The Rocket Axe always launches sideways, so a straight-up
    // portal was visible but not reachable. Tokens trace each hop.
    const a = { x: x - 170, y: -40 };
    const b = { x: x + 10, y: -136 };
    const c = { x: x - 170, y: -232 };
    [a, b, c].forEach((p) => LevelCommon.addCloudPlatform(this, p.x, p.y, 1));
    [[x - 70, -6], [x - 120, -48], [a.x + 50, -110], [b.x - 60, -150], [b.x - 70, -206], [c.x + 60, -248]]
      .forEach(([tx, ty]) => new AntToken(this, tx, ty));
    LevelCommon.addSecretExit(this, c.x, c.y - 24, "Stage1_S", "1-S");
  }

  _buildExitPortal(x, y) {
    const glow = this.add.circle(x, y, 22, 0xffb86b, 0.25);
    glow.setDepth(49);
    this.tweens.add({ targets: glow, scale: 1.3, alpha: 0.1, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.exitPortal = this.physics.add.sprite(x, y, "dev-portal", "portal1");
    this.exitPortal.body.setAllowGravity(false);
    this.exitPortal.body.setImmovable(true);
    this.exitPortal.setScale(1.5);
    this.exitPortal.setDepth(50);
    this.exitPortal.setTint(0xffb86b);
    this.exitPortal.play("dev-portal-swirl");
    this.add.bitmapText(x, y - 34, "tempFont", "1-4", 8).setOrigin(0.5).setTintFill(0xffd9a0).setDepth(50);
    this.physics.add.overlap(this.jammy.sprite, this.exitPortal, () => this.changeScene());
  }

  changeScene() {
    LevelCommon.finishStage(this, "Stage1_4");
  }
}
