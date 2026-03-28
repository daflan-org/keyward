package org.keyward.capacitor;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.keyward.Keyward;
import org.keyward.KeywardException;

import java.util.List;

@CapacitorPlugin(name = "Keyward")
public class KeywardPlugin extends Plugin {

    @Override
    public void load() {
        try {
            Keyward.setBackend(new EncryptedPrefsBackend(getContext()));
        } catch (Exception e) {
            android.util.Log.e("KeywardPlugin", "Failed to initialize backend", e);
        }
    }

    @PluginMethod
    public void get(PluginCall call) {
        String key = call.getString("key");
        if (key == null) {
            call.reject("Missing required parameter: key");
            return;
        }
        String value = Keyward.getRaw(key);
        JSObject result = new JSObject();
        result.put("value", value);
        call.resolve(result);
    }

    @PluginMethod
    public void set(PluginCall call) {
        String key = call.getString("key");
        if (key == null) {
            call.reject("Missing required parameter: key");
            return;
        }
        String value = call.getString("value");
        if (value == null) {
            call.reject("Missing required parameter: value");
            return;
        }
        try {
            Keyward.setRaw(key, value);
            call.resolve();
        } catch (KeywardException e) {
            call.reject("Keyward: setRaw failed", e);
        }
    }

    @PluginMethod
    public void remove(PluginCall call) {
        String key = call.getString("key");
        if (key == null) {
            call.reject("Missing required parameter: key");
            return;
        }
        Keyward.removeRaw(key);
        call.resolve();
    }

    @PluginMethod
    public void keys(PluginCall call) {
        List<String> allKeys = Keyward.keys();
        JSObject result = new JSObject();
        result.put("keys", new JSArray(allKeys));
        call.resolve(result);
    }

    @PluginMethod
    public void clear(PluginCall call) {
        Keyward.clearAll();
        call.resolve();
    }
}
