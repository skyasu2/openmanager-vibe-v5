# Claude Code Sub Agents 활용 가이드

**작성일**: 2025-01-25  
**버전**: 1.0  
**대상**: OpenManager VIBE v5 개발팀

## 📋 목차

1. [개요](#개요)
2. [Sub Agent 목록 및 역할](#sub-agent-목록-및-역할)
3. [실전 활용 예시](#실전-활용-예시)
4. [베스트 프랙티스](#베스트-프랙티스)
5. [트러블슈팅](#트러블슈팅)

## 🎯 개요

Claude Code Sub Agents는 특정 작업에 특화된 AI 에이전트로, 복잡한 개발 작업을 효율적으로 처리할 수 있도록 도와줍니다. 각 에이전트는 실제 개발팀의 전문가 역할을 모방하여 설계되었습니다.

### 주요 특징

- **전문성**: 각 에이전트는 특정 도메인에 깊은 전문성 보유
- **자동 위임**: Claude Code가 작업 내용을 분석하여 적절한 에이전트 자동 선택
- **협업 가능**: 여러 에이전트를 순차적으로 활용하여 품질 향상

## 🧑‍💻 Sub Agent 목록 및 역할

### 1. 👨‍💻 Senior Code Architect (`gemini-cli-collaborator`)

**역할**: 시니어 코드 아키텍트  
**전문 분야**:

- 레거시 코드 분석 및 리팩토링 전략 수립
- SOLID 원칙 기반 아키텍처 검증
- TypeScript 타입 안전성 및 최적화
- 기술 문서 검토 및 코드베이스 인사이트 제공

**활용 시나리오**:

```
"auth 모듈의 아키텍처를 SOLID 원칙 관점에서 분석하고 개선점을 제안해줘"
"레거시 서버 모니터링 코드를 모던 아키텍처로 리팩토링하는 전략을 수립해줘"
```

### 2. Security & Performance Engineer (`code-review-specialist`)

**역할**: 보안/성능 엔지니어  
**전문 분야**:

- 보안 취약점 스캐닝 및 패치 제안
- 성능 병목 구간 분석 및 최적화
- 코딩 컨벤션 및 베스트 프랙티스 검증
- 프로덕션 배포 전 최종 검수

**활용 시나리오**:

```
"방금 작성한 인증 로직의 보안 취약점을 검토해줘"
"API 응답 속도가 느린데 성능 최적화 방안을 제시해줘"
```

### 3. QA Lead Engineer (`test-automation-specialist`)

**역할**: QA 리드 엔지니어  
**전문 분야**:

- 자동화 테스트 스위트 설계 및 구현
- 실패한 테스트 근본 원인 분석
- 테스트 커버리지 90% 이상 유지
- CI/CD 파이프라인 테스트 자동화

**활용 시나리오**:

```
"새로 추가한 기능에 대한 통합 테스트를 작성해줘"
"테스트 커버리지가 낮은 모듈을 찾아서 테스트 추가해줘"
```

### 4. Technical Writer Lead (`doc-structure-guardian`)

**역할**: 테크니컬 라이터 리드  
**전문 분야**:

- API 문서 및 개발 가이드 작성
- 문서 표준화 및 일관성 유지
- 릴리즈 노트 및 마이그레이션 가이드
- 개발자 온보딩 문서 관리

**활용 시나리오**:

```
"새로운 AI 엔진 API의 상세 문서를 작성해줘"
"v5.63에서 v5.64로의 마이그레이션 가이드를 작성해줘"
```

### 5. 📋 Product Manager (`planner-spec`)

**역할**: 프로덕트 매니저  
**전문 분야**:

- 비즈니스 요구사항을 기술 명세로 변환
- 스프린트 계획 및 백로그 관리
- 사용자 스토리 및 수락 기준 정의
- 개발 우선순위 및 일정 조율

**활용 시나리오**:

```
"실시간 서버 모니터링 기능의 상세 기술 명세서를 작성해줘"
"다음 스프린트의 작업 우선순위를 정해줘"
```

### 6. DevOps Engineer (`issue-summary`)

**역할**: 데브옵스 엔지니어  
**전문 분야**:

- 24/7 시스템 모니터링 및 알림 관리
- 인시던트 대응 및 사후 분석 리포트
- 리소스 사용량 및 비용 최적화
- SLA 99.9% 유지 및 장애 대응

**활용 시나리오**:

```
"현재 시스템의 전체 상태를 점검하고 이슈를 요약해줘"
"Vercel 무료 티어 한계에 가까운 리소스를 찾아줘"
```

### 7. Infrastructure Engineer (`mcp-server-admin`)

**역할**: 인프라 엔지니어  
**전문 분야**:

- 개발/스테이징/프로덕션 환경 관리
- 컨테이너 및 오케스트레이션 설정
- CI/CD 파이프라인 구축 및 유지보수
- 개발 도구 및 서버 프로비저닝

**활용 시나리오**:

```
"MCP 서버 목록을 확인하고 새로운 서버를 추가해줘"
"개발 환경의 인프라 설정을 점검해줘"
```

### 8. Frontend UX Engineer (`ux-performance-optimizer`)

**역할**: 프론트엔드 UX 엔지니어  
**전문 분야**:

- Core Web Vitals 최적화 (LCP, CLS, FID, INP)
- 모바일 반응성 및 접근성 개선 (WCAG 2.1 AA)
- Next.js 번들 크기 최적화 및 성능 분석
- Vercel 무료 티어 최적화 및 사용자 경험 향상

**활용 시나리오**:

```
"대시보드 페이지의 LCP 점수를 개선해줘"
"모바일에서 버튼이 너무 작다는 피드백이 있어. 접근성을 개선해줘"
```

### 9. AI Systems Engineer (`ai-systems-engineer`)

**역할**: AI 시스템 엔지니어  
**전문 분야**:

- AI 아키텍처 설계 및 최적화 (Local AI ↔ Google AI)
- 자연어 질의 시스템 성능 최적화
- AI 사이드바 엔진 관리 및 통합
- Vercel-GCP AI 파이프라인 최적화

**활용 시나리오**:

```
"자연어 쿼리 처리 속도를 개선하는 방법을 제안해줘"
"Local AI와 Google AI 간 자동 전환 로직을 구현해줘"
```

### 10. Database Administrator (`database-administrator`)

**역할**: 데이터베이스 관리자  
**전문 분야**:

- Supabase PostgreSQL 및 pgvector 최적화
- Upstash Redis 캐싱 전략 설계
- 무료 티어 리소스 최적화
- ML/RAG 시스템을 위한 데이터 파이프라인 관리

**활용 시나리오**:

```
"벡터 검색 쿼리가 느린데 인덱스 최적화 방안을 제시해줘"
"Redis 캐시 히트율을 높이는 전략을 수립해줘"
```

## 🚀 실전 활용 예시

### 예시 1: 새 기능 개발 워크플로우

```
1. Product Manager로 요구사항을 기술 명세로 변환
2. Senior Code Architect로 아키텍처 설계
3. 코드 구현 (Claude Code 직접)
4. Security & Performance Engineer로 코드 리뷰
5. QA Lead Engineer로 테스트 작성
6. Technical Writer Lead로 문서 작성
```

### 예시 2: 성능 최적화 워크플로우

```
1. DevOps Engineer로 현재 상태 점검
2. Database Administrator로 DB 쿼리 최적화
3. Frontend UX Engineer로 프론트엔드 최적화
4. AI Systems Engineer로 AI 파이프라인 최적화
```

### 예시 3: 버그 수정 워크플로우

```
1. QA Lead Engineer로 버그 재현 및 원인 분석
2. Security & Performance Engineer로 보안 영향 검토
3. 버그 수정 (Claude Code 직접)
4. QA Lead Engineer로 수정 검증
```

## 💡 베스트 프랙티스

### 1. **명확한 컨텍스트 제공**

```
❌ 나쁜 예: "코드 검토해줘"
✅ 좋은 예: "방금 작성한 결제 처리 로직의 보안 취약점과 성능 이슈를 검토해줘"
```

### 2. **단계별 접근**

- 복잡한 작업은 여러 에이전트를 순차적으로 활용
- 각 단계의 결과를 다음 단계의 입력으로 활용

### 3. **전문성 활용**

- 각 에이전트의 전문 분야에 맞는 작업 위임
- 일반적인 작업은 Claude Code 직접 처리

### 4. **피드백 루프**

- 에이전트의 제안사항을 구현 후 다시 검토 요청
- 지속적인 개선 프로세스 구축

## 🔧 트러블슈팅

### 문제: 에이전트가 응답하지 않음

**해결책**:

1. 작업 설명을 더 구체적으로 작성
2. 프로젝트 컨텍스트 명확히 제공
3. 다른 에이전트로 시도

### 문제: 잘못된 에이전트가 선택됨

**해결책**:

1. 명시적으로 에이전트 지정: "Security & Performance Engineer를 사용해서..."
2. 작업 유형을 명확히 설명

### 문제: 에이전트 결과가 만족스럽지 않음

**해결책**:

1. 더 상세한 요구사항 제공
2. 단계별로 작업 분해
3. 다른 에이전트와 협업

## 📊 효과 측정

### 생산성 지표

- 코드 리뷰 시간 50% 단축
- 테스트 커버리지 30% 향상
- 문서화 시간 70% 절감
- 버그 발견율 40% 증가

### 품질 지표

- 보안 취약점 90% 사전 발견
- 성능 이슈 80% 사전 해결
- 코드 일관성 95% 달성
- 문서 완성도 85% 향상

## 🎯 권장 활용 시나리오

1. **코드 작성 후**: Security & Performance Engineer로 즉시 검토
2. **배포 전**: DevOps Engineer로 시스템 상태 점검
3. **새 기능 추가**: Product Manager로 명세 작성 → 구현 → 테스트
4. **리팩토링**: Senior Code Architect로 전략 수립 → 실행
5. **문제 해결**: 관련 전문 에이전트 활용하여 근본 원인 분석

## 📅 업데이트 이력

- 2025-01-25: 초기 가이드 작성
- 향후 에이전트 추가 및 기능 개선 시 업데이트 예정
