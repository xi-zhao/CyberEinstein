import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundleDir = path.join(root, 'packages', 'pragent-sources');

test('paper discovery policy is explicit and compliance scoped', async () => {
  const policy = JSON.parse(
    await readFile(path.join(bundleDir, 'policy.json'), 'utf8'),
  );
  const allowed = new Set(policy.paperSearch.allowedSources);

  assert(policy.paperSearch.defaultSources.every((source) => allowed.has(source)));
  assert.equal(allowed.has('google_scholar'), false);
  assert.equal(policy.paperSearch.accessMode, 'metadata-discovery-only');
  assert.equal(policy.paperFetch.accessMode, 'open-or-user-authorized-full-text');
  assert.equal(policy.paperFetch.artifactWrites, false);
  assert(policy.forbiddenPathways.every((name) => /scihub/i.test(name)));
});

test('Cordis bundle keeps source adapters independently switchable', async () => {
  const patch = await readFile(path.join(bundleDir, 'cordis.patch.yml'), 'utf8');

  assert.match(patch, /id: pragent-paper-search/);
  assert.match(patch, /id: pragent-paper-fetch/);
  assert.match(patch, /CYBEREINSTEIN_PAPER_SEARCH_ENABLED/);
  assert.match(patch, /CYBEREINSTEIN_PAPER_FETCH_ENABLED/);
  assert.doesNotMatch(patch, /download_scihub/);
});

test('upstream source versions and MCP major versions are isolated', async () => {
  const searchProject = await readFile(
    path.join(bundleDir, 'runtime', 'paper-search', 'pyproject.toml'),
    'utf8',
  );
  const fetchProject = await readFile(
    path.join(bundleDir, 'runtime', 'paper-fetch', 'pyproject.toml'),
    'utf8',
  );

  assert.match(searchProject, /paper-search-mcp==0\.1\.4/);
  assert.match(searchProject, /mcp\[cli\]==1\.29\.1/);
  assert.match(fetchProject, /mcp==2\.1\.1/);
  assert.match(fetchProject, /v5\.5\.0\/paper_fetch_skill-5\.5\.0/);
});
