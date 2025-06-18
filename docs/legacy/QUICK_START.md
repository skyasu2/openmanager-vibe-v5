# ⚡ Quick Start Guide

OpenManager Vibe v5를 **5분 안에** 실행해보세요!

## 🚀 5분 빠른 시작

### 1️⃣ 프로젝트 클론 및 설치

```bash
# Repository 클론
git clone https://github.com/your-username/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 의존성 설치
npm install
```

### 2️⃣ 환경 변수 설정

```bash
# 환경 변수 템플릿 복사
cp vercel.env.template .env.local

# Google AI Studio API 키 설정
# .env.local 파일을 열고 다음 설정:
GOOGLE_AI_API_KEY=your_actual_api_key_here
```

### 3️⃣ 개발 서버 시작

```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 확인
# http://localhost:3000
```

## 🤖 AI 기능 활성화 (선택사항)

### MCP 서버 설정

```bash
# MCP 서버 완벽 설정
npm run mcp:perfect:setup

# MCP 개발 서버 시작
npm run mcp:dev
```

## 🎯 첫 번째 사용법

### 1. 대시보드 접속

- <http://localhost:3000> 접속
- AI 채팅 사이드바 열기
- "현재 서버 상태 분석해줘" 입력

### 2. 서버 모니터링

- 서버 목록에서 서버 선택
- 실시간 메트릭 확인
- AI 분석 결과 확인

### 3. 고급 기능

- AI 추천 기능 사용
- 자동화 스크립트 실행
- 알림 설정

## 🔧 문제 해결

### 자주 발생하는 문제

**Q: Google AI API 키 오류가 발생해요**

```bash
# API 키 확인
echo $GOOGLE_AI_API_KEY
# 또는 .env.local 파일에서 확인
```

**Q: MCP 서버가 시작되지 않아요**

```bash
# MCP 서버 상태 확인
npm run mcp:status

# MCP 서버 재시작
npm run mcp:restart
```

**Q: 포트 충돌이 발생해요**

```bash
# 다른 포트로 실행
PORT=3001 npm run dev
```

## 📚 다음 단계

- [🏗️ 아키텍처 이해하기](ARCHITECTURE.md)
- [🛠️ 개발 가이드](DEVELOPMENT.md)
- [🤖 AI 설정 심화](AI_SETUP.md)
- [☁️ 배포하기](DEPLOYMENT.md)

## 💡 팁

- **Ctrl/Cmd + K**: AI 채팅 사이드바 열기
- **Ctrl/Cmd + Shift + M**: MCP 모니터링 페이지
- **F5**: 실시간 데이터 새로고침
