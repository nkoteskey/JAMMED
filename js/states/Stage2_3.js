// Stage 2-3 — COLD STORAGE. Preservation's other face. Where the
// Archive seals masters, Cold Storage seals the artists themselves:
// rows of named fruit in ice on Concentrate's cold-room shelves.
//
// New ground rules: the floor is ice (you slide), flash-freezers
// exhale down the aisles, icicles drop from the rails, and the
// Frostpick found here turns enemies into standable ice blocks.
class Stage2_3 extends Phaser.Scene {
  constructor() {
    super({ key: "Stage2_3" });
  }

  preload() { scene = this; }

  create() {
    this.sound.stopAll();
    if (typeof Chip !== "undefined") Chip.stop();
    Chip.play("coldstorage");

    if (typeof SeedOfDestruction !== "undefined") SeedOfDestruction.ensureTexture(this);

    this.cameras.main.setBackgroundColor("#0a1c26");

    this._buildTilesetTexture();
    this._buildLevel();
    this._paintBackground();

    this.bullets = this.physics.add.group();
    this.collectibles = this.physics.add.group();
    this.enemies = this.add.group();
    this.enemyProjectiles = this.physics.add.group();

    const sp = checkpointSpawn(this, 56, 150);
    this.jammy = new Jammy(sp.x, sp.y);
    this.jammy.sprite.setDepth(100);
    this.jammy.controlsEnabled = true;
    this.children.bringToTop(this.jammy.sprite);

    // Checkpoints — x0x relay posts the murmur remembers you at
    initCheckpoints(this, [[560, 192], [1500, 192], [2300, 192]], 192);

    setupPlatformerCamera(this, this.jammy, {});
    this.cameras.main.setBounds(0, -160, this.map.widthInPixels, 240 + 160);

    this.physics.add.overlap(this.jammy.sprite, this.collectibles, (j, c) => c.effect());
    this.groundCollider = this.physics.add.collider(this.jammy.sprite, this.groundLayer);
    this.physics.add.collider(this.jammy.sprite, this.deathBlocksLayer, () =>
      this.jammy.instantDeath());
    this._changing = false;
    this.physics.add.collider(this.jammy.sprite, this.sceneChangeLayer, () => this.changeScene());
    this.physics.add.collider(this.collectibles, this.groundLayer);
    this.physics.add.collider(this.enemies, this.groundLayer);
    this.physics.add.collider(this.enemies, this.enemyStopBlocksLayer);

    this._buildShelves();
    this._buildIcicles();

    // --- The cold room's staff ---
    [[430, 176, -1], [980, 176, 1], [1640, 176, -1], [2180, 176, 1], [2720, 176, -1]]
      .forEach(([x, y, d], i) => new FlashFreezer(this, x, y, d, { phase: i * 700 }));
    [620, 1320, 2020, 2620].forEach((x) => new TinSoldier(this, x, 170));
    [[900, 96], [1900, 96]].forEach(([x, y]) => new CannerDrone(this, x, y));
    [[1180, 110], [2400, 110]].forEach(([x, y]) => new StaticWasp(this, x, y));

    // --- The people on the shelves ---
    this.totalArtists = 0;
    this.freedArtists = 0;
    [
      [330, "MARMALADE JONES"], [760, "B.B. BRAMBLE"], [1130, "LIL KUMQUAT"],
      [1560, "PLUM DELUXE"], [1980, "MISS APRICOT"], [2350, "FIG NEWMAN"],
      [2760, "THE CITRUS SISTERS"],
    ].forEach(([x, name]) => {
      new FrozenArtist(this, x, 158, name);
      this.totalArtists++;
    });
    this.rescueText = this.add.bitmapText(8, 214, "tempFont", "", 8)
      .setScrollFactor(0).setDepth(340).setTintFill(0x9fdcf4);
    this._updateRescueCounter();

    // --- The Frostpick, early, because the stage is built around it ---
    new GuitarPickup(this, 208, 152, "frostpick");

    // --- Pickups ---
    [[130, 172], [155, 172], [560, 128], [585, 128], [1050, 172],
     [1420, 120], [1445, 120], [1860, 172], [2260, 128], [2860, 172]]
      .forEach(([x, y]) => new AntToken(this, x, y));
    new RoyaltyScrap(this, 1700, 168, "COLD ROOM MANIFEST: 412 UNITS. ASSET CLASS: TALENT");
    [[880, 150], [2100, 150]].forEach(([x, y]) => new SeedAmmoPickup(this, x, y));
    const heal = new PowerUp(this, 1500, 150);
    heal.setData("powerUpType", "heal");
    heal.val = 2;

    this.blubert = new Blubert(this, this.jammy);
    this.blubertRevivesLeft = 1;

    ensureX0XTexture(this);
    this.add.image(560, 214, "x0x-glyph").setDepth(2);
    this.add.image(2300, 214, "x0x-glyph").setDepth(2);
    this.murmur = new Murmur(this);
    this.murmur.addTrigger(120, "cold room. they dont squeeze everyone. some they just keep");
    this.murmur.addTrigger(240, "that pick freezes things solid. frozen things hold your weight");
    this.murmur.addTrigger(360, "the slabs crack to sonic. three good hits and someone walks");
    this.murmur.addTrigger(1100, "mind the floor. ice doesnt care which way you meant to go");
    this.murmur.addTrigger(2500, "every one you thaw sings at the spire. count them");

    this._buildExitDoor();
    this._showTitleCard();

    const ui = this.scene.get("UIScene");
    if (ui && ui.setWeapon) ui.setWeapon(this.jammy.currentWeapon);
  }

