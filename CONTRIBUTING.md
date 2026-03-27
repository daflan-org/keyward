# Contributing to Keyward

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
git clone https://github.com/daflan-org/keyward.git
cd keyward
yarn install
yarn build
yarn test
```

### Prerequisites

- Node.js 22+
- Yarn 4 (via corepack: `corepack enable`)
- For iOS: Xcode 15+
- For Android: Android Studio + JDK 11+

### Commands

| Command | Description |
|---|---|
| `yarn build` | Build all packages |
| `yarn test` | Run all tests |
| `yarn lint` | Lint all packages (Biome) |
| `yarn lint:fix` | Auto-fix lint issues |
| `yarn typecheck` | Type check all packages |
| `yarn check` | Run Biome check (lint + format) |
| `yarn check:fix` | Auto-fix Biome issues |

## How to Contribute

### Reporting Bugs

Use the [Bug Report](https://github.com/daflan-org/keyward/issues/new?template=bug_report.yml) issue template. Include:

- Which package is affected (`@keyward/core`, `@keyward/platform-web`, etc.)
- Steps to reproduce
- Expected vs actual behavior
- Platform and version info

### Suggesting Features

Use the [Feature Request](https://github.com/daflan-org/keyward/issues/new?template=feature_request.yml) issue template.

### Submitting Code

1. Fork the repo and create a branch from `main`
2. If you added code, add tests
3. Ensure `yarn build`, `yarn test`, and `yarn lint` pass
4. Write a clear PR description using the PR template
5. Submit your pull request

### Commit Messages

Write clear, concise commit messages. Use present tense ("add feature" not "added feature"). Focus on why, not what.

Good:
- `add wipeUser support for device-scoped keys`
- `fix KeyRegistry crash when userId contains slashes`

Bad:
- `update code`
- `fix bug`

## Code Style

- **Biome** handles formatting and linting. Run `yarn check:fix` before committing.
- Use `type` imports for type-only imports (`import type { Foo }`)
- Prefer `const` over `let`
- No `any` types
- Single quotes, trailing commas, semicolons

## Project Structure

```
packages/
  core/            # Shared types, Scope enum, KeyRegistry (zero deps)
  platform-web/    # IndexedDB backend (depends on core)
  platform-ios/    # Swift Keychain implementation
  platform-android/# Java Keystore implementation
  codegen/         # CLI code generator (depends on core)
  capacitor/       # Capacitor bridge (depends on core + platform-web)
```

Changes to `core` affect all downstream packages. Be careful with breaking changes.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
