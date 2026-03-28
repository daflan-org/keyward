import { Scope } from '@keyward/core';

export function toCamelCase(screamingSnake: string): string {
  return screamingSnake
    .toLowerCase()
    .split('_')
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}

const TS_SCOPE: Record<Scope, string> = {
  [Scope.User]: 'Scope.User',
  [Scope.Device]: 'Scope.Device',
  [Scope.Global]: 'Scope.Global',
};

const SWIFT_SCOPE: Record<Scope, string> = {
  [Scope.User]: '.user',
  [Scope.Device]: '.device',
  [Scope.Global]: '.global',
};

const JAVA_SCOPE: Record<Scope, string> = {
  [Scope.User]: 'Scope.USER',
  [Scope.Device]: 'Scope.DEVICE',
  [Scope.Global]: 'Scope.GLOBAL',
};

export const toTsScope = (scope: Scope): string => TS_SCOPE[scope];
export const toSwiftScope = (scope: Scope): string => SWIFT_SCOPE[scope];
export const toJavaScope = (scope: Scope): string => JAVA_SCOPE[scope];
