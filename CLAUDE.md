# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Academic portfolio site for Viska Wei, migrated from Jekyll to **Astro 5**. Features Three.js/D3 visualizations with an impressionistic "Liquid Glass Monet" design theme. Deployed to GitHub Pages at `viskawei.github.io`.

## Commands

```bash
npm run dev       # Local dev server (Astro)
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
```

No test suite or linter is configured.

## Architecture

**Framework:** Astro 5 (static site, no UI framework — vanilla JS + TypeScript)

**Key dependencies:** `three` (WebGL/3D), `d3` (data visualization). These are manually chunked in `astro.config.mjs` via Rollup `manualChunks`.

### Source Layout

- `src/pages/` — Routes: `index.astro` (home/hero + project grid), `background.astro` (interactive skill tree)
- `src/layouts/BaseLayout.astro` — Root HTML shell (fonts, meta, global styles)
- `src/components/` — Astro components: `Nav.astro`, `Footer.astro`, `ProjectCard.astro`
- `src/cards/` — Per-project canvas/WebGL animations, each mapped by `cardStyle` in project data. `_shared.ts` has common utilities (canvas setup, animation loop)
- `src/islands/` — Page-level interactive elements: `MonetBackground.ts` (Three.js shader background), `TechTree.ts` (D3 skill tree, ~950 lines)
- `src/data/` — Typed data: `projects.ts` (project metadata, `Project` interface), `techtree.ts` (courses/nodes/tracks)
- `src/styles/` — CSS files: `global.css` (design tokens, Monet palette), `cards.css` (project grid), `techtree.css` (dark theme)
- `public/` — Static assets: `images/`, `files/` (PDFs), `favicon.svg`

### Design System (in `src/styles/global.css`)

Monet palette CSS variables: `--monet-lavender`, `--monet-yellow`, `--monet-mint`, `--monet-sky`, `--monet-rose`. Primary accent: `--accent-purple: #7c5cbf`. Fonts: Inter (body), Playfair Display (headings), JetBrains Mono (code).

### Card Animation Pattern

Each project card has a unique visualization determined by `cardStyle` in `src/data/projects.ts`. The mapping from style name to init function lives in `src/pages/index.astro`. Cards use `data-card-init` attributes and are initialized via Intersection Observer for lazy loading. Three.js cards cap device pixel ratio at 2x; canvas cards at 1.5x. All animations target 30 FPS.

### Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys to GitHub Pages on push to `main`. Uses Node 20, `npm ci`, outputs `dist/`.

## TypeScript

Strict mode via `"extends": "astro/tsconfigs/strict"` in `tsconfig.json`.
