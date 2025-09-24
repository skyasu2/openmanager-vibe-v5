# 🤖 AI 시스템 구분 가이드

**중요**: 완전히 다른 목적과 인증 방식을 가진 두 AI 시스템

## 🎯 1. 개발용 Gemini CLI

**목적**: WSL 환경에서 개발자가 직접 사용하는 코딩 도구
**인증**: 이메일로 계정 인증 (OAuth 브라우저 인증)
**실행 위치**: WSL 터미널
**사용법**:
```bash
# WSL에서 직접 실행
gemini "코드 리뷰 요청"
gemini "아키텍처 설계 검토"
```

**특징**:
- 개발자 전용 도구
- Claude Code의 서브에이전트로 활용
- 무료 사용 (60 RPM/1K RPD)
- 이메일 계정으로 인증된 개발 세션

## 🌐 2. 앱용 Google AI API

**목적**: OpenManager VIBE 앱 내부 자연어 질의 "구글 모드"
**인증**: GOOGLE_AI_API_KEY 환경변수 사용
**실행 위치**: Next.js 앱 내부 (브라우저)
**사용법**:
```typescript
// 앱 내부에서 최종 사용자가 사용
const response = await fetch('/api/ai/query', {
  method: 'POST',
  body: JSON.stringify({
    mode: 'google-ai',  // 구글 모드 선택
    query: '서버 상태 분석해주세요'
  })
});
```

**특징**:
- 최종 사용자용 기능
- 앱 UI에서 모드 선택
- API 키 기반 인증
- 무료 티어: Gemini 2.5 Flash (250 req/day)

## ⚠️ 절대 혼동 금지

| 구분 | 개발용 Gemini CLI | 앱용 Google AI API |
|------|------------------|---------------------|
| **사용자** | 개발자 (나) | 최종 사용자 |
| **위치** | WSL 터미널 | 브라우저 앱 |
| **인증** | 이메일 OAuth | API 키 |
| **목적** | 코딩 보조 | 자연어 질의 |
| **예시** | `gemini "버그 찾아줘"` | 앱에서 "서버 상태는?" |

## 🔧 현재 상태 확인

### 개발용 Gemini CLI 상태
```bash
# 버전 확인
gemini --version

# 인증 상태 확인
gemini "간단한 테스트 질문"
```

### 앱용 Google AI API 상태
- ✅ API 키: `AIzaSyABC2WATlHIG0Kd-Oj4JSL6wJoqMd3FhvM` (.env.local 설정)
- ✅ 앱 테스트: gemini-2.5-flash-lite 1914ms 성공 확인
- ❌ 타임아웃 오판: 1914ms 성공을 2490ms 실패로 판정 (해결 필요)

## 🎯 다음 단계

1. **개발용 Gemini CLI**: 서브에이전트로 활용 준비
2. **앱용 Google AI API**: 타임아웃 설정 최적화 적용