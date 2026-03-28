package org.keyward;

import java.util.List;

public interface KeystoreBackend {
    void set(String key, String value) throws KeywardException;
    String get(String key);
    void remove(String key);
    List<String> allKeys();
    void clear();
}
