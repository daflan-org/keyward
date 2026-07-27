import type {
  NativePrf,
  PrfAssertResult,
  PrfCapabilities,
  PrfRegisterResult,
} from '@daflan/keyward-recovery-core';
import type { KeywardRecoveryNativePlugin } from './definitions.js';

/** Adapts the Capacitor native plugin to the core `NativePrf` port. */
export class NativePrfBridge implements NativePrf {
  private readonly plugin: KeywardRecoveryNativePlugin;

  constructor(plugin: KeywardRecoveryNativePlugin) {
    this.plugin = plugin;
  }

  capabilities(): Promise<PrfCapabilities> {
    return this.plugin.capabilities();
  }

  register(opts: {
    rpId: string;
    userId: string;
    userName: string;
    challenge: string;
    saltFirst: string;
  }): Promise<PrfRegisterResult> {
    return this.plugin.prfRegister(opts);
  }

  assert(opts: {
    rpId: string;
    challenge: string;
    saltFirst: string;
    credentialId?: string;
  }): Promise<PrfAssertResult> {
    return this.plugin.prfAssert(opts);
  }
}
