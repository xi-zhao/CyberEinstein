import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundleDir = path.join(root, 'packages', 'pragent-sources');
const sourcesEnvFile =
  process.env.CYBEREINSTEIN_SOURCES_ENV_FILE ??
  path.join(root, '.cybereinstein', 'pragent-sources.env');
const live = process.argv.includes('--live');

function isEnabled(envName) {
  return (process.env[envName] ?? 'true').toLowerCase() !== 'false';
}

function scrubbedEnvironment(extra) {
  const env = {};
  for (const [name, value] of Object.entries(process.env)) {
    if (value === undefined) continue;
    if (/KEY|PASSWORD|SECRET|TOKEN/i.test(name)) continue;
    if (name.toUpperCase().startsWith('DSH_')) continue;
    env[name] = value;
  }
  return { ...env, ...extra };
}

const adapters = [
  {
    name: 'paper_search',
    enabledBy: 'CYBEREINSTEIN_PAPER_SEARCH_ENABLED',
    cwd: path.join(bundleDir, 'runtime', 'paper-search'),
    args: ['run', '--offline', '--locked', 'python', 'server.py'],
    env: {
      PAPER_SEARCH_MCP_ENV_FILE: sourcesEnvFile,
      PYTHONUNBUFFERED: '1',
      UV_NO_PROGRESS: '1',
    },
    validateTools(tools) {
      assert.deepEqual(
        tools.map((tool) => tool.name),
        ['discover_papers'],
        'the search facade must expose only the discovery capability',
      );
      assert.deepEqual(
        Object.keys(tools[0].inputSchema.properties ?? {}).sort(),
        ['max_results_per_source', 'query', 'sources', 'year'],
        'the search facade exposed an unexpected input',
      );
    },
  },
  {
    name: 'paper_fetch',
    enabledBy: 'CYBEREINSTEIN_PAPER_FETCH_ENABLED',
    cwd: path.join(bundleDir, 'runtime', 'paper-fetch'),
    args: ['run', '--offline', '--locked', 'python', 'server.py'],
    env: {
      PAPER_FETCH_ENV_FILE: sourcesEnvFile,
      PAPER_FETCH_BROWSER_AUTO_PREPARE: 'false',
      PYTHONUNBUFFERED: '1',
      UV_NO_PROGRESS: '1',
    },
    validateTools(tools) {
      assert.deepEqual(
        tools.map((tool) => tool.name),
        ['resolve_paper', 'has_fulltext', 'fetch_paper'],
        'the paper-fetch facade must expose only bounded read capabilities',
      );
      const fetchTool = tools.find((tool) => tool.name === 'fetch_paper');
      assert.deepEqual(
        Object.keys(fetchTool.inputSchema.properties ?? {}).sort(),
        ['include_refs', 'max_tokens', 'prefer_cache', 'query'],
        'the paper-fetch facade exposed a path or runtime-control input',
      );
    },
  },
];

function contentText(result) {
  return (result.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
}

async function probe(adapter) {
  const transport = new StdioClientTransport({
    command: 'uv',
    args: adapter.args,
    cwd: adapter.cwd,
    env: scrubbedEnvironment(adapter.env),
    stderr: 'inherit',
  });
  const client = new Client({
    name: 'cybereinstein-source-probe',
    version: '0.1.0',
  });

  await client.connect(transport);
  try {
    const { tools } = await client.listTools();
    adapter.validateTools(tools);
    const forbidden = tools.filter((tool) => /sci[\s_-]?hub/i.test(tool.name));
    assert.equal(forbidden.length, 0, `${adapter.name} exposes a Sci-Hub tool`);

    const summary = {
      adapter: adapter.name,
      tools: tools.map((tool) => tool.name),
    };

    if (adapter.name === 'paper_search') {
      const rejected = await client.callTool({
        name: 'discover_papers',
        arguments: {
          query: 'policy probe',
          sources: ',,',
          max_results_per_source: 1,
        },
      });
      assert.equal(
        Boolean(rejected.isError),
        true,
        'empty source tokens must not fall through to the upstream all-sources mode',
      );
    }

    if (live && adapter.name === 'paper_search') {
      const result = await client.callTool({
        name: 'discover_papers',
        arguments: {
          query: 'Attention Is All You Need',
          sources: 'arxiv',
          max_results_per_source: 1,
        },
      });
      assert.equal(Boolean(result.isError), false, contentText(result));
      const text = contentText(result);
      assert.match(text, /adapter_policy|papers|Attention/i);
      summary.liveCall = 'discover_papers';
      summary.liveResult = 'valid paper-search response';
    }

    if (live && adapter.name === 'paper_fetch') {
      const result = await client.callTool({
        name: 'fetch_paper',
        arguments: {
          query: 'https://arxiv.org/abs/1706.03762',
          max_tokens: 2000,
        },
      });
      assert.equal(Boolean(result.isError), false, contentText(result));
      const payload = result.structuredContent ?? {};
      summary.liveCall = 'fetch_paper';
      summary.liveResult = {
        contentKind: payload.quality?.content_kind ?? 'unknown',
        hasFulltext: payload.quality?.has_fulltext ?? false,
        warningCount: payload.quality?.warnings?.length ?? 0,
      };
    }

    process.stdout.write(`${JSON.stringify(summary)}\n`);
  } finally {
    await client.close();
  }
}

for (const adapter of adapters) {
  if (!isEnabled(adapter.enabledBy)) continue;
  await probe(adapter);
}
