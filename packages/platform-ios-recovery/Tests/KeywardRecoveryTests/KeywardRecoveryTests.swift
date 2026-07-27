import XCTest
@testable import KeywardRecovery

final class KeywardRecoveryTests: XCTestCase {
    func testBase64URLRoundTrip() {
        let data = Data([0xFB, 0xFF, 0xBF, 0x00, 0x10, 0x2A])
        let encoded = Base64URL.encode(data)
        XCTAssertFalse(encoded.contains("+"))
        XCTAssertFalse(encoded.contains("/"))
        XCTAssertFalse(encoded.contains("="))
        XCTAssertEqual(Base64URL.decode(encoded), data)
    }

    func testCapabilitiesReturnsProbe() {
        let caps = KeywardRecovery.capabilities()
        // prfSupported / prfAtCreate depend on the host OS floor (iOS 18 / macOS 15).
        XCTAssertEqual(caps.prfSupported, caps.prfAtCreate)
    }
}
