import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { parseConfig } from './parser.js';
import { generateJava } from './templates/java.js';
import { generateSwift } from './templates/swift.js';
import { generateTypescript } from './templates/typescript.js';

// biome-ignore lint/suspicious/noConsole: CLI output
const log = (...args: unknown[]) => console.log(...args);
// biome-ignore lint/suspicious/noConsole: CLI output
const error = (...args: unknown[]) => console.error(...args);

const USAGE = `Usage: keyward-codegen [options]

Options:
  -c, --config <path>   Path to keyward.keys.json (required)
  --ts <path>           Override TypeScript output path
  --swift <path>        Override Swift output path
  --kotlin <path>       Override Java/Kotlin output path
  --dry-run             Print generated code without writing files
  --validate            Validate config only
  -h, --help            Show this help message
  -v, --version         Show version`;

function run(argv: string[]): number {
  let values: ReturnType<typeof parseArgs>['values'];

  try {
    ({ values } = parseArgs({
      args: argv,
      options: {
        config: { type: 'string', short: 'c' },
        'dry-run': { type: 'boolean', default: false },
        validate: { type: 'boolean', default: false },
        ts: { type: 'string' },
        swift: { type: 'string' },
        kotlin: { type: 'string' },
        help: { type: 'boolean', short: 'h', default: false },
        version: { type: 'boolean', short: 'v', default: false },
      },
      strict: true,
    }));
  } catch (e) {
    error((e as Error).message);
    log(USAGE);
    return 1;
  }

  if (values.help) {
    log(USAGE);
    return 0;
  }

  if (values.version) {
    log('0.0.1');
    return 0;
  }

  const configPath = values.config as string | undefined;
  const tsOverride = values.ts as string | undefined;
  const swiftOverride = values.swift as string | undefined;
  const kotlinOverride = values.kotlin as string | undefined;

  if (!configPath) {
    error('Error: --config is required.');
    log(USAGE);
    return 1;
  }

  let config: ReturnType<typeof parseConfig>;
  try {
    config = parseConfig(configPath);
  } catch (e) {
    error(`Error: ${(e as Error).message}`);
    return 1;
  }

  const totalKeys = config.staticKeys.length + config.dynamicKeys.length;

  if (values.validate) {
    log(
      `Config valid. ${totalKeys} keys (${config.staticKeys.length} static, ${config.dynamicKeys.length} dynamic).`,
    );
    return 0;
  }

  if (tsOverride) config = { ...config, output: { ...config.output, ts: tsOverride } };
  if (swiftOverride) config = { ...config, output: { ...config.output, swift: swiftOverride } };
  if (kotlinOverride) config = { ...config, output: { ...config.output, kotlin: kotlinOverride } };

  const generators: [string, string | undefined, (c: typeof config) => string][] = [
    ['TypeScript', config.output.ts, generateTypescript],
    ['Swift', config.output.swift, generateSwift],
    ['Java', config.output.kotlin, generateJava],
  ];

  const generated: string[] = [];

  for (const [label, outputPath, generate] of generators) {
    if (!outputPath) continue;

    const code = generate(config);

    if (values['dry-run']) {
      log(`--- ${label}: ${outputPath} ---`);
      log(code);
    } else {
      const absolutePath = resolve(outputPath);
      mkdirSync(dirname(absolutePath), { recursive: true });
      writeFileSync(absolutePath, code, 'utf-8');
      generated.push(outputPath);
    }
  }

  if (!values['dry-run'] && generated.length > 0) {
    log(`Generated ${generated.length} file(s): ${generated.join(', ')}`);
  }

  if (!values['dry-run'] && generated.length === 0) {
    log('No output targets configured. Use --ts, --swift, or --kotlin to specify output paths.');
  }

  return 0;
}

process.exit(run(process.argv.slice(2)));
