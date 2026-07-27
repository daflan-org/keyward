export type { SealedSecret } from './envelope.js';
export {
  deriveKek,
  fromBase64Url,
  open,
  openBlob,
  randomBytes,
  seal,
  sealSecret,
  toBase64Url,
  unwrapDataKey,
  wrapDataKey,
} from './envelope.js';
export { KeywardRecoveryError, Recoverable } from './Recoverable.js';
export type {
  Availability,
  CodeRecipient,
  EnrollContext,
  Envelope,
  EnvelopeTransport,
  NativePrf,
  PasskeyRecipient,
  PrfAssertResult,
  PrfCapabilities,
  PrfRegisterResult,
  Recipient,
  RecipientSpec,
  RecoverableDeps,
  SocialRecipient,
} from './types.js';
