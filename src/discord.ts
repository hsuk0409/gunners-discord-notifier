import axios from 'axios';
import { NewsItem } from './types.js';

// 아스날 관련 컬러 데시멀 값
const COLORS = {
  ARSENAL_RED: 15663367, // #EF0107
  GOLD: 14926440,        // #E3C268
  GRAY: 8359053,         // #7F8C8D
};

/**
 * 기자의 공신력에 따라 Embed 카드의 색상을 결정합니다.
 */
function getEmbedColor(author: string): number {
  const normalizedAuthor = author.toLowerCase();
  
  // 1티어 공신력 기자
  const tier1 = ['ornstein', 'romano', 'charles watts', 'gunnerblog', 'amy lawrence'];
  if (tier1.some(name => normalizedAuthor.includes(name))) {
    return COLORS.ARSENAL_RED;
  }
  
  // 2티어 공신력 기자/매체
  const tier2 = ['di marzio', 'mokbel', 'wheatley', 'athletic', 'telegraph', 'times'];
  if (tier2.some(name => normalizedAuthor.includes(name))) {
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
  
  const embed = {
    title: item.title,
    url: item.url,
    color: color,
    author: {
      name: item.author || 'Arsenal News',
    },
    description: item.excerpt || '클릭하여 전체 내용을 확인하세요.',
    timestamp: item.timestamp,
    footer: {
      text: `Source: ${item.source.toUpperCase()}${item.sourceUrl ? ' (via Reddit)' : ''}`,
    },
  };

  try {
    await axios.post(webhookUrl, {
      embeds: [embed],
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
