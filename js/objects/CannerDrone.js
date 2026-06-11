// Preserves Division field unit. Hovers over Jammy and drops sealing
// jars — get caught and you're canned on the spot, mashing ATTACK or
// JUMP to shatter free before the rest of the payroll closes in.
class CannerDrone extends Phaser.Physics.Arcade.Sprite {
  static ensureTextures(scn) {
    if (scn.textures.exists("canner-drone-1")) return;

    const draw = (g, alt) => {
      // Rotor blur
      g.fillStyle(0xc8d2da, alt ? 0.9 : 0.5);
      g.fillRect(alt ? 2 : 5, 0, alt ? 18 : 12, 2);
      g.fillStyle(0x3a4258, 1);
      g.fillRect(10, 2, 2, 2);
      // Teal body
      g.fillStyle(0x14383a, 1);
      g.fillRect(4, 4, 14, 8);
      g.fillStyle(0x2ab8b0, 1);
      g.fillRect(5, 5, 12, 6);
      g.fillStyle(0x7fe8e0, 1);
      g.fillRect(6, 5, 3, 2);
      // Eye lens
      g.fillStyle(0x0a3835, 1);
      g.fillRect(13, 7, 3, 3);
      g.fillStyle(0xffd9a0, 1);
      g.fillRect(14, 8, 1, 1);
      // Clamp + slung jar
      g.fillStyle(0x3a4258, 1);
      g.fillRect(9, 12, 4, 2);
      g.fillStyle(0xbfe8f4, 0.6);
      g.fillRect(8, 14, 6, 5);
      g.fillStyle(0x8c96b0, 1);
      g.fillRect(8, 13, 6, 2);
    };

    let g = scn.make.graphics({ x: 0, y: 0, add: false });
    draw(g, false);
    g.generateTexture("canner-drone-1", 22, 19);
    g.destroy();
    g = scn.make.graphics({ x: 0, y: 0, add: false });
    draw(g, true);
    g.generateTexture("canner-drone-2", 22, 19);
    g.destroy();

    // Falling seal-jar projectile
    g = scn.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x8c96b0, 1);
    g.fillRect(1, 0, 10, 3);
    g.fillStyle(0xbfe8f4, 0.65);
    g.fillRect(0, 3, 12, 11);
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(2, 4, 1, 8);
    g.generateTexture("seal-jar", 12, 14);
    g.destroy();

    // Big overlay jar that traps Jammy
    g = scn.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x8c96b0, 1);
    g.fillRect(3, 0, 18, 5);
    g.fillStyle(0xb8c2da, 1);
    g.fillRect(3, 0, 18, 2);
    g.fillStyle(0xbfe8f4, 0.45);
    g.fillRect(0, 5, 24, 29);
    g.lineStyle(1, 0x8ec4d8, 0.9);
    g.strokeRect(0, 5, 24, 29);
    g.fillStyle(0xffffff, 0.65);
    g.fillRect(3, 7, 2, 24);
    // Teal label
    g.fillStyle(0x2ab8b0, 0.9);
    g.fillRect(6, 24, 12, 6);
    g.generateTexture("seal-jar-overlay", 24, 34);
    g.destroy();
  }

  constructor(scn, x, y) {
    CannerDrone.ensureTextures(scn);
    super(scn, x, y, "canner-drone-1");
    scn.add.existing(this);
    scn.physics.add.existing(this);

    this.score = 550;
    this.targetable = true; // Blubert lock-on
    this.hp = 2;
    this.dead = false;
    this.dropCooldownMs = 2400;
    this._lastDrop = 0;
    this._nextFlap = 0;
    this._flap = false;
    this.homeY = y;

    this.body.setAllowGravity(false);
    this.body.setSize(18, 12, 2, 3);
    this.setDepth(58);

    scn.enemies.add(this);
  }

  update() {
    if (this.dead || !this.body) return;
    const now = this.scene.time.now;

    if (now > this._nextFlap) {
      this._nextFlap = now + 90;
      this._flap = !this._flap;
      this.setTexture(this._flap ? "canner-drone-2" : "canner-drone-1");
    }

    const j = this.scene.jammy;
    if (!j || !j.alive) {
      this.body.setVelocity(0, 0);
      return;
    }

    // Stalk a spot directly above Jammy
    const dx = j.sprite.x - this.x;
    const dy = (j.sprite.y - 86) - this.y;
    this.body.setVelocityX(Phaser.Math.Clamp(dx * 2.2, -110, 110));
    this.body.setVelocityY(Phaser.Math.Clamp(dy * 2.0, -80, 80));
    this.setFlipX(dx < 0);

    // Release a sealing jar when lined up overhead
    if (Math.abs(dx) < 26 && now - this._lastDrop > this.dropCooldownMs) {
      this._lastDrop = now;
      this._dropJar();
    }
  }

  _dropJar() {
    // Capture the scene NOW — the jar outlives this drone, and the
    // closures below must not read this.scene off a destroyed sprite.
    const scn = this.scene;
    const jar = scn.physics.add.sprite(this.x, this.y + 12, "seal-jar");
    jar.setDepth(57);
    if (scn.enemyProjectiles) scn.enemyProjectiles.add(jar);
    jar.body.setAllowGravity(true);
    jar.body.setSize(10, 12);
    jar.body.setVelocityY(40);

    const shatter = () => {
      if (!jar.active) return;
      for (let i = 0; i < 4; i++) {
        const shard = scn.add.triangle(
          jar.x, jar.y, 0, 3, 2, 0, 4, 3, 0xcfeefb, 0.9
        );
        shard.setDepth(57);
        scn.tweens.add({
          targets: shard,
          x: jar.x + (Math.random() * 24 - 12),
          y: jar.y + 6,
          alpha: 0, angle: 180,
          duration: 280,
          onComplete: () => shard.destroy(),
        });
      }
      jar.destroy();
    };

    const overlap = scn.physics.add.overlap(jar, scn.jammy.sprite, () => {
      if (scn.jammy.alive) scn.jammy.trapInJar();
      if (overlap) overlap.destroy();
      if (jar.active) jar.destroy();
    });
    // Sonic waves can break a falling jar out of the air
    if (scn.bullets) {
      scn.physics.add.overlap(jar, scn.bullets, (j2, bullet) => {
        if (bullet && bullet.destroy) bullet.destroy();
        shatter();
      });
    }
    if (scn.groundLayer) {
      scn.physics.add.collider(jar, scn.groundLayer, () => shatter());
    }
    scn.time.delayedCall(2600, () => shatter());
    if (scn.cache.audio.exists("blueberryBombDropSound")) {
      scn.sound.play("blueberryBombDropSound", { volume: 0.4, rate: 1.3 });
    }
  }

  takeDamage(val = 1) {
    if (this.dead) return;
    this.hp -= val;
    this.setTint(0xff6666);
    this.scene.time.delayedCall(60, () => { if (this.active) this.clearTint(); });
    this.scene.sound.play("enemyHitSound");
    if (this.hp <= 0) this.die();
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.scene.scene.get("UIScene").setScore(this.score);
    new EnemyDeath(this.scene, this.x, this.y);
    this.body.setEnable(false);
    this.destroy();
  }
}
