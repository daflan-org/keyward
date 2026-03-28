package org.keyward;

import java.util.ArrayList;
import java.util.List;

public final class Keyward {
    static KeystoreBackend backend;

    public static void setBackend(KeystoreBackend b) {
        backend = b;
    }

    // High-level API (native Android consumers)

    public static String get(KeyDef keyDef, KeyRegistry registry) throws KeywardException {
        String resolvedKey = registry.resolve(keyDef);
        return getRaw(resolvedKey);
    }

    public static void set(KeyDef keyDef, String value, KeyRegistry registry) throws KeywardException {
        String resolvedKey = registry.resolve(keyDef);
        setRaw(resolvedKey, value);
    }

    public static void remove(KeyDef keyDef, KeyRegistry registry) throws KeywardException {
        String resolvedKey = registry.resolve(keyDef);
        removeRaw(resolvedKey);
    }

    public static List<String> keys() {
        return backend.allKeys();
    }

    public static void wipeUser(String userId) {
        String prefix = KeyRegistry.getUserPrefix(userId);
        for (String key : new ArrayList<>(keys())) {
            if (key.startsWith(prefix)) {
                removeRaw(key);
            }
        }
    }

    // Raw API (Capacitor bridge)

    public static String getRaw(String key) {
        return backend.get(key);
    }

    public static void setRaw(String key, String value) throws KeywardException {
        backend.set(key, value);
    }

    public static void removeRaw(String key) {
        backend.remove(key);
    }

    public static void clearAll() {
        backend.clear();
    }

    private Keyward() {}
}
