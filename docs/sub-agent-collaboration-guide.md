# 🤝 서브에이전트 협업 가이드

> agent-coordinator가 관리하는 서브에이전트 간 협업 패턴과 역할 분담

## 📊 에이전트 계층 구조

### 1. 메타 관리 계층

- **agent-coordinator**: 전체 에이전트 생태계 관리
- **central-supervisor**: 복잡한 작업의 오케스트레이션

### 2. 플랫폼 관리 계층

- **vercel-platform-specialist**: Vercel 플랫폼 아키텍처 전문 분석
- **mcp-server-admin**: MCP 인프라 전담
- **database-administrator**: Upstash Redis + Supabase 전담

### 3. 개발 지원 계층

- **ai-systems-engineer**: AI/ML 시스템 개발
- **backend-gcp-specialist**: GCP 백엔드 개발
- **ux-performance-optimizer**: 프론트엔드 성능

### 4. 품질 보증 계층

- **test-automation-specialist**: 테스트 작성 및 자동화
- **debugger-specialist**: 오류 분석 및 디버깅
- **code-review-specialist**: 코드 품질 검토
- **security-auditor**: 보안 검사

### 5. 문서화 계층

- **doc-writer-researcher**: 문서 내용 작성
- **doc-structure-guardian**: 문서 구조 관리

### 6. 워크플로우 계층

- **git-cicd-specialist**: Git/CI/CD 워크플로우
- **gemini-cli-collaborator**: AI 협업

## 🔄 협업 패턴

### 1. 계층적 위임 (Hierarchical Delegation)

```
사용자 요청
  ↓
agent-coordinator (에이전트 선택)
  ↓
central-supervisor (복잡한 작업 분해)
  ↓
[전문 에이전트들] (실제 작업 수행)
```

### 2. 피어 투 피어 협업 (Peer-to-Peer)

```
ai-systems-engineer ↔ backend-gcp-specialist
  (AI 백엔드 구현 시 협업)

doc-writer-researcher ↔ doc-structure-guardian
  (문서 작성과 구조 관리 협업)

test-automation-specialist ↔ debugger-specialist
  (테스트 실패 분석 시 협업)
```

### 3. 순차적 파이프라인 (Sequential Pipeline)

```
debugger-specialist (오류 분석)
  ↓
code-review-specialist (수정 코드 검토)
  ↓
test-automation-specialist (테스트 작성)
  ↓
git-cicd-specialist (배포)
```

### 4. 병렬 처리 (Parallel Processing)

```
동시 실행:
├─ vercel-platform-specialist (플랫폼 아키텍처 분석)
├─ database-administrator (DB 성능 분석)
└─ ux-performance-optimizer (프론트엔드 성능 분석)
```

## 🚫 역할 분리 원칙

### 명확한 책임 분리

#### ❌ 피해야 할 패턴

- vercel-platform-specialist가 MCP 서버 관리
- test-automation-specialist가 CI/CD 파이프라인 수정
- debugger-specialist가 테스트 작성

#### ✅ 올바른 패턴

- vercel-platform-specialist → MCP 이슈 발견 → mcp-server-admin에게 위임
- test-automation-specialist → CI/CD 실패 → git-cicd-specialist에게 위임
- debugger-specialist → 테스트 필요 → test-automation-specialist에게 요청

## 📋 일반적인 작업 플로우

### 1. 새 기능 개발

```
1. central-supervisor: 작업 분해
2. backend-gcp-specialist/ai-systems-engineer: 백엔드 구현
3. ux-performance-optimizer: 프론트엔드 구현
4. test-automation-specialist: 테스트 작성
5. code-review-specialist: 코드 리뷰
6. doc-writer-researcher: 문서 작성
7. git-cicd-specialist: 배포
```

### 2. 버그 수정

```
1. debugger-specialist: 오류 분석
2. 해당 도메인 전문가: 수정 구현
3. test-automation-specialist: 테스트 추가
4. code-review-specialist: 리뷰
5. git-cicd-specialist: 핫픽스 배포
```

### 3. 성능 최적화

```
병렬 실행:
- ux-performance-optimizer: 프론트엔드 분석
- database-administrator: DB 쿼리 최적화
- ai-systems-engineer: AI 응답 시간 개선
- vercel-platform-specialist: Edge Function 성능 엔지니어링
```

### 4. 문서 업데이트

```
1. doc-structure-guardian: 현재 구조 분석
2. doc-writer-researcher: 내용 작성/수정
3. doc-structure-guardian: 최종 구조 검증
```

## 🔧 충돌 해결 방법

### 1. 역할 중복 충돌

**문제**: 두 에이전트가 같은 작업 수행
**해결**: agent-coordinator가 명확한 책임 할당

### 2. 의견 충돌

**문제**: 에이전트 간 상반된 제안
**해결**: central-supervisor가 최종 결정

### 3. 리소스 경쟁

**문제**: 여러 에이전트가 동일 파일 수정
**해결**: 순차적 작업으로 전환

### 4. 의존성 교착

**문제**: A는 B를 기다리고, B는 A를 기다림
**해결**: agent-coordinator가 의존성 분석 후 재구성

## 📈 성능 모니터링

### agent-coordinator 명령어

```typescript
// 전체 시스템 상태 확인
Task({
  subagent_type: 'agent-coordinator',
  prompt: '모든 서브에이전트의 현재 상태와 활용도를 보고해주세요.',
});

// 중복 기능 분석
Task({
  subagent_type: 'agent-coordinator',
  prompt: '서브에이전트 간 기능 중복을 찾아 개선안을 제시해주세요.',
});

// 협업 패턴 최적화
Task({
  subagent_type: 'agent-coordinator',
  prompt: '최근 에이전트 간 협업 패턴을 분석하고 개선점을 찾아주세요.',
});
```

## 🎯 베스트 프랙티스

1. **단일 책임 원칙**: 각 에이전트는 하나의 명확한 책임만
2. **명시적 위임**: 다른 에이전트의 영역은 명시적으로 위임
3. **병렬 처리 활용**: 독립적인 작업은 동시 실행
4. **피드백 루프**: agent-coordinator를 통한 지속적 개선
5. **문서화**: 모든 협업 패턴과 의사결정 문서화

---

이 가이드는 agent-coordinator에 의해 지속적으로 업데이트됩니다.
