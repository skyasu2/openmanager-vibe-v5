# AI 시스템 유지보수 가이드

**스택 드리프트 추적 및 장기 안정성 확보**

최종 업데이트: 2025-10-16

---

## 📊 Executive Summary

### 목적

- 스택 드리프트 추적 부재 해결 (Codex 지적 핵심 문제)
- AI 도구, MCP 서버, 서브에이전트 버전 관리
- 장기 안정성 확보 (99.9% 연결 성공률 유지)

### 핵심 원칙

1. **월 1회 체크리스트**: 30분 투입으로 전체 시스템 점검
2. **버전 고정 전략**: 예상치 못한 Breaking changes 방지
3. **점진적 업데이트**: 한 번에 하나씩, 테스트 후 다음 단계
4. **변경 로그 추적**: registry.yaml + Decision Log 기록

### 기대 효과

- 스택 드리프트 빠른 감지 (1개월 → 즉시)
- API 변경 대응 지연 방지 (0% 다운타임)
- 유지보수 복잡도 50% 감소
- 신규 참여자 온보딩 40% 빠름

---

## 📋 월간 체크리스트 (30분)

### 실행 일정

- **권장**: 매월 1일 (월초)
- **필수**: 분기별 최소 1회 (3개월마다)
- **긴급**: AI 도구 오류 발생 시 즉시

### 체크리스트 사용법

1. 이 문서를 열어 둔다
2. 각 항목을 순서대로 실행
3. ✅ 체크 시 현재 날짜 기록
4. 변경 사항은 registry.yaml 업데이트
5. 주요 변경은 Decision Log 기록

---

### Section 0: 빠른 헬스 체크 (2분) ⭐

**사용 시기**: AI 도구 오류 발생 시, 또는 상태 확인 필요 시 (필요할 때만 실행)

```bash
# 🆕 서브에이전트 사용 (권장)
# Claude Code에서: "dev-environment-manager야, AI 도구 헬스 체크해줘"

# 또는 레거시 스크립트 (기본 체크만, Deprecated)
./scripts/ai-tools-health-check.sh
```

**체크 항목** (자동):

- ✅ **설치 여부**: Claude Code, Codex CLI, Gemini CLI, Qwen CLI
- ✅ **버전 확인**: 각 도구의 현재 버전
- ✅ **대화 테스트**: Codex, Gemini, Qwen 응답 테스트
- ✅ **업그레이드 가능 여부**: npm 패키지 최신 버전 확인

**결과 해석**:

| 상태                     | 의미 | 조치                    |
| ------------------------ | ---- | ----------------------- |
| ✅ 모든 도구 정상 (4/4)  | 완벽 | Section 1-4 간단 확인만 |
| ⚠️ 일부 도구 누락 (3/4)  | 주의 | 누락된 도구 확인        |
| ❌ 다수 도구 누락 (≤2/4) | 긴급 | 즉시 Section 1 실행     |

**다음 단계**:

- 모든 도구 정상 → **Section 2 (MCP 서버)로 이동**
- 문제 발견 → **Section 1 (상세 체크)로 이동**

---

### Section 1: AI 도구 버전 체크 (10분)

**💡 팁**: Section 0에서 문제가 발견된 경우에만 이 섹션을 상세히 실행하세요.

#### Codex (ChatGPT CLI)

```bash
# 버전 확인
codex --version

# 구독 상태 확인 (웹)
# https://chat.openai.com/settings/billing

# 릴리즈 노트 확인
# https://openai.com/blog/
```

**체크 항목**:

- [ ] Codex 버전: `______` (현재: GPT-5)
- [ ] ChatGPT Plus 구독 활성: `Yes/No` (만료일: `______`)
- [ ] API 변경 사항: `없음 / 있음 (설명: ______)`
- [ ] Wrapper 타임아웃 조정 필요: `No / Yes (300초 → ___초)`
- [ ] registry.yaml 업데이트 필요: `No / Yes`

**Breaking Changes 대응**:

- [ ] 쿼리 최적화 가이드 수정 필요: `No / Yes`
- [ ] 테스트 실행: `codex exec "Hello World"` 성공 확인

---

#### Gemini (Google Gemini CLI)

```bash
# 버전 확인
gemini --version

# OAuth 캐시 유효성 확인
gemini "test query"  # 인증 프롬프트 없으면 정상

# 릴리즈 노트 확인
# https://ai.google.dev/gemini-api/docs/releases
```

**체크 항목**:

