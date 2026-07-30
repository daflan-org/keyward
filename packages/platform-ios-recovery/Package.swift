// swift-tools-version: 5.9
import PackageDescription

// Typed WebAuthn PRF APIs (ASAuthorizationPublicKeyCredentialPRF*) require the
// iOS 18 / macOS 15 SDK (Xcode 16+). Below that floor the bridge reports
// prfSupported = false and the app falls through to social / code recovery.
let package = Package(
    name: "KeywardRecovery",
    // Deployment floor kept low so capabilities() and the tests run broadly; the
    // iOS 18 / macOS 15 PRF code is @available-gated and only executes above the floor.
    // Building still needs the iOS 18 SDK (Xcode 16+).
    platforms: [.iOS(.v16), .macOS(.v13)],
    products: [
        .library(name: "KeywardRecovery", targets: ["KeywardRecovery"]),
    ],
    targets: [
        .target(
            name: "KeywardRecovery",
            path: "Sources/KeywardRecovery"
        ),
        .testTarget(
            name: "KeywardRecoveryTests",
            dependencies: ["KeywardRecovery"],
            path: "Tests/KeywardRecoveryTests"
        ),
    ]
)
