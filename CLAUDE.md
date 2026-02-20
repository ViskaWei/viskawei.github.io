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

No test suite or linter is configured. Validate changes with `npm run build`.

## Architecture

**Framework:** Astro 5 (static site, no UI framework — vanilla JS + TypeScript)

**Key dependencies:** `three` (WebGL/3D), `d3` (data visualization). These are manually chunked in `astro.config.mjs` via Rollup `manualChunks`.

### Source Layout

- `src/pages/` — Routes: `index.astro` (home/hero + project grid), `background.astro` (Skill Galaxy interactive visualization)
- `src/layouts/BaseLayout.astro` — Root HTML shell (fonts, meta, global styles)
- `src/components/` — Astro components: `Nav.astro`, `Footer.astro`, `ProjectCard.astro`
- `src/cards/` — Per-project canvas/WebGL animations, each mapped by `cardStyle` in project data. `_shared.ts` has common utilities (canvas setup, animation loop, visibility observer)
- `src/islands/` — Page-level interactive elements: `MonetBackground.ts` (Three.js shader background for index), `GalaxyView.ts` + `GalaxyBackground.ts` (D3 skill galaxy for background page), `TechTree.ts` (legacy D3 skill tree)
- `src/data/` — Typed data: `projects.ts` (project metadata, `Project` interface), `techtree.ts` (courses/nodes/tracks for galaxy), `skilltree.ts` (cluster definitions for galaxy sidebar)
- `src/styles/` — CSS files: `global.css` (design tokens, Monet palette), `cards.css` (project grid), `skilltree.css` (galaxy dark theme), `techtree.css` (legacy)
- `public/` — Static assets: `images/`, `files/` (PDFs), `favicon.svg`

### Design System (in `src/styles/global.css`)

Monet palette CSS variables: `--monet-lavender`, `--monet-yellow`, `--monet-mint`, `--monet-sky`, `--monet-rose`. Primary accent: `--accent-purple: #7c5cbf`. Fonts: Inter (body), Playfair Display (headings), JetBrains Mono (code). Shared palette constants also in `src/cards/_shared.ts` as `MONET_PALETTE`.

### Card Animation Pattern

To add a new project card:
1. Add project entry to `src/data/projects.ts` with a unique `cardStyle` name
2. Create `src/cards/Card<StyleName>.ts` exporting `init<StyleName>(el: HTMLElement)` — use `setupCanvas()`, `animationLoop()`, and `observeVisibility()` from `_shared.ts`
3. Import and register in the `cardInits` map in `src/pages/index.astro`'s `<script>` block

`ProjectCard.astro` renders a `data-card-init={cardStyle}` attribute on each card's canvas container. The script in `index.astro` looks up the init function by that attribute value. Canvas cards cap DPR at 1.5x; Three.js cards at 2x. All animations target 30 FPS via `_shared.ts:animationLoop()`.

### Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys to GitHub Pages on push to `master`. Uses Node 20, `npm ci`, outputs `dist/`.

## TypeScript

Strict mode via `"extends": "astro/tsconfigs/strict"` in `tsconfig.json`.
