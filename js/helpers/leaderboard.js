// Online leaderboard client. Talks to the tiny API in
// server/leaderboard-worker.js (a Cloudflare Worker). When no URL is
// configured (window.JAMMED_LEADERBOARD_URL is empty) everything here
// is a no-op and the game falls back to the local top-10.
//
//   leaderboardEnabled()        -> bool
//   submitWorldScore(entry)     -> Promise<{rank}|null>
//   fetchWorldScores(limit)     -> Promise<[{name, score, stage}]>

function leaderboardUrl() {
  const u = typeof window !== "undefined" ? window.JAMMED_LEADERBOARD_URL : "";
  return typeof u === "string" ? u.replace(/\/+$/, "") : "";
}

// leaderboard.json next to index.html (committed by the deploy-leaderboard
// workflow) overrides the inline setting when present.
(function loadLeaderboardConfig() {
  if (typeof window === "undefined" || typeof fetch !== "function") return;
  if (window.JAMMED_LEADERBOARD_URL) return;
  fetch("leaderboard.json", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => {
      if (j && typeof j.url === "string" && /^https:\/\//.test(j.url)) {
        window.JAMMED_LEADERBOARD_URL = j.url;
      }
    })
    .catch(() => {});
})();

function leaderboardEnabled() {
  return leaderboardUrl().length > 0 && typeof fetch === "function";
}

function submitWorldScore(entry) {
  if (!leaderboardEnabled()) return Promise.resolve(null);
  const body = {
    name: String(entry.name || "AAA").toUpperCase().slice(0, 3),
    score: Math.max(0, Math.floor(entry.score || 0)),
    stage: String(entry.stage || "").slice(0, 8),
    hard: !!entry.hard,
    v: 2,
  };
  return fetch(leaderboardUrl() + "/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
}

var _worldScoresCache = null;
function fetchWorldScores(limit = 10) {
  if (!leaderboardEnabled()) return Promise.resolve([]);
  if (_worldScoresCache) return Promise.resolve(_worldScoresCache.slice(0, limit));
  return fetch(leaderboardUrl() + "/top?limit=" + limit)
    .then((r) => (r.ok ? r.json() : { scores: [] }))
    .then((d) => {
      const list = Array.isArray(d.scores) ? d.scores : [];
      _worldScoresCache = list;
      return list.slice(0, limit);
    })
    .catch(() => []);
}

function invalidateWorldScores() {
  _worldScoresCache = null;
}
