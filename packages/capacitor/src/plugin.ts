import { registerPlugin } from '@capacitor/core';
import type { KeywardNativePlugin } from './definitions.js';

const NativePlugin = registerPlugin<KeywardNativePlugin>('Keyward');

export { NativePlugin };
