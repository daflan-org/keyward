# Keyward

Cross-platform, user-scoped secure key-value storage with codegen.

Native implementations for iOS (Keychain), Android (Keystore + EncryptedSharedPreferences), and Web (IndexedDB). A single JSON config defines all storage keys with their scope; a codegen CLI generates type-safe accessors for TypeScript, Swift, and Java.

## The Problem

Every existing secure storage solution uses global keys. When User A signs out and User B signs in on the same device, User B can access User A's data. Account deletion requires manually enumerating every key.

## The Solution

Keyward prefixes every key with a scope:

```
u/{userId}/auth_token        # User-scoped
d/installation_id            # Device-scoped
language                     # Global
```

Switch users with `setUserId()`. Wipe a user with `wipeUser(userId)`. Zero manual enumeration, zero missed keys.

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

```bash
# Install
yarn add @keyward/capacitor @keyward/codegen

# Define keys
cat > keyward.keys.json << 'EOF'
{
  "output": { "ts": "src/generated/KeywardKeys.ts" },
  "keys": {
    "AUTH_TOKEN": { "key": "auth_token", "scope": "user" },
    "THEME":     { "key": "theme", "scope": "user" },
    "LANGUAGE":  { "key": "language", "scope": "global" }
  }
}
EOF

# Generate
npx keyward-codegen --config keyward.keys.json
```

```typescript
import { createKeyward } from '@keyward/capacitor';
import { KeywardKeys } from './generated/KeywardKeys';

const keyward = createKeyward(Capacitor.getPlatform());

keyward.setUserId(user._id);
await keyward.set(KeywardKeys.AUTH_TOKEN, token);
const theme = await keyward.get(KeywardKeys.THEME);
await keyward.wipeUser(user._id);
```

## Development

```bash
yarn install
yarn build        # Build all packages (turbo)
yarn test         # Run tests (turbo + vitest)
yarn lint         # Lint (turbo + biome)
yarn typecheck    # Type check (turbo + tsc)
```

### Stack

- **Monorepo:** Yarn 4 + Turborepo
- **Build:** tsup (ESM + CJS dual output)
- **Lint/Format:** Biome
- **Test:** Vitest
- **Types:** TypeScript 6 (strict)

## License

[MIT](LICENSE)
