import type { Scope } from '@keyward/core';

export interface ParsedParam {
  readonly name: string;
}

export interface StaticKey {
  readonly kind: 'static';
  readonly name: string;
  readonly key: string;
  readonly scope: Scope;
}

export interface DynamicKey {
  readonly kind: 'dynamic';
  readonly name: string;
  readonly keyTemplate: string;
  readonly params: readonly ParsedParam[];
  readonly scope: Scope;
}

export interface ParsedConfig {
  readonly output: Partial<Record<'ts' | 'swift' | 'kotlin', string>>;
  readonly staticKeys: readonly StaticKey[];
  readonly dynamicKeys: readonly DynamicKey[];
}

export type TemplateFunction = (config: ParsedConfig) => string;
