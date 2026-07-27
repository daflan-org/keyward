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

describe('base64url', () => {
  it('round-trips arbitrary bytes', () => {
    const bytes = randomBytes(64);
    expect(fromBase64Url(toBase64Url(bytes))).toEqual(bytes);
  });

  it('produces url-safe output with no padding', () => {
    const encoded = toBase64Url(new Uint8Array([251, 255, 191, 0]));
    expect(encoded).not.toMatch(/[+/=]/);
  });
});

describe('envelope round-trip', () => {
  it('recovers the secret through a single recipient', async () => {
    const secret = randomBytes(32);
    const { dataKey, blob } = await sealSecret(secret);

    // Simulate one recipient with a stand-in PRF output (no native authenticator here).
    const prfOutput = randomBytes(32);
    const kekEnroll = await deriveKek(prfOutput);
    const wrap = await wrapDataKey(dataKey, kekEnroll);

    // Recover: derive the same KEK from the same PRF output, unwrap DK, open blob.
    const kekRecover = await deriveKek(prfOutput);
    const recoveredDataKey = await unwrapDataKey(wrap, kekRecover);
    const recoveredSecret = await openBlob(blob, recoveredDataKey);

    expect(recoveredSecret).toEqual(secret);
  });

  it('fails to unwrap with a different PRF output', async () => {
    const secret = randomBytes(32);
    const { dataKey, blob } = await sealSecret(secret);
    const wrap = await wrapDataKey(dataKey, await deriveKek(randomBytes(32)));

    await expect(unwrapDataKey(wrap, await deriveKek(randomBytes(32)))).rejects.toThrow();
    expect(blob.length).toBeGreaterThan(0);
  });
});
