package org.keyward.recovery;

/** Result of re-deriving PRF on an existing passkey. */
public final class PrfAssertResult {
    /** base64url credential id. */
    public final String credentialId;
    /** base64url 32-byte PRF output. */
    public final String prfFirst;

    public PrfAssertResult(String credentialId, String prfFirst) {
        this.credentialId = credentialId;
        this.prfFirst = prfFirst;
    }
}
