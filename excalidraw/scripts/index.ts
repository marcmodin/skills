#!/usr/bin/env node
import { getStatus, loadCheckpoint, resetCheckpoints, resolveCheckpoint, saveCheckpoint } from "./lib/checkpoint";
import { deflateSync } from "node:zlib";
import { execSync } from "node:child_process";

const subcommand = process.argv[2];

if (!subcommand || !["create", "status", "reset", "inspect"].includes(subcommand)) {
  console.error("Usage:");
  console.error('  node index.js create \'<json>\'      # Create diagram from elements JSON');
  console.error("  node index.js status              # Show current checkpoint state");
  console.error("  node index.js inspect [id]        # Inspect checkpoint elements (default: latest)");
  console.error("  node index.js reset               # Clear all checkpoints (start fresh)");
  process.exit(1);
}

if (subcommand === "reset") {
  resetCheckpoints();
  console.log("Checkpoints cleared. Next create will start a fresh diagram.");
  process.exit(0);
}

if (subcommand === "status") {
  console.log(JSON.stringify(getStatus(), null, 2));
  process.exit(0);
}

if (subcommand === "inspect") {
  const status = getStatus();
  const targetId = process.argv[3] ?? status.current;
  if (!targetId) {
    console.error("No checkpoint found. Create a diagram first.");
    process.exit(1);
  }

  const elements = loadCheckpoint(targetId);
  if (!elements) {
    console.error(`Checkpoint "${targetId}" not found.`);
    process.exit(1);
  }

  const shapes: Record<string, unknown>[] = [];
  const arrows: Record<string, unknown>[] = [];
  const texts: Record<string, unknown>[] = [];

  for (const el of elements) {
    const type = el.type as string;
    if (type === "arrow") {
      const pts = el.points as number[][] ?? [];
      const last = pts[pts.length - 1] ?? [0, 0];
      arrows.push({
        id: el.id,
        x: el.x,
        y: el.y,
        dx: last[0],
        dy: last[1],
        points: pts.length,
        elbowed: (el as any).elbowed ?? false,
        strokeStyle: el.strokeStyle ?? "solid",
        start: (el.startBinding as any)?.elementId ?? null,
        end: (el.endBinding as any)?.elementId ?? null,
        label: (el as any).boundElements?.find((b: any) => b.type === "text")?.id ?? null,
      });
    } else if (type === "text") {
      texts.push({
        id: el.id,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        containerId: el.containerId ?? null,
        text: String(el.text ?? "").slice(0, 60),
      });
    } else if (["rectangle", "ellipse", "diamond"].includes(type)) {
      shapes.push({
        id: el.id,
        type,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        right: (el.x as number) + (el.width as number),
        bottom: (el.y as number) + (el.height as number),
      });
    }
  }

  console.log(JSON.stringify({
    checkpointId: targetId,
    summary: { shapes: shapes.length, arrows: arrows.length, texts: texts.length, total: elements.length },
    shapes,
    arrows,
    texts,
  }, null, 2));
  process.exit(0);
}

// --- Validation ---

const PSEUDO_TYPES = new Set(["delete", "restoreCheckpoint", "cameraUpdate"]);

