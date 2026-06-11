// The murmur (x0x) — the resistance gossip network. Rumors surface as
// quiet lowercase lines at the bottom of the screen when Jammy passes
// trigger points. Also home to the shared Concentrate-brand textures
// (Drip billboards, droplet logo) and the x0x wall glyph.
class Murmur {
  constructor(scene) {
    this.scene = scene;
    this.triggers = [];
    this.active = null;
    this.queue = [];
  }

  // Fire `text` once, the first time Jammy's x passes `x`.
  addTrigger(x, text) {
    this.triggers.push({ x, text, fired: false });
  }

  update(jx) {
    for (const t of this.triggers) {
      if (!t.fired && jx >= t.x) {
        t.fired = true;
        this.say(t.text);
      }
    }
  }

  say(text) {
    if (this.active) {
      this.queue.push(text);
      return;
    }
    const s = this.scene;
    const line = s.add.bitmapText(8, 226, "tempFont", "x0x: " + text, 8);
    line.setScrollFactor(0).setDepth(350).setTintFill(0xb8e8e0).setAlpha(0);
    this.active = line;
    s.tweens.add({
      targets: line,
      alpha: 1,
      duration: 250,
      onComplete: () => {
        s.time.delayedCall(3400, () => {
          s.tweens.add({
            targets: line,
            alpha: 0,
            duration: 400,
            onComplete: () => {
              line.destroy();
              this.active = null;
              if (this.queue.length) this.say(this.queue.shift());
            },
          });
        });
      },
    });
  }
}

// Scratched x0x glyph — etched into brick, sandstone, pipes. Marks
// relay points and safehouses. Dark scratch + lighter chipped edge.
function ensureX0XTexture(scn) {
  if (scn.textures.exists("x0x-glyph")) return;
  const g = scn.make.graphics({ x: 0, y: 0, add: false });
  const scratch = (color, dx, dy) => {
    g.fillStyle(color, 1);
    // x
    g.fillRect(dx + 0, dy + 0, 2, 2); g.fillRect(dx + 2, dy + 2, 2, 2);
    g.fillRect(dx + 4, dy + 4, 2, 2); g.fillRect(dx + 4, dy + 0, 2, 2);
    g.fillRect(dx + 0, dy + 4, 2, 2);
    // 0
    g.fillRect(dx + 8, dy + 0, 6, 2); g.fillRect(dx + 8, dy + 4, 6, 2);
    g.fillRect(dx + 8, dy + 2, 2, 2); g.fillRect(dx + 12, dy + 2, 2, 2);
    // x
    g.fillRect(dx + 16, dy + 0, 2, 2); g.fillRect(dx + 18, dy + 2, 2, 2);
    g.fillRect(dx + 20, dy + 4, 2, 2); g.fillRect(dx + 20, dy + 0, 2, 2);
    g.fillRect(dx + 16, dy + 4, 2, 2);
  };
  scratch(0x1a1018, 0, 0);       // deep scratch
  scratch(0xcfc4b8, 1, 1);       // chipped highlight edge
  g.generateTexture("x0x-glyph", 23, 7);
  g.destroy();
}

// Concentrate, Inc. brand kit — the smiling droplet and the Drip
// billboard. Too-clean teal against the warm world palette.
function ensureConcentrateTextures(scn) {
  if (scn.textures.exists("drip-billboard")) return;

  // Smiling droplet mascot, 14x18
  let g = scn.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x2ab8b0, 1);
  g.fillTriangle(7, 0, 2, 9, 12, 9);
  g.fillCircle(7, 11, 6);
  g.fillStyle(0x7fe8e0, 1);
  g.fillRect(4, 8, 2, 3); // shine
  g.fillStyle(0x0a3835, 1);
  g.fillRect(4, 11, 2, 2); // eyes
  g.fillRect(8, 11, 2, 2);
  g.fillRect(5, 14, 4, 1); // smile
  g.generateTexture("drip-droplet", 14, 18);
  g.destroy();

  // Billboard: white panel, teal border, droplet + "THE DRIP / ALWAYS ON"
  g = scn.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x14383a, 1);
  g.fillRect(0, 0, 88, 36);
  g.fillStyle(0xeef8f6, 1);
  g.fillRect(2, 2, 84, 32);
  g.fillStyle(0x2ab8b0, 1);
  g.fillRect(2, 2, 84, 3);
  // posts
  g.fillStyle(0x14383a, 1);
  g.fillRect(10, 36, 4, 10);
  g.fillRect(74, 36, 4, 10);
  g.generateTexture("drip-billboard", 88, 46);
  g.destroy();
}

// Places a finished billboard (panel + droplet + text) into a scene.
function addDripBillboard(scn, x, y, opts = {}) {
  ensureConcentrateTextures(scn);
  const c = scn.add.container(x, y);
  c.setDepth(opts.depth !== undefined ? opts.depth : 3);
  if (opts.scrollFactor !== undefined) c.setScrollFactor(opts.scrollFactor, 1);
  c.add(scn.add.image(0, 0, "drip-billboard"));
  c.add(scn.add.image(-28, -3, "drip-droplet"));
  const t1 = scn.add.bitmapText(10, -10, "tempFont", "THE DRIP", 8)
    .setOrigin(0.5).setTintFill(0x118a84);
  const t2 = scn.add.bitmapText(10, 2, "tempFont", "ALWAYS ON", 8)
    .setOrigin(0.5).setTintFill(0x4a6a68);
  c.add([t1, t2]);
  return c;
}
