/**
 * Copy for the pinned "Build Log" story in ProjectWorlds.
 *
 * Chapters are thematic (how the craft levels up), not a dated timeline.
 * Each one points at a project in `projects.ts` by id; titles, tech, links and
 * screenshots come from there.
 */
export interface JourneyChapter {
  projectId: string
  /** Short imperative headline, split into characters on screen. */
  headline: string
  /** Giant outlined word drifting behind the scene. */
  keyword: string
  /** One or two sentences of story for this chapter. */
  narrative: string
  /** Lines typed into the terminal panel, in order. */
  log: string[]
  /** Accent that reads on the dark ink stage (project accents may not). */
  stageAccent: string
}

export const journeyIntro = {
  kicker: 'The build log',
  title: 'Five chapters.\nOne thread.',
  body: 'Each project pushed the craft one step further: from useful, to connected, to alive, to autonomous.',
}

export const journeyOutro = {
  kicker: 'Chapter 06',
  title: 'Still being written.',
  body: 'The next chapter could be something we build together.',
  cta: 'Start a conversation',
}

export const journey: JourneyChapter[] = [
  {
    projectId: 'devpocket',
    headline: 'Make it useful.',
    keyword: 'USEFUL',
    narrative:
      'The small tools I kept reaching for, rebuilt to run entirely in the browser. No accounts, no uploads, nothing leaves the tab.',
    log: ['init devpocket --tools json,time,uuid,regex', 'keep every byte client-side', 'ship one clean homepage ✓'],
    stageAccent: '#F7F4E9',
  },
  {
    projectId: 'chat-app',
    headline: 'Make it talk.',
    keyword: 'REALTIME',
    narrative:
      'Two browsers, one conversation. Wiring MongoDB, Express, React and Node together through Socket.io showed me how state moves between clients live.',
    log: ["io.on('message', broadcast)", 'connect mongo → express → react → node', 'deploy live demo ✓'],
    stageAccent: '#FF7043',
  },
  {
    projectId: 'webpet',
    headline: 'Make it feel alive.',
    keyword: 'ALIVE',
    narrative:
      'An egg hatches into a pixel-art pet that roams any webpage. Seeded RNG, pure reducers, and a care sim that never punishes you for being away.',
    log: ['seed → egg → hatch()', 'fork rng per concern', 'roam any page via shadow dom ✓'],
    stageAccent: '#B9F35A',
  },
  {
    projectId: 'daily-news',
    headline: 'Make it run without me.',
    keyword: 'AUTONOMOUS',
    narrative:
      'A multi-agent pipeline that fetches, dedups and summarizes with Gemini, then lands in the inbox at 06:00 Kathmandu time. When a service fails, it degrades instead of crashing.',
    log: ['fetch → dedup → summarize → render → email', 'never crash the whole run', 'cron "0 6 * * *" tz=Asia/Kathmandu ✓'],
    stageAccent: '#5B8CFF',
  },
  {
    projectId: 'ai-stock-agent',
    headline: 'Make it think.',
    keyword: 'AGENTS',
    narrative:
      'Agents, tools, prompts and an orchestrator, kept apart so each can evolve on its own, running analysis on a schedule instead of as ad-hoc scripts.',
    log: ['orchestrator.dispatch(agents)', 'tools · prompts · reports', 'schedule recurring analysis ✓'],
    stageAccent: '#FFC857',
  },
]
