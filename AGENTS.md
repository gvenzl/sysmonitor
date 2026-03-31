# AGENTS.md

Repository guidance for coding agents working in `sysmonitor`.

## Project Snapshot

- Electron desktop application built with TypeScript.
- Renderer UI lives under `src/renderer`.
- Electron main/preload code lives under `src/electron`.
- Core monitoring, config, logging, SSH, and recording logic lives under `src/core`.
- Shared contracts used across processes live under `src/shared`.
- User configuration is stored as JSON at `~/.sysmonitor/config.json`.

## Instruction Files

At analysis time, these additional rule files were **not** present:

- `.cursorrules`
- `.cursor/rules/`
- `.github/copilot-instructions.md`

If any of these files are added later, treat them as first-class instructions and keep this file aligned with them.

## Recommended First Reads

1. `package.json`
2. `electron.vite.config.ts`
3. `src/electron/main.ts`
4. `src/electron/preload.ts`
5. `src/shared/contracts/ipc.ts`
6. The specific `src/core`, `src/electron`, or `src/renderer` file you need to change
7. The related test file under `tests/unit/**`

## Key Paths

- `package.json` — authoritative npm scripts and dependency list.
- `electron.vite.config.ts` — Electron/Vite entrypoint wiring.
- `src/electron/main.ts` — application bootstrap and BrowserWindow setup.
- `src/electron/preload.ts` — renderer-safe API bridge.
- `src/electron/ipc` — IPC handler registration.
- `src/renderer` — app shell, view rendering, dialogs, styles.
- `src/core` — config, logging, recording, SSH, vmstat, systems store.
- `src/shared/contracts` — shared app/system/IPC contracts.
- `tests/unit` — Vitest coverage for core, renderer, and electron code.
- `.github/workflows/build.yaml` — CI reference for install, build, and package flow.
- `out/` and `dist/` — generated output; never edit by hand.

## Commands

Run commands from the repository root.

- `npm install` — install dependencies.
- `npm run dev` — start Electron + Vite development mode.
- `npm test` — run the full test suite via `vitest run`.
- `npx vitest run` — equivalent direct Vitest invocation.
- `npx vitest run tests/unit/config/configRepository.test.ts` — verified single-file test execution pattern.
- `npx vitest run tests/unit/config/configRepository.test.ts -t "reads config"` — run one file plus a test-name filter.
- `npm run build` — run `vitest run && electron-vite build`.
- `npm run package` — build and package with `electron-builder`.
- `npm run package:dir` — produce an unpacked app directory.
- `npm run test:packaged-smoke` — smoke-check packaged output.

`package.json` does **not** define a dedicated single-test npm script, so use `npx vitest run <path-to-test>` for targeted execution.

## CI Expectations

`.github/workflows/build.yaml` installs with `npm install`, runs `npm run build`, then packages on macOS, Linux, and Windows.

- Tests are part of the build contract.
- Breaking `npm run build` breaks CI even if `npm test` passed separately.
- Packaging changes should be checked against both `package.json` and the workflow.
- The macOS CI job packages both `arm64` and `x64` builds, but uploads only `dist/*.dmg` as the mac artifact.
- Linux and Windows CI jobs still upload the full `dist/` directory.

## Linting and Formatting

There is currently no dedicated lint script and no repository formatter configuration.

- Do not claim lint passed.
- Do not invent ESLint, Prettier, or Biome commands unless you add that tooling.
- Match the surrounding formatting manually.
- Keep diffs surgical and avoid unrelated reformatting.

Observed formatting patterns:

- TypeScript uses 4-space indentation.
- Imports are grouped at the top of the file.
- `import type` is used for type-only imports.
- Relative imports are the norm; no path alias setup is visible.

## Code Style Guidelines

### Imports

- Keep Node built-ins first when present, then external packages, then local imports.
- Prefer explicit named imports over namespace imports.
- Use `import type` for type-only dependencies.
- Preserve existing relative import style such as `../../shared/contracts/system`.

