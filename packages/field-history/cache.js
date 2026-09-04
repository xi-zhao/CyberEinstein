import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CACHE_VERSION = 1;

function clone(value) {
  return structuredClone(value);
}

export class MemoryResponseCache {
  constructor(options = {}) {
    this.ttlMs = options.ttlMs ?? 7 * 24 * 60 * 60 * 1000;
    this.now = options.now ?? Date.now;
    this.entries = new Map();
  }

  async get(key) {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return clone(entry.value);
  }

  async set(key, value, options = {}) {
    this.entries.set(key, {
      expiresAt: this.now() + (options.ttlMs ?? this.ttlMs),
      value: clone(value),
    });
  }
}

export class FileResponseCache {
  constructor(options = {}) {
    if (!options.directory) throw new TypeError('cache directory is required');
    this.directory = path.resolve(options.directory);
    this.ttlMs = options.ttlMs ?? 7 * 24 * 60 * 60 * 1000;
    this.now = options.now ?? Date.now;
  }

  #filename(key) {
    const digest = createHash('sha256').update(key).digest('hex');
    return path.join(this.directory, `${digest}.json`);
  }

  async get(key) {
    const filename = this.#filename(key);
    try {
      const entry = JSON.parse(await readFile(filename, 'utf8'));
      if (
        entry.version !== CACHE_VERSION ||
        entry.key !== key ||
        !Number.isFinite(entry.expiresAt) ||
        entry.expiresAt <= this.now()
      ) {
        return undefined;
      }
      return clone(entry.value);
    } catch {
      return undefined;
    }
  }

  async set(key, value, options = {}) {
    await mkdir(this.directory, { recursive: true });
    const filename = this.#filename(key);
    const temporary = `${filename}.${process.pid}.${randomUUID()}.tmp`;
    const entry = {
      version: CACHE_VERSION,
      key,
      expiresAt: this.now() + (options.ttlMs ?? this.ttlMs),
      value,
    };
    try {
      await writeFile(temporary, `${JSON.stringify(entry)}\n`, 'utf8');
      await rename(temporary, filename);
    } finally {
      await rm(temporary, { force: true }).catch(() => {});
    }
  }
}
