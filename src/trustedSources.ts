/**
 * 아스날 관련 공신력 있는 기자/매체 목록 (reddit.ts, discord.ts 공용).
 * 소문자 키워드 기준으로 매칭하며, 오탐(false positive)을 줄이기 위해
 * 일반 단어와 겹치는 성(姓)은 두 단어 이상의 구문으로 등록합니다.
 */

// 1티어: 아스날/이적 시장을 전담하다시피 하는 최상위 신뢰 기자
export const TIER1_KEYWORDS = [
  'ornstein',
  'romano',
  'charles watts',
  'gunnerblog',
  'amy lawrence',
];

// 2티어: 신뢰도 높은 아스날 전담 기자 및 매체
export const TIER2_KEYWORDS = [
  'mokbel',
  'di marzio',
  'wheatley',
  'collings',
  'kinsella',
  'james olley',
  'john cross',
  'hytner',
  'solhekol',
  'athletic',
  'telegraph',
  'times',
  'sky sports',
  'bbc sport',
];

export const TRUSTED_KEYWORDS = [...TIER1_KEYWORDS, ...TIER2_KEYWORDS];

// 키워드 매칭 시 노출할 표시용 이름
export const AUTHOR_DISPLAY_NAMES: Record<string, string> = {
  ornstein: 'David Ornstein',
  romano: 'Fabrizio Romano',
  'charles watts': 'Charles Watts',
  gunnerblog: 'James McNicholas (gunnerblog)',
  'amy lawrence': 'Amy Lawrence',
  mokbel: 'Sami Mokbel',
  'di marzio': 'Gianluca Di Marzio',
  wheatley: 'Chris Wheatley',
  collings: 'Simon Collings',
  kinsella: 'Nizaar Kinsella',
  'james olley': 'James Olley',
  'john cross': 'John Cross',
  hytner: 'David Hytner',
  solhekol: 'Kaveh Solhekol',
  athletic: 'The Athletic',
  telegraph: 'The Telegraph',
  times: 'The Times',
  'sky sports': 'Sky Sports',
  'bbc sport': 'BBC Sport',
};
