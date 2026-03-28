import { Scope } from '@daflan/keyward-core';
import type { DynamicKey, ParsedConfig, StaticKey } from './types.js';

export const STATIC_KEYS: readonly StaticKey[] = [
  { kind: 'static', name: 'AUTH_TOKEN', key: 'auth.access_token', scope: Scope.User },
  { kind: 'static', name: 'CURRENT_USER_ID', key: 'current_user_id', scope: Scope.Device },
  { kind: 'static', name: 'LANGUAGE', key: 'language', scope: Scope.Global },
];

export const DYNAMIC_KEYS: readonly DynamicKey[] = [
  {
    kind: 'dynamic',
    name: 'FAMILY_KEY',
    keyTemplate: 'family.{familyId}.key',
    params: [{ name: 'familyId' }],
    scope: Scope.User,
  },
  {
    kind: 'dynamic',
    name: 'FAMILY_KEY_VERSIONED',
    keyTemplate: 'family.{familyId}.key.{version}',
    params: [{ name: 'familyId' }, { name: 'version' }],
    scope: Scope.User,
  },
];

export const mixedConfig = (output: ParsedConfig['output'] = {}): ParsedConfig => ({
  output,
  staticKeys: STATIC_KEYS,
  dynamicKeys: DYNAMIC_KEYS,
});
