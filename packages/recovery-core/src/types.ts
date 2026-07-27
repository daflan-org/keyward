/**
 * Public types for @daflan/keyward-recovery-core.
 *
 * The core is platform-agnostic and native-free. Two ports are supplied by the
 * host application / bridge:
 *  - {@link NativePrf}       the passkey WebAuthn PRF I/O (Capacitor bridge implements it)
 *  - {@link EnvelopeTransport} the opaque-blob store (the consuming app's backend)
 */

/** WebAuthn PRF authenticator capability probe (the four PRF buckets, simplified). */
export interface PrfCapabilities {
  /** A platform passkey provider exists on this device. */
  readonly platformAuthenticator: boolean;
  /** The authenticator advertises the `prf` / `hmac-secret` extension. */
  readonly prfSupported: boolean;
  /** PRF output is available at credential-creation time (iCloud / Google). */
  readonly prfAtCreate: boolean;
}

export interface PrfRegisterResult {
  /** base64url credential id of the newly created passkey. */
  readonly credentialId: string;
  /** base64url 32-byte PRF output, or null when the platform only yields it at assert time. */
  readonly prfFirst: string | null;
}

export interface PrfAssertResult {
  readonly credentialId: string;
  /** base64url 32-byte PRF output. */
  readonly prfFirst: string;
}

/**
 * Narrow native contract: PRF I/O only. No business logic, no crypto beyond what
 * the authenticator performs. `challenge` may be client-random since PRF-as-KEK
 * needs no server-side WebAuthn verification.
 */
export interface NativePrf {
  capabilities(): Promise<PrfCapabilities>;
  register(opts: {
    readonly rpId: string;
    readonly userId: string;
    readonly userName: string;
    readonly challenge: string;
    readonly saltFirst: string;
  }): Promise<PrfRegisterResult>;
  assert(opts: {
    readonly rpId: string;
    readonly challenge: string;
    readonly saltFirst: string;
    readonly credentialId?: string;
  }): Promise<PrfAssertResult>;
}

/** A recovery anchor. Any single recipient can unwrap the Data Key. */
export type Recipient = PasskeyRecipient | SocialRecipient | CodeRecipient;

export interface PasskeyRecipient {
  readonly kind: 'passkey';
  readonly credentialId: string;
  /** base64url AES-256-GCM(DK, KEK) where KEK = HKDF(PRF). */
  readonly wrap: string;
}

export interface SocialRecipient {
  readonly kind: 'social';
  readonly memberId: string;
  /** base64url AES-256-GCM(DK, KEK) where KEK comes from a member re-seal. */
  readonly wrap: string;
}

/** Optional last-resort recipient. Deferred in v1 (kind reserved in the format). */
export interface CodeRecipient {
  readonly kind: 'code';
  readonly kdf: 'argon2id';
  readonly params: Record<string, unknown>;
  readonly wrap: string;
}

/** The opaque envelope stored via {@link EnvelopeTransport}. The server cannot decrypt any field. */
export interface Envelope {
  readonly v: 1;
  /** base64url iv||AES-256-GCM(secret, DK). */
  readonly blob: string;
  /** base64url PRF salt (input, not a secret). */
  readonly salt: string;
  readonly recipients: Recipient[];
}

/** Backend port. The consuming app provides the adapter (multi-tenant). */
export interface EnvelopeTransport {
  put(scopeKey: string, envelope: Envelope): Promise<void>;
  get(scopeKey: string): Promise<Envelope | null>;
}

/** How a recipient wrap is produced when calling `set` / `addRecipient`. */
export type RecipientSpec =
  | { readonly kind: 'passkey' }
  | { readonly kind: 'social'; readonly memberId: string; readonly kek: Uint8Array }
  | { readonly kind: 'code'; readonly code: string };

export interface Availability {
  readonly passkey: PrfCapabilities;
}

export interface RecoverableDeps {
  readonly native: NativePrf;
  readonly transport: EnvelopeTransport;
  /** WebAuthn RP-ID. Supplied by the consuming app (it owns the domain + association files). */
  readonly rpId: string;
}

export interface EnrollContext {
  readonly userId: string;
  readonly userName: string;
  readonly recipients: RecipientSpec[];
}
