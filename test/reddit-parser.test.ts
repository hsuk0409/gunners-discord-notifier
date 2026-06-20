import { describe, it, expect } from 'vitest';
import { parseAuthorFromTitle, isTrustedPost } from '../src/scraper/reddit.js';

describe('Reddit Scraper Parser Helpers', () => {
  describe('parseAuthorFromTitle', () => {
    it('대괄호 안에 공신력 기자가 명시된 경우 저자 이름을 올바르게 추출해야 합니다', () => {
      const title = '[David Ornstein] Arsenal agree personal terms with midfielder';
      expect(parseAuthorFromTitle(title)).toBe('David Ornstein');
    });

    it('대괄호는 없으나 제목 텍스트 중간에 기자 이름이 포함된 경우 맵핑된 이름을 반환해야 합니다', () => {
      const title = 'Romano: Arsenal have submitted a new bid';
      expect(parseAuthorFromTitle(title)).toBe('Fabrizio Romano');
    });

    it('공신력 있는 기자 키워드가 매칭되지 않으면 기본값인 r/Gunners를 반환해야 합니다', () => {
      const title = '[Daily Mail] Arsenal interested in backup goalkeeper';
      expect(parseAuthorFromTitle(title)).toBe('r/Gunners');
    });
  });

  describe('isTrustedPost', () => {
    it('공신력 신뢰 Flair가 붙어있는 글은 참(true)을 반환해야 합니다', () => {
      const title = 'Some random discussion';
      const flair = 'Tier 1';
      expect(isTrustedPost(title, flair)).toBe(true);
    });

    it('Flair는 없지만 제목에 신뢰 기자 키워드가 포함된 글은 참(true)을 반환해야 합니다', () => {
      const title = 'David Ornstein reporting updates on Arsenal transfers';
      const flair = '';
      expect(isTrustedPost(title, flair)).toBe(true);
    });

    it('신뢰 Flair도 없고 신뢰 기자 키워드도 포함하지 않으면 거짓(false)을 반환해야 합니다', () => {
      const title = 'What do you think about our new home kit?';
      const flair = 'Discussion';
      expect(isTrustedPost(title, flair)).toBe(false);
    });
  });
});
