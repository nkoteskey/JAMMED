// The Frostpick's shot. Flies flat and fast; on contact it encases an
// enemy in a block of ice. A frozen enemy is harmless, takes damage
// normally — and is SOLID, so you can stand on it. Freezing the right
// enemy in the right place is how you reach half of Cold Storage.
class FrostShard extends Phaser.Physics.Arcade.Sprite {
  static ensureTexture(scn) {
    if (scn.textures.exists("frost-shard")) return;
    const g = scn.make.graphics({ x: 0, y: 0, add: false });
    // 12x8 crystal dart
    g.fillStyle(0x7fd4f0, 1);
    g.fillTriangle(12, 4, 4, 0, 4, 8);
    g.fillRect(0, 2, 5, 4);
    g.fillStyle(0xd8f4ff, 1);
    g.fillTriangle(10, 4, 5, 1, 5, 4);
    g.fillRect(1, 3, 3, 1);
    g.fillStyle(0x3a9cc8, 1);
    g.fillRect(0, 5, 4, 1);
    g.generateTexture("frost-shard", 12, 8);
    g.destroy();
  }

  constructor(scn, x, y, direction, aimUp = false) {
    FrostShard.ensureTexture(scn);
    super(scn, x, y, "frost-shard");
    scn.add.existing(this);
    scn.physics.add.existing(this);

    this.damage = 1;
    this.dead = false;
    const dir = direction === "left" ? -1 : 1;
    this.setFlipX(dir === -1);
    this.setDepth(90);
    this.body.setAllowGravity(false);
    this.body.setSize(10, 6);
    this.body.setVelocityX(dir * 340);
    if (aimUp) {
      this.body.setVelocityY(-300);
      this.body.setVelocityX(dir * 140);
      this.setRotation(dir * -1.0);
    }
    this.startX = x;

    this.enemyOverlap = scn.physics.add.overlap(this, scn.enemies, (s, enemy) => {
      if (this.dead || !enemy || enemy.dead) return;
      this._hit(enemy);
    });
    const layers = [scn.groundLayer].filter(Boolean);
    for (const l of layers) {
      scn.physics.add.collider(this, l, () => this._puff());
    }
  }

  preUpdate(t, d) {
    super.preUpdate(t, d);
    if (this.dead) return;
    // Frost trail
    if (Math.random() < 0.5) {
      const f = this.scene.add.rectangle(
        this.x - this.body.velocity.x * 0.01, this.y + (Math.random() * 6 - 3),
        2, 2, 0xd8f4ff, 0.8
      );
      f.setDepth(89);
      this.scene.tweens.add({
        targets: f, alpha: 0, scale: 0.3, duration: 260,
        onComplete: () => f.destroy(),
      });
    }
    if (Math.abs(this.x - this.startX) > 300) this._puff();
  }

  _hit(enemy) {
    if (typeof enemy.freeze === "function") {
      enemy.freeze(4200);
    } else if (typeof FrostShard.freezeEnemy === "function") {
      FrostShard.freezeEnemy(this.scene, enemy, 4200);
    }
    if (typeof enemy.takeDamage === "function" && !enemy.invincible) {
      enemy.takeDamage(this.damage);
    }
    this._puff();
  }

  _puff() {
    if (this.dead) return;
    this.dead = true;
    if (this.enemyOverlap) this.enemyOverlap.destroy();
    for (let i = 0; i < 5; i++) {
      const ang = Math.random() * Math.PI * 2;
      const p = this.scene.add.rectangle(this.x, this.y, 2, 2, 0xd8f4ff, 0.9);
      p.setDepth(90);
      this.scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(ang) * 14, y: this.y + Math.sin(ang) * 14,
        alpha: 0, duration: 240, onComplete: () => p.destroy(),
      });
    }
    this.destroy();
  }

  // Generic freeze for any enemy that doesn't implement its own:
  // encase it in a solid ice block that Jammy can stand on.
  static freezeEnemy(scn, enemy, ms = 4200) {
    if (!enemy || enemy.dead || enemy._frozen) return;
    enemy._frozen = true;

    if (!scn.textures.exists("ice-encase")) {
      const g = scn.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x8ad4ec, 0.45);
      g.fillRect(0, 0, 28, 28);
      g.fillStyle(0xd8f4ff, 0.85);
      g.fillRect(0, 0, 28, 2); g.fillRect(0, 26, 28, 2);
      g.fillRect(0, 0, 2, 28); g.fillRect(26, 0, 2, 28);
      g.fillStyle(0xffffff, 0.6);
      g.fillRect(4, 4, 2, 12); g.fillRect(20, 8, 2, 14);
      g.fillStyle(0xbfe8f8, 0.5);
      g.fillTriangle(0, 0, 8, 0, 0, 8);
      g.fillTriangle(28, 28, 20, 28, 28, 20);
      g.generateTexture("ice-encase", 28, 28);
      g.destroy();
    }

    // Halt it
    if (enemy.body) {
      enemy._preFreezeGravity = enemy.body.allowGravity;
      enemy.body.setVelocity(0, 0);
      enemy.body.setAllowGravity(false);
    }
    enemy._frozenPrevUpdate = enemy.update;
    enemy.update = function () {};
    enemy.setTint(0x9fdcf4);

    // The ice block itself — a real solid platform
    const block = scn.add.image(enemy.x, enemy.y, "ice-encase");
    block.setDepth((enemy.depth || 50) + 1);
    scn.physics.add.existing(block, true); // static body
    if (scn.jammy && scn.jammy.sprite) {
      block.body.checkCollision.down = false;
      block.body.checkCollision.left = false;
      block.body.checkCollision.right = false;
      scn._iceBlocks = scn._iceBlocks || [];
      scn._iceBlocks.push(block);
      if (!scn._iceCollider) {
        scn._iceCollider = scn.physics.add.collider(
          scn.jammy.sprite, scn._iceBlocks
        );
      } else {
        scn.physics.add.collider(scn.jammy.sprite, block);
      }
    }
    if (scn.cache.audio.exists("enemyHitSound")) {
      scn.sound.play("enemyHitSound", { rate: 2.2, volume: 0.35 });
    }

    const thaw = () => {
      if (!enemy || !enemy.scene) { if (block.active) block.destroy(); return; }
      enemy._frozen = false;
      if (enemy._frozenPrevUpdate) enemy.update = enemy._frozenPrevUpdate;
      if (enemy.body) enemy.body.setAllowGravity(enemy._preFreezeGravity !== false);
      if (enemy.active) enemy.clearTint();
      if (scn._iceBlocks) {
        const i = scn._iceBlocks.indexOf(block);
        if (i >= 0) scn._iceBlocks.splice(i, 1);
      }
      if (block.active) {
        scn.tweens.add({
          targets: block, alpha: 0, duration: 220,
          onComplete: () => block.destroy(),
        });
      }
    };
    // Crack warning in the last second
    scn.time.delayedCall(ms - 900, () => {
      if (block.active) {
        scn.tweens.add({ targets: block, alpha: 0.45, duration: 150, yoyo: true, repeat: 3 });
      }
    });
    scn.time.delayedCall(ms, thaw);
    enemy._thawFn = thaw;
  }
}
