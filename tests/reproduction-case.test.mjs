import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  ReproductionCaseError,
  ReproductionCaseService,
  apply,
} from '../packages/reproduction-case/index.js';

function source(accessLevel = 'full_text') {
  return {
    id: 'paper_source',
    kind: 'paper',
    stableId: 'doi:10.0000/example',
    title: 'Example paper',
    provenance: 'publisher record supplied for the test',
    accessLevel,
  };
}

function targetClaim() {
  return {
    id: 'claim_1',
    text: 'The reported result can be independently reproduced.',
    kind: 'empirical_result',
    verificationType: 'computational',
    target: true,
    status: 'scoped',
    successCriteria: ['Metric agrees with the declared tolerance.'],
    methodIds: [],
    runIds: [],
    evidenceIds: [],
    counterEvidenceIds: [],
    reviewIds: [],
    uncertainties: [],
  };
}

async function withService(callback) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cybereinstein-rc-'));
  try {
    const ticks = [
      '2026-08-27T00:00:00.000Z',
      '2026-08-27T00:01:00.000Z',
      '2026-08-27T00:02:00.000Z',
    ];
    const service = new ReproductionCaseService({
      root,
      now: () => ticks.shift() ?? '2026-08-27T00:03:00.000Z',
    });
    await callback(service, root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('ReproductionCase persists across service instances with immutable history', async () => {
  await withService(async (service, root) => {
    const created = await service.create({
      id: 'rc_persisted',
      source: source(),
      claims: [targetClaim()],
      createdBy: 'researcher_1',
    });
    assert.equal(created.version, 1);

    const next = structuredClone(created);
    next.status = 'reconstructing';
    next.reproductionBoundary.remaining.push('Rebuild Figure 1.');
    const saved = await service.save(next, {
      expectedVersion: 1,
      actor: 'agent_1',
      reason: 'recorded the first bounded target',
    });
    assert.equal(saved.version, 2);

    const reopened = new ReproductionCaseService({ root });
    assert.deepEqual(await reopened.get('rc_persisted'), saved);
    assert.deepEqual(await reopened.get('rc_persisted', { version: 1 }), created);
    assert.deepEqual(
      (await reopened.history('rc_persisted')).map((entry) => entry.version),
      [1, 2],
    );

    const stored = JSON.parse(
      await readFile(path.join(root, 'cases', 'rc_persisted.json'), 'utf8'),
    );
    assert.equal(stored.headVersion, 2);
    assert.equal(stored.versions.length, 2);
  });
});

test('ReproductionCase rejects stale writers', async () => {
  await withService(async (service) => {
    const created = await service.create({
      id: 'rc_conflict',
      source: source(),
      createdBy: 'researcher_1',
    });
    const first = structuredClone(created);
    first.status = 'reconstructing';
    await service.save(first, {
      expectedVersion: 1,
      actor: 'agent_1',
      reason: 'first writer',
    });

    await assert.rejects(
      service.save(created, {
        expectedVersion: 1,
        actor: 'agent_2',
        reason: 'stale writer',
      }),
      (error) =>
        error instanceof ReproductionCaseError &&
        error.code === 'VERSION_CONFLICT',
    );
  });
});

test('scientific state rules block metadata evidence and unreviewed reproduction', async () => {
  await withService(async (service) => {
    const metadataCase = await service.create({
      id: 'rc_metadata',
      source: source('metadata_only'),
      claims: [targetClaim()],
      createdBy: 'researcher_1',
    });
    metadataCase.evidence.push({
      id: 'evidence_1',
      claimIds: ['claim_1'],
      relation: 'supports',
      kind: 'source',
      sourceId: 'paper_source',
      runId: null,
      locator: null,
      summary: 'Metadata is not scientific evidence.',
      assessment: 'Must be rejected.',
      createdBy: 'agent_1',
    });
    metadataCase.claims[0].evidenceIds.push('evidence_1');
    await assert.rejects(
      service.save(metadataCase, {
        expectedVersion: 1,
        actor: 'agent_1',
        reason: 'invalid metadata claim',
      }),
      (error) => error.code === 'DOMAIN_VALIDATION_FAILED',
    );

    const unreviewed = await service.create({
      id: 'rc_unreviewed',
      source: source(),
      claims: [targetClaim()],
      createdBy: 'researcher_1',
    });
    unreviewed.claims[0].status = 'reproduced';
    unreviewed.status = 'reproduced';
    await assert.rejects(
      service.save(unreviewed, {
        expectedVersion: 1,
        actor: 'agent_1',
        reason: 'invalid completion',
      }),
      (error) => error.code === 'DOMAIN_VALIDATION_FAILED',
    );
  });
});

test('completed-run evidence and independent review can mark a target reproduced', async () => {
  await withService(async (service) => {
    const value = await service.create({
      id: 'rc_reproduced',
      source: source(),
      claims: [targetClaim()],
      createdBy: 'researcher_1',
    });
    value.methodReconstructions.push({
      id: 'method_1',
      claimIds: ['claim_1'],
      description: 'Independent implementation of the reported computation.',
      assumptions: [],
      parameters: { seed: 7 },
      software: ['Node.js 24'],
      data: [],
      missingDetails: [],
    });
    value.runs.push({
      id: 'run_1',
      claimIds: ['claim_1'],
      methodId: 'method_1',
      kind: 'computation',
      status: 'completed',
      startedAt: '2026-08-27T00:00:00.000Z',
      finishedAt: '2026-08-27T00:00:01.000Z',
      environment: { node: '24.19.0', platform: 'linux-x64' },
      parameters: { seed: 7 },
      inputArtifacts: ['code_sha256:input'],
      outputArtifacts: ['data_sha256:output'],
      executor: 'agent_1',
    });
    value.evidence.push({
      id: 'evidence_1',
      claimIds: ['claim_1'],
      relation: 'supports',
      kind: 'run_result',
      sourceId: null,
      runId: 'run_1',
      locator: 'outputArtifacts[0]',
      summary: 'The metric agrees with the declared tolerance.',
      assessment: 'Machine check passed.',
      createdBy: 'agent_1',
    });
    value.reviews.push({
      id: 'review_1',
      targetType: 'claim',
      targetId: 'claim_1',
      reviewer: 'agent_1',
      independent: true,
      decision: 'accepted',
      findings: ['Run and evidence are traceable.'],
      createdAt: '2026-08-27T00:00:02.000Z',
    });
    Object.assign(value.claims[0], {
      status: 'reproduced',
      methodIds: ['method_1'],
      runIds: ['run_1'],
      evidenceIds: ['evidence_1'],
      reviewIds: ['review_1'],
    });
    value.status = 'reproduced';
    value.reproductionBoundary.included.push('claim_1');

    await assert.rejects(
      service.save(value, {
        expectedVersion: 1,
        actor: 'agent_1',
        reason: 'self-review cannot establish reproduction',
      }),
      (error) => error.code === 'DOMAIN_VALIDATION_FAILED',
    );

    value.reviews[0].reviewer = 'reviewer_2';

    const saved = await service.save(value, {
      expectedVersion: 1,
      actor: 'reviewer_2',
      reason: 'accepted independently reproduced target',
    });
    assert.equal(saved.status, 'reproduced');
    assert.equal(saved.claims[0].status, 'reproduced');
  });
});

test('Cordis bundle provides the ReproductionCase service and remains switchable', async () => {
  const provided = [];
  apply(
    {
      provide(name, value) {
        provided.push([name, value]);
      },
    },
    { root: '/tmp/cybereinstein-reproduction-case-test' },
  );
  assert.equal(provided.length, 1);
  assert.equal(provided[0][0], 'reproductionCases');
  assert(provided[0][1] instanceof ReproductionCaseService);

  const patch = await readFile(
    new URL('../packages/reproduction-case/cordis.patch.yml', import.meta.url),
    'utf8',
  );
  assert.match(patch, /CYBEREINSTEIN_REPRODUCTION_CASE_ENABLED/);
  assert.match(patch, /CYBEREINSTEIN_REPRODUCTION_STORE/);
});
