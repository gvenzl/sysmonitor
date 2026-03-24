# SysMonitor Release Hardening Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring SysMonitor from "locally buildable" to a release-candidate state with correct distributable artifacts, safer runtime defaults, and explicit release validation gates.

**Architecture:** The work is split into release infrastructure, security/runtime hardening, and release validation. The plan keeps changes surgical: fix packaging and CI to emit real release artifacts, tighten unsafe defaults that are blockers for public distribution, and add minimal targeted verification so release claims are backed by packaged-app evidence rather than unit tests alone.

**Tech Stack:** Electron, electron-vite, electron-builder, TypeScript, Vitest, GitHub Actions, npm

---

## File Responsibility Map

- `package.json` — npm scripts and release entrypoints; currently packages with `electron-builder --dir`, which produces unpacked app output instead of normal release deliverables.
- `.github/workflows/build.yaml` — CI build/package pipeline; currently uploads `out/` rather than packaged `dist/` artifacts.
- `src/core/ssh/connection.ts` — SSH invocation defaults; currently disables host-key verification.
- `src/electron/main.ts` — BrowserWindow security defaults; currently has `sandbox: false`.
- `src/electron/ipc/configIpc.ts` — Native file dialog integration; validate packaged-runtime behavior after packaging changes.
- `src/electron/ipc/systemsIpc.ts` — Runtime monitoring loop and failure handling; candidate for minimal observability improvement during packaged smoke tests.
- `README.md` — release/build usage documentation; should match actual release commands and artifacts.
- `tests/unit/**/*.test.ts` — unit safety net; keep green while adding any targeted tests for release-critical behavior.
- `docs/superpowers/plans/2026-03-23-release-hardening.md` — this plan.

---

### Task 1: Create real release artifact outputs

**Files:**
- Modify: `package.json`
- Modify: `.github/workflows/build.yaml`
- Modify: `README.md`
- Test: verify packaged outputs under `dist/`

- [ ] **Step 1: Write the failing packaging expectation test/checklist**

Document the expected release behavior before editing code/scripts:
- `npm run package` must produce packaged outputs in `dist/`, not only unpacked directories.
- CI must upload packaged artifacts from `dist/`, not build intermediates from `out/`.
- README must describe the actual packaging/release flow.

- [ ] **Step 2: Run current packaging command to verify the gap**

Run: `npm run package`
Expected: PASS build, but evidence shows current command uses `electron-builder --dir` and CI uploads `out/`, proving the release path is not yet correct.

- [ ] **Step 3: Update packaging scripts minimally**

Change `package.json` so release packaging produces distributable outputs instead of `--dir`-only output. Keep a separate script if useful for unpacked/local packaging, but make the primary release path explicit.

- [ ] **Step 4: Update CI artifact collection**

Change `.github/workflows/build.yaml` so each OS job uploads packaged artifacts from `dist/` (or the verified electron-builder output directory), not `out/`.

- [ ] **Step 5: Update README to match**

Document the actual release/package behavior so developers know which command creates release artifacts and where they land.

- [ ] **Step 6: Run packaging again to verify output location**

Run: `npm run package`
Expected: PASS and packaged outputs appear under `dist/` in a form suitable for CI upload and manual inspection.

- [ ] **Step 7: Commit**

```bash
git add package.json .github/workflows/build.yaml README.md
git commit -m "build: produce and publish real release artifacts"
```

### Task 2: Harden SSH defaults for public release

**Files:**
- Modify: `src/core/ssh/connection.ts`
- Test: `tests/unit/...` (create a focused SSH-args unit test file if needed)

- [ ] **Step 1: Write the failing test for SSH argument safety**

Create a unit test around SSH arg construction that proves host-key verification is not silently disabled by default.

Suggested behaviors to test:
- default args do **not** include `StrictHostKeyChecking=no`
- default args do **not** include `UserKnownHostsFile=/dev/null`
- explicit SSH key handling still works

- [ ] **Step 2: Run the targeted test to verify it fails for the current code**

Run: `npm test -- --run <new-test-file>`
Expected: FAIL because the current implementation includes insecure defaults.

- [ ] **Step 3: Implement the minimal SSH fix**

Update `src/core/ssh/connection.ts` so host verification is enabled by default. If a compatibility escape hatch is needed, model it explicitly and visibly rather than silently disabling trust checks.

- [ ] **Step 4: Re-run the targeted test**

Run: `npm test -- --run <new-test-file>`
Expected: PASS

- [ ] **Step 5: Run the broader suite**

Run: `npm test`
Expected: PASS with no regressions.

- [ ] **Step 6: Commit**

```bash
git add src/core/ssh/connection.ts tests
git commit -m "security: verify ssh host keys by default"
```

### Task 3: Improve Electron release security posture

