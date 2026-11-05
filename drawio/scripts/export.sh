#!/usr/bin/env bash
# Export a .drawio file to PNG with the draw.io desktop app, at 2x scale with
# a 10 px border. The PNG goes next to the source unless an output is given.
#
# Usage: export.sh <name>.drawio [output.png]
set -euo pipefail

src="${1:?usage: export.sh <name>.drawio [output.png]}"
out="${2:-${src%.drawio}.png}"

# draw.io exports a blank image for broken XML, so check it first.
if command -v xmllint >/dev/null; then
  xmllint --noout "$src"
fi

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

mkdir -p "$(dirname "$out")"
rm -f "$out"
"$drawio" --export --format png --scale 2 --border 10 --output "$out" "$src" 2>&1 \
  | grep -v -i -E 'warn|electron|gpu' || true

if [[ ! -s "$out" ]]; then
  echo "Export failed: $out was not written." >&2
  exit 1
fi
echo "$out"
