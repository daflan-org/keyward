// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "KeywardCapacitorPlugin",
    platforms: [.iOS(.v14)],
    products: [
        .library(name: "KeywardCapacitorPlugin", targets: ["KeywardPlugin"]),
    ],
    dependencies: [
        .package(url: "https://github.com/daflan-org/keyward", from: "0.0.1"),
    ],
    targets: [
        .target(
            name: "KeywardPlugin",
            dependencies: [
                "Keyward",
            ],
            path: "Sources/KeywardPlugin"
        ),
    ]
)
