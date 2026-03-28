# @keyward/codegen

CLI tool that generates type-safe storage key accessors from a single `keyward.keys.json` config file. Outputs for TypeScript, Swift, and Java from one source of truth.

## Install

```bash
yarn add -D @keyward/codegen
```

## Usage

### 1. Create Config

Create `keyward.keys.json` in your project root:

```json
{
  "output": {
    "ts": "src/generated/KeywardKeys.ts",
    "swift": "ios/App/Generated/KeywardKeys.swift",
    "kotlin": "android/app/src/main/java/generated/KeywardKeys.java"
  },
  "keys": {
    "AUTH_TOKEN":       { "key": "auth_token", "scope": "user" },
    "THEME":            { "key": "theme", "scope": "user" },
    "INSTALL_ID":       { "key": "installation_id", "scope": "device" },
    "LANGUAGE":         { "key": "language", "scope": "global" },
    "FAMILY_KEY":       { "key": "family.{familyId}.key", "scope": "user" },
    "FAMILY_KEY_VER":   { "key": "family.{familyId}.key.{version}", "scope": "user" }
  }
}
```

### 2. Run

```bash
npx keyward-codegen --config keyward.keys.json
```

### Generated Output

#### TypeScript

```typescript
import { Scope, type StorageKeyDef } from '@keyward/core';

export const KeywardKeys = {
  AUTH_TOKEN: { key: 'auth_token', scope: Scope.User } as const satisfies StorageKeyDef,
  THEME: { key: 'theme', scope: Scope.User } as const satisfies StorageKeyDef,
  INSTALL_ID: { key: 'installation_id', scope: Scope.Device } as const satisfies StorageKeyDef,
  LANGUAGE: { key: 'language', scope: Scope.Global } as const satisfies StorageKeyDef,

  FAMILY_KEY: (familyId: string): StorageKeyDef =>
    ({ key: `family.${familyId}.key`, scope: Scope.User }),
  FAMILY_KEY_VER: (familyId: string, version: string): StorageKeyDef =>
    ({ key: `family.${familyId}.key.${version}`, scope: Scope.User }),
} as const;
```

#### Swift

```swift
import Keyward

public enum KeywardKeys {
    public static let authToken = KeyDef(key: "auth_token", scope: .user)
    public static let theme = KeyDef(key: "theme", scope: .user)
    public static let installId = KeyDef(key: "installation_id", scope: .device)
    public static let language = KeyDef(key: "language", scope: .global)

    public static func familyKey(_ familyId: String) -> KeyDef {
        KeyDef(key: "family.\(familyId).key", scope: .user)
    }
    public static func familyKeyVer(_ familyId: String, _ version: String) -> KeyDef {
        KeyDef(key: "family.\(familyId).key.\(version)", scope: .user)
    }
}
```

#### Java

```java
package org.keyward.generated;

import org.keyward.KeyDef;
import org.keyward.Scope;

public final class KeywardKeys {
    public static final KeyDef AUTH_TOKEN = new KeyDef("auth_token", Scope.USER);
    public static final KeyDef THEME = new KeyDef("theme", Scope.USER);
    public static final KeyDef INSTALL_ID = new KeyDef("installation_id", Scope.DEVICE);
    public static final KeyDef LANGUAGE = new KeyDef("language", Scope.GLOBAL);

    public static KeyDef familyKey(String familyId) {
        return new KeyDef("family." + familyId + ".key", Scope.USER);
    }
    public static KeyDef familyKeyVer(String familyId, String version) {
        return new KeyDef("family." + familyId + ".key." + version, Scope.USER);
    }

    private KeywardKeys() {}
}
```

### Dynamic Keys

If a key value contains `{paramName}`, codegen generates a factory function instead of a constant. Parameters become typed function arguments in all target languages.

## CLI Options

```
--config <path>     Path to keyward.keys.json (required)
--ts <path>         Override TypeScript output path
--swift <path>      Override Swift output path
--kotlin <path>     Override Kotlin output path
--dry-run           Print generated code without writing files
--validate          Validate config only, no output
```

## License

[MIT](../../LICENSE)
