import XCTest
@testable import Keyward

final class InMemoryBackend: KeychainBackend {
    private var store: [String: String] = [:]

    func set(key: String, value: String) throws {
        store[key] = value
    }

    func get(key: String) -> String? {
        store[key]
    }

    func remove(key: String) {
        store.removeValue(forKey: key)
    }

    func allKeys() -> [String] {
        Array(store.keys)
    }

    func clear() {
        store.removeAll()
    }
}

final class KeywardTests: XCTestCase {

    private var registry: KeyRegistry!

    override func setUp() {
        super.setUp()
        Keyward.backend = InMemoryBackend()
        registry = KeyRegistry()
    }

    // MARK: - userId management

    func testReturnsNilInitially() {
        XCTAssertNil(registry.getUserId())
    }

    func testStoresUserIdAfterSetUserId() {
        registry.setUserId("alice")
        XCTAssertEqual(registry.getUserId(), "alice")
    }

    func testResetsUserIdAfterClearUserId() {
        registry.setUserId("alice")
        registry.clearUserId()
        XCTAssertNil(registry.getUserId())
    }

    // MARK: - get / set / remove

    func testReturnsNilForMissingKey() throws {
        let result = try Keyward.get(KeyDef(key: "app-version", scope: .global), registry: registry)
        XCTAssertNil(result)
    }

    func testStoresAndRetrievesGlobalScopedValue() throws {
        try Keyward.set(KeyDef(key: "app-version", scope: .global), value: "1.0", registry: registry)
        let result = try Keyward.get(KeyDef(key: "app-version", scope: .global), registry: registry)
        XCTAssertEqual(result, "1.0")
    }

    func testStoresAndRetrievesDeviceScopedValue() throws {
        try Keyward.set(KeyDef(key: "volume", scope: .device), value: "80", registry: registry)
        let result = try Keyward.get(KeyDef(key: "volume", scope: .device), registry: registry)
        XCTAssertEqual(result, "80")
    }

    func testStoresAndRetrievesUserScopedValue() throws {
        registry.setUserId("alice")
        try Keyward.set(KeyDef(key: "theme", scope: .user), value: "dark", registry: registry)
        let result = try Keyward.get(KeyDef(key: "theme", scope: .user), registry: registry)
        XCTAssertEqual(result, "dark")
    }

    func testThrowsWhenAccessingUserScopedKeyWithoutUserId() {
        XCTAssertThrowsError(try Keyward.get(KeyDef(key: "theme", scope: .user), registry: registry)) { error in
            XCTAssertEqual((error as? KeywardError), .userIdNotSet)
        }
    }

    func testRemovesValue() throws {
        try Keyward.set(KeyDef(key: "app-version", scope: .global), value: "1.0", registry: registry)
        try Keyward.remove(KeyDef(key: "app-version", scope: .global), registry: registry)
        let result = try Keyward.get(KeyDef(key: "app-version", scope: .global), registry: registry)
        XCTAssertNil(result)
    }

    func testRemovingNonExistentKeyDoesNotThrow() throws {
        try Keyward.remove(KeyDef(key: "nope", scope: .global), registry: registry)
    }

    func testOverwritesExistingValue() throws {
        try Keyward.set(KeyDef(key: "lang", scope: .global), value: "en", registry: registry)
        try Keyward.set(KeyDef(key: "lang", scope: .global), value: "tr", registry: registry)
        let result = try Keyward.get(KeyDef(key: "lang", scope: .global), registry: registry)
        XCTAssertEqual(result, "tr")
    }

    // MARK: - user isolation

    func testDifferentUsersHaveSeparateValues() throws {
        registry.setUserId("alice")
        try Keyward.set(KeyDef(key: "theme", scope: .user), value: "dark", registry: registry)
        registry.setUserId("bob")
        try Keyward.set(KeyDef(key: "theme", scope: .user), value: "light", registry: registry)

        registry.setUserId("alice")
        XCTAssertEqual(try Keyward.get(KeyDef(key: "theme", scope: .user), registry: registry), "dark")
        registry.setUserId("bob")
        XCTAssertEqual(try Keyward.get(KeyDef(key: "theme", scope: .user), registry: registry), "light")
    }

    func testUserScopedKeysDoNotCollideWithDeviceScoped() throws {
        registry.setUserId("alice")
        try Keyward.set(KeyDef(key: "volume", scope: .user), value: "50", registry: registry)
        try Keyward.set(KeyDef(key: "volume", scope: .device), value: "80", registry: registry)

        XCTAssertEqual(try Keyward.get(KeyDef(key: "volume", scope: .user), registry: registry), "50")
        XCTAssertEqual(try Keyward.get(KeyDef(key: "volume", scope: .device), registry: registry), "80")
    }

    // MARK: - wipeUser

    func testWipeUserRemovesAllKeysForUser() throws {
        registry.setUserId("alice")
        try Keyward.set(KeyDef(key: "theme", scope: .user), value: "dark", registry: registry)
        try Keyward.set(KeyDef(key: "lang", scope: .user), value: "tr", registry: registry)

        Keyward.wipeUser("alice")

        XCTAssertNil(try Keyward.get(KeyDef(key: "theme", scope: .user), registry: registry))
        XCTAssertNil(try Keyward.get(KeyDef(key: "lang", scope: .user), registry: registry))
    }

    func testWipeUserDoesNotRemoveOtherUsersKeys() throws {
        registry.setUserId("alice")
        try Keyward.set(KeyDef(key: "theme", scope: .user), value: "dark", registry: registry)
        registry.setUserId("bob")
        try Keyward.set(KeyDef(key: "theme", scope: .user), value: "light", registry: registry)

        Keyward.wipeUser("alice")

        registry.setUserId("bob")
        XCTAssertEqual(try Keyward.get(KeyDef(key: "theme", scope: .user), registry: registry), "light")
    }

    func testWipeUserDoesNotRemoveDeviceOrGlobalKeys() throws {
        registry.setUserId("alice")
        try Keyward.set(KeyDef(key: "theme", scope: .user), value: "dark", registry: registry)
        try Keyward.set(KeyDef(key: "volume", scope: .device), value: "80", registry: registry)
        try Keyward.set(KeyDef(key: "app-version", scope: .global), value: "1.0", registry: registry)

        Keyward.wipeUser("alice")

        XCTAssertEqual(try Keyward.get(KeyDef(key: "volume", scope: .device), registry: registry), "80")
        XCTAssertEqual(try Keyward.get(KeyDef(key: "app-version", scope: .global), registry: registry), "1.0")
    }

    func testWipeUserIsNoOpForUserWithNoKeys() {
        Keyward.wipeUser("nobody")
    }

    // MARK: - raw API

    func testSetRawAndGetRaw() throws {
        try Keyward.setRaw(key: "raw-key", value: "raw-value")
        XCTAssertEqual(Keyward.getRaw(key: "raw-key"), "raw-value")
    }

    func testGetRawReturnsNilForMissingKey() {
        XCTAssertNil(Keyward.getRaw(key: "missing"))
    }

    func testRemoveRaw() throws {
        try Keyward.setRaw(key: "raw-key", value: "raw-value")
        Keyward.removeRaw(key: "raw-key")
        XCTAssertNil(Keyward.getRaw(key: "raw-key"))
    }

    func testClearAll() throws {
        try Keyward.setRaw(key: "a", value: "1")
        try Keyward.setRaw(key: "b", value: "2")
        Keyward.clearAll()
        XCTAssertTrue(Keyward.keys().isEmpty)
    }

    func testKeysReturnsAllStoredKeys() throws {
        try Keyward.setRaw(key: "x", value: "1")
        try Keyward.setRaw(key: "y", value: "2")
        let keys = Keyward.keys().sorted()
        XCTAssertEqual(keys, ["x", "y"])
    }
}
