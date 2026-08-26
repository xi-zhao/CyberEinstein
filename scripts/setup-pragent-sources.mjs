import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundleDir = path.join(root, 'packages', 'pragent-sources');
const dshHome = path.join(root, '.cybereinstein', 'dsh-home');
const runtimes = [
  {
    enabledBy: 'CYBEREINSTEIN_PAPER_SEARCH_ENABLED',
    path: path.join(bundleDir, 'runtime', 'paper-search'),
  },
  {
    enabledBy: 'CYBEREINSTEIN_PAPER_FETCH_ENABLED',
    path: path.join(bundleDir, 'runtime', 'paper-fetch'),
  },
];

function isEnabled(envName) {
  return (process.env[envName] ?? 'true').toLowerCase() !== 'false';
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: {
      ...process.env,
      CYBEREINSTEIN_ROOT: root,
      DSH_HOME: dshHome,
    },
    stdio: 'inherit',
    ...options,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with ${result.status}`);
  }
  return result;
}

const enabledRuntimes = runtimes.filter((runtime) => isEnabled(runtime.enabledBy));
if (enabledRuntimes.length > 0) {
  run('uv', ['--version']);
}
for (const runtime of enabledRuntimes) {
  run('uv', ['sync', '--project', runtime.path, '--locked', '--python', '3.12']);
}

for (const profile of ['headless', 'web']) {
  run('dsh', [
    'plugin',
    '--profile',
    profile,
    'add',
    '--save-exact',
    bundleDir,
  ]);
}

for (const profile of ['headless', 'web']) {
  const result = spawnSync('dsh', ['--profile', profile, '--dump-config'], {
    cwd: root,
    env: {
      ...process.env,
      CYBEREINSTEIN_ROOT: root,
      DSH_HOME: dshHome,
    },
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    throw new Error(`Unable to compose the ${profile} profile`);
  }
  for (const adapterId of ['pragent-paper-search', 'pragent-paper-fetch']) {
    if (!result.stdout.includes(adapterId)) {
      throw new Error(`${adapterId} is missing from the ${profile} profile`);
    }
  }
}

process.stdout.write(
  'PRAgent paper sources are locked, installed, and composed in headless and web profiles.\n',
);
