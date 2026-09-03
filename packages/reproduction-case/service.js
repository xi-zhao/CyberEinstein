import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  stat,
  unlink,
} from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const schema = JSON.parse(
  readFileSync(new URL('./reproduction-case.schema.json', import.meta.url), 'utf8'),
);
const validateSchema = new Ajv2020({ allErrors: true, strict: true }).compile(
  schema,
);

const STORAGE_VERSION = '0.1.0';
const DEFAULT_ROOT = path.resolve('.cybereinstein', 'reproduction-cases');

export class ReproductionCaseError extends Error {
  constructor(code, message, details = undefined) {
    super(message);
    this.name = 'ReproductionCaseError';
    this.code = code;
    this.details = details;
  }
}

function clone(value) {
  return structuredClone(value);
}

function assertNonEmpty(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ReproductionCaseError(
      'INVALID_ARGUMENT',
      `${field} must be a non-empty string`,
    );
  }
}

function indexById(items, collectionName) {
  const result = new Map();
  for (const item of items) {
    if (result.has(item.id)) {
      throw new ReproductionCaseError(
        'DOMAIN_VALIDATION_FAILED',
        `duplicate ${collectionName} id: ${item.id}`,
      );
    }
    result.set(item.id, item);
  }
  return result;
}

function requireReferences(ids, index, field) {
  for (const id of ids) {
    if (!index.has(id)) {
      throw new ReproductionCaseError(
        'DOMAIN_VALIDATION_FAILED',
        `${field} references missing id: ${id}`,
      );
    }
  }
}

