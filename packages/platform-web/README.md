# @keyward/platform-web

Web storage backend for [Keyward](https://github.com/daflan-org/keyward). Uses IndexedDB for persistent key-value storage with user-scoped key isolation.

## Install

```bash
yarn add @keyward/platform-web
```

## Usage

```typescript
import { Keyward, IndexedDBBackend } from '@keyward/platform-web';

const keyward = new Keyward(new IndexedDBBackend());

// Set active user
keyward.setUserId('user_507f1f');

// Read/write
await keyward.set({ key: 'auth_token', scope: 'user' }, token);
const token = await keyward.get({ key: 'auth_token', scope: 'user' });

// Wipe all data for a user
await keyward.wipeUser('user_507f1f');
```

### With Codegen (recommended)

```bash
yarn add -D @keyward/codegen
npx keyward-codegen --config keyward.keys.json
```

```typescript
import { Keyward, IndexedDBBackend } from '@keyward/platform-web';
import { KeywardKeys } from './generated/KeywardKeys';

const keyward = new Keyward(new IndexedDBBackend());

keyward.setUserId(user._id);
await keyward.set(KeywardKeys.AUTH_TOKEN, token);
```

## Custom Backend

Implement the `KeywardBackend` interface to use a different storage engine:

```typescript
import { Keyward, type KeywardBackend } from '@keyward/platform-web';

const memoryBackend: KeywardBackend = {
  store: new Map<string, string>(),
  async get(key) { return this.store.get(key) ?? null; },
  async set(key, value) { this.store.set(key, value); },
  async remove(key) { this.store.delete(key); },
  async keys() { return [...this.store.keys()]; },
  async clear() { this.store.clear(); },
};

const keyward = new Keyward(memoryBackend);
```

## License

[MIT](../../LICENSE)
