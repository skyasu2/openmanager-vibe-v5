# CLAUDE.md 축소 전후 비교 분석 보고서

## 📋 요약

CLAUDE.md 파일이 779줄에서 110줄로 축소(86% 감소) 후 162줄로 다시 개선되었습니다. 축소 과정에서 놓친 중요한 내용들을 분석합니다.

## 🔍 놓친 주요 내용

### 1. ⚡ 성능 관련 정보

#### 메모리 관리

```bash
# 개발 환경
--max-old-space-size=8192  # 8GB

# 프로덕션
--max-old-space-size=4096  # 4GB
```

#### 성능 최적화 전략

- Edge Runtime 활용
- 캐싱 전략 구현
- Vercel 무료 티어 최적화

### 2. 📊 Claude Code 사용량 모니터링

```bash
npx ccusage@latest blocks --live    # 실시간 대시보드
npm run ccusage:daily               # 일별 사용량
```

### 3. 🤖 서브 에이전트 실전 활용법

#### 효과적인 프롬프트 작성

```typescript
// ✅ 좋은 예시
Task(
  subagent_type="database-administrator",
  prompt="""Supabase 데이터베이스를 최적화해주세요:

  1. mcp__supabase__list_tables로 테이블 목록 조회
  2. 각 테이블별 사용량 분석
  3. 느린 쿼리 식별 및 인덱스 제안
  4. mcp__supabase__apply_migration으로 최적화 적용

  결과물: SQL 스크립트 + 성능 분석 리포트"""
)

// ❌ 나쁜 예시
Task(
  subagent_type="database-administrator",
  prompt="DB 최적화 해줘"
)
```

#### 병렬 처리 활용

```typescript
// 3개 에이전트 동시 실행으로 시간 단축
Task(subagent_type="issue-summary", ...)     // 문제 분석
Task(subagent_type="ai-systems-engineer", ...)  // AI 최적화
Task(subagent_type="ux-performance-optimizer", ...)  // UI 개선
```

### 4. 📝 개발 가이드라인 상세

- **사고 모드**: "think hard" 항상 활성화
- **코드 재사용**: `@codebase` 활용으로 기존 코드 우선 사용
- **아키텍처**: DDD 도메인 모듈 구조 (`src/domains/`)
- **프로젝트 현황**:
  - 코드 품질: 475개 → 400개 문제 (15.8% 개선)
  - Critical 에러: 40개 → 1개 (99% 해결)

### 5. 🔧 상세 트러블슈팅

#### 파일 읽기/쓰기 에러

```
Error: File has not been read yet. Read it first before writing to it
```

- 원인: Claude Code는 기존 파일 수정 시 반드시 Read 도구로 먼저 읽어야 함
- 해결: Write/Edit 전에 항상 Read 도구 사용
- 주의: Task 도구나 서브 에이전트도 동일한 규칙 적용

#### 메모리 에러

- package.json의 Node.js 메모리 제한 확인
- 개발/프로덕션 환경별 메모리 설정 조정

#### AI 타임아웃

- API 키와 네트워크 연결 확인
- 폴백 전략 활용

### 6. 📊 Sub Agents 추가 정보

#### central-supervisor 특별 권한

- 유일하게 tools 필드 없음
- 모든 도구 자동 상속
- 복잡한 작업의 메인 오케스트레이터

#### MCP 도구 접근 패턴

- tools 필드에 `mcp__*` 형식 명시 가능
- 기본 도구와 MCP 도구 혼용 가능

### 7. 🎯 주요 명령어 추가

```bash
# 모니터링
npm run ccusage:live     # Claude 사용량 실시간
npm run health-check     # API 상태 확인

# 테스트
npm run test:coverage    # 커버리지 (목표: 70%+)
```

## 💡 권장사항

### 꼭 추가해야 할 내용 (우선순위 높음)

1. **Claude Code 사용량 모니터링 명령어**
2. **메모리 관리 설정**
3. **서브 에이전트 효과적인 프롬프트 예시**
4. **파일 읽기/쓰기 에러 트러블슈팅**

### 선택적 추가 내용 (우선순위 중간)

1. **병렬 처리 활용 예시**
2. **central-supervisor 특별 권한 설명**
3. **프로젝트 현황 통계**

### 현재 유지해도 좋은 결정

1. **간결성 유지** - 162줄은 적절한 길이
2. **핵심 정보 위주** - 실용적인 내용 중심
3. **구조화된 정보** - 섹션별로 잘 정리됨

## 📌 결론

현재 CLAUDE.md는 많이 개선되었지만, 다음 4가지는 꼭 추가하는 것이 좋습니다:

1. Claude Code 사용량 모니터링 (2줄)
2. 메모리 관리 설정 (4줄)
3. 효과적인 프롬프트 예시 (10줄)
4. 파일 읽기/쓰기 트러블슈팅 (5줄)

예상 최종 크기: 162줄 → 180-185줄 (여전히 간결함 유지)

---

작성일: 2025-07-28
작성자: Claude Code
