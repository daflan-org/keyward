# Keyward: Cross-Platform User-Scoped Secure Storage

**Domain:** keyward.org (available)
**GitHub:** github.com/daflan-org/keyward
**npm:** @keyward/platform-web, @keyward/codegen, @keyward/capacitor
**SPM:** github.com/daflan-org/keyward (platform-ios)
**Maven:** org.keyward:platform-android (GitHub Packages)
**License:** MIT (open-source core, commercial cloud layer planned)

---

## What This Is

A cross-platform secure key-value storage library with built-in user scoping. No framework dependency. Native implementations for iOS (Keychain), Android (Keystore + EncryptedSharedPreferences), and Web (IndexedDB + Web Crypto API). A single JSON config file defines all storage keys with their scope; a codegen CLI generates type-safe accessors for TypeScript, Swift, Java, and (future) Dart.

No equivalent open-source product exists. Existing solutions are either framework-locked (Capacitor plugins, React Native modules, Expo SecureStore) or single-platform. None provide user-scoped key isolation, cross-platform codegen, or a unified API surface.

---

## Why This Exists

### The Problem

Mobile and web apps persist sensitive data (auth tokens, encryption keys, preferences) on device. Every existing solution stores this data with global keys:

```
auth_token = "jwt..."           # Which user's token?
e2ee_private_key = "abc..."     # Which user's key?
theme = "dark"                  # Which user's preference?
```

When User A signs out and User B signs in on the same device:
- User B sees User A's encryption keys
- User B's background sync might use User A's auth token
- Account deletion requires manually enumerating every key to clean up

### The Solution

Keyward prefixes every key with a user/device/global scope:

```
u/507f1f/auth_token = "jwt..."          # User 507f1f's token
u/507f1f/e2ee_private_key = "abc..."    # User 507f1f's key
u/507f1f/theme = "dark"                 # User 507f1f's preference
d/installation_id = "xyz..."            # This device's ID
language = "en"                         # Global app setting
```

Switching users: `keyward.setUserId("newUser")` and all reads/writes resolve to the new user's namespace. Deleting an account: `keyward.wipeUser("507f1f")` scans all keys with `u/507f1f/` prefix and deletes them. Zero manual enumeration, zero missed keys.

### Competitive Landscape

| Product | What it does | What it lacks |
|---|---|---|
| AWS KMS | Server-side key management | No client SDK, no mobile, no user scoping |
| HashiCorp Vault | Infrastructure secrets | Not for mobile/web app developers |
| 1Password | Consumer password manager | Not a developer SDK |
| Virgil/Twilio E2EE | Messaging E2EE SDK | Locked to messaging, not generic storage |
| Firebase Auth | Token management | No encryption key management |
| expo-secure-store | Mobile secure storage | Expo-locked, no web, no user scoping |
| react-native-keychain | RN secure storage | RN-locked, no web, no user scoping |
| @capacitor-community/secure-storage | Capacitor secure storage | Capacitor-locked, no user scoping |
| @ionic/secure-storage | Encrypted storage | Paid, Ionic-locked |
| Infisical | Open-source secret management | Server/CI only, no client-side runtime delivery, no mobile |
| dotenv / dotenv-vault | Env file management | Build-time only, keys end up in bundle, no secure runtime delivery |
| **Keyward** | Cross-platform, user-scoped, codegen + cloud key delivery | This is the gap we fill |

---

## Scope Model

Three scopes, applied as key prefixes:

| Scope | Prefix | Meaning | Example |
|---|---|---|---|
| `Scope.User` | `u/{userId}/` | Belongs to a specific authenticated user | Auth tokens, E2EE keys, theme preference |
| `Scope.Device` | `d/` | Belongs to the physical device, shared across users | Installation ID, device fingerprint |
| `Scope.Global` | _(no prefix)_ | App-level setting, survives user wipe | Language, API base URL, onboarding flag |

Key resolution is internal. Callers never construct prefixed strings.

---

## Architecture

### Package Structure

```
keyward/                            # Monorepo root (Yarn 4 + Turborepo)
  packages/
    core/                           # Platform-agnostic shared types + logic
      package.json                  # npm: @keyward/core
      src/
        index.ts                    # Public exports
        types.ts                    # Scope, StorageKeyDef, KeywardBackend
        KeyRegistry.ts              # Resolves scoped keys (prefix logic)

    platform-ios/                   # Pure Swift library
      Package.swift                 # SPM manifest (publish via git tag)
      Sources/Keyward/
        Keyward.swift               # Keychain CRUD operations
        KeyRegistry.swift           # Resolves scoped keys (Swift port of core logic)
        Scope.swift                 # enum Scope { case user, device, global }
        KeyDef.swift                # struct KeyDef { key: String, scope: Scope }

    platform-android/               # Pure Java library
      build.gradle                  # Maven publish (GitHub Packages)
      src/main/java/org/keyward/
        Keyward.java                # Keystore + EncryptedSharedPrefs CRUD
        KeyRegistry.java            # Resolves scoped keys (Java port of core logic)
        Scope.java                  # enum Scope { USER, DEVICE, GLOBAL }
        KeyDef.java                 # class KeyDef { String key; Scope scope; }

    platform-web/                   # Web storage backend (depends on core)
      package.json                  # npm: @keyward/platform-web
      src/
        index.ts                    # Re-exports core + web-specific exports
        Keyward.ts                  # Main class: get/set/remove/wipeUser
        IndexedDBBackend.ts         # IndexedDB wrapper (uses idb, ~1KB)

    codegen/                        # CLI tool (depends on core for Scope enum)
      package.json                  # npm: @keyward/codegen
      src/
        cli.ts                      # npx keyward-codegen --config keyward.keys.json
        parser.ts                   # JSON parser + {param} detection
        templates/
          typescript.ts
          swift.ts
          java.ts
          dart.ts                   # Future

    capacitor/                      # Capacitor bridge (depends on core + platform-web)
      package.json                  # npm: @keyward/capacitor
      src/
        index.ts                    # registerPlugin + Keyward class
        definitions.ts              # Plugin interface
      ios/
        KeywardPlugin.swift         # CAPPlugin -> Keyward.swift calls (~30 lines)
      android/
        KeywardPlugin.java          # Plugin -> Keyward.java calls (~30 lines)
```

### Dependency Graph

```
                    CORE LAYER (zero dependencies, platform-agnostic)

         core (npm: @keyward/core)
         Scope enum, StorageKeyDef, KeywardBackend interface, KeyRegistry
              |
              |
                    PLATFORM LAYER (depends on core, published independently)
              |
         platform-ios              platform-android           platform-web
         (SPM, Swift)              (Maven, Java)              (npm, depends on core)
         iOS Keychain              Android Keystore            IndexedDB + WebCrypto
              |                         |                           |
              |                         |                           |
                    BRIDGE LAYER (framework-specific, depends on core + platform)
              |                         |                           |
              +----------- capacitor (npm) ------------------------+
              |            iOS: SPM dep on platform-ios             |
              |            Android: Maven dep on platform-android   |
              |            Web: npm dep on platform-web             |
              |                                                     |
              +----------- dart (pub.dev, future) ------------------+
              |            iOS: SPM dep on platform-ios             |
              |            Android: Maven dep on platform-android   |
              |                                                     |
              +----------- react-native (npm, future) -------------+
                           iOS: SPM dep on platform-ios
                           Android: Maven dep on platform-android


                    CODEGEN (depends on core for Scope enum)

         codegen (npm)
         Reads: keyward.keys.json (app-provided)
         Writes: KeywardKeys.ts, KeywardKeys.swift, KeywardKeys.java
```

### Who Downloads What

| Developer | Package | Registry |
|---|---|---|
| Capacitor app | `@keyward/capacitor` | npm (native deps via SPM+Maven) |
| Pure iOS app (SwiftUI) | `Keyward` | SPM (GitHub) |
| Pure Android app (Kotlin) | `org.keyward:platform-android` | Maven (GitHub Packages) |
| Web-only app | `@keyward/platform-web` | npm |
| Flutter app (future) | `keyward` | pub.dev (native deps via SPM+Maven) |
| Any app (codegen) | `@keyward/codegen` | npm |

---

## JSON Config: keyward.keys.json

Lives in the consumer app's root. Single source of truth for all storage keys across all platforms.

```json
{
  "output": {
    "ts": "src/generated/KeywardKeys.ts",
    "swift": "ios/App/Generated/KeywardKeys.swift",
    "kotlin": "android/app/src/main/java/generated/KeywardKeys.java"
  },
  "keys": {
    "AUTH_TOKEN":                    { "key": "auth.access_token", "scope": "user" },
    "E2EE_PRIVATE_KEY":              { "key": "e2ee.private_key", "scope": "user" },
    "E2EE_PUBLIC_KEY":               { "key": "e2ee.public_key", "scope": "user" },
    "ONESIGNAL_SUBSCRIPTION_ID":     { "key": "onesignal.subscription_id", "scope": "user" },
    "THEME_MODE":                    { "key": "theme_mode", "scope": "user" },
    "E2EE_STATE":                    { "key": "e2ee.state", "scope": "user" },
    "CURRENT_USER_ID":               { "key": "current_user_id", "scope": "device" },
    "INSTALLATION_ID":               { "key": "installation_id", "scope": "device" },
    "LANGUAGE":                      { "key": "language", "scope": "global" },
    "ONBOARDING_COMPLETED":          { "key": "onboarding_completed", "scope": "global" },
    "FAMILY_KEY":                    { "key": "family.{familyId}.key", "scope": "user" },
    "FAMILY_KEY_VERSION":            { "key": "family.{familyId}.version", "scope": "user" },
    "FAMILY_KEY_VERSIONED":          { "key": "family.{familyId}.key.{version}", "scope": "user" }
  }
}
```

### Dynamic Keys

If a key's value contains `{paramName}`, codegen auto-generates a factory function. Parameters become typed function arguments.

`"family.{familyId}.key"` -> `KeywardKeys.familyKey(familyId: string)`
`"family.{familyId}.key.{version}"` -> `KeywardKeys.familyKeyVersioned(familyId: string, version: string)`

---

## Codegen Output

### TypeScript
```typescript
// AUTO-GENERATED by @keyward/codegen. DO NOT EDIT.
import { Scope, type StorageKeyDef } from '@keyward/platform-web';

export const KeywardKeys = {
  AUTH_TOKEN: { key: "auth.access_token", scope: Scope.User } as const satisfies StorageKeyDef,
  E2EE_PRIVATE_KEY: { key: "e2ee.private_key", scope: Scope.User } as const satisfies StorageKeyDef,
  CURRENT_USER_ID: { key: "current_user_id", scope: Scope.Device } as const satisfies StorageKeyDef,
  LANGUAGE: { key: "language", scope: Scope.Global } as const satisfies StorageKeyDef,

  FAMILY_KEY: (familyId: string): StorageKeyDef =>
    ({ key: `family.${familyId}.key`, scope: Scope.User }),
  FAMILY_KEY_VERSIONED: (familyId: string, version: string): StorageKeyDef =>
    ({ key: `family.${familyId}.key.${version}`, scope: Scope.User }),
} as const;
```

### Swift
```swift
// AUTO-GENERATED by @keyward/codegen. DO NOT EDIT.
import Keyward

public enum KeywardKeys {
    public static let authToken = KeyDef(key: "auth.access_token", scope: .user)
    public static let e2eePrivateKey = KeyDef(key: "e2ee.private_key", scope: .user)
    public static let currentUserId = KeyDef(key: "current_user_id", scope: .device)
    public static let language = KeyDef(key: "language", scope: .global)

    public static func familyKey(_ familyId: String) -> KeyDef {
        KeyDef(key: "family.\(familyId).key", scope: .user)
    }
    public static func familyKeyVersioned(_ familyId: String, _ version: String) -> KeyDef {
        KeyDef(key: "family.\(familyId).key.\(version)", scope: .user)
    }
}
```

### Java
```java
// AUTO-GENERATED by @keyward/codegen. DO NOT EDIT.
package org.keyward.generated;

import org.keyward.KeyDef;
import org.keyward.Scope;

public final class KeywardKeys {
    public static final KeyDef AUTH_TOKEN = new KeyDef("auth.access_token", Scope.USER);
    public static final KeyDef E2EE_PRIVATE_KEY = new KeyDef("e2ee.private_key", Scope.USER);
    public static final KeyDef CURRENT_USER_ID = new KeyDef("current_user_id", Scope.DEVICE);
    public static final KeyDef LANGUAGE = new KeyDef("language", Scope.GLOBAL);

    public static KeyDef familyKey(String familyId) {
        return new KeyDef("family." + familyId + ".key", Scope.USER);
    }
    public static KeyDef familyKeyVersioned(String familyId, String version) {
        return new KeyDef("family." + familyId + ".key." + version, Scope.USER);
    }

    private KeywardKeys() {}
}
```

