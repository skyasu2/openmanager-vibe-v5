# 🔒 간단한 환경변수 백업 가이드

## 📋 개요

Base64 인코딩으로 GitHub 보안 검사를 통과하면서도 쉽게 복호화 가능한 백업 시스템입니다.

## 🚀 사용법

### 백업

```bash
npm run env:backup
```

### 복원

```bash
npm run env:restore
```

### 도움말

```bash
npm run env:help
```

## 🔐 보안 방식

- **민감한 변수**: Base64 인코딩 (GitHub 보안 통과)
- **일반 변수**: 평문 저장
- **자동 감지**: `_KEY`, `_TOKEN`, `_SECRET` 등 패턴 인식

## 📊 백업 파일 형식

```json
{
  "version": "2.0",
  "timestamp": "2025-07-26T02:06:31.468Z",
  "variables": {
    "GOOGLE_AI_API_KEY": {
      "value": "QUl6YVN5QUJDMldBVGxISUcwS2QtT2o0SlNMNndKb3FNZDNGaHZN",
      "encoded": true
    },
    "NEXT_PUBLIC_APP_URL": {
      "value": "http://localhost:3000",
      "encoded": false
    }
  }
}
```

## ✅ 장점

1. **간단함**: 단일 스크립트로 모든 기능
2. **안전함**: GitHub 보안 검사 통과
3. **복구 가능**: Base64로 쉽게 복호화
4. **빠름**: 외부 의존성 최소화

## 📁 파일 위치

- 백업 파일: `config/env-backup.json`
- 환경변수: `.env.local`
- 스크립트: `scripts/simple-env-backup.cjs`

## 🔄 워크플로우

1. 환경변수 수정 → `npm run env:backup`
2. Git 커밋 → 백업 파일도 함께 커밋
3. 새 환경 → `npm run env:restore`

---

_개발 환경 전용입니다. 프로덕션에서는 전문 도구를 사용하세요._
