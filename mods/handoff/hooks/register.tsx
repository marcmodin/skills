import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Child, Mode, Picker } from '../types'

type Where = 'pane' | 'tab' | 'bg' | 'copy'

const PANE = 'handoff'
const picker = atom({ plugin: 'handoff', key: 'picker' } as const, {
  task: '',
  mode: 'brief',
  phase: 'pick',
  status: '',
} as Picker)
// The children this session started, drawn in the band above the prompt. Kept in
// $.state so the list outlives a mod reload; `checkedAt` redraws the ages each poll.
const children = atom({ plugin: 'handoff', key: 'children' } as const, [] as Child[])
const checkedAt = atom({ plugin: 'handoff', key: 'checkedAt' } as const, 0)

const POLL_MS = 15_000
const FAILED_MS = 30_000

const BRIEF_PROMPT = `Write a handoff brief for a new Claude Code session that will take over one piece of this conversation's work. The user is splitting work: this session keeps its own thread, the new one gets the task below.

Task from the user: {TASK}

Start your reply with one line \`slug: {2-4 lowercase words joined by hyphens, naming the task}\`, then the brief as markdown, no preamble. Use this template. Drop a section that would be empty. Link files by absolute path instead of copying their content. Never include secrets, tokens or personal data.

# Handoff: {one-line title}

You are a new Claude Code session started from another session. The user is the same. The parent session keeps working on its own thread, so don't touch the files it owns.

## Task
{verb-led task, one or two sentences}

## The split
- Options discussed: {A: one line} / {B: one line}, or "none" when this isn't a split
- The parent is doing: {A}. Don't implement it.
- You are doing: {B}
- Compare on: {criteria the two results will be judged by}

## Context
{3-5 sentences: what the parent was doing and how this task connects}

## Decisions already made
- {decision}: {why}

## Constraints and user feedback
- {rule, quoting the user where possible}

## What was tried
- {approach}: {result, why dropped}

## Files
- \`{absolute path}\`: {why it matters}

## References
- {spec, issue, commit or URL}

## First action
{one concrete step}

## When done
End with: what you built, branch and worktree path, what worked, what didn't, and how it does on the criteria under The split.`

const FORK_PROMPT = `You were forked from another session. That session keeps working on its own thread; don't touch the files it owns. Your task: {TASK}`

const COMPARE_PROMPT = `Use SendMessage to ask the handoff session {NAME} for its result: what it built, the branch and worktree, what worked and what didn't. When its reply arrives, compare it with the work in this session on the criteria from the split.`

let poller: { cancel(): void } | undefined

