import 'fake-indexeddb/auto';
import { IndexedDBBackend } from './IndexedDBBackend.js';

describe('IndexedDBBackend (fake-indexeddb)', () => {
  let backend: IndexedDBBackend;

  beforeEach(async () => {
    backend = new IndexedDBBackend();
    await backend.clear();
  });

  describe('get / set', () => {
    it('returns null for a missing key', async () => {
      expect(await backend.get('missing')).toBeNull();
    });

    it('stores and retrieves a value', async () => {
      await backend.set('foo', 'bar');
      expect(await backend.get('foo')).toBe('bar');
    });

    it('overwrites an existing value', async () => {
      await backend.set('foo', 'bar');
      await backend.set('foo', 'baz');
      expect(await backend.get('foo')).toBe('baz');
    });

    it('handles empty string key', async () => {
      await backend.set('', 'empty');
      expect(await backend.get('')).toBe('empty');
    });

    it('handles empty string value', async () => {
      await backend.set('key', '');
      expect(await backend.get('key')).toBe('');
    });
  });

  describe('remove', () => {
    it('removes an existing key', async () => {
      await backend.set('foo', 'bar');
      await backend.remove('foo');
      expect(await backend.get('foo')).toBeNull();
    });

    it('does not throw when removing a non-existent key', async () => {
      await expect(backend.remove('nope')).resolves.toBeUndefined();
    });
  });

  describe('keys', () => {
    it('returns an empty array when store is empty', async () => {
      expect(await backend.keys()).toEqual([]);
    });

    it('returns all stored keys', async () => {
      await backend.set('a', '1');
      await backend.set('b', '2');
      await backend.set('c', '3');
      const result = await backend.keys();
      expect(result.sort()).toEqual(['a', 'b', 'c']);
    });

    it('does not include removed keys', async () => {
      await backend.set('a', '1');
      await backend.set('b', '2');
      await backend.remove('a');
      expect(await backend.keys()).toEqual(['b']);
    });
  });

  describe('clear', () => {
    it('removes all keys', async () => {
      await backend.set('a', '1');
      await backend.set('b', '2');
      await backend.clear();
      expect(await backend.keys()).toEqual([]);
      expect(await backend.get('a')).toBeNull();
    });

    it('is a no-op on empty store', async () => {
      await expect(backend.clear()).resolves.toBeUndefined();
    });
  });
});
