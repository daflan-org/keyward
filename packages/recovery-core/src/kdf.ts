/**
 * Recovery-code (Anchor 3) key derivation and code formatting.
 *
 * The code is a high-entropy random string (>=128-bit). Its KEK is
 * `HKDF-SHA256(Argon2id(normalize(code), envelope.salt, params))`. Argon2id's
 * memory-hardness is defense-in-depth here: a full-entropy code is already
 * infeasible to brute-force, so the parameters are tuned for mobile webviews.
 *
 * This is the one KDF dependency recovery-core takes beyond WebCrypto (hash-wasm's
 * Argon2id, whose WASM is inlined so there is no asset to serve); everything else
 * stays WebCrypto-only.
 */
import { argon2id } from 'hash-wasm';
import { randomBytes } from './envelope.js';

/** Argon2id parameters, stored verbatim in the code recipient so recover reproduces them. */
export interface Argon2idParams {
  /** memory cost, KiB */
  readonly m: number;
  /** time cost, iterations */
  readonly t: number;
  /** parallelism (lanes) */
  readonly p: number;
  /** argon2 version (0x13 = 19) */
  readonly v: number;
}

/** hash-wasm's Argon2id is fixed at version 0x13 (19); we can only produce/consume this. */
const ARGON2_VERSION = 19;

/** OWASP Argon2id interactive minimum; safe on mobile webviews (~150ms, ~19 MB transient). */
export const DEFAULT_ARGON2ID_PARAMS: Argon2idParams = {
  m: 19456,
  t: 2,
  p: 1,
  v: ARGON2_VERSION,
};

/**
 * Bounds for envelope-supplied params. They guard corrupted/tampered records:
 * reject nonsense that would throw deep inside argon2id or OOM the webview, and
 * surface a clean error instead. Generous enough for any legitimate tuning.
 */
const ARGON2_BOUNDS = {
  m: { min: 1024, max: 1_048_576 }, // 1 MiB .. 1 GiB
  t: { min: 1, max: 32 },
  p: { min: 1, max: 16 },
} as const;

/** Crockford base32 alphabet (excludes I, L, O, U to avoid ambiguity). */
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
/** 28 symbols x 5 bits = 140-bit (>= the 128-bit floor), formatted as 7 groups of 4. */
const CODE_SYMBOLS = 28;
const GROUP_SIZE = 4;

function requireIntInRange(value: unknown, min: number, max: number, name: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new Error(`recovery-core: malformed argon2id params (${name})`);
  }
  return value;
}

/**
 * Read + validate Argon2id params from an opaque recipient `params` record.
 * m/t/p must be positive integers within {@link ARGON2_BOUNDS}, and the version
 * must be the one this build supports (0x13) so a mismatch fails clearly rather
 * than silently deriving a wrong IKM.
 */
export function parseArgon2idParams(params: Record<string, unknown>): Argon2idParams {
  const m = requireIntInRange(params.m, ARGON2_BOUNDS.m.min, ARGON2_BOUNDS.m.max, 'm');
  const t = requireIntInRange(params.t, ARGON2_BOUNDS.t.min, ARGON2_BOUNDS.t.max, 't');
  const p = requireIntInRange(params.p, ARGON2_BOUNDS.p.min, ARGON2_BOUNDS.p.max, 'p');
  if (params.v !== ARGON2_VERSION) {
    throw new Error(`recovery-core: unsupported argon2id version (expected ${ARGON2_VERSION})`);
  }
  return { m, t, p, v: ARGON2_VERSION };
}

/**
 * Derive the 32-byte IKM from a recovery code via Argon2id. `salt` is the envelope
 * salt bytes (per-envelope unique, which is all Argon2 needs). The code is
 * canonicalized first so minor transcription variance still derives the same IKM.
 */
export async function argon2idIkm(
  code: string,
  salt: Uint8Array,
  params: Argon2idParams,
): Promise<Uint8Array> {
  return argon2id({
    password: normalizeRecoveryCode(code),
    salt,
    parallelism: params.p,
    iterations: params.t,
    memorySize: params.m,
    hashLength: 32,
    outputType: 'binary',
  });
}

/**
 * Generate a fresh recovery code: {@link CODE_SYMBOLS} uniform Crockford base32
 * symbols, formatted in dash-separated groups of {@link GROUP_SIZE}.
 *
 * 256 is a multiple of 32, so `byte % 32` is already uniform over the alphabet
 * with no modulo bias and no rejection needed; one CSPRNG fill covers the code.
 */
export function generateRecoveryCode(): string {
  const bytes = randomBytes(CODE_SYMBOLS);
  const code = Array.from(bytes, (byte) => CROCKFORD.charAt(byte % 32)).join('');
  return (code.match(new RegExp(`.{1,${GROUP_SIZE}}`, 'g')) ?? []).join('-');
}

/**
 * Canonicalize a user-entered code for the KDF: strip separators/whitespace,
 * uppercase, and map Crockford confusables (O->0, I/L->1) so a code typed with
 * minor transcription variance still derives the same KEK.
 */
export function normalizeRecoveryCode(code: string): string {
  return code
    .toUpperCase()
    .replace(/[\s-]+/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
}

/** Minimum normalized length (~80-bit base32 floor) accepted as a recovery-code anchor. */
const MIN_RECOVERY_CODE_LENGTH = 16;

/**
 * Defense-in-depth guard so an integrating app cannot seal a recovery-code anchor
 * from a weak, offline-brute-forceable string (e.g. a short PIN). `generateRecoveryCode`
 * output is well above this floor.
 */
export function assertRecoveryCodeStrength(code: string): void {
  if (normalizeRecoveryCode(code).length < MIN_RECOVERY_CODE_LENGTH) {
    throw new Error(
      `recovery-core: recovery code too short (min ${MIN_RECOVERY_CODE_LENGTH} chars after normalization)`,
    );
  }
}
