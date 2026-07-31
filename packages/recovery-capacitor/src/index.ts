import type { EnvelopeTransport } from '@daflan/keyward-recovery-core';
import { Recoverable } from '@daflan/keyward-recovery-core';
import { NativePrfBridge } from './NativePrfBridge.js';
import { NativePlugin } from './plugin.js';

export type {
  Argon2idParams,
  Availability,
  CodeRecipient,
  Envelope,
  EnvelopeTransport,
  NativePrf,
  Recipient,
  RecipientSpec,
} from '@daflan/keyward-recovery-core';
export {
  generateRecoveryCode,
  KeywardRecoveryError,
  normalizeRecoveryCode,
  Recoverable,
} from '@daflan/keyward-recovery-core';
export type { KeywardRecoveryNativePlugin } from './definitions.js';
export { NativePrfBridge } from './NativePrfBridge.js';
export { NativePlugin } from './plugin.js';

/**
 * Wire a {@link Recoverable} backed by the native passkey-PRF plugin. The consuming
 * app supplies the {@link EnvelopeTransport} (its own backend) and the WebAuthn RP-ID
 * (it owns the domain + association files).
 */
export function createRecoverable(opts: {
  transport: EnvelopeTransport;
  rpId: string;
}): Recoverable {
  return new Recoverable({
    native: new NativePrfBridge(NativePlugin),
    transport: opts.transport,
    rpId: opts.rpId,
  });
}
