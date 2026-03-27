export enum Scope {
  User = "user",
  Device = "device",
  Global = "global",
}

export interface StorageKeyDef {
  readonly key: string;
  readonly scope: Scope;
}

export interface KeywardBackend {
  get(resolvedKey: string): Promise<string | null>;
  set(resolvedKey: string, value: string): Promise<void>;
  remove(resolvedKey: string): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
}
