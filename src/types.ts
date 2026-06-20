export interface NewsItem {
  title: string;
  url: string;       // 원본 소식의 고유 URL (중복 필터링의 Key)
  author: string;    // 기자/작성자 이름 (예: Fabrizio Romano, David Ornstein)
  source: 'reddit' | 'rss'; // 수집 경로
  timestamp: string; // ISO 8601 형식 날짜 문자열
  excerpt?: string;  // 본문 요약 (옵션)
  sourceUrl?: string; // 수집한 플랫폼 자체의 링크 (예: Reddit 포스트 URL)
}
