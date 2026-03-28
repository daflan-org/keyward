public class KeyRegistry {
    private var currentUserId: String?

    public init() {}

    public func setUserId(_ userId: String) {
        currentUserId = userId
    }

    public func clearUserId() {
        currentUserId = nil
    }

    public func getUserId() -> String? {
        currentUserId
    }

    public func resolve(_ keyDef: KeyDef) throws -> String {
        switch keyDef.scope {
        case .user:
            guard let userId = currentUserId else {
                throw KeywardError.userIdNotSet
            }
            return "u/\(userId)/\(keyDef.key)"
        case .device:
            return "d/\(keyDef.key)"
        case .global:
            return keyDef.key
        }
    }

    public static func getUserPrefix(_ userId: String) -> String {
        "u/\(userId)/"
    }

    public func getUserPrefix(_ userId: String) -> String {
        Self.getUserPrefix(userId)
    }
}
