import Foundation
import Capacitor
#if canImport(Keyward)
import Keyward
#endif

@objc(KeywardPlugin)
public class KeywardPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "KeywardPlugin"
    public let jsName = "Keyward"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "remove", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "keys", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clear", returnType: CAPPluginReturnPromise),
    ]

    @objc func get(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("Missing required parameter: key")
            return
        }
        let value = Keyward.getRaw(key: key)
        call.resolve(["value": value as Any])
    }

    @objc func set(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("Missing required parameter: key")
            return
        }
        guard let value = call.getString("value") else {
            call.reject("Missing required parameter: value")
            return
        }
        do {
            try Keyward.setRaw(key: key, value: value)
            call.resolve()
        } catch {
            call.reject("Keyward: setRaw failed", nil, error)
        }
    }

    @objc func remove(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("Missing required parameter: key")
            return
        }
        Keyward.removeRaw(key: key)
        call.resolve()
    }

    @objc func keys(_ call: CAPPluginCall) {
        let allKeys = Keyward.keys()
        call.resolve(["keys": allKeys])
    }

    @objc func clear(_ call: CAPPluginCall) {
        Keyward.clearAll()
        call.resolve()
    }
}