  onArtistFreed() {
    this.freedArtists++;
    this._updateRescueCounter();
  }

  _updateRescueCounter() {
    if (this.rescueText) {
      this.rescueText.setText(`THAWED ${this.freedArtists}/${this.totalArtists}`);
    }
  }

  update() {
    this.jammy.update();
    updatePlatformerCamera(this, this.jammy);
    if (this.blubert) this.blubert.update();
    this.enemies.getChildren().forEach((e) => { if (e.update) e.update(); });
    if (this.murmur) this.murmur.update(this.jammy.sprite.x);
    this._updateIce();
    if (this.icicles) this.icicles.forEach((i) => i.update());
  }

  tryReviveBlubert() {
    if (this.blubert || !this.jammy || (this.blubertRevivesLeft || 0) <= 0) return;
    this.blubertRevivesLeft -= 1;
    this.blubert = new Blubert(this, this.jammy);
  }

  // Slick floor: on ice tiles Jammy keeps his momentum instead of
  // stopping dead, and accelerates toward his input rather than
  // snapping to walk speed. Off ice, normal control resumes.
  _updateIce() {
    const j = this.jammy;
    if (!j || !j.alive || !j.sprite.body) return;
    const grounded = j.sprite.body.blocked.down || j.sprite.body.touching.down;
    const tile = this.groundLayer.getTileAtWorldXY(
      j.sprite.x, j.sprite.y + j.sprite.height / 2 + 4);
    const onIce = grounded && tile && (tile.index === 2 || tile.index === 3);

    if (!onIce) {
      this._iceVel = null;
      return;
    }
    // Carry and blend: input nudges the current velocity, it never
    // replaces it, so stopping and turning both take a moment.
    let v = this._iceVel === null || this._iceVel === undefined
      ? j.sprite.body.velocity.x : this._iceVel;
    const want = j.leftIsDown ? -j.walkSpeed : j.rightIsDown ? j.walkSpeed : 0;
    const accel = want === 0 ? 0.012 : 0.035; // friction vs. steering
    v += (want - v) * accel;
    if (Math.abs(v) < 3 && want === 0) v = 0;
    this._iceVel = v;
    j.sprite.body.setVelocityX(v);
  }