---

## Platform Implementations

### iOS: Keychain (platform-ios)

```swift
public final class Keyward {
    private static let service = "keyward"

    public static func set(_ keyDef: KeyDef, value: String, registry: KeyRegistry) throws {
        let resolvedKey = registry.resolve(keyDef)
        let data = value.data(using: .utf8)!
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: resolvedKey,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock,
            kSecAttrSynchronizable as String: kCFBooleanFalse!
        ]
        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else { throw KeywardError.keychainWrite(status) }
    }

    public static func get(_ keyDef: KeyDef, registry: KeyRegistry) -> String? {
        let resolvedKey = registry.resolve(keyDef)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: resolvedKey,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    public static func remove(_ keyDef: KeyDef, registry: KeyRegistry) {
        let resolvedKey = registry.resolve(keyDef)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: resolvedKey
        ]
        SecItemDelete(query as CFDictionary)
    }

    public static func keys() -> [String] {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecReturnAttributes as String: true,
            kSecMatchLimit as String: kSecMatchLimitAll
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let items = result as? [[String: Any]] else { return [] }
        return items.compactMap { $0[kSecAttrAccount as String] as? String }
    }

    public static func wipeUser(_ userId: String) {
        let prefix = "u/\(userId)/"
        for key in keys() where key.hasPrefix(prefix) {
            let query: [String: Any] = [
                kSecClass as String: kSecClassGenericPassword,
                kSecAttrService as String: service,
                kSecAttrAccount as String: key
            ]
            SecItemDelete(query as CFDictionary)
        }
    }
}
```

### Android: Keystore + EncryptedSharedPreferences (platform-android)

```java
public final class Keyward {
    private static final String PREFS_NAME = "keyward_secure_storage";
    private static EncryptedSharedPreferences prefs;

    public static void init(Context context) {
        MasterKey masterKey = new MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build();
        prefs = (EncryptedSharedPreferences) EncryptedSharedPreferences.create(
            context, PREFS_NAME, masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        );
    }

    public static void set(KeyDef keyDef, String value, KeyRegistry registry) {
        prefs.edit().putString(registry.resolve(keyDef), value).apply();
    }

    public static String get(KeyDef keyDef, KeyRegistry registry) {
        return prefs.getString(registry.resolve(keyDef), null);
    }

    public static void remove(KeyDef keyDef, KeyRegistry registry) {
        prefs.edit().remove(registry.resolve(keyDef)).apply();
    }

    public static Set<String> keys() {
        return prefs.getAll().keySet();
    }

    public static void wipeUser(String userId) {
        String prefix = "u/" + userId + "/";
        SharedPreferences.Editor editor = prefs.edit();
        for (String key : keys()) {
            if (key.startsWith(prefix)) editor.remove(key);
        }
        editor.apply();
    }
}
```

### Web: IndexedDB (platform-web)

```typescript
import { openDB, type IDBPDatabase } from 'idb';

export class IndexedDBBackend implements KeywardBackend {
  private dbName = "keyward";
  private storeName = "kv";
  private db: IDBPDatabase | null = null;

  private async getDB(): Promise<IDBPDatabase> {
    if (!this.db) {
      this.db = await openDB(this.dbName, 1, {
        upgrade(db) { db.createObjectStore("kv"); },
      });
    }
    return this.db;
  }

  async get(resolvedKey: string): Promise<string | null> {
    const db = await this.getDB();
    return (await db.get(this.storeName, resolvedKey)) ?? null;
  }

  async set(resolvedKey: string, value: string): Promise<void> {
    const db = await this.getDB();
    await db.put(this.storeName, value, resolvedKey);
  }

  async remove(resolvedKey: string): Promise<void> {
    const db = await this.getDB();
    await db.delete(this.storeName, resolvedKey);
  }

  async keys(): Promise<string[]> {
    const db = await this.getDB();
    return (await db.getAllKeys(this.storeName)) as string[];
  }

  async clear(): Promise<void> {
    const db = await this.getDB();
    await db.clear(this.storeName);
  }
}
```

