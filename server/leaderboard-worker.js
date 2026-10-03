// JAMMED online leaderboard — a Cloudflare Worker with one KV namespace.
//
// Deploy (free tier is plenty):
//   1. npm i -g wrangler && wrangler login
//   2. wrangler kv namespace create SCORES      (copy the id it prints)
//   3. Create wrangler.toml next to this file:
//        name = "jammed-leaderboard"
//        main = "leaderboard-worker.js"
//        compatibility_date = "2025-01-01"
//        [[kv_namespaces]]
//        binding = "SCORES"
//        id = "<the id from step 2>"
//   4. wrangler deploy          -> prints https://jammed-leaderboard.<you>.workers.dev
//   5. Put that URL in index.html: window.JAMMED_LEADERBOARD_URL = "https://...";
//
// API
//   GET  /top?limit=10           -> { scores: [{ name, score, stage, hard, at }] }
//   POST /submit {name,score,stage,hard} -> { rank }   (rank is 1-based, or 0 if off the board)

const MAX_ENTRIES = 100;
const MAX_SCORE = 2000000;
const KEY = "top";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

async function readBoard(env) {
  const raw = await env.SCORES.get(KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    if (request.method === "GET" && url.pathname === "/top") {
      const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "10", 10) || 10));
      const board = await readBoard(env);
      return json({ scores: board.slice(0, limit) });
    }

    if (request.method === "POST" && url.pathname === "/submit") {
      // Light rate limit: one submit per IP per 10 seconds
      const ip = request.headers.get("CF-Connecting-IP") || "anon";
      const rlKey = "rl:" + ip;
      if (await env.SCORES.get(rlKey)) return json({ error: "slow down" }, 429);
      await env.SCORES.put(rlKey, "1", { expirationTtl: 10 });

      let body;
      try {
        body = await request.json();
      } catch (e) {
        return json({ error: "bad json" }, 400);
      }
      const name = String(body.name || "")
        .toUpperCase()
        .replace(/[^A-Z0-9 ]/g, "")
        .slice(0, 3);
      const score = Math.floor(Number(body.score));
      if (name.length !== 3 || !Number.isFinite(score) || score <= 0 || score > MAX_SCORE) {
        return json({ error: "invalid entry" }, 400);
      }
      const entry = {
        name,
        score,
        stage: String(body.stage || "").slice(0, 8),
        hard: !!body.hard,
        at: Date.now(),
      };
      const board = await readBoard(env);
      board.push(entry);
      board.sort((a, b) => b.score - a.score || a.at - b.at);
      const trimmed = board.slice(0, MAX_ENTRIES);
      await env.SCORES.put(KEY, JSON.stringify(trimmed));
      const rank = trimmed.indexOf(entry) + 1;
      return json({ rank });
    }

    return json({ error: "not found" }, 404);
  },
};
