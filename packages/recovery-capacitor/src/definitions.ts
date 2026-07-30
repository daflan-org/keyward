/** Native plugin surface (registered as "KeywardRecovery"). PRF I/O only. */
export interface KeywardRecoveryNativePlugin {
  capabilities(): Promise<{
    platformAuthenticator: boolean;
    prfSupported: boolean;
    prfAtCreate: boolean;
  }>;
  prfRegister(options: {
    rpId: string;
    userId: string;
    userName: string;
    challenge: string;
    saltFirst: string;
  }): Promise<{ credentialId: string; prfFirst: string | null }>;
  prfAssert(options: {
    rpId: string;
    challenge: string;
    saltFirst: string;
    credentialId?: string;
  }): Promise<{ credentialId: string; prfFirst: string }>;
}
