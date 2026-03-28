import { Keyward } from '@keyward/core';
import { IndexedDBBackend } from '@keyward/platform-web';
import { NativeBridgeBackend } from './NativeBridgeBackend.js';
import { NativePlugin } from './plugin.js';

export type { KeywardBackend, StorageKeyDef } from '@keyward/core';
export { Keyward, Scope } from '@keyward/core';
export type { KeywardNativePlugin } from './definitions.js';
export { NativeBridgeBackend } from './NativeBridgeBackend.js';

export function createKeyward(platform: 'web' | 'ios' | 'android'): Keyward {
  if (platform === 'web') {
    return new Keyward(new IndexedDBBackend());
  }
  return new Keyward(new NativeBridgeBackend(NativePlugin));
}
