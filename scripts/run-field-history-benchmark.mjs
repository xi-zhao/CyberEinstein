#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
  FieldHistoryBenchmark,
  FieldHistoryService,
  OpenAlexClient,
} from '../packages/field-history/index.js';

function usage() {
  return `Run the human-label-free Field History acceptance benchmark.

Usage:
  node scripts/run-field-history-benchmark.mjs [options]

Options:
  --manifest <file>   Benchmark cases (default: evaluation/field-history-benchmark.json)
  --case <name>       Run one named case only
  --output <file>     Write the JSON report to a file (stdout by default)
  --cache-dir <dir>   OpenAlex response cache (default: .cybereinstein/cache/openalex)
  --strict            Exit non-zero unless every automatic acceptance check passes
  --help              Show this help

Environment:
  OPENALEX_API_KEY    Recommended for a complete multi-case run
  OPENALEX_BASE_URL   Optional compatible endpoint override
`;
}

function parseArguments(argv) {
  const result = {};
  const valueOptions = new Set(['manifest', 'case', 'output', 'cache-dir']);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--') continue;
    if (argument === '--help' || argument === '-h') {
      result.help = true;
      continue;
    }
    if (argument === '--strict') {
      result.strict = true;
      continue;
    }
    if (!argument.startsWith('--') || !valueOptions.has(argument.slice(2))) {
      throw new Error(`Unknown option: ${argument}`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${argument}`);
    result[argument.slice(2)] = value;
    index += 1;
  }
  return result;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const manifestFile = path.resolve(
    options.manifest ?? 'evaluation/field-history-benchmark.json',
  );
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  const cases = options.case
    ? manifest.cases.filter((item) => item.name === options.case)
    : manifest.cases;
  if (cases.length === 0) throw new Error(`No benchmark case matched: ${options.case}`);
  const client = new OpenAlexClient({
    apiKey: process.env.OPENALEX_API_KEY,
    baseUrl: process.env.OPENALEX_BASE_URL,
    cacheDir: path.resolve(
      options['cache-dir'] ??
        process.env.OPENALEX_CACHE_DIR ??
        '.cybereinstein/cache/openalex',
    ),
  });
  const service = new FieldHistoryService({ client });
  const benchmark = new FieldHistoryBenchmark({ client, service });
  const reports = [];
  for (const benchmarkCase of cases) {
    process.stderr.write(`Benchmarking ${benchmarkCase.name}...\n`);
    try {
      reports.push(await benchmark.runCase(benchmarkCase));
    } catch (error) {
      reports.push({
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        name: benchmarkCase.name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  const report = {
    version: manifest.version,
    generatedAt: new Date().toISOString(),
    methodology: [
      'Historical backbone compared with references shared by independent reviews.',
      'Frontier ranking backtested against citations gained after a historical cutoff.',
      'Backbone stability measured across independent seeds from the same topic.',
      'Unavailable evidence is reported as inconclusive and never converted into a pass.',
    ],
    cases: reports,
    passed: reports.every((item) => item.passed),
  };
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  if (options.output) {
    const target = path.resolve(options.output);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, serialized, 'utf8');
    process.stderr.write(`Benchmark report: ${target}\n`);
  } else {
    process.stdout.write(serialized);
  }
  if (options.strict && !report.passed) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error.name ?? 'Error'}: ${error.message}\n`);
  process.exitCode = 1;
});