function hexToLuminance(hex: string): number {
  const h = hex.replace("#", "");
  if (h.length < 6) return -1;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function isDark(hex: string): boolean {
  return hexToLuminance(hex) < 0.2;
}

function isLight(hex: string): boolean {
  return hexToLuminance(hex) > 0.6;
}

function validateElements(raw: unknown): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(raw)) {
    errors.push("Expected a JSON array of elements, got " + typeof raw);
    return { errors, warnings };
  }

  const seenIds = new Set<string>();

  for (let i = 0; i < raw.length; i++) {
    const el = raw[i] as Record<string, unknown>;
    const type = el.type as string | undefined;
    const id = el.id as string | undefined;
    const prefix = `Element [${i}]${id ? ` (${id})` : ""}`;

    if (type && PSEUDO_TYPES.has(type)) continue;

    // Required fields
    if (!type) errors.push(`${prefix}: missing "type"`);
    if (!id) {
      errors.push(`${prefix}: missing "id"`);
    } else if (seenIds.has(id)) {
      errors.push(`${prefix}: duplicate id "${id}"`);
    } else {
      seenIds.add(id);
    }

    if (type !== "text") {
      for (const field of ["x", "y", "width", "height"]) {
        if (el[field] == null) errors.push(`${prefix}: missing "${field}"`);
      }
    } else {
      for (const field of ["x", "y"]) {
        if (el[field] == null) errors.push(`${prefix}: missing "${field}"`);
      }
    }

    // Font size warning
    const fontSize = (el.fontSize as number) ?? (el.label as any)?.fontSize;
    if (typeof fontSize === "number" && fontSize < 16) {
      warnings.push(`${prefix}: fontSize ${fontSize} is below 16 — text may be invisible`);
    }

    // Contrast warnings
    const strokeColor = el.strokeColor as string | undefined;
    const bgColor = el.backgroundColor as string | undefined;

    if (type === "text" && strokeColor) {
      // Free-floating text on white canvas
      if (!el.containerId && isLight(strokeColor)) {
        warnings.push(`${prefix}: light strokeColor "${strokeColor}" on white canvas — text will be invisible`);
      }
    }

    if (strokeColor && bgColor && bgColor !== "transparent") {
      if (isDark(strokeColor) && isDark(bgColor)) {
        warnings.push(`${prefix}: dark text "${strokeColor}" on dark background "${bgColor}" — poor contrast`);
      }
      if (isLight(strokeColor) && isLight(bgColor)) {
        warnings.push(`${prefix}: light text "${strokeColor}" on light background "${bgColor}" — poor contrast`);
      }
    }

    // Label contrast warning
    const label = el.label as { strokeColor?: string; fontSize?: number } | undefined;
    if (label && bgColor && bgColor !== "transparent") {
      const labelColor = label.strokeColor ?? "#1e1e1e";
      if (isDark(labelColor) && isDark(bgColor)) {
        warnings.push(`${prefix}: dark label text "${labelColor}" on dark background "${bgColor}" — poor contrast`);
      }
    }
  }

  return { errors, warnings };
}

// --- Label expansion ---

/** Expand `label` shorthand on shapes/arrows into bound text elements.
 *  Produces the same structure as Excalidraw's convertToExcalidrawElements. */
function convertLabels(elements: Record<string, unknown>[]): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const el of elements) {
    const label = el.label as { text?: string; fontSize?: number; [k: string]: unknown } | undefined;
    if (!label?.text) {
      out.push(el);
      continue;
    }

    const containerId = el.id as string;
    const textId = `${containerId}_label`;
    const fontSize = (label.fontSize as number) ?? 20;
    const text = label.text as string;

    // Estimate text dimensions (no font metrics in Node)
    const lines = text.split("\n");
    const textWidth = Math.round(Math.max(...lines.map(l => l.length)) * fontSize * 0.6);
    const textHeight = Math.round(lines.length * fontSize * 1.35);

    // Center text inside the container
    const cx = (el.x as number) + ((el.width as number) - textWidth) / 2;
    const cy = (el.y as number) + ((el.height as number) - textHeight) / 2;

    // Shape with boundElements (remove label shorthand)
    const { label: _, ...shape } = el;
    out.push({
      ...shape,
      boundElements: [
        ...((shape.boundElements as any[]) ?? []),
        { id: textId, type: "text" },
      ],
    });

    // Bound text element
    out.push({
      type: "text",
      id: textId,
      x: cx,
      y: cy,
      width: textWidth,
      height: textHeight,
      text,
      fontSize,
      fontFamily: 1,
      strokeColor: (label.strokeColor as string) ?? "#1e1e1e",
      textAlign: (label.textAlign as string) ?? "center",
      verticalAlign: (label.verticalAlign as string) ?? "middle",
      containerId,
    });
  }
  return out;
}

// --- Create handler ---

