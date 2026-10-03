import { expect, mock, test } from 'claude-code/testing'

const opened = (on: any): void => on('ui.open', () => ({ value: { isPlaced: true } }))

const PANE = { plugin: 'handoff', surface: 'terminal', component: 'Pane', requestId: 'handoff', props: {} } as any

test('/handoff in herdr offers pane, tab, background and copy', async ($, on) => {
  opened(on)
  mock.env(on, { HERDR_PANE_ID: 'w1:p1' })
  await $.command.run({ command: 'handoff', args: '' } as any)
  const ui = await $.ui.mount(PANE)
  for (const key of ['pane', 'tab', 'bg', 'copy', 'mode-brief', 'mode-fork']) {
    expect(await ui.find({ key })).toBeDefined()
  }
  await ui.unmount()
})

test('/handoff outside herdr offers only background and copy', async ($, on) => {
  opened(on)
  mock.env(on, {})
  await $.command.run({ command: 'handoff', args: '' } as any)
  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ key: 'pane' })).toBeUndefined()
  expect(await ui.find({ key: 'tab' })).toBeUndefined()
  expect(await ui.find({ key: 'bg' })).toBeDefined()
  await ui.unmount()
})

test('choosing full fork marks it selected', async ($, on) => {
  opened(on)
  mock.env(on, {})
  await $.command.run({ command: 'handoff', args: '' } as any)
  const ui = await $.ui.mount(PANE)
  await ui.press({ key: 'mode-fork' })
  expect((await ui.find({ key: 'mode-fork' }))?.text).toContain('selected')
  await ui.unmount()
})

test('/handoff <task> launches without opening the picker', async ($, on) => {
  let opened = false
  on('ui.open', () => { opened = true; return { value: { isPlaced: true } } })
  mock.env(on, {})
  // The launch runs on after the command returns; it ends in a toast (here a failure, with nothing beneath to answer it).
  const toasted = new Promise<string>(resolve => on('ui.toast', ($, e) => { resolve(e.text); return { value: undefined } as any }))
  await $.command.run({ command: 'handoff', args: 'try option B' } as any)
  expect(opened).toBe(false)
  expect(await toasted).toContain('handoff')
})

const BAND = { plugin: 'handoff', surface: 'terminal', component: 'AbovePrompt', props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 120 } } as any

// Beneath the plugins, the engine draws nothing in the band.
const engineBand = (on: any): void => on('ui.render', ($: any, e: any) => {
  const { Box } = $.ui.resolve(e)
  return <Box />
})

test('the band is hidden with no children', async ($, on) => {
  mock.clock(on)
  engineBand(on)
  const ui = await $.ui.mount(BAND)
  expect(await ui.findAll({ type: 'Button' })).toHaveLength(0)
  await ui.unmount()
})

test('a failed launch shows its row, then leaves the band', async ($, on) => {
  const clock = mock.clock(on)
  engineBand(on)
  mock.env(on, {})
  const toasted = new Promise<string>(resolve => on('ui.toast', ($, e) => { resolve(e.text); return { value: undefined } as any }))
  await $.command.run({ command: 'handoff', args: 'try option B' } as any)
  await toasted
  const ui = await $.ui.mount(BAND)
  // With nothing beneath to answer the session, the launch fails and its row says so.
  expect(await ui.find({ type: 'Text', text: /ho-try-option-b-/ })).toBeDefined()
  await clock.advance(30_000)
  expect(await ui.find({ type: 'Text', text: /ho-try-option-b-/ })).toBeUndefined()
  await ui.unmount()
})
