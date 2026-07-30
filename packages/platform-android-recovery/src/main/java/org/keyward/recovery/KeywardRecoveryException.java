package org.keyward.recovery;

/** Thrown when a PRF ceremony cannot be completed. */
public final class KeywardRecoveryException extends Exception {
    public KeywardRecoveryException(String message) {
        super(message);
    }

    public KeywardRecoveryException(String message, Throwable cause) {
        super(message, cause);
    }
}