---

## Core Types

```typescript
export enum Scope {
  User = "user",
  Device = "device",
  Global = "global",
}

export interface StorageKeyDef {
  readonly key: string;
  readonly scope: Scope;
}

export interface KeywardBackend {
  get(resolvedKey: string): Promise<string | null>;
  set(resolvedKey: string, value: string): Promise<void>;
  remove(resolvedKey: string): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
}
```

---

## Keyward Class (platform-web)

```typescript
export class Keyward {
  private registry = new KeyRegistry();
  private backend: KeywardBackend;

  constructor(backend: KeywardBackend) {
    this.backend = backend;
  }

  setUserId(userId: string): void { this.registry.setUserId(userId); }
  clearUserId(): void { this.registry.clearUserId(); }
  getUserId(): string | null { return this.registry.getUserId(); }

  async get(keyDef: StorageKeyDef): Promise<string | null> {
    return this.backend.get(this.registry.resolve(keyDef));
  }

  async set(keyDef: StorageKeyDef, value: string): Promise<void> {
    return this.backend.set(this.registry.resolve(keyDef), value);
  }

  async remove(keyDef: StorageKeyDef): Promise<void> {
    return this.backend.remove(this.registry.resolve(keyDef));
  }

  async wipeUser(userId: string): Promise<void> {
    const prefix = this.registry.getUserPrefix(userId);
    const allKeys = await this.backend.keys();
    await Promise.all(allKeys.filter(k => k.startsWith(prefix)).map(k => this.backend.remove(k)));
  }
}
```

---

## KeyRegistry

```typescript
export class KeyRegistry {
  private currentUserId: string | null = null;

  setUserId(userId: string): void { this.currentUserId = userId; }
  clearUserId(): void { this.currentUserId = null; }
  getUserId(): string | null { return this.currentUserId; }

  resolve(keyDef: StorageKeyDef): string {
    switch (keyDef.scope) {
      case Scope.User:
        if (!this.currentUserId) throw new Error("Keyward: userId not set.");
        return `u/${this.currentUserId}/${keyDef.key}`;
      case Scope.Device:
        return `d/${keyDef.key}`;
      case Scope.Global:
        return keyDef.key;
    }
  }

  getUserPrefix(userId: string): string { return `u/${userId}/`; }
}
```

---

## Capacitor Bridge

### TypeScript
```typescript
import { registerPlugin } from '@capacitor/core';
import { Keyward, IndexedDBBackend, type KeywardBackend } from '@keyward/platform-web';

interface KeywardNativePlugin {
  get(options: { key: string }): Promise<{ value: string | null }>;
  set(options: { key: string; value: string }): Promise<void>;
  remove(options: { key: string }): Promise<void>;
  keys(): Promise<{ keys: string[] }>;
  clear(): Promise<void>;
}

const NativePlugin = registerPlugin<KeywardNativePlugin>('Keyward');

export function createKeyward(platform: 'ios' | 'android' | 'web'): Keyward {
  if (platform === 'web') {
    return new Keyward(new IndexedDBBackend());
  }
  return new Keyward({
    get: async (key) => (await NativePlugin.get({ key })).value ?? null,
    set: async (key, value) => NativePlugin.set({ key, value }),
    remove: async (key) => NativePlugin.remove({ key }),
    keys: async () => (await NativePlugin.keys()).keys,
    clear: async () => NativePlugin.clear(),
  } satisfies KeywardBackend);
}
```

### iOS Plugin (~30 lines)
```swift
import Capacitor
import Keyward

@objc(KeywardPlugin)
public class KeywardPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "KeywardPlugin"
    public let jsName = "Keyward"

    @objc func get(_ call: CAPPluginCall) {
        let key = call.getString("key") ?? ""
        call.resolve(["value": Keyward.getRaw(key: key) as Any])
    }
    @objc func set(_ call: CAPPluginCall) {
        try? Keyward.setRaw(key: call.getString("key") ?? "", value: call.getString("value") ?? "")
        call.resolve()
    }
    @objc func remove(_ call: CAPPluginCall) {
        Keyward.removeRaw(key: call.getString("key") ?? "")
        call.resolve()
    }
    @objc func keys(_ call: CAPPluginCall) {
        call.resolve(["keys": Keyward.keys()])
    }
    @objc func clear(_ call: CAPPluginCall) {
        Keyward.clearAll()
        call.resolve()
    }
}
```

