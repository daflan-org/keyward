import Foundation

#if canImport(AuthenticationServices)
import AuthenticationServices

/// Facade the Capacitor bridge calls. Speaks base64url in/out (matching the JS
/// `NativePrf` port); all crypto/envelope work stays in `@daflan/keyward-recovery-core`.
public enum KeywardRecovery {
    /// Supplied by the host (the plugin sets it to the key window). Required for register/assert.
    public static var anchorProvider: (() -> ASPresentationAnchor)?

    public static func capabilities() -> PrfCapabilities {
        if #available(iOS 18.0, macOS 15.0, *) {
            // TODO: replace with a real probe (a checkForSupport PRF registration request)
            // instead of assuming support from the OS version.
            return PrfCapabilities(
                platformAuthenticator: true,
                prfSupported: true,
                prfAtCreate: true
            )
        }
        return PrfCapabilities(
            platformAuthenticator: true,
            prfSupported: false,
            prfAtCreate: false
        )
    }

    @available(iOS 18.0, macOS 15.0, *)
    public static func register(
        rpId: String,
        userId: String,
        userName: String,
        challenge: String,
        saltFirst: String
    ) async throws -> PrfRegisterResult {
        let controller = try makeController()
        guard
            let challengeData = Base64URL.decode(challenge),
            let saltData = Base64URL.decode(saltFirst)
        else {
            throw KeywardRecoveryError.invalidInput("challenge/saltFirst must be base64url")
        }
        return try await controller.register(
            rpId: rpId,
            userId: Data(userId.utf8),
            userName: userName,
            challenge: challengeData,
            saltFirst: saltData
        )
    }

    @available(iOS 18.0, macOS 15.0, *)
    public static func assert(
        rpId: String,
        challenge: String,
        saltFirst: String,
        credentialId: String?
    ) async throws -> PrfAssertResult {
        let controller = try makeController()
        guard
            let challengeData = Base64URL.decode(challenge),
            let saltData = Base64URL.decode(saltFirst)
        else {
            throw KeywardRecoveryError.invalidInput("challenge/saltFirst must be base64url")
        }
        let credentialData = credentialId.flatMap { Base64URL.decode($0) }
        return try await controller.assert(
            rpId: rpId,
            challenge: challengeData,
            saltFirst: saltData,
            credentialId: credentialData
        )
    }

    @available(iOS 18.0, macOS 15.0, *)
    private static func makeController() throws -> PRFCredentialController {
        guard let anchorProvider else {
            throw KeywardRecoveryError.invalidInput("KeywardRecovery.anchorProvider is not set")
        }
        return PRFCredentialController(anchorProvider: anchorProvider)
    }
}

#else

/// Platforms without AuthenticationServices: report no PRF support.
public enum KeywardRecovery {
    public static func capabilities() -> PrfCapabilities {
        PrfCapabilities(platformAuthenticator: false, prfSupported: false, prfAtCreate: false)
    }
}

#endif
