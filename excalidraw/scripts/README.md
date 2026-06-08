# xcalidraw script

CLI that validates an Excalidraw elements JSON array, expands label shorthand, encrypts the diagram, uploads it, and opens a shareable link in the browser.

**Key files:**

- `index.ts` — CLI entrypoint, validation, label expansion, encryption + upload
- `lib/checkpoint.ts` — rolling checkpoint state (max 3 versions)
- `out/` — compiled bundle (entry: `out/index.js`)
- `.checkpoints/` — local diagram snapshots for incremental updates

## Encryption & upload pipeline

```
Elements JSON
  → wrap in .excalidraw format
  → pack into v2 binary container (length-prefixed segments)
  → compress with zlib deflate
  → encrypt with AES-GCM (random 128-bit key + 12-byte IV)
  → POST to https://json.excalidraw.com/api/v2/post/ → returns { id }
  → export key as JWK, build URL: https://excalidraw.com/#json={id},{jwk.k}
```

The encryption key lives in the URL fragment (`#`), so it's never sent to the server — only the browser can decrypt the diagram.

## Label conversion

`convertLabels` expands `label` shorthand on shapes into bound `text` elements (same structure as Excalidraw's `convertToExcalidrawElements`). Text dimensions are estimated without font metrics: `width = length × fontSize × 0.6`, `height = fontSize × 1.35`.

## Checkpoints

Every `create` auto-merges new elements with the current checkpoint. Rolling window of 3 versions.

- **Append**: send new elements — they merge with current
- **Delete**: `{"type":"delete","ids":"id1,id2"}`
- **Rollback**: `{"type":"restoreCheckpoint","id":"<id>"}`
- **Inspect/Status/Reset**: `node out/index.js inspect|status|reset`

## Development

```sh
cd plugins/diagrams/skills/excalidraw/scripts
bun install
bun run build
```

### Smoke test

```sh
node out/index.js status

cat <<'EXCALIDRAW_JSON' | node out/index.js create -
[{"type":"rectangle","id":"r1","x":50,"y":50,"width":200,"height":80,"backgroundColor":"#a5d8ff","fillStyle":"solid","roundness":{"type":3},"label":{"text":"Hello","fontSize":20}}]
EXCALIDRAW_JSON
```

Output: `{ "url": "...", "checkpointId": "..." }` and the diagram opens in browser.
