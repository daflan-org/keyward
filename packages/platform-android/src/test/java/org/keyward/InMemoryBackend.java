package org.keyward;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

final class InMemoryBackend implements KeystoreBackend {
    private final Map<String, String> store = new HashMap<>();

    @Override
    public void set(String key, String value) {
        store.put(key, value);
    }

    @Override
    public String get(String key) {
        return store.get(key);
    }

    @Override
    public void remove(String key) {
        store.remove(key);
    }

    @Override
    public List<String> allKeys() {
        return new ArrayList<>(store.keySet());
    }

    @Override
    public void clear() {
        store.clear();
    }
}
