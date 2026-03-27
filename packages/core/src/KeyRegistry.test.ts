import { KeyRegistry } from './KeyRegistry.js';
import type { StorageKeyDef } from './types.js';
import { Scope } from './types.js';

const keyDef = (key: string, scope: Scope): StorageKeyDef => ({ key, scope });

describe('Scope enum', () => {
  it('has value "user" for User', () => {
    expect(Scope.User).toBe('user');
  });

  it('has value "device" for Device', () => {
    expect(Scope.Device).toBe('device');
  });

  it('has value "global" for Global', () => {
    expect(Scope.Global).toBe('global');
  });

  it('has exactly 3 members', () => {
    expect(Object.values(Scope)).toHaveLength(3);
  });
});

describe('KeyRegistry', () => {
  let registry: KeyRegistry;

  beforeEach(() => {
    registry = new KeyRegistry();
  });

  describe('userId management', () => {
    it('returns null initially', () => {
      expect(registry.getUserId()).toBeNull();
    });

    it('stores the userId after setUserId()', () => {
      registry.setUserId('alice');
      expect(registry.getUserId()).toBe('alice');
    });

    it('allows changing userId with subsequent setUserId() calls', () => {
      registry.setUserId('alice');
      registry.setUserId('bob');
      expect(registry.getUserId()).toBe('bob');
    });

    it('resets userId to null after clearUserId()', () => {
      registry.setUserId('alice');
      registry.clearUserId();
      expect(registry.getUserId()).toBeNull();
    });

    it('does not throw when clearUserId() is called without a userId set', () => {
      expect(() => registry.clearUserId()).not.toThrow();
      expect(registry.getUserId()).toBeNull();
    });
  });

  describe('resolve()', () => {
    describe('Scope.User', () => {
      it('resolves to u/{userId}/{key}', () => {
        registry.setUserId('alice');
        expect(registry.resolve(keyDef('theme', Scope.User))).toBe('u/alice/theme');
      });

      it('throws when userId is not set', () => {
        expect(() => registry.resolve(keyDef('theme', Scope.User))).toThrow(
          'Keyward: userId not set.',
        );
      });

      it('throws after userId is cleared', () => {
        registry.setUserId('alice');
        registry.clearUserId();
        expect(() => registry.resolve(keyDef('theme', Scope.User))).toThrow(
          'Keyward: userId not set.',
        );
      });

      it('uses the current userId after change', () => {
        registry.setUserId('alice');
        expect(registry.resolve(keyDef('theme', Scope.User))).toBe('u/alice/theme');
        registry.setUserId('bob');
        expect(registry.resolve(keyDef('theme', Scope.User))).toBe('u/bob/theme');
      });
    });

    describe('Scope.Device', () => {
      it('resolves to d/{key}', () => {
        expect(registry.resolve(keyDef('volume', Scope.Device))).toBe('d/volume');
      });

      it('does not include userId even when one is set', () => {
        registry.setUserId('alice');
        expect(registry.resolve(keyDef('volume', Scope.Device))).toBe('d/volume');
      });
    });

    describe('Scope.Global', () => {
      it('resolves to the bare key', () => {
        expect(registry.resolve(keyDef('app-version', Scope.Global))).toBe('app-version');
      });

      it('does not include userId even when one is set', () => {
        registry.setUserId('alice');
        expect(registry.resolve(keyDef('app-version', Scope.Global))).toBe('app-version');
      });
    });

    describe('edge cases', () => {
      it('handles empty string key for Scope.Global', () => {
        expect(registry.resolve(keyDef('', Scope.Global))).toBe('');
      });

      it('handles empty string key for Scope.Device', () => {
        expect(registry.resolve(keyDef('', Scope.Device))).toBe('d/');
      });

      it('handles empty string key for Scope.User', () => {
        registry.setUserId('alice');
        expect(registry.resolve(keyDef('', Scope.User))).toBe('u/alice/');
      });

      it('handles key with slashes', () => {
        expect(registry.resolve(keyDef('a/b/c', Scope.Device))).toBe('d/a/b/c');
      });

      it('handles key with special characters', () => {
        expect(registry.resolve(keyDef('settings.theme@v2', Scope.Global))).toBe(
          'settings.theme@v2',
        );
      });

      it('handles userId with special characters', () => {
        registry.setUserId('user@example.com');
        expect(registry.resolve(keyDef('prefs', Scope.User))).toBe('u/user@example.com/prefs');
      });

      it('handles key with spaces', () => {
        expect(registry.resolve(keyDef('my key', Scope.Device))).toBe('d/my key');
      });

      it('handles key with unicode characters', () => {
        registry.setUserId('alice');
        expect(registry.resolve(keyDef('tema-\u00e7', Scope.User))).toBe('u/alice/tema-\u00e7');
        expect(registry.resolve(keyDef('tema-\u00e7', Scope.Device))).toBe('d/tema-\u00e7');
        expect(registry.resolve(keyDef('tema-\u00e7', Scope.Global))).toBe('tema-\u00e7');
      });
    });
  });

  describe('getUserPrefix()', () => {
    it('returns u/{userId}/', () => {
      expect(registry.getUserPrefix('alice')).toBe('u/alice/');
    });

    it('works with special characters in userId', () => {
      expect(registry.getUserPrefix('user@example.com')).toBe('u/user@example.com/');
    });

    it('is independent of currentUserId state', () => {
      expect(registry.getUserPrefix('bob')).toBe('u/bob/');
    });

    it('prefix matches resolve output for User-scoped keys', () => {
      registry.setUserId('alice');
      const resolved = registry.resolve(keyDef('theme', Scope.User));
      expect(resolved.startsWith(registry.getUserPrefix('alice'))).toBe(true);
    });
  });

  describe('instance isolation', () => {
    it('separate instances do not share state', () => {
      const other = new KeyRegistry();
      registry.setUserId('alice');
      other.setUserId('bob');
      expect(registry.resolve(keyDef('k', Scope.User))).toBe('u/alice/k');
      expect(other.resolve(keyDef('k', Scope.User))).toBe('u/bob/k');
    });
  });
});
