import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Scope } from '@keyward/core';
import type { DynamicKey, ParsedConfig, ParsedParam, StaticKey } from './types.js';

export const PARAM_REGEX = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g;

const VALID_SCOPES = new Set(Object.values(Scope));

function parseScope(value: string, keyName: string): Scope {
  if (VALID_SCOPES.has(value as Scope)) return value as Scope;
  throw new Error(
    `Invalid scope "${value}" for key "${keyName}". Must be "user", "device", or "global".`,
  );
}

function extractParams(keyValue: string): ParsedParam[] {
  const params: ParsedParam[] = [];

  for (const match of keyValue.matchAll(PARAM_REGEX)) {
    const name = match[1];
    if (name !== undefined) {
      params.push({ name });
    }
  }

  return params;
}

export function parseConfigFromJson(raw: unknown): ParsedConfig {
  if (raw === null || typeof raw !== 'object') {
    throw new Error('Config must be a JSON object.');
  }

  const obj = raw as Record<string, unknown>;

  if (!obj.output || typeof obj.output !== 'object') {
    throw new Error('Config must have an "output" object.');
  }

  if (!obj.keys || typeof obj.keys !== 'object') {
    throw new Error('Config must have a "keys" object.');
  }

  const rawOutput = obj.output as Record<string, unknown>;
  const output: Partial<Record<'ts' | 'swift' | 'kotlin', string>> = {};
  for (const lang of ['ts', 'swift', 'kotlin'] as const) {
    const val = rawOutput[lang];
    if (val !== undefined) {
      if (typeof val !== 'string') throw new Error(`output.${lang} must be a string.`);
      output[lang] = val;
    }
  }
  const keys = obj.keys as Record<string, unknown>;
  const staticKeys: StaticKey[] = [];
  const dynamicKeys: DynamicKey[] = [];

  for (const [name, entry] of Object.entries(keys)) {
    if (entry === null || typeof entry !== 'object') {
      throw new Error(`Key "${name}" must be an object with "key" and "scope" fields.`);
    }

    const entryObj = entry as Record<string, unknown>;

    if (typeof entryObj.key !== 'string') {
      throw new Error(`Key "${name}" is missing a "key" string field.`);
    }

    if (typeof entryObj.scope !== 'string') {
      throw new Error(`Key "${name}" is missing a "scope" string field.`);
    }

    const scope = parseScope(entryObj.scope, name);
    const params = extractParams(entryObj.key);

    if (params.length === 0) {
      staticKeys.push({ kind: 'static', name, key: entryObj.key, scope });
    } else {
      dynamicKeys.push({ kind: 'dynamic', name, keyTemplate: entryObj.key, params, scope });
    }
  }

  staticKeys.sort((a, b) => a.name.localeCompare(b.name));
  dynamicKeys.sort((a, b) => a.name.localeCompare(b.name));

  return { output, staticKeys, dynamicKeys };
}

export function parseConfig(configPath: string): ParsedConfig {
  const absolutePath = resolve(configPath);
  let content: string;

  try {
    content = readFileSync(absolutePath, 'utf-8');
  } catch {
    throw new Error(`Cannot read config file: ${absolutePath}`);
  }

  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch {
    throw new Error(`Invalid JSON in config file: ${absolutePath}`);
  }

  return parseConfigFromJson(json);
}
