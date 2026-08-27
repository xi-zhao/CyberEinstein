import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  apply,
  inject,
  skillDefinition,
} from '../packages/deep-literature-research/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundleDir = path.join(root, 'packages', 'deep-literature-research');

function partialReview() {
  return {
    schemaVersion: '0.1.0',
    id: 'lr_test',
    version: 1,
    status: 'partial',
    question: {
      text: 'What does the evidence show?',
      objective: 'Build a traceable answer.',
    },
    scope: {
      included: [],
      excluded: [],
      timeRange: null,
      sourceTypes: ['paper'],
      languages: ['en'],
    },
    subquestions: [],
    searchBatches: [],
    sources: [],
    evidence: [],
    conclusions: [],
    contradictions: [],
    gaps: [],
    failureLessons: [],
    stopDecision: {
      kind: 'budget_reached',
      reason: 'Test budget exhausted.',
      criteria: [],
      remainingActions: ['Continue discovery.'],
    },
  };
}

test('deep literature research registers one DSH-native skill', () => {
  const registrations = [];

  apply({
    skills: {
      register(definition) {
        registrations.push(definition);
      },
    },
  });

  assert.deepEqual(inject, ['skills']);
  assert.deepEqual(registrations, [skillDefinition]);
  assert.equal(skillDefinition.name, 'deep-literature-research');
  assert.equal(skillDefinition.invocation.modelInvocable, true);
  assert.equal(skillDefinition.invocation.userInvocable, true);
  assert.equal(skillDefinition.resourceBase.kind, 'directory');
});

test('research protocol composes bounded sources and evidence reflection', () => {
  const protocol = skillDefinition.content;

  assert.match(protocol, /mcp__paper_search__discover_papers/);
  assert.match(protocol, /mcp__paper_fetch__fetch_paper/);
  assert.match(protocol, /FailureLesson/);
  assert.match(protocol, /counterevidence/i);
  assert.match(protocol, /metadata_only/);
  assert.match(protocol, /There is no mandatory stage order/);
  assert.match(protocol, /Never use Sci-Hub, bypass a paywall/);
});

test('LiteratureReview contract requires evidence and an explicit stop decision', async () => {
  const schema = JSON.parse(
    await readFile(path.join(bundleDir, 'literature-review.schema.json'), 'utf8'),
  );
  const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);

  assert.equal(schema.title, 'LiteratureReview');
  assert.equal(schema.properties.schemaVersion.const, '0.1.0');
  assert(schema.required.includes('searchBatches'));
  assert(schema.required.includes('evidence'));
  assert(schema.required.includes('contradictions'));
  assert(schema.required.includes('failureLessons'));
  assert(schema.required.includes('stopDecision'));
  assert.equal(schema.properties.conclusions.items.properties.evidenceIds.minItems, 1);
  assert(schema.properties.status.enum.includes('partial'));
  assert(schema.properties.status.enum.includes('blocked'));
  assert.equal(
    schema.allOf[0].then.properties.stopDecision.properties.kind.const,
    'coverage_satisfied',
  );

  const partial = partialReview();
  assert.equal(validate(partial), true, JSON.stringify(validate.errors));

  const unsupportedCompletion = structuredClone(partial);
  unsupportedCompletion.status = 'complete';
  unsupportedCompletion.stopDecision.kind = 'coverage_satisfied';
  unsupportedCompletion.stopDecision.criteria = [];
  assert.equal(validate(unsupportedCompletion), false);

  unsupportedCompletion.stopDecision.criteria = [
    { name: 'counterevidence', satisfied: false, evidence: 'Not searched.' },
  ];
  assert.equal(validate(unsupportedCompletion), false);

  const supportedCompletion = structuredClone(unsupportedCompletion);
  supportedCompletion.stopDecision.criteria[0].satisfied = true;
  assert.equal(validate(supportedCompletion), true, JSON.stringify(validate.errors));

  const metadataAsEvidence = structuredClone(partial);
  metadataAsEvidence.evidence.push({
    id: 'ev_1',
    sourceId: 'src_1',
    claim: 'A metadata record proves a scientific result.',
    relation: 'supports',
    locator: null,
    accessLevel: 'metadata_only',
    assessment: 'This must be rejected by the contract.',
  });
  assert.equal(validate(metadataAsEvidence), false);
});

test('Cordis bundle is independently switchable and mounts no second harness', async () => {
  const patch = await readFile(path.join(bundleDir, 'cordis.patch.yml'), 'utf8');
  const manifest = JSON.parse(
    await readFile(path.join(bundleDir, 'package.json'), 'utf8'),
  );

  assert.match(patch, /id: cybereinstein-deep-literature-research/);
  assert.match(patch, /CYBEREINSTEIN_DEEP_RESEARCH_ENABLED/);
  assert.doesNotMatch(patch, /langgraph|deepagents|gpt-researcher/i);
  assert.deepEqual(manifest.dependencies, undefined);
});
