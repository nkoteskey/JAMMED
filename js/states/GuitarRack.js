// The Guitar Rack — collection overlay opened with G during gameplay.
// Shows every guitar model: owned ones in full color with their stats,
// undiscovered ones as "???" silhouettes. A/D moves the cursor,
// SPACE/ENTER equips, G closes and resumes play.
class GuitarRack extends Phaser.Scene {
  constructor() {
    super({ key: "GuitarRack" });
  }

  init(data) {
    this.gameScene = data.key;
  }

  create() {
    this.scene.bringToTop();
    ensureGuitarTextures(this);
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    this.add.rectangle(cx, cy, 426, 240, 0x000000, 0.72);
    const panel = this.add.rectangle(cx, cy, 380, 200, 0x1a0a22, 0.96);
    panel.setStrokeStyle(2, 0xffb86b, 1);
    this.add.bitmapText(cx, cy - 86, "tempFont", "GUITAR RACK", 14)
      .setOrigin(0.5).setTintFill(0xffd877);

    this.ids = Object.keys(GUITAR_CATALOG);
    const coll = getGuitarCollection();
    this.cursor = Math.max(0, this.ids.indexOf(coll.equipped));

    // Slot frames + contents
    this.slots = this.ids.map((id, i) => {
      const x = cx + (i - (this.ids.length - 1) / 2) * 118;
      const y = cy - 14;
      const frame = this.add.rectangle(x, y, 100, 104, 0x2a1838, 1);
      frame.setStrokeStyle(2, 0x5a3a5e, 1);
      const cat = GUITAR_CATALOG[id];
      const owned = coll.owned.includes(id);

      const img = this.add.image(x, y - 8, "guitar-" + id).setScale(1.6);
      let label;
      if (owned) {
        label = this.add.bitmapText(x, y + 36, "tempFont", cat.name, 8)
          .setOrigin(0.5).setTintFill(cat.labelColor);
      } else {
        img.setTintFill(0x100818); // undiscovered silhouette
        img.setAlpha(0.9);
        label = this.add.bitmapText(x, y + 36, "tempFont", "???", 8)
          .setOrigin(0.5).setTintFill(0x8a7a92);
      }
      const equippedTag = this.add.bitmapText(x, y - 44, "tempFont", "EQUIPPED", 8)
        .setOrigin(0.5).setTintFill(0x8ce070).setVisible(false);

      // Touch: tap to select, tap again to equip
      frame.setInteractive();
      frame.on("pointerdown", () => {
        if (this.cursor === i) this._equip();
        else { this.cursor = i; this._refresh(); }
      });
      return { id, x, y, frame, img, label, equippedTag, owned };
    });

    // Touch close button
    const closeBtn = this.add.bitmapText(cx + 178, cy - 88, "tempFont", "X", 12)
      .setOrigin(0.5).setTintFill(0xff8888);
    closeBtn.setInteractive(
      new Phaser.Geom.Rectangle(-10, -10, 20, 20),
      Phaser.Geom.Rectangle.Contains
    );
    closeBtn.on("pointerdown", () => this._close());

    // Description lines under the rack
    this.descText1 = this.add.bitmapText(cx, cy + 56, "tempFont", "", 8)
      .setOrigin(0.5).setTintFill(0xffffff);
    this.descText2 = this.add.bitmapText(cx, cy + 70, "tempFont", "", 8)
      .setOrigin(0.5).setTintFill(0xc0b0c8);
    this.add.bitmapText(cx, cy + 88, "tempFont", "A/D MOVE - SPACE EQUIP - G CLOSE", 8)
      .setOrigin(0.5).setTintFill(0x8a7a92);

    this._refresh();

    this.input.keyboard.on("keydown-A", () => this._move(-1));
    this.input.keyboard.on("keydown-LEFT", () => this._move(-1));
    this.input.keyboard.on("keydown-D", () => this._move(1));
    this.input.keyboard.on("keydown-RIGHT", () => this._move(1));
    this.input.keyboard.on("keydown-SPACE", () => this._equip());
    this.input.keyboard.on("keydown-ENTER", () => this._equip());
    this.input.keyboard.on("keydown-G", () => this._close());
    this.input.keyboard.on("keydown-E", () => this._close());
    this.input.keyboard.on("keydown-ESC", () => this._close());
  }

  _move(d) {
    this.cursor = Phaser.Math.Wrap(this.cursor + d, 0, this.ids.length);
    this._refresh();
  }

  _refresh() {
    const coll = getGuitarCollection();
    this.slots.forEach((s, i) => {
      const selected = i === this.cursor;
      s.frame.setStrokeStyle(2, selected ? 0xffd877 : 0x5a3a5e, 1);
      s.equippedTag.setVisible(coll.equipped === s.id);
    });
    const s = this.slots[this.cursor];
    if (s.owned) {
      const cat = GUITAR_CATALOG[s.id];
      this.descText1.setText(cat.desc[0]);
      this.descText2.setText(cat.desc[1]);
    } else {
      this.descText1.setText("NOT FOUND YET");
      this.descText2.setText("KEEP EXPLORING THE STAGES");
    }
  }

  _equip() {
    const s = this.slots[this.cursor];
    if (!s.owned) {
      this.sound.play("enemyHitSound", { volume: 0.15, rate: 0.4 });
      return;
    }
    const coll = getGuitarCollection();
    coll.equipped = s.id;
    const cat = GUITAR_CATALOG[s.id];

    // Update the live (paused) gameplay scene's Jammy + HUD
    const level = this.scene.get(this.gameScene);
    if (level && level.jammy) {
      level.jammy.currentWeapon = cat.weapon;
    }
    const ui = this.scene.get("UIScene");
    if (ui && ui.setWeapon) ui.setWeapon(cat.weapon);

    this.sound.play("powerUpSound", { volume: 0.6, rate: 1.3 });
    this._refresh();
  }

  _close() {
    this.scene.stop("GuitarRack");
    this.scene.resume(this.gameScene);
    const level = this.scene.get(this.gameScene);
    if (level) level.cameras.main.setAlpha(1);
    this.scene.resume("UIScene");
  }
}
