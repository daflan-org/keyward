public final class Keyward {
    static var backend: KeychainBackend = SystemKeychainBackend()

    // MARK: - High-level API (native iOS consumers)

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
