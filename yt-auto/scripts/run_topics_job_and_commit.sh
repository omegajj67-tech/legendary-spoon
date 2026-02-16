#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-projects/my-channel}"
COUNT="${2:-30}"
DURATION="${3:-10}"
WRAP_CHARS="${4:-18}"
MAX_LINES="${5:-2}"

# 1) job 생성+렌더
./scripts/new_job_from_topics.sh "$PROJECT_DIR" "$COUNT" "$DURATION" "$WRAP_CHARS" "$MAX_LINES"

# 2) 방금 생성된 job 경로 추출
LATEST="$(ls -td "$PROJECT_DIR/jobs/"*"_${COUNT}scenes_topics" 2>/dev/null | head -n 1)"
if [[ -z "${LATEST:-}" ]]; then
  echo "ERROR: latest job not found under $PROJECT_DIR/jobs" >&2
  exit 1
fi

echo "LATEST=$LATEST"

# 3) 결과 열기
open "$LATEST/render.mp4" || true
open "$LATEST/thumb.png" || true

# 4) spec/meta만 커밋/푸시
git add "$LATEST/spec.json" "$LATEST/meta.json"
git commit -m "chore(job): add $(basename "$LATEST") spec/meta (topics)" || {
  echo "SKIP: nothing to commit"
  exit 0
}
git push
git status -sb
