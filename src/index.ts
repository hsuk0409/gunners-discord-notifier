import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { sendDiscordNotification } from './discord.js';
import { fetchRedditNews } from './scraper/reddit.js';
import { fetchRssNews } from './scraper/rss.js';

// .env 로드
dotenv.config();

const STATE_DIR = path.join(process.cwd(), 'data');
const STATE_FILE = path.join(STATE_DIR, 'last_processed_ids.json');
const RETENTION_DAYS = 30;

interface ProcessedEntry {
  url: string;
  addedAt: string;
}

/**
 * 저장된 처리 항목을 불러옵니다. 기존 string[] 형식도 마이그레이션합니다.
 */
function loadProcessedEntries(): ProcessedEntry[] {
  if (!fs.existsSync(STATE_FILE)) {
    return [];
  }

  try {
    const data = fs.readFileSync(STATE_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    // 기존 string[] 형식 마이그레이션: addedAt을 오늘로 설정
    if (parsed.length > 0 && typeof parsed[0] === 'string') {
      console.log(`기존 형식 감지: ${parsed.length}개 항목을 새 형식으로 마이그레이션합니다.`);
      const today = new Date().toISOString();
      return (parsed as string[])
        .filter((x) => typeof x === 'string')
        .map((url) => ({ url, addedAt: today }));
    }

    return parsed as ProcessedEntry[];
  } catch (error) {
    console.error('상태 파일 읽기 실패, 빈 목록으로 시작합니다.', error);
    return [];
  }
}

/**
 * 30일 이내 항목만 필터링하여 저장합니다.
 */
function saveProcessedEntries(entries: ProcessedEntry[]): void {
  try {
    if (!fs.existsSync(STATE_DIR)) {
      fs.mkdirSync(STATE_DIR, { recursive: true });
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

    const itemsToSave = entries.filter(
      (e) => new Date(e.addedAt).getTime() >= cutoff.getTime()
    );

    fs.writeFileSync(STATE_FILE, JSON.stringify(itemsToSave, null, 2), 'utf-8');
  } catch (error) {
    console.error('상태 파일 저장 실패:', error);
  }
}

async function main() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('DISCORD_WEBHOOK_URL 환경변수가 설정되지 않았습니다. 실행을 중단합니다.');
    process.exit(1);
  }

  console.log('아스날 해외 소식 수집 및 알림 프로세스 시작...');

  // 1. 이전 처리된 항목 로드
  const processedEntries = loadProcessedEntries();
  const processedSet = new Set(processedEntries.map((e) => e.url));

  // 2. Reddit 및 RSS 병렬 수집
  console.log('데이터 수집 중 (Reddit & RSS)...');
  const [redditNews, rssNews] = await Promise.all([
    fetchRedditNews(),
    fetchRssNews()
  ]);

  // 3. 수집 데이터 병합 및 정렬
  const rawAllNews = [...redditNews, ...rssNews];

  // 오래된 소식부터 디스코드에 쌓이도록 타임스탬프 기준 오름차순 정렬
  const allNews = rawAllNews.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  console.log(`총 ${allNews.length}개의 소식이 수집되었습니다. 필터링 시작...`);

  // 4. 중복 필터링 및 디스코드 전송
  const newEntries: ProcessedEntry[] = [...processedEntries];
  const uniqueUrlsInBatch = new Set<string>();
  let sentCount = 0;

  for (const item of allNews) {
    // 4-1. 배치 내 중복 또는 기전송 중복 차단
    if (processedSet.has(item.url) || uniqueUrlsInBatch.has(item.url)) {
      continue;
    }

    uniqueUrlsInBatch.add(item.url);
    processedSet.add(item.url);
    newEntries.push({ url: item.url, addedAt: new Date().toISOString() });

    // 4-2. 디스코드 알림 전송
    console.log(`[새 소식 알림] [${item.author}] ${item.title}`);
    try {
      await sendDiscordNotification(webhookUrl, item);
      sentCount++;
      // 디스코드 API 레이트 리밋 우회를 위해 짧은 딜레이 추가 (0.5초)
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      // 메시지 전송 실패 시, 다음 실행 때 재시도할 수 있도록 상태에서 제거
      processedSet.delete(item.url);
      const index = newEntries.findIndex((e) => e.url === item.url);
      if (index > -1) {
        newEntries.splice(index, 1);
      }
    }
  }

  // 5. 변경된 상태값 저장 (새로 추가된 항목이 있거나 만료 항목 정리가 필요하면 항상 저장)
  if (newEntries.length > processedEntries.length) {
    console.log(`총 ${sentCount}개의 알림을 전송 완료했습니다. 상태를 업데이트합니다.`);
  } else {
    console.log('새로 전송할 소식이 없습니다.');
  }
  saveProcessedEntries(newEntries);

  console.log('알림 프로세스 완료.');
}

// 스크립트 실행
main().catch(error => {
  console.error('치명적인 오류 발생:', error);
  process.exit(1);
});
