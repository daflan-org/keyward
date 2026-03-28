package org.keyward.capacitor;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

import org.keyward.KeystoreBackend;
import org.keyward.KeywardException;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.List;

public final class EncryptedPrefsBackend implements KeystoreBackend {
    private static final String PREFS_NAME = "keyward_secure";
    private final SharedPreferences prefs;

    public EncryptedPrefsBackend(Context context) throws GeneralSecurityException, IOException {
        MasterKey masterKey = new MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build();
        prefs = EncryptedSharedPreferences.create(
                context,
                PREFS_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        );
    }

    @Override
    public void set(String key, String value) throws KeywardException {
        if (!prefs.edit().putString(key, value).commit()) {
            throw KeywardException.storageFailed(key);
        }
    }

    @Override
    public String get(String key) {
        return prefs.getString(key, null);
    }

    @Override
    public void remove(String key) {
        prefs.edit().remove(key).apply();
    }

    @Override
    public List<String> allKeys() {
        return new ArrayList<>(prefs.getAll().keySet());
    }

    @Override
    public void clear() {
        prefs.edit().clear().apply();
    }
}
