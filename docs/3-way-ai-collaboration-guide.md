# 🤝 3-Way AI 협업 가이드 - Claude + Gemini + Codex

> Last Updated: 2025-02-08 (Asia/Seoul)

## 📋 개요

OpenManager VIBE v5 프로젝트는 세 가지 AI 개발 도구를 전략적으로 활용하는 3-way AI 협업 체계를 구축했습니다.

### 🤖 AI 도구 현황

| AI 도구         | 모델           | 컨텍스트 | 비용               | 특화 영역               |
| --------------- | -------------- | -------- | ------------------ | ----------------------- |
| **Claude Code** | Opus 4.1       | 200K     | $200/월 (Max 20x)  | 프로젝트 통합, MCP 서버 |
| **Gemini CLI**  | Gemini 2.5 Pro | 1M       | 무료 (1000/일)     | 대규모 리팩토링         |
| **Codex CLI**   | GPT-5          | 128K     | Plus 구독 ($20/월) | 고급 알고리즘           |

## 🎯 도구별 핵심 역량

### Claude Code (메인 개발 실행)

- **강점**: 프로젝트 전체 인식, MCP 서버 11개 연동, 지속적 컨텍스트 유지
- **역할**: **개발의 실행자**, 프로젝트 구현, 통합, 배포 관리
- **활용**: 일상적인 개발, 버그 수정, 문서 작성, 실제 코드 작성

### Gemini CLI (제3의 시선 - 프로젝트 리뷰어)

- **강점**: 1M 토큰으로 전체 프로젝트 조망, 객관적 분석, 패턴 발견
- **역할**: **외부 검토자 관점**, 프로젝트 전체 아키텍처 리뷰, 개선점 제안
- **활용**: "Gemini로 우리 프로젝트 전체적으로 검토해줘", "현재 방향성이 맞는지 평가해줘"

### Codex CLI (제3의 시선 - 기술 컨설턴트)

- **강점**: GPT-5의 깊은 추론 능력, 복잡한 문제 통찰, 최적 설계 제안
- **역할**: **전문가 컨설턴트**, 아키텍처 자문, 기술적 방향성 제시
- **활용**: "Codex로 이 설계가 장기적으로 맞는지 봐줘", "더 나은 접근법 있는지 조언해줘""Codex로 이 알고리즘 최적화해줘" 같은 명시적 요청 시

## 🔄 협업 패턴 (사용자 요청 기반)

### 패턴 1: 사용자 요청 시 병렬 작업

```bash
# Claude Code가 메인으로 개발 진행 중...
# 사용자: "이 부분 Codex로 알고리즘 최적화하고 Gemini로 전체 분석 동시에 해줘"

# Claude Code가 조율하여 병렬 실행:
# - Codex: 특정 알고리즘 최적화
# - Gemini: 전체 코드베이스 영향 분석
# - Claude: 두 결과 통합 및 적용
```

### 패턴 2: 대규모 분석 요청

```bash
# Claude Code가 일반적인 성능 개선 작업 중...
# 사용자: "Gemini로 전체 코드베이스 성능 분석하고 병목 찾아줘"

# Claude Code가 Gemini 활용:
gemini "Analyze entire codebase for performance bottlenecks"
# 결과를 받아서 Claude Code가 직접 수정 작업 진행
```

### 패턴 3: 복잡한 문제 해결 요청

```bash
# Claude Code가 마이그레이션 작업 중...
# 사용자: "이 부분은 복잡하니까 Codex로 최적 전략 짜줘"

# Claude Code가 Codex 활용:
codex "Design optimal migration strategy with minimal downtime"
# Codex의 전략을 받아서 Claude Code가 구현
```

## 📊 작업 방식 비교

| 작업 상황                | Claude Code (메인)        | Gemini/Codex (요청 시)     |
| ----------------------- | ------------------------- | -------------------------- |
| **일반 개발**           | ✅ 모든 작업 직접 수행     | 사용자 요청 시만 활성화     |
| **복잡한 알고리즘**     | ✅ 직접 구현 가능         | "Codex로 해줘" 요청 시 활용 |
| **대규모 분석**         | ✅ 프로젝트 범위 내 처리   | "Gemini로 전체 분석" 요청 시 |
| **버그 수정**           | ✅ 즉시 해결              | 필요 없음                   |
| **리팩토링**            | ✅ 점진적 진행            | "Gemini로 전체 리팩토링" 시  |
| **문서 작성**           | ✅ MCP 도구로 완벽 처리    | 필요 없음                   |
| **병렬 작업 필요 시**    | ✅ 조율 및 통합 담당       | 사용자 지정 작업 병렬 수행   |

