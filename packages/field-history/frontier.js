import {
  canonicalTopicId,
  integerOption,
  safeMessage,
  topicEntries,
  workId,
} from './model.js';

export class TopicFrontierDiscovery {
  constructor(options = {}) {
    this.client = options.client;
  }

  async discover(seed, options = {}) {
    const years = integerOption(options.years, 3, {
      name: 'frontier years',
      minimum: 1,
      maximum: 20,
    });
    const limit = integerOption(options.limit, 40, {
      name: 'frontier limit',
      maximum: 100,
    });
    const topicCount = integerOption(options.topicCount, 2, {
      name: 'frontier topic count',
      minimum: 1,
      maximum: 3,
    });
    const currentYear = options.currentYear ?? new Date().getUTCFullYear();
    const fromDate = `${currentYear - years + 1}-01-01`;
    const topicIds = topicEntries(seed)
      .slice(0, topicCount)
      .map((topic) => canonicalTopicId(topic.id))
      .filter(Boolean);
    if (topicIds.length === 0 || limit === 0) {
      return {
        works: [],
        topicIds,
        limitations: topicIds.length === 0
          ? ['The seed has no OpenAlex topics, so topic-wide frontier discovery was skipped.']
          : [],
      };
    }
    const perView = Math.max(1, Math.ceil(limit / 2));
    const settled = await Promise.allSettled([
      this.client.getTopicWorks(topicIds, {
        fromDate,
        limit: perView,
        sort: 'publication_date:desc',
      }),
      this.client.getTopicWorks(topicIds, {
        fromDate,
        limit: perView,
        sort: 'cited_by_count:desc',
      }),
    ]);
    const limitations = [];
    const groups = settled.map((result, index) => {
      if (result.status === 'fulfilled') return result.value;
      limitations.push(
        `topic frontier ${index === 0 ? 'recent' : 'influential'} view unavailable: ${safeMessage(result.reason)}`,
      );
      return [];
    });
    const works = [];
    const seen = new Set([workId(seed)]);
    const maximum = Math.max(groups[0].length, groups[1].length);
    for (let index = 0; index < maximum && works.length < limit; index += 1) {
      for (const work of [groups[0][index], groups[1][index]]) {
        const id = workId(work);
        if (id && !seen.has(id)) {
          seen.add(id);
          works.push(work);
          if (works.length === limit) break;
        }
      }
    }
    return { works, topicIds, limitations, fromDate };
  }
}