function assertDomainRules(value) {
  const claims = indexById(value.claims, 'claim');
  const methods = indexById(value.methodReconstructions, 'method');
  const requirements = indexById(
    value.infrastructureRequirements,
    'infrastructure requirement',
  );
  const runs = indexById(value.runs, 'run');
  const evidence = indexById(value.evidence, 'evidence');
  const reviews = indexById(value.reviews, 'review');
  indexById(value.failureLessons, 'failure lesson');

  for (const claim of claims.values()) {
    requireReferences(claim.methodIds, methods, `claim ${claim.id}.methodIds`);
    requireReferences(claim.runIds, runs, `claim ${claim.id}.runIds`);
    requireReferences(
      claim.evidenceIds,
      evidence,
      `claim ${claim.id}.evidenceIds`,
    );
    requireReferences(
      claim.counterEvidenceIds,
      evidence,
      `claim ${claim.id}.counterEvidenceIds`,
    );
    requireReferences(claim.reviewIds, reviews, `claim ${claim.id}.reviewIds`);

    for (const methodId of claim.methodIds) {
      if (!methods.get(methodId).claimIds.includes(claim.id)) {
        throw new ReproductionCaseError(
          'DOMAIN_VALIDATION_FAILED',
          `claim ${claim.id}.methodIds must point to a method for that claim`,
        );
      }
    }
    for (const runId of claim.runIds) {
      if (!runs.get(runId).claimIds.includes(claim.id)) {
        throw new ReproductionCaseError(
          'DOMAIN_VALIDATION_FAILED',
          `claim ${claim.id}.runIds must point to a run for that claim`,
        );
      }
    }

    for (const evidenceId of claim.evidenceIds) {
      const item = evidence.get(evidenceId);
      if (!item.claimIds.includes(claim.id) || item.relation !== 'supports') {
        throw new ReproductionCaseError(
          'DOMAIN_VALIDATION_FAILED',
          `claim ${claim.id}.evidenceIds must point to supporting evidence for that claim`,
        );
      }
    }
    for (const evidenceId of claim.counterEvidenceIds) {
      const item = evidence.get(evidenceId);
      if (!item.claimIds.includes(claim.id) || item.relation !== 'challenges') {
        throw new ReproductionCaseError(
          'DOMAIN_VALIDATION_FAILED',
          `claim ${claim.id}.counterEvidenceIds must point to challenging evidence for that claim`,
        );
      }
    }

    if (claim.status === 'reproduced') {
      const hasCompletedRunEvidence = claim.evidenceIds.some((evidenceId) => {
        const item = evidence.get(evidenceId);
        return item.runId && runs.get(item.runId)?.status === 'completed';
      });
      const hasIndependentAcceptance = claim.reviewIds.some((reviewId) => {
        const review = reviews.get(reviewId);
        const contributors = new Set();
        for (const evidenceId of claim.evidenceIds) {
          const item = evidence.get(evidenceId);
          contributors.add(item.createdBy);
          if (item.runId) contributors.add(runs.get(item.runId).executor);
        }
        return (
          review.targetType === 'claim' &&
          review.targetId === claim.id &&
          review.independent &&
          review.decision === 'accepted' &&
          !contributors.has(review.reviewer)
        );
      });
      if (!hasCompletedRunEvidence || !hasIndependentAcceptance) {
        throw new ReproductionCaseError(
          'DOMAIN_VALIDATION_FAILED',
          `claim ${claim.id} cannot be reproduced without completed-run evidence and an accepted independent review`,
        );
      }
    }
  }

  for (const method of methods.values()) {
    requireReferences(method.claimIds, claims, `method ${method.id}.claimIds`);
  }

  for (const requirement of requirements.values()) {
    requireReferences(
      requirement.claimIds,
      claims,
      `infrastructure requirement ${requirement.id}.claimIds`,
    );
  }

  for (const run of runs.values()) {
    requireReferences(run.claimIds, claims, `run ${run.id}.claimIds`);
    requireReferences([run.methodId], methods, `run ${run.id}.methodId`);
    if (run.status === 'completed' && (!run.startedAt || !run.finishedAt)) {
      throw new ReproductionCaseError(
        'DOMAIN_VALIDATION_FAILED',
        `completed run ${run.id} requires startedAt and finishedAt`,
      );
    }
  }

  for (const item of evidence.values()) {
    requireReferences(item.claimIds, claims, `evidence ${item.id}.claimIds`);
    if (item.sourceId && item.sourceId !== value.source.id) {
      throw new ReproductionCaseError(
        'DOMAIN_VALIDATION_FAILED',
        `evidence ${item.id}.sourceId references an unknown source`,
      );
    }
    if (item.runId) {
      requireReferences([item.runId], runs, `evidence ${item.id}.runId`);
    }
    if (item.sourceId && value.source.accessLevel === 'metadata_only') {
      throw new ReproductionCaseError(
        'DOMAIN_VALIDATION_FAILED',
        `metadata-only source ${value.source.id} cannot support scientific evidence`,
      );
    }
  }

  for (const review of reviews.values()) {
    const targets = {
      claim: claims,
      run: runs,
      evidence,
      case: new Map([[value.id, value]]),
    };
    requireReferences(
      [review.targetId],
      targets[review.targetType],
      `review ${review.id}.targetId`,
    );
  }

  if (value.status === 'reproduced') {
    const targets = value.claims.filter((claim) => claim.target);
    if (targets.length === 0 || targets.some((claim) => claim.status !== 'reproduced')) {
      throw new ReproductionCaseError(
        'DOMAIN_VALIDATION_FAILED',
        'a reproduced case requires at least one target claim and every target claim must be reproduced',
      );
    }
    const unresolvedBlocker = value.infrastructureRequirements.some(
      (item) =>
        item.blocking &&
        (item.status === 'missing' || item.status === 'pending_approval'),
    );
    if (unresolvedBlocker) {
      throw new ReproductionCaseError(
        'DOMAIN_VALIDATION_FAILED',
        'a reproduced case cannot retain a missing or unapproved blocking requirement',
      );
    }
  }
}

