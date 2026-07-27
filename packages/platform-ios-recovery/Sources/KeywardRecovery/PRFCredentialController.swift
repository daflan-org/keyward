#if canImport(AuthenticationServices)
import AuthenticationServices
import CryptoKit
import Foundation

/// Drives a single passkey WebAuthn ceremony with the `prf` extension and returns
/// the deterministic PRF output. Native does PRF I/O only; no crypto, no envelope.
///
/// The PRF output arrives as a CryptoKit `SymmetricKey`; we serialize it to base64url
/// raw bytes for the JS bridge (the envelope crypto stays in recovery-core).
@available(iOS 18.0, macOS 15.0, *)
final class PRFCredentialController: NSObject,
    ASAuthorizationControllerDelegate,
    ASAuthorizationControllerPresentationContextProviding
{
    private let anchorProvider: () -> ASPresentationAnchor
    private var continuation: CheckedContinuation<ASAuthorization, Error>?
    private var controller: ASAuthorizationController?

    init(anchorProvider: @escaping () -> ASPresentationAnchor) {
        self.anchorProvider = anchorProvider
    }

    // MARK: - Register (create passkey, optionally get PRF at create)

    func register(
        rpId: String,
        userId: Data,
        userName: String,
        challenge: Data,
        saltFirst: Data
    ) async throws -> PrfRegisterResult {
        let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(
            relyingPartyIdentifier: rpId
        )
        let request = provider.createCredentialRegistrationRequest(
            challenge: challenge,
            name: userName,
            userID: userId
        )
        // Build the shared InputValues, then the registration PRF input via its factory.
        let inputValues = ASAuthorizationPublicKeyCredentialPRFAssertionInput.InputValues.saltInput1(
            saltFirst,
            saltInput2: nil
        )
        request.prf = .inputValues(inputValues)

        let authorization = try await perform(request)
        guard let credential = authorization.credential
            as? ASAuthorizationPlatformPublicKeyCredentialRegistration
        else {
            throw KeywardRecoveryError.authorizationFailed("unexpected registration credential")
        }
        let credentialId = Base64URL.encode(credential.credentialID)
        let prfFirst = credential.prf?.first.map { Base64URL.encode(Self.data(from: $0)) }
        return PrfRegisterResult(credentialId: credentialId, prfFirst: prfFirst)
    }

    // MARK: - Assert (re-derive PRF on an existing passkey)

    func assert(
        rpId: String,
        challenge: Data,
        saltFirst: Data,
        credentialId: Data?
    ) async throws -> PrfAssertResult {
        let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(
            relyingPartyIdentifier: rpId
        )
        let request = provider.createCredentialAssertionRequest(challenge: challenge)
        let inputValues = ASAuthorizationPublicKeyCredentialPRFAssertionInput.InputValues.saltInput1(
            saltFirst,
            saltInput2: nil
        )
        request.prf = .inputValues(inputValues)
        if let credentialId {
            request.allowedCredentials = [
                ASAuthorizationPlatformPublicKeyCredentialDescriptor(credentialID: credentialId)
            ]
        }

        let authorization = try await perform(request)
        guard let assertion = authorization.credential
            as? ASAuthorizationPlatformPublicKeyCredentialAssertion
        else {
            throw KeywardRecoveryError.authorizationFailed("unexpected assertion credential")
        }
        guard let prf = assertion.prf?.first else {
            throw KeywardRecoveryError.noPrfOutput
        }
        return PrfAssertResult(
            credentialId: Base64URL.encode(assertion.credentialID),
            prfFirst: Base64URL.encode(Self.data(from: prf))
        )
    }

    /// The WebAuthn PRF output is delivered as a CryptoKit `SymmetricKey`; extract raw bytes.
    private static func data(from key: SymmetricKey) -> Data {
        key.withUnsafeBytes { Data($0) }
    }

    // MARK: - ASAuthorizationController plumbing

    private func perform(_ request: ASAuthorizationRequest) async throws -> ASAuthorization {
        try await withCheckedThrowingContinuation { continuation in
            self.continuation = continuation
            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            self.controller = controller
            controller.performRequests()
        }
    }

    func authorizationController(
        controller _: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        continuation?.resume(returning: authorization)
        continuation = nil
        self.controller = nil
    }

    func authorizationController(
        controller _: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        if let authError = error as? ASAuthorizationError, authError.code == .canceled {
            continuation?.resume(throwing: KeywardRecoveryError.cancelled)
        } else {
            continuation?.resume(throwing: error)
        }
        continuation = nil
        self.controller = nil
    }

    func presentationAnchor(for _: ASAuthorizationController) -> ASPresentationAnchor {
        anchorProvider()
    }
}
#endif
