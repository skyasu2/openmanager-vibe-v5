# ⚡ 빠른 시작 가이드

> **OpenManager Vibe v5.35.0 즉시 시작하기**

## 🚀 3분 설치

### 1. 기본 설치

```bash
git clone https://github.com/yourusername/openmanager-vibe-v5.git
cd openmanager-vibe-v5
npm install
```

### 2. 환경 설정

```bash
cp .env.example .env.local
# 필요시 환경변수 수정
```

### 3. 실행

```bash
npm run dev
# http://localhost:3000 접속
```

## 🎯 첫 사용법

1. **시스템 시작**: "🚀 시스템 시작" 버튼 클릭
2. **AI 모드**: 필요시 "🧠 AI 엔진 설정" 활성화
3. **대시보드**: "📊 대시보드 들어가기" 클릭

## ⚠️ 문제 해결

### 일반적인 문제

- **포트 에러**: 3000 포트가 사용 중인 경우 `npm run dev -- -p 3001`
- **설치 에러**: `rm -rf node_modules && npm install`
- **환경변수**: `ENVIRONMENT_SETUP.md` 참조

### 추가 도움

- 상세 가이드: `docs/ESSENTIAL_DOCUMENTATION.md`
- 개발 가이드: `DEVELOPMENT_GUIDE.md`
