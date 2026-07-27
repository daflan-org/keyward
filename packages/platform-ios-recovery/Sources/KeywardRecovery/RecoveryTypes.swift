import Foundation

/// WebAuthn PRF authenticator capability probe (the four PRF buckets, simplified).
public struct PrfCapabilities: Codable, Equatable {
    public let platformAuthenticator: Bool
    public let prfSupported: Bool
    public let prfAtCreate: Bool

    public init(platformAuthenticator: Bool, prfSupported: Bool, prfAtCreate: Bool) {
        self.platformAuthenticator = platformAuthenticator
        self.prfSupported = prfSupported
        self.prfAtCreate = prfAtCreate
    }
}

public struct PrfRegisterResult: Equatable {
    /// base64url credential id.
    public let credentialId: String
    /// base64url 32-byte PRF output, or nil when only available at assert time.
    public let prfFirst: String?

    public init(credentialId: String, prfFirst: String?) {
        self.credentialId = credentialId
        self.prfFirst = prfFirst
    }
}

public struct PrfAssertResult: Equatable {
    public let credentialId: String
    /// base64url 32-byte PRF output.
    public let prfFirst: String

    public init(credentialId: String, prfFirst: String) {
        self.credentialId = credentialId
        self.prfFirst = prfFirst
    }
}

public enum KeywardRecoveryError: Error {
    case unsupported
    case cancelled
    case noPrfOutput
    case invalidInput(String)
    case authorizationFailed(String)
}

/// base64url helpers: the JS bridge speaks base64url, native speaks Data.
public enum Base64URL {
    public static func encode(_ data: Data) -> String {
        data.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }

    public static func decode(_ value: String) -> Data? {
        var s = value
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        while s.count % 4 != 0 { s += "=" }
        return Data(base64Encoded: s)
    }
}
