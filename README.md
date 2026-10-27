# PAURAKH SHAH — A World in Progress

[Paurakh Shah](https://github.com/paurakhShaha).

· GSAP ScrollTrigger · Lenis smooth scroll · custom cursor · real GitHub projects.

## Selected projects 

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

