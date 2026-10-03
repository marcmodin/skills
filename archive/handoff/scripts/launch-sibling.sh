#!/usr/bin/env bash
# Spawn a sibling Claude Code session in a new cmux pane and send the launch command.
#
# Usage:
#   launch-sibling.sh <placement> <parent_session_id> <focus> <task>
#
# <placement> ∈ {right, down, tab}
#
# Contract: invoked with pwd == project root (the Bash tool's cwd in Claude Code is
# the workspace root regardless of where this script lives).
#
# Exit codes:
#   0   success — prints "OK surface:<N>" on stdout
#   2   cmux identify failed or surface_ref unparseable
#   3   new-split/new-workspace failed or no surface:<N> token in stdout
#   4   cmux send failed
#   64  bad arguments

set -euo pipefail

if [[ $# -ne 4 ]]; then
  echo "usage: $0 <right|down|tab> <parent_session_id> <focus> <task>" >&2
  exit 64
fi

placement="$1"
parent="$2"
focus="$3"
task="$4"
project_dir="$(pwd)"

identify_json="$(cmux identify 2>/dev/null)" || {
  echo "cmux identify failed" >&2
  exit 2
}
current_surface="$(printf '%s' "$identify_json" | grep -oE 'surface:[0-9]+' | head -n1)"
if [[ -z "$current_surface" ]]; then
  echo "could not parse caller.surface_ref from cmux identify output" >&2
  exit 2
fi

case "$placement" in
  right) split_out="$(cmux new-split right --surface "$current_surface")" || exit 3 ;;
  down)  split_out="$(cmux new-split down  --surface "$current_surface")" || exit 3 ;;
  tab)   split_out="$(cmux new-workspace)" || exit 3 ;;
  *)     echo "invalid placement: $placement" >&2; exit 64 ;;
esac

new_surface="$(printf '%s' "$split_out" | grep -oE 'surface:[0-9]+' | head -n1)"
if [[ -z "$new_surface" ]]; then
  echo "no surface:<N> token in: $split_out" >&2
  exit 3
fi

# Escape single quotes in focus/task before embedding inside the outer '...' wrapper
# that the spawned claude session receives. Pattern: ' → '\'' (close quote, literal ', reopen).
focus_esc="${focus//\'/\'\\\'\'}"
task_esc="${task//\'/\'\\\'\'}"
payload="CLAUDE_CODE_SKIP_PROMPT_HISTORY=1 claude '/load-handoff $parent $project_dir \"$focus_esc\" \"$task_esc\"'\n"
cmux send --surface "$new_surface" "$payload" >/dev/null || {
  echo "cmux send failed on $new_surface" >&2
  exit 4
}

echo "OK $new_surface"