package org.keyward.recovery;

/**
 * Narrow native contract for passkey WebAuthn PRF: I/O only, no crypto or envelope.
 *
 * <p>SDK-free by design. The Android implementation (Jetpack CredentialManager) lives
 * in the Capacitor bridge module, which has the Android SDK and androidx.credentials.
 * The methods are callback-based because CredentialManager is asynchronous.
 *
 * <p>All binary values (challenge, saltFirst, credentialId, prfFirst) are base64url,
 * matching the JS {@code NativePrf} port. {@code challenge} may be client-random:
 * PRF-as-KEK needs no server-side WebAuthn verification.
 */
public interface KeywardRecoveryPrf {

    PrfCapabilities capabilities();

    void register(
            String rpId,
            String userId,
            String userName,
            String challenge,
            String saltFirst,
            Callback<PrfRegisterResult> callback);

    void assertPrf(
            String rpId,
            String challenge,
            String saltFirst,
            String credentialId,
            Callback<PrfAssertResult> callback);

    interface Callback<T> {
        void onSuccess(T result);

        void onError(Throwable error);
    }
}