- [ ] Gemini 버전: `______` (현재: 2.5 Flash)
- [ ] OAuth 캐시 유효: `Yes/No` (재인증 필요 시 실행)
- [ ] API 한도 변경: `없음 / 있음 (60 RPM → ___RPM)`
- [ ] API 변경 사항: `없음 / 있음 (설명: ______)`
- [ ] Wrapper 타임아웃 조정 필요: `No / Yes (300초 → ___초)`
- [ ] registry.yaml 업데이트 필요: `No / Yes`

**Breaking Changes 대응**:

- [ ] OAuth 재인증: 필요 시 `gemini --auth`
- [ ] 테스트 실행: `gemini "Hello World"` 성공 확인

---

#### Qwen (Qwen CLI)

```bash
# 버전 확인
qwen --version

# OAuth 유효성 확인
qwen -p "test query"  # Plan Mode 테스트

# 릴리즈 노트 확인
# https://github.com/QwenLM/Qwen2.5-Coder/releases
```

**체크 항목**:

- [ ] Qwen 버전: `______` (현재: 2.5 Coder)
- [ ] OAuth 유효: `Yes/No` (재인증 필요 시 실행)
- [ ] API 한도 변경: `없음 / 있음 (60 RPM → ___RPM)`
- [ ] API 변경 사항: `없음 / 있음 (설명: ______)`
- [ ] Wrapper 타임아웃 조정 필요: `No / Yes (600초 → ___초)`
- [ ] registry.yaml 업데이트 필요: `No / Yes`

**Breaking Changes 대응**:

- [ ] OAuth 재인증: 필요 시 `qwen --auth`
- [ ] Plan Mode 테스트: `qwen -p "Hello World"` 성공 확인

---

#### Claude Code

```bash
# 버전 확인
claude --version

# 업데이트 확인
# https://docs.claude.com/en/docs/claude-code/

# 릴리즈 노트
# https://github.com/anthropics/claude-code/releases
```

**체크 항목**:

- [ ] Claude Code 버전: `______` (현재: v2.0.31+)
- [ ] 최신 버전 확인: `업데이트 없음 / 있음 (v___.___로 업데이트)`
- [ ] Breaking Changes: `없음 / 있음 (설명: ______)`
- [ ] 서브에이전트 호환성: `정상 / 문제 (설명: ______)`
- [ ] MCP 서버 호환성: `정상 / 문제 (설명: ______)`

**Breaking Changes 대응**:

- [ ] 서브에이전트 업데이트 필요: `No / Yes`
- [ ] CLAUDE.md 수정 필요: `No / Yes`

---

### Section 2: MCP 서버 상태 (10분)

```bash
# MCP 헬스 체크 실행
./scripts/mcp-health-check.sh

# 상세 상태 확인
claude mcp list

# 로그 확인
cat logs/mcp-health/$(date +%Y-%m-%d).log
```

**체크 항목**:

- [ ] MCP 연결 성공률: `___/9` (목표: 9/9, 최소: 7/9)
- [ ] 연결 실패 서버: `없음 / 있음 (서버명: ______, ______, ______)`

**서버별 상태** (✅/❌ 표시):

| 서버                | 상태 | 버전     | Breaking Changes | 조치 필요 |
| ------------------- | ---- | -------- | ---------------- | --------- |
| vercel              | ☐    | `______` | `없음/있음`      | `No/Yes`  |
| serena              | ☐    | `______` | `없음/있음`      | `No/Yes`  |
| supabase            | ☐    | `______` | `없음/있음`      | `No/Yes`  |
| context7            | ☐    | `______` | `없음/있음`      | `No/Yes`  |
| playwright          | ☐    | `______` | `없음/있음`      | `No/Yes`  |
| shadcn-ui           | ☐    | `______` | `없음/있음`      | `No/Yes`  |
| memory              | ☐    | `______` | `없음/있음`      | `No/Yes`  |
| time                | ☐    | `______` | `없음/있음`      | `No/Yes`  |
| sequential-thinking | ☐    | `______` | `없음/있음`      | `No/Yes`  |

**문제 해결**:

- [ ] OAuth 재인증 필요: `No / Yes (서버명: ______)`
- [ ] 서버 재시작: `No / Yes (명령: claude mcp restart)`
- [ ] settings.json 수정: `No / Yes`

**릴리즈 노트 확인**:

- Vercel: https://github.com/vercel/mcp
- Supabase: https://github.com/supabase/mcp-server-supabase
- Context7: https://github.com/upstash/context7-mcp
- Playwright: https://github.com/executeautomation/playwright-mcp-server
- shadcn-ui: https://github.com/jpisnice/shadcn-ui-mcp-server

---

### Section 3: 문서 동기화 (5분)

#### CLAUDE.md 크기 체크

```bash
# 줄 수 확인
wc -l CLAUDE.md

# 목표: 200-300줄
```

**체크 항목**:

- [ ] CLAUDE.md 크기: `___줄` (목표: 200-300줄)
- [ ] 크기 초과 시 조치: `No / Yes (내용 분리: ______)`

#### registry.yaml 버전 업데이트

```bash
# 버전 번호 확인
grep "version:" config/ai/registry.yaml

# last_updated 확인
grep "last_updated:" config/ai/registry.yaml
```

**체크 항목**:

- [ ] registry.yaml 버전: `______` (현재: 1.0.0)
- [ ] last_updated: `______` (이번 달로 업데이트)
- [ ] AI 도구 버전 일치: `Yes / No (수정 필요: ______)`
- [ ] MCP 서버 상태 일치: `Yes / No (수정 필요: ______)`
- [ ] 서브에이전트 목록 일치: `Yes / No (18개 확인)`

#### 서브에이전트 목록 확인

```bash
# 서브에이전트 파일 개수
ls -1 .claude/agents/*.md | wc -l

# 목표: 18개
```

**체크 항목**:

- [ ] 서브에이전트 파일: `___개` (목표: 18개)
- [ ] 목록 일치: `Yes / No`
  - CLAUDE.md: `___개`
  - registry.yaml: `___개`
  - subagents-complete-guide.md: `___개`

---

### Section 4: 성능 지표 (5분)

#### 토큰 효율

**측정 방법**:

- CLAUDE.md에 명시된 목표 달성 여부 확인
- 주요 작업 토큰 사용량 추적 (수동)

**체크 항목**:

- [ ] 토큰 효율: `___%` (목표: 82% → 85%)
- [ ] MCP 활용도: `___/100` (목표: 90-100)
- [ ] 개선 필요: `No / Yes (액션: ______)`

#### 3-AI 성공률

**측정 방법**:

- 최근 교차검증 결과 확인
- Decision Log 참조

**체크 항목**:

- [ ] 최근 교차검증 날짜: `______`
- [ ] 3-AI 성공률: `___% (___/3)` (목표: 100%)
- [ ] Codex 타임아웃: `없음 / 있음 (날짜: ______, 원인: ______)`
- [ ] 쿼리 최적화 필요: `No / Yes`

#### MCP 활용도

**측정 방법**:

- 체크리스트 준수 여부 확인 (CLAUDE.md)
- 실제 사용 패턴 회고

**체크 항목**:

- [ ] Serena `skip_ignored_files: true` 사용: `항상 / 가끔 / 안 함`
- [ ] @-mention 활용: `자주 / 가끔 / 안 함`
- [ ] MCP 우선 원칙 준수: `Yes / No`

---

## 🔧 버전 관리 전략

### 버전 고정 (Pinning)

**목적**: 예상치 못한 Breaking changes 방지

#### NPM 기반 MCP 서버

```bash
# ❌ 최신 버전 자동 사용 (위험)
npx -y @supabase/mcp-server-supabase@latest

# ✅ 버전 고정 (안전)
npx -y @supabase/mcp-server-supabase@1.2.3
```

**적용 방법**:

1. `claude mcp list`로 현재 버전 확인
2. `~/.config/claude-code/settings.json` 수정
3. `@latest` → `@1.2.3`으로 변경
4. `claude mcp restart`

**버전 고정 권장**:

- ✅ **프로덕션**: 항상 버전 고정
- ⚠️ **개발**: 최신 버전 테스트 가능
- ⚠️ **신규 기능**: 업데이트 전 테스트 환경 확인

---

### 변경 로그 추적

#### registry.yaml 업데이트

```yaml
# 버전 정보 업데이트
version: '1.1.0' # 메이저 변경 시 증가
last_updated: '2025-11-01' # 월간 체크 시 업데이트

# 변경 사항 기록 (주석)
# 2025-10-16: Codex 타임아웃 300→600초
# 2025-11-01: Gemini OAuth 재인증
```

#### Decision Log 기록

**중요 변경만 기록** (예시):

- AI 도구 메이저 업데이트
- MCP 서버 Breaking changes
- 서브에이전트 추가/제거
- 워크플로우 변경

```markdown
# logs/ai-decisions/2025-11-01-gemini-oauth-update.md

## 변경 사항

- Gemini OAuth 캐시 만료로 재인증 필요
- 재인증 완료: 2025-11-01

## 영향 범위

- gemini-wrapper.sh: 정상 동작 확인
- gemini-specialist: 정상 동작 확인

## 조치 사항

- 없음 (3개월 후 재확인)
```

