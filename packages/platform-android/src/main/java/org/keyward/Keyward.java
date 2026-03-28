package org.keyward;

import java.util.ArrayList;
import java.util.List;

public final class Keyward {
    static KeystoreBackend backend;
    private static final KeyRegistry registry = new KeyRegistry();

    public static void setBackend(KeystoreBackend b) {
        backend = b;
    }

    // User ID management (uses internal registry)

    public static void setUserId(String userId) {
        registry.setUserId(userId);
    }

    public static void clearUserId() {
        registry.clearUserId();
    }

    public static String getUserId() {
        return registry.getUserId();
    }

    // High-level API with internal registry

    public static String get(KeyDef keyDef) throws KeywardException {
        return get(keyDef, registry);
    }

    public static void set(KeyDef keyDef, String value) throws KeywardException {
        set(keyDef, value, registry);
    }

    public static void remove(KeyDef keyDef) throws KeywardException {
        remove(keyDef, registry);
    }

    // High-level API with explicit registry

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
