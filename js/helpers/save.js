// Persistent save data (localStorage). Survives page reloads and new
// runs: the arcade high-score table, which Lost Jams (hidden records)
// have ever been found, best stage times, and unlocks.
//
//   loadSave()            -> the save object (cached)
//   commitSave()          -> write the cached object back
//   recordHighScore(...)  -> insert into the top-10, returns rank or -1
//   qualifiesForHighScore(score) -> true if it would make the table

const SAVE_KEY = "jammed.save.v1";
const HIGH_SCORE_SLOTS = 10;

// Every Lost Jam in the game, in the order they're shown on the title
// screen. Finding them all unlocks the JAMS PLAYER jukebox.
const LOST_JAM_IDS = ["Level1", "Stage1_3", "Stage1_S", "Stage1_4"];
const LOST_JAM_NAMES = {
  Level1: "ROOFTOP RIFF",
  Stage1_3: "MESA MIRAGE",
  Stage1_S: "CLOUD NINE",
  Stage1_4: "FACTORY FUNK",
};

var _saveCache = null;

function defaultSave() {
  return {
    highScores: [
      { name: "JAM", score: 25000, stage: "1-4" },
      { name: "JIM", score: 18000, stage: "1-3" },
      { name: "NIK", score: 12000, stage: "1-3" },
      { name: "DUS", score: 8000, stage: "1-2" },
      { name: "BLU", score: 5000, stage: "1-1" },
    ],
    lostJams: {}, // id -> true
    bestTimes: {}, // stageKey -> ms
    cleared: false, // beaten the game at least once
    hardUnlocked: false,
    hardCleared: false,
  };
}

function loadSave() {
  if (_saveCache) return _saveCache;
  let data = null;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (raw) data = JSON.parse(raw);
  } catch (e) {
    data = null;
  }
  const d = defaultSave();
  if (data && typeof data === "object") {
    Object.assign(d, data);
    if (!Array.isArray(d.highScores)) d.highScores = defaultSave().highScores;
    if (!d.lostJams || typeof d.lostJams !== "object") d.lostJams = {};
    if (!d.bestTimes || typeof d.bestTimes !== "object") d.bestTimes = {};
  }
  _saveCache = d;
  return d;
}

function commitSave() {
  if (!_saveCache) return;
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(_saveCache));
  } catch (e) {
    /* private mode / quota — play on without persistence */
  }
}

function qualifiesForHighScore(score) {
  const s = loadSave();
  if (score <= 0) return false;
  if (s.highScores.length < HIGH_SCORE_SLOTS) return true;
  return score > s.highScores[s.highScores.length - 1].score;
}

// Returns the 0-based rank the entry landed at, or -1.
function recordHighScore(name, score, stage) {
  const s = loadSave();
  const entry = { name: (name || "AAA").toUpperCase().slice(0, 3), score, stage };
  s.highScores.push(entry);
  s.highScores.sort((a, b) => b.score - a.score);
  s.highScores = s.highScores.slice(0, HIGH_SCORE_SLOTS);
  commitSave();
  return s.highScores.indexOf(entry);
}

function lostJamsFound() {
  const s = loadSave();
  return LOST_JAM_IDS.filter((id) => s.lostJams[id]).length;
}

function allLostJamsFound() {
  return lostJamsFound() >= LOST_JAM_IDS.length;
}

function markLostJam(id) {
  const s = loadSave();
  const isNew = !s.lostJams[id];
  s.lostJams[id] = true;
  commitSave();
  return isNew;
}

function recordBestTime(stageKey, ms) {
  const s = loadSave();
  const prev = s.bestTimes[stageKey];
  if (!prev || ms < prev) {
    s.bestTimes[stageKey] = ms;
    commitSave();
    return true;
  }
  return false;
}

function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  const t = Math.floor((ms % 1000) / 100);
  return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s + "." + t;
}
