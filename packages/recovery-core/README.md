# @daflan/keyward-recovery-core

Platform-agnostic core for **recoverable secrets**: a multi-recipient envelope plus
the passkey-PRF recovery orchestration. Native-free (WebCrypto only), so it is the
one security-critical surface that gets independently reviewed. Tracking: KW-29.

## Model

```
DK   = random 256-bit                       // per secret
blob = iv || AES-256-GCM(secret, DK)        // opaque, stored on the backend
KEK  = HKDF-SHA256(prfOutput, info)         // per recipient
wrap = iv || AES-256-GCM(DK, KEK)           // one per recovery anchor
```

Any single recipient (passkey-PRF, social re-seal, or an optional code) unwraps the
Data Key and opens the blob. A new device or ecosystem adds a recipient without
re-sealing the secret.

## Ports (supplied by the host)

- `NativePrf` — passkey WebAuthn PRF I/O. Implemented by `@daflan/keyward-recovery`
  (the Capacitor bridge). `challenge` may be client-random: PRF-as-KEK needs no
  server-side WebAuthn verification.
- `EnvelopeTransport` — the opaque-blob store. The consuming app supplies its own
  backend adapter (multi-tenant). A hosted "Keyward Cloud" adapter can be added later.

## Usage (shape)

```ts
import { Recoverable } from '@daflan/keyward-recovery-core';

const recoverable = new Recoverable({ native, transport, rpId: 'app.example.com' });

// enroll
await recoverable.set('family.key', familyKeyBytes, {
  userId, userName, recipients: [{ kind: 'passkey' }],
});

// new device
const familyKey = await recoverable.recover('family.key');
```

## Consumer prerequisites

The consuming app owns the RP-ID domain and hosts the passkey association files
(`apple-app-site-association`, `assetlinks.json`). Keyward stays domain-agnostic and
takes `rpId` as a parameter.

## Status

Scaffold (KW-29). v1 recipients: passkey-PRF + social. The code (Argon2id) recipient
kind is reserved in the format but deferred so this package stays WebCrypto-only.

## License

[MIT](../../LICENSE)