  // ------------------------------------------------------------------
  _buildTilesetTexture() {
    if (this.textures.exists("cold-tiles")) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const o = (i) => i * 16;

    // 1: frosted wall panel
    g.fillStyle(0x16303c, 1); g.fillRect(o(1), 0, 16, 16);
    g.fillStyle(0x1e3e4e, 1); g.fillRect(o(1) + 1, 1, 14, 14);
    g.fillStyle(0x2a5064, 1); g.fillRect(o(1) + 1, 1, 14, 2);
    g.fillStyle(0xbfe8f8, 0.35); g.fillRect(o(1) + 2, 12, 5, 1);

    // 2: ice floor (slick) — index 2 & 3 are the slippery ones
    g.fillStyle(0x6fb4d4, 1); g.fillRect(o(2), 0, 16, 16);
    g.fillStyle(0xbfe8f8, 1); g.fillRect(o(2), 0, 16, 3);
    g.fillStyle(0xffffff, 0.8); g.fillRect(o(2) + 2, 0, 5, 1);
    g.fillRect(o(2) + 10, 1, 4, 1);
    g.fillStyle(0x4a90b0, 1); g.fillRect(o(2) + 3, 7, 6, 1);
    g.fillRect(o(2) + 9, 11, 5, 1);

    // 3: ice floor variant with a deep crack
    g.fillStyle(0x6fb4d4, 1); g.fillRect(o(3), 0, 16, 16);
    g.fillStyle(0xbfe8f8, 1); g.fillRect(o(3), 0, 16, 3);
    g.fillStyle(0xffffff, 0.8); g.fillRect(o(3) + 6, 0, 6, 1);
    g.fillStyle(0x38789a, 1);
    g.fillRect(o(3) + 5, 3, 1, 4); g.fillRect(o(3) + 6, 7, 1, 4);
    g.fillRect(o(3) + 5, 11, 1, 4);

    // 4: grip decking (safe, non-slip metal) — index 4
    g.fillStyle(0x2e4a5c, 1); g.fillRect(o(4), 0, 16, 16);
    g.fillStyle(0x456a80, 1); g.fillRect(o(4), 0, 16, 4);
    g.fillStyle(0x5c8298, 1);
    for (let x = 1; x < 16; x += 4) g.fillRect(o(4) + x, 1, 2, 2);
    g.fillStyle(0x1c3140, 1); g.fillRect(o(4), 4, 16, 12);
    g.fillStyle(0x2e4a5c, 1);
    for (let x = 2; x < 16; x += 5) g.fillRect(o(4) + x, 5, 2, 10);

    // 5: freezer coil block
    g.fillStyle(0x24485c, 1); g.fillRect(o(5), 0, 16, 16);
    g.fillStyle(0x9fdcf4, 1);
    for (let y = 2; y < 15; y += 4) g.fillRect(o(5) + 1, y, 14, 2);
    g.fillStyle(0xd8f4ff, 1);
    for (let y = 2; y < 15; y += 4) g.fillRect(o(5) + 1, y, 14, 1);

    // 6: frozen brine surface (deadly)
    g.fillStyle(0x2e6e8c, 1); g.fillRect(o(6), 0, 16, 16);
    g.fillStyle(0x7fc8e0, 1); g.fillRect(o(6), 0, 16, 3);
    g.fillStyle(0xd8f4ff, 1); g.fillRect(o(6) + 3, 0, 3, 1);
    g.fillRect(o(6) + 10, 1, 4, 1);
    g.fillStyle(0x1e4a60, 1); g.fillRect(o(6) + 5, 8, 4, 3);

    // 7: brine depth (deadly)
    g.fillStyle(0x16394a, 1); g.fillRect(o(7), 0, 16, 16);
    g.fillStyle(0x0f2836, 1);
    g.fillRect(o(7) + 3, 4, 4, 3); g.fillRect(o(7) + 10, 10, 4, 3);

    g.generateTexture("cold-tiles", 8 * 16, 16);
    g.destroy();
  }

