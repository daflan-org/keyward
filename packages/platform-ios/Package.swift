// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Keyward",
    platforms: [.iOS(.v13)],
    products: [
        .library(name: "Keyward", targets: ["Keyward"]),
    ],
    targets: [
        .target(
            name: "Keyward",
            path: "Sources/Keyward"
        ),
        .testTarget(
            name: "KeywardTests",
            dependencies: ["Keyward"],
            path: "Tests/KeywardTests"
        ),
    ]
)
