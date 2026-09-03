import { ReproductionCaseService } from './service.js';

export { ReproductionCaseError, ReproductionCaseService } from './service.js';

export const name = 'cybereinstein-reproduction-case';

export function apply(ctx, config = {}) {
  const service = new ReproductionCaseService({
    root: config.root,
  });
  ctx.provide('reproductionCases', service);
}
