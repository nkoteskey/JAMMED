# JAMMED
An 8-bit platformer inspired by Jams Player, featuring retro-style gameplay and nostalgic pixel art.

Play it here: https://nkoteskey.github.io/JAMMED/

(The game is published automatically to the `gh-pages` branch by the *Deploy to GitHub Pages* workflow in `.github/workflows/deploy-pages.yml` on every push to `main`.)

![image](https://github.com/user-attachments/assets/4126a93b-7b5d-4edd-b78f-aae124eff760)

## Controls

| Action | Keys |
| --- | --- |
| Move | A / D or ← / → |
| Jump (press again in the air to double jump) | SPACE, Z or K |
| Shoot | Q, N, SHIFT or X |
| Aim up | W or ↑ |
| Swap guitar / weapon | C |
| Guitar Rack (collection) | G |
| Pause | E, P or ESC |

On phones and tablets an on-screen joystick, JUMP and SHOOT buttons, a pause button (top centre) and a weapon-swap tap target (top right) appear automatically.

## Progression

* **Stage 1-1 Los Jamgeles** and **1-2 The Theater** (the Watermelon boss): sonic blast from the Crimson V plus a plain double jump.
* Beating the Watermelon earns the **Rocket Axe**. From then on the second jump fires the guitar's boosters for a long arc, and it stays with you for the rest of the game.
* **Stage 1-3 Sunset Mesa**: a long stage that introduces one idea per section, each staged as its own small challenge: the Rocket Axe (a wide gap, then a mesa wall), the **Seedcaster** and the first bush, Blubert's scan among decoy bushes, the sky drones, the needle cactus, the bobbing fruit platforms and sand snappers, the pineapples, then a finale that mixes them. Seed bombs lock onto the nearest enemy near Jammy (or whatever Blubert has marked) and curve toward it, blowing Zomberries out of their bushes. The blast catches you too: fire at something next to you and you lose a heart, and Blubert loses his lock-on for a few seconds. There is also a **secret exit** somewhere high above the mesa.
* **Stage 1-S Cloud Nine** (secret): a sky run across drifting clouds, packed with Bread Tokens. No falling damage.
* **Stage 1-4 The Jam Works**: the **Royal Bass** sits on the staircase plateau. Its quake wave rolls along the floor and pierces every enemy in a row, ideal for the jar sentries patrolling the factory.
* **Stage 1-5 The Canning Floor**: the factory's master, the **Canning Colossus**, a two-phase boss. Crack the glass, then deal with what's inside. Afterwards the villain behind it all is revealed.
* **World 2: The Berry Mountains**. **Stage 2-1** takes the fight into the snow: ice floors Jammy skids across, an icicle cave guarded by the **Abominable Blueberry** mid-boss behind an ice wall, Snowberry turrets lobbing snowballs, frostbitten Zomberries, and a frozen lake crossed on drifting ice floes. The **Glacier Slide** guitar waits on the first ledge: its echo notes ricochet off floors and walls, and with it equipped DOWN+MOVE is a power slide (hurts enemies, fits under gaps, goes further on ice) and Jammy auto-grinds the stage's rails. It ends at the Baron's lodge... to be continued.

HP and seed ammo carry from stage to stage; dying restarts the current stage with full health.

## Score, combos and secrets

* **Riff combo**: chain kills without pausing or taking a hit. x2 at 3 kills, x3 at 6, x4 "ENCORE" at 10.
* **Bread Tokens** are tallied per stage on the Stage Clear card and in the run report at the end.
* **Lost Jams**: one hidden vinyl record per stage (1-1, 1-3, 1-S, 1-4, 2-1). They are saved permanently; find all four to unlock **JAMS PLAYER**, the sound-test jukebox on the title screen.
* **Run report and rank** (S to D) at the end: tokens, Lost Jams, deaths, time and whether you found the secret exit.
* **High scores**: an arcade top-10 with initials entry, shown on the title screen in attract mode. Best stage times are kept too.
* **Hard mode** unlocks after your first clear: three hearts, faster enemies, 1.5x score.

Everything is saved in the browser (localStorage).

## Online leaderboard (optional, free)

The game ships with a local top-10. The world leaderboard is a tiny Cloudflare Worker (`server/leaderboard-worker.js`) with one KV namespace; Cloudflare's free plan covers it, no card needed. One-time setup:

1. Cloudflare dashboard: My Profile, API Tokens, Create Token, use the "Edit Cloudflare Workers" template.
2. Cloudflare dashboard: Workers & Pages, copy the Account ID.
3. GitHub: repo Settings, Secrets and variables, Actions: add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
4. GitHub: Actions tab, "Deploy leaderboard", Run workflow.

The workflow creates the KV namespace, deploys the worker, and commits `leaderboard.json` with its URL; the next Pages publish makes it live. Scores entered on the credits screen are then uploaded, and the title screen's high-score board alternates between the local and world top-10. (Manual alternative: `wrangler deploy` from `server/` and paste the URL into `index.html` or `leaderboard.json`.)

## Running locally

The game is plain HTML/JS with Phaser vendored in `includes/`. Serve the folder with any static server, e.g.

```
python3 -m http.server 8000
```

and open http://localhost:8000/. Add `?dev` to the URL for warp portals at the start of Stage 1-1 (to 1-3, 1-4 and the boss) and `?debug` to draw physics bodies.

Leave feedback or suggestions in issues. Enjoy!

## License

This project is licensed under the **Autonomi Network Restricted License** – see the [LICENSE](./LICENSE) file for details.
