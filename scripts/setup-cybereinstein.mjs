import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const setupScripts = [
  'setup-pragent-sources.mjs',
  'setup-deep-literature-research.mjs',
];

for (const script of setupScripts) {
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', script)], {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${script} exited with ${result.status}`);
  }
}

process.stdout.write('CyberEinstein capabilities are installed.\n');
