import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  apply,
  inject,
  skillDefinition,
} from '../packages/deep-literature-research/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundleDir = path.join(root, 'packages', 'deep-literature-research');
let registered;

apply({
  skills: {
    register(definition) {
      registered = definition;
    },
  },
});

assert.deepEqual(inject, ['skills']);
assert.equal(registered, skillDefinition);
assert.equal(skillDefinition.name, 'deep-literature-research');
assert.match(skillDefinition.content, /mcp__paper_search__discover_papers/);
assert.match(skillDefinition.content, /FailureLesson/);
assert.match(skillDefinition.content, /contradiction/i);
assert.doesNotMatch(skillDefinition.content, /Sci-Hub.*allowed/i);

const schema = JSON.parse(
  await readFile(path.join(bundleDir, 'literature-review.schema.json'), 'utf8'),
);
const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
assert.equal(schema.title, 'LiteratureReview');
assert.equal(schema.properties.schemaVersion.const, '0.1.0');
assert(schema.required.includes('evidence'));
assert(schema.required.includes('stopDecision'));
assert.equal(schema.properties.conclusions.items.properties.evidenceIds.minItems, 1);
assert.equal(
  schema.allOf[0].then.properties.stopDecision.properties.kind.const,
  'coverage_satisfied',
);
assert.equal(typeof validate, 'function');

process.stdout.write(
  `${JSON.stringify({ skill: skillDefinition.name, schema: schema.$id })}\n`,
);
