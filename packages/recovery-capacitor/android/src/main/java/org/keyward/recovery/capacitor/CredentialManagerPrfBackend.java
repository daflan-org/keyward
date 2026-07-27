package org.keyward.recovery.capacitor;

import android.content.Context;
import android.os.Build;
import android.os.CancellationSignal;
import android.util.Base64;

import androidx.credentials.CreateCredentialResponse;
import androidx.credentials.CreatePublicKeyCredentialRequest;
import androidx.credentials.CreatePublicKeyCredentialResponse;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.GetPublicKeyCredentialOption;
import androidx.credentials.PublicKeyCredential;
import androidx.credentials.exceptions.CreateCredentialException;
import androidx.credentials.exceptions.GetCredentialException;

import org.json.JSONObject;
import org.keyward.recovery.KeywardRecoveryPrf;
import org.keyward.recovery.PrfAssertResult;
import org.keyward.recovery.PrfCapabilities;
import org.keyward.recovery.PrfRegisterResult;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

/**
 * Android PRF via Jetpack CredentialManager. Native does PRF I/O only: it builds the
 * WebAuthn JSON with the {@code prf} extension, runs the ceremony, and returns the
 * base64url PRF output. No crypto or envelope work happens here.
 *
 * <p>NOTE (verify on-device): the exact response-JSON paths for the PRF output and the
 * credential id, and the capability probe, must be validated against a PRF-capable
 * provider (Google Password Manager on a recent device).
 */
final class CredentialManagerPrfBackend implements KeywardRecoveryPrf {

    private static final int B64 = Base64.URL_SAFE | Base64.NO_PADDING | Base64.NO_WRAP;

    private final Context context;
    private final CredentialManager credentialManager;
    private final Executor executor = Executors.newSingleThreadExecutor();

    CredentialManagerPrfBackend(Context context) {
        this.context = context;
        this.credentialManager = CredentialManager.create(context);
    }

    @Override
    public PrfCapabilities capabilities() {
        // Best-effort probe. A real probe would create a checkForSupport PRF request.
        boolean platformAuthenticator = true;
        boolean prfSupported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE;
        return new PrfCapabilities(platformAuthenticator, prfSupported, prfSupported);
    }

    @Override
    public void register(
            String rpId,
            String userId,
            String userName,
            String challenge,
            String saltFirst,
            Callback<PrfRegisterResult> callback) {
        final String requestJson;
        try {
            requestJson = buildRegistrationJson(rpId, userId, userName, challenge, saltFirst);
        } catch (Exception e) {
            callback.onError(e);
            return;
        }
        CreatePublicKeyCredentialRequest request = new CreatePublicKeyCredentialRequest(requestJson);
        credentialManager.createCredentialAsync(
                context,
                request,
                new CancellationSignal(),
                executor,
                new CredentialManagerCallback<CreateCredentialResponse, CreateCredentialException>() {
                    @Override
                    public void onResult(CreateCredentialResponse response) {
                        try {
                            String json =
                                    ((CreatePublicKeyCredentialResponse) response).getRegistrationResponseJson();
                            JSONObject root = new JSONObject(json);
                            String credentialId = root.getString("id");
                            String prfFirst = extractPrfFirst(root);
                            callback.onSuccess(new PrfRegisterResult(credentialId, prfFirst));
                        } catch (Exception e) {
                            callback.onError(e);
                        }
                    }

                    @Override
                    public void onError(CreateCredentialException e) {
                        callback.onError(e);
                    }
                });
    }

    @Override
    public void assertPrf(
            String rpId,
            String challenge,
            String saltFirst,
            String credentialId,
            Callback<PrfAssertResult> callback) {
        final String requestJson;
        try {
            requestJson = buildAssertionJson(rpId, challenge, saltFirst, credentialId);
        } catch (Exception e) {
            callback.onError(e);
            return;
        }
        GetPublicKeyCredentialOption option = new GetPublicKeyCredentialOption(requestJson);
        GetCredentialRequest request =
                new GetCredentialRequest(Collections.singletonList(option));
        credentialManager.getCredentialAsync(
                context,
                request,
                new CancellationSignal(),
                executor,
                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override
                    public void onResult(GetCredentialResponse response) {
                        try {
                            Credential credential = response.getCredential();
                            if (!(credential instanceof PublicKeyCredential)) {
                                callback.onError(new IllegalStateException("unexpected credential type"));
                                return;
                            }
                            String json = ((PublicKeyCredential) credential).getAuthenticationResponseJson();
                            JSONObject root = new JSONObject(json);
                            String returnedId = root.getString("id");
                            String prfFirst = extractPrfFirst(root);
                            if (prfFirst == null) {
                                callback.onError(new IllegalStateException("no PRF output in assertion"));
                                return;
                            }
                            callback.onSuccess(new PrfAssertResult(returnedId, prfFirst));
                        } catch (Exception e) {
                            callback.onError(e);
                        }
                    }

                    @Override
                    public void onError(GetCredentialException e) {
                        callback.onError(e);
                    }
                });
    }

    // --- JSON helpers --------------------------------------------------------

    private static String base64UrlOfUtf8(String value) {
        return Base64.encodeToString(value.getBytes(StandardCharsets.UTF_8), B64);
    }

    private static String buildRegistrationJson(
            String rpId, String userId, String userName, String challenge, String saltFirst)
            throws Exception {
        JSONObject rp = new JSONObject().put("id", rpId).put("name", rpId);
        JSONObject user = new JSONObject()
                .put("id", base64UrlOfUtf8(userId))
                .put("name", userName)
                .put("displayName", userName);
        JSONObject es256 = new JSONObject().put("type", "public-key").put("alg", -7);
        JSONObject rs256 = new JSONObject().put("type", "public-key").put("alg", -257);
        JSONObject selection = new JSONObject()
                .put("residentKey", "required")
                .put("userVerification", "required");
        JSONObject prf = new JSONObject()
                .put("eval", new JSONObject().put("first", saltFirst));
        return new JSONObject()
                .put("rp", rp)
                .put("user", user)
                .put("challenge", challenge)
                .put("pubKeyCredParams", new org.json.JSONArray().put(es256).put(rs256))
                .put("authenticatorSelection", selection)
                .put("extensions", new JSONObject().put("prf", prf))
                .toString();
    }

    private static String buildAssertionJson(
            String rpId, String challenge, String saltFirst, String credentialId) throws Exception {
        JSONObject prf = new JSONObject()
                .put("eval", new JSONObject().put("first", saltFirst));
        JSONObject root = new JSONObject()
                .put("rpId", rpId)
                .put("challenge", challenge)
                .put("userVerification", "required")
                .put("extensions", new JSONObject().put("prf", prf));
        if (credentialId != null) {
            JSONObject descriptor = new JSONObject()
                    .put("type", "public-key")
                    .put("id", credentialId);
            root.put("allowCredentials", new org.json.JSONArray().put(descriptor));
        }
        return root.toString();
    }

    /** clientExtensionResults.prf.results.first, or null when absent. */
    private static String extractPrfFirst(JSONObject responseRoot) {
        JSONObject extensions = responseRoot.optJSONObject("clientExtensionResults");
        if (extensions == null) {
            return null;
        }
        JSONObject prf = extensions.optJSONObject("prf");
        if (prf == null) {
            return null;
        }
        JSONObject results = prf.optJSONObject("results");
        if (results == null) {
            return null;
        }
        return results.optString("first", null);
    }
}
