#!/usr/bin/env bash
set -euo pipefail

# Converts VeriPoC's four tracking issues into native GitHub Milestones.
# Requires local GitHub CLI authentication: gh auth login
REPO="${REPO:-huydo2105/veripoc}"
if ! command -v gh >/dev/null 2>&1; then
  echo "Install GitHub CLI first: https://cli.github.com/" >&2
  exit 1
fi
gh auth status >/dev/null

create_or_find() {
  local title="$1" due="$2" description="$3"
  local num
  num="$(gh api "repos/$REPO/milestones?state=all&per_page=100" --jq ".[] | select(.title == \"$title\") | .number" | head -n1)"
  if [[ -z "$num" ]]; then
    num="$(gh api "repos/$REPO/milestones" --method POST \
      -f title="$title" -f description="$description" -f due_on="$due" --jq '.number')"
    echo "Created milestone: $title (#$num)" >&2
  else
    echo "Existing milestone: $title (#$num)" >&2
  fi
  printf '%s' "$num"
}

assign() {
  local number="$1"; shift
  for issue in "$@"; do
    gh api "repos/$REPO/issues/$issue" --method PATCH -F milestone="$number" --silent
    echo "Assigned #$issue to milestone #$number"
  done
}

m1="$(create_or_find "M1 — Identity & Analysis Foundation" "2026-11-15T22:59:00Z" "Nov 10–15; tracking issue #24; agent identity, Foundry, Slither and initial fixtures.")"
m2="$(create_or_find "M2 — Verified PoC & Checkpoint 1" "2026-11-22T23:59:00Z" "Nov 16–22; tracking issue #25; isolated runner, receipt, API, UI, authenticated requests and checkpoint.")"
m3="$(create_or_find "M3 — Concordium & Agent Integrations" "2026-11-29T22:59:00Z" "Nov 23–29; tracking issue #26; audit anchors, Testnet escrow, MCP, fuzzing, LLM enhancements.")"
m4="$(create_or_find "M4 — Demo & Final Submission" "2026-12-09T23:59:00Z" "Nov 30–Dec 9; tracking issue #27; final end-to-end demo and optional stretch integrations.")"

assign "$m1" 20 2 1 3 4
assign "$m2" 5 6 7 8 12 9
assign "$m3" 10 11 13 14 15
assign "$m4" 16 17 18 19

printf '\nNative GitHub milestones configured. View: https://github.com/%s/milestones\n' "$REPO"
