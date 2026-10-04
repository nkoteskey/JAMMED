// The Record Press — the Jam Works' signature machine. Baron Pectin
// presses the stolen jams into bootleg records, and the line never
// stops: a hydraulic ram stamps down on its own beat (watch the lamp:
// green is clear, red is about to drop) and every stamp spits a hot,
// freshly pressed record out of the die that rolls along the floor
// toward Jammy. Jump the record or shoot it; the ram is solid steel.
//
// The press keeps its own rhythm instead of reacting to Jammy, so the
// player reads the lamp and the piston and times the gap like a line
// worker, rather than baiting it.
class RecordPress extends Phaser.Physics.Arcade.Sprite {
  static ensureTextures(scn) {
    if (scn.textures.exists("record-press-ram")) return;
    const g = scn.make.graphics({ x: 0, y: 0, add: false });

    // --- Ram head, 36x24: steel cylinder block over a round platter ---
    g.fillStyle(0x2c3248, 1);
    g.fillRect(0, 0, 36, 14);
    g.fillStyle(0x5d6680, 1);
    g.fillRect(2, 2, 32, 10);
    g.fillStyle(0xb8c2da, 1);
    g.fillRect(2, 2, 32, 2); // sheen
    g.fillStyle(0x46506a, 1);
    g.fillRect(2, 10, 32, 2); // underside shadow
    // Hydraulic hose stubs on the shoulders
    g.fillStyle(0x3a2a4a, 1);
    g.fillRect(4, 0, 5, 4);
    g.fillRect(27, 0, 5, 4);
    g.fillStyle(0x6a5a7a, 1);
    g.fillRect(5, 0, 1, 4);
    g.fillRect(28, 0, 1, 4);
    // Bolts
    g.fillStyle(0xdde4f0, 1);
    [[4, 6], [31, 6]].forEach(([x, y]) => g.fillRect(x, y, 2, 2));
    // Platter: a lighter disc seen edge-on with a bevelled rim
    g.fillStyle(0x39405a, 1);
    g.fillRect(1, 14, 34, 10);
    g.fillStyle(0x8c96b0, 1);
    g.fillRect(2, 15, 32, 8);
    g.fillStyle(0xaab4ce, 1);
    g.fillRect(2, 15, 32, 2);
    g.fillStyle(0x6a7288, 1);
    g.fillRect(2, 21, 32, 2);
    // Centre stamper pin
    g.fillStyle(0x2c3248, 1);
    g.fillRect(15, 17, 6, 7);
    g.fillStyle(0xdde4f0, 1);
    g.fillRect(16, 18, 1, 5);
    // Jam residue along the crush edge
    g.fillStyle(0xc23a66, 1);
    g.fillRect(4, 22, 4, 2);
    g.fillRect(28, 22, 4, 2);
    g.fillRect(10, 23, 2, 1);
    g.generateTexture("record-press-ram", 36, 24);
    g.clear();

    // --- Base plate, 40x8: the lower die, riveted to the floor ---
    g.fillStyle(0x2c3248, 1);
    g.fillRect(0, 0, 40, 8);
    g.fillStyle(0x6a7288, 1);
    g.fillRect(1, 1, 38, 6);
    g.fillStyle(0x8c96b0, 1);
    g.fillRect(1, 1, 38, 2);
    // Glowing vinyl blank waiting in the die
    g.fillStyle(0xff8a40, 1);
    g.fillRect(13, 1, 14, 2);
    g.fillStyle(0xffd080, 1);
    g.fillRect(18, 1, 4, 1);
    g.fillStyle(0xdde4f0, 1);
    [[3, 4], [35, 4]].forEach(([x, y]) => g.fillRect(x, y, 2, 2));
    g.generateTexture("record-press-plate", 40, 8);
    g.clear();

    // --- Hot record, 14x14: black vinyl with a glowing label ---
    g.fillStyle(0x181020, 1);
    g.fillCircle(7, 7, 7);
    g.fillStyle(0x2e2640, 1);
    g.fillCircle(7, 7, 5.5);
    g.fillStyle(0x181020, 1);
    g.fillCircle(7, 7, 4.5);
    g.fillStyle(0xff8a40, 1);
    g.fillCircle(7, 7, 3);
    g.fillStyle(0xffd080, 1);
    g.fillRect(5, 5, 2, 1);
    g.fillStyle(0x181020, 1);
    g.fillRect(6, 6, 2, 2); // spindle hole
    g.generateTexture("hot-record", 14, 14);
    g.destroy();
  }

