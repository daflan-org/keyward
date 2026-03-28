// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "KeywardCapacitorPlugin",
    platforms: [.iOS(.v14)],
    products: [
        .library(name: "KeywardCapacitorPlugin", targets: ["KeywardPlugin"]),
    ],
    targets: [
        .target(
            name: "Keyward",
            path: "ios/Sources/Keyward"
        ),
        .target(
            name: "KeywardPlugin",
            dependencies: [
                "Keyward",
            ],
            path: "ios/Sources/KeywardPlugin"
        ),
    ]
)
