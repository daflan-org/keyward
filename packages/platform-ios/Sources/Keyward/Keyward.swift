public final class Keyward {
    static var backend: KeychainBackend = SystemKeychainBackend()
    private static let registry = KeyRegistry()

    // MARK: - User ID management (uses internal registry)

    public static func setUserId(_ userId: String) {
        registry.setUserId(userId)
    }

    public static func clearUserId() {
        registry.clearUserId()
    }

    public static func getUserId() -> String? {
        registry.getUserId()
    }

    // MARK: - High-level API with internal registry

    public static func get(_ keyDef: KeyDef) throws -> String? {
        try get(keyDef, registry: registry)
    }

    public static func set(_ keyDef: KeyDef, value: String) throws {
        try set(keyDef, value: value, registry: registry)
    }

    public static func remove(_ keyDef: KeyDef) throws {
        try remove(keyDef, registry: registry)
    }

    // MARK: - High-level API with explicit registry

    public static func get(_ keyDef: KeyDef, registry: KeyRegistry) throws -> String? {
        let resolvedKey = try registry.resolve(keyDef)
        return getRaw(key: resolvedKey)
    }

    public static func set(_ keyDef: KeyDef, value: String, registry: KeyRegistry) throws {
        let resolvedKey = try registry.resolve(keyDef)
        try setRaw(key: resolvedKey, value: value)
    }

    public static func remove(_ keyDef: KeyDef, registry: KeyRegistry) throws {
        let resolvedKey = try registry.resolve(keyDef)
        removeRaw(key: resolvedKey)
    }

    public static func keys() -> [String] {
        backend.allKeys()
    }

    public static func wipeUser(_ userId: String) {
        let prefix = KeyRegistry.getUserPrefix(userId)
        for key in keys() where key.hasPrefix(prefix) {
            removeRaw(key: key)
        }
    }

    // MARK: - Raw API (Capacitor bridge)

    public static func getRaw(key: String) -> String? {
        backend.get(key: key)
    }

    public static func setRaw(key: String, value: String) throws {
        try backend.set(key: key, value: value)
    }

    public static func removeRaw(key: String) {
        backend.remove(key: key)
    }

    public static func clearAll() {
        backend.clear()
    }

    private init() {}
}
