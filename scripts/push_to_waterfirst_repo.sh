#!/usr/bin/env bash
set -euo pipefail

REMOTE_NAME=${REMOTE_NAME:-origin}
REMOTE_URL=${1:-"https://github.com/waterfirst/korean_movie.git"}
BRANCH_NAME=${BRANCH_NAME:-$(git rev-parse --abbrev-ref HEAD)}

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: this script must be run from within a git repository." >&2
  exit 1
fi

if git remote get-url "$REMOTE_NAME" >/dev/null 2>&1; then
  git remote set-url "$REMOTE_NAME" "$REMOTE_URL"
else
  git remote add "$REMOTE_NAME" "$REMOTE_URL"
fi

echo "Pushing branch '$BRANCH_NAME' to $REMOTE_NAME ($REMOTE_URL)"

git push --set-upstream "$REMOTE_NAME" "$BRANCH_NAME"
