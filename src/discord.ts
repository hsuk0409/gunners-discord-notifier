import axios from 'axios';
import { NewsItem } from './types.js';
import { translateToKorean } from './translator.js';
import { TIER1_KEYWORDS, TIER2_KEYWORDS } from './trustedSources.js';

// 아스날 관련 컬러 데시멀 값
const COLORS = {
  ARSENAL_RED: 15663367, // #EF0107
  GOLD: 14926440,        // #E3C268
  GRAY: 8359053,         // #7F8C8D
};

// GitHub Pages로 배포된 카카오톡 공유 랜딩 페이지 (Web Share API, 로그인 불필요)
const KAKAO_SHARE_PAGE_URL = 'https://hsuk0409.github.io/gunners-discord-notifier/share.html';

/**
 * 기사 제목/링크를 쿼리스트링으로 담아 카카오톡 공유 랜딩 페이지 URL을 생성합니다.
 */
export function buildKakaoShareUrl(title: string, url: string): string {
  const query = new URLSearchParams({ title, url });
  return `${KAKAO_SHARE_PAGE_URL}?${query.toString()}`;
}

/**
 * 기자의 공신력에 따라 Embed 카드의 색상을 결정합니다.
 */
function getEmbedColor(author: string): number {
  const normalizedAuthor = author.toLowerCase();

  if (TIER1_KEYWORDS.some(name => normalizedAuthor.includes(name))) {
    return COLORS.ARSENAL_RED;
  }

  if (TIER2_KEYWORDS.some(name => normalizedAuthor.includes(name))) {
    return COLORS.GOLD;
  }

  return COLORS.GRAY;
}

/**
 * 단일 뉴스 아이템을 Discord Webhook을 통해 Embed 카드로 전송합니다.
 */
export async function sendDiscordNotification(webhookUrl: string, item: NewsItem): Promise<void> {
  if (!webhookUrl) {
    throw new Error('Discord Webhook URL이 제공되지 않았습니다.');
  }

  const color = getEmbedColor(item.author);

  const [translatedTitle, translatedExcerpt] = await Promise.all([
    translateToKorean(item.title),
    item.excerpt ? translateToKorean(item.excerpt) : Promise.resolve(''),
  ]);

  const embed = {
    title: translatedTitle,
    url: item.url,
    color: color,
    author: {
      name: item.author || 'Arsenal News',
    },
    description: translatedExcerpt || '클릭하여 전체 내용을 확인하세요.',
    timestamp: item.timestamp,
    footer: {
      text: `Source: ${item.source.toUpperCase()}${item.sourceUrl ? ' (via Reddit)' : ''}`,
    },
  };

  const components = [
    {
      type: 1, // Action Row
      components: [
        {
          type: 2, // Button
          style: 5, // Link (interaction endpoint 없이도 동작)
          label: '카카오톡 공유',
          url: buildKakaoShareUrl(translatedTitle, item.url),
        },
      ],
    },
  ];

  try {
    // 애플리케이션이 소유하지 않은 일반 Incoming Webhook에서 components(버튼)를 렌더링하려면
    // with_components=true가 없으면 Discord가 에러 없이 components를 조용히 무시함
    await axios.post(`${webhookUrl}?with_components=true`, {
      embeds: [embed],
      components,
    });
  } catch (error: any) {
    console.error(`Discord 알림 전송 실패: ${item.title}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}, Data:`, error.response.data);
    } else {
      console.error(error.message);
    }
    throw error;
  }
}
