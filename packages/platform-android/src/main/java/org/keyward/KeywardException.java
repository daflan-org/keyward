package org.keyward;

public final class KeywardException extends Exception {
    private KeywardException(String message) {
        super(message);
    }

    private KeywardException(String message, Throwable cause) {
        super(message, cause);
    }

    public static KeywardException userIdNotSet() {
        return new KeywardException("Keyward: userId not set.");
    }

    public static KeywardException storageWrite(Throwable cause) {
        return new KeywardException("Keyward: storage write failed.", cause);
    }

    public static KeywardException storageFailed(String key) {
        return new KeywardException("Keyward: storage operation failed for key: " + key);
    }
}
