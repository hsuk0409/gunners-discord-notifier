import { describe, it, expect, afterEach } from 'vitest';
import { getFeedConfigs } from '../src/scraper/rss.js';

describe('RSS Feed Config', () => {
  afterEach(() => {
    delete process.env.RSS_FEEDS;
  });

  it('RSS_FEEDS가 없으면 football.london 기본 피드만 반환해야 합니다', () => {
    const configs = getFeedConfigs();
    expect(configs).toHaveLength(1);
    expect(configs[0].url).toBe('https://www.football.london/arsenal-fc/?service=rss');
  });

  it('RSS_FEEDS가 설정되면 기본 피드를 대체하지 않고 추가해야 합니다', () => {
    process.env.RSS_FEEDS = 'https://feeds.bbci.co.uk/sport/football/teams/arsenal/rss.xml|BBC Sport,https://www.theguardian.com/football/arsenal/rss|The Guardian';

    const configs = getFeedConfigs();
    const urls = configs.map(c => c.url);

    expect(urls).toContain('https://www.football.london/arsenal-fc/?service=rss');
    expect(urls).toContain('https://feeds.bbci.co.uk/sport/football/teams/arsenal/rss.xml');
    expect(urls).toContain('https://www.theguardian.com/football/arsenal/rss');
    expect(configs).toHaveLength(3);
  });

  it('RSS_FEEDS에 기본 피드와 동일한 URL이 들어와도 중복 등록되지 않아야 합니다', () => {
    process.env.RSS_FEEDS = 'https://www.football.london/arsenal-fc/?service=rss|Duplicate';

    const configs = getFeedConfigs();
    expect(configs).toHaveLength(1);
  });
});
