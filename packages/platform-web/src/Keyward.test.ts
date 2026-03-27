import type { KeywardBackend, StorageKeyDef } from '@keyward/core';
import { Scope } from '@keyward/core';
import { Keyward } from './Keyward.js';

const keyDef = (key: string, scope: Scope): StorageKeyDef => ({ key, scope });

function createMemoryBackend(): KeywardBackend {
  const store = new Map<string, string>();
  return {
    async get(key) {
      return store.get(key) ?? null;
    },
    async set(key, value) {
      store.set(key, value);
    },
    async remove(key) {
      store.delete(key);
    },
    async keys() {
      return [...store.keys()];
    },
    async clear() {
      store.clear();
    },
  };
}

describe('Keyward', () => {
  let kw: Keyward;

  beforeEach(() => {
    kw = new Keyward(createMemoryBackend());
  });

  describe('userId management', () => {
    it('returns null initially', () => {
      expect(kw.getUserId()).toBeNull();
    });

    it('stores userId after setUserId()', () => {
      kw.setUserId('alice');
      expect(kw.getUserId()).toBe('alice');
    });

    it('resets userId after clearUserId()', () => {
      kw.setUserId('alice');
      kw.clearUserId();
      expect(kw.getUserId()).toBeNull();
    });
  });

  describe('get / set / remove', () => {
    it('returns null for a missing key', async () => {
      expect(await kw.get(keyDef('app-version', Scope.Global))).toBeNull();
    });

    it('stores and retrieves a Global-scoped value', async () => {
      await kw.set(keyDef('app-version', Scope.Global), '1.0');
      expect(await kw.get(keyDef('app-version', Scope.Global))).toBe('1.0');
    });

    it('stores and retrieves a Device-scoped value', async () => {
      await kw.set(keyDef('volume', Scope.Device), '80');
      expect(await kw.get(keyDef('volume', Scope.Device))).toBe('80');
    });

    it('stores and retrieves a User-scoped value', async () => {
      kw.setUserId('alice');
      await kw.set(keyDef('theme', Scope.User), 'dark');
      expect(await kw.get(keyDef('theme', Scope.User))).toBe('dark');
    });

    it('throws when accessing User-scoped key without userId', async () => {
      await expect(kw.get(keyDef('theme', Scope.User))).rejects.toThrow('Keyward: userId not set.');
    });

    it('removes a value', async () => {
      await kw.set(keyDef('app-version', Scope.Global), '1.0');
      await kw.remove(keyDef('app-version', Scope.Global));
      expect(await kw.get(keyDef('app-version', Scope.Global))).toBeNull();
    });

    it('removing a non-existent key does not throw', async () => {
      await expect(kw.remove(keyDef('nope', Scope.Global))).resolves.toBeUndefined();
    });

    it('overwrites an existing value', async () => {
      await kw.set(keyDef('lang', Scope.Global), 'en');
      await kw.set(keyDef('lang', Scope.Global), 'tr');
      expect(await kw.get(keyDef('lang', Scope.Global))).toBe('tr');
    });
  });

  describe('user isolation', () => {
    it('different users have separate values for the same key', async () => {
      kw.setUserId('alice');
      await kw.set(keyDef('theme', Scope.User), 'dark');
      kw.setUserId('bob');
      await kw.set(keyDef('theme', Scope.User), 'light');

      kw.setUserId('alice');
      expect(await kw.get(keyDef('theme', Scope.User))).toBe('dark');
      kw.setUserId('bob');
      expect(await kw.get(keyDef('theme', Scope.User))).toBe('light');
    });

    it('User-scoped keys do not collide with Device-scoped keys', async () => {
      kw.setUserId('alice');
      await kw.set(keyDef('volume', Scope.User), '50');
      await kw.set(keyDef('volume', Scope.Device), '80');

      expect(await kw.get(keyDef('volume', Scope.User))).toBe('50');
      expect(await kw.get(keyDef('volume', Scope.Device))).toBe('80');
    });
  });

  describe('wipeUser()', () => {
    it('removes all keys for the given user', async () => {
      kw.setUserId('alice');
      await kw.set(keyDef('theme', Scope.User), 'dark');
      await kw.set(keyDef('lang', Scope.User), 'tr');

      await kw.wipeUser('alice');

      expect(await kw.get(keyDef('theme', Scope.User))).toBeNull();
      expect(await kw.get(keyDef('lang', Scope.User))).toBeNull();
    });

    it('does not remove other users keys', async () => {
      kw.setUserId('alice');
      await kw.set(keyDef('theme', Scope.User), 'dark');
      kw.setUserId('bob');
      await kw.set(keyDef('theme', Scope.User), 'light');

      await kw.wipeUser('alice');

      kw.setUserId('bob');
      expect(await kw.get(keyDef('theme', Scope.User))).toBe('light');
    });

    it('does not remove Device or Global keys', async () => {
      kw.setUserId('alice');
      await kw.set(keyDef('theme', Scope.User), 'dark');
      await kw.set(keyDef('volume', Scope.Device), '80');
      await kw.set(keyDef('app-version', Scope.Global), '1.0');

      await kw.wipeUser('alice');

      expect(await kw.get(keyDef('volume', Scope.Device))).toBe('80');
      expect(await kw.get(keyDef('app-version', Scope.Global))).toBe('1.0');
    });

    it('is a no-op for a user with no keys', async () => {
      await expect(kw.wipeUser('nobody')).resolves.toBeUndefined();
    });
  });
});
