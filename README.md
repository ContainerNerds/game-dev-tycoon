# Game Dev Tycoon

A browser-based idle/incremental game where you run a game development studio. Create games, manage servers, hire staff, grow your fan base, and build a gaming empire.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [ShadCN/UI](https://ui.shadcn.com/) + [Tailwind CSS v4](https://tailwindcss.com/)
- [Zustand](https://zustand.docs.pmnd.rs/) for state management

## Project Structure

```
src/
  app/          — Pages and routes
  components/   — UI components (ShadCN primitives + game UI)
  lib/
    config/     — Game balance configuration
    game/       — Pure game logic
    store/      — State management
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
