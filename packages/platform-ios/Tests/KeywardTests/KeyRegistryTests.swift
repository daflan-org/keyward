import XCTest
@testable import Keyward

final class KeyRegistryTests: XCTestCase {

    private var registry: KeyRegistry!

    override func setUp() {
        super.setUp()
        registry = KeyRegistry()
    }

    // MARK: - Scope enum

    func testScopeHasThreeCases() {
        let cases: [Scope] = [.user, .device, .global]
        XCTAssertEqual(cases.count, 3)
    }

    // MARK: - userId management

    func testReturnsNilInitially() {
        XCTAssertNil(registry.getUserId())
    }

    func testStoresUserIdAfterSetUserId() {
        registry.setUserId("alice")
        XCTAssertEqual(registry.getUserId(), "alice")
    }

    func testAllowsChangingUserIdWithSubsequentCalls() {
        registry.setUserId("alice")
        registry.setUserId("bob")
        XCTAssertEqual(registry.getUserId(), "bob")
    }

    func testResetsUserIdToNilAfterClearUserId() {
        registry.setUserId("alice")
        registry.clearUserId()
        XCTAssertNil(registry.getUserId())
    }

    func testDoesNotThrowWhenClearUserIdCalledWithoutUserId() {
        registry.clearUserId()
        XCTAssertNil(registry.getUserId())
    }

    // MARK: - resolve: Scope.user

    func testUserScopeResolvesToPrefixedKey() throws {
        registry.setUserId("alice")
        XCTAssertEqual(try registry.resolve(KeyDef(key: "theme", scope: .user)), "u/alice/theme")
    }

    func testUserScopeThrowsWhenUserIdNotSet() {
        XCTAssertThrowsError(try registry.resolve(KeyDef(key: "theme", scope: .user))) { error in
            XCTAssertEqual((error as? KeywardError), .userIdNotSet)
            XCTAssertEqual(error.localizedDescription, "Keyward: userId not set.")
        }
    }

    func testUserScopeThrowsAfterUserIdCleared() {
        registry.setUserId("alice")
        registry.clearUserId()
        XCTAssertThrowsError(try registry.resolve(KeyDef(key: "theme", scope: .user))) { error in
            XCTAssertEqual((error as? KeywardError), .userIdNotSet)
        }
    }

    func testUserScopeUsesCurrentUserIdAfterChange() throws {
        registry.setUserId("alice")
        XCTAssertEqual(try registry.resolve(KeyDef(key: "theme", scope: .user)), "u/alice/theme")
        registry.setUserId("bob")
        XCTAssertEqual(try registry.resolve(KeyDef(key: "theme", scope: .user)), "u/bob/theme")
    }

    // MARK: - resolve: Scope.device

    func testDeviceScopeResolvesToPrefixedKey() throws {
        XCTAssertEqual(try registry.resolve(KeyDef(key: "volume", scope: .device)), "d/volume")
    }

    func testDeviceScopeDoesNotIncludeUserId() throws {
        registry.setUserId("alice")
        XCTAssertEqual(try registry.resolve(KeyDef(key: "volume", scope: .device)), "d/volume")
    }

    // MARK: - resolve: Scope.global

    func testGlobalScopeResolvesToBareKey() throws {
        XCTAssertEqual(try registry.resolve(KeyDef(key: "app-version", scope: .global)), "app-version")
    }

    func testGlobalScopeDoesNotIncludeUserId() throws {
        registry.setUserId("alice")
        XCTAssertEqual(try registry.resolve(KeyDef(key: "app-version", scope: .global)), "app-version")
    }

    // MARK: - resolve: edge cases

    func testEmptyStringKeyGlobal() throws {
        XCTAssertEqual(try registry.resolve(KeyDef(key: "", scope: .global)), "")
    }

    func testEmptyStringKeyDevice() throws {
        XCTAssertEqual(try registry.resolve(KeyDef(key: "", scope: .device)), "d/")
    }

    func testEmptyStringKeyUser() throws {
        registry.setUserId("alice")
        XCTAssertEqual(try registry.resolve(KeyDef(key: "", scope: .user)), "u/alice/")
    }

    func testKeyWithSlashes() throws {
        XCTAssertEqual(try registry.resolve(KeyDef(key: "a/b/c", scope: .device)), "d/a/b/c")
    }

    func testKeyWithSpecialCharacters() throws {
        XCTAssertEqual(try registry.resolve(KeyDef(key: "settings.theme@v2", scope: .global)), "settings.theme@v2")
    }

    func testUserIdWithSpecialCharacters() throws {
        registry.setUserId("user@example.com")
        XCTAssertEqual(try registry.resolve(KeyDef(key: "prefs", scope: .user)), "u/user@example.com/prefs")
    }

    func testKeyWithSpaces() throws {
        XCTAssertEqual(try registry.resolve(KeyDef(key: "my key", scope: .device)), "d/my key")
    }

    func testKeyWithUnicodeCharacters() throws {
        registry.setUserId("alice")
        XCTAssertEqual(try registry.resolve(KeyDef(key: "tema-\u{00e7}", scope: .user)), "u/alice/tema-\u{00e7}")
        XCTAssertEqual(try registry.resolve(KeyDef(key: "tema-\u{00e7}", scope: .device)), "d/tema-\u{00e7}")
        XCTAssertEqual(try registry.resolve(KeyDef(key: "tema-\u{00e7}", scope: .global)), "tema-\u{00e7}")
    }

    // MARK: - getUserPrefix

    func testGetUserPrefixFormat() {
        XCTAssertEqual(registry.getUserPrefix("alice"), "u/alice/")
    }

    func testGetUserPrefixWithSpecialCharacters() {
        XCTAssertEqual(registry.getUserPrefix("user@example.com"), "u/user@example.com/")
    }

    func testGetUserPrefixIsIndependentOfState() {
        XCTAssertEqual(registry.getUserPrefix("bob"), "u/bob/")
    }

    func testGetUserPrefixMatchesResolveOutput() throws {
        registry.setUserId("alice")
        let resolved = try registry.resolve(KeyDef(key: "theme", scope: .user))
        XCTAssertTrue(resolved.hasPrefix(registry.getUserPrefix("alice")))
    }

    // MARK: - instance isolation

    func testSeparateInstancesDoNotShareState() throws {
        let other = KeyRegistry()
        registry.setUserId("alice")
        other.setUserId("bob")
        XCTAssertEqual(try registry.resolve(KeyDef(key: "k", scope: .user)), "u/alice/k")
        XCTAssertEqual(try other.resolve(KeyDef(key: "k", scope: .user)), "u/bob/k")
    }
}
