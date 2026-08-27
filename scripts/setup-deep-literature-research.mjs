import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundleDir = path.join(root, 'packages', 'deep-literature-research');
const dshHome = path.join(root, '.cybereinstein', 'dsh-home');

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
  if (!result.stdout.includes('cybereinstein-deep-literature-research')) {
    throw new Error(
      `deep literature research is missing from the ${profile} profile`,
    );
  }
}

process.stdout.write(
  'Deep literature research is installed and composed in headless and web profiles.\n',
);
