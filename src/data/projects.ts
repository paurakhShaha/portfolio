export interface Project {
  id: string
  number: string
  title: string
  shortDescription: string
  description: string
  category: string
  technologies: string[]
  githubUrl: string
  liveUrl?: string
  /** Screenshot path under public/ — e.g. /images/projects/webpet.jpg */
  coverImage?: string
  features: string[]
  problem: string
  approach: string
  accent: string
  accentSoft: string
}

export const projects: Project[] = [
  {
    id: 'webpet',
    number: '01',
    title: 'WebPet',
    shortDescription: 'A living pixel-art companion that hatches, roams your browser, and goes on adventures.',
    description:
      'Chrome MV3 extension where a mysterious egg hatches into a deterministic pixel-art pet. The pet has care stats, dialogue, a full lightweight RPG loop (adventures, combat, inventory, shop, quests, achievements), and can roam any webpage via a Shadow DOM content script.',
    category: 'Creative Extension',
    technologies: ['TypeScript', 'React', 'Vite', 'Chrome Extensions', 'Pixel Art', 'Procedural Generation'],
    githubUrl: 'https://github.com/paurakhShaha/webpet',
    coverImage: '/images/projects/webpet.png',
    features: [
      'Seeded procedural pets & eggs',
      'Roaming content-script pet on any page',
      'Care simulation without timers',
      'Deterministic adventure combat',
      'Inventory, shop, quests, achievements',
      'Illustrated world map with seasons & weather',
    ],
    problem: 'Most browser pets are either purely decorative or lack depth. WebPet aims to feel like a small living world that respects determinism, offline time, and gentle failure.',
    approach: 'Pure reducers, Web Locks for safe saves, forked RNGs per concern so adding new rolls never changes existing pets, and time simulation that never punishes long absences.',
    accent: '#B9F35A',
    accentSoft: 'rgba(185, 243, 90, 0.15)',
  },
  {
    id: 'daily-news',
    number: '02',
    title: 'Daily News',
    shortDescription: 'Hands-off AI newsletter that fetches, summarizes, and emails tech & finance news every morning.',
    description:
      'Production Python multi-agent pipeline that pulls Technology and Finance news, deduplicates, summarizes with Gemini, builds a polished HTML email (market ticker, executive summary, companies to watch, earnings calendar), and delivers it at 06:00 Asia/Kathmandu.',
    category: 'AI Agents / Backend',
    technologies: ['Python', 'Gemini', 'APScheduler', 'NewsAPI / GNews', 'Jinja2', 'SMTP'],
    githubUrl: 'https://github.com/paurakhShaha/Daily_News',
    coverImage: '/images/projects/daily-news.jpg',
    features: [
      'Multi-agent pipeline (fetch → dedup → summarize → render → email)',
      'Market ticker (BTC, EUR/USD, USD/JPY) without API keys',
      'Extractive “Companies to Watch” grounded in real headlines',
      'Graceful degradation on every external service',
      'GitHub Actions + long-running scheduler options',
    ],
    problem: 'Keeping up with daily tech and finance news is noisy. A reliable, opinion-free summary delivered at a fixed local time removes the friction.',
    approach: 'One responsibility per agent, pure configuration from environment, and a philosophy that ordinary failures never crash the whole run.',
    accent: '#246BFD',
    accentSoft: 'rgba(36, 107, 253, 0.12)',
  },
  {
    id: 'chat-app',
    number: '03',
    title: 'Chat App',
    shortDescription: 'Realtime MERN chat powered by Socket.io.',
    description:
      'Full-stack realtime messaging application built with the MERN stack and Socket.io for low-latency bidirectional communication.',
    category: 'Full-Stack',
    technologies: ['MongoDB', 'Express', 'React', 'Node.js', 'Socket.io'],
    githubUrl: 'https://github.com/paurakhShaha/Chat-App',
    coverImage: '/images/projects/chat-app.jpg',
    liveUrl: 'https://chat-app-paurakh.onrender.com',
    features: [
      'Realtime messaging with Socket.io',
      'MERN architecture',
      'Deployed live demo',
    ],
    problem: 'Demonstrate end-to-end realtime communication between clients through a Node server.',
    approach: 'Classic MERN structure with Socket.io events for presence and messages.',
    accent: '#FF7043',
    accentSoft: 'rgba(255, 112, 67, 0.12)',
  },
  {
    id: 'devpocket',
    number: '04',
    title: 'DevPocket',
    shortDescription: 'Free browser-only developer utilities — JSON, timestamps, UUIDs, regex.',
    description:
      'A single-page collection of everyday developer tools that run entirely in the browser: JSON formatter & validator, Unix timestamp converter, UUID v4 generator, and regular-expression tester. No backend, no accounts, no uploads.',
    category: 'Utility',
    technologies: ['HTML', 'CSS', 'JavaScript'],
    githubUrl: 'https://github.com/paurakhShaha/devpocket',
    coverImage: '/images/projects/devpocket.png',
    features: [
      'JSON format / minify / validate',
      'Unix timestamp ↔ human date',
      'Secure UUID v4 generation',
      'Regex tester with capture groups',
      '100% client-side processing',
    ],
    problem: 'Developers constantly need small, trustworthy tools that do not require signing in or sending data to a server.',
    approach: 'One clean homepage, local-only logic, and a consistent design system.',
    accent: '#171714',
    accentSoft: 'rgba(23, 23, 20, 0.06)',
  },
  {
    id: 'ai-stock-agent',
    number: '05',
    title: 'AI Stock Agent',
    shortDescription: 'Multi-agent Python system for stock analysis, reporting, and scheduled runs.',
    description:
      'Python multi-agent architecture with dedicated agents, an orchestrator, tools, prompts, report generation, an API surface, and a scheduler for recurring analysis.',
    category: 'AI Agents',
    technologies: ['Python', 'Agents', 'API', 'Scheduler'],
    githubUrl: 'https://github.com/paurakhShaha/AI-Stock-Agent',
    coverImage: '/images/projects/ai-stock-agent.jpg',
    features: [
      'Agent + orchestrator structure',
      'Tooling and prompt modules',
      'Report generation',
      'Scheduler & API entry points',
    ],
    problem: 'Structured, repeatable stock analysis that can run on a schedule rather than ad-hoc scripts.',
    approach: 'Clear separation of agents, tools, prompts, and orchestration so each piece can evolve independently.',
    accent: '#246BFD',
    accentSoft: 'rgba(36, 107, 253, 0.1)',
  },
]

export const personal = {
  name: 'Paurakh Shah',
  tagline: 'Developer by logic. Creative by instinct.',
  intro:
    'I build digital experiences, interactive tools, and experiments at the intersection of code and imagination.',
  interests: [
    'Interactive systems that feel alive',
    'Browser extensions & creative coding',
    'AI agent pipelines that actually ship',
    'Clean full-stack products',
  ],
  seeking: [
    'Teams that care about craft and systems thinking',
    'Freelance work on tools, extensions, and product frontends',
    'Collaborations that mix code with design curiosity',
  ],
  github: 'https://github.com/paurakhShaha',
  // Add verified LinkedIn / email when available
  email: '',
  linkedin: '',
}

export const skills = {
  frontend: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'GSAP', 'Three.js / R3F'],
  backend: ['Node.js', 'Express', 'Python', 'FastAPI-style services', 'Socket.io'],
  languages: ['TypeScript', 'JavaScript', 'Python'],
  databases: ['MongoDB'],
  tools: ['Chrome Extensions (MV3)', 'Git', 'Vite', 'APScheduler', 'GitHub Actions'],
  creative: ['Procedural generation', 'Pixel art systems', 'Scroll-driven storytelling', 'Agent orchestration'],
}
