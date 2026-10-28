---
name: bdd-bun-test
description: >
  BDD-first testing with bun:test in this repository — scenario-oriented examples,
  describe/it layout rules, library-integration testing, and no Cucumber. Use when
  writing or changing tests, adding fixtures, mocking libraries, or when the user
  mentions BDD, TDD, bun:test, or Vitest.
---

# BDD and bun:test

Prefer **BDD**: concrete examples of desired behaviour first, then implement until they pass. Same red → green → **refactor** rhythm as TDD, oriented around user-facing outcomes.

- **BDD** — scenarios and outcomes from the outside
- **TDD** — isolated units/edges inside an implementation
- Use both when helpful. No Cucumber/Gherkin runners — use `bun:test` / `bun test`
- **Refactor is required** after green: clean structure while tests lock behaviour
- Component tests use `bun:test` (not Vitest). Mocks: Bun’s Vitest-compatible APIs from `bun:test`

## Test files

- `describe` / `it` from `bun:test` (not `test`). Table-drive with `describe.each` / `it.each`
- At least one root `describe`; **all** declarations (constants, fixtures, helpers) live inside it
- Module load must be side-effect free (imports only at top level)
- Expensive/async setup: `beforeAll` / `beforeEach` inside the relevant `describe`
- Shared helpers: `test/support/` modules that **export functions**, not eagerly computed values

## Testing library code

- Assert **our** behaviour; do not re-test a library’s full edge matrix — a few happy paths plus one or two errors for the integration are enough
- Prefer the real library; mock only when slow or networked
- Before relying on a library, read source/tests under `repos/`
- Library bugs → record them in the project docs (version, repro, expected vs actual), not ever-growing local coverage of the dependency

See also: `repo-conventions`.