  _buildLevel() {
    const W = 200, H = 15;
    const E = -1, PANEL = 1, ICE = 2, ICE2 = 3, GRIP = 4, COIL = 5, BRINETOP = 6, BRINE = 7;
    const grid = () => Array.from({ length: H }, () => Array(W).fill(E));
    const ground = grid(), death = grid(), stops = grid(), change = grid();
    const fill = (g, c0, r0, c1, r1, t) => {
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) g[r][c] = t;
    };

    fill(ground, 0, 0, W - 1, 1, PANEL);
    fill(ground, 0, 0, 1, H - 1, PANEL);
    fill(ground, W - 2, 0, W - 1, H - 1, PANEL);

    // Aisle floors, mostly ice with grip strips at the danger points
    this.floors = [[2, 42], [46, 88], [92, 132], [136, 176], [180, 197]];
    this.floors.forEach(([a, b]) => {
      for (let c = a; c <= b; c++) {
        ground[12][c] = (c * 7) % 11 === 0 ? ICE2 : ICE;
        ground[13][c] = PANEL;
        ground[14][c] = PANEL;
      }
    });
    // Grip decking right at the pit lips so a slide isn't an instant death
    [[39, 42], [46, 49], [85, 88], [92, 95], [129, 132], [136, 139],
     [173, 176], [180, 183]].forEach(([a, b]) => fill(ground, a, 12, b, 12, GRIP));

    // Brine channels between the aisles
    this.channels = [[43, 45], [89, 91], [133, 135], [177, 179]];
    this.channels.forEach(([a, b]) => {
      fill(death, a, 13, b, 13, BRINETOP);
      fill(death, a, 14, b, 14, BRINE);
    });

    // Upper catwalks (grip) reachable by jump or a frozen enemy
    fill(ground, 18, 8, 26, 8, GRIP);
    fill(ground, 56, 7, 64, 7, GRIP);
    fill(ground, 104, 8, 112, 8, GRIP);
    fill(ground, 148, 7, 156, 7, GRIP);
    fill(ground, 186, 8, 193, 8, GRIP);

    // Refrigeration coils. They hang from the ceiling so they read as
    // heavy machinery without walling off the aisle — a floor-to-
    // ceiling column here would block both movement and every shot.
    [10, 34, 70, 100, 124, 160, 190].forEach((c) => fill(ground, c, 2, c, 4, COIL));
    // A few chest-height coil blocks double as stepping stones
    [28, 78, 118, 166].forEach((c) => fill(ground, c, 10, c + 1, 10, COIL));

    [3, 41, 47, 87, 93, 131, 137, 175, 181, 196].forEach((c) => (stops[11][c] = PANEL));
    fill(change, 193, 3, 194, 11, PANEL);

