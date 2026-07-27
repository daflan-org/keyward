import AuthenticationServices
import Capacitor
import Foundation
import UIKit
#if canImport(KeywardRecovery)
import KeywardRecovery
#endif

@objc(KeywardRecoveryPlugin)
public class KeywardRecoveryPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "KeywardRecoveryPlugin"
    public let jsName = "KeywardRecovery"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "capabilities", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "prfRegister", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "prfAssert", returnType: CAPPluginReturnPromise),
    ]

    @objc func capabilities(_ call: CAPPluginCall) {
        let caps = KeywardRecovery.capabilities()
        call.resolve([
            "platformAuthenticator": caps.platformAuthenticator,
            "prfSupported": caps.prfSupported,
            "prfAtCreate": caps.prfAtCreate,
        ])
    }

    @objc func prfRegister(_ call: CAPPluginCall) {
        guard
            let rpId = call.getString("rpId"),
            let userId = call.getString("userId"),
            let userName = call.getString("userName"),
            let challenge = call.getString("challenge"),
            let saltFirst = call.getString("saltFirst")
        else {
            call.reject("Missing required parameters")
            return
        }
        guard #available(iOS 18.0, *) else {
            call.reject("PRF requires iOS 18+")
            return
        }
        configureAnchor()
        Task {
            do {
                let result = try await KeywardRecovery.register(
                    rpId: rpId,
                    userId: userId,
                    userName: userName,
                    challenge: challenge,
                    saltFirst: saltFirst
                )
                call.resolve([
                    "credentialId": result.credentialId,
                    "prfFirst": result.prfFirst as Any,
                ])
            } catch {
                call.reject("prfRegister failed", nil, error)
            }
        }
    }

    @objc func prfAssert(_ call: CAPPluginCall) {
        guard
            let rpId = call.getString("rpId"),
            let challenge = call.getString("challenge"),
            let saltFirst = call.getString("saltFirst")
        else {
            call.reject("Missing required parameters")
            return
        }
        let credentialId = call.getString("credentialId")
        guard #available(iOS 18.0, *) else {
            call.reject("PRF requires iOS 18+")
            return
        }
        configureAnchor()
        Task {
            do {
                let result = try await KeywardRecovery.assert(
                    rpId: rpId,
                    challenge: challenge,
                    saltFirst: saltFirst,
                    credentialId: credentialId
                )
                call.resolve([
                    "credentialId": result.credentialId,
                    "prfFirst": result.prfFirst,
                ])
            } catch {
                call.reject("prfAssert failed", nil, error)
            }
        }
    }

    /// Give the native facade a presentation anchor (the app's key window).
    private func configureAnchor() {
        KeywardRecovery.anchorProvider = { [weak self] in
            self?.bridge?.viewController?.view.window ?? UIWindow()
        }
    }
}