export const register: Register = on => {
  // The engine may register another name than the one asked for (one an installed
  // skill already takes), so serve the name register returns.
  let commandName = 'handoff'

  on('session.start', async ($, e, next) => {
    const registered = await $.command.register({
      name: 'handoff',
      description: 'Split work to a new Claude Code session (herdr pane, tab or background)',
      argumentHint: '<task>',
    })
    commandName = registered.command

    // A reload drops the module's timers and any launch in flight; pick the
    // running children back up from $.state and drop the rest.
    await update($, picker, s => s.phase === 'working' ? { ...s, phase: 'pick' as const, status: '' } : s)
    await update($, children, list => list.filter(c => c.phase === 'running'))
    poller = undefined
    ensurePolling($)
    return next(e)
  })

  // `/handoff <task>` launches at once with the defaults; bare `/handoff` opens the picker.
  on('command.run', async ($, e, next) => {
    if (e.command !== commandName) return next(e)
    const task = e.args.trim()
    await update($, picker, () => ({ task, mode: 'brief' as Mode, phase: 'pick' as const, status: '' }))
    if (task !== '') {
      const inHerdr = (await $.env.get('HERDR_PANE_ID')) !== undefined
      void launch($, inHerdr ? 'pane' : 'bg')
      return {}
    }
    await $.ui.open({ id: PANE, title: 'Handoff', focus: true, closeOnEscape: true, holdToasts: true, rows: 12 })
    return {}
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const { Box, Text, Button } = ui
    const Input = 'Input' in ui ? ui.Input : undefined
    const p = await read($, picker)
    const inHerdr = (await $.env.get('HERDR_PANE_ID')) !== undefined
    const busy = p.phase === 'working'

    const go = (where: Where) => () => {
      void launch($, where)
    }

    return (
      <Box flexDirection="column" gap={1}>
        {Input && <Input
          key="task"
          label="Task: "
          placeholder="what the new session should do (blank: infer from the conversation)"
          value={p.task}
          onInput={(value: string) => void update($, picker, s => ({ ...s, task: value }))}
          onSubmit={go(inHerdr ? 'pane' : 'bg')}
          submitLabel={inHerdr ? 'new pane' : 'background'}
        />}
        <Box flexDirection="row" gap={2}>
          <Text dimColor>Context:</Text>
          <Button key="mode-brief" plain dimColor={p.mode !== 'brief'}
            onPress={() => void update($, picker, s => ({ ...s, mode: 'brief' as Mode }))}>
            {p.mode === 'brief' ? 'Brief (selected)' : 'Brief'}
          </Button>
          <Button key="mode-fork" plain dimColor={p.mode !== 'fork'}
            onPress={() => void update($, picker, s => ({ ...s, mode: 'fork' as Mode }))}>
            {p.mode === 'fork' ? 'Full fork (selected)' : 'Full fork'}
          </Button>
        </Box>
        {busy ? (
          <Text>{p.status}</Text>
        ) : (
          <Box flexDirection="row" gap={2} flexWrap="wrap">
            {inHerdr && <Button key="pane" variant="primary" autoFocus onPress={go('pane')}>New pane</Button>}
            {inHerdr && <Button key="tab" onPress={go('tab')}>New tab</Button>}
            <Button key="bg" autoFocus={inHerdr ? undefined : true} onPress={go('bg')}>Background</Button>
            <Button key="copy" onPress={go('copy')}>Copy brief</Button>
          </Box>
        )}
        {!busy && p.status !== '' && <Text color={p.phase === 'error' ? 'red' : undefined}>{p.status}</Text>}
        <Text dimColor>Esc cancels</Text>
      </Box>
    )
  })

  // One row per child: launch progress while it starts, then its live state,
  // with jump and compare. Rows leave on their own (the child exits, a failed
  // launch after FAILED_MS), so the band is gone when no child is left.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const kids = await read($, children)
    if (e.props.hasSurvey || kids.length === 0) return next(e)
    await read($, checkedAt)
    const now = await $.clock.now()
    const { Box, Text, Button } = $.ui.resolve(e)

    // Click only, no hotkeys: a band hotkey would take a digit typed into an
    // empty prompt. Plain and dim, underlined under the pointer (plain wins over variant).
    const link = (scope: string) => ({ plain: true as const, dimColor: true, variant: 'primary' as const, hover: { scope, underline: true } })

    return (
      <Box flexDirection="column" borderStyle="round" paddingX={1}>
        {kids.map(c => {
          const isRunning = c.phase === 'running'
          const canCompare = isRunning && (c.state === 'idle' || c.state === 'done')
          const label = c.phase === 'running' ? c.state : c.step
          const color = c.phase === 'failed' ? 'red' : c.state.startsWith('waiting') || c.state === 'blocked' ? 'yellow' : c.state === 'done' ? 'green' : undefined
          const place = c.where === 'bg' ? `background ${c.id ?? ''}` : c.pane ?? ''
          return (
            <Box flexDirection="row" gap={1}>
              <Text color="gray">handoff</Text>
              <Text wrap="truncate-end">{c.name}</Text>
              <Text color={color} wrap="truncate-end">{label}</Text>
              {isRunning && <Text color="gray">{age(now - c.startedAt)} · {place}</Text>}
              {isRunning && <Button key={`jump:${c.key}`} {...link(`jump:${c.key}`)} onPress={() => void jump($, c)}>jump</Button>}
              {canCompare && <Button key={`compare:${c.key}`} {...link(`compare:${c.key}`)} onPress={() => void compare($, c)}>compare</Button>}
            </Box>
          )
        })}
      </Box>
    )
  })
}

