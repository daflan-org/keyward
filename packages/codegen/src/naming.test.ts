import { Scope } from '@daflan/keyward-core';
import { toCamelCase, toJavaScope, toSwiftScope, toTsScope } from './naming.js';

describe('toCamelCase', () => {
  it('converts single word', () => {
    expect(toCamelCase('LANGUAGE')).toBe('language');
  });

  it('converts two words', () => {
    expect(toCamelCase('AUTH_TOKEN')).toBe('authToken');
  });

  it('converts three words', () => {
    expect(toCamelCase('FAMILY_KEY_VERSIONED')).toBe('familyKeyVersioned');
  });

  it('handles numeric prefix in segment', () => {
    expect(toCamelCase('E2EE_PRIVATE_KEY')).toBe('e2eePrivateKey');
  });

  it('converts CURRENT_USER_ID', () => {
    expect(toCamelCase('CURRENT_USER_ID')).toBe('currentUserId');
  });
});

describe('toTsScope', () => {
  it('maps User', () => {
    expect(toTsScope(Scope.User)).toBe('Scope.User');
  });

  it('maps Device', () => {
    expect(toTsScope(Scope.Device)).toBe('Scope.Device');
  });

  it('maps Global', () => {
    expect(toTsScope(Scope.Global)).toBe('Scope.Global');
  });
});

describe('toSwiftScope', () => {
  it('maps User', () => {
    expect(toSwiftScope(Scope.User)).toBe('.user');
  });

  it('maps Device', () => {
    expect(toSwiftScope(Scope.Device)).toBe('.device');
  });

  it('maps Global', () => {
    expect(toSwiftScope(Scope.Global)).toBe('.global');
  });
});

describe('toJavaScope', () => {
  it('maps User', () => {
    expect(toJavaScope(Scope.User)).toBe('Scope.USER');
  });

  it('maps Device', () => {
    expect(toJavaScope(Scope.Device)).toBe('Scope.DEVICE');
  });

  it('maps Global', () => {
    expect(toJavaScope(Scope.Global)).toBe('Scope.GLOBAL');
  });
});
