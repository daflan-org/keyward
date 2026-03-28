import Foundation

public enum KeywardError: Error, LocalizedError, Equatable {
    case userIdNotSet
    case keychainWrite(OSStatus)

    public var errorDescription: String? {
        switch self {
        case .userIdNotSet:
            return "Keyward: userId not set."
        case .keychainWrite(let status):
            return "Keyward: Keychain write failed with status \(status)"
        }
    }
}
