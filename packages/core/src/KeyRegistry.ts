import { Scope, type StorageKeyDef } from './types.js';

export class KeyRegistry {
  private currentUserId: string | null = null;

  setUserId(userId: string): void {
    this.currentUserId = userId;
  }

  clearUserId(): void {
    this.currentUserId = null;
  }

  getUserId(): string | null {
    return this.currentUserId;
  }

  resolve(keyDef: StorageKeyDef): string {
    switch (keyDef.scope) {
      case Scope.User:
        if (!this.currentUserId) throw new Error("Keyward: userId not set.");
        return `u/${this.currentUserId}/${keyDef.key}`;
      case Scope.Device:
        return `d/${keyDef.key}`;
      case Scope.Global:
        return keyDef.key;
    }
  }

  getUserPrefix(userId: string): string {
    return `u/${userId}/`;
  }
}
