# Game Dev Tycoon — Agent Context

> This file provides context for any LLM or AI agent working on this codebase.

## What Is This Project?

A browser-based idle/incremental game where you manage a game development studio. You create games by choosing genre + style combos, set development pillar weights, hire staff, buy office space, manage server infrastructure across global regions, and grow your fan base.

**Status**: V1.1 — UI overhaul complete. New skill tree and studio XP system.

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: ShadCN/UI components + Tailwind CSS v4
- **State**: Zustand (single client-side store)
- **Persistence**: localStorage (v1)
- **Package manager**: npm

## How to Run

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint    # ESLint
```

## Architecture

```
src/
  app/                  — Next.js routes
    page.tsx            — Main menu (New Game / Load Game)
    game/page.tsx       — Main gameplay screen with tabs
  components/
    ui/                 — ShadCN primitives (auto-generated, don't edit)
    screens/            — Full-screen components
    game/               — Gameplay UI components
      tabs/             — One file per game tab
  lib/
    config/             — ALL tunable game balance numbers and flags
    game/               — Pure game logic (no React, no side effects)
    store/              — Zustand store + save/load
```

## Key Design Decisions

1. **Config-driven balance**: Every gameplay number lives in `src/lib/config/`. No magic numbers in game logic or UI code. This makes tuning easy for non-engineers and AI agents alike.

2. **Pure game logic**: Files in `src/lib/game/` are pure functions. They receive state, return new state. No React imports, no DOM, no side effects. This makes them testable and portable.

3. **Single Zustand store**: All game state in one store (`src/lib/store/gameStore.ts`). Components read via selectors, write via named actions. No prop drilling.

4. **Calendar-driven tick**: The game loop is driven by an in-game calendar starting Jan 1, 2040. Speed controls: Stop/1x/2x/4x. All systems update per-tick. Monthly costs are deducted atomically at month boundaries.

## Game Systems

### Core Gameplay Loop
Development → Release → Growth → Peak → Decline → (DLC / Sequel / Retire)

### Systems
- **Calendar**: In-game time, speed controls, month-end reports
- **Development**: Pillar weights (Graphics/Gameplay/Sound/Polish), progress, crunch boosts
- **Platforms**: PC (default), Console, Mobile — each with audience multiplier and revenue cut
- **Genre/Style Combos**: Hidden sale rate multipliers (1x–3x)
- **Servers**: Colocated (rent) vs Owned Datacenters, 9 global regions
- **Employees**: 4 skill types (Devel/Infra/Project/Management), 1–5 rating, passive bonuses
- **Offices**: 5 tiers (Garage → Studio Floor), gate max headcount
- **Fans**: Game fans + Studio fans, affect DLC/sequel sales
- **Skill Tree**: 3 specializations (Production/Business/Technology), ~55 nodes, multi-rank, powered by Studio XP/leveling
- **Bugs**: Spawn based on player count, affect review score
- **Research**: Earned passively while games are online

### 9 Server Regions
US-East (default), US-West, Brazil, Saudi Arabia, Russia, India, China, Japan, Australia

## Config Files

| File | Purpose |
|------|---------|
| `gameConfig.ts` | Core constants: starting money, tick rate, lifecycle lengths, fan rates |
| `genreStyleConfig.ts` | Genre × Style combo multipliers |
| `skillTreeConfig.ts` | 3-spec skill tree: ~55 nodes with multi-rank, prerequisites |
| `studioLevelConfig.ts` | Studio XP curve (max level 30), XP rewards per action |
| `serverConfig.ts` | Region definitions, server costs, datacenter specs |
| `calendarConfig.ts` | Speed settings, ms-per-tick, days-per-month |
| `employeeConfig.ts` | Skill ranges, hire/salary formulas, pool size |
| `officeConfig.ts` | Office tiers, seats, costs, overhead, speed bonuses |
| `platformConfig.ts` | Platform definitions, audience multipliers, cuts |

## Git Conventions

- V1: committing directly to `main`, frequent commits
- Post-V1: feature branches, PR-based workflow with AI code review
- Commit messages: `feat:`, `fix:`, `refactor:`, `chore:`

## Implemented V1 Features

- New Game / Load Game / Save flow with localStorage persistence
- Game Creation Wizard: studio name, starting money, genre, style, pillar weights
- Calendar system: Jan 1 2040 start, Stop/1x/2x/4x speed controls
- Tick-based game loop: revenue, bugs, fan conversion, server load, research
- End-of-month report modal with itemized cost breakdown
- 7 game tabs: Studio, Skill Tree, Bugs, Research, Engines, Staff, Studio View
- 9 server regions (US-East default, 8 more unlockable)
- Colocated servers + Datacenter purchases
- Employee hiring/firing with 4 skills (Devel/Infra/Project/Management 1–5)
- 5-tier office system (Garage through Studio Floor)
- Skill tree with 3 specializations (Production/Business/Technology), studio XP/leveling (max 30)
- Game lifecycle: Development → Growth → Peak → Decline
- DLC creation, Sequel development, Game retirement
- Bankruptcy detection and restart flow
- Platform system: PC (default), Console, Mobile with revenue cuts

## Known Limitations (V1)

- Single-player only, no backend
- Save/load via localStorage (no cloud sync)
- No sound effects or animations yet
- DLC progress ticking not yet connected in game loop (DLC is created but doesn't auto-progress)
- Marketing / hype budget system not yet implemented
- No in-game tutorial or onboarding