async function launch($: EngineInterface, where: Where) {
  const p = await read($, picker)
  if (p.phase === 'working') return
  const isFork = p.mode === 'fork' && where !== 'copy'
  const suffix = randomSuffix()
  // Copy starts no child, so it gets no row; the rest show progress in the band.
  const row = where === 'copy' ? undefined : suffix

  const setStatus = async (status: string, phase: Picker['phase'] = 'working') => {
    await update($, picker, s => ({ ...s, status, phase }))
    if (!row) return
    await patchChild($, row, phase === 'error' ? { phase: 'failed', step: status } : { step: status })
    if (phase === 'error') $.clock.after(FAILED_MS, () => update($, children, list => list.filter(c => c.key !== row)))
  }

  try {
    if (row && where !== 'copy') {
      const child: Child = {
        key: row, name: p.task === '' && !isFork ? 'new handoff' : childName(p.task, suffix), where,
        phase: 'starting', step: 'starting...', state: '', startedAt: await $.clock.now(),
      }
      await update($, children, list => [...list, child])
    }

    const sid = await $.session.id()
    const cwd = await $.session.cwd()
    const task = p.task || 'the alternative the user did not pick, as discussed in this conversation'

    // The brief writer runs while the child starts. A name is needed to start the
    // child, so with no task typed the brief comes first and names it.
    const writeBrief = async () => {
      await setStatus('writing the brief...')
      const r = await $.model.fork({ prompt: BRIEF_PROMPT.replace('{TASK}', task) })
      if (!r.isAnswered) throw new Error(`brief writer failed: ${r.reason}`)
      const m = r.text.trim().match(/^slug:\s*(.*)\n+([\s\S]*)$/)
      const brief = (m ? m[2]! : r.text.trim()) +
        `\n\n## Parent\nSession \`${sid}\`. Its transcript is under ~/.claude/projects; grep it only if this brief leaves a gap.`
      return { slug: m ? m[1]! : '', brief }
    }

    let briefJob: Promise<{ slug: string; brief: string }> | undefined
    let name: string
    if (isFork) {
      name = childName(p.task, suffix)
    } else if (p.task !== '' || where === 'copy') {
      briefJob = writeBrief()
      name = childName(p.task, suffix)
    } else {
      const first = await writeBrief()
      briefJob = Promise.resolve(first)
      name = childName(first.slug, suffix)
    }
    if (row) await patchChild($, row, { name })
    const getPrompt = async () => isFork ? FORK_PROMPT.replace('{TASK}', task) : (await briefJob!).brief

    if (where === 'copy') {
      const copied = await $.ui.copy({ text: await getPrompt() })
      await finish($, copied.isCopied ? 'Brief copied to the clipboard' : `Couldn't copy the brief (${copied.reason})`)
      $.ui.toast(copied.isCopied ? 'Brief copied to the clipboard' : `Couldn't copy the brief (${copied.reason})`)
      return
    }

    if (where === 'bg') {
      const prompt = await getPrompt()
      await setStatus('starting a background session...')
      const argv = isFork
        ? ['claude', '--bg', '--resume', sid, '--fork-session', '--name', name, prompt]
        : ['claude', '--bg', '--name', name, prompt]
      const out = await run($, argv, cwd, 60_000)
      const id = out.match(/backgrounded\s*·\s*(\S+)/)?.[1]
      await patchChild($, row!, { phase: 'running', step: '', state: 'working', id })
      await finish($, `${name} running · ${id ?? '?'}`)
      await noteParent($, `${name} as background session ${id ?? '?'}`, task)
      ensurePolling($)
      return
    }

    const agentArgs = isFork
      ? ['--resume', sid, '--fork-session', '--name', name, '--worktree', name]
      : ['--name', name, '--worktree', name]
    const startChild = async () => {
      const pane = where === 'tab' ? await newTab($, cwd, name) : await newPane($, cwd)
      await patchChild($, row!, { pane })
      await setStatus(`starting Claude Code in ${pane}...`)
      try {
        await run($, ['herdr', 'agent', 'start', name, '--kind', 'claude', '--pane', pane, '--timeout', '90000', '--', ...agentArgs], cwd, 100_000)
      } catch (err) {
        if (String(err).includes('agent_not_ready')) return { pane, isReady: false }
        throw err
      }
      return { pane, isReady: true }
    }

    const [child, prompt] = await Promise.all([startChild(), getPrompt()])
    if (!child.isReady) {
      await $.ui.copy({ text: prompt })
      throw new Error(`Claude Code in ${child.pane} is waiting on a dialog (folder trust?). Answer it there and paste: the ${isFork ? 'task' : 'brief'} is on the clipboard.`)
    }

    await setStatus(`sending the ${isFork ? 'task' : 'brief'}...`)
    try {
      await run($, ['herdr', 'agent', 'prompt', name, prompt], cwd, 60_000)
    } catch (err) {
      // Never resend: the paste may have landed. Check the pane before calling it a failure.
      const seen = await $.process.run(['herdr', 'agent', 'read', name, '--source', 'recent-unwrapped', '--lines', '40'], { cwd })
      if (!seen.stdout.includes((prompt.split('\n')[0] ?? '').slice(0, 40))) throw err
    }

    await patchChild($, row!, { phase: 'running', step: '', state: 'working' })
    await finish($, `${name} running in pane ${child.pane}`)
    await noteParent($, `${name} in herdr pane ${child.pane}`, task)
    ensurePolling($)
  } catch (err) {
    const message = String(err instanceof Error ? err.message : err)
    await setStatus(message, 'error')
    $.ui.toast(`handoff failed: ${message}`)
  }
}

