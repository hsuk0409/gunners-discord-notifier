import axios from 'axios';
import Parser from 'rss-parser';
import { NewsItem } from '../types.js';

interface FeedConfig {
  url: string;
  defaultAuthor: string;
}

const parser = new Parser();

/**
 * 환경변수 또는 기본값에서 RSS 피드 목록 설정을 읽어옵니다.
 * 환경변수 포맷 예: RSS_FEEDS="https://www.arsenal.com/news/rss|Arsenal Official,https://nitter.privacydev.net/David_Ornstein/rss|David Ornstein"
 */
function getFeedConfigs(): FeedConfig[] {
  const envFeeds = process.env.RSS_FEEDS;
  
  if (envFeeds) {
    try {
      return envFeeds.split(',').flatMap(item => {
        const [url, author] = item.split('|');
        const trimmedUrl = url.trim();
        if (!trimmedUrl.startsWith('https://')) {
          console.warn(`RSS_FEEDS에 유효하지 않은 URL이 포함되어 건너뜁니다: ${trimmedUrl}`);
          return [];
        }
        return [{
          url: trimmedUrl,
          defaultAuthor: (author || 'RSS Source').trim(),
        }];
      });
    } catch (e) {
      console.error('RSS_FEEDS 환경변수 파싱 에러, 기본 설정을 사용합니다.', e);
    }
  }

  // 기본 백업 설정 (football.london 아스날 뉴스 RSS 피드)
  return [
    {
      url: 'https://www.football.london/arsenal-fc/?service=rss',
      defaultAuthor: 'Football.London (Arsenal)',
    }
  ];
}

/**
 * 등록된 RSS 피드들로부터 최신 소식들을 긁어옵니다.
 */
export async function fetchRssNews(): Promise<NewsItem[]> {
  const configs = getFeedConfigs();
  const newsItems: NewsItem[] = [];

  for (const config of configs) {
    try {
      // 10초 타임아웃 처리를 포함한 피드 파싱 (axios로 받아 parseString에 넘겨 연결 누수 방지)
      const response = await axios.get(config.url, {
        headers: { 'Accept': 'application/rss+xml, application/xml, text/xml, */*' },
        timeout: 10000,
      });
      const feed = await parser.parseString(response.data);

      const items = feed.items || [];
      
      for (const item of items) {
        if (!item.link || !item.title) continue;

        // RSS 아이템에 author/creator 필드가 있으면 사용하고 없으면 기본 지정자 사용
        const author = item.creator || item.author || config.defaultAuthor;
        
        // 날짜 파싱
        let timestamp = new Date().toISOString();
        if (item.isoDate) {
          timestamp = item.isoDate;
        } else if (item.pubDate) {
          timestamp = new Date(item.pubDate).toISOString();
        }

        newsItems.push({
          title: item.title,
          url: item.link,
          author: author,
          source: 'rss',
          timestamp: timestamp,
          excerpt: item.contentSnippet ? item.contentSnippet.substring(0, 200) + (item.contentSnippet.length > 200 ? '...' : '') : undefined,
        });
      }
    } catch (error: any) {
      console.error(`RSS 피드 스크랩 실패 (${config.url}):`, error.message);
      // 일부 피드 장해 시 전체 루프가 뻗지 않도록 개별 예외 우회 처리
    }
  }

  return newsItems;
}