  // x: press column. floorY: the surface it stamps onto (the floor's
  // top, or a conveyor belt's). opts.plate (default true) draws the
  // lower die on that surface; opts.phase (ms) offsets the rhythm so
  // a row of presses stamps in sequence; opts.ceilY is the ceiling.
  constructor(scn, x, floorY, opts = {}) {
    RecordPress.ensureTextures(scn);
    const ceilY = opts.ceilY === undefined ? 32 : opts.ceilY;
    const topY = ceilY + 16;
    super(scn, x, topY, "record-press-ram");
    scn.add.existing(this);
    scn.physics.add.existing(this);

    this.ceilY = ceilY;
    this.topY = topY;
    this.hasPlate = opts.plate !== false;
    this.stampSurfaceY = this.hasPlate ? floorY - 8 : floorY;
    this.slamY = this.stampSurfaceY - 12; // ram centre when fully down
    this.openMs = opts.openMs || 1500;
    this.warnMs = 420;
    this.pressedMs = 480;
    this.ejectRangeX = 320;

    this.state = "open";
    // The scene clock only starts ticking on the first update, so the
    // first stamp is scheduled there (see update) rather than here.
    this.phase = (opts.phase || 0) + 600;
    this.nextAt = null;
    this.dead = false;
    this.invincible = true; // solid steel
    this.targetable = false; // Blubert and the seeds ignore machinery
    this.setDepth(60);

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.setSize(34, 22);

    // Piston rod from the ceiling to the ram, stretched every frame
    this.rod = scn.add.rectangle(x, ceilY, 8, 1, 0x46506a).setOrigin(0.5, 0).setDepth(59);
    this.rodShine = scn.add.rectangle(x + 2, ceilY, 2, 1, 0x96a0ba).setOrigin(0.5, 0).setDepth(59);
    // Ceiling mount
    scn.add.rectangle(x, ceilY + 2, 24, 4, 0x2c3248).setDepth(59);
    // Status lamp on the ram's shoulder
    this.lamp = scn.add.rectangle(x + 13, topY - 7, 4, 4, 0x58e070).setDepth(61);
    // Lower die
    if (this.hasPlate) {
      scn.add.image(x, floorY - 4, "record-press-plate").setDepth(2);
    }

    // Solid against Jammy; the touch only hurts while stamping.
    scn.physics.add.collider(scn.jammy.sprite, this, () => {
      if (this.state === "stamp" && this.scene.jammy.alive) {
        this.scene.jammy.takeDamage(this.x);
      }
    });

    scn.enemies.add(this);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      [this.rod, this.rodShine, this.lamp].forEach((o) => o && o.destroy());
    });
  }

  update() {
    if (!this.body || !this.scene) return;
    const now = this.scene.time.now;

    if (this.state === "open") {
      this.y = this.topY;
      if (this.nextAt === null) this.nextAt = now + this.phase;
      if (now >= this.nextAt) this._warn();
    } else if (this.state === "warn") {
      // Lamp blinks red, ram shivers on its rod
      const blink = Math.floor((now - this.warnAt) / 70) % 2 === 0;
      this.lamp.setFillStyle(blink ? 0xff4040 : 0x801010);
      this.x = this.baseX + (blink ? 1 : -1);
      if (now >= this.warnAt + this.warnMs) this._stamp();
    } else if (this.state === "stamp") {
      if (this.y >= this.slamY) this._impact();
    } else if (this.state === "pressed") {
      if (now >= this.pressedAt + this.pressedMs) {
        this.state = "rise";
        this.lamp.setFillStyle(0xffb347);
        this.body.setVelocityY(-85);
      }
    } else if (this.state === "rise") {
      if (this.y <= this.topY) {
        this.y = this.topY;
        this.body.setVelocityY(0);
        this.state = "open";
        this.lamp.setFillStyle(0x58e070);
        this.nextAt = now + this.openMs;
      }
    }

    // Rod follows the ram
    const rodLen = Math.max(1, this.y - 12 - this.ceilY);
    this.rod.scaleY = rodLen;
    this.rodShine.scaleY = rodLen;
    this.lamp.setPosition(this.x + 13, this.y - 7);
  }

  _warn() {
    this.state = "warn";
    this.warnAt = this.scene.time.now;
    this.baseX = this.x;
    // Hydraulic whine while the pressure builds
    this.scene.sound.play("laserSound", { volume: 0.12, rate: 0.3 });
  }

  _stamp() {
    this.x = this.baseX;
    this.state = "stamp";
    this.lamp.setFillStyle(0xff4040);
    this.body.setVelocityY(720);
  }

  _impact() {
    this.body.setVelocityY(0);
    this.y = this.slamY;
    this.state = "pressed";
    this.pressedAt = this.scene.time.now;
    this.scene.cameras.main.shake(100, 0.004);
    if (this.scene.cache.audio.exists("watermelonBossLandingSound")) {
      this.scene.sound.play("watermelonBossLandingSound", { volume: 0.4, rate: 1.1 });
    }
    // Steam hisses out of the die on both sides
    for (let i = 0; i < 4; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const puff = this.scene.add.circle(
        this.x + side * (16 + Math.random() * 4),
        this.y + 10, 3 + Math.random() * 2, 0xe8e0f0, 0.45
      );
      puff.setDepth(59);
      this.scene.tweens.add({
        targets: puff,
        x: puff.x + side * (8 + Math.random() * 8),
        y: puff.y - 14 - Math.random() * 6,
        alpha: 0, scale: 1.8,
        duration: 380,
        ease: "Quad.easeOut",
        onComplete: () => puff.destroy(),
      });
    }
    this._ejectRecord();
  }

  // A hot record pops out of the die on Jammy's side and rolls at him.
  // Only while he is near enough to care, so the corridor doesn't fill
  // up with vinyl while he is elsewhere.
  _ejectRecord() {
    const j = this.scene.jammy;
    if (!j || !j.alive || !j.sprite) return;
    const dx = j.sprite.x - this.x;
    if (Math.abs(dx) > this.ejectRangeX) return;
    const dir = dx >= 0 ? 1 : -1;
    this.scene.sound.play("enemyHitSound", { volume: 0.3, rate: 1.7 });
    new HotRecord(this.scene, this.x + dir * 24, this.stampSurfaceY - 8, dir);
  }

  // Shots and seed blasts clink off the steel.
  takeDamage() {
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(40, () => { if (this.active) this.clearTint(); });
  }
}

// A freshly pressed, still-glowing record rolling along the floor.
// Hurts on touch, dies against a wall or after a few seconds, and a
// single shot shatters it. Blubert can mark it for the Seedcaster.
class HotRecord extends Phaser.Physics.Arcade.Sprite {
  constructor(scn, x, y, dir) {
    RecordPress.ensureTextures(scn);
    super(scn, x, y, "hot-record");
    scn.add.existing(this);
    scn.physics.add.existing(this);

    this.score = 250;
    this.hp = 1;
    this.dead = false;
    this.invincible = false;
    this.dir = dir;
    this.speed = 115 * (typeof enemySpeedScale === "function" ? enemySpeedScale() : 1);
    this.bornAt = scn.time.now;
    this.lifeMs = 4200;
    this._lastEmber = 0;
    this.setDepth(61);

    this.body.setCircle(6, 1, 1);
    this.body.setBounce(0.15, 0.1);
    this.body.setAllowGravity(true);
    this.body.setVelocity(dir * this.speed, -40);

    this.glow = scn.add.circle(x, y, 9, 0xff8a40, 0.18).setDepth(60);

    this.jammyOverlap = scn.physics.add.overlap(this, scn.jammy.sprite, () => {
      if (!this.dead && this.scene.jammy.alive) this.scene.jammy.takeDamage(this.x);
    });
    // Rolls along conveyor belts too, and splashes into the jam vats
    if (scn.belts) scn.belts.forEach((b) => b.sprite && scn.physics.add.collider(this, b.sprite));
    if (scn.deathBlocksLayer) scn.physics.add.collider(this, scn.deathBlocksLayer, () => this.shatter(false));

    scn.enemies.add(this);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (this.glow) this.glow.destroy();
    });
  }

  update() {
    if (this.dead || !this.body || !this.scene) return;
    const now = this.scene.time.now;
    // Keep rolling at speed (friction on the brick would stall it)
    if (this.body.blocked.down) this.body.setVelocityX(this.dir * this.speed);
    this.rotation += this.dir * 0.22;
    if (this.glow) this.glow.setPosition(this.x, this.y);

    if (now - this._lastEmber > 110) {
      this._lastEmber = now;
      const ember = this.scene.add.circle(this.x - this.dir * 4, this.y + 4, 1, 0xffb060, 0.8).setDepth(60);
      this.scene.tweens.add({
        targets: ember, y: ember.y - 8, alpha: 0, duration: 300,
        onComplete: () => ember.destroy(),
      });
    }

    if (this.body.blocked.left || this.body.blocked.right || now - this.bornAt > this.lifeMs) {
      this.shatter(false);
    }
  }

  takeDamage(val = 1) {
    if (this.dead) return;
    this.hp -= val;
    if (this.hp <= 0) this.die();
  }

  die() {
    if (this.dead) return;
    awardScore(this.scene, this.score, this.x, this.y);
    this.scene.sound.play("enemyHitSound", { volume: 0.5, rate: 1.3 });
    this.shatter(true);
  }

  shatter(loud) {
    if (this.dead) return;
    this.dead = true;
    if (!loud) this.scene.sound.play("enemyHitSound", { volume: 0.2, rate: 0.9 });
    // Four black shards and a puff of label-orange
    for (let i = 0; i < 4; i++) {
      const shard = this.scene.add.rectangle(this.x, this.y, 3, 3, i % 2 ? 0x181020 : 0xff8a40).setDepth(61);
      this.scene.tweens.add({
        targets: shard,
        x: this.x + Phaser.Math.Between(-16, 16),
        y: this.y + Phaser.Math.Between(-18, 6),
        angle: Phaser.Math.Between(-180, 180),
        alpha: 0,
        duration: 320,
        ease: "Quad.easeOut",
        onComplete: () => shard.destroy(),
      });
    }
    this.body.setEnable(false);
    this.setVisible(false);
    this.destroy();
  }
}
