// World 2 story cards, painted in code (no storyboard art for them yet).

// Opening of World 2: the trail into the Berry Mountains
class CutSceneWorld2 extends StoryScene {
  constructor() {
    super("CutSceneWorld2", {
      storyboard: "storyboard-world2",
      music: "Jammed",
      musicVolume: 0.6,
      text:
        "WORLD TWO: THE BERRY MOUNTAINS. Jammy follows the Baron's trail up into the snow, where the Zomberries are frostbitten and the footing is treacherous. Somewhere above the clouds sits Pectin's mountain lodge...",
      next: "Stage2_1",
      stopMusicOnExit: true,
    });
  }

  create() {
    if (!this.textures.exists("storyboard-world2")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x0c1430, 1);
      g.fillRect(0, 0, 426, 240);
      for (let i = 0; i < 60; i++) g.fillRect((i * 97) % 426, (i * 53) % 120, 1, 1);
      g.fillStyle(0xffffff, 1);
      for (let i = 0; i < 60; i++) g.fillRect((i * 97) % 426, (i * 53) % 120, 1, 1);
      g.fillStyle(0xeef4ff, 1);
      g.fillCircle(350, 40, 16);
      // Mountains, three ranges
      g.fillStyle(0x1a2a5a, 1);
      for (let x = -40; x < 460; x += 120) g.fillTriangle(x, 170, x + 60, 60, x + 120, 170);
      g.fillStyle(0xe8f4ff, 1);
      for (let x = -40; x < 460; x += 120) g.fillTriangle(x + 42, 92, x + 60, 60, x + 78, 92);
      g.fillStyle(0x2a4078, 1);
      for (let x = -80; x < 460; x += 100) g.fillTriangle(x, 180, x + 50, 100, x + 100, 180);
      g.fillStyle(0x3a5a98, 1);
      g.fillRect(0, 170, 426, 70);
      // Trail of footprints up the slope
      g.fillStyle(0x24488a, 1);
      for (let i = 0; i < 9; i++) g.fillRect(120 + i * 22, 200 - i * 8, 4, 2);
      // Lodge on the peak with a lit window
      g.fillStyle(0x3a2818, 1);
      g.fillRect(300, 64, 30, 20);
      g.fillTriangle(296, 64, 315, 48, 334, 64);
      g.fillStyle(0xffd9a0, 1);
      g.fillRect(310, 70, 8, 8);
      // Jammy's silhouette on the slope, guitar on his back
      g.fillStyle(0x07030a, 1);
      g.fillRect(40, 132, 14, 22);
      g.fillRect(38, 124, 18, 10);
      g.fillRect(54, 142, 16, 4);
      g.generateTexture("storyboard-world2", 426, 240);
      g.destroy();
    }
    super.create();
  }
}

// End of the current build: the Baron's lodge, and a promise
class CutSceneToBeContinued extends StoryScene {
  constructor() {
    super("CutSceneToBeContinued", {
      storyboard: "storyboard-tbc",
      music: "Jammed",
      musicVolume: 0.6,
      text:
        "The lodge is empty, but the fire is still warm. On the table: a map of the whole Jam Republic, every town circled... Baron Pectin's plan is bigger than one city. TO BE CONTINUED!",
      next: "EndCredits",
      stopMusicOnExit: true,
    });
  }

  create() {
    if (!this.textures.exists("storyboard-tbc")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      // Warm lodge interior
      g.fillStyle(0x2a1a10, 1);
      g.fillRect(0, 0, 426, 240);
      g.fillStyle(0x6a4a30, 1);
      for (let y = 0; y < 160; y += 18) g.fillRect(0, y, 426, 14);
      g.fillStyle(0x4a3220, 1);
      g.fillRect(0, 160, 426, 80);
      // Fireplace
      g.fillStyle(0x3a3a3a, 1);
      g.fillRect(40, 70, 90, 100);
      g.fillStyle(0x1a0a08, 1);
      g.fillRect(56, 96, 58, 64);
      g.fillStyle(0xff7a22, 1);
      g.fillTriangle(66, 160, 85, 118, 104, 160);
      g.fillStyle(0xffd066, 1);
      g.fillTriangle(74, 160, 85, 132, 96, 160);
      // Table with the map
      g.fillStyle(0x8c6440, 1);
      g.fillRect(220, 130, 150, 10);
      g.fillRect(226, 140, 8, 40);
      g.fillRect(356, 140, 8, 40);
      g.fillStyle(0xf0e0b0, 1);
      g.fillRect(240, 104, 110, 30);
      g.fillStyle(0xc23a66, 1);
      [[250, 110], [280, 122], [310, 108], [335, 120]].forEach(([x, y]) => {
        g.lineStyle(2, 0xc23a66, 1);
        g.strokeCircle(x, y, 6);
      });
      g.fillStyle(0x3a2818, 1);
      g.fillRect(246, 112, 100, 1);
      g.fillRect(258, 126, 70, 1);
      // Window with snow outside
      g.fillStyle(0x1a2a5a, 1);
      g.fillRect(300, 30, 70, 50);
      g.fillStyle(0xffffff, 1);
      for (let i = 0; i < 12; i++) g.fillRect(304 + ((i * 37) % 62), 34 + ((i * 23) % 42), 2, 2);
      g.fillStyle(0x3a2818, 1);
      g.fillRect(334, 30, 3, 50);
      g.fillRect(300, 54, 70, 3);
      g.generateTexture("storyboard-tbc", 426, 240);
      g.destroy();
    }
    super.create();
  }
}
