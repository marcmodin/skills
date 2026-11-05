#!/usr/bin/env bash
# Export a .drawio file in docs/diagrams to docs/assets/<name>.png with the
# draw.io desktop app, at 2x scale with a 10 px border.
#
# Usage: export.sh docs/diagrams/<name>.drawio [output.png]
set -euo pipefail

src="${1:?usage: export.sh docs/diagrams/<name>.drawio [output.png]}"
name="$(basename "${src%.drawio}")"
out="${2:-docs/assets/${name}.png}"

drawio="${DRAWIO:-}"
if [[ -z "$drawio" ]]; then
  for candidate in \
    /Applications/draw.io.app/Contents/MacOS/draw.io \
    "$(command -v drawio 2>/dev/null || true)" \
    "$(command -v draw.io 2>/dev/null || true)"; do
    if [[ -n "$candidate" && -x "$candidate" ]]; then
      drawio="$candidate"
      break
    fi
  done
fi
if [[ -z "$drawio" ]]; then
  echo "draw.io not found. Install the desktop app or set DRAWIO to its binary." >&2
  exit 1
fi

"$drawio" --export --format png --scale 2 --border 10 --output "$out" "$src" 2>&1 \
  | grep -v -i -E 'warn|electron|gpu' || true

if [[ ! -s "$out" ]]; then
  echo "Export failed: $out was not written." >&2
  exit 1
fi
echo "$out"
