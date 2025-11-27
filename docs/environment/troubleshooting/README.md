---
category: troubleshooting
purpose: problem_solving_and_recovery_guides
ai_optimized: true
query_triggers:
  - '빌드 에러'
  - 'Claude 400 에러'
  - 'Playwright MCP 문제'
  - 'WSL 모니터링'
  - '시스템 복구'
  - 'Side Effects 분석'
  - '일반적인 문제'
related_docs:
  - 'docs/development/'
  - 'docs/claude/environment/'
  - 'docs/testing/'
  - 'scripts/'
last_updated: '2025-10-17'
---

# 🔧 트러블슈팅 가이드 (Troubleshooting)

**문제 해결 및 복구 가이드** - 실전 트러블슈팅 및 시스템 복구

---

## 📂 문서 목록 (8개)

### 🚨 긴급 복구 (2개)

**AI Query**: "시스템 복구", "긴급 상황"

1. **system-recovery-guide-2025.md** ⚠️ **최우선** - 2025 시스템 복구 가이드
   - 긴급 상황 대응 절차
   - 시스템 전체 복구 방법
   - 백업 및 롤백 전략

2. **playwright-mcp-recovery-guide.md** - Playwright MCP 복구 가이드
   - Playwright MCP 서버 복구
   - 브라우저 설정 복구
   - E2E 테스트 환경 재구축

---

### 🔍 일반 문제 해결 (2개)

**AI Query**: "일반적인 문제", "빌드 에러"

3. **common.md** ⭐ - 일반적인 문제 해결
   - 자주 발생하는 문제 및 해결법
   - 빠른 참조 가이드

4. **build.md** - 빌드 문제 해결
   - TypeScript 컴파일 에러
   - 의존성 문제
   - 환경변수 설정 오류

---

### 🤖 AI 도구 문제 (2개)

**AI Query**: "Claude 400 에러", "Google AI 문제"

5. **claude-400-invalid-json.md** - Claude 400 에러 해결
   - Invalid JSON 오류 분석
   - API 요청 형식 수정
   - 재시도 로직 구현

6. **google-ai-side-effects-analysis.md** - Google AI Side Effects 분석
   - Gemini CLI 문제 분석
   - Side Effects 영향 평가
   - 해결 방안

---

### 🎭 Playwright MCP 관련 (2개)

**AI Query**: "Playwright MCP 문제", "E2E 테스트 오류"

