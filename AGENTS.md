# Agent Instructions & Project Architecture

본 리포지터리(`gunners-discord-notifier`)는 해외의 공신력 있는 아스날 FC 소식을 수집하여 디스코드 채널로 실시간 알림을 발송하는 경량 배치 애플리케이션입니다. 

에이전트는 작업 시 본 문서의 기술 스택, 규칙 및 설계 원칙을 반드시 준수해야 합니다.

---

## 1. Directory Structure

```text
gunners-discord-notifier/
├── .github/
│   └── workflows/
│       └── notify.yml         # GitHub Actions 크론 워크플로우 (30분 주기)
├── data/
│   └── last_processed_ids.json # 중복 전송 방지용 상태 관리 파일 (최근 전송 URL 보관)
├── plans/
│   └── 2026-06-20-implementation-plan.md # 마일스톤 및 구현 계획서
├── src/
│   ├── scraper/
│   │   ├── reddit.ts          # Reddit r/Gunners API 수집 파트
│   │   └── rss.ts             # 트위터/뉴스 RSS 피드 수집 파트
│   ├── discord.ts             # Discord Webhook 알림 전송 모듈
│   ├── types.ts               # 공통 타입 선언
│   └── index.ts               # 수집 및 중복 필터 조율 (Main Entrypoint)
├── test/                      # 테스트 코드 폴더
├── TSCONFIG.json              # TypeScript 설정
├── package.json               # 의존성 및 스크립트 정의
└── AGENTS.md                  # 본 에이전트 협업 지침 파일
```

---

## 2. Agent Collaboration Rules (행동 수칙)

1. **바이브 코딩 금지 (No Vibe Coding)**:
   * 파일의 내부 구조와 실제 API 응답 형식을 철저히 파악하고 구현에 들어갑니다. 의존성 버전을 짐작하거나 불분명한 타이핑을 하지 않습니다.
2. **인지 및 의도 부채 최소화 (Minimize Debt)**:
   * 단순 복사 붙여넣기로 기능을 채워 넣는 방식을 경계합니다. 작성되는 모든 헬퍼와 모듈은 '왜 이렇게 작성되었는지' 설명할 수 있는 코드 가독성과 주석을 유지합니다.
3. **스캐폴딩 지향 (Scaffolding First)**:
   * 핵심 알림 전송 및 중복 제거 유닛 로직은 `vitest`를 사용해 단위 테스트를 동반하여 작성합니다. 테스트가 통과하는지 자체 검증한 후 완료를 보고합니다.
4. **Git 위생 준수 (Clean Git State)**:
   * `.env` 설정값이나 임시 생성된 파일이 커밋 대상에 포함되지 않도록 `.gitignore`를 정교하게 유지합니다. 개인 환경이나 툴 설정은 로컬 설정을 적극 권장합니다.

---

## 3. Tech Stack & Implementation Details

* **Runtime**: Node.js (v18+ LTS)
* **Language**: TypeScript
* **State Management**: 데이터베이스 호스팅 비용을 절감하기 위해, 이미 전송 완료한 포스트의 URL 목록을 `data/last_processed_ids.json` 파일에 저장합니다. 파일 크기가 무한히 커지는 것을 방지하기 위해 최근 100~200개의 URL만 유지하는 슬라이딩 윈도우 방식으로 최적화합니다.
* **API Limits / Avoidance**: Reddit API 호출 시 에러 처리를 꼼꼼하게 처리하여, 레이트 리밋(Rate Limit) 도달 시 동작이 자연스럽게 우회되도록 설계합니다.
