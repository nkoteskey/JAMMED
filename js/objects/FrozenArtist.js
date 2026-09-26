// A named artist in a block of ice on Concentrate's cold-room shelves.
// Not an enemy and not a pickup — an optional rescue. Sustained sonic
// waves (three hits) crack the block; the fruit inside thanks you,
// hands over its seed, and the murmur remembers the name.
class FrozenArtist extends Phaser.Physics.Arcade.Sprite {
  static ensureTextures(scn) {
    if (scn.textures.exists("ice-slab-3")) return;
    for (let stage = 3; stage >= 1; stage--) {
      const g = scn.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x7ec4e0, 0.5);
      g.fillRect(0, 0, 24, 34);
      g.fillStyle(0xbfe8f8, 0.75);
      g.fillRect(0, 0, 24, 3);
      g.fillRect(0, 31, 24, 3);
      g.fillRect(0, 0, 3, 34);
      g.fillRect(21, 0, 3, 34);
      g.fillStyle(0xffffff, 0.5);
      g.fillRect(5, 5, 2, 14);
      g.fillRect(17, 10, 2, 16);
      // The fruit inside, a dim silhouette
      g.fillStyle(0x2a3a52, 0.85);
      g.fillCircle(12, 14, 6);
      g.fillRect(8, 19, 8, 11);
      // Cracks accumulate as it's shot
      if (stage <= 2) {
        g.lineStyle(1, 0xffffff, 0.95);
        g.beginPath(); g.moveTo(6, 3); g.lineTo(11, 12); g.lineTo(8, 20); g.strokePath();
      }
      if (stage <= 1) {
        g.lineStyle(1, 0xffffff, 1);
        g.beginPath(); g.moveTo(19, 6); g.lineTo(13, 16); g.lineTo(18, 28); g.strokePath();
        g.beginPath(); g.moveTo(3, 24); g.lineTo(12, 26); g.strokePath();
      }
      g.generateTexture("ice-slab-" + stage, 24, 34);
      g.destroy();
    }
  }

  constructor(scn, x, y, name) {
    FrozenArtist.ensureTextures(scn);
    super(scn, x, y, "ice-slab-3");
    this.artistName = name || "UNLABELLED";
    this.hp = 3;
    this.dead = false;
    this.freed = false;
    this.invincible = false;
    this.score = 800;

    scn.add.existing(this);
    scn.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.setSize(22, 32);
    this.setDepth(52);

    // Label plate on the shelf below
    this.label = scn.add.bitmapText(x, y + 22, "tempFont", this.artistName, 8)
      .setOrigin(0.5).setTintFill(0x5f8ba0).setDepth(52);

    // Lives in `enemies` so shots collide with it; it never attacks.
    scn.enemies.add(this);
    scn.frozenArtists = scn.frozenArtists || [];
    scn.frozenArtists.push(this);
  }

  update() {}

  takeDamage(val = 1) {
    if (this.freed) return;
    this.hp -= val;
    this.scene.sound.play("enemyHitSound", { rate: 1.7, volume: 0.35 });
    for (let i = 0; i < 4; i++) {
      const p = this.scene.add.rectangle(
        this.x + (Math.random() * 20 - 10), this.y + (Math.random() * 28 - 14),
        2, 2, 0xd8f4ff, 0.9);
      p.setDepth(53);
      this.scene.tweens.add({
        targets: p, y: p.y + 10, alpha: 0, duration: 300,
        onComplete: () => p.destroy(),
      });
    }
    if (this.hp <= 0) this.free();
    else this.setTexture("ice-slab-" + Math.max(1, this.hp));
  }

  free() {
    if (this.freed) return;
    this.freed = true;
    this.dead = true; // stop Blubert/shots treating it as a target

    for (let i = 0; i < 10; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sh = this.scene.add.triangle(this.x, this.y, 0, 4, 3, 0, 6, 4, 0xd8f4ff, 0.95);
      sh.setDepth(80);
      this.scene.tweens.add({
        targets: sh,
        x: this.x + Math.cos(ang) * 30, y: this.y + Math.sin(ang) * 22 + 14,
        angle: 220, alpha: 0, duration: 460,
        onComplete: () => sh.destroy(),
      });
    }
    this.scene.sound.play("enemyDeathSound", { rate: 1.5, volume: 0.6 });
    if (this.scene.cache.audio.exists("antTokenCollectSound")) {
      this.scene.time.delayedCall(140, () =>
        this.scene.sound.play("antTokenCollectSound", { rate: 1.2, volume: 0.6 }));
    }
    this.scene.scene.get("UIScene").setScore(this.score);

    // The thawed artist steps out, waves, and walks off to the Stand
    const fruit = this.scene.add.circle(this.x, this.y + 6, 7, 0xd8447c);
    fruit.setDepth(60);
    const eye1 = this.scene.add.rectangle(this.x - 3, this.y + 4, 2, 2, 0x201020).setDepth(61);
    const eye2 = this.scene.add.rectangle(this.x + 3, this.y + 4, 2, 2, 0x201020).setDepth(61);
    this.scene.tweens.add({
      targets: [fruit, eye1, eye2],
      y: "-=6", duration: 260, yoyo: true,
    });
    this.scene.time.delayedCall(700, () => {
      this.scene.tweens.add({
        targets: [fruit, eye1, eye2],
        x: "+=90", alpha: 0, duration: 1400,
        onComplete: () => { fruit.destroy(); eye1.destroy(); eye2.destroy(); },
      });
    });

    if (this.label) this.label.setTintFill(0x8ce070);
    // Tally for the finale — every thawed artist is a voice back
    if (typeof game !== "undefined" && game) {
      game.thawedArtists = (game.thawedArtists || 0) + 1;
    }
    if (this.scene.murmur) {
      this.scene.murmur.say(this.artistName.toLowerCase() + " is walking. good node");
    }
    if (this.scene.onArtistFreed) this.scene.onArtistFreed();

    this.body.setEnable(false);
    this.setVisible(false);
  }
}
