// Stage 1-S — CLOUD NINE. The hidden bonus stage behind Sunset Mesa's
// secret exit. A sky run across drifting pixel clouds with bread tokens
// laid out in arcs, a Lost Jam at the top, and a few blueberry drones
// for company. There's no floor: fall and you drop back to the start
// (no damage — it's a bonus, not a punishment). Exits to The Jam Works.
class Stage1_S extends Phaser.Scene {
  constructor() {
    super({ key: "Stage1_S" });
  }

  preload() {
    scene = this;
  }

  create() {
    this._changing = false;
    this.sound.stopAll();
    this.sound.play("Jammed", { loop: true, volume: 0.8 });

    this.cameras.main.setBackgroundColor("#5ec8f0");
    this.worldW = 2400;
    this.worldH = 480;

    this._paintSky();

    LevelCommon.createGroups(this);

    // Jammy starts on a big cloud at the left
    this.jammy = new Jammy(80, 330);
    this.jammy.sprite.setDepth(100);
    this.cameras.main.startFollow(this.jammy.sprite);
    this.cameras.main.setBounds(0, -120, this.worldW, this.worldH + 120);

    // No tile layers here, so wire the generic bits by hand
    LevelCommon.wireCollisions(this);

    this._buildClouds();
    this._buildTokens();
    this._buildDrones();

    // Lost Jam at the summit
    new LostRecord(this, 1930, 32, "Stage1_S");

    // Exit portal on the last cloud
    this._buildExitPortal(2300, 300);

    // Blubert tags along
    this.blubert = new Blubert(this, this.jammy);
    this.blubertRevivesLeft = 1;

    this._showTitleCard();
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

    // Fell off the clouds: whisk Jammy back to the last checkpoint cloud
    if (this.jammy.alive && this.jammy.sprite.y > this.worldH + 20 && !this._respawning) {
      this._respawning = true;
      const cp = this._nearestCheckpoint(this.jammy.sprite.x);
      this.cameras.main.flash(200, 255, 255, 255);
      this.sound.play("jumpSound", { rate: 0.6, volume: 0.6 });
      this.jammy.sprite.setPosition(cp.x, cp.y - 30);
      this.jammy.sprite.body.setVelocity(0, 0);
      this.time.delayedCall(300, () => {
        this._respawning = false;
      });
    }
  }

  tryReviveBlubert() {
    LevelCommon.tryReviveBlubert(this);
  }

  _nearestCheckpoint(x) {
    let best = this.checkpoints[0];
    for (const cp of this.checkpoints) if (cp.x <= x + 20) best = cp;
    return best;
  }

  // Cloud layout: [x, y, variant]. Big clouds (1) are checkpoints.
  _buildClouds() {
    const layout = [
      [80, 360, 1],
      [240, 330, 2],
      [380, 290, 2],
      [520, 250, 1],
      [680, 300, 2],
      [800, 230, 2],
      [940, 180, 1],
      [1080, 240, 2],
      [1200, 300, 2],
      [1340, 260, 1],
      [1480, 200, 2],
      [1600, 150, 2],
      [1740, 110, 1],
      [1860, 160, 2],
      [1930, 70, 2],
      [2020, 220, 2],
      [2140, 280, 2],
      [2300, 320, 1],
    ];
    this.checkpoints = [];
    layout.forEach(([x, y, v]) => {
      const c = LevelCommon.addCloudPlatform(this, x, y, v);
      // Gentle drift so the platforms feel alive (and a touch trickier)
      this.tweens.add({
        targets: c,
        y: y - 8,
        duration: 1800 + (x % 700),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        onUpdate: () => c.body.updateFromGameObject(),
      });
      if (v === 1) this.checkpoints.push({ x, y });
    });
  }

  // Token arcs between clouds — the "collect the whole curve" fantasy
  _buildTokens() {
    const arcs = [
      [240, 300, 380, 260],
      [520, 220, 680, 270],
      [800, 200, 940, 150],
      [1080, 210, 1200, 270],
      [1340, 230, 1480, 170],
      [1600, 120, 1740, 80],
      [2020, 190, 2140, 250],
    ];
    arcs.forEach(([x0, y0, x1, y1]) => {
      for (let i = 0; i <= 4; i++) {
        const t = i / 4;
        const x = x0 + (x1 - x0) * t;
        const y = y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * 40;
        new AntToken(this, x, y);
      }
    });
    // A row along the summit
    [1890, 1910, 1950, 1970].forEach((x) => new AntToken(this, x, 40));
  }

  _buildDrones() {
    [600, 1250, 1950].forEach((x) => {
      const b = new Blueberry(this, x, 120);
      b.setPosition(x, 120);
    });
  }

  _paintSky() {
    const bands = [
      [-120, 60, 0x3aa0e0],
      [60, 180, 0x5ec8f0],
      [180, 320, 0x8ee0f8],
      [320, 600, 0xc8f0ff],
    ];
    bands.forEach(([y0, y1, color]) => {
      this.add
        .rectangle(213, (y0 + y1) / 2, 426, y1 - y0, color)
        .setScrollFactor(0)
        .setDepth(-40);
    });
    // Far cloud bank
    if (typeof Cloud !== "undefined") Cloud.ensureTextures(this);
    for (let x = 0; x < this.worldW + 400; x += 180) {
      const y = 140 + ((x / 180) % 4) * 50;
      this.add
        .image(x, y, "pixel-cloud-" + (1 + ((x / 180) % 2)))
        .setScrollFactor(0.3)
        .setAlpha(0.55)
        .setDepth(-30);
    }
    // Sunset Mesa far below: a strip of sand at the bottom of the world
    this.add
      .rectangle(this.worldW / 2, this.worldH + 60, this.worldW + 800, 160, 0xe8c878)
      .setScrollFactor(0.6, 1)
      .setDepth(-20);
  }

  _buildExitPortal(x, y) {
    const glow = this.add.circle(x, y - 22, 22, 0xffb86b, 0.25).setDepth(49);
    this.tweens.add({
      targets: glow,
      scale: 1.3,
      alpha: 0.1,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    const portal = this.physics.add.sprite(x, y - 22, "dev-portal", "portal1");
    portal.body.setAllowGravity(false);
    portal.body.setImmovable(true);
    portal.setScale(1.4);
    portal.setDepth(50);
    portal.setTint(0xffb86b);
    portal.play("dev-portal-swirl");
    this.add
      .bitmapText(x, y - 54, "tempFont", "1-4", 8)
      .setOrigin(0.5)
      .setTintFill(0xffd9a0)
      .setDepth(50);
    this.physics.add.overlap(this.jammy.sprite, portal, () => this.changeScene());
  }

  _showTitleCard() {
    const t1 = this.add
      .bitmapText(213, 92, "tempFont", "SECRET STAGE 1-S", 16)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(300)
      .setTintFill(0xffffff);
    const t2 = this.add
      .bitmapText(213, 114, "tempFont", "CLOUD NINE", 12)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(300)
      .setTintFill(0x8ce070);
    const t3 = this.add
      .bitmapText(213, 132, "tempFont", "NO FALLING DAMAGE - GRAB EVERYTHING", 8)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(300)
      .setTintFill(0xffffff);
    this.tweens.add({
      targets: [t1, t2, t3],
      alpha: 0,
      delay: 2200,
      duration: 600,
      onComplete: () => {
        t1.destroy();
        t2.destroy();
        t3.destroy();
      },
    });
  }

  changeScene() {
    LevelCommon.finishStage(this, "Stage1_4");
  }
}