async function finish($: EngineInterface, line: string) {
  await update($, picker, s => ({ ...s, phase: 'done' as const, status: line }))
  if ((await $.ui.panes()).some(pane => pane.id === PANE)) await $.ui.close({ id: PANE })
}

async function patchChild($: EngineInterface, key: string, patch: Partial<Child>) {
  await update($, children, list => list.map(c => c.key === key ? { ...c, ...patch } : c))
}

// One line the parent's model reads and the person doesn't see, so the parent
// knows the child exists without carrying the brief.
async function noteParent($: EngineInterface, where: string, task: string) {
  await $.session.append({
    message: { type: 'user', content: [{ type: 'text', text: `<handoff>The user handed off a task to a new Claude Code session, ${where}: ${task}. Don't work on it here.</handoff>` }] },
  })
}

async function newPane($: EngineInterface, cwd: string, focus = false): Promise<string> {
  const self = (await $.env.get('HERDR_PANE_ID')) ?? ''
  const layout = JSON.parse(await run($, ['herdr', 'pane', 'layout', '--pane', self], cwd))
  const me = layout.result.layout.panes.find((x: { pane_id: string }) => x.pane_id === self)
  const rect = me?.rect ?? layout.result.layout.area
  const direction = rect.width >= 2 * rect.height ? 'right' : 'down'
  const argv = ['herdr', 'pane', 'split', '--current', '--direction', direction, '--cwd', cwd]
  const out = JSON.parse(await run($, focus ? argv : [...argv, '--no-focus'], cwd))
  return out.result.pane.pane_id
}

async function newTab($: EngineInterface, cwd: string, name: string): Promise<string> {
  const out = JSON.parse(await run($, ['herdr', 'tab', 'create', '--cwd', cwd, '--label', name, '--no-focus'], cwd))
  const root = out.result.root_pane
  return typeof root === 'string' ? root : root.pane_id
}

// One timer for all children, running only while one is starting or running.
function ensurePolling($: EngineInterface) {
  if (poller) return
  void read($, children).then(list => {
    if (poller || !list.some(c => c.phase === 'running')) return
    poller = $.clock.every(POLL_MS, () => poll($))
  })
}

type AgentRow = { name?: string; status?: string; state?: string; waitingFor?: string }

