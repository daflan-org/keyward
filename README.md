# Keyward

Secure key management for client-side apps. One SDK across iOS, Android, and Web.

Keyward handles two problems that every mobile and web app faces but no single tool solves today:

1. **On-device secrets have no user isolation.** Existing storage solutions use global keys. When users switch accounts on the same device, data leaks between them.
2. **API keys ship inside your bundle.** Stripe keys, Sentry DSNs, and other secrets get baked into client builds where anyone can extract them.

## Why Keyward?

### Problem 1: User-Scoped Secure Storage

Every secure storage library stores keys globally:

```
auth_token = "jwt..."           # Which user's token?
e2ee_private_key = "abc..."     # Which user's key?
```

User A signs out, User B signs in: User B sees User A's encryption keys. Account deletion requires manually enumerating every key. Nobody builds user isolation because it's "just a prefix" until you need to wipe a user, rotate keys, or support multi-account.

Keyward makes scoping a first-class concept with native implementations (Keychain, Keystore, IndexedDB):

```
u/507f1f/auth_token             # User 507f1f's token
u/507f1f/e2ee_private_key       # User 507f1f's key
d/installation_id               # This device's ID
language                        # Global app setting
```

`setUserId()` to switch context. `wipeUser(userId)` to delete everything for a user. Zero manual enumeration.

### Problem 2: Client-Side API Key Security

Developers put API keys in `.env` files. Build tools bundle them into the app. Anyone with a decompiler or network inspector can extract them. The alternatives are backend proxies (per-API infra overhead) or platform-specific obfuscation (fragile, not cross-platform).

Keyward Cloud (coming soon) delivers secrets at runtime: keys never exist in your bundle. Register them in a dashboard, fetch them on app start via authenticated request, store them in secure storage. Rotate or revoke from the dashboard with zero app updates.

### Nothing Else Does Both

| Existing Solution | Limitation |
|---|---|
| expo-secure-store | Expo-locked, no web, no user scoping |
| react-native-keychain | RN-locked, no web, no user scoping |
| @capacitor-community/secure-storage | Capacitor-locked, no user scoping |
| Infisical, dotenv-vault | Server/CI only, build-time, no mobile runtime delivery |
| AWS KMS, HashiCorp Vault | Infrastructure secrets, not for client-side apps |

Keyward is **framework-agnostic**, **cross-platform**, and provides **user-scoped key isolation** and **runtime secret delivery** from a single SDK.

## Packages

| Package | Description | Registry |
|---|---|---|
| `@daflan/keyward-core` | Shared types, Scope enum, KeyRegistry | npm |
| `@daflan/keyward-platform-web` | IndexedDB backend + Keyward class | npm |
| `@daflan/keyward-codegen` | CLI to generate type-safe key accessors | npm |
| `@daflan/keyward-capacitor` | Capacitor plugin bridge | npm |
| `platform-ios` | Swift Keychain implementation | SPM |
| `platform-android` | Java Keystore implementation | Maven |

## Getting Started

Pick the package for your platform:

| Platform | Install | Guide |
|---|---|---|
| Capacitor (iOS + Android + Web) | `yarn add @daflan/keyward-capacitor` | [packages/capacitor](packages/capacitor/) |
| Web only | `yarn add @daflan/keyward-platform-web` | [packages/platform-web](packages/platform-web/) |
| iOS native (Swift) | SPM: `github.com/daflan-org/keyward` | [packages/platform-ios](packages/platform-ios/) |
| Android native (Java/Kotlin) | Maven: `org.keyward:platform-android` | [packages/platform-android](packages/platform-android/) |

All platforms share the same concepts:

### Scope Model

| Scope | Prefix | Use case |
|---|---|---|
| `user` | `u/{userId}/` | Auth tokens, encryption keys, preferences |
| `device` | `d/` | Installation ID, device fingerprint |
| `global` | _(none)_ | Language, onboarding flag, API base URL |

### Codegen

Define your keys once in `keyward.keys.json`, generate type-safe accessors for every platform. The codegen CLI is distributed via npm but the output is platform-agnostic:

| Ecosystem | Install codegen | Output |
|---|---|---|
| Node (npm/yarn) | `npx @daflan/keyward-codegen --config keyward.keys.json` | TypeScript constants |
| iOS (Swift) | Run via npx or brew (planned) | Swift enum |
| Android (Java/Kotlin) | Run via npx or Gradle task (planned) | Java class |
| Flutter (Dart) | Run via npx or pub (planned) | Dart class |

One config, every language. Dynamic keys (`{familyId}`) become typed function parameters. See [packages/codegen](packages/codegen/) for config format and generated output examples.

## Development

```bash
git clone https://github.com/daflan-org/keyward.git
cd keyward
corepack enable
yarn install
yarn build
yarn test
```

| Command | Description |
|---|---|
| `yarn build` | Build all packages (Turborepo) |
| `yarn test` | Run all tests (Vitest) |
| `yarn lint` | Lint all packages (Biome) |
| `yarn typecheck` | Type check all packages (TypeScript) |
| `yarn check:fix` | Auto-fix lint + format issues |

### Tech Stack

- **Monorepo:** Yarn 4 + Turborepo
- **Build:** tsup (ESM + CJS dual output)
- **Lint/Format:** Biome
- **Test:** Vitest
- **Types:** TypeScript 6 (strict)

### Branch Strategy

GitHub Flow. `main` is always stable. All work in short-lived branches (`feat/`, `fix/`, `chore/`) merged via PR. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Roadmap

- [x] Monorepo setup
- [x] `@daflan/keyward-core` implementation
- [x] `@daflan/keyward-platform-web` implementation
- [x] `platform-ios` implementation
- [x] `platform-android` implementation
- [x] `@daflan/keyward-codegen` CLI
- [x] `@daflan/keyward-capacitor` bridge
- [ ] First release (v0.1.0)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, code style, and branch naming conventions.

## License

[MIT](LICENSE)
