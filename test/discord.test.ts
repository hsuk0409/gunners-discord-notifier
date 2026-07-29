import { describe, it, expect } from 'vitest';
import { buildKakaoShareUrl } from '../src/discord.js';

describe('buildKakaoShareUrl', () => {
  it('제목과 원본 링크를 쿼리스트링으로 인코딩한 공유 페이지 URL을 생성해야 합니다', () => {
    const url = buildKakaoShareUrl('오르스테인: 아스날 새 미드필더 영입 근접', 'https://example.com/article?id=1&ref=twitter');

    expect(url.startsWith('https://hsuk0409.github.io/gunners-discord-notifier/share.html?')).toBe(true);

    const parsed = new URL(url);
    expect(parsed.searchParams.get('title')).toBe('오르스테인: 아스날 새 미드필더 영입 근접');
    expect(parsed.searchParams.get('url')).toBe('https://example.com/article?id=1&ref=twitter');
  });
});
