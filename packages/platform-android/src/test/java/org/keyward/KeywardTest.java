package org.keyward;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

final class KeywardTest {

    private KeyRegistry registry;

    @BeforeEach
    void setUp() {
        Keyward.backend = new InMemoryBackend();
        registry = new KeyRegistry();
    }

    // userId management

    @Test
    void returnsNullInitially() {
        assertNull(registry.getUserId());
    }

    @Test
    void storesUserIdAfterSetUserId() {
        registry.setUserId("alice");
        assertEquals("alice", registry.getUserId());
    }

    @Test
    void resetsUserIdAfterClearUserId() {
        registry.setUserId("alice");
        registry.clearUserId();
        assertNull(registry.getUserId());
    }

    // get / set / remove

    @Test
    void returnsNullForMissingKey() throws KeywardException {
        String result = Keyward.get(new KeyDef("app-version", Scope.GLOBAL), registry);
        assertNull(result);
    }

    @Test
    void storesAndRetrievesGlobalScopedValue() throws KeywardException {
        Keyward.set(new KeyDef("app-version", Scope.GLOBAL), "1.0", registry);
        String result = Keyward.get(new KeyDef("app-version", Scope.GLOBAL), registry);
        assertEquals("1.0", result);
    }

    @Test
    void storesAndRetrievesDeviceScopedValue() throws KeywardException {
        Keyward.set(new KeyDef("volume", Scope.DEVICE), "80", registry);
        String result = Keyward.get(new KeyDef("volume", Scope.DEVICE), registry);
        assertEquals("80", result);
    }

    @Test
    void storesAndRetrievesUserScopedValue() throws KeywardException {
        registry.setUserId("alice");
        Keyward.set(new KeyDef("theme", Scope.USER), "dark", registry);
        String result = Keyward.get(new KeyDef("theme", Scope.USER), registry);
        assertEquals("dark", result);
    }

    @Test
    void throwsWhenAccessingUserScopedKeyWithoutUserId() {
        KeywardException ex = assertThrows(KeywardException.class,
                () -> Keyward.get(new KeyDef("theme", Scope.USER), registry));
        assertEquals("Keyward: userId not set.", ex.getMessage());
    }

    @Test
    void removesValue() throws KeywardException {
        Keyward.set(new KeyDef("app-version", Scope.GLOBAL), "1.0", registry);
        Keyward.remove(new KeyDef("app-version", Scope.GLOBAL), registry);
        String result = Keyward.get(new KeyDef("app-version", Scope.GLOBAL), registry);
        assertNull(result);
    }

    @Test
    void removingNonExistentKeyDoesNotThrow() throws KeywardException {
        Keyward.remove(new KeyDef("nope", Scope.GLOBAL), registry);
    }

    @Test
    void overwritesExistingValue() throws KeywardException {
        Keyward.set(new KeyDef("lang", Scope.GLOBAL), "en", registry);
        Keyward.set(new KeyDef("lang", Scope.GLOBAL), "tr", registry);
        String result = Keyward.get(new KeyDef("lang", Scope.GLOBAL), registry);
        assertEquals("tr", result);
    }

    // user isolation

    @Test
    void differentUsersHaveSeparateValues() throws KeywardException {
        registry.setUserId("alice");
        Keyward.set(new KeyDef("theme", Scope.USER), "dark", registry);
        registry.setUserId("bob");
        Keyward.set(new KeyDef("theme", Scope.USER), "light", registry);

        registry.setUserId("alice");
        assertEquals("dark", Keyward.get(new KeyDef("theme", Scope.USER), registry));
        registry.setUserId("bob");
        assertEquals("light", Keyward.get(new KeyDef("theme", Scope.USER), registry));
    }

    @Test
    void userScopedKeysDoNotCollideWithDeviceScoped() throws KeywardException {
        registry.setUserId("alice");
        Keyward.set(new KeyDef("volume", Scope.USER), "50", registry);
        Keyward.set(new KeyDef("volume", Scope.DEVICE), "80", registry);

        assertEquals("50", Keyward.get(new KeyDef("volume", Scope.USER), registry));
        assertEquals("80", Keyward.get(new KeyDef("volume", Scope.DEVICE), registry));
    }

    // wipeUser

    @Test
    void wipeUserRemovesAllKeysForUser() throws KeywardException {
        registry.setUserId("alice");
        Keyward.set(new KeyDef("theme", Scope.USER), "dark", registry);
        Keyward.set(new KeyDef("lang", Scope.USER), "tr", registry);

        Keyward.wipeUser("alice");

        assertNull(Keyward.get(new KeyDef("theme", Scope.USER), registry));
        assertNull(Keyward.get(new KeyDef("lang", Scope.USER), registry));
    }

    @Test
    void wipeUserDoesNotRemoveOtherUsersKeys() throws KeywardException {
        registry.setUserId("alice");
        Keyward.set(new KeyDef("theme", Scope.USER), "dark", registry);
        registry.setUserId("bob");
        Keyward.set(new KeyDef("theme", Scope.USER), "light", registry);

        Keyward.wipeUser("alice");

        registry.setUserId("bob");
        assertEquals("light", Keyward.get(new KeyDef("theme", Scope.USER), registry));
    }

    @Test
    void wipeUserDoesNotRemoveDeviceOrGlobalKeys() throws KeywardException {
        registry.setUserId("alice");
        Keyward.set(new KeyDef("theme", Scope.USER), "dark", registry);
        Keyward.set(new KeyDef("volume", Scope.DEVICE), "80", registry);
        Keyward.set(new KeyDef("app-version", Scope.GLOBAL), "1.0", registry);

        Keyward.wipeUser("alice");

        assertEquals("80", Keyward.get(new KeyDef("volume", Scope.DEVICE), registry));
        assertEquals("1.0", Keyward.get(new KeyDef("app-version", Scope.GLOBAL), registry));
    }

    @Test
    void wipeUserIsNoOpForUserWithNoKeys() {
        Keyward.wipeUser("nobody");
    }

    // raw API

    @Test
    void setRawAndGetRaw() throws KeywardException {
        Keyward.setRaw("raw-key", "raw-value");
        assertEquals("raw-value", Keyward.getRaw("raw-key"));
    }

    @Test
    void getRawReturnsNullForMissingKey() {
        assertNull(Keyward.getRaw("missing"));
    }

    @Test
    void removeRaw() throws KeywardException {
        Keyward.setRaw("raw-key", "raw-value");
        Keyward.removeRaw("raw-key");
        assertNull(Keyward.getRaw("raw-key"));
    }

    @Test
    void clearAll() throws KeywardException {
        Keyward.setRaw("a", "1");
        Keyward.setRaw("b", "2");
        Keyward.clearAll();
        assertTrue(Keyward.keys().isEmpty());
    }

    @Test
    void keysReturnsAllStoredKeys() throws KeywardException {
        Keyward.setRaw("x", "1");
        Keyward.setRaw("y", "2");
        List<String> keys = Keyward.keys();
        Collections.sort(keys);
        assertEquals(List.of("x", "y"), keys);
    }
}
