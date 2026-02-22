#!/bin/bash
# Ralph wrapper with voice notification on completion (macOS)
# Usage: bash scripts/ralph.sh [ralph flags...]
# Example: bash scripts/ralph.sh --live
#          bash scripts/ralph.sh --verbose

set -euo pipefail

export PATH="$HOME/.local/bin:$PATH"

# Run ralph with all passed arguments
ralph "$@"
EXIT_CODE=$?

# Voice notification on completion
if [[ "$EXIT_CODE" -eq 0 ]]; then
  say "Ralph finished successfully" &
  osascript -e 'display notification "All tasks completed" with title "Ralph" sound name "Glass"' 2>/dev/null || true
else
  say "Ralph stopped with errors" &
  osascript -e 'display notification "Stopped with exit code '"$EXIT_CODE"'" with title "Ralph" sound name "Basso"' 2>/dev/null || true
fi

exit $EXIT_CODE