## 💾 Memory MCP를 통한 지식 공유

### 정보 저장 체계

```typescript
// Codex 분석 결과 저장
await mcp__memory__create_entities({
  entities: [
    {
      name: 'Codex_Algorithm_Optimization_2025-02-08',
      entityType: 'CodexAnalysis',
      observations: [
        'Algorithm: Distributed rate limiting',
        'Complexity: O(1) amortized',
        'Implementation: Redis + sliding window',
        'Performance: 100K ops/sec',
      ],
    },
  ],
});

// Gemini 리팩토링 결과 저장
await mcp__memory__create_entities({
  entities: [
    {
      name: 'Gemini_Refactoring_2025-02-08',
      entityType: 'GeminiImplementation',
      observations: [
        'Scope: 847 files modified',
        'Migration: REST to GraphQL',
        'Test coverage: 92%',
        'Breaking changes: 3',
      ],
    },
  ],
});
```

## 🚀 실전 시나리오

### 시나리오 1: Claude Code 단독 개발 (기본)

```bash
# Claude Code가 처음부터 끝까지 모든 작업 수행
# - 실시간 채팅 시스템 설계
# - WebSocket 서버 구현
# - React 클라이언트 개발
# - 테스트 작성 및 배포

# 전체 프로젝트를 Claude Code가 완성
```

### 시나리오 2: 사용자 요청 시 병렬 처리

```bash
# Claude Code가 ML 파이프라인 개발 중...
# 사용자: "Codex로 알고리즘 최적화하면서 Gemini로 데이터 파이프라인 분석 동시에"

# Claude Code가 병렬 조율:
# - Codex: ML 알고리즘 최적화
# - Gemini: 데이터 파이프라인 전체 분석
# - Claude: 두 결과 통합하여 최종 구현
```

## 📈 효율성 지표

### Claude Code 중심 개발의 장점

- **일관성**: 단일 도구로 전체 프로젝트 관리
- **효율성**: 컨텍스트 스위칭 없음
- **병렬 처리**: 사용자 요청 시 다른 도구와 병렬 작업으로 2-3x 속도 향상
- **유연성**: 필요할 때만 다른 도구 활용

### 비용 효율성

- **Claude Code**: $200/월 (Max 20x 구독)
- **Gemini CLI**: $0 (무료 티어)
- **Codex CLI**: $20/월 (Plus 구독)
- **총 비용**: $220/월로 엔터프라이즈급 성능

## 🔧 환경 설정

### WSL 터미널 설정

```bash
# Gemini CLI 설치
npx gemini-cli
# 또는
brew install google-gemini/tap/gemini-cli

# Codex CLI 설치 (Plus 구독 필요)
# ChatGPT Plus 계정으로 인증 후
codex --setup

# Claude Code는 이미 설치됨
claude --version
```

### 서브에이전트 활성화

```typescript
// Claude Code에서 호출
Task({
  subagent_type: 'gemini-cli-collaborator',
  prompt: '전체 프로젝트 리팩토링',
});

Task({
  subagent_type: 'codex-cli-partner',
  prompt: '알고리즘 최적화',
});
```

## 💡 베스트 프랙티스

### DO ✅

- **Claude Code로 모든 개발 메인 진행**
- **사용자가 명시적으로 요청할 때만 다른 도구 활용**
- **병렬 작업이 필요한 경우 사용자에게 제안**
- **Memory MCP로 협업 시 결과 공유**

### DON'T ❌

- **자동으로 다른 도구에 작업 분배하지 않기**
- **사용자 요청 없이 Gemini/Codex 호출하지 않기**
- **단순 작업을 복잡하게 나누지 않기**
- **Claude Code가 할 수 있는 작업을 굳이 다른 도구에 맡기지 않기**

## 📚 관련 문서

- [Gemini CLI 설정 가이드](/docs/gemini-cli-wsl-setup-guide.md)
- [서브에이전트 매핑 가이드](/docs/sub-agents-mcp-mapping-guide.md)
- [MCP 서버 완전 가이드](/docs/mcp-servers-complete-guide.md)
- [CLAUDE.md - 프로젝트 지침](/CLAUDE.md#💰-claude--gemini--codex-3-way-ai-협업-전략)

## 🎯 결론

Claude Code 중심의 유연한 협업 체계:

- **메인 개발**: Claude Code가 모든 작업 주도
- **보조 도구**: 사용자 요청 시 Gemini/Codex 활용
- **병렬 처리**: 복잡한 작업 시 2-3x 속도 향상
- **비용 효율**: 필요할 때만 활용하여 비용 최적화

이 체계를 통해 엔터프라이즈급 개발 생산성을 달성할 수 있습니다.
