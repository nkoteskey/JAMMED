// After the Canning Colossus: the villain reveal. There's no painted
// storyboard for this one yet, so the scene paints its own — a dark
// office above the factory floor, a throne of jam crates, and the
// silhouette of the man who turned the fruit of Los Jamgeles into
// Zomberries: BARON PECTIN.
class CutSceneBaronPectin extends StoryScene {
  constructor() {
    super("CutSceneBaronPectin", {
      storyboard: "storyboard-baron-pectin",
      music: "Jammed",
      musicVolume: 0.6,
      text:
        "Inside the Colossus, Jammy finds a wax seal stamped with a crown: the mark of BARON PECTIN, the marmalade magnate who has been canning the city's fruit into Zomberries! But the Baron has already fled north... toward the Berry Mountains.",
      next: "EndCredits",
      stopMusicOnExit: true,
    });
  }

  create() {
    this._ensureStoryboard();
    super.create();

    // A pair of eyes that blink in the dark, after the fade-in
    const eyes = [this.add.rectangle(286, 70, 6, 3, 0xffd066), this.add.rectangle(300, 70, 6, 3, 0xffd066)];
    eyes.forEach((e) => e.setAlpha(0));
    this.time.delayedCall(1800, () => {
      this.tweens.add({ targets: eyes, alpha: 1, duration: 400 });
      this.time.addEvent({
        delay: 2600,
        loop: true,
        callback: () => this.tweens.add({ targets: eyes, scaleY: 0.1, duration: 80, yoyo: true }),
      });
    });
  }

  _ensureStoryboard() {
    if (this.textures.exists("storyboard-baron-pectin")) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    // Night office: dark plum walls, a tall window, moonlight
    g.fillStyle(0x12081a, 1);
    g.fillRect(0, 0, 426, 240);
    g.fillStyle(0x1e1030, 1);
    g.fillRect(0, 0, 426, 150);
    // Window with the factory skyline
    g.fillStyle(0x2a1838, 1);
    g.fillRect(40, 20, 120, 100);
    g.fillStyle(0x4a3a6a, 1);
    g.fillRect(46, 26, 108, 88);
    g.fillStyle(0xeab0d0, 0.9);
    g.fillCircle(130, 44, 10); // moon
    g.fillStyle(0x1e1030, 1);
    [50, 70, 86, 104, 122, 140].forEach((x, i) => g.fillRect(x, 70 + ((i * 13) % 20), 14, 44));
    g.fillStyle(0x2a1838, 1);
    g.fillRect(98, 26, 4, 88);
    g.fillRect(46, 68, 108, 4);
    // Floor
    g.fillStyle(0x2e1a3a, 1);
    g.fillRect(0, 150, 426, 90);
    g.fillStyle(0x3a2448, 1);
    for (let x = 0; x < 426; x += 32) g.fillRect(x, 150, 16, 90);
    // Throne of jam crates
    g.fillStyle(0x5a3a2a, 1);
    g.fillRect(240, 100, 110, 60);
    g.fillRect(256, 60, 78, 44);
    g.fillStyle(0x7a5438, 1);
    for (let y = 64; y < 156; y += 14) g.fillRect(244, y, 102, 2);
    g.fillStyle(0xc23a66, 1);
    [[262, 70], [300, 84], [250, 118], [320, 128]].forEach(([x, y]) => g.fillRect(x, y, 14, 10));
    // The Baron: top hat, cloak, crown-sealed cane — all silhouette
    g.fillStyle(0x07030a, 1);
    g.fillRect(270, 50, 46, 60); // body
    g.fillCircle(293, 46, 16); // head
    g.fillRect(277, 14, 32, 22); // hat
    g.fillRect(269, 34, 48, 6); // brim
    g.fillTriangle(262, 110, 324, 110, 293, 160); // cloak
    g.fillRect(330, 70, 3, 90); // cane
    g.fillStyle(0xffd066, 1);
    g.fillRect(326, 64, 11, 8); // gold crown handle
    g.fillRect(326, 62, 2, 2);
    g.fillRect(331, 62, 2, 2);
    g.fillRect(336, 62, 2, 2);
    // Wax seal on the desk, glowing
    g.fillStyle(0xd02a60, 1);
    g.fillCircle(190, 164, 9);
    g.fillStyle(0xffd066, 1);
    g.fillRect(185, 160, 10, 5);
    // Desk
    g.fillStyle(0x3a2818, 1);
    g.fillRect(150, 170, 90, 8);
    g.fillRect(156, 178, 6, 24);
    g.fillRect(228, 178, 6, 24);
    g.generateTexture("storyboard-baron-pectin", 426, 240);
    g.destroy();
  }
}
