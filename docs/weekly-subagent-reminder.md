# 📅 주간 서브에이전트 체크리스트

**목적**: 서브에이전트 정기 활용으로 코드 품질 및 시스템 안정성 유지
**참조**: [서브에이전트 완전 가이드](ai/subagents-complete-guide.md)

---

## 🌅 월요일 - 주간 시작

### 개발 환경 점검

```bash
# 1. AI 도구 헬스 체크 (dev-environment-manager)
Task dev-environment-manager "AI CLI 도구 상태 확인 및 최신 버전 체크"

# 예상 결과:
# - Codex v0.58.0, Gemini v0.15.0, Qwen v0.2.1 버전 확인
# - Wrapper 스크립트 v2.5.0 정상 작동 검증
# - OAuth 인증 상태 확인
```

### MCP 서버 상태 확인

```bash
# 2. MCP 연결 상태 (수동 또는 dev-environment-manager)
claude mcp list

# 또는
./scripts/mcp-health-check.sh

# 목표: 9/9 완벽 연결 유지
```

**체크포인트**:
- [ ] AI CLI 도구 정상 작동 (Codex, Gemini, Qwen)
- [ ] MCP 서버 9/9 연결 확인
- [ ] Bash Wrapper 타임아웃 0건 확인

---

## 🔒 금요일 - 주간 마무리

### 보안 스캔

```bash
# 1. 주간 보안 검토 (security-specialist)
Task security-specialist "이번 주 커밋된 변경사항 보안 스캔"

# 검토 항목:
# - OWASP Top 10 취약점
# - 환경변수 노출 위험
# - 인증/인가 로직 변경
# - API 엔드포인트 보안
```

### 코드 품질 리포트

```bash
# 2. 주간 코드 리뷰 (code-review-specialist)
Task code-review-specialist "이번 주 커밋 품질 종합 리포트"

# 분석 항목:
# - TypeScript strict mode 준수
# - any 타입 사용 여부
# - 코드 복잡도
# - 테스트 커버리지
```

**체크포인트**:
- [ ] 보안 취약점 0건 확인
- [ ] 코드 품질 점수 9.0/10 이상 유지
- [ ] TypeScript 에러 0개 유지

---

## 🚀 배포 전 - 필수 체크리스트

### 종합 테스트 진단

```bash
# 1. 테스트 전체 상황 분석 (test-automation-specialist)
Task test-automation-specialist "배포 전 종합 테스트 진단"

# 자동 수행 항목:
# - Unit 테스트 실행 (639/719 통과율 확인)
# - E2E 테스트 실행 (29개, 99% 통과)
# - 실패 원인 자동 분류 (테스트 vs 코드 문제)
# - 보안/성능 스캔
```

### Vercel 배포 최적화

```bash
# 2. 배포 설정 검토 (vercel-platform-specialist)
Task vercel-platform-specialist "배포 최적화 및 환경변수 검증"

# 검토 항목:
# - 환경변수 누락 여부
# - 빌드 설정 최적화
# - Edge Functions 설정
# - 무료 티어 사용량 확인 (30% 유지)
```

**체크포인트**:
- [ ] 테스트 통과율 88% 이상
- [ ] Vercel 빌드 성공
- [ ] 환경변수 검증 완료
- [ ] 무료 티어 한도 안전

---

## 🎯 상황별 즉시 호출 가이드

### 긴급 상황

| 상황 | 즉시 호출 명령어 | 예상 효과 |
|------|-----------------|----------|
| 🐛 **프로덕션 버그** | `Task debugger-specialist "근본 원인 분석"` | 3-AI 교차검증으로 정확한 진단 |
| 🚨 **보안 이슈** | `Task security-specialist "긴급 보안 스캔"` | OWASP 취약점 즉시 탐지 |
| ⚡ **성능 저하** | `Task qwen-specialist "성능 병목 분석"` | 알고리즘 최적화 제안 |
| 🧪 **테스트 대량 실패** | `Task test-automation-specialist "실패 원인 진단"` | 테스트 vs 코드 문제 자동 분류 |

### 계획된 작업

| 작업 | 권장 서브에이전트 | 활용 시점 |
|------|-----------------|----------|
| 🏗️ **대규모 리팩토링** | structure-refactor-specialist | 10개 이상 파일 수정 전 |
| 💾 **DB 스키마 변경** | database-administrator | RLS 정책, 마이그레이션 전 |
| 🎨 **UI 개선** | ui-ux-specialist | 디자인 시스템 구축 시 |
| 📝 **문서화** | documentation-manager | 메모리 파일 최적화 시 |
| ☁️ **GCP 배포** | gcp-cloud-functions-specialist | Cloud Functions 설정 시 |

---

## 💡 활용 팁

### 1. 3-AI 교차검증 트리거

**명시적 키워드** (필수):
- ✅ "AI 교차검증"
- ✅ "3-AI 교차검증"
- ✅ "멀티 AI 검증"

**예시**:
```bash
Task multi-ai-verification-specialist "LoginClient.tsx AI 교차검증"
```

### 2. 서브에이전트 체이닝

**복잡한 작업 시 순차 호출**:
```bash
# 1단계: 보안 스캔
Task security-specialist "API 엔드포인트 보안 검토"

# 2단계: 코드 리뷰
Task code-review-specialist "보안 수정 사항 품질 검토"

# 3단계: 테스트 진단
Task test-automation-specialist "보안 패치 테스트 검증"
```

### 3. 정기 활용 목표

**월간 목표**:
- 서브에이전트 호출: **10-15건**
- Decision Log 품질: **9.0/10 이상**
- 자동화 비율: **40%** (Git Hook + Skills)

**현재 달성률 확인**:
```bash
./scripts/analyze-subagent-usage.sh
```

---

## 📊 월간 회고 (매월 말)

### 사용량 분석

```bash
# 월간 사용량 리포트 생성
./scripts/analyze-subagent-usage.sh

# ROI 평가
# - 고활용 (5회 이상): ?개
# - 중활용 (2-4회): ?개
# - 저활용 (1회): ?개
# - 미사용 (0회): ?개 ⚠️
```

### 개선 계획

**미사용 에이전트 검토**:
- 활용 시나리오 재검토
- 트리거 조건 완화
- 워크플로우 자동화 강화

---

## 🔗 관련 문서

- **[서브에이전트 완전 가이드](ai/subagents-complete-guide.md)** - 12개 에이전트 상세 정보
- **[Multi-AI 전략](claude/environment/multi-ai-strategy.md)** - 3-AI 교차검증 방법
- **[개선 방안](.claude/.memory/subagent-improvement-plan.md)** - Phase 1-3 실행 계획
- **[CLAUDE.md](../CLAUDE.md)** - 프로젝트 메모리 빠른 참조

---

**💡 핵심**: 정기적 활용으로 "잊혀진 도구"가 아닌 "자연스럽게 사용되는 도구"로 전환
