#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
  FieldHistoryService,
  OpenAlexClient,
  renderFieldHistoryHtml,
} from '../packages/field-history/index.js';

function usage() {
  return `Build an evidence-aware scientific field history from an OpenAlex ID, DOI, or paper title.

Usage:
  node scripts/build-field-history.mjs --seed <paper> [options]

Options:
  --output <file>          Write the FieldHistoryMap JSON to a file (stdout by default)
  --cytoscape <file>       Also write Cytoscape.js-compatible graph JSON
  --html <file>            Write a self-contained interactive connection graph
  --history-links <file>   Attach RunThePaper/PRAgent object IDs by OpenAlex ID or DOI
  --cache-dir <dir>        OpenAlex response cache (default: .cybereinstein/cache/openalex)
  --depth <n>              Citation expansion depth, 1-3 (default: 2)
  --frontier-years <n>     Recent-work window (default: 3)
  --references <n>         References retained per backward hop (default: 30)
  --citations <n>          Influential and recent works per forward hop (default: 15)
  --related <n>            Related works to resolve (default: 20)
  --frontier-candidates <n> Topic-wide recent candidates (default: 40)
  --max-works <n>          Candidate budget before filtering (default: 180)
  --backbone <n>           Maximum historical-backbone nodes (default: 30)
  --relevance-threshold <x> Strict relevance cutoff, 0-1 (default: 0.3)
  --retention-floor <x>    Multi-signal derivative/frontier floor (default: 0.17)
  --help                   Show this help

Environment:
  OPENALEX_API_KEY         Free OpenAlex API key recommended for real use
  OPENALEX_BASE_URL        Optional API endpoint override
  OPENALEX_CACHE_DIR       Optional persistent response-cache directory
`;
}

function parseArguments(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--') continue;
    if (argument === '--help' || argument === '-h') {
      result.help = true;
      continue;
    }
    if (!argument.startsWith('--') && !result.seed) {
      result.seed = argument;
      continue;
    }
    const key = argument.slice(2);
    const supported = new Set([
      'seed',
      'output',
      'cytoscape',
      'html',
      'history-links',
      'cache-dir',
      'depth',
      'frontier-years',
      'references',
      'citations',
      'related',
      'frontier-candidates',
      'max-works',
      'backbone',
      'relevance-threshold',
      'retention-floor',
    ]);
    if (!supported.has(key)) throw new Error(`Unknown option: ${argument}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${argument}`);
    }
    result[key] = value;
    index += 1;
  }
  return result;
}

function scoreOption(value, name) {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    throw new Error(`${name} must be a number between 0 and 1`);
  }
  return parsed;
}

function numberOption(value, name) {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return parsed;
}

async function writeJson(filename, value) {
  const target = path.resolve(filename);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return target;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  if (!options.seed) {
    process.stderr.write(usage());
    throw new Error('--seed is required');
  }
  if (!process.env.OPENALEX_API_KEY) {
    process.stderr.write(
      'Warning: anonymous OpenAlex access is suitable only for a small demo; set OPENALEX_API_KEY for real use.\n',
    );
  }

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
  const citations = numberOption(options.citations, '--citations');
  const executableHistoryLinks = options['history-links']
    ? JSON.parse(await readFile(path.resolve(options['history-links']), 'utf8'))
    : undefined;
  const map = await service.build({
    seed: options.seed,
    executableHistoryLinks,
    citationDepth: numberOption(options.depth, '--depth'),
    frontierYears: numberOption(options['frontier-years'], '--frontier-years'),
    relevanceThreshold: scoreOption(
      options['relevance-threshold'],
      '--relevance-threshold',
    ),
    retentionFloor: scoreOption(
      options['retention-floor'],
      '--retention-floor',
    ),
    limits: {
      references: numberOption(options.references, '--references'),
      influentialCitations: citations,
      recentCitations: citations,
      related: numberOption(options.related, '--related'),
      frontierCandidates: numberOption(
        options['frontier-candidates'],
        '--frontier-candidates',
      ),
      maxWorks: numberOption(options['max-works'], '--max-works'),
      backbone: numberOption(options.backbone, '--backbone'),
    },
  });

  if (options.output) {
    const target = await writeJson(options.output, map);
    process.stderr.write(
      `Field history: ${target} (${map.nodes.length} papers, ${map.edges.length} relations, ${map.status})\n`,
    );
  } else {
    process.stdout.write(`${JSON.stringify(map, null, 2)}\n`);
  }
  if (options.cytoscape) {
    const target = await writeJson(options.cytoscape, service.toCytoscape(map));
    process.stderr.write(`Cytoscape graph: ${target}\n`);
  }
  if (options.html) {
    const target = path.resolve(options.html);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, renderFieldHistoryHtml(map), 'utf8');
    process.stderr.write(`Interactive graph: ${target}\n`);
  }
  process.stderr.write(
    `OpenAlex transport: ${client.requestCount} request(s), ${client.retryCount} retr${client.retryCount === 1 ? 'y' : 'ies'}, ${client.cacheHits} cache hit(s).\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error.name ?? 'Error'}: ${error.message}\n`);
  process.exitCode = 1;
});
