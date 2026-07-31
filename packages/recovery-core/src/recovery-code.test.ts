import { randomBytes } from './envelope.js';
import { generateRecoveryCode, normalizeRecoveryCode, parseArgon2idParams } from './kdf.js';
import { Recoverable } from './Recoverable.js';
import type { Envelope, EnvelopeTransport, NativePrf } from './types.js';

/** In-memory transport for the round-trip. */
function memoryTransport(): EnvelopeTransport {
  let stored: Envelope | null = null;
  return {
    put: async (_scopeKey, envelope) => {
      stored = envelope;
    },
    get: async () => stored,
  };
}

/** The code anchor never touches the authenticator; fail loud if it does. */
const failNative = () => {
  throw new Error('native should not be called for a code recipient');
};
const stubNative: NativePrf = {
  capabilities: failNative,
  register: failNative,
  assert: failNative,
};

function makeRecoverable(transport: EnvelopeTransport): Recoverable {
  return new Recoverable({ native: stubNative, transport, rpId: 'example.test' });
}

/** Seal a fresh secret under one or more code recipients at scope 'scope'. */
async function sealCodes(
  ...codes: string[]
): Promise<{ recoverable: Recoverable; secret: Uint8Array }> {
  const recoverable = makeRecoverable(memoryTransport());
  const secret = randomBytes(32);
  await recoverable.set('scope', secret, {
    userId: 'u',
    userName: 'n',
    recipients: codes.map((code) => ({ kind: 'code', code })),
  });
  return { recoverable, secret };
}

describe('recovery code format', () => {
  it('generates 7 dash-separated groups of 4 Crockford base32 symbols', () => {
    const code = generateRecoveryCode();
    expect(code).toMatch(/^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{4}(-[0-9ABCDEFGHJKMNPQRSTVWXYZ]{4}){6}$/);
  });

  it('generates distinct codes', () => {
    expect(generateRecoveryCode()).not.toEqual(generateRecoveryCode());
  });

  it('normalizes separators, case, and Crockford confusables', () => {
    expect(normalizeRecoveryCode('k7qw-9f3m')).toBe('K7QW9F3M');
    expect(normalizeRecoveryCode('O I L')).toBe('011');
  });

  it('can produce every Crockford symbol (uniformity smoke test)', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 300; i += 1) {
      for (const ch of generateRecoveryCode().replace(/-/g, '')) {
        seen.add(ch);
      }
    }
    // Includes R,S,T,V,W,X,Y,Z, which the earlier rejection sampling under-represented.
    for (const ch of '0123456789ABCDEFGHJKMNPQRSTVWXYZ') {
      expect(seen.has(ch)).toBe(true);
    }
  });
});

describe('parseArgon2idParams', () => {
  it('accepts valid params', () => {
    expect(parseArgon2idParams({ m: 19456, t: 2, p: 1, v: 19 })).toEqual({
      m: 19456,
      t: 2,
      p: 1,
      v: 19,
    });
  });

  it('rejects zero, negative, non-integer, and unsupported-version params', () => {
    expect(() => parseArgon2idParams({ m: 0, t: 2, p: 1, v: 19 })).toThrow();
    expect(() => parseArgon2idParams({ m: 19456, t: -1, p: 1, v: 19 })).toThrow();
    expect(() => parseArgon2idParams({ m: 1.5, t: 2, p: 1, v: 19 })).toThrow();
    expect(() => parseArgon2idParams({ m: 19456, t: 2, p: 1, v: 16 })).toThrow();
    expect(() => parseArgon2idParams({ t: 2, p: 1, v: 19 })).toThrow();
  });
});

describe('code recipient (Anchor 3) round-trip', () => {
  it('recovers the secret with the correct code', async () => {
    const code = generateRecoveryCode();
    const { recoverable, secret } = await sealCodes(code);

    expect(await recoverable.recoverViaCode('scope', code)).toEqual(secret);
  });

  it('accepts a code typed with different case / spacing (normalization)', async () => {
    const code = generateRecoveryCode();
    const { recoverable, secret } = await sealCodes(code);

    const messy = ` ${code.toLowerCase().replace(/-/g, ' ')} `;
    expect(await recoverable.recoverViaCode('scope', messy)).toEqual(secret);
  });

  it('recovers via a non-first code recipient', async () => {
    const first = generateRecoveryCode();
    const second = generateRecoveryCode();
    const { recoverable, secret } = await sealCodes(first, second);

    // The second code must still recover even though it is not the first recipient.
    expect(await recoverable.recoverViaCode('scope', second)).toEqual(secret);
  });

  it('rejects sealing a too-short (weak) code', async () => {
    await expect(sealCodes('1234')).rejects.toThrow(/too short/i);
  });

  it('rejects a wrong code', async () => {
    const { recoverable } = await sealCodes(generateRecoveryCode());

    await expect(recoverable.recoverViaCode('scope', generateRecoveryCode())).rejects.toThrow();
  });

  it('throws when the envelope has no code recipient', async () => {
    const transport = memoryTransport();
    await transport.put('scope', {
      v: 1,
      blob: 'x',
      salt: 'y',
      recipients: [{ kind: 'social', memberId: 'm', wrap: 'w' }],
    });

    await expect(makeRecoverable(transport).recoverViaCode('scope', 'CODE')).rejects.toThrow(
      /no.*code/i,
    );
  });
});
