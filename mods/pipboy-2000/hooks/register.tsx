import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionUsage, TextProps, Timer } from 'claude-code'

type Color = NonNullable<TextProps['color']>

// One piece of the line: a label in the segment's own color, a value in the
// text color (or `valueColor`), dim notes after it. `stage` recolors the
// value as a figure climbs: warning, then error. `extra` is the first note
// to go when the row runs out of room; `id` marks what goes after it.
export type Segment = {
  id?: 'model' | 'ctx' | 'dir'
  label?: string
  color?: Color
  value: string
  valueColor?: Color
  bold?: boolean
  note?: string
  extra?: string
  stage?: 'warning' | 'error'
  // Branch and directory: set apart from the figures by a wider gap.
  place?: boolean
}

// The figures the line shows, as `session.measure` hands them over.
export type Usage = Pick<SessionUsage, 'context' | 'rateLimits'>

export type Sample = { at: number; pct: number }

export type Snapshot = {
  model: string
  // The effort the last request asked for; null before one, or on a model without effort.
  effort: string | null
  usage: Usage
  // Per rate-limit kind: ms until the window fills at the recent burn rate.
  fullIn: Record<string, number>
  cacheExpiresAt: number | null
  // CLAUDE_CODE_AUTO_COMPACT_WINDOW, when set: ctx counts against it.
  compactWindow: number | null
  branch: string
  cwd: string
  root: string
}

const lastRequestAt = atom({ plugin: 'pipboy-2000', key: 'lastRequestAt' } as const, null as number | null)
const lastEffort = atom({ plugin: 'pipboy-2000', key: 'effort' } as const, null as string | null)

const WINDOW_SECONDS: Record<string, number> = { five_hour: 18000, seven_day: 604800 }
const LABEL: Record<string, string> = { five_hour: '5h', seven_day: '7d' }
// How far back the burn rate looks, per window.
const SAMPLE_SPAN: Record<string, number> = { five_hour: 30 * 60_000, seven_day: 6 * 3_600_000 }
const BRANCH_ICON = '\uf418' // Nerd Font octicon git-branch
const DIR_ICON = '\uf4d3' // Nerd Font octicon file-directory-fill
// The Geiger counter: while Claude works, the separator dots click green at random.
const PIPBOY_GREEN = '#1aff80'
const CLICK_CHANCE = 0.5

// "2h13m", "47m", "3d4h", "12s"; minutes round up, as a countdown should.
export const duration = (ms: number): string => {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s >= 86400) return `${Math.floor(s / 86400)}d${Math.floor((s % 86400) / 3600)}h`
  if (s >= 3600) return `${Math.floor(s / 3600)}h${Math.floor((s % 3600) / 60)}m`
  if (s >= 60) return `${Math.ceil(s / 60)}m`
  return `${s}s`
}

