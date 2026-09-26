# Source drawings

Pulled from the JAMMED Trello board (trello.com/b/n1VuVRQB) so the
art the game is traced from lives in the repo instead of only on a
board that could move.

| File | Card | Used for |
|---|---|---|
| `rocketaxe.jpg` | Rocket Axe | Reference for the `sb-rocketaxe` panel — Jammy on the flying V, booster lit. The scene plays after the Watermelon boss, where the guitar tech hands the rebuilt axe over |
| `blubert-2484.jpg` | The introduction of Blubert | Reference for the `sb-blubert` panel — Jammy kneeling by the box outside Jam Junkers, "It's okay little buddy" |
| `blubert-2483.jpg` | The introduction of Blubert | The written scene; source of the cutscene caption |
| `blubert-2485.jpg` | The introduction of Blubert | Mechanic spec: bush eyes on detection, Seeds of Destruction, Blubert caught in the blast, drones hiding in clouds |
| `blubert-2486.jpg` | The introduction of Blubert | Drones in clouds are undetectable — "stay sharp" |

The panels are staged in `js/helpers/storyboard.js`: a coded backdrop
with the game's own sprites composed on top at poster scale, so the
character art is always the artist's. If hand-drawn panel art is ever
produced, drop the PNG in `assets/img/storyboards/` and pass its key
to `runStoryboard` — the staged versions are the fallback, not the
destination.
