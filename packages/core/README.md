# @keyward/core

Platform-agnostic types and key registry for [Keyward](https://github.com/daflan-org/keyward). This package contains the shared foundation used by all platform implementations.

## Install

```bash
yarn add @keyward/core
```

Most users should install a platform package (`@keyward/platform-web`, `@keyward/capacitor`) instead. This package is for building custom integrations or platform backends.

## What's Inside

- **`Scope`** enum: `User`, `Device`, `Global`
- **`StorageKeyDef`** interface: `{ key: string, scope: Scope }`
- **`KeywardBackend`** interface: storage engine contract (get/set/remove/keys/clear)
- **`KeyRegistry`** class: resolves scoped keys to prefixed strings

## Usage

```typescript
import { Scope, KeyRegistry } from '@keyward/core';
import type { StorageKeyDef } from '@keyward/core';

const registry = new KeyRegistry();
registry.setUserId('user_507f1f');

const keyDef: StorageKeyDef = { key: 'auth_token', scope: Scope.User };
registry.resolve(keyDef); // => "u/user_507f1f/auth_token"

const deviceKey: StorageKeyDef = { key: 'install_id', scope: Scope.Device };
registry.resolve(deviceKey); // => "d/install_id"

const globalKey: StorageKeyDef = { key: 'language', scope: Scope.Global };
registry.resolve(globalKey); // => "language"
```

## License

[MIT](../../LICENSE)
