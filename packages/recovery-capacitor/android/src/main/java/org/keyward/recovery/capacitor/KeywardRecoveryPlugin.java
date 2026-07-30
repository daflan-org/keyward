package org.keyward.recovery.capacitor;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.keyward.recovery.KeywardRecoveryPrf;
import org.keyward.recovery.PrfAssertResult;
import org.keyward.recovery.PrfCapabilities;
import org.keyward.recovery.PrfRegisterResult;

@CapacitorPlugin(name = "KeywardRecovery")
public class KeywardRecoveryPlugin extends Plugin {

    private KeywardRecoveryPrf prf;

    @Override
    public void load() {
        prf = new CredentialManagerPrfBackend(getActivity());
    }

    @PluginMethod
    public void capabilities(PluginCall call) {
        PrfCapabilities caps = prf.capabilities();
        JSObject result = new JSObject();
        result.put("platformAuthenticator", caps.platformAuthenticator);
        result.put("prfSupported", caps.prfSupported);
        result.put("prfAtCreate", caps.prfAtCreate);
        call.resolve(result);
    }

    @PluginMethod
    public void prfRegister(PluginCall call) {
        String rpId = call.getString("rpId");
        String userId = call.getString("userId");
        String userName = call.getString("userName");
        String challenge = call.getString("challenge");
        String saltFirst = call.getString("saltFirst");
        if (rpId == null || userId == null || userName == null || challenge == null || saltFirst == null) {
            call.reject("Missing required parameters");
            return;
        }
        prf.register(rpId, userId, userName, challenge, saltFirst,
                new KeywardRecoveryPrf.Callback<PrfRegisterResult>() {
                    @Override
                    public void onSuccess(PrfRegisterResult result) {
                        JSObject r = new JSObject();
                        r.put("credentialId", result.credentialId);
                        r.put("prfFirst", result.prfFirst);
                        call.resolve(r);
                    }

                    @Override
                    public void onError(Throwable error) {
                        call.reject(
                                "prfRegister failed",
                                error instanceof Exception ? (Exception) error : new Exception(error));
                    }
                });
    }

    @PluginMethod
    public void prfAssert(PluginCall call) {
        String rpId = call.getString("rpId");
        String challenge = call.getString("challenge");
        String saltFirst = call.getString("saltFirst");
        String credentialId = call.getString("credentialId");
        if (rpId == null || challenge == null || saltFirst == null) {
            call.reject("Missing required parameters");
            return;
        }
        prf.assertPrf(rpId, challenge, saltFirst, credentialId,
                new KeywardRecoveryPrf.Callback<PrfAssertResult>() {
                    @Override
                    public void onSuccess(PrfAssertResult result) {
                        JSObject r = new JSObject();
                        r.put("credentialId", result.credentialId);
                        r.put("prfFirst", result.prfFirst);
                        call.resolve(r);
                    }

                    @Override
                    public void onError(Throwable error) {
                        call.reject(
                                "prfAssert failed",
                                error instanceof Exception ? (Exception) error : new Exception(error));
                    }
                });
    }
}