7. **playwright-mcp-recovery-guide.md** (위 #2 참조)

8. **playwright-mcp-side-effects-analysis.md** - Playwright MCP Side Effects 분석
   - MCP 서버 Side Effects
   - 브라우저 연동 문제
   - 성능 영향 분석

---

### 💻 시스템 모니터링 (1개)

**AI Query**: "WSL 모니터링", "시스템 상태 확인"

9. **wsl-monitoring-guide.md** - WSL 모니터링 가이드
   - WSL 메모리 모니터링
   - 성능 지표 추적
   - 자동 모니터링 설정

---

## 💡 Document Index (AI Query Guide)

### 긴급 상황 대응

**시스템 전체 복구**:
→ `system-recovery-guide-2025.md` ⚠️ **최우선**

**Playwright MCP 복구**:
→ `playwright-mcp-recovery-guide.md`

---

### 문제별 해결 가이드

**일반적인 문제**:
→ `common.md` - 빠른 참조

**빌드 실패**:
→ `build.md` - TypeScript, 의존성, 환경변수

**Claude API 에러**:
→ `claude-400-invalid-json.md` - 400 에러 해결

**Gemini CLI 문제**:
→ `google-ai-side-effects-analysis.md` - Side Effects 분석

**Playwright MCP 문제**:
→ `playwright-mcp-recovery-guide.md` + `playwright-mcp-side-effects-analysis.md`

**WSL 성능 문제**:
→ `wsl-monitoring-guide.md` - 모니터링 및 최적화

---

## 🎯 문제 해결 플로우

### 1단계: 문제 식별

```
문제 유형 확인:
├─ 시스템 전체? → system-recovery-guide-2025.md
├─ 빌드 실패? → build.md
├─ AI 도구 오류? → claude-400-invalid-json.md / google-ai-side-effects-analysis.md
├─ E2E 테스트? → playwright-mcp-recovery-guide.md
└─ WSL 성능? → wsl-monitoring-guide.md
```

---

### 2단계: 빠른 진단

**자주 발생하는 문제 확인**:
→ `common.md` 먼저 참조

**해결 안 되면**:
→ 해당 카테고리별 상세 가이드 참조

---

### 3단계: 복구 실행

**긴급 복구 필요 시**:
→ `system-recovery-guide-2025.md` 단계별 실행

**일반 문제**:
→ 해당 가이드 솔루션 적용

---

### 4단계: 검증

**복구 확인**:

```bash
# 시스템 상태 확인
./scripts/check-environment.sh

# MCP 서버 확인
./scripts/mcp-health-check.sh

# AI 도구 확인 (필요 시)
./scripts/ai-tools-health-check.sh

# 테스트 실행
npm run test:fast
```

---

## 🔧 자주 사용하는 명령어

### 시스템 복구

```bash
# 전체 환경 확인
./scripts/check-environment.sh

# MCP 서버 재시작
claude mcp restart

# WSL 재시작 (Windows에서)
wsl --shutdown
wsl
```

---

### 빌드 문제

```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# TypeScript 캐시 클리어
npm run type-check -- --force

# 전체 빌드 테스트
npm run build
```

---

### AI 도구 문제

```bash
# AI 도구 헬스 체크
./scripts/ai-tools-health-check.sh

# Gemini OAuth 재인증
gemini auth login

# Codex 인증 확인
codex auth status
```

---

### Playwright MCP 문제

```bash
# Playwright 브라우저 재설치
npx playwright install --with-deps

# MCP 서버 상태 확인
claude mcp list

# 윈도우 크롬 경로 확인
ls -la "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"
```

---

## 📊 문제 발생 빈도 (참고)

| 문제 유형          | 빈도      | 우선순위 | 주요 문서                        |
| ------------------ | --------- | -------- | -------------------------------- |
| **빌드 에러**      | 높음      | HIGH     | build.md, common.md              |
| **WSL 성능**       | 중간      | MEDIUM   | wsl-monitoring-guide.md          |
| **Playwright MCP** | 중간      | MEDIUM   | playwright-mcp-recovery-guide.md |
| **Claude API**     | 낮음      | LOW      | claude-400-invalid-json.md       |
| **시스템 전체**    | 매우 낮음 | CRITICAL | system-recovery-guide-2025.md    |

---

## 🔗 관련 문서

**개발 환경**:

- **docs/development/** - 환경 설정 가이드
- **docs/claude/environment/** - Claude Code 환경

**테스트**:

- **docs/testing/** - 테스트 전략
- **docs/claude/testing/** - E2E 테스트

**스크립트**:

- **scripts/check-environment.sh** - 환경 검증
- **scripts/mcp-health-check.sh** - MCP 서버 체크
- **scripts/ai-tools-health-check.sh** - AI 도구 체크

---

## 🎯 핵심 철학

> **"문제 발생 시 빠른 진단과 체계적 복구"**

**트러블슈팅 원칙**:

- ✅ common.md 먼저 확인 (빠른 해결)
- ✅ 문제 재현 및 로그 수집
- ✅ 단계별 체계적 복구
- ✅ 재발 방지 전략 수립

**예방 전략**:

- 📊 정기적 헬스 체크 (주 1회)
- 💾 정기적 백업 유지
- 📝 문제 해결 사례 문서화
- 🔄 스크립트 자동화

---

## ⚡ 빠른 참조

**긴급 상황**:

1. `system-recovery-guide-2025.md` 실행
2. 백업에서 복구
3. 전문가 지원 요청

**일반 문제**:

1. `common.md` 확인
2. 해당 카테고리 가이드 참조
3. 스크립트 실행으로 검증

**예방**:

- 주 1회: `./scripts/mcp-health-check.sh`
- 월 1회: 전체 환경 점검
- 분기 1회: 시스템 복구 훈련

---

**Last Updated**: 2025-10-17 by Claude Code
**핵심 철학**: "Prevent First, Recover Fast"
