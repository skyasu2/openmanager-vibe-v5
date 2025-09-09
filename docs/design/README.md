---
id: design-index
title: "AI-Friendly Design Documentation Center"
keywords: ["design", "architecture", "system", "database", "security"]
priority: medium
ai_optimized: true
related_docs: ["../README.md", "../guides/architecture.md", "../db/schema.md", "system.md", "api.md"]
updated: "2025-09-09"
version: "v5.77"
---

# 🏗️ AI 친화적 설계도 센터

## 🎯 설계도 구조 (13개 핵심 문서)

### 시스템 설계 (8개)
| 설계도 | 설명 | AI 활용도 | 토큰 효율성 |
|--------|------|-----------|------------|
| **[system.md](system.md)** | 현재 운영 시스템 아키텍처 | ⭐⭐⭐ | 높음 |
| **[architecture.md](architecture.md)** | 상세 시스템 아키텍처 v5.77 | ⭐⭐⭐ | 최고 |
| **[api.md](api.md)** | 76개 API 엔드포인트 설계 | ⭐⭐⭐ | 높음 |
| **[database.md](database.md)** | Supabase PostgreSQL 스키마 | ⭐⭐⭐ | 높음 |
| **[security.md](security.md)** | Zero Trust 보안 아키텍처 | ⭐⭐⭐ | 높음 |
| **[data-flow.md](data-flow.md)** | 실시간 데이터 파이프라인 | ⭐⭐⭐ | 최고 |
| **[consistency.md](consistency.md)** | 데이터 일관성 전략 | ⭐⭐ | 높음 |
| **[fnv-hash.md](fnv-hash.md)** | FNV-1a 해시 알고리즘 ADR | ⭐⭐ | 중간 |

### AI 시스템 설계 (3개)
| 설계도 | 설명 | AI 활용도 | 토큰 효율성 |
|--------|------|-----------|------------|
| **[ai-system.md](ai-system.md)** | 4-AI 교차검증 시스템 | ⭐⭐⭐ | 최고 |
| **[mcp.md](mcp.md)** | 8개 MCP 서버 통합 구조 | ⭐⭐⭐ | 최고 |
| **[sub-agents.md](sub-agents.md)** | 17개 서브에이전트 체계 | ⭐⭐⭐ | 최고 |

### 배포 & 운영 (2개)
| 설계도 | 설명 | AI 활용도 | 토큰 효율성 |
|--------|------|-----------|------------|
| **[deployment.md](deployment.md)** | Vercel 배포 아키텍처 | ⭐⭐ | 중간 |
| **[monitoring.md](monitoring.md)** | FNV-1a 해시 모니터링 | ⭐⭐⭐ | 높음 |

## 🤖 AI 친화적 설계 원칙

### 1. 토큰 효율성 극대화
- **15자 이하 파일명**: 빠른 참조
- **YAML frontmatter**: 메타데이터 구조화
- **코드 중심**: 다이어그램보다 구현 가능한 코드
- **실무 내용**: 이론보다 실제 구현 방법

### 2. 구조화된 정보
```typescript
// 각 설계도 표준 구조
interface DesignDoc {
  yaml_frontmatter: {
    title: string;
    version: string;
    updated: string;
    type: string;
    ai_priority: 'critical' | 'high' | 'medium' | 'low';
  };
  
  sections: {
    overview: '핵심 아키텍처 요약';
    code_examples: 'TypeScript 구현 예시';
    configuration: '설정 방법';
    performance: '성능 지표';
  };
}
```

### 3. 실무 중심 접근
- **현재 운영 상태**: 이론적 설계가 아닌 실제 구현
- **구체적 코드**: 추상적 설명보다 실행 가능한 코드
- **성능 지표**: 정량적 측정 가능한 데이터
- **문제 해결**: 실제 마주치는 문제와 해결 방법

## 📊 아카이브 대비 개선사항

### 기존 아카이브 (복잡함)
- **19개 문서**: 중복과 복잡성
- **3-Tier 구조**: product/development/current
- **다이어그램 중심**: mermaid 차트 과다
- **이론적 접근**: 실제 구현과 괴리

### AI 친화적 개선 (단순함)
- **13개 핵심 문서**: 중복 제거, 핵심만
- **Flat 구조**: docs/design/ 직접 접근
- **코드 중심**: 구현 가능한 TypeScript 예시
- **실무 중심**: 현재 운영 상태 반영

