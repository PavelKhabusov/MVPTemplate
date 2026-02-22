#!/bin/bash
# Ralph Loop — autonomous Claude Code iteration script
# Usage: bash scripts/ralph.sh "Your task description here" [max_iterations]
# Example: bash scripts/ralph.sh "Add dark mode to the settings page" 5

set -euo pipefail

PROMPT="${1:?Usage: bash scripts/ralph.sh \"task\" [max_iterations]}"
MAX_ITERATIONS="${2:-10}"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_FILE="$PROJECT_DIR/.claude/ralph.log"
DONE_MARKER="$PROJECT_DIR/.claude/ralph-done"

cd "$PROJECT_DIR"

# Clean up from previous runs
rm -f "$DONE_MARKER"
: > "$LOG_FILE"

log() {
  local msg="[$(date '+%H:%M:%S')] $1"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

# Git auto-commit between iterations
commit_progress() {
  git add -A 2>/dev/null || true
  if ! git diff --cached --quiet 2>/dev/null; then
    git commit -m "ralph: iteration $1 — $(date '+%H:%M:%S')" --no-verify 2>/dev/null || true
    git push -u origin "$(git rev-parse --abbrev-ref HEAD)" --no-verify 2>/dev/null || true
    log "Committed iteration $1 changes"
  else
    log "No changes in iteration $1"
  fi
}

RALPH_SYSTEM_PROMPT="You are in an autonomous Ralph Loop. This is iteration ITER of MAX_ITER.

CRITICAL RULES:
- Do NOT say you are done unless ALL acceptance criteria are fully met
- Do NOT skip steps or take shortcuts
- After making changes, VERIFY them (read files, run checks)
- If something is broken, fix it before moving on
- If you finish early, look for improvements, edge cases, or missing tests
- Write to .claude/ralph-done with a summary ONLY when truly complete

The task will be re-evaluated after your response. Keep working until everything is solid."

SESSION_ID=""

log "=== Ralph Loop Started ==="
log "Task: $PROMPT"
log "Max iterations: $MAX_ITERATIONS"
log ""

for ((i=1; i<=MAX_ITERATIONS; i++)); do
  log "--- Iteration $i/$MAX_ITERATIONS ---"

  # Build system prompt with current iteration number
  ITER_PROMPT="${RALPH_SYSTEM_PROMPT//ITER/$i}"
  ITER_PROMPT="${ITER_PROMPT//MAX_ITER/$MAX_ITERATIONS}"

  # Build claude command
  CLAUDE_ARGS=(
    -p "$PROMPT"
    --output-format json
    --max-turns 30
    --append-system-prompt "$ITER_PROMPT"
    --allowedTools "Read,Write,Edit,Glob,Grep,Bash,NotebookEdit,TodoWrite,WebFetch,WebSearch"
  )

  # Resume session from iteration 2+
  if [[ -n "$SESSION_ID" ]]; then
    CLAUDE_ARGS+=(--resume "$SESSION_ID")
  fi

  # Run Claude
  RESULT=$(claude "${CLAUDE_ARGS[@]}" 2>>"$LOG_FILE" || echo '{"session_id":"","result":"error"}')

  # Extract session ID for next iteration
  NEW_SESSION_ID=$(echo "$RESULT" | jq -r '.session_id // empty' 2>/dev/null || true)
  if [[ -n "$NEW_SESSION_ID" ]]; then
    SESSION_ID="$NEW_SESSION_ID"
  fi

  # Log result summary
  RESULT_TEXT=$(echo "$RESULT" | jq -r '.result // "no output"' 2>/dev/null || echo "parse error")
  COST=$(echo "$RESULT" | jq -r '.cost_usd // "?"' 2>/dev/null || echo "?")
  log "Cost: \$$COST"
  log "Output: ${RESULT_TEXT:0:200}..."

  # Commit changes between iterations
  commit_progress "$i"

  # Check if done
  if [[ -f "$DONE_MARKER" ]]; then
    log ""
    log "=== Task Complete (iteration $i) ==="
    log "Summary:"
    cat "$DONE_MARKER" | tee -a "$LOG_FILE"
    rm -f "$DONE_MARKER"
    exit 0
  fi

  log ""
done

log "=== Max iterations ($MAX_ITERATIONS) reached ==="
log "Task may not be fully complete. Check the results and re-run if needed."
exit 1
