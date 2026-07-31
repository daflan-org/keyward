import {
  deriveKek,
  fromBase64Url,
  openBlob,
  randomBytes,
  sealSecret,
  toBase64Url,
  unwrapDataKey,
  wrapDataKey,
} from './envelope.js';
import {
  type Argon2idParams,
  argon2idIkm,
  assertRecoveryCodeStrength,
  DEFAULT_ARGON2ID_PARAMS,
  parseArgon2idParams,
} from './kdf.js';
import type {
  Availability,
  CodeRecipient,
  EnrollContext,
  Envelope,
  NativePrf,
  PasskeyRecipient,
  Recipient,
  RecipientSpec,
  RecoverableDeps,
} from './types.js';

export class KeywardRecoveryError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'KeywardRecoveryError';
  }
}

/**
 * A recoverable secret: sealed once under a random Data Key, with the Data Key
 * wrapped for each available recovery anchor (passkey-PRF, social, code). Any one
 * anchor recovers the secret on a new device. See KW-29 / e2ee-v2 spec §5.5.
 */
export class Recoverable {
  private readonly native: NativePrf;
  private readonly transport: RecoverableDeps['transport'];
  private readonly rpId: string;

  constructor(deps: RecoverableDeps) {
    this.native = deps.native;
    this.transport = deps.transport;
    this.rpId = deps.rpId;
  }

  /** Seal `secret`, wrap it for each requested recipient, and upload the opaque envelope. */
  async set(scopeKey: string, secret: Uint8Array, ctx: EnrollContext): Promise<void> {
    const { dataKey, blob } = await sealSecret(secret);
    const salt = toBase64Url(randomBytes(32));

    const recipients: Recipient[] = [];
    for (const spec of ctx.recipients) {
      recipients.push(await this.buildRecipient(spec, dataKey, salt, ctx));
    }

    const envelope: Envelope = { v: 1, blob, salt, recipients };
    await this.transport.put(scopeKey, envelope);
  }

  /** Recover the secret on a new device via the passkey-PRF anchor. */
  async recover(scopeKey: string): Promise<Uint8Array> {
    const envelope = await this.transport.get(scopeKey);
    if (!envelope) {
      throw new KeywardRecoveryError('not_found', `No recovery envelope for "${scopeKey}"`);
    }
    const dataKey = await this.unwrapViaPasskey(envelope);
    return openBlob(envelope.blob, dataKey);
  }

  /**
   * Recover the secret via the recovery-code anchor (Anchor 3): the universal
   * backstop that works where passkey-PRF is unavailable (no-GMS / de-googled /
   * iOS < 18.4) and no family member can re-seal. A wrong code fails the AES-GCM
   * authentication and throws.
   */
  async recoverViaCode(scopeKey: string, code: string): Promise<Uint8Array> {
    const envelope = await this.transport.get(scopeKey);
    if (!envelope) {
      throw new KeywardRecoveryError('not_found', `No recovery envelope for "${scopeKey}"`);
    }
    const codeRecipients = envelope.recipients.filter((r): r is CodeRecipient => r.kind === 'code');
    if (codeRecipients.length === 0) {
      throw new KeywardRecoveryError('no_code_anchor', 'Envelope has no recovery-code recipient');
    }
    // An envelope may hold more than one code recipient (e.g. a re-issued code via
    // addRecipient). Try each; the right code unwraps exactly one, wrong codes fail
    // the AES-GCM auth and move on.
    const saltBytes = fromBase64Url(envelope.salt);
    for (const recipient of codeRecipients) {
      try {
        const kek = await this.deriveCodeKek(
          code,
          saltBytes,
          parseArgon2idParams(recipient.params),
        );
        const dataKey = await unwrapDataKey(recipient.wrap, kek);
        return await openBlob(envelope.blob, dataKey);
      } catch {
        // Wrong code for this recipient (or malformed params); try the next.
      }
    }
    throw new KeywardRecoveryError(
      'code_recovery_failed',
      'No recovery-code recipient matched the provided code',
    );
  }

  /** Which recovery anchors are usable on this device. */
  async availability(): Promise<Availability> {
    return { passkey: await this.native.capabilities() };
  }