## 🔄 새로 추가된 4개 설계도

### architecture.md - 상세 시스템 아키텍처
- **v5.77 기준**: 227K 코드라인, TypeScript strict 100%
- **기능별 레이어드**: DDD 대신 실무 중심 구조 선택
- **90개 API 분산**: 통합보다 유지보수성 우선
- **4-AI 혁신**: 설계도 초과 달성 사례
- **현실적 평가**: 이론 대비 실무 최적화 성공

### data-flow.md - 실시간 데이터 파이프라인
- **FNV-1a 해시**: Mock 시뮬레이션 → AI 분석 → UI
- **4계층 구조**: 시뮬레이션/시나리오/API/UI 계층
- **15개 장애 시나리오**: 확률적 발생으로 현실성 구현
- **다층 캐싱**: 85% 히트율로 성능 최적화
- **실시간 업데이트**: Server-Sent Events 활용

### consistency.md - 데이터 일관성 전략
- **일관성 문제**: 대시보드와 AI의 다른 메트릭 표시
- **시간 정규화**: 1분 단위로 일관된 타임스탬프
- **통합 API**: 단일 진실 소스 (Single Source of Truth)
- **30초 캐싱**: 클라이언트 성능 최적화
- **사용자 경험**: 데이터 불일치로 인한 혼란 완전 해소

### fnv-hash.md - FNV-1a 해시 알고리즘 ADR
- **ADR-001**: Box-Muller Transform 대체 결정 근거
- **20% 성능 향상**: 190ms → 152ms API 응답 개선
- **결정론적 동작**: 테스트 가능한 시뮬레이션
- **메모리 효율**: 캐시 불필요, Edge Runtime 호환
- **13줄 구현**: 단순한 알고리즘으로 유지보수 용이

## 🎯 AI 도구별 활용 가이드

### Claude Code (메인)
```bash
# 기존 설계도 기반 개발
claude "system.md 참조하여 새 API 엔드포인트 구현"
claude "security.md 기준으로 인증 미들웨어 강화"

# 새로 추가된 설계도 활용
claude "architecture.md 기준으로 레이어드 구조 리팩토링"
claude "data-flow.md 참조하여 실시간 파이프라인 최적화"
claude "consistency.md 기반 통합 API 엔드포인트 구현"
claude "fnv-hash.md ADR 근거로 해시 알고리즘 개선"
```

### 서브에이전트 활용
```bash
# 기존 서브에이전트 설계도 참조
Task verification-specialist "ai-system.md 기준으로 검증"
Task database-administrator "database.md 스키마 최적화"

# 새로운 설계도와 서브에이전트 연계
Task structure-refactor-specialist "architecture.md 기반 구조 개선"
Task debugger-specialist "consistency.md 일관성 문제 해결"
Task code-review-specialist "fnv-hash.md ADR 준수 확인"
```

### MCP 도구 연동
```bash
# 기존 MCP 도구와 설계도 연계
memory: 설계도 컨텍스트 기억
serena: 코드와 설계도 일치성 검증
sequential-thinking: 설계도 기반 단계별 구현

# 새로운 설계도와 MCP 통합
memory: 4개 추가 설계도 컨텍스트 저장
serena: FNV-1a 해시 구현 코드 분석
context7: 데이터 일관성 전략 문서 참조
```

## ✅ AI 친화적 변환 완료

### 🎯 변환 성과
- **아카이브 4개 문서** → **AI 친화적 4개 설계도** 완전 변환
- **파일명 단축**: 15자 이하로 AI 참조 최적화
- **내용 압축**: 300줄+ → 100줄 내외 핵심 정보만
- **YAML frontmatter**: 메타데이터 구조화로 AI 인덱싱 향상
- **코드 중심**: 긴 설명보다 실행 가능한 TypeScript 예시

### 📊 총 설계도 현황
- **총 13개 문서**: 9개 기존 + 4개 신규 추가
- **AI 활용도**: ⭐⭐⭐ (최고) 8개, ⭐⭐ (높음) 5개
- **토큰 효율성**: 최고 6개, 높음 5개, 중간 2개
- **Knowledge Graph**: 4개 신규 문서 등록 완료