// The gameplay scene that is currently running. Object classes read
// this to reach groups, sound, tweens etc. Every gameplay/cutscene
// scene assigns it in preload()/init().
var scene;

// Keyboard layout. Each action lists every key that triggers it.
var controls = {
  shoot: ["Q", "N", "SHIFT", "X"],
  jump: ["SPACE", "Z", "K"],
  left: ["A", "LEFT"],
  right: ["D", "RIGHT"],
  aim: ["W", "UP"],
  cycleWeapon: ["C"],
  guitarRack: ["G"],
  pause: ["E", "P", "ESC"],
};

// ---------------------------------------------------------------------
// Run state — everything that has to survive scene changes within one
// play-through: Jammy's HP and seed ammo between stages, bread tokens
// collected per stage, and how many tokens each stage holds in total.
// Lives on the global `game` object; reset from the title screen.
// ---------------------------------------------------------------------

var STAGE_ORDER = ["Level1", "Level1BossFight", "Stage1_3", "Stage1_4"];

var STAGE_NAMES = {
  Level1: "LOS JAMGELES",
  Level1BossFight: "THE THEATER",
  Stage1_3: "SUNSET MESA",
  Stage1_4: "THE JAM WORKS",
};

function resetRunState() {
  if (typeof game === "undefined" || !game) return null;
  game.run = {
    hp: 5,
    seedAmmo: 1,
    // Level 1 is sonic blast + a plain double jump only. The Rocket
    // Axe (and the other guitars) are found from Stage 1-3 onward.
    rocketAxe: false,
    rocketAxeBannerShown: false,
    tokens: {}, // stageKey -> collected
    tokenTotals: {}, // stageKey -> available
    stagesCleared: [],
  };
  // Guitar collection restarts with the Crimson V on a fresh run
  game.guitarCollection = { owned: ["crimson-v"], equipped: "crimson-v" };
  return game.run;
}

function getRunState() {
  if (typeof game === "undefined" || !game) return null;
  if (!game.run) resetRunState();
  return game.run;
}

// Total bread tokens collected / available across every stage so far
function getTokenTally() {
  const run = getRunState();
  let got = 0,
    total = 0;
  if (!run) return { got, total };
  Object.keys(run.tokenTotals).forEach((k) => {
    total += run.tokenTotals[k] || 0;
    got += Math.min(run.tokens[k] || 0, run.tokenTotals[k] || 0);
  });
  return { got, total };
}

// Resolve a key name (or list of names) into Phaser key objects.
function addKeys(keyboard, names) {
  const list = Array.isArray(names) ? names : [names];
  return list
    .map((n) => {
      const code = Phaser.Input.Keyboard.KeyCodes[n];
      if (code === undefined) return null;
      return keyboard.addKey(code);
    })
    .filter(Boolean);
}

function anyKeyDown(keys) {
  for (let i = 0; i < keys.length; i++) if (keys[i].isDown) return true;
  return false;
}

// Register the same handler on every key in a list.
function onKeys(keys, event, handler, ctx) {
  keys.forEach((k) => k.on(event, handler, ctx));
}

// True when the game is running on a touch screen (phone / tablet).
function isTouchDevice() {
  if (typeof game === "undefined" || !game) return false;
  const d = game.device;
  return !!(d && d.input && d.input.touch && !d.os.desktop);
}
