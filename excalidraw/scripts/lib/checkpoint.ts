import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

// After bundling with --splitting, import.meta.url resolves to scripts/out/index.js,
// so go one level up to scripts/ where .checkpoints/ lives.
const __dirname = dirname(fileURLToPath(import.meta.url));
const CHECKPOINT_DIR = join(__dirname, "..", ".checkpoints");
const STATE_FILE = join(CHECKPOINT_DIR, "state.json");
const PSEUDO_TYPES = new Set(["restoreCheckpoint", "delete"]);
const MAX_HISTORY = 3;

interface State {
  current: string | null;
  history: string[];
}

// Ensure checkpoint directory exists once at module load
mkdirSync(CHECKPOINT_DIR, { recursive: true });

// --- State management ---

function loadState(): State {
  if (existsSync(STATE_FILE)) {
    try {
      return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
    } catch { /* fall through to migration */ }
  }
  return migrateState();
}

function saveState(state: State): void {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function migrateState(): State {
  const files = readdirSync(CHECKPOINT_DIR)
    .filter((f) => f.endsWith(".json") && f !== "state.json")
    .map((f) => ({
      id: f.replace(".json", ""),
      mtime: statSync(join(CHECKPOINT_DIR, f)).mtimeMs,
    }))
    .sort((a, b) => a.mtime - b.mtime);

  if (files.length === 0) return { current: null, history: [] };

  const keep = files.slice(-MAX_HISTORY);
  const remove = files.slice(0, -MAX_HISTORY);
  for (const f of remove) {
    try { unlinkSync(join(CHECKPOINT_DIR, `${f.id}.json`)); } catch {}
  }

  const history = keep.map((f) => f.id);
  const state: State = { current: history[history.length - 1], history };
  saveState(state);
  return state;
}

// --- Checkpoint store ---

export function saveCheckpoint(elements: Record<string, unknown>[]): string {
  const id = randomUUID().slice(0, 18);
  writeFileSync(
    join(CHECKPOINT_DIR, `${id}.json`),
    JSON.stringify({ elements }),
  );

  const state = loadState();
  state.history.push(id);
  state.current = id;

  while (state.history.length > MAX_HISTORY) {
    const old = state.history.shift()!;
    try { unlinkSync(join(CHECKPOINT_DIR, `${old}.json`)); } catch {}
  }

  saveState(state);
  return id;
}

export function loadCheckpoint(id: string): Record<string, unknown>[] | null {
  const filepath = join(CHECKPOINT_DIR, `${id}.json`);
  if (!existsSync(filepath)) return null;
  try {
    const data = JSON.parse(readFileSync(filepath, "utf-8"));
    return data.elements ?? null;
  } catch {
    return null;
  }
}

export function getStatus() {
  const state = loadState();
  const elements = state.current ? loadCheckpoint(state.current) : null;
  const h = state.history;
  return {
    current: state.current,
    elementCount: elements?.length ?? 0,
    versions: h.map((id, i) => ({
      id,
      label: i === h.length - 1 ? "latest" : i === h.length - 2 ? "previous" : "oldest",
    })),
  };
}

export function resetCheckpoints(): void {
  const files = readdirSync(CHECKPOINT_DIR).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    try { unlinkSync(join(CHECKPOINT_DIR, f)); } catch {}
  }
  // Write empty state so loadState() doesn't re-scan
  saveState({ current: null, history: [] });
}

export function resolveCheckpoint(
  rawElements: Record<string, unknown>[],
): Record<string, unknown>[] {
  const restoreEl = rawElements.find((el) => el.type === "restoreCheckpoint");

  const deleteIds = new Set<string>();
  for (const el of rawElements) {
    if (el.type === "delete") {
      for (const id of String(el.ids ?? el.id ?? "").split(",")) {
        const trimmed = id.trim();
        if (trimmed) deleteIds.add(trimmed);
      }
    }
  }

  const newElements = rawElements.filter((el) => !PSEUDO_TYPES.has(el.type as string));

  // Always auto-restore from current checkpoint (if one exists)
  let checkpointId: string | null = null;
  if (restoreEl) {
    checkpointId = restoreEl.id as string;
  } else {
    checkpointId = loadState().current;
  }

  if (!checkpointId) return newElements;

  const base = loadCheckpoint(checkpointId);
  if (!base) {
    console.error(`Warning: checkpoint "${checkpointId}" not found, creating from scratch`);
    return newElements;
  }

  const filtered = base.filter(
    (el) =>
      !deleteIds.has(el.id as string) &&
      !deleteIds.has(el.containerId as string),
  );

  return [...filtered, ...newElements];
}