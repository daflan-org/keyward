# @daflan/keyward-recovery

Capacitor bridge for Keyward **recoverable secrets**. Registers the native
`KeywardRecovery` plugin (passkey WebAuthn PRF I/O) and wires it to the platform-
agnostic `@daflan/keyward-recovery-core`. Tracking: KW-29.

## What it does

- Native PRF I/O only: `capabilities`, `prfRegister`, `prfAssert`.
  - iOS: `AuthenticationServices` typed PRF (iOS 18+, `prfSupported=false` below).
  - Android: Jetpack `CredentialManager`, PRF via the WebAuthn JSON `prf` extension.
- All crypto (envelope, HKDF, AES-GCM) lives in `recovery-core`. No server-side
  WebAuthn verification: `challenge` is client-random.

## Usage

```ts
import { createRecoverable } from '@daflan/keyward-recovery';

const recoverable = createRecoverable({
  transport: myBackendEnvelopeTransport, // your own EnvelopeTransport adapter
  rpId: 'app.example.com',               // your domain (hosts the association files)
});

await recoverable.set('family.key', familyKeyBytes, {
  userId, userName, recipients: [{ kind: 'passkey' }],
});
```

## Native packaging

Mirrors `@daflan/keyward-capacitor`: `prepack` copies the pure native libs
(`platform-ios-recovery`, `platform-android-recovery`) into `ios/` and `android/`.
The Android CredentialManager implementation lives here (it needs the Android SDK);
the pure Java interface is copied in.

## Consumer prerequisites

- Own the RP-ID domain and host `apple-app-site-association` + `assetlinks.json`.
- Provide an `EnvelopeTransport` (your backend).

## License

[MIT](../../LICENSE)
