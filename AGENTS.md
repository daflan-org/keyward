# Agents

Instructions for AI coding agents working on this repository.

## Project Overview

Keyward is a cross-platform secure key-value storage library with built-in user scoping. This monorepo contains TypeScript packages (core, platform-web, codegen, capacitor) and native platform packages (iOS/Swift, Android/Java).

## Setup

```bash
corepack enable
yarn install
yarn build
```

Node.js 22+ and Yarn 4 are required. Yarn is managed via corepack.

## Monorepo Structure

```
packages/
  core/              Zero-dependency shared types (Scope, StorageKeyDef, KeyRegistry)
  platform-web/      IndexedDB backend + Keyward class (depends on core)
  codegen/           CLI code generator for TS/Swift/Java (depends on core)
  capacitor/         Capacitor plugin bridge (depends on core + platform-web)
  platform-ios/      Pure Swift library (SPM, independent)
  platform-android/  Pure Java library (Maven, independent)
```

`core` is the foundation. Changes to its public API affect all downstream packages.

## Build and Test

| Command | Scope | Description |
|---|---|---|
| `yarn build` | all | Build all packages via Turborepo |
| `yarn test` | all | Run all tests via Vitest |
| `yarn lint` | all | Lint via Biome |
| `yarn typecheck` | all | TypeScript type checking |
| `yarn build --filter=@daflan/keyward-core` | single | Build one package |
| `yarn test --filter=@daflan/keyward-codegen` | single | Test one package |

Always run `yarn build` before `yarn test` (tests depend on built output from upstream packages).

## Code Conventions

### TypeScript

- **Strict mode** with `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, and `verbatimModuleSyntax` enabled
- Use `import type { ... }` for type-only imports (enforced by Biome `useImportType` rule)
- `Scope` from `@daflan/keyward-core` is a value import (it is an enum), not a type import
- Single quotes, trailing commas, semicolons, 2-space indent, 100-char line width
- No `any` types (`noExplicitAny: error`)
- No unused imports or variables (Biome errors, not warnings)
- Use `node:` protocol for Node.js built-in imports (`useNodejsImportProtocol: error`)
- Biome handles both formatting and linting. Run `yarn check:fix` to auto-fix.

### Package Pattern

Every TypeScript package follows this structure:

```
packages/{name}/
  package.json          dual ESM+CJS exports, "type": "module"
  tsconfig.json         extends ../../tsconfig.base.json
  tsup.config.ts        entry, format: ['esm', 'cjs'], dts: true
  vitest.config.ts      globals: true, include: src/**/*.test.ts
  src/
    index.ts            public exports
    *.ts                implementation
    *.test.ts           co-located tests
    vitest-env.d.ts     /// <reference types="vitest/globals" />
```

Tests are co-located with source files, not in a separate `__tests__/` directory.

### Testing

- Vitest with `globals: true` (no need to import `describe`, `it`, `expect`)
- Tests must pass with `yarn test`
- Add tests for new functionality
- Use `--passWithNoTests` in package scripts for packages with no tests yet

## Branch and Commit Rules

All branches, commits, and PR titles must reference a GitHub issue key in `KW-N` format. This is enforced by CI and local git hooks.

- **Branch naming:** `type/KW-N-kebab-description` (e.g., `feat/KW-4-codegen`)
- **Valid types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`
- **Commit messages:** Must contain `KW-N` somewhere in the message
- **PR titles:** Must contain `KW-N` somewhere in the title

The commit-msg hook is installed automatically via `yarn install` (configured in `.githooks/`).

## Key Design Decisions

- **No external CLI framework** in codegen: uses `node:util` `parseArgs` (stable in Node 22+)
- **Templates are pure functions:** `(ParsedConfig) => string`, no side effects, no filesystem access
- **Scope mapping uses `Record<Scope, string>`** maps, not switch statements
- **`PARAM_REGEX`** (`/\{([a-zA-Z][a-zA-Z0-9]*)\}/g`) is the single source of truth for `{param}` detection, exported from `parser.ts` and reused by all templates
- **Config output field** `kotlin` maps to Java output (the field name is intentional for JVM target path configuration)

## Common Pitfalls

- `noUncheckedIndexedAccess` means `Record<string, X>` index access returns `X | undefined`. Use `Object.entries()` or explicit undefined checks.
- Biome's `noConsole` rule is `warn` level. CLI entrypoints that need `console.log` should use `biome-ignore` comments.
- Biome's `organizeImports` rule enforces import order. Run `yarn lint:fix` to auto-sort.
- `tsup` with array config: the first entry should have `clean: true`, subsequent entries `clean: false` to avoid wiping each other's output.