    const mk = (data) => {
      const map = this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 });
      return { map, layer: map.createLayer(0, map.addTilesetImage("cold-tiles"), 0, 0) };
    };
    const gnd = mk(ground);
    this.map = gnd.map;
    this.groundLayer = gnd.layer;
    this.groundLayer.setCollision([PANEL, ICE, ICE2, GRIP, COIL]);

    const d = mk(death);
    this.deathBlocksLayer = d.layer;
    this.deathBlocksLayer.setDepth(3);
    this.deathBlocksLayer.setCollision([BRINETOP, BRINE]);

    const s = mk(stops);
    this.enemyStopBlocksLayer = s.layer;
    this.enemyStopBlocksLayer.setAlpha(0);
    this.enemyStopBlocksLayer.setCollision([PANEL]);

    const c = mk(change);
    this.sceneChangeLayer = c.layer;
    this.sceneChangeLayer.setAlpha(0);
    this.sceneChangeLayer.setCollision([PANEL]);
  }

  _paintBackground() {
    const w = this.map.widthInPixels;
    // Cold gradient bands
    [[0, 60, 0x081620], [60, 110, 0x0a1c26], [110, 160, 0x0f2a36], [160, 240, 0x143a48]]
      .forEach(([y0, y1, c]) =>
        this.add.rectangle(213, (y0 + y1) / 2, 426, y1 - y0, c)
          .setScrollFactor(0).setDepth(-40));

    // Deep aisles receding into the dark
    for (let x = 0; x < 1200; x += 96) {
      this.add.rectangle(x, 150, 54, 120, 0x0c2330)
        .setScrollFactor(0.18, 1).setDepth(-35);
      this.add.rectangle(x, 96, 58, 4, 0x143a48)
        .setScrollFactor(0.18, 1).setDepth(-34);
    }

    // Overhead refrigeration pipes with frost collars
    this.add.rectangle(w / 2, 34, w, 8, 0x1a3c4c).setScrollFactor(0.32, 1).setDepth(-30);
    this.add.rectangle(w / 2, 52, w, 5, 0x16303c).setScrollFactor(0.32, 1).setDepth(-30);
    for (let x = 40; x < w; x += 110) {
      this.add.rectangle(x, 34, 6, 12, 0xbfe8f8, 0.5)
        .setScrollFactor(0.32, 1).setDepth(-29);
      this.add.rectangle(x, 26, 4, 10, 0x1a3c4c)
        .setScrollFactor(0.32, 1).setDepth(-30);
    }

    // Caged worklights
    for (let x = 150; x < w; x += 300) {
      this.add.circle(x, 60, 9, 0xffe6b0, 0.16).setScrollFactor(0.5, 1).setDepth(-25);
      this.add.rectangle(x, 60, 10, 6, 0xffe6b0, 0.7).setScrollFactor(0.5, 1).setDepth(-25);
      this.add.rectangle(x, 54, 2, 8, 0x1a3c4c).setScrollFactor(0.5, 1).setDepth(-25);
    }

    // Falling frost motes — the whole room is snowing very slightly
    this.time.addEvent({
      delay: 140, loop: true,
      callback: () => {
        const cam = this.cameras.main;
        const x = cam.scrollX + Math.random() * 426;
        const m = this.add.rectangle(x, -4, 2, 2, 0xd8f4ff, 0.55);
        m.setDepth(70);
        this.tweens.add({
          targets: m, y: 210 + Math.random() * 30, x: x + (Math.random() * 40 - 20),
          alpha: 0, duration: 3400 + Math.random() * 1600,
          onComplete: () => m.destroy(),
        });
      },
    });

    // Breath fog when Jammy stands still — the room is COLD
    this.time.addEvent({
      delay: 1500, loop: true,
      callback: () => {
        if (!this.jammy || !this.jammy.alive) return;
        const b = this.jammy.sprite.body;
        if (!b || Math.abs(b.velocity.x) > 12) return;
        const dir = this.jammy.facing === "right" ? 1 : -1;
        const f = this.add.circle(this.jammy.sprite.x + dir * 9, this.jammy.sprite.y - 4,
          2, 0xffffff, 0.4);
        f.setDepth(101);
        this.tweens.add({
          targets: f, x: f.x + dir * 16, y: f.y - 5, scale: 2.4, alpha: 0,
          duration: 900, onComplete: () => f.destroy(),
        });
      },
    });
  }

  // Shelving racks holding the slabs, with frost-rimed uprights
  _buildShelves() {
    if (!this.textures.exists("cold-rack")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x2e4a5c, 1);
      g.fillRect(0, 0, 4, 54); g.fillRect(44, 0, 4, 54);
      g.fillRect(0, 0, 48, 4); g.fillRect(0, 50, 48, 4);
      g.fillStyle(0x456a80, 1);
      g.fillRect(0, 0, 48, 1); g.fillRect(0, 50, 48, 1);
      g.fillStyle(0xbfe8f8, 0.55);
      g.fillRect(1, 4, 2, 9); g.fillRect(45, 20, 2, 11);
      g.generateTexture("cold-rack", 48, 54);
      g.destroy();
    }
    for (let x = 120; x < this.map.widthInPixels - 100; x += 210) {
      this.add.image(x, 152, "cold-rack").setDepth(50);
      this.add.image(x, 96, "cold-rack").setDepth(50).setAlpha(0.8);
    }
  }

  // Icicles hanging from the catwalk rails — they let go when you pass
  _buildIcicles() {
    if (!this.textures.exists("icicle")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xbfe8f8, 0.95);
      g.fillTriangle(4, 18, 0, 0, 8, 0);
      g.fillStyle(0xffffff, 0.8);
      g.fillTriangle(3, 12, 1, 1, 4, 1);
      g.generateTexture("icicle", 8, 18);
      g.destroy();
    }
    this.icicles = [];
    [340, 520, 760, 1080, 1260, 1580, 1820, 2150, 2480, 2700].forEach((x) => {
      const ic = this.physics.add.sprite(x, 66, "icicle");
      ic.body.setAllowGravity(false);
      ic.setDepth(56);
      ic.dropped = false;
      this.physics.add.overlap(ic, this.jammy.sprite, () => {
        if (ic.dropped && this.jammy.alive) { this.jammy.takeDamage(); ic.destroy(); }
      });
      this.physics.add.collider(ic, this.groundLayer, () => {
        for (let i = 0; i < 4; i++) {
          const p = this.add.rectangle(ic.x, ic.y, 2, 2, 0xd8f4ff, 0.9).setDepth(56);
          this.tweens.add({
            targets: p, x: ic.x + (Math.random() * 24 - 12), y: ic.y - 6,
            alpha: 0, duration: 280, onComplete: () => p.destroy(),
          });
        }
        ic.destroy();
      });
      this.icicles.push({
        update: () => {
          if (!ic.active || ic.dropped) return;
          const j = this.jammy;
          if (!j || !j.alive) return;
          if (Math.abs(j.sprite.x - ic.x) < 22 && j.sprite.y > ic.y) {
            // Shiver, then let go — a readable warning
            this.tweens.add({
              targets: ic, x: { from: ic.x - 1.5, to: ic.x + 1.5 },
              duration: 45, yoyo: true, repeat: 5,
              onComplete: () => {
                if (!ic.active) return;
                ic.dropped = true;
                ic.body.setAllowGravity(true);
              },
            });
            ic.dropped = false;
          }
        },
      });
    });
  }

  _buildExitDoor() {
    if (!this.textures.exists("cold-door")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x24485c, 1); g.fillRect(0, 0, 40, 56);
      g.fillStyle(0x38607a, 1); g.fillRect(3, 3, 34, 50);
      g.fillStyle(0x4e7e9c, 1); g.fillRect(3, 3, 34, 3);
      // Heavy cold-room latch
      g.fillStyle(0xbfe8f8, 1); g.fillRect(28, 24, 8, 4);
      g.fillStyle(0x9fdcf4, 0.8);
      g.fillRect(6, 8, 28, 2); g.fillRect(6, 46, 28, 2);
      g.fillStyle(0xd8f4ff, 0.7);
      g.fillRect(4, 50, 32, 3);
      g.generateTexture("cold-door", 40, 56);
      g.destroy();
    }
    this.add.image(3070, 164, "cold-door").setDepth(1);
    const t = this.add.bitmapText(3070, 122, "tempFont", "OUT", 10)
      .setOrigin(0.5).setTintFill(0x9fdcf4).setDepth(1);
    this.tweens.add({ targets: t, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });
  }

  _showTitleCard() {
    const a = this.add.bitmapText(213, 92, "tempFont", "STAGE 2-3", 16)
      .setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0xe8f8ff);
    const b = this.add.bitmapText(213, 114, "tempFont", "COLD STORAGE", 12)
      .setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0x9fdcf4);
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
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("Stage3_1"));
  }
}
