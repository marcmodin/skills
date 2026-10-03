export type Mode = 'brief' | 'fork'
export type Phase = 'pick' | 'working' | 'done' | 'error'
export type Picker = { task: string; mode: Mode; phase: Phase; status: string }

// One row of the band above the prompt: a child this session started.
// `phase` is the launch; `state` is the child's live state once it runs.
export type Child = {
  key: string
  name: string
  where: 'pane' | 'tab' | 'bg'
  phase: 'starting' | 'running' | 'failed'
  step: string
  state: string
  pane?: string
  id?: string
  startedAt: number
}

declare module 'claude-code' {
  interface PluginState {
    'handoff': { picker: Picker; children: Child[]; checkedAt: number }
  }
}
