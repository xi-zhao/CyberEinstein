import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import { clone, FieldHistoryError } from './model.js';

const schema = JSON.parse(
  readFileSync(new URL('./field-history.schema.json', import.meta.url), 'utf8'),
);
const validateSchema = new Ajv2020({
  allErrors: true,
  strict: true,
  formats: { 'date-time': true, uri: true },
}).compile(schema);

export class FieldHistoryMapValidator {
  validate(value) {
    if (!validateSchema(value)) {
      throw new FieldHistoryError(
        'SCHEMA_VALIDATION_FAILED',
        'FieldHistoryMap does not satisfy its JSON Schema',
        clone(validateSchema.errors),
      );
    }
    const nodeIds = new Set();
    for (const node of value.nodes) {
      if (nodeIds.has(node.id)) {
        throw new FieldHistoryError(
          'DOMAIN_VALIDATION_FAILED',
          `duplicate field-history node: ${node.id}`,
        );
      }
      nodeIds.add(node.id);
    }
    if (!nodeIds.has(value.seed.workId)) {
      throw new FieldHistoryError(
        'DOMAIN_VALIDATION_FAILED',
        'the resolved seed must exist in nodes',
      );
    }
    const edgeIds = new Set();
    for (const edge of value.edges) {
      if (edgeIds.has(edge.id)) {
        throw new FieldHistoryError(
          'DOMAIN_VALIDATION_FAILED',
          `duplicate field-history edge: ${edge.id}`,
        );
      }
      edgeIds.add(edge.id);
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        throw new FieldHistoryError(
          'DOMAIN_VALIDATION_FAILED',
          `edge ${edge.id} references a missing node`,
        );
      }
    }
    for (const [view, ids] of Object.entries(value.views)) {
      const index = view === 'backboneEdges' ? edgeIds : nodeIds;
      for (const id of ids) {
        if (!index.has(id)) {
          throw new FieldHistoryError(
            'DOMAIN_VALIDATION_FAILED',
            `${view} references a missing ${view === 'backboneEdges' ? 'edge' : 'node'}: ${id}`,
          );
        }
      }
    }
    return value;
  }
}
