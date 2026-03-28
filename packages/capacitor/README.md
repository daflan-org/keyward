# @daflan/keyward-capacitor

Capacitor plugin bridge for [Keyward](https://github.com/daflan-org/keyward) secure storage. Uses native Keychain (iOS), Keystore (Android), and IndexedDB (Web) under the hood.

## Install

```bash
yarn add @daflan/keyward-capacitor
npx cap sync
```

## Setup

### 1. Define Keys

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

### 2. Generate

```bash
yarn add -D @daflan/keyward-codegen
npx keyward-codegen --config keyward.keys.json
```

### 3. Use

```typescript
import { createKeyward } from '@daflan/keyward-capacitor';
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

## Scope Model

| Scope | Prefix | Use case |
|---|---|---|
| `user` | `u/{userId}/` | Auth tokens, encryption keys, preferences |
| `device` | `d/` | Installation ID, device fingerprint |
| `global` | _(none)_ | Language, onboarding flag, API base URL |

## How It Works

The Capacitor bridge delegates to native implementations:

- **iOS:** Keychain via `platform-ios` (SPM dependency)
- **Android:** EncryptedSharedPreferences via `platform-android` (Maven dependency)
- **Web:** IndexedDB via `@daflan/keyward-platform-web` (npm dependency)

Scope resolution happens in JavaScript. Native plugins receive already-resolved key strings.

## License

[MIT](../../LICENSE)
