package org.keyward.recovery;

/** Result of enrolling a passkey (optionally with PRF at create). */
public final class PrfRegisterResult {
    /** base64url credential id. */
    public final String credentialId;
    /** base64url 32-byte PRF output, or null when only available at assert time. */
    public final String prfFirst;

    public PrfRegisterResult(String credentialId, String prfFirst) {
        this.credentialId = credentialId;
        this.prfFirst = prfFirst;
    }
}