function validateCase(value) {
  if (!validateSchema(value)) {
    throw new ReproductionCaseError(
      'SCHEMA_VALIDATION_FAILED',
      'ReproductionCase does not satisfy its JSON Schema',
      clone(validateSchema.errors),
    );
  }
  assertDomainRules(value);
  return value;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ReproductionCaseService {
  constructor(options = {}) {
    this.root = path.resolve(options.root ?? DEFAULT_ROOT);
    this.casesRoot = path.join(this.root, 'cases');
    this.locksRoot = path.join(this.root, 'locks');
    this.now = options.now ?? (() => new Date().toISOString());
    this.idFactory =
      options.idFactory ?? (() => `rc_${randomUUID().replaceAll('-', '')}`);
    this.lockTimeoutMs = options.lockTimeoutMs ?? 5_000;
    this.staleLockMs = options.staleLockMs ?? 30_000;
  }

  validate(value) {
    return clone(validateCase(clone(value)));
  }

  async create(input) {
    assertNonEmpty(input?.createdBy, 'createdBy');
    const id = input.id ?? this.idFactory();
    const timestamp = this.now();
    const source = clone(input.source);
    source.id ??= 'primary_source';
    const value = {
      schemaVersion: '0.1.0',
      id,
      version: 1,
      status: 'scoping',
      title: input.title ?? source.title,
      researchProgramId: input.researchProgramId ?? null,
      source,
      claims: clone(input.claims ?? []),
      methodReconstructions: [],
      infrastructureRequirements: [],
      runs: [],
      evidence: [],
      reviews: [],
      failureLessons: [],
      reproductionBoundary: clone(
        input.reproductionBoundary ?? {
          included: [],
          excluded: [],
          remaining: [],
        },
      ),
      createdBy: input.createdBy,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    validateCase(value);

    return this.#withCaseLock(id, async () => {
      const existing = await this.#readDocument(id, { allowMissing: true });
      if (existing) {
        throw new ReproductionCaseError(
          'ALREADY_EXISTS',
          `ReproductionCase already exists: ${id}`,
        );
      }
      const document = {
        storageVersion: STORAGE_VERSION,
        id,
        headVersion: 1,
        versions: [
          {
            value,
            actor: input.createdBy,
            reason: input.reason ?? 'created reproduction case',
            recordedAt: timestamp,
          },
        ],
      };
      await this.#writeDocument(document);
      return clone(value);
    });
  }

  async get(id, options = {}) {
    const document = await this.#readDocument(id);
    const version = options.version ?? document.headVersion;
    const entry = document.versions.find((item) => item.value.version === version);
    if (!entry) {
      throw new ReproductionCaseError(
        'VERSION_NOT_FOUND',
        `ReproductionCase ${id} has no version ${version}`,
      );
    }
    return clone(entry.value);
  }

  async history(id) {
    const document = await this.#readDocument(id);
    return document.versions.map((entry) => ({
      version: entry.value.version,
      status: entry.value.status,
      actor: entry.actor,
      reason: entry.reason,
      recordedAt: entry.recordedAt,
    }));
  }

  async list(options = {}) {
    await mkdir(this.casesRoot, { recursive: true, mode: 0o700 });
    const entries = await readdir(this.casesRoot, { withFileTypes: true });
    const results = [];
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
      const id = entry.name.slice(0, -5);
      const document = await this.#readDocument(id);
      const value = document.versions.at(-1).value;
      if (options.status && value.status !== options.status) continue;
      if (
        options.researchProgramId !== undefined &&
        value.researchProgramId !== options.researchProgramId
      ) {
        continue;
      }
      results.push({
        id: value.id,
        title: value.title,
        status: value.status,
        version: value.version,
        researchProgramId: value.researchProgramId,
        updatedAt: value.updatedAt,
      });
    }
    return results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async save(value, options) {
    assertNonEmpty(options?.actor, 'actor');
    assertNonEmpty(options?.reason, 'reason');
    if (!Number.isInteger(options?.expectedVersion) || options.expectedVersion < 1) {
      throw new ReproductionCaseError(
        'INVALID_ARGUMENT',
        'expectedVersion must be a positive integer',
      );
    }
    const id = value?.id;
    assertNonEmpty(id, 'id');

    return this.#withCaseLock(id, async () => {
      const document = await this.#readDocument(id);
      if (document.headVersion !== options.expectedVersion) {
        throw new ReproductionCaseError(
          'VERSION_CONFLICT',
          `expected version ${options.expectedVersion}, found ${document.headVersion}`,
          { expectedVersion: options.expectedVersion, actualVersion: document.headVersion },
        );
      }
      const current = document.versions.at(-1).value;
      const next = clone(value);
      if (
        next.id !== current.id ||
        next.schemaVersion !== current.schemaVersion ||
        next.createdAt !== current.createdAt ||
        next.createdBy !== current.createdBy
      ) {
        throw new ReproductionCaseError(
          'IMMUTABLE_FIELD_CHANGED',
          'id, schemaVersion, createdAt, and createdBy are immutable',
        );
      }
      next.version = current.version + 1;
      next.updatedAt = this.now();
      validateCase(next);
      document.headVersion = next.version;
      document.versions.push({
        value: next,
        actor: options.actor,
        reason: options.reason,
        recordedAt: next.updatedAt,
      });
      await this.#writeDocument(document);
      return clone(next);
    });
  }

  async #withCaseLock(id, callback) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(id)) {
      throw new ReproductionCaseError('INVALID_ARGUMENT', `unsafe case id: ${id}`);
    }
    await mkdir(this.locksRoot, { recursive: true, mode: 0o700 });
    const lockPath = path.join(this.locksRoot, `${id}.lock`);
    const deadline = Date.now() + this.lockTimeoutMs;
    let handle;
    while (!handle) {
      try {
        handle = await open(lockPath, 'wx', 0o600);
        await handle.writeFile(
          JSON.stringify({ pid: process.pid, acquiredAt: this.now() }),
          'utf8',
        );
        await handle.sync();
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        try {
          const lockStat = await stat(lockPath);
          if (Date.now() - lockStat.mtimeMs > this.staleLockMs) {
            await unlink(lockPath);
            continue;
          }
        } catch (lockError) {
          if (lockError.code === 'ENOENT') continue;
          throw lockError;
        }
        if (Date.now() >= deadline) {
          throw new ReproductionCaseError(
            'LOCK_TIMEOUT',
            `timed out waiting for ReproductionCase lock: ${id}`,
          );
        }
        await delay(25);
      }
    }

    try {
      return await callback();
    } finally {
      await handle.close();
      await unlink(lockPath).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
  }

  #casePath(id) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(id)) {
      throw new ReproductionCaseError('INVALID_ARGUMENT', `unsafe case id: ${id}`);
    }
    return path.join(this.casesRoot, `${id}.json`);
  }

  async #readDocument(id, options = {}) {
    const filePath = this.#casePath(id);
    let content;
    try {
      content = await readFile(filePath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        if (options.allowMissing) return null;
        throw new ReproductionCaseError(
          'NOT_FOUND',
          `ReproductionCase not found: ${id}`,
        );
      }
      throw error;
    }

    let document;
    try {
      document = JSON.parse(content);
    } catch (error) {
      throw new ReproductionCaseError(
        'CORRUPT_STORAGE',
        `unable to parse persisted ReproductionCase: ${id}`,
        { cause: error.message },
      );
    }
    if (
      document.storageVersion !== STORAGE_VERSION ||
      document.id !== id ||
      !Array.isArray(document.versions) ||
      document.versions.length === 0 ||
      document.headVersion !== document.versions.at(-1).value.version
    ) {
      throw new ReproductionCaseError(
        'CORRUPT_STORAGE',
        `invalid persisted ReproductionCase envelope: ${id}`,
      );
    }
    for (const entry of document.versions) {
      assertNonEmpty(entry.actor, 'persisted version actor');
      assertNonEmpty(entry.reason, 'persisted version reason');
      assertNonEmpty(entry.recordedAt, 'persisted version recordedAt');
      validateCase(entry.value);
    }
    return document;
  }

  async #writeDocument(document) {
    await mkdir(this.casesRoot, { recursive: true, mode: 0o700 });
    const target = this.#casePath(document.id);
    const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
    let handle;
    try {
      handle = await open(temporary, 'wx', 0o600);
      await handle.writeFile(`${JSON.stringify(document, null, 2)}\n`, 'utf8');
      await handle.sync();
      await handle.close();
      handle = undefined;
      await rename(temporary, target);
    } catch (error) {
      if (handle) await handle.close().catch(() => {});
      await unlink(temporary).catch(() => {});
      throw error;
    }
  }
}
