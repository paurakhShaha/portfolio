# PAURAKH SHAH — A World in Progress

Cinematic scrollytelling portfolio for [Paurakh Shah](https://github.com/paurakhShaha).

Editorial paper aesthetic · GSAP ScrollTrigger · Lenis smooth scroll · custom cursor · real GitHub projects.

## Selected projects (verified from GitHub)

| # | Project | Why featured |
|---|---------|--------------|
| 01 | **WebPet** | Creative Chrome extension: procedural pixel pets, roaming content script, RPG adventures, inventory, quests |
| 02 | **Daily News** | Production Python multi-agent newsletter pipeline (Gemini + News APIs + scheduler + email) |
| 03 | **Chat App** | MERN + Socket.io realtime chat with live demo |
| 04 | **DevPocket** | Browser-only developer utilities (JSON, timestamps, UUID, regex) |
| 05 | **AI Stock Agent** | Multi-agent Python stock analysis system |

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS (paper ivory / ink / cobalt / signal / acid palette)
- GSAP + ScrollTrigger (scroll-driven reveals)
- Lenis (smooth scrolling)
- Lucide icons
- Optional deps listed for Three/R3F/Framer (ready to extend)

## Run locally (Windows / Mac / Linux)

**Do not copy `node_modules` from another machine.** Always install fresh on your PC.

```bash
cd paurakh-portfolio

# 1. Remove any broken install
rmdir /s /q node_modules          # Windows CMD
# Remove-Item -Recurse -Force node_modules   # PowerShell
# rm -rf node_modules              # Mac/Linux

del package-lock.json             # Windows
# rm package-lock.json             # Mac/Linux

# 2. Clean install
npm cache clean --force
npm install

# 3. Start
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build    # production build → dist/
npm run preview  # preview production build
```

### If you see PostCSS / util-deprecate errors

That means `node_modules` is incomplete or was copied. Delete it and reinstall:

```bash
# PowerShell
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
npm cache clean --force
npm install
npm run dev
```

### If npm install fails with 502 / network errors

```bash
npm install --registry https://registry.npmjs.org/
```

## Customize

- **Projects & copy:** `src/data/projects.ts`
- **Colors / fonts:** `tailwind.config.js` + `src/index.css`
- **Contact:** set `email` / `linkedin` in `personal` inside `projects.ts`

## Structure

```
src/
  components/   Navigation, cursor, progress, chapter indicator, footer
  sections/     Hero, Manifesto, ProjectWorlds, Toolkit, Playground, HumanSide, Closing
  data/         Real project metadata from GitHub
```

## Notes

- No fabricated metrics, clients, or screenshots presented as real product captures.
- Live demo link included only where verified (`Chat-App` on Render).
- `prefers-reduced-motion` disables Lenis and heavy entrance timelines.
- Custom cursor is pointer-only; touch devices keep the native cursor.


## Visual Playground (graphic design gallery)

Section id: \`#design\` · Nav label: **DESIGN**

- Data: \`src/data/designWorks.ts\`
- Component: \`src/sections/VisualPlayground.tsx\`
- Assets: \`public/images/graphic-design/design-01.*\` … \`design-15.*\`

Placeholders (SVG) ship so the layout works immediately. Replace them with your real files:

\`\`\`
public/images/graphic-design/design-01.jpg
public/images/graphic-design/design-02.webp
...
\`\`\`

Then update the \`image\` paths (and optional titles/categories) in \`designWorks.ts\`.
No need to edit the gallery component.