if (subcommand === "create") {
  let elementsJson = process.argv[3];

  // Support reading from stdin when arg is "-"
  if (elementsJson === "-") {
    elementsJson = await new Promise<string>((resolve) => {
      let data = "";
      process.stdin.setEncoding("utf-8");
      process.stdin.on("data", (chunk: string) => (data += chunk));
      process.stdin.on("end", () => resolve(data.trim()));
      process.stdin.resume();
    });
  }

  if (!elementsJson) {
    console.error("Error: elements JSON argument required");
    process.exit(1);
  }

  // Sanitize control characters that sneak into JSON string values
  // when the model's output wraps long lines inside the heredoc.
  elementsJson = elementsJson.replace(/[\x00-\x1f\x7f]/g, (ch) => {
    if (ch === "\n" || ch === "\r" || ch === "\t") return " ";
    return "";
  });

  let rawElements: Record<string, unknown>[];
  try {
    rawElements = JSON.parse(elementsJson);
  } catch (e) {
    const preview = elementsJson.slice(0, 200);
    console.error(`Error: invalid JSON — ${(e as Error).message}\nInput preview: ${preview}`);
    process.exit(1);
  }

  // Validate elements before processing
  const { errors, warnings } = validateElements(rawElements);
  if (warnings.length > 0) {
    console.error(`⚠ Validation warnings:\n  ${warnings.join("\n  ")}`);
  }
  if (errors.length > 0) {
    console.error(`✗ Validation errors:\n  ${errors.join("\n  ")}`);
    process.exit(1);
  }

  // Resolve restoreCheckpoint + delete pseudo-elements
  const elements = resolveCheckpoint(rawElements);

  // Expand label shorthand into bound text elements
  const expanded = convertLabels(elements);

  // Auto-compute width/height for standalone text elements missing them
  for (const el of expanded) {
    if (el.type === "text" && el.width == null && !el.containerId) {
      const lines = String(el.text ?? "").split("\n");
      const fs = (el.fontSize as number) ?? 20;
      el.width = Math.round(Math.max(...lines.map((l: string) => l.length)) * fs * 0.6);
      el.height = Math.round(lines.length * fs * 1.35);
    }
  }

  // Apply hand-drawn style defaults
  const styledElements = expanded.map((el) => ({
    roughness: 2,
    ...(el.type === "text" || (el as any).text != null
      ? { fontFamily: 1 }
      : {}),
    ...el,
  }));

  // Build .excalidraw JSON format
  const excalidrawJson = JSON.stringify({
    type: "excalidraw",
    version: 2,
    source: "https://excalidraw.com",
    elements: styledElements,
    appState: {
      viewBackgroundColor: "#ffffff",
      gridSize: null,
    },
    files: {},
  });

  // Save checkpoint locally
  const checkpointId = saveCheckpoint(styledElements);

  // Upload to excalidraw.com
  let url: string;
  try {
    url = await uploadToExcalidraw(excalidrawJson);
  } catch (e) {
    console.error(`Upload failed: ${(e as Error).message}`);
    console.error(`Checkpoint saved as "${checkpointId}" — you can retry.`);
    process.exit(1);
  }

  console.log(JSON.stringify({ url, checkpointId }, null, 2));

  // Always open in browser (each upload creates a new URL)
  try {
    execSync(`open "${url}"`);
  } catch {
    console.error("Could not auto-open browser. Visit the URL above.");
  }
}

// --- Excalidraw v2 binary upload format ---

function concatBuffers(...bufs: Uint8Array[]): Uint8Array {
  let total = 4;
  for (const b of bufs) total += 4 + b.length;
  const out = new Uint8Array(total);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, 1);
  let off = 4;
  for (const b of bufs) {
    dv.setUint32(off, b.length);
    off += 4;
    out.set(b, off);
    off += b.length;
  }
  return out;
}

async function uploadToExcalidraw(json: string): Promise<string> {
  const te = new TextEncoder();

  const fileMetadata = te.encode(JSON.stringify({}));
  const dataBytes = te.encode(json);
  const innerPayload = concatBuffers(fileMetadata, dataBytes);

  const compressed = deflateSync(Buffer.from(innerPayload));

  const cryptoKey = await globalThis.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 128 },
    true,
    ["encrypt"],
  );
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await globalThis.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    compressed,
  );

  const encodingMeta = te.encode(JSON.stringify({
    version: 2,
    compression: "pako@1",
    encryption: "AES-GCM",
  }));

  const payload = Buffer.from(concatBuffers(encodingMeta, iv, new Uint8Array(encrypted)));

  const res = await fetch("https://json.excalidraw.com/api/v2/post/", {
    method: "POST",
    body: payload,
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${body ? `: ${body.slice(0, 200)}` : ""}`);
  }
  const { id } = (await res.json()) as { id: string };

  const jwk = await globalThis.crypto.subtle.exportKey("jwk", cryptoKey);
  return `https://excalidraw.com/#json=${id},${jwk.k}`;
}