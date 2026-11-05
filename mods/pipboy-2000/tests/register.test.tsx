import { expect, test } from 'claude-code/testing'

import { alerts, duration, fit, fullIn, line, modelName, plain, segments } from '../hooks/register'

const NOW = Date.parse('2026-11-05T12:00:00Z')
const iso = (ms: number) => new Date(NOW + ms).toISOString()

const snap = (over = {}) => ({
  model: 'claude-opus-5-5',
  effort: 'high',
  usage: {
    startedAt: NOW,
    context: { tokens: 68000, window: 200000, percent: 34 },
    rateLimits: [
      // 75% used with 56% of the window gone: ahead of pace.
      { kind: 'five_hour', percentUsed: 75.4, resetsAt: iso(7_980_000) },
      { kind: 'seven_day', percentUsed: 18, resetsAt: iso(300_000_000) },
    ],
  },
  cacheExpiresAt: NOW + 2_820_000,
  compactWindow: null,
  fullIn: {} as Record<string, number>,
  branch: 'main',
  cwd: '/code/skills/mods',
  root: '/code/skills',
  ...over,
})

test('formats durations and model ids', async () => {
  expect(duration(7_980_000)).toBe('2h13m')
  expect(duration(300_000_000)).toBe('3d11h')
  expect(duration(45_000)).toBe('45s')
  expect(modelName('claude-opus-5-5')).toBe('Opus 5.5')
  expect(modelName('Opus 5.5')).toBe('Opus 5.5')
})

test('builds the line, coloring usage ahead of pace', async () => {
  const parts = segments(snap(), NOW)
  expect(line(parts)).toBe(
    'Opus 5.5 (high) · ctx 34% of 200k · 5h 75% ↻2h13m · 7d 18% · cache 47m  \uf418 main · \uf4d3  skills › mods',
  )
  expect(parts[2]?.stage).toBe('warning')
  expect(parts[3]?.stage).toBeUndefined()
})

test('ctx counts against the auto-compact window when set', async () => {
  // 68k of 200k is 34%; of an 80k compact window it's 85%: red.
  const ctx = segments(snap({ compactWindow: 80000 }), NOW)[1]!
  expect(ctx.value).toBe('85%')
  expect(ctx.note).toBe('of 80k')
  expect(ctx.stage).toBe('error')
})

test('shows the 7d reset once the week fills, and a cold cache', async () => {
  const s = snap({ cacheExpiresAt: NOW - 1, cwd: '/code/skills' })
  s.usage.rateLimits[1]!.percentUsed = 81
  const text = segments(s, NOW).map(plain)
  expect(text).toContain('7d 81% ↻3d11h')
  expect(text).toContain('cache cold')
  expect(text.at(-1)).toBe('\uf4d3  skills')
})

test('projects when a window fills from its burn rate', async () => {
  // 10 points in 10 minutes: 50 points left take 50 minutes.
  const samples = [{ at: NOW - 600_000, pct: 40 }, { at: NOW, pct: 50 }]
  expect(fullIn(samples, NOW)).toBe(3_000_000)
  // Too little history, or not climbing: no projection.
  expect(fullIn([{ at: NOW - 60_000, pct: 40 }, { at: NOW, pct: 50 }], NOW)).toBeNull()
  expect(fullIn([{ at: NOW - 600_000, pct: 50 }, { at: NOW, pct: 50 }], NOW)).toBeNull()
})

test('a window that fills before its reset says so and turns red', async () => {
  // 5h resets in 2h13m; at this rate it's full in 20m.
  const five = segments(snap({ fullIn: { five_hour: 1_200_000 } }), NOW)[2]!
  expect(plain(five)).toBe('5h 75% full in 20m ↻2h13m')
  expect(five.stage).toBe('error')
})

test('alerts on crossings and resets, not on the first reading', async () => {
  const base = snap().usage
  const at = (tokens: number, five: number | null) => ({
    ...base,
    context: { ...base.context, tokens },
    rateLimits: five === null ? [] : [{ ...base.rateLimits[0]!, percentUsed: five }],
  })
  expect(alerts(null, at(160_000, 95), 300_000)).toEqual([])
  expect(alerts(at(140_000, 85), at(160_000, 91), 300_000)).toEqual(['Context at 80% of 200k', '5h usage at 91%'])
  expect(alerts(at(160_000, 95), at(160_000, null), 300_000)).toEqual(['5h usage window reset'])
  expect(alerts(at(160_000, 50), at(165_000, 55), 300_000)).toEqual([])
})

test('flags a directory outside the project', async () => {
  const dir = segments(snap({ cwd: '/code/other-repo' }), NOW).at(-1)!
  expect(plain(dir)).toBe('\uf4d3  skills ⚠ other-repo')
  expect(dir.stage).toBe('warning')
  // A sibling whose name starts with the project's is still outside.
  expect(plain(segments(snap({ cwd: '/code/skills-old' }), NOW).at(-1)!)).toBe('\uf4d3  skills ⚠ skills-old')
})

test('a narrow row drops resets, effort, the ctx limit, the directory, then all but model and ctx', async () => {
  const parts = segments(snap(), NOW)
  const at = (columns: number) => line(fit(parts, columns))
  // Each step trims: resets, effort, the ctx limit, the directory, then all but model and ctx.
  expect(at(200)).toBe(line(parts))
  expect(at(90)).toBe('Opus 5.5 (high) · ctx 34% of 200k · 5h 75% · 7d 18% · cache 47m  \uf418 main · \uf4d3  skills › mods')
  expect(at(85)).toBe('Opus 5.5 · ctx 34% of 200k · 5h 75% · 7d 18% · cache 47m  \uf418 main · \uf4d3  skills › mods')
  expect(at(75)).toBe('Opus 5.5 · ctx 34% · 5h 75% · 7d 18% · cache 47m  \uf418 main · \uf4d3  skills › mods')
  expect(at(60)).toBe('Opus 5.5 · ctx 34% · 5h 75% · 7d 18% · cache 47m  \uf418 main')
  expect(at(40)).toBe('Opus 5.5 · ctx 34%')
})

const engine = ($: any, on: any) => {
  on('session.start', (_: any, e: any) => ({ cwd: e.cwd }))
  on('clock.now', () => ({ value: NOW }))
  on('clock.every', () => ({ value: undefined }))
  on('ui.status', () => ({ value: undefined }))
  on('env.get', () => ({ value: undefined }))
  // Stands for the engine's own drawing: its hint line, nothing in the band.
  on('ui.render', ($: any, e: any) => $.ui.resolve(e).Text({ children: [e.props.hint ?? ''] }))
  on('session.model', () => ({ value: 'claude-opus-5-5' }))
  on('session.usage', () => ({ value: snap().usage }))
  on('session.cwd', () => ({ value: '/code/skills' }))
  on('session.root', () => ({ value: '/code/skills' }))
  on('process.run', () => ({ value: { exitCode: 0, stdout: 'main\n', stderr: '', isStdoutTruncated: false } }))
  return $.session.start({ cwd: '/code/skills', surface: 'terminal', isInteractive: true })
}

test('draws the row under the prompt and keeps the hint line', async ($, on) => {
  await engine($, on)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({
      plugin: 'pipboy-2000',
      surface,
      component: 'PromptHint',
      props: { isDraft: false, isWorking: false, hint: '? for shortcuts' },
    } as any)
    expect(await ui.find({ type: 'Text', text: '34%' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'main' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '? for shortcuts' })).toBeDefined()
    await ui.unmount()
  }
})

test('place: above draws in the band instead', { options: { place: 'above' } }, async ($, on) => {
  await engine($, on)

  const ui = await $.ui.mount({
    plugin: 'pipboy-2000',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking: false, maxRows: 3, bodyColumns: 120 },
  } as any)
  expect(await ui.find({ type: 'Text', text: '34%' })).toBeDefined()
  await ui.unmount()
})