const kilo = (n: number) => (n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)}M` : `${Math.round(n / 1000)}k`)

// "claude-opus-5-5" -> "Opus 5.5"; a display name passes through.
export const modelName = (id: string): string => {
  const m = /^claude-([a-z]+)-(\d+)(?:-(\d+))?/.exec(id)
  if (!m) return id
  const family = m[1]!.charAt(0).toUpperCase() + m[1]!.slice(1)
  return `${family} ${m[2]}${m[3] ? `.${m[3]}` : ''}`
}

const basename = (path: string) => path.replace(/\/+$/, '').split('/').pop() || path

export const plain = (s: Segment) => [s.label, s.value, s.note, s.extra].filter(Boolean).join(' ')

// A wider gap where the figures end and the places begin, a dot elsewhere.
const gap = (prev: Segment, s: Segment) => (s.place && !prev.place ? '  ' : ' · ')

export const line = (parts: readonly Segment[]) =>
  parts.map((s, i) => (i > 0 ? gap(parts[i - 1]!, s) : '') + plain(s)).join('')

// Drops detail until the row fits: reset times, effort, the ctx limit, the directory,
// and on a really small screen everything but the model and ctx.
const SHRINK: ((parts: Segment[]) => Segment[])[] = [
  parts => parts.map(s => ({ ...s, extra: undefined })),
  parts => parts.map(s => (s.id === 'model' ? { ...s, note: undefined } : s)),
  parts => parts.map(s => (s.id === 'ctx' ? { ...s, note: undefined } : s)),
  parts => parts.filter(s => s.id !== 'dir'),
  parts => parts.filter(s => s.id === 'model' || s.id === 'ctx'),
]

export const fit = (parts: Segment[], columns: number): Segment[] => {
  let out = parts
  for (const shrink of SHRINK) {
    if (line(out).length <= columns) break
    out = shrink(out)
  }
  return out
}

// Against the auto-compact window when one is set, since that's where the
// session compacts; otherwise the model's whole window.
export const ctxShare = (c: Usage['context'], compactWindow: number | null) => {
  const limit = compactWindow ? Math.min(compactWindow, c.window) : c.window
  return { limit, pct: compactWindow ? Math.floor(((c.tokens ?? 0) / limit) * 100) : (c.percent ?? 0) }
}

// When the window fills at the slope of its samples; null while usage isn't
// climbing or the samples span under five minutes.
export const fullIn = (samples: readonly Sample[], now: number): number | null => {
  const first = samples[0]
  const last = samples.at(-1)
  if (!first || !last || last.at - first.at < 5 * 60_000 || last.pct <= first.pct) return null
  const perMs = (last.pct - first.pct) / (last.at - first.at)
  return Math.max(0, (100 - last.pct) / perMs - (now - last.at))
}

// Toasts for a measurement against the last one: ctx crossing 50% or 75%,
// a window crossing 90%, a window resetting. None on the first measurement.
export const alerts = (prev: Usage | null, next: Usage, compactWindow: number | null): string[] => {
  if (!prev) return []
  const out: string[] = []

  const before = ctxShare(prev.context, compactWindow).pct
  const { pct, limit } = ctxShare(next.context, compactWindow)
  if ([50, 75].some(t => before < t && pct >= t)) out.push(`Context at ${pct}% of ${kilo(limit)}`)

  for (const old of prev.rateLimits) {
    const label = LABEL[old.kind]
    if (!label) continue
    const now = next.rateLimits.find(l => l.kind === old.kind)
    if (!now || now.percentUsed < old.percentUsed - 10) out.push(`${label} usage window reset`)
    else if (old.percentUsed < 90 && now.percentUsed >= 90) out.push(`${label} usage at ${Math.floor(now.percentUsed)}%`)
  }

  return out
}

// The cache cools as it nears expiry: warm yellow, muted, pale blue, then blue once cold.
// No orange, which stays for warnings.
export const cacheColor = (left: number): Color =>
  left <= 0 ? '#5f87d7' : left < 300_000 ? '#87afd7' : left < 1_800_000 ? '#afaf87' : '#d7c35f'

export const segments = (snap: Snapshot, now: number): Segment[] => {
  const out: Segment[] = [
    { id: 'model', value: modelName(snap.model), bold: true, note: snap.effort ? `(${snap.effort})` : undefined },
  ]

  const { pct: ctx, limit } = ctxShare(snap.usage.context, snap.compactWindow)
  out.push({
    id: 'ctx',
    label: 'ctx',
    color: 'suggestion',
    value: `${ctx}%`,
    note: `of ${kilo(limit)}`,
    stage: ctx >= 75 ? 'error' : ctx >= 50 ? 'warning' : undefined,
  })

  for (const limit of snap.usage.rateLimits) {
    const window = WINDOW_SECONDS[limit.kind]
    if (!window || !limit.resetsAt) continue
    const left = Date.parse(limit.resetsAt) - now
    const pct = Math.floor(limit.percentUsed)
    // Pace: used share against the share of the window already gone.
    const elapsed = 100 - (left / 1000 / window) * 100
    // At the recent burn rate the window fills before it resets.
    const fill = snap.fullIn[limit.kind]
    const fillsFirst = fill !== undefined && fill < left
    // The 7d reset only matters once the week is filling up.
    const showReset = limit.kind === 'five_hour' || pct >= 70 || fillsFirst
    out.push({
      label: LABEL[limit.kind],
      color: 'permission',
      value: `${pct}%`,
      note: fillsFirst ? `full in ${duration(fill)}` : undefined,
      extra: showReset ? `↻${duration(left)}` : undefined,
      stage:
        pct >= 90 || (fillsFirst && fill < 30 * 60_000)
          ? 'error'
          : fillsFirst || pct > elapsed + 10
            ? 'warning'
            : undefined,
    })
  }

  if (snap.cacheExpiresAt !== null) {
    const left = snap.cacheExpiresAt - now
    out.push({ label: 'cache', color: 'success', value: left <= 0 ? 'cold' : duration(left), valueColor: cacheColor(left) })
  }

  if (snap.branch) out.push({ label: BRANCH_ICON, color: 'merged', value: snap.branch, place: true })

  const here = basename(snap.cwd)
  const project = basename(snap.root)
  // An extra space after the icon, before the project name only.
  const dirLabel = `${DIR_ICON} `
  if (snap.cwd === snap.root) out.push({ id: 'dir', place: true, label: dirLabel, color: 'ide', value: project, valueColor: 'subtle' })
  else if (snap.cwd.startsWith(`${snap.root}/`))
    out.push({ id: 'dir', place: true, label: dirLabel, color: 'ide', value: `${project} › ${here}`, valueColor: 'subtle' })
  // The session left the project: the project, then where it is now.
  else out.push({ id: 'dir', place: true, label: dirLabel, color: 'ide', value: `${project} ⚠ ${here}`, stage: 'warning' })

  return out
}

// The module's own values; a reload starts them over and the next tick refills them.
// shortcut: burn-rate samples live here, so a reload restarts the five-minute warm-up; move to $.state if that bites.
const live = {
  place: 'below',
  ttlMs: 3_600_000,
  snap: null as Snapshot | null,
  usage: null as Usage | null,
  samples: {} as Record<string, Sample[]>,
  lastLine: '',
  branch: '',
  compactWindow: null as number | null,
  timer: undefined as Timer | undefined,
  clicker: undefined as Timer | undefined,
}

function quiet($: EngineInterface) {
  live.clicker?.cancel()
  live.clicker = undefined
  $.ui.invalidate('ui.render')
}

// Adds a reading per window, drops ones past its span, and starts over when the window reset.
function sample(usage: Usage, at: number) {
  for (const l of usage.rateLimits) {
    const span = SAMPLE_SPAN[l.kind]
    if (!span) continue
    const kept = (live.samples[l.kind] ?? []).filter(s => at - s.at <= span && s.pct <= l.percentUsed)
    live.samples[l.kind] = [...kept, { at, pct: l.percentUsed }]
  }
}

async function readBranch($: EngineInterface) {
  const cwd = await $.session.cwd()
  const r = await $.process.run(['git', '-C', cwd, 'branch', '--show-current'], { timeoutMs: 2000 })
  live.branch = r.exitCode === 0 ? r.stdout.trim() : ''
}

async function stamp($: EngineInterface) {
  const now = await $.clock.now()
  await update($, lastRequestAt, () => now)
}

// Usage arrives through session.measure; this reads the rest and redraws when the text changed.
async function tick($: EngineInterface) {
  if (!live.usage) return
  const [model, cwd, root, now, sentAt, effort] = await Promise.all([
    $.session.model(),
    $.session.cwd(),
    $.session.root(),
    $.clock.now(),
    read($, lastRequestAt),
    read($, lastEffort),
  ])
  const fills: Record<string, number> = {}
  for (const [kind, samples] of Object.entries(live.samples)) {
    const ms = fullIn(samples, now)
    if (ms !== null) fills[kind] = ms
  }
  live.snap = {
    model,
    effort,
    usage: live.usage,
    fullIn: fills,
    cwd,
    root,
    branch: live.branch,
    compactWindow: live.compactWindow,
    cacheExpiresAt: sentAt === null ? null : sentAt + live.ttlMs,
  }
  const text = line(segments(live.snap, now))
  if (text === live.lastLine) return
  live.lastLine = text
  $.ui.invalidate('ui.render')
}

// The colored row, one Text per piece.
async function row($: EngineInterface, e: Parameters<EngineInterface['ui']['resolve']>[0], working: boolean, columns?: number) {
  const { Box, Text } = $.ui.resolve(e)
  const all = segments(live.snap!, await $.clock.now())
  // Before the app measures its window there's no width; draw it whole. 4 cells spare for the indent and icons.
  const parts = columns ? fit(all, columns - 4) : all
  const notes = (s: Segment) => [s.note, s.extra].filter(Boolean).join(' ')

  // Each segment is one unshrinkable box, so it never breaks mid-word.
  const piece = (s: Segment, i: number) => (
    <Box key={String(i)} flexShrink={0}>
      <Text>
        {s.label ? <Text color={s.color}>{`${s.label} `}</Text> : ''}
        <Text color={s.stage ?? s.valueColor} bold={s.bold}>
          {s.value}
        </Text>
        {notes(s) ? <Text dimColor>{` ${notes(s)}`}</Text> : ''}
      </Text>
    </Box>
  )
  // Each redraw while working rolls every dot again: a click is a green one.
  const dot = () =>
    working && Math.random() < CLICK_CHANCE ? (
      <Text>
        {' '}
        <Text color={PIPBOY_GREEN} bold>
          •
        </Text>{' '}
      </Text>
    ) : (
      <Text dimColor>{' · '}</Text>
    )
  const group = (list: Segment[]) => (
    <Box flexShrink={0}>{list.flatMap((s, i) => [...(i > 0 ? [dot()] : []), piece(s, i)])}</Box>
  )

  // Figures on the left, branch and directory pushed to the right.
  return (
    <Box width="100%" justifyContent="space-between" columnGap={2} overflow="hidden">
      {group(parts.filter(s => !s.place))}
      {group(parts.filter(s => s.place))}
    </Box>
  )
}

export const register: Register = (on, options) => {
  live.place = options.place === 'above' ? 'above' : 'below'
  live.ttlMs = options.cacheTtl === '5m' ? 300_000 : 3_600_000

  on('session.start', async ($, e, next) => {
    const result = await next(e)
    live.timer?.cancel()
    $.ui.status(undefined) // an earlier version pinned the line here
    const compact = Number(await $.env.get('CLAUDE_CODE_AUTO_COMPACT_WINDOW'))
    live.compactWindow = compact > 0 ? compact : null
    live.usage = await $.session.usage()
    sample(live.usage, await $.clock.now())
    await readBranch($).catch(() => { })
    await tick($)
    // Only the countdowns move between measurements, and they show minutes.
    live.timer = $.clock.every(10_000, () => void tick($).catch(() => { }))
    return result
  })

  on('session.end', async ($, e, next) => {
    live.timer?.cancel()
    live.timer = undefined
    quiet($)
    return next(e)
  })

  // After each turn, and when a plan limit's percent moves: the figures, pushed.
  on('session.measure', async ($, e, next) => {
    const usage: Usage = { context: e.context, rateLimits: [...e.rateLimits] }
    for (const text of alerts(live.usage, usage, live.compactWindow)) $.ui.toast(text)
    live.usage = usage
    sample(usage, await $.clock.now())
    await tick($).catch(() => { })
    return next(e)
  })

  // Each request writes the cache: the one a turn starts with and the one
  // after every tool result. Stamping both keeps the countdown within seconds.
  on('turn.start', async ($, e, next) => {
    await stamp($)
    live.clicker?.cancel()
    live.clicker = $.clock.every(90, () => $.ui.invalidate('ui.render'))
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const result = await next(e)
    await stamp($).catch(() => { })
    return result
  })

  // Each request names its effort: the session's setting or the model's default.
  on('turn.step', async function* ($, e, next) {
    const effort = e.effort === undefined ? null : String(e.effort)
    await update($, lastEffort, () => effort)
    return yield* next(e)
  })

  on('turn.complete', async ($, e, next) => {
    quiet($)
    await readBranch($).catch(() => { })
    await tick($).catch(() => { })
    return next(e)
  })

  // Under the prompt: the engine's own hint line (mode, pills) and the row.
  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => {
    if (live.place !== 'below' || !live.snap) return next(e)
    const { Box } = $.ui.resolve(e)
    const hint = await next(e)

    return (
      <Box flexDirection="column">
        {await row($, e, e.props.isWorking, e.viewport?.columns)}
        {hint}
      </Box>
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (live.place !== 'above' || !live.snap || e.props.hasSurvey) return next(e)
    return row($, e, e.props.isWorking, e.viewport?.columns)
  })
}
