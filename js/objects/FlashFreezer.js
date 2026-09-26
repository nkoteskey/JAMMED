// Cold Storage's wall unit: a Concentrate flash-freezer that exhales a
// freezing cone on a fixed cycle. Caught in it and Jammy is frozen
// solid — mash to break out, exactly like the canner jar. Preservation
// as a prison, made into a hazard.
class FlashFreezer extends Phaser.Physics.Arcade.Sprite {
  static ensureTextures(scn) {
    if (scn.textures.exists("flash-freezer")) return;
    const g = scn.make.graphics({ x: 0, y: 0, add: false });
    // 20x28 wall unit: grille, teal panel, frost rime along the bottom
    g.fillStyle(0x1e3a48, 1);
    g.fillRect(0, 0, 20, 28);
    g.fillStyle(0x38607a, 1);
    g.fillRect(1, 1, 18, 26);
    g.fillStyle(0x4e7e9c, 1);
    g.fillRect(1, 1, 18, 2);
    // Vent grille
    g.fillStyle(0x0e222c, 1);
    for (let y = 6; y < 24; y += 4) g.fillRect(3, y, 14, 2);
    // Teal status band
    g.fillStyle(0x2ab8b0, 1);
    g.fillRect(3, 3, 14, 2);
    // Rime
    g.fillStyle(0xd8f4ff, 0.85);
    g.fillRect(1, 25, 18, 2);
    g.fillRect(4, 27, 3, 1); g.fillRect(12, 27, 4, 1);
    g.generateTexture("flash-freezer", 20, 28);
    g.destroy();
  }

  // dir: -1 blows left, 1 blows right
  constructor(scn, x, y, dir = -1, opts = {}) {
    FlashFreezer.ensureTextures(scn);
    super(scn, x, y, "flash-freezer");
    scn.add.existing(this);
    scn.physics.add.existing(this);

    this.dir = dir;
    this.reach = opts.reach || 96;
    this.onMs = opts.onMs || 1100;
    this.offMs = opts.offMs || 2100;
    this.warnMs = 600;
    this.dead = false;
    this.invincible = true; // bolted to the wall
    this.state = "off";
    this._t = opts.phase || 0;

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.setDepth(54);
    this.setFlipX(dir > 0);

    // The cone itself, drawn as three stacked frost bands
    this.cone = scn.add.container(x + dir * (10 + this.reach / 2), y);
    this.cone.setDepth(53);
    for (let i = 0; i < 3; i++) {
      const r = scn.add.rectangle(0, (i - 1) * 8, this.reach, 7, 0xd8f4ff, 0);
      this.cone.add(r);
    }
    this.coneParts = this.cone.list;

    scn.enemies.add(this);
  }

  update() {
    if (!this.scene) return;
    this._t -= this.scene.game.loop.delta;
    if (this._t <= 0) {
      if (this.state === "off") { this.state = "warn"; this._t = this.warnMs; }
      else if (this.state === "warn") { this.state = "on"; this._t = this.onMs; this._puff(); }
      else { this.state = "off"; this._t = this.offMs; }
    }

    const now = this.scene.time.now;
    if (this.state === "on") {
      const a = 0.5 + Math.sin(now / 45) * 0.12;
      this.coneParts.forEach((r, i) => r.setFillStyle(0xd8f4ff, a - i * 0.04));
      const j = this.scene.jammy;
      if (j && j.alive && !j.trappedInJar) {
        const dx = (j.sprite.x - this.x) * this.dir;
        if (dx > 0 && dx < this.reach + 14 && Math.abs(j.sprite.y - this.y) < 18) {
          if (typeof j.freezeSolid === "function") j.freezeSolid();
        }
      }
    } else if (this.state === "warn") {
      // Blink faintly and rattle before it blows
      const blink = Math.floor(now / 100) % 2 === 0;
      this.coneParts.forEach((r) => r.setFillStyle(0xd8f4ff, blink ? 0.16 : 0.04));
      this.setX(this.x); // no-op keep
      this.setAngle(Math.sin(now / 30) * 1.2);
    } else {
      this.setAngle(0);
      this.coneParts.forEach((r) => r.setFillStyle(0xd8f4ff, 0));
    }
  }

  _puff() {
    if (this.scene.cache.audio.exists("shortWave")) {
      this.scene.sound.play("shortWave", { rate: 0.5, volume: 0.25 });
    }
    for (let i = 0; i < 6; i++) {
      const p = this.scene.add.rectangle(
        this.x + this.dir * 12, this.y + (Math.random() * 16 - 8), 3, 3, 0xffffff, 0.8
      );
      p.setDepth(55);
      this.scene.tweens.add({
        targets: p,
        x: p.x + this.dir * (this.reach * (0.4 + Math.random() * 0.7)),
        alpha: 0, duration: 420 + Math.random() * 200,
        onComplete: () => p.destroy(),
      });
    }
  }

  takeDamage() {
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(40, () => { if (this.active) this.clearTint(); });
  }
}
