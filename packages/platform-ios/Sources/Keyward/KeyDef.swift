public struct KeyDef: Equatable, Hashable {
    public let key: String
    public let scope: Scope

    public init(key: String, scope: Scope) {
        self.key = key
        self.scope = scope
    }
}
