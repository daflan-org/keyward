package org.keyward;

public final class KeyRegistry {
    private String currentUserId;

    public KeyRegistry() {}

    public void setUserId(String userId) {
        this.currentUserId = userId;
    }

    public void clearUserId() {
        this.currentUserId = null;
    }

    public String getUserId() {
        return currentUserId;
    }

    public String resolve(KeyDef keyDef) throws KeywardException {
        switch (keyDef.getScope()) {
            case USER:
                if (currentUserId == null) {
                    throw KeywardException.userIdNotSet();
                }
                return "u/" + currentUserId + "/" + keyDef.getKey();
            case DEVICE:
                return "d/" + keyDef.getKey();
            case GLOBAL:
                return keyDef.getKey();
            default:
                throw new IllegalStateException("Unknown scope: " + keyDef.getScope());
        }
    }

    public static String getUserPrefix(String userId) {
        return "u/" + userId + "/";
    }
}