Note: Bridge receives already-resolved key strings from JS. Scope resolution happens in the JS Keyward class.

---

## Codegen CLI

### Usage
```bash
npx @keyward/codegen --config keyward.keys.json
```

### Options
```
--config <path>     Path to keyward.keys.json (required)
--ts <path>         Override TS output path
--swift <path>      Override Swift output path
--kotlin <path>     Override Kotlin output path
--dart <path>       Override Dart output path (future)
--dry-run           Print without writing
--validate          Validate config only
```

### How It Works
1. Parse JSON, extract keys
2. For each key: if `key` contains `{paramName}` -> mark as dynamic, extract param names
3. For each output target: apply language template
   - Static keys -> constant declarations
   - Dynamic keys -> factory functions with typed parameters
4. Write generated files to paths from `output` config

---

## Publishing

### npm (4 packages)
```bash
cd packages/core && npm publish --access public            # @keyward/core (first, no deps)
cd packages/platform-web && npm publish --access public    # @keyward/platform-web
cd packages/codegen && npm publish --access public         # @keyward/codegen
cd packages/capacitor && npm publish --access public       # @keyward/capacitor
```

### SPM (platform-ios)
```bash
git tag 1.0.0 && git push origin 1.0.0
# Consumer: .package(url: "https://github.com/daflan-org/keyward", from: "1.0.0")
```

### Maven (platform-android)
```bash
cd packages/platform-android && ./gradlew publish
# -> org.keyward:platform-android:1.0.0 on GitHub Packages
```

---

## Consumer Example (Capacitor App)

### Install
```bash
yarn add @keyward/capacitor @keyward/codegen
npx cap sync
```

### Config (keyward.keys.json)
```json
{
  "output": { "ts": "src/generated/KeywardKeys.ts", "swift": "ios/App/Generated/KeywardKeys.swift" },
  "keys": {
    "AUTH_TOKEN": { "key": "auth_token", "scope": "user" },
    "THEME":     { "key": "theme", "scope": "user" }
  }
}
```

### Codegen
```bash
npx keyward-codegen --config keyward.keys.json
```

### Use
```typescript
import { createKeyward } from '@keyward/capacitor';
import { KeywardKeys } from './generated/KeywardKeys';

const keyward = createKeyward(Capacitor.getPlatform());

keyward.setUserId(user._id);
await keyward.set(KeywardKeys.AUTH_TOKEN, token);
const theme = await keyward.get(KeywardKeys.THEME);
await keyward.wipeUser(user._id);
```

### Native (iOS)
```swift
import Keyward

let registry = KeyRegistry()
registry.setUserId(Keyward.getRaw(key: "d/current_user_id")!)
let token = Keyward.get(KeywardKeys.authToken, registry: registry)
```

---

## Future: Keyward Cloud

### Vision

Open-source SDK is the foundation. Keyward Cloud adds managed services on top:

**Tier 0: Runtime Key Delivery (the wedge)**
- The unsolved problem: developers put API keys (Stripe, Sentry, Firebase, etc.) in .env files, they get bundled into the client binary, and anyone can reverse engineer them. Backend proxies work but require per-API infra. Platform-specific obfuscation (iOS plist, Android BuildConfig) is fragile and not cross-platform.
- Keyward Cloud solves this: developer registers API keys in the dashboard, app fetches them at runtime via authenticated request, keys live in secure storage (Keychain/Keystore/IndexedDB) and never in the bundle.
- Config-driven: `"source": "cloud"` in keyward.keys.json, same codegen, same `keyward.get()` API. Developer changes one field, keys move from local to cloud-delivered.
- Key rotation from dashboard, no app update needed. Revocation is instant.
- Rate limiting, app attestation (DeviceCheck/SafetyNet), and usage analytics built in.
- This is the simplest paid feature and addresses the widest audience: every app with a third-party API key.

**Tier 1: Key Recovery (SaaS)**
- User loses device -> recover encryption keys from cloud
- Keys stored encrypted (zero-knowledge: server never sees plaintext)
- Recovery via email/SMS verification + user password re-derivation
- PBKDF2/Argon2 key derivation from user secret, server holds encrypted blob
- Pricing: free tier (1000 users), pay per active user

