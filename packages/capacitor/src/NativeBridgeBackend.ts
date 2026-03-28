import type { KeywardBackend } from '@keyward/core';
import type { KeywardNativePlugin } from './definitions.js';

export class NativeBridgeBackend implements KeywardBackend {
  private readonly plugin: KeywardNativePlugin;

  constructor(plugin: KeywardNativePlugin) {
    this.plugin = plugin;
  }

  async get(key: string): Promise<string | null> {
    const result = await this.plugin.get({ key });
    return result.value;
  }

  async set(key: string, value: string): Promise<void> {
    await this.plugin.set({ key, value });
  }

  async remove(key: string): Promise<void> {
    await this.plugin.remove({ key });
  }

  async keys(): Promise<string[]> {
    const result = await this.plugin.keys();
    return result.keys;
  }

  async clear(): Promise<void> {
    await this.plugin.clear();
  }
}
