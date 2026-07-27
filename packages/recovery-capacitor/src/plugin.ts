import { registerPlugin } from '@capacitor/core';
import type { KeywardRecoveryNativePlugin } from './definitions.js';

const NativePlugin = registerPlugin<KeywardRecoveryNativePlugin>('KeywardRecovery');

export { NativePlugin };
