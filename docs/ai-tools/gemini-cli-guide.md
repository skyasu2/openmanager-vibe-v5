# 🌟 Gemini CLI 협업 가이드

> **Google 오픈소스 AI 에이전트와 Claude Code 연동**  
> **최신 업데이트**: 2025-08-15

## 📌 개요

Gemini CLI는 Google이 개발한 **오픈소스 명령줄 AI 에이전트**로, 터미널에서 직접 Gemini 2.5 Pro 모델을 활용하는 강력한 도구입니다.

### 핵심 특징

- **1M 토큰 컨텍스트**: 대규모 코드베이스 한 번에 분석
- **Google Search 통합**: 실시간 웹 정보와 코드 결합
- **GitHub Actions 연동**: 자동 PR 리뷰, 이슈 처리
- **MCP 프로토콜**: 확장 가능한 도구 체인

## 🚀 설치 및 설정

### 즉시 실행 (권장)

```bash
# npx로 즉시 사용
npx https://github.com/google-gemini/gemini-cli

# 글로벌 설치
npm install -g @google/gemini-cli

# macOS/Linux (Homebrew)
brew install gemini-cli
```

### 환경 설정

```bash
# Google OAuth 인증 필요
gemini auth login

# API 키 설정 (선택사항)
export GEMINI_API_KEY=your_api_key
```

## 💡 Claude Code와 협업 패턴

### 1. 대규모 리팩토링 작업

```bash
# Gemini: 전체 코드베이스 분석 (1M 토큰)
gemini analyze --files "src/**/*.ts" --context-window 1000000

# Claude Code: 정밀한 구현
# (Claude에서 Gemini 분석 결과를 참고하여 세부 구현)
```

### 2. 실시간 연구 + 개발

```bash
# Gemini: 최신 정보 검색
gemini search "Next.js 15 breaking changes" --integrate-with-code

# Claude Code: 검색 결과 기반 마이그레이션 구현
```

### 3. GitHub 자동화

```bash
# Gemini: PR 자동 리뷰
gemini github --auto-review --pr-number 123

# Claude Code: 리뷰 피드백 반영
```

## 🔧 실전 활용 사례

### 보안 감사 자동화

```bash
# Gemini으로 전체 취약점 스캔
gemini analyze --security-scan --files "src/**/*.ts"

# Claude Code로 구체적 수정 구현
```

### 성능 최적화

```bash
# Gemini으로 성능 병목 찾기
gemini analyze --performance --bundle-analysis

# Claude Code로 최적화 코드 작성
```

### 문서 자동 생성

```bash
# Gemini으로 README 초안 작성
gemini generate --docs --project-overview

# Claude Code로 세부 문서 완성
```

## 📊 무료 티어 제한사항

| 항목      | 제한    | 권장 사용법             |
| --------- | ------- | ----------------------- |
| 일일 요청 | 1,000회 | 대규모 분석에 집중 사용 |
| 분당 요청 | 60회    | 배치 처리로 효율화      |
| 컨텍스트  | 1M 토큰 | 전체 프로젝트 분석 활용 |

## ⚠️ 보안 고려사항

### 버전 관리

- **v0.1.14 이상 필수**: 초기 whitelist 취약점 해결
- 정기적 업데이트 확인 권장

### 민감 정보 처리

- API 키는 환경변수로 관리
- 민감한 코드는 로컬 처리 (Qwen CLI 활용)

## 🤝 Claude Code + Gemini CLI 워크플로우

### 복합 작업 예시

```typescript
// Step 1: Gemini으로 전체 상황 파악
const geminiAnalysis = await execGemini('전체 프로젝트 구조 분석');

// Step 2: Claude Code로 정밀 구현
const claudeImplementation = await claudeCode(geminiAnalysis);

// Step 3: Gemini으로 자동 테스트 및 배포
await execGemini('github --create-workflow --auto-deploy');
```

### 역할 분담 전략

- **Gemini**: 대규모 분석, 검색, 자동화
- **Claude Code**: 정밀 구현, 세부 로직, 품질 관리

## 🔗 관련 문서

- [Claude Code 가이드](../claude/sub-agents-comprehensive-guide.md)
- [Qwen CLI 활용법](./qwen-cli-guide.md)
- [AI 도구 비교](./ai-tools-comparison.md)
- [MCP 서버 설정](../MCP-SETUP-GUIDE.md)

---

> **다음 단계**: [AI 도구 비교 분석](./ai-tools-comparison.md)에서 최적 도구 선택법 확인
