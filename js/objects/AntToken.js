// BREAD — the game's real collectible, restored.
//
// The repo has always been built around bread: the pickup sfx is
// collectBreadToken.mp3, the end credits grade you out of FIVE Bread
// Tokens per level, and assets/img/sprites/bread-token/ still holds
// the original shimmering loaf with its 5-frame animation. Only the
// art had drifted to an ant token somewhere along the way.
//
// Five per stage, placed off the main line so finding them is a
// choice. Bread is gig money — what an independent act actually
// walks away with — which is the right currency for this game.
class BreadToken extends Phaser.Physics.Arcade.Sprite {
  static ensureAnim(scn) {
    if (scn.anims.exists("bread-shimmer")) return;
    scn.anims.create({
      key: "bread-shimmer",
      frames: scn.anims.generateFrameNames("bread-token", {
        prefix: "shimmer", start: 1, end: 5,
      }),
      frameRate: 8,
      repeat: -1,
    });
  }

  constructor(scn, x, y) {
    const hasBread = scn.textures.exists("bread-token");
    super(scn, x, y, hasBread ? "bread-token" : "ant-token",
      hasBread ? "shimmer1" : "spin1");
    this.score = 1000;
    this.gameName = "BreadToken";

    scn.add.existing(this);
    scn.physics.add.existing(this);
    // Join the group BEFORE configuring the body: a physics group
    // re-applies its own defaults (gravity on) to children as they're
    // added, which silently dragged every token ~31px down onto the
    // nearest floor — or into the nearest pit.
    scn.collectibles.add(this);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.setDepth(56);
    if (hasBread) {
      BreadToken.ensureAnim(scn);
      this.play("bread-shimmer");
    } else {
      this.setDisplaySize(16, 16);
      this.play("ant-token-spin");
    }

    // Hover is a sine offset from a live baseline, not a tween.
    // Tilemap object layers construct via `new BreadToken(scene)` and
    // assign position afterwards — sometimes more than once — so a
    // tween created in the constructor locks onto a stale y and then
    // hauls the token back and forth across the gap.
    this.baseY = typeof y === "number" ? y : null;
    this._bob = (x || 0) * 0.7;   // per-token phase so they don't pulse in unison

    scn._breadTotal = (scn._breadTotal || 0) + 1;
  }

  setPosition(x, y, z, w) {
    super.setPosition(x, y, z, w);
    if (typeof y === "number") this.baseY = y;
    if (typeof x === "number") this._bob = x * 0.7;
    return this;
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.baseY === null || this.baseY === undefined) return;
    this.y = this.baseY + Math.sin(time / 420 + this._bob) * 2;
  }

  // --- Per-stage tally -----------------------------------------------
  static _bank() {
    if (typeof game === "undefined" || !game) return null;
    if (!game.bread) game.bread = { total: 0, byStage: {} };
    return game.bread;
  }

  static collectedIn(scn) {
    const b = BreadToken._bank();
    if (!b) return 0;
    return b.byStage[scn.sys.settings.key] || 0;
  }

  static totalCollected() {
    const b = BreadToken._bank();
    return b ? b.total : 0;
  }

  effect() {
    const scn = this.scene || scene;
    scn.scene.get("UIScene").setScore(this.score);
    if (scn.cache.audio.exists("antTokenCollectSound")) {
      scn.sound.play("antTokenCollectSound");
    }
    this.body.setEnable(false);
    this.stop();

    const b = BreadToken._bank();
    if (b) {
      const k = scn.sys.settings.key;
      b.byStage[k] = (b.byStage[k] || 0) + 1;
      b.total += 1;
      // Legacy counter some scenes still read for "how much came back"
      if (game.antTokensCollected) game.antTokensCollected.level1 = b.total;
    }
    if (scn.jammy && typeof scn.jammy.antTokens === "number") scn.jammy.antTokens += 1;
    if (typeof scn.tryReviveBlubert === "function") scn.tryReviveBlubert();
    const ui = scn.scene.get("UIScene");
    if (ui && ui.setBread) {
      ui.setBread(BreadToken.collectedIn(scn), scn._breadTotal || 5);
    }

    const pop = scn.add.bitmapText(this.x, this.y - 8, "tempFont", "+BREAD", 8)
      .setOrigin(0.5).setDepth(120).setTintFill(0xffd877);
    scn.tweens.add({
      targets: pop, y: pop.y - 18, alpha: 0, duration: 700,
      onComplete: () => pop.destroy(),
    });

    this.setAlpha(1);
    scn.tweens.add({
      targets: this,
      scaleX: 2.2, scaleY: 2.2, alpha: 0,
      duration: 260, ease: "Quad.easeOut",
      onComplete: () => this.destroy(),
    });
  }
}

// Tiled object layers and older scenes still say AntToken.
const AntToken = BreadToken;
