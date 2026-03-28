import { Scope } from '@keyward/core';
import { parseConfigFromJson } from './parser.js';

const minimalConfig = {
  output: { ts: 'out.ts' },
  keys: {
    AUTH_TOKEN: { key: 'auth.access_token', scope: 'user' },
  },
};

const fullConfig = {
  output: {
    ts: 'src/generated/KeywardKeys.ts',
    swift: 'ios/Generated/KeywardKeys.swift',
    kotlin: 'android/generated/KeywardKeys.java',
  },
  keys: {
    AUTH_TOKEN: { key: 'auth.access_token', scope: 'user' },
    CURRENT_USER_ID: { key: 'current_user_id', scope: 'device' },
    LANGUAGE: { key: 'language', scope: 'global' },
    FAMILY_KEY: { key: 'family.{familyId}.key', scope: 'user' },
    FAMILY_KEY_VERSIONED: { key: 'family.{familyId}.key.{version}', scope: 'user' },
  },
};

describe('parseConfigFromJson', () => {
  describe('happy path', () => {
    it('parses minimal config with one static key', () => {
      const result = parseConfigFromJson(minimalConfig);
      expect(result.staticKeys).toHaveLength(1);
      expect(result.dynamicKeys).toHaveLength(0);
      expect(result.staticKeys[0]).toEqual({
        kind: 'static',
        name: 'AUTH_TOKEN',
        key: 'auth.access_token',
        scope: Scope.User,
      });
    });

    it('parses all three scopes', () => {
      const result = parseConfigFromJson(fullConfig);
      const scopes = result.staticKeys.map((k) => k.scope);
      expect(scopes).toContain(Scope.User);
      expect(scopes).toContain(Scope.Device);
      expect(scopes).toContain(Scope.Global);
    });

    it('separates static and dynamic keys', () => {
      const result = parseConfigFromJson(fullConfig);
      expect(result.staticKeys).toHaveLength(3);
      expect(result.dynamicKeys).toHaveLength(2);
    });

    it('sorts static keys alphabetically', () => {
      const result = parseConfigFromJson(fullConfig);
      const names = result.staticKeys.map((k) => k.name);
      expect(names).toEqual(['AUTH_TOKEN', 'CURRENT_USER_ID', 'LANGUAGE']);
    });

    it('sorts dynamic keys alphabetically', () => {
      const result = parseConfigFromJson(fullConfig);
      const names = result.dynamicKeys.map((k) => k.name);
      expect(names).toEqual(['FAMILY_KEY', 'FAMILY_KEY_VERSIONED']);
    });

    it('extracts single param', () => {
      const result = parseConfigFromJson(fullConfig);
      const fk = result.dynamicKeys.find((k) => k.name === 'FAMILY_KEY');
      expect(fk?.params).toEqual([{ name: 'familyId' }]);
    });

    it('extracts multiple params', () => {
      const result = parseConfigFromJson(fullConfig);
      const fkv = result.dynamicKeys.find((k) => k.name === 'FAMILY_KEY_VERSIONED');
      expect(fkv?.params).toHaveLength(2);
      expect(fkv?.params.map((p) => p.name)).toEqual(['familyId', 'version']);
    });

    it('preserves output paths', () => {
      const result = parseConfigFromJson(fullConfig);
      expect(result.output.ts).toBe('src/generated/KeywardKeys.ts');
      expect(result.output.swift).toBe('ios/Generated/KeywardKeys.swift');
      expect(result.output.kotlin).toBe('android/generated/KeywardKeys.java');
    });

    it('handles config with only dynamic keys', () => {
      const config = {
        output: {},
        keys: { ITEM: { key: '{id}', scope: 'global' } },
      };
      const result = parseConfigFromJson(config);
      expect(result.staticKeys).toHaveLength(0);
      expect(result.dynamicKeys).toHaveLength(1);
    });
  });

  describe('validation errors', () => {
    it('throws on null input', () => {
      expect(() => parseConfigFromJson(null)).toThrow('Config must be a JSON object.');
    });

    it('throws on non-object input', () => {
      expect(() => parseConfigFromJson('string')).toThrow('Config must be a JSON object.');
    });

    it('throws on missing output', () => {
      expect(() => parseConfigFromJson({ keys: {} })).toThrow(
        'Config must have an "output" object.',
      );
    });

    it('throws on missing keys', () => {
      expect(() => parseConfigFromJson({ output: {} })).toThrow(
        'Config must have a "keys" object.',
      );
    });

    it('throws on key entry missing key field', () => {
      const config = { output: {}, keys: { BAD: { scope: 'user' } } };
      expect(() => parseConfigFromJson(config)).toThrow(
        'Key "BAD" is missing a "key" string field.',
      );
    });

    it('throws on key entry missing scope field', () => {
      const config = { output: {}, keys: { BAD: { key: 'test' } } };
      expect(() => parseConfigFromJson(config)).toThrow(
        'Key "BAD" is missing a "scope" string field.',
      );
    });

    it('throws on invalid scope value', () => {
      const config = { output: {}, keys: { BAD: { key: 'test', scope: 'session' } } };
      expect(() => parseConfigFromJson(config)).toThrow('Invalid scope "session" for key "BAD"');
    });

    it('throws on non-object key entry', () => {
      const config = { output: {}, keys: { BAD: 'string' } };
      expect(() => parseConfigFromJson(config)).toThrow('Key "BAD" must be an object');
    });

    it('throws on non-string output path', () => {
      const config = { output: { ts: 123 }, keys: {} };
      expect(() => parseConfigFromJson(config)).toThrow('output.ts must be a string.');
    });
  });
});
