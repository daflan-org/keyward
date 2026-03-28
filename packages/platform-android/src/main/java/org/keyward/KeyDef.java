package org.keyward;

import java.util.Objects;

public final class KeyDef {
    private final String key;
    private final Scope scope;

    public KeyDef(String key, Scope scope) {
        this.key = key;
        this.scope = scope;
    }

    public String getKey() {
        return key;
    }

    public Scope getScope() {
        return scope;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof KeyDef)) return false;
        KeyDef other = (KeyDef) o;
        return Objects.equals(key, other.key) && scope == other.scope;
    }

    @Override
    public int hashCode() {
        return Objects.hash(key, scope);
    }

    @Override
    public String toString() {
        return "KeyDef{key='" + key + "', scope=" + scope + "}";
    }
}
