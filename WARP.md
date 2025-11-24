# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

Monorepo for a Chrome/Edge extension (“cosmos”) with a local, multi‑agent system. Tooling: pnpm workspaces, Turbo for orchestration, Vite for bundling, TypeScript, React, ESLint/Prettier, Vitest (unit tests in core extension).

Node ≥ 22.12.0 and pnpm ≥ 9.15.1 are required (see package.json engines and packageManager).

Repository layout (big picture):
- chrome-extension: Extension manifest + background service worker and core multi‑agent logic.
- pages/: UI pages bundled as separate entries (side-panel, options, content script).
- packages/: Shared libraries and build infra (shared, storage, ui, i18n, schema-utils, hmr, dev-utils, zipper, vite-config, tailwind-config, tsconfig).

## Commands

Use pnpm at the repo root unless filtering to a workspace. Turbo orchestrates per-workspace scripts with task names like ready, dev, build.

Installation
- pnpm install

Development
- pnpm dev
  - Starts Turbo “watch dev” across workspaces with __DEV__=true.
- Example: focus a single workspace for faster iterations
  - pnpm -F chrome-extension dev
  - pnpm -F pages/side-panel dev

Build and package
- pnpm build
  - Runs turbo ready then turbo build across workspaces.
- pnpm zip
  - Builds then runs the zipper workspace to produce a distributable archive.
- Output: dist (unpacked extension), dist-zip (packaged archive). Set __FIREFOX__=true to produce .xpi instead of .zip.

Tests
- Unit tests (Vitest) live under chrome-extension; example exists for guardrails.
  - Run all: pnpm -F chrome-extension test
  - Run by name: pnpm -F chrome-extension test -- -t "Sanitizer"

Type checking and linting
- pnpm type-check
- pnpm lint
- pnpm lint:fix
- pnpm prettier
- Workspace-scoped examples:
  - pnpm -F packages/storage type-check
  - pnpm -F pages/side-panel lint -- src/components/ChatInput.tsx
  - pnpm -F chrome-extension prettier -- src/background/index.ts

Cleaning
- pnpm clean
- pnpm clean:bundle
- pnpm clean:turbo
- pnpm clean:node_modules
- pnpm clean:install (removes node_modules then reinstalls)

End-to-end
- pnpm e2e (builds and zips first; turbo e2e task is defined)

Loading the extension for manual testing
- After pnpm build, load dist/ as an unpacked extension:
  1) Open chrome://extensions
  2) Enable “Developer mode”
  3) Click “Load unpacked” and choose the built dist directory

## Architecture (big picture)

Runtime surfaces
- Background (chrome-extension/src/background):
  - agent/: Multi‑agent system
    - agents/: thinker (planning/reasoning), navigator (web control), plus base, planner, errors
    - actions/ and schemas.ts: structured tool/action definitions (zod schemas)
    - messages/: messaging service, views, and sanitization helpers
    - event/: event types/manager for internal coordination
  - browser/: DOM/page automation (DOM views, clickables, history, page context)
  - services/:
    - guardrails/: input/content sanitizer and threat detection with Vitest coverage
    - analytics and speech-to-text integrations
  - task/: task manager and workflow orchestration
  - index.ts: background entry point

- UI Pages (pages/):
  - side-panel: Chat UI, history, status, and agent controls
  - options: Settings (LLM providers, model selection, analytics, firewall)
  - content: Content script injected into pages

Shared libraries (packages/)
- shared: cross-cutting utils (hooks, HOCs, shared types)
- storage: typed storage (settings, profiles, prompts, chat history)
- ui: shared React components and styling utilities
- i18n: locale generation; build scripts generate runtime artifacts (don’t edit generated lib outputs)
- schema-utils: JSON schema helpers for tools/actions
- hmr: dev-time hot reload server/injections used by Vite in extension context
- dev-utils: build-time helpers (logger, manifest parsing)
- zipper: packaging logic for creating release zips
- vite-config, tailwind-config, tsconfig: central configs reused by workspaces

Build and task model
- Turbo tasks:
  - ready: build or prepare libraries (often generates artifacts like i18n)
  - dev: development builds/watch (persistent)
  - build: production builds for each workspace via Vite or custom scripts
  - type-check, lint, prettier: quality tasks
- Each workspace has local scripts that Turbo invokes; outputs are generally in dist/ or build/.

Testing approach
- Vitest in chrome-extension; tests reside alongside code under __tests__ directories.
- Use targeted runs with -t for fast feedback.

Environment & configuration
- __DEV__ is used to control dev-time behavior in watch builds.
- Vite-based pages and the extension honor VITE_* env variables (standard Vite pattern).

## Important rules from CLAUDE.md (applies here)

- Always use pnpm in this repo; prefer workspace-scoped runs for speed (pnpm -F <workspace> <script>).
- Do not modify generated artifacts (dist/**, build/**, packages/i18n/lib/**).
- Keep changes scoped; avoid sweeping refactors across workspaces.
- Reuse existing shared packages (packages/ui, packages/tailwind-config, etc.) instead of re-implementing.

## Pointers to source for deeper dives

- Multi‑agent orchestration: chrome-extension/src/background/agent
- DOM/page automation: chrome-extension/src/background/browser
- Messaging and sanitization: chrome-extension/src/background/agent/messages and services/guardrails
- Side panel UI: pages/side-panel/src
- Settings and providers: pages/options/src and packages/storage/lib/settings