// herdr's state for herdr children (it tells done from idle), `claude agents`
// for background ones, and `waitingFor` from `claude agents` for both.
async function poll($: EngineInterface) {
  const list = await read($, children)
  const live = list.filter(c => c.phase === 'running')
  if (!list.some(c => c.phase === 'starting') && live.length === 0) {
    poller?.cancel()
    poller = undefined
    return
  }
  if (live.length === 0) return

  const agents = await listAgents($)
  const seen = new Map<string, { state: string; pane?: string } | null>()
  for (const c of live) {
    const a = agents.find(x => x.name === c.name)
    let state: string | null = null
    let pane = c.pane
    if (c.where === 'bg') {
      if (a) state = a.state ?? a.status ?? 'unknown'
    } else {
      const r = await $.process.run(['herdr', 'agent', 'get', c.name])
      if (r.exitCode === 0) {
        const agent = JSON.parse(r.stdout).result?.agent
        state = agent?.agent_status ?? 'unknown'
        pane = agent?.pane_id ?? pane
      }
    }
    if (state !== null && a?.status === 'waiting') state = `waiting: ${a.waitingFor ?? 'input'}`
    seen.set(c.key, state === null ? null : { state, pane })
  }

  for (const c of live) {
    const s = seen.get(c.key)
    if (s === null) $.ui.toast(`handoff: ${c.name} has exited`)
    else if (s && s.state !== c.state && (s.state === 'done' || s.state === 'blocked' || s.state.startsWith('waiting'))) {
      $.ui.toast(`handoff: ${c.name} is ${s.state}`)
    }
  }

  const now = await $.clock.now()
  await update($, children, current => current.flatMap(c => {
    const s = seen.get(c.key)
    if (s === undefined) return [c]
    if (s === null) return []
    return [{ ...c, state: s.state, pane: s.pane }]
  }))
  await update($, checkedAt, () => now)
}

async function listAgents($: EngineInterface): Promise<AgentRow[]> {
  const r = await $.process.run(['claude', 'agents', '--json'], { timeoutMs: 10_000 })
  if (r.exitCode !== 0) return []
  try {
    const rows = JSON.parse(r.stdout)
    return Array.isArray(rows) ? rows : []
  } catch {
    return []
  }
}

// A herdr child: focus its pane. A background child: attach in a new herdr pane,
// or copy the attach command outside herdr.
async function jump($: EngineInterface, c: Child) {
  try {
    const cwd = await $.session.cwd()
    if (c.where !== 'bg') {
      await run($, ['herdr', 'agent', 'focus', c.name], cwd)
      return
    }
    const command = `claude attach ${c.id ?? c.name}`
    if ((await $.env.get('HERDR_PANE_ID')) !== undefined) {
      const pane = await newPane($, cwd, true)
      await run($, ['herdr', 'pane', 'run', pane, command], cwd)
      return
    }
    const copied = await $.ui.copy({ text: command })
    $.ui.toast(copied.isCopied ? `Copied: ${command}` : `Run: ${command}`)
  } catch (err) {
    $.ui.toast(`handoff: couldn't jump to ${c.name}: ${String(err instanceof Error ? err.message : err)}`)
  }
}

// The mod can't call SendMessage; the parent's model can. The reply comes back
// as a turn of its own, so the child's result enters this context only on request.
async function compare($: EngineInterface, c: Child) {
  await $.prompt.submit({ text: COMPARE_PROMPT.replace('{NAME}', c.name) })
}

async function run($: EngineInterface, argv: string[], cwd: string, timeoutMs = 30_000): Promise<string> {
  const r = await $.process.run(argv, { cwd, timeoutMs })
  if (r.exitCode !== 0) throw new Error(`${argv.slice(0, 3).join(' ')} failed: ${(r.stderr || r.stdout).trim().slice(0, 300)}`)
  return r.stdout
}

function age(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  return `${Math.floor(s / 3600)}h`
}

// `ho-{slug}-{4 random}`: readable in herdr and `claude agents`, unique without a lookup,
// and inside herdr's name rule ([a-z][a-z0-9_-]{0,31}).
function childName(text: string, suffix: string): string {
  const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24).replace(/-+$/, '')
  return slug === '' ? `ho-${suffix}` : `ho-${slug}-${suffix}`
}

function randomSuffix(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from(crypto.getRandomValues(new Uint8Array(4)), b => alphabet[b % alphabet.length]).join('')
}