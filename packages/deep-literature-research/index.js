import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const resourceBase = fileURLToPath(new URL('.', import.meta.url));
const content = readFileSync(new URL('./skill.md', import.meta.url), 'utf8').trim();

export const name = 'cybereinstein-deep-literature-research';
export const inject = ['skills'];

export const skillDefinition = Object.freeze({
  name: 'deep-literature-research',
  description:
    'Conduct evidence-traceable scientific literature research with iterative question decomposition, paper search and reading, contradiction checks, gap reflection, and bounded synthesis.',
  whenToUse:
    'Use for scientific field surveys, prior-art reviews, research-history reconstruction, controversy analysis, or evidence-backed literature synthesis. Do not use for a single known-paper summary.',
  invocation: {
    modelInvocable: true,
    userInvocable: true,
  },
  source: '@cybereinstein/deep-literature-research',
  provider: '@cybereinstein/deep-literature-research',
  resourceBase: {
    kind: 'directory',
    path: resourceBase,
  },
  content,
});

export function apply(ctx) {
  ctx.skills.register(skillDefinition);
}