**Tier 2: Multi-Device Key Sync**
- WhatsApp Web model: QR code link, keys transferred encrypted between devices
- Server acts as relay, never sees plaintext keys
- Web sessions, tablet sessions, desktop sessions
- Real-time sync via WebSocket

**Tier 3: Managed E2EE**
- Full E2EE infrastructure as a service
- Key exchange orchestration (X25519 ECDH, like Fawa's current system)
- Family/group key management
- Key rotation policies
- Audit logs
- Compliance (GDPR data deletion, right to be forgotten)
- Dashboard: which user has how many devices, key exchange status, rotation history

**Tier 4: Enterprise**
- On-premise deployment
- HSM (Hardware Security Module) integration
- Custom key derivation policies
- SSO + RBAC for dashboard
- SLA + support

### Cloud Architecture (High Level)

```
Client SDK (Keyward open-source)
  |
  | HTTPS / WebSocket
  |
Keyward Cloud API
  |
  +-- Secret Delivery Service (runtime API key fetch, app attestation)
  +-- Key Escrow Service (encrypted key blobs, zero-knowledge)
  +-- Recovery Service (email/SMS challenge, re-derive)
  +-- Sync Service (relay encrypted payloads between devices)
  +-- Audit Service (who did what when)
  +-- Dashboard (React app for developers)
  |
  +-- Storage: encrypted blobs in S3/GCS
  +-- Metadata: PostgreSQL
  +-- Realtime: Redis + WebSocket
```

### Business Model

| Tier | Price | Target |
|---|---|---|
| Open-source SDK | Free forever | All developers |
| Cloud Free | $0 (1K monthly active users) | Indie developers, startups |
| Cloud Pro | $29/mo (10K MAU) | Growing apps |
| Cloud Business | $99/mo (100K MAU) | Established apps |
| Enterprise | Custom | Large orgs, on-prem |

### Go-to-Market

1. **Phase 1 (now):** Ship open-source SDK. Gain developer trust. Build GitHub stars.
2. **Phase 2 (3-6 months):** Launch Cloud Runtime Key Delivery (widest audience, every app with API keys).
3. **Phase 3 (6-12 months):** Key Recovery + Multi-device sync. Killer feature for messaging/E2EE apps.
4. **Phase 4 (12+ months):** Managed E2EE, enterprise, on-prem.

First paying customer: Fawa app itself (dogfooding).

---

## Implementation Order

### Phase 1: Open-source SDK
1. ~~Init monorepo: Yarn 4 + Turborepo~~ ✓
2. `core`: Scope, StorageKeyDef, KeywardBackend, KeyRegistry + tests
3. `platform-web`: Keyward class, IndexedDBBackend + tests (depends on core)
4. `platform-ios`: Keyward.swift, KeyRegistry.swift, Scope, KeyDef + Package.swift + tests
5. `platform-android`: Keyward.java, KeyRegistry.java, Scope, KeyDef + build.gradle + tests
6. `codegen`: CLI, parser, templates (TS, Swift, Java) + tests (depends on core)
7. `capacitor`: plugin, TS wrapper, iOS plugin, Android plugin (depends on core + platform-web)
8. Publish: npm (4 packages) + SPM (git tag) + Maven (GitHub Packages)
9. README, docs, keyward.org landing page

### Phase 2: Fawa app integration (back to fawa-app repo)
10. Install @keyward/capacitor + @keyward/codegen
11. Create keyward.keys.json, run codegen
12. Refactor authAtoms.ts (login/logout/auto-login)
13. Migrate atomWithStorage atoms -> atomWithPersistence (5 atoms)
14. Migrate KeyExchangeService, DeviceManager, OneSignal
15. Remove direct localStorage/SecureStorage/Preferences usage
16. Simplify DeleteAccountSection
17. Update native code (SyncManager, AppDelegate, etc.)
18. Remove old packages/secure-storage-plugin
19. Full verification

### Phase 3: Cloud (future, separate repo/infrastructure)
20. Runtime Key Delivery MVP (Secret Delivery Service + app attestation)
21. Dashboard MVP (developer registers API keys, rotation, usage analytics)
22. Key Recovery Service
23. Multi-device sync
24. Managed E2EE
