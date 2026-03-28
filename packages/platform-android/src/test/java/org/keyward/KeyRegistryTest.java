package org.keyward;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

final class KeyRegistryTest {

    private KeyRegistry registry;

    @BeforeEach
    void setUp() {
        registry = new KeyRegistry();
    }

    // Scope enum

    @Test
    void scopeHasThreeCases() {
        assertEquals(3, Scope.values().length);
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
    void allowsChangingUserIdWithSubsequentCalls() {
        registry.setUserId("alice");
        registry.setUserId("bob");
        assertEquals("bob", registry.getUserId());
    }

    @Test
    void resetsUserIdToNullAfterClearUserId() {
        registry.setUserId("alice");
        registry.clearUserId();
        assertNull(registry.getUserId());
    }

    @Test
    void doesNotThrowWhenClearUserIdCalledWithoutUserId() {
        registry.clearUserId();
        assertNull(registry.getUserId());
    }

    // resolve: Scope.USER

    @Test
    void userScopeResolvesToPrefixedKey() throws KeywardException {
        registry.setUserId("alice");
        assertEquals("u/alice/theme", registry.resolve(new KeyDef("theme", Scope.USER)));
    }

    @Test
    void userScopeThrowsWhenUserIdNotSet() {
        KeywardException ex = assertThrows(KeywardException.class,
                () -> registry.resolve(new KeyDef("theme", Scope.USER)));
        assertEquals("Keyward: userId not set.", ex.getMessage());
    }

    @Test
    void userScopeThrowsAfterUserIdCleared() {
        registry.setUserId("alice");
        registry.clearUserId();
        assertThrows(KeywardException.class,
                () -> registry.resolve(new KeyDef("theme", Scope.USER)));
    }

    @Test
    void userScopeUsesCurrentUserIdAfterChange() throws KeywardException {
        registry.setUserId("alice");
        assertEquals("u/alice/theme", registry.resolve(new KeyDef("theme", Scope.USER)));
        registry.setUserId("bob");
        assertEquals("u/bob/theme", registry.resolve(new KeyDef("theme", Scope.USER)));
    }

    // resolve: Scope.DEVICE

    @Test
    void deviceScopeResolvesToPrefixedKey() throws KeywardException {
        assertEquals("d/volume", registry.resolve(new KeyDef("volume", Scope.DEVICE)));
    }

    @Test
    void deviceScopeDoesNotIncludeUserId() throws KeywardException {
        registry.setUserId("alice");
        assertEquals("d/volume", registry.resolve(new KeyDef("volume", Scope.DEVICE)));
    }

    // resolve: Scope.GLOBAL

    @Test
    void globalScopeResolvesToBareKey() throws KeywardException {
        assertEquals("app-version", registry.resolve(new KeyDef("app-version", Scope.GLOBAL)));
    }

    @Test
    void globalScopeDoesNotIncludeUserId() throws KeywardException {
        registry.setUserId("alice");
        assertEquals("app-version", registry.resolve(new KeyDef("app-version", Scope.GLOBAL)));
    }

    // resolve: edge cases

    @Test
    void emptyStringKeyGlobal() throws KeywardException {
        assertEquals("", registry.resolve(new KeyDef("", Scope.GLOBAL)));
    }

    @Test
    void emptyStringKeyDevice() throws KeywardException {
        assertEquals("d/", registry.resolve(new KeyDef("", Scope.DEVICE)));
    }

    @Test
    void emptyStringKeyUser() throws KeywardException {
        registry.setUserId("alice");
        assertEquals("u/alice/", registry.resolve(new KeyDef("", Scope.USER)));
    }

    @Test
    void keyWithSlashes() throws KeywardException {
        assertEquals("d/a/b/c", registry.resolve(new KeyDef("a/b/c", Scope.DEVICE)));
    }

    @Test
    void keyWithSpecialCharacters() throws KeywardException {
        assertEquals("settings.theme@v2", registry.resolve(new KeyDef("settings.theme@v2", Scope.GLOBAL)));
    }

    @Test
    void userIdWithSpecialCharacters() throws KeywardException {
        registry.setUserId("user@example.com");
        assertEquals("u/user@example.com/prefs", registry.resolve(new KeyDef("prefs", Scope.USER)));
    }

    @Test
    void keyWithSpaces() throws KeywardException {
        assertEquals("d/my key", registry.resolve(new KeyDef("my key", Scope.DEVICE)));
    }

    @Test
    void keyWithUnicodeCharacters() throws KeywardException {
        registry.setUserId("alice");
        assertEquals("u/alice/tema-\u00e7", registry.resolve(new KeyDef("tema-\u00e7", Scope.USER)));
        assertEquals("d/tema-\u00e7", registry.resolve(new KeyDef("tema-\u00e7", Scope.DEVICE)));
        assertEquals("tema-\u00e7", registry.resolve(new KeyDef("tema-\u00e7", Scope.GLOBAL)));
    }

    // getUserPrefix

    @Test
    void getUserPrefixFormat() {
        assertEquals("u/alice/", KeyRegistry.getUserPrefix("alice"));
    }

    @Test
    void getUserPrefixWithSpecialCharacters() {
        assertEquals("u/user@example.com/", KeyRegistry.getUserPrefix("user@example.com"));
    }

    @Test
    void getUserPrefixIsIndependentOfState() {
        assertEquals("u/bob/", KeyRegistry.getUserPrefix("bob"));
    }

    @Test
    void getUserPrefixMatchesResolveOutput() throws KeywardException {
        registry.setUserId("alice");
        String resolved = registry.resolve(new KeyDef("theme", Scope.USER));
        assertTrue(resolved.startsWith(KeyRegistry.getUserPrefix("alice")));
    }

    // instance isolation

    @Test
    void separateInstancesDoNotShareState() throws KeywardException {
        KeyRegistry other = new KeyRegistry();
        registry.setUserId("alice");
        other.setUserId("bob");
        assertEquals("u/alice/k", registry.resolve(new KeyDef("k", Scope.USER)));
        assertEquals("u/bob/k", other.resolve(new KeyDef("k", Scope.USER)));
    }
}
