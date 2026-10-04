// Stage select — a testing menu reachable from the title screen while
// STAGE_SELECT_ENABLED is true (globals.js). Starts any stage directly,
// granting the abilities and guitars Jammy would have at that point.
class StageSelect extends Phaser.Scene {
  constructor() {
    super({ key: "StageSelect" });
  }

  create() {
    this.cameras.main.setBackgroundColor("#120a1c");
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const cx = this.cameras.main.centerX;

    this.entries = [
      { key: "Level1", label: "1-1  LOS JAMGELES", grants: {} },
      { key: "Level1BossFight", label: "1-2  THE THEATER (WATERMELON)", grants: {} },
      { key: "Stage1_3", label: "1-3  SUNSET MESA", grants: { rocket: true } },
      { key: "Stage1_S", label: "1-S  CLOUD NINE (SECRET)", grants: { rocket: true, guitars: ["desert-seedcaster"] } },
      { key: "Stage1_4", label: "1-4  THE JAM WORKS", grants: { rocket: true, guitars: ["desert-seedcaster"] } },
      { key: "Stage1_4Boss", label: "1-5  THE CANNING FLOOR (COLOSSUS)", grants: { rocket: true, guitars: ["desert-seedcaster", "royal-bass"] } },
      { key: "Stage2_1", label: "2-1  THE BERRY MOUNTAINS", grants: { rocket: true, guitars: ["desert-seedcaster", "royal-bass"] } },
      { key: "Stage2_2", label: "2-2  FROSTBITE FALLS", grants: { rocket: true, guitars: ["desert-seedcaster", "royal-bass", "glacier-slide"] } },
      { key: "Stage2_3", label: "2-3  THE PRESERVE MINES (COUNT CURRANT)", grants: { rocket: true, guitars: ["desert-seedcaster", "royal-bass", "glacier-slide"] } },
      { key: "EndCredits", label: "ENDING / CREDITS", grants: { rocket: true, guitars: ["desert-seedcaster", "royal-bass", "glacier-slide"] } },
    ];
    this.selected = 0;

    this.add.bitmapText(cx, 14, "tempFont", "STAGE SELECT", 16).setOrigin(0.5, 0).setTintFill(0xffd066);
    this.add.bitmapText(cx, 34, "tempFont", "TESTING MENU - ABILITIES GRANTED FOR THAT POINT IN THE GAME", 7)
      .setOrigin(0.5, 0).setTintFill(0x8a7a92);

    this.rows = this.entries.map((e, i) => {
      const y = 50 + i * 16;
      const t = this.add.bitmapText(cx - 120, y, "tempFont", e.label, 10).setTintFill(0xffffff);
      const cursor = this.add.bitmapText(cx - 134, y, "tempFont", ">", 10).setTintFill(0xffd066);
      const zone = this.add.zone(cx, y + 5, 300, 16).setInteractive({ useHandCursor: true });
      zone.on("pointerdown", () => {
        if (this.selected === i) this.start();
        else {
          this.selected = i;
          this.refresh();
        }
      });
      return { t, cursor };
    });

    this.hardText = this.add.bitmapText(cx, 212, "tempFont", "", 8).setOrigin(0.5).setTintFill(0xff6a9a);
    this.hard = false;
    this.add.bitmapText(cx, 228, "tempFont", isTouchDevice() ? "TAP TWICE TO START - TAP TITLE TO GO BACK" : "W/S PICK - SPACE START - H HARD MODE - ESC BACK", 8)
      .setOrigin(0.5).setTintFill(0x8a7a92);

    const kb = this.input.keyboard;
    onKeys(addKeys(kb, ["W", "UP"]), "down", () => this.move(-1), this);
    onKeys(addKeys(kb, ["S", "DOWN"]), "down", () => this.move(1), this);
    onKeys(addKeys(kb, ["SPACE", "ENTER"]), "down", () => this.start(), this);
    onKeys(addKeys(kb, ["H"]), "down", () => this.toggleHard(), this);
    onKeys(addKeys(kb, ["ESC", "E"]), "down", () => this.back(), this);
    this.refresh();
  }

  move(d) {
    this.selected = Phaser.Math.Wrap(this.selected + d, 0, this.entries.length);
    this.refresh();
    this.sound.play("antTokenCollectSound", { volume: 0.25, rate: 1.8 });
  }

  toggleHard() {
    this.hard = !this.hard;
    this.refresh();
  }

  refresh() {
    this.rows.forEach((r, i) => {
      const on = i === this.selected;
      r.cursor.setVisible(on);
      r.t.setTintFill(on ? 0xffd066 : 0xffffff);
    });
    this.hardText.setText(this.hard ? "HARD MODE: ON" : "");
  }

  start() {
    if (this._starting) return;
    this._starting = true;
    const e = this.entries[this.selected];
    const run = resetRunState();
    run.hard = this.hard;
    run.hp = this.hard ? 3 : 5;
    run.startTime = Date.now();
    run.rocketAxe = !!e.grants.rocket;
    run.rocketAxeBannerShown = !!e.grants.rocket;
    run.blubertBannerShown = e.key !== "Stage1_3";
    const coll = getGuitarCollection();
    (e.grants.guitars || []).forEach((id) => {
      if (!coll.owned.includes(id)) coll.owned.push(id);
    });
    this.sound.play("startGameSound", { volume: 0.8 });
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.sound.stopAll();
      if (this.scene.isActive("UIScene")) this.scene.stop("UIScene");
      this.scene.launch("UIScene", { score: 0, key: e.key });
      this.scene.bringToTop("UIScene");
      this.scene.start(e.key);
    });
  }

  back() {
    if (this._starting) return;
    this._starting = true;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("TitleScreen"));
  }
}
