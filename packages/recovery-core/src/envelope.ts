/**
 * Envelope crypto (WebCrypto, native-free). This is the security-critical surface
 * that must be independently reviewed before shipping (see KW-29).
 *
 *   DK   = random 256-bit                       // per secret
 *   blob = iv || AES-256-GCM(secret, DK)        // opaque, stored on the backend
 *   KEK  = HKDF-SHA256(prfOutput, info)         // per recipient
 *   wrap = iv || AES-256-GCM(DK, KEK)           // one per recovery anchor
 */

const IV_BYTES = 12;
const DK_BYTES = 32;
const HKDF_INFO = 'keyward-recovery/v1';
const textEncoder = new TextEncoder();

/**
 * Copy into a fresh ArrayBuffer-backed view. TypeScript's typed arrays are generic
 * over the backing buffer (`Uint8Array<ArrayBufferLike>`), while WebCrypto wants
 * `ArrayBufferView<ArrayBuffer>`; this pins the buffer type at every crypto boundary.
 */
function asView(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy;
}

export function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(length));
}

export function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importAesKey(raw: Uint8Array, usages: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', asView(raw), { name: 'AES-GCM' }, false, usages);
}

/** iv || ciphertext, base64url. */
export async function seal(key: CryptoKey, plaintext: Uint8Array): Promise<string> {
  const iv = randomBytes(IV_BYTES);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, asView(plaintext)),
  );
  const packed = new Uint8Array(iv.length + ciphertext.length);
  packed.set(iv, 0);
  packed.set(ciphertext, iv.length);
  return toBase64Url(packed);
}

export async function open(key: CryptoKey, packedBase64Url: string): Promise<Uint8Array> {
  const packed = fromBase64Url(packedBase64Url);
  const iv = asView(packed.subarray(0, IV_BYTES));
  const ciphertext = asView(packed.subarray(IV_BYTES));
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext));
}

/** Derive a per-recipient KEK from a PRF output (or any recipient IKM) via HKDF-SHA256. */
export async function deriveKek(ikm: Uint8Array, info: string = HKDF_INFO): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', asView(ikm), 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(0),
      info: asView(textEncoder.encode(info)),
    },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export interface SealedSecret {
  /** Raw Data Key bytes (kept only in memory; wrapped per recipient, never stored bare). */
  readonly dataKey: Uint8Array;
  /** Opaque blob for the envelope. */
  readonly blob: string;
}

/** Generate a fresh Data Key and seal the secret under it. */
export async function sealSecret(secret: Uint8Array): Promise<SealedSecret> {
  const dataKey = randomBytes(DK_BYTES);
  const dkKey = await importAesKey(dataKey, ['encrypt']);
  const blob = await seal(dkKey, secret);
  return { dataKey, blob };
}

/** Wrap the Data Key for one recipient using its KEK. */
export async function wrapDataKey(dataKey: Uint8Array, kek: CryptoKey): Promise<string> {
  return seal(kek, dataKey);
}

/** Unwrap the Data Key from one recipient's wrap using its KEK. */
export async function unwrapDataKey(wrap: string, kek: CryptoKey): Promise<Uint8Array> {
  return open(kek, wrap);
}

/** Decrypt the secret from the blob given the recovered Data Key. */
export async function openBlob(blob: string, dataKey: Uint8Array): Promise<Uint8Array> {
  const dkKey = await importAesKey(dataKey, ['decrypt']);
  return open(dkKey, blob);
}
