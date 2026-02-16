#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-projects/my-channel}"
COUNT="${2:-30}"
DURATION="${3:-10}"

TOPICS_FILE="$PROJECT_DIR/inputs/topics.txt"
if [[ ! -f "$TOPICS_FILE" ]]; then
  echo "ERROR: topics file not found: $TOPICS_FILE" >&2
  exit 1
fi

STAMP="$(date +%Y%m%d_%H%M)"
JOB="$PROJECT_DIR/jobs/${STAMP}_${COUNT}scenes_topics"

node packages/core/dist/cli.js init "$JOB" >/dev/null

node - <<'NODE' "$JOB" "$TOPICS_FILE" "$COUNT" "$DURATION"
const fs = require("fs");
const path = require("path");

const job = process.argv[2];
const topicsFile = process.argv[3];
const count = Number(process.argv[4] || 30);
const duration = Number(process.argv[5] || 10);

const specPath = path.join(job, "spec.json");
const metaPath = path.join(job, "meta.json");

const raw = fs.readFileSync(topicsFile, "utf8");
let topics = raw
  .split(/\r?\n/)
  .map(s => s.trim())
  .filter(Boolean);

if (Number.isFinite(count) && count > 0) topics = topics.slice(0, count);

const FONT = "../../assets/fonts/NotoSansKR-Regular.ttf";

const mkScene = (i, text, total) => {
  const id = `s${String(i).padStart(2,"0")}`;
  const idx = String(i).padStart(2,"0");
  return {
    id,
    duration,
    background: { type:"color", value:(i%2 ? "#0B1020" : "#111827") },
    layers: [
      { type:"text", content:`SCENE ${idx}`, style:{ font: FONT, size:72, color:"#FFFFFF" }, position:{ x:"center", y:320 } },
      { type:"text", content:text, style:{ font: FONT, size:44, color:"#FFFFFF" }, position:{ x:"center", y:560 } },
      { type:"text", content:`(10초 씬) ${idx}/${total}`, style:{ font: FONT, size:28, color:"#D1D5DB" }, position:{ x:"center", y:940 } }
    ],
    transition: { type:"crossfade", duration:0.5 }
  };
};

const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
spec.title = `Topics → ${topics.length} Scenes`;
spec.audio = { tracks: [] };
spec.subtitles = [];
spec.thumbnail = { enabled:true, source:{ type:"scene", sceneId:"s01", timestamp:2 } };
spec.scenes = topics.map((t, k) => mkScene(k+1, t, topics.length));

fs.writeFileSync(specPath, JSON.stringify(spec, null, 2) + "\n");

const meta = {
  title: spec.title,
  description: "Auto-generated from topics.txt",
  tags: ["yt-auto","topics"]
};
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");

console.log("JOB=" + job);
console.log("SCENES=" + topics.length);
NODE

node packages/core/dist/cli.js render "$JOB" >/dev/null

echo "DONE=$JOB"
ls -lh "$JOB/spec.json" "$JOB/meta.json" "$JOB/render.mp4" "$JOB/thumb.png"
