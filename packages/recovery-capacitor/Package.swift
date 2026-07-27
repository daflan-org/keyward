// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "KeywardRecoveryCapacitorPlugin",
    platforms: [.iOS(.v14)],
    products: [
        .library(name: "KeywardRecoveryCapacitorPlugin", targets: ["KeywardRecoveryPlugin"]),
    ],
    targets: [
        .target(
            name: "KeywardRecovery",
            path: "ios/Sources/KeywardRecovery"
        ),
        .target(
            name: "KeywardRecoveryPlugin",
            dependencies: [
                "KeywardRecovery",
            ],
            path: "ios/Sources/KeywardRecoveryPlugin"
        ),
    ]
)