### Naming

- Types, interfaces, and exported contracts use `PascalCase`.
- Functions, methods, locals, object fields, and parameters use `camelCase`.
- Constants use `UPPER_CASE` when they are true constants, such as `IPC_CHANNELS` or `CHART_WIDTH`.

Preserve repo vocabulary already used in persisted config and shared contracts, including `hostName`, `userName`, `passWord`, `sshKey`, `osInfo`, `dataPoints`, `refreshCycle`, and `themeMode`.

### Types and Contracts

- Prefer explicit types on shared contracts and core logic.
- Keep main, preload, renderer, and shared contract changes synchronized.
- Update `src/shared/contracts` when the IPC surface changes.
- Avoid `any`, `@ts-ignore`, and other type-suppression shortcuts.
- Follow existing union and interface patterns for app state and renderer dialogs.

### Functions and Control Flow

- Prefer small focused functions over deeply nested event-handler logic.
- Early returns are common and fit the existing style.
- Use explicit null/undefined checks where DOM or IPC values may be absent.
- Preserve readable, direct code over clever abstractions.

### Error Handling

Observed patterns in the repo:

- lower-level code throws meaningful errors upward
- config loading handles `ENOENT` and returns defaults
- renderer bootstrap failures fall back to a visible error panel
- optional logging destinations are normalized before writing

For new code:

- do not silently swallow exceptions
- prefer meaningful thrown errors in core and electron code
- prefer user-visible failure states in renderer flows
- keep catch blocks narrow and purposeful
- use existing logging helpers when writing application logs

## Electron and IPC Conventions

- Keep privileged or filesystem-backed logic in main/preload, not in the renderer.
- Renderer access to native capabilities must go through `contextBridge` APIs exposed in `src/electron/preload.ts`.
- Follow the existing IPC contract pattern in `src/shared/contracts/ipc.ts`.
- When adding a new IPC channel, update the shared contract, preload API, and main-process handler together.
- Preserve secure BrowserWindow defaults such as `contextIsolation: true` and `sandbox: true` unless explicitly asked to change them.

## Config, Logging, and Persistence

- Config path: `~/.sysmonitor/config.json`
- Config persistence lives in `src/core/config/configRepository.ts`.
- Keep the persisted JSON shape stable unless the task explicitly changes it.
- Normalization logic currently fills defaults and coerces theme mode.
- Logging helpers live in `src/core/logging/sysLogger.ts`.
- Empty log directories are treated as disabled logging; preserve that behavior unless requirements change.

## Testing and Verification

- Add or update the closest test under `tests/unit/**` for the area you change.
- Keep test placement aligned with the current layout, for example `tests/unit/config/configRepository.test.ts`, `tests/unit/electron/ipc.test.ts`, or `tests/unit/renderer/app.test.ts`.
- Prefer focused test additions over broad rewrites.
- When fixing a bug, reproduce it with a targeted test first when practical.

Before claiming a meaningful code change is complete:

1. Run `npm test`.
2. Run `npm run build`.
3. If packaging behavior changed, run the relevant packaging command.
4. If runtime behavior changed materially, launch the app in dev mode or verify startup behavior another concrete way.
5. Do not claim lint passed; there is no lint step today.

## Agent Do / Do Not

### Do

- Keep diffs small and localized.
- Match existing Electron, renderer, and core boundaries.
- Read the related contract and test files before changing behavior.
- Preserve manual formatting consistency.
- Verify with tests and build before declaring success.

### Do Not

- Do not hand-edit `out/` or `dist/` artifacts.
- Do not invent missing automation or rule files.
- Do not move privileged logic into the renderer.
- Do not perform broad refactors while fixing a local bug.
- Do not introduce silent error swallowing.
- Do not rename persisted/shared fields like `passWord` or `hostName` without an explicit schema migration task.
