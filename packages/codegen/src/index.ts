export { PARAM_REGEX, parseConfig, parseConfigFromJson } from './parser.js';
export { generateJava } from './templates/java.js';
export { generateSwift } from './templates/swift.js';
export { generateTypescript } from './templates/typescript.js';
export type {
  DynamicKey,
  ParsedConfig,
  ParsedParam,
  StaticKey,
  TemplateFunction,
} from './types.js';
