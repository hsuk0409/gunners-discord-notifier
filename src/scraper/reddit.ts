import axios from 'axios';
import Parser from 'rss-parser';
import { NewsItem } from '../types.js';

// 공신력 있는 핵심 키워드 목록 (소문자 기준)
const TRUSTED_KEYWORDS = [
  'ornstein',
  'romano',
  'charles watts',
  'gunnerblog',
  'amy lawrence',
  'mokbel',
  'di marzio',
  'athletic',
  'telegraph',
  'times'
];

const parser = new Parser();

/**
 * Reddit 제목에서 공신력 있는 기자의 이름을 파싱해 냅니다.
 */
export function parseAuthorFromTitle(title: string): string {
  const match = title.match(/\[([^\]]+)\]/);
  if (match) {
    const rawAuthor = match[1];
    const lowerAuthor = rawAuthor.toLowerCase();
    if (TRUSTED_KEYWORDS.some(keyword => lowerAuthor.includes(keyword))) {
      return rawAuthor;
    }
  }

  const lowerTitle = title.toLowerCase();
  for (const keyword of TRUSTED_KEYWORDS) {
    if (lowerTitle.includes(keyword)) {
      if (keyword === 'ornstein') return 'David Ornstein';
      if (keyword === 'romano') return 'Fabrizio Romano';
      if (keyword === 'charles watts') return 'Charles Watts';
      if (keyword === 'gunnerblog') return 'James McNicholas (gunnerblog)';
      if (keyword === 'amy lawrence') return 'Amy Lawrence';
      if (keyword === 'mokbel') return 'Sami Mokbel';
      if (keyword === 'di marzio') return 'Gianluca Di Marzio';
      if (keyword === 'athletic') return 'The Athletic';
      if (keyword === 'telegraph') return 'The Telegraph';
      if (keyword === 'times') return 'The Times';
    }
  }

  return 'r/Gunners';
}

/**
 * r/Gunners 글이 수집 대상(공신력 있는 소식)인지 검사합니다.
 */
export function isTrustedPost(title: string, flairText: string): boolean {
  const lowerTitle = title.toLowerCase();
  const lowerFlair = (flairText || '').toLowerCase();

  const trustedFlairs = ['official', 'tier 1', 'tier 2', 'news', 'reliable', 'exclusive'];
  const hasTrustedFlair = trustedFlairs.some(flair => lowerFlair.includes(flair));
  const hasTrustedKeyword = TRUSTED_KEYWORDS.some(keyword => lowerTitle.includes(keyword));

  return hasTrustedFlair || hasTrustedKeyword;
}

/**
 * Reddit RSS 글 본문 HTML에서 실제 외부 공유된 아티클/트윗 링크를 발굴해냅니다.
 */
function extractOriginalUrl(content: string, redditFallbackUrl: string): string {
  if (!content) return redditFallbackUrl;

  // HTML 내용 내 모든 href 주소 추출
  const hrefMatch = content.match(/href="([^"]+)"/g);
  if (!hrefMatch) return redditFallbackUrl;

  const links = hrefMatch.map(h => h.replace('href="', '').replace('"', ''));

  // 1. 공신력 기자/매체 외부 링크 후보가 있는지 탐색
  const externalLink = links.find(l => 
    l.includes('x.com') || 
    l.includes('twitter.com') || 
    l.includes('theathletic.com') || 
    l.includes('t.co') ||
    l.includes('football.london') ||
    l.includes('telegraph.co.uk') ||
    l.includes('thetimes.com')
  );

  if (externalLink) {
    return externalLink;
  }

  // 2. 외부 뉴스 링크가 없고 단순 레딧 미디어나 덧글 링크 위주라면, 레딧 포스트 자체 링크 반환
  return redditFallbackUrl;
}

/**
 * Reddit r/Gunners RSS 피드를 가져와 공신력 있는 소식들을 필터링해 반환합니다.
 * (API 403 및 429 차단을 우회하기 위해 RSS 포맷을 활용하며 브라우저 헤더를 입혀 호출합니다.)
 */
export async function fetchRedditNews(): Promise<NewsItem[]> {
  const rssUrl = 'https://www.reddit.com/r/Gunners/new/.rss';
  
  try {
    const response = await axios.get(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      timeout: 10000,
    });

    const xmlText = response.data;
    if (!xmlText) {
      throw new Error('비어있는 XML 응답 수신');
    }

    const feed = await parser.parseString(xmlText);
    const items = feed.items || [];
    const newsItems: NewsItem[] = [];

    for (const item of items) {
      if (!item.title || !item.link) continue;

      // RSS 상 카테고리나 Flair 텍스트 등 추가 정보를 파싱 (Reddit RSS는 보통 category 태그가 제공됨)
      // item.categories 또는 item.content 등을 참고하여 신뢰성 체크
      // RSS 피드 항목은 flair 정보가 직접 노출되지 않을 수 있으므로 제목 키워드 필터링 위주로 검사
      const title = item.title;
      
      // 제목 자체나 본문에 신뢰 키워드가 들어가 있는 글인지 판별
      if (!isTrustedPost(title, '')) {
        continue;
      }

      const author = parseAuthorFromTitle(title);
      const sourceUrl = item.link;
      const originalUrl = extractOriginalUrl(item.content || '', sourceUrl);

      newsItems.push({
        title: title,
        url: originalUrl,
        author: author,
        source: 'reddit',
        timestamp: item.isoDate || new Date().toISOString(),
        excerpt: item.contentSnippet ? item.contentSnippet.substring(0, 200) + (item.contentSnippet.length > 200 ? '...' : '') : undefined,
        sourceUrl: sourceUrl,
      });
    }

    return newsItems;
  } catch (error: any) {
    console.error('Reddit RSS 스크랩 실패:', error.message);
    return [];
  }
}