  /**
   * Re-anchor: add a new recipient wrap without re-sealing the secret. Requires an
   * existing usable anchor (passkey) to recover the Data Key first.
   */
  async addRecipient(scopeKey: string, spec: RecipientSpec, ctx?: EnrollContext): Promise<void> {
    const envelope = await this.transport.get(scopeKey);
    if (!envelope) {
      throw new KeywardRecoveryError('not_found', `No recovery envelope for "${scopeKey}"`);
    }
    const dataKey = await this.unwrapViaPasskey(envelope);
    const recipient = await this.buildRecipient(spec, dataKey, envelope.salt, ctx);
    const next: Envelope = { ...envelope, recipients: [...envelope.recipients, recipient] };
    await this.transport.put(scopeKey, next);
  }

  // --- internals -----------------------------------------------------------

  private async buildRecipient(
    spec: RecipientSpec,
    dataKey: Uint8Array,
    salt: string,
    ctx?: EnrollContext,
  ): Promise<Recipient> {
    switch (spec.kind) {
      case 'passkey': {
        if (!ctx) {
          throw new KeywardRecoveryError(
            'missing_context',
            'Enrolling a passkey recipient requires userId / userName',
          );
        }
        const { credentialId, prfFirst } = await this.enrollPasskey(salt, ctx);
        const kek = await deriveKek(fromBase64Url(prfFirst));
        const wrap = await wrapDataKey(dataKey, kek);
        return { kind: 'passkey', credentialId, wrap };
      }
      case 'social': {
        const kek = await deriveKek(spec.kek);
        const wrap = await wrapDataKey(dataKey, kek);
        return { kind: 'social', memberId: spec.memberId, wrap };
      }
      case 'code': {
        // Anchor 3: KEK = HKDF(Argon2id(code, envelope.salt, params)). The params
        // are stored on the recipient so recoverViaCode reproduces the derivation.
        assertRecoveryCodeStrength(spec.code);
        const kek = await this.deriveCodeKek(
          spec.code,
          fromBase64Url(salt),
          DEFAULT_ARGON2ID_PARAMS,
        );
        const wrap = await wrapDataKey(dataKey, kek);
        return { kind: 'code', kdf: 'argon2id', params: { ...DEFAULT_ARGON2ID_PARAMS }, wrap };
      }
    }
  }

  /** code -> KEK: HKDF-SHA256(Argon2id(normalize(code), salt, params)). */
  private async deriveCodeKek(
    code: string,
    salt: Uint8Array,
    params: Argon2idParams,
  ): Promise<CryptoKey> {
    return deriveKek(await argon2idIkm(code, salt, params));
  }

  /** Enroll (or reuse) the user passkey and obtain a PRF output for `salt`. */
  private async enrollPasskey(
    salt: string,
    ctx: EnrollContext,
  ): Promise<{ credentialId: string; prfFirst: string }> {
    const registration = await this.native.register({
      rpId: this.rpId,
      userId: ctx.userId,
      userName: ctx.userName,
      challenge: toBase64Url(randomBytes(32)),
      saltFirst: salt,
    });
    if (registration.prfFirst) {
      return { credentialId: registration.credentialId, prfFirst: registration.prfFirst };
    }
    // Platform did not return PRF at create: a follow-up assert obtains it (second prompt).
    const assertion = await this.native.assert({
      rpId: this.rpId,
      challenge: toBase64Url(randomBytes(32)),
      saltFirst: salt,
      credentialId: registration.credentialId,
    });
    return { credentialId: assertion.credentialId, prfFirst: assertion.prfFirst };
  }

  private async unwrapViaPasskey(envelope: Envelope): Promise<Uint8Array> {
    const recipient = envelope.recipients.find((r): r is PasskeyRecipient => r.kind === 'passkey');
    if (!recipient) {
      throw new KeywardRecoveryError(
        'no_passkey_anchor',
        'Envelope has no passkey recipient; use social re-seal + addRecipient instead',
      );
    }
    const assertion = await this.native.assert({
      rpId: this.rpId,
      challenge: toBase64Url(randomBytes(32)),
      saltFirst: envelope.salt,
      credentialId: recipient.credentialId,
    });
    const kek = await deriveKek(fromBase64Url(assertion.prfFirst));
    return unwrapDataKey(recipient.wrap, kek);
  }
}