---

### 점진적 업데이트 절차

**원칙**: 한 번에 하나씩, 테스트 후 다음 단계

#### Step 1: 업데이트 계획

- [ ] 업데이트 대상 식별: `______`
- [ ] 릴리즈 노트 확인: `Breaking changes 없음 / 있음`
- [ ] 테스트 계획 수립: `______`
- [ ] 롤백 계획 수립: `이전 버전: ______`

#### Step 2: 테스트 환경 업데이트

```bash
# 임시 테스트 (예: Codex)
codex exec "test query"  # 업데이트 전
# → 업데이트 실행
codex exec "test query"  # 업데이트 후 비교
```

#### Step 3: 프로덕션 업데이트

- [ ] 설정 파일 백업: `cp settings.json settings.json.backup`
- [ ] 업데이트 실행: `______`
- [ ] 테스트 실행: `______`
- [ ] 성공 확인: `Yes / No`

#### Step 4: 문서 업데이트

- [ ] registry.yaml 버전 업데이트
- [ ] CLAUDE.md 수정 (필요 시)
- [ ] Decision Log 기록 (주요 변경만)

#### Step 5: 롤백 (문제 발생 시)

```bash
# 설정 복원
mv settings.json.backup settings.json

# MCP 재시작
claude mcp restart

# 테스트
claude mcp list
```

---

## 🚨 스택 드리프트 감지

### 자동 감지 부재 해결

**현실**: 1인 개발 환경에서 자동 알림 시스템 구축은 과도한 투자

**실용적 해결책**:

1. **월간 체크리스트 활용** (주요 방법)
2. **버전 고정 전략** (Breaking changes 방지)
3. **점진적 업데이트** (리스크 최소화)

### 조기 감지 신호

**즉시 체크 필요한 상황**:

1. **AI 도구 오류**
   - Codex 타임아웃 증가
   - Gemini OAuth 실패
   - Qwen Plan Mode 오류

2. **MCP 서버 오류**
   - 연결 실패 (9/9 → 8/9 이하)
   - 호출 오류 증가
   - 응답 시간 증가

3. **서브에이전트 오류**
   - Task 호출 실패
   - 응답 품질 저하
   - 타임아웃 증가

**조치 절차**:

1. 월간 체크리스트 즉시 실행
2. 릴리즈 노트 확인
3. 버전 업데이트 또는 롤백
4. Decision Log 기록

---

### 릴리즈 노트 모니터링

**권장 구독** (GitHub Watch):

- Codex/Claude: OpenAI Blog, Anthropic Blog
- Gemini: Google AI Blog
- Qwen: GitHub Releases
- MCP Servers: 각 저장소 Releases

**체크 빈도**:

- **월 1회**: 월간 체크리스트 실행 시
- **즉시**: 오류 발생 시

---

## 📊 성능 지표 추적

### 토큰 효율

**목표**: 82% (달성) → 85% (차기 목표)

**측정 방법** (수동):

1. 주요 작업 토큰 사용량 기록
2. MCP 활용 전후 비교
3. 월간 평균 계산

**개선 액션**:

- MCP 활용도 체크리스트 준수
- @-mention 적극 활용 (추가 10-18% 절약)
- Serena `skip_ignored_files: true` 항시 사용

---

### MCP 활용도

**목표**: 65/100 (현재) → 90-100/100 (차기 목표)

**측정 방법** (자가 평가):

- 체크리스트 준수 여부 확인
- 실제 사용 패턴 회고
- 비효율적 패턴 식별

**개선 액션**:

- CLAUDE.md 체크리스트 매번 확인
- MCP 우선 원칙 준수
- WebSearch/Read 대신 MCP 사용

---

### 3-AI 성공률

**목표**: 100% (3/3 성공)

**측정 방법**:

- 교차검증 시 성공/실패 기록
- Decision Log 참조
- 타임아웃 패턴 분석

**개선 액션**:

- 쿼리 최적화 가이드 준수
- Executive Summary 방식 활용
- 타임아웃 시 쿼리 50% 축소

---

## 🛠️ 문제 해결

### 일반적인 문제

#### 문제 1: Codex 타임아웃

**증상**:

```
❌ Codex 타임아웃 (300초 = 5분 초과)
```

**해결 방법**:

1. 쿼리 간소화 (docs/ai/3-ai-query-optimization-guide.md 참조)
2. 쿼리 50% 축소
3. Executive Summary 방식 사용
4. 분할 쿼리 (3개 별도)

**예방**:

- 쿼리 길이 250단어 이내
- 명확한 역할 정의
- 불필요한 컨텍스트 제거

---

#### 문제 2: Gemini OAuth 실패

**증상**:

```
❌ OAuth authentication required
```

**해결 방법**:

```bash
# OAuth 재인증
gemini --auth

# 또는 캐시 삭제 후 재인증
rm -rf ~/.cache/gemini-oauth
gemini "test query"
```

**예방**:

- 월간 체크리스트에서 OAuth 유효성 확인
- 3개월마다 사전 재인증

---

#### 문제 3: MCP 서버 연결 실패

**증상**:

```
❌ Failed to connect: [서버명]
```

**해결 방법**:

```bash
# 1. MCP 재시작
claude mcp restart

# 2. 상세 로그 확인
claude mcp list

# 3. OAuth 재인증 (필요 시)
# 각 서버별 재연결 절차 수행

# 4. settings.json 확인
cat ~/.config/claude-code/settings.json
```

**예방**:

- 주 1회 mcp-health-check.sh 실행
- 9/9 연결 성공 유지

---

#### 문제 4: 서브에이전트 호출 실패

**증상**:

```
Task tool error: Agent not found
```

**해결 방법**:

1. 서브에이전트 파일 존재 확인 (`.claude/agents/*.md`)
2. 파일 이름 정확성 확인
3. Claude Code 재시작
4. 서브에이전트 재등록

**예방**:

- 월간 체크리스트에서 서브에이전트 목록 확인 (18개)
- 파일 삭제 주의

---

### 긴급 연락처

**Claude Code**:

- 이슈: https://github.com/anthropics/claude-code/issues
- 문서: https://docs.claude.com/en/docs/claude-code/

**커뮤니티**:

- Discord: Claude Code 커뮤니티
- Reddit: r/ClaudeAI

**로컬 문제 해결**:

- Decision Log 검색: `grep "문제" logs/ai-decisions/*.md`
- AI Registry 참조: `config/ai/registry.yaml`
- 워크플로우 가이드: `docs/ai/ai-workflows.md`

---

## 🎯 빠른 참조

### 월간 체크리스트 실행

```bash
# 0. 빠른 헬스 체크 (2분) ⭐ 필수 - 🆕 서브에이전트 사용
# Claude Code: "dev-environment-manager야, AI 도구 헬스 체크해줘"
# 또는 레거시 스크립트: ./scripts/ai-tools-health-check.sh (Deprecated)

# 1. AI 도구 상세 체크 (10분, 문제 발견 시만)
codex --version
gemini --version
qwen --version
claude --version

# 2. MCP 서버 상태 (10분)
./scripts/mcp-health-check.sh
claude mcp list

# 3. 문서 동기화 (5분)
wc -l CLAUDE.md
grep "version:" config/ai/registry.yaml
ls -1 .claude/agents/*.md | wc -l

# 4. 성능 지표 (5분)
# 수동 확인: 토큰 효율, MCP 활용도, 3-AI 성공률

# 총 소요 시간: 30분 (문제 없을 시 20분)
```

### 업데이트 절차

```bash
# 1. 백업
cp ~/.config/claude-code/settings.json ~/.config/claude-code/settings.json.backup

# 2. 업데이트 (예: Codex)
# ChatGPT Plus 구독 갱신 또는 버전 확인

# 3. 테스트
codex exec "Hello World"

# 4. 문서 업데이트
# registry.yaml, CLAUDE.md, Decision Log

# 5. 롤백 (문제 발생 시)
mv ~/.config/claude-code/settings.json.backup ~/.config/claude-code/settings.json
claude mcp restart
```

---

## 📚 관련 문서

- **AI Registry**: config/ai/registry.yaml (SSOT)
- **워크플로우**: docs/ai/ai-workflows.md
- **쿼리 최적화**: docs/ai/3-ai-query-optimization-guide.md
- **서브에이전트**: docs/ai/subagents-complete-guide.md
- **Multi-AI 전략**: docs/claude/environment/multi-ai-strategy.md

---

## 💡 핵심 원칙

1. **월 1회 체크**: 30분 투입으로 전체 시스템 안정성 확보
2. **버전 고정**: Breaking changes 예방
3. **점진적 업데이트**: 한 번에 하나씩, 테스트 후 다음
4. **변경 로그**: registry.yaml + Decision Log 기록
5. **조기 감지**: 오류 발생 시 즉시 체크리스트 실행

---

**💬 피드백**: 이 가이드가 도움이 되었다면 실행 날짜를 기록하고 개선 사항을 제안해주세요!

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
