package org.keyward.recovery;

/** WebAuthn PRF authenticator capability probe (the four PRF buckets, simplified). */
public final class PrfCapabilities {
    /** A platform passkey provider exists on this device. */
    public final boolean platformAuthenticator;
    /** The authenticator advertises the prf / hmac-secret extension. */
    public final boolean prfSupported;
    /** PRF output is available at credential-creation time. */
    public final boolean prfAtCreate;

    public PrfCapabilities(boolean platformAuthenticator, boolean prfSupported, boolean prfAtCreate) {
        this.platformAuthenticator = platformAuthenticator;
        this.prfSupported = prfSupported;
        this.prfAtCreate = prfAtCreate;
    }
}
