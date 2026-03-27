# Keyward

Cross-platform, user-scoped secure key-value storage with codegen.

Native implementations for iOS (Keychain), Android (Keystore + EncryptedSharedPreferences), and Web (IndexedDB). A single JSON config defines all storage keys with their scope; a codegen CLI generates type-safe accessors for TypeScript, Swift, and Java.

## Why Keyward?

Every existing secure storage solution uses global keys:

```
auth_token = "jwt..."           # Which user's token?
e2ee_private_key = "abc..."     # Which user's key?
```

When User A signs out and User B signs in on the same device, User B can see User A's data. Account deletion requires manually enumerating every key.

Keyward solves this with scoped key prefixes:

```
u/507f1f/auth_token             # User 507f1f's token
u/507f1f/e2ee_private_key       # User 507f1f's key
d/installation_id               # This device's ID
language                        # Global app setting
```

Switch users with `setUserId()`. Wipe a user with `wipeUser(userId)`. Zero manual enumeration, zero missed keys.

### No Equivalent Exists

| Existing Solution | Limitation |
|---|---|
| expo-secure-store | Expo-locked, no web, no user scoping |
| react-native-keychain | RN-locked, no web, no user scoping |
| @capacitor-community/secure-storage | Capacitor-locked, no user scoping |
| Infisical, dotenv-vault | Server/CI only, no client-side runtime delivery |

Keyward is **framework-agnostic**, **cross-platform**, and provides **user-scoped key isolation** out of the box.

## Packages

| Package | Description | Registry |
|---|---|---|
| `@keyward/core` | Shared types, Scope enum, KeyRegistry | npm |
| `@keyward/platform-web` | IndexedDB backend + Keyward class | npm |
| `@keyward/codegen` | CLI to generate type-safe key accessors | npm |
| `@keyward/capacitor` | Capacitor plugin bridge | npm |
| `platform-ios` | Swift Keychain implementation | SPM |
| `platform-android` | Java Keystore implementation | Maven |

## Quick Start

### 1. Install

```bash
yarn add @keyward/capacitor @keyward/codegen
npx cap sync
```

### 2. Define Keys

Create `keyward.keys.json` in your project root:

```json
{
  "output": {
    "ts": "src/generated/KeywardKeys.ts",
    "swift": "ios/App/Generated/KeywardKeys.swift"
  },
  "keys": {
    "AUTH_TOKEN":    { "key": "auth_token", "scope": "user" },
    "THEME":         { "key": "theme", "scope": "user" },
    "INSTALL_ID":    { "key": "installation_id", "scope": "device" },
    "LANGUAGE":      { "key": "language", "scope": "global" },
    "FAMILY_KEY":    { "key": "family.{familyId}.key", "scope": "user" }
  }
}
```

### 3. Generate

```bash
npx keyward-codegen --config keyward.keys.json
```

This generates type-safe accessors. Dynamic keys like `{familyId}` become function parameters.

### 4. Use

```typescript
import { createKeyward } from '@keyward/capacitor';
import { KeywardKeys } from './generated/KeywardKeys';

const keyward = createKeyward(Capacitor.getPlatform());

// Set active user
keyward.setUserId(user._id);

// Read/write scoped keys
await keyward.set(KeywardKeys.AUTH_TOKEN, token);
const theme = await keyward.get(KeywardKeys.THEME);

// Dynamic keys
await keyward.set(KeywardKeys.FAMILY_KEY('fam_123'), encryptedKey);

// Wipe all data for a user
await keyward.wipeUser(user._id);
```

### Scope Model

| Scope | Prefix | Use case |
|---|---|---|
| `user` | `u/{userId}/` | Auth tokens, encryption keys, preferences |
| `device` | `d/` | Installation ID, device fingerprint |
| `global` | _(none)_ | Language, onboarding flag, API base URL |

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
- [ ] `@keyward/core` implementation
- [ ] `@keyward/platform-web` implementation
- [ ] `platform-ios` implementation
- [ ] `platform-android` implementation
- [ ] `@keyward/codegen` CLI
- [ ] `@keyward/capacitor` bridge
- [ ] First release (v0.1.0)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, code style, and branch naming conventions.

## License

[MIT](LICENSE)