**Files:**
- Modify: `src/electron/main.ts`
- Test: `tests/unit/electron/shell.test.ts` or a new focused Electron-main unit test

- [ ] **Step 1: Write the failing test for BrowserWindow security defaults**

Add or extend a unit test asserting that the main window config keeps `nodeIntegration: false`, `contextIsolation: true`, and enables the desired sandbox posture.

- [ ] **Step 2: Run the targeted test to verify the current failure**

Run: `npm test -- --run <electron-main-test-file>`
Expected: FAIL because `sandbox` is currently `false`.

- [ ] **Step 3: Implement the minimal BrowserWindow config change**

Update `src/electron/main.ts` to enable sandboxing if compatibility permits. If sandboxing reveals a preload or runtime incompatibility, document the exact blocker in code/tests rather than silently keeping the weaker setting.

- [ ] **Step 4: Re-run the targeted test**

Run: `npm test -- --run <electron-main-test-file>`
Expected: PASS

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/electron/main.ts tests
git commit -m "security: tighten BrowserWindow release defaults"
```

### Task 4: Add packaged-app smoke validation

**Files:**
- Modify: `package.json`
- Create: `tests/release/` scripts or a small smoke-test helper if needed
- Modify: `.github/workflows/build.yaml`
- Test: packaged app startup + one representative flow

- [ ] **Step 1: Define the smoke-test target explicitly**

Write down the minimum release gate:
- packaged app launches
- preload loads
- renderer boots without fatal error
- one representative settings/connection-related flow is exercised as far as practical in automation or scripted smoke checks

- [ ] **Step 2: Write the failing smoke-test harness or command**

Create the smallest executable check that can fail if the packaged app cannot boot correctly. Prefer a scripted packaged-app smoke test over purely manual steps.

- [ ] **Step 3: Run it against the current packaged output**

Run the smoke-test command against the packaged app.
Expected: either FAIL outright or reveal current blind spots in the release gate.

- [ ] **Step 4: Implement the minimal support needed for stable smoke validation**

This may be a script, a deterministic launch wrapper, or a CI step that boots the packaged app and confirms non-crashing startup. Keep it narrow.

- [ ] **Step 5: Re-run the smoke test**

Run the packaged smoke-test command again.
Expected: PASS

- [ ] **Step 6: Wire the smoke test into CI or release instructions**

Update the workflow or docs so the smoke test is part of the release gate, not just a one-off manual command.

- [ ] **Step 7: Commit**

```bash
git add package.json .github/workflows/build.yaml tests README.md
git commit -m "test: add packaged app smoke validation"
```

### Task 5: Final release-candidate verification and artifact review

**Files:**
- Inspect: `dist/**`
- Inspect: packaged app metadata/assets
- Inspect: CI workflow output paths
- Modify: `README.md` only if verification reveals mismatches

- [ ] **Step 1: Run the full release gate**

Run, in order:
```bash
npm test
npm run build
npm run package
```
Expected: all PASS

- [ ] **Step 2: Inspect packaged outputs**

Run:
```bash
find dist -maxdepth 3 -type f | sort
```
Expected: actual packaged artifacts exist for the current platform and match the updated release flow.

- [ ] **Step 3: Launch the packaged or built app for runtime smoke verification**

Run the app using the chosen release-validation path.
Expected: app starts without preload/bootstrap failure.

- [ ] **Step 4: Review release metadata and remaining warnings**

Check for:
- default Electron icon warnings
- ad-hoc signing warnings
- notarization/signing gaps
- artifact path mismatches

Document any residual external dependency blockers (for example, credentials needed for signing) separately from code blockers.

- [ ] **Step 5: Clean repository state for release candidate**

Verify the release candidate is on a clean committed revision before tagging or shipping.

- [ ] **Step 6: Commit any final doc-only adjustments**

```bash
git add README.md .github/workflows/build.yaml package.json dist-notes.md 2>/dev/null || true
git commit -m "docs: finalize release validation guidance"
```

---

## Verification Commands

Run these after each relevant task and again at the end:

```bash
npm test
npm run build
npm run package
find dist -maxdepth 3 -type f | sort
```

For task-specific red/green checks, use targeted Vitest commands for the new unit tests before broadening to the full suite.

## Expected External Dependencies / Human Inputs

- macOS signing/notarization credentials may be required to fully close the macOS release blocker.
- Windows signing may also require external credentials/policy, depending on release requirements.
- If sandboxing breaks preload/runtime behavior, the exact incompatibility must be captured and intentionally resolved rather than bypassed silently.

## Definition of Done

This plan is complete only when:
- packaged release artifacts are produced and collected correctly
- SSH no longer disables host authenticity checks by default
- Electron release security defaults are tightened or any exception is explicitly justified with evidence
- packaged-app smoke validation exists and passes
- release validation runs from a clean committed revision
