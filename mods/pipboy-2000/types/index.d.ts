declare module 'claude-code' {
  interface PluginState {
    // When the main conversation last sent a request, for the cache countdown,
    // and the effort it asked for. Kept here so a reload doesn't blank them.
    'pipboy-2000': { lastRequestAt: number | null; effort: string | null }
  }
}
