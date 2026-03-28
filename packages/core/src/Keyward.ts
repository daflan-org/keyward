import { KeyRegistry } from './KeyRegistry.js';
import type { KeywardBackend, StorageKeyDef } from './types.js';

export class Keyward {
  private readonly registry: KeyRegistry;
  private readonly backend: KeywardBackend;

  constructor(backend: KeywardBackend) {
    this.registry = new KeyRegistry();
    this.backend = backend;
  }

  setUserId(userId: string): void {
    this.registry.setUserId(userId);
  }

  clearUserId(): void {
    this.registry.clearUserId();
  }

  getUserId(): string | null {
    return this.registry.getUserId();
  }

  async get(keyDef: StorageKeyDef): Promise<string | null> {
    const resolved = this.registry.resolve(keyDef);
    return this.backend.get(resolved);
  }

  async set(keyDef: StorageKeyDef, value: string): Promise<void> {
    const resolved = this.registry.resolve(keyDef);
    await this.backend.set(resolved, value);
  }

  async remove(keyDef: StorageKeyDef): Promise<void> {
    const resolved = this.registry.resolve(keyDef);
    await this.backend.remove(resolved);
  }

  async wipeUser(userId: string): Promise<void> {
    const prefix = this.registry.getUserPrefix(userId);
    const allKeys = await this.backend.keys();
    const userKeys = allKeys.filter((k) => k.startsWith(prefix));
    await Promise.all(userKeys.map((key) => this.backend.remove(key)));
  }
}
