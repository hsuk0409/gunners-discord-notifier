# Gunners Discord Notifier Implementation Plan (2026-06-20)

본 계획서는 `llm-wiki` 프로젝트 내 "아스날 소식 애그리게이터 & 알리미 기획"을 바탕으로, 공신력 있는 아스날 소식을 수집하여 디스코드 채널로 알림을 전송하는 `gunners-discord-notifier` 프로젝트의 개발 단계와 설계를 정의합니다.

## 핵심 의사결정 사항

- **개발 언어**: 순수 Node.js (TypeScript) 단일 스크립트로 구현하여 불필요한 프레임워크 오버헤드를 배제합니다.
- **수집 소스**: Reddit `r/Gunners` API와 RSS 피드(트위터 RSS 등)를 병행 수집(하이브리드)하고, 최종 메시지 전송 전에 원본 글의 URL을 기준으로 중복을 필터링합니다.

---

## Proposed Changes

### Component 1: 환경 구성 및 에이전트 룰 셋업

`gunners-discord-notifier` 프로젝트의 기본 구조를 형성하고 바이브 코딩 및 인지 부채를 막기 위한 환경을 셋업합니다.

#### [NEW] [AGENTS.md](../AGENTS.md)
- 프로젝트 아키텍처 및 에이전트 협업 규칙 명시.

#### [NEW] [package.json](../package.json)
- 의존성 패키지 정의 (TypeScript, Axios, RSS-Parser, Dotenv, Vitest 등).

#### [NEW] [tsconfig.json](../tsconfig.json)
- TypeScript 컴파일러 설정.

#### [MODIFY] [.gitignore](../.gitignore)
- `.env`, `node_modules` 등 로컬 설정 및 캐시 파일 격리.

---

### Component 2: 핵심 알림 및 하이브리드 스크래퍼 모듈 구현

디스코드 웹훅을 통한 메시지 전송 로직과 두 가지 데이터 소스(Reddit, RSS)에서 정보 수집 및 중복 제거 처리를 수행하는 모듈을 구현합니다.

#### [NEW] `src/types.ts`
- 뉴스의 표준화된 인터페이스 정의 (`title`, `url`, `author`, `source`, `timestamp` 등).

#### [NEW] `src/discord.ts`
- Discord Webhook을 호출해 정제된 카드(Embed) 메시지를 전송하는 모듈 구현. 기자의 신뢰도나 출처에 따라 시각적 차별화 적용.

#### [NEW] `src/scraper/reddit.ts`
- Reddit `r/Gunners`에서 특정 공신력 기자들의 소식(트윗 링크, 언론 기사 등)을 긁어와 공통 포맷으로 정제하는 모듈.

#### [NEW] `src/scraper/rss.ts`
- RSS 피드(예: Nitter RSS 등 트위터 변환기나 아스날 공식 뉴스 RSS)를 파싱하는 모듈.

#### [NEW] `src/index.ts`
- 두 스크래퍼를 병렬로 돌려 결과를 모은 뒤, 원본 URL 기준으로 중복을 필터링하고 미전송 뉴스를 디스코드 웹훅으로 보낸 후 상태를 저장하는 핵심 엔트리포인트.

---

### Component 3: 상태 관리 및 자동화 워크플로우

중복 전송을 방지하기 위한 로컬 상태 기록 저장 및 자동 크론 스케줄링 환경을 셋업합니다.

#### [NEW] `data/last_processed_ids.json`
- 이미 디스코드에 알림이 완료된 포스트의 원본 URL 리스트를 임시로 기록할 JSON 파일. (예: 최근 100~200개의 URL을 슬라이딩 윈도우 형태로 유지하여 용량 최적화).

#### [NEW] `.github/workflows/notify.yml`
- 30분 주기 크론 탭으로 작동하며, 스크립트 실행 후 변경된 `last_processed_ids.json`을 저장소에 커밋/푸시하는 GitHub Actions 워크플로우.

---

## Verification Plan

### Automated Tests
- `vitest`를 도입하여 디스코드 메시지 포맷 생성 함수, 중복 제거 필터 함수 등의 단위 테스트 코드를 작성하고 실행합니다.
  - 실행 명령어: `npm run test`

### Manual Verification
- 테스트용 디스코드 서버에 Webhook URL을 생성하여 로컬 환경에서 테스트 메시지가 깔끔하게 오는지 Visual Verification을 수행합니다.
- `last_processed_ids.json` 상태 저장이 제대로 동작해 연속 실행 시 중복 알림이 발생하지 않는지 확인합니다.
