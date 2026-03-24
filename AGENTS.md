# AGENTS.md

Repository guidance for coding agents working in `sysmonitor`.

## Project Snapshot

- Electron desktop application built with TypeScript.
- Renderer UI lives under `src/renderer`.
- Electron main/preload code lives under `src/electron`.
- Core monitoring/config logic lives under `src/core`.
- User configuration is stored as JSON at `~/.sysmonitor/config.json`.

## Key Paths

- `package.json` — authoritative build/test/package commands.
- `electron.vite.config.ts` — Electron/Vite build configuration.
- `src/electron` — Electron main process, preload, IPC, menu wiring.
- `src/renderer` — app shell, dashboard, dialogs, styles.
- `src/core` — config, logging, recording, systems, ssh/vmstat logic.
- `src/shared` — shared contracts used across main/preload/renderer.
- `.github/workflows/build.yaml` — CI pipeline reference.
- `out/` — generated build output; do not edit by hand.

## Build Commands

Run commands from the repository root.

- install dependencies:
  - `npm install`
- run tests:
  - `npm test`
- build production bundles:
  - `npm run build`
- start dev mode:
  - `npm run dev`
- package the app:
  - `npm run package`

## Linting and Formatting

There is currently no dedicated lint command or formatter configuration.

- Do not claim lint passed.
- Do not invent ESLint/Prettier/Biome commands unless you add that tooling.
- Match the existing TypeScript/CSS style manually.
- Keep diffs small and avoid unrelated reformatting.

## Tests

The repository uses Vitest.

- run all tests:
  - `npm test`
- There is no proven single-test command documented in this repo guidance unless you verify one during the same task.

## Verification Expectations

Before claiming a code change is complete:

1. Run `npm test`.
2. Run `npm run build`.
3. If runtime behavior changed materially, launch the built Electron app or dev app and verify startup.
4. Never claim lint passed; there is no lint step today.

## Editor / Agent Rule Files

At analysis time, these files were not present:

- `.cursorrules`
- `.cursor/rules/`
- `.github/copilot-instructions.md`

If any are added later, treat them as first-class instructions and keep this file aligned.

## Source Style

### Formatting

- Use 4-space indentation in TypeScript.
- Keep surrounding formatting consistent.
- Preserve the existing spacing rhythm.
- Avoid gratuitous reformatting.

### Naming

- Types, interfaces, components: `PascalCase`
- Functions, fields, locals, parameters: `camelCase`
- Constants: `UPPER_CASE`

Preserve the repository’s domain vocabulary, including names like:
- `hostName`
- `userName`
- `passWord`
- `sshKey`
- `osInfo`
- `dataPoints`
- `refreshCycle`
- `themeMode`

### Types and APIs

- Prefer explicit types on shared contracts and core logic.
- Keep shared-contract changes synchronized across main/preload/renderer.
- Do not use `any`, `@ts-ignore`, or unsafe type suppression.
- Avoid sweeping architectural changes while fixing a local bug.

### Error handling

Observed repo patterns:
- renderer startup errors fall back to a visible error panel
- lower-level code generally throws errors upward
- logging uses `SysLogger`

For new code:
- prefer user-visible feedback in renderer flows
- propagate meaningful errors in lower-level modules
- do not silently swallow exceptions

## Electron Conventions

- Keep privileged logic in main/preload, not in the renderer.
- Renderer access to native capabilities must go through preload APIs.
- Follow the existing IPC contract pattern in `src/shared/contracts/ipc.ts`.
- Keep theme state and config state consistent with persisted preferences.

## Config, Logging, and Packaging

- Config path: `~/.sysmonitor/config.json`
- Config persistence: `src/core/config/configRepository.ts`
- Preserve the JSON config object shape unless explicitly changing it.
- Application logging goes through `SysLogger` when configured.
- If packaging changes are made, inspect `package.json` packaging metadata and CI workflow.

## Dependencies

Prefer the existing Electron/TypeScript stack over adding new libraries unless justified.

If adding a dependency:
- explain why it is needed
- keep the change minimal
- verify tests/build afterwards

## Agent Do / Do Not

### Do

- Keep diffs surgical.
- Match existing Electron, TypeScript, renderer, and CSS patterns.
- Run `npm test` and `npm run build` for meaningful changes.
- Verify runtime startup for major UI/runtime changes.

### Do Not

- Do not invent missing lint workflows.
- Do not hand-edit `out/` artifacts.
- Do not reintroduce Java/Maven build instructions.
- Do not perform broad refactors while fixing a local bug.
- Do not add silent exception swallowing.

## Recommended First Reads

1. `package.json`
2. `electron.vite.config.ts`
3. `src/electron/main.ts`
4. `src/shared/contracts/ipc.ts`
5. The specific renderer/main/core file you are changing
