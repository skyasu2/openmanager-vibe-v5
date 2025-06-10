# 인프라 설정 파일

이 폴더는 OpenManager Vibe v5의 배포 및 인프라 관련 설정 파일들을 포함합니다.

## 📁 파일 설명

### Vercel 배포

- `vercel.json` - Vercel 배포 설정
  - Next.js 15 최적화 설정
  - 환경변수 매핑
  - 빌드 및 출력 설정
  - 경로 재작성 규칙
- `vercel.simple.json` - 간단한 Vercel 설정
  - 기본 Next.js 앱용
  - 최소한의 설정
- `vercel.env.template` - 환경변수 템플릿
  - 필수 환경변수 목록
  - 개발/프로덕션 환경 분리
  - Google AI API 키 설정
- `vercel-*.txt` - 환경변수 설정 가이드
  - 단계별 설정 방법
  - 보안 가이드라인

### Render 배포

- `render.yaml` - Render 배포 설정 (MCP 서버용)
  - Docker 컨테이너 설정
  - 포트 및 헬스체크
  - 환경변수 설정
  - 자동 배포 설정
- `render-mcp-config.json` - Render MCP 설정
  - MCP 서버 연결 정보
  - AI 엔진 설정

## 🚀 배포 가이드

### Vercel 배포 (프론트엔드)

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 프로젝트 연결
vercel link

# 3. 환경변수 설정
vercel env add GOOGLE_AI_API_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY

# 4. 배포
vercel deploy --prod
```

### Render 배포 (MCP 서버)

```bash
# 1. GitHub 연동
git push origin main

# 2. Render 대시보드에서 서비스 생성
# - Repository: openmanager-vibe-v5
# - Branch: main
# - Build Command: npm run build
# - Start Command: npm run start:mcp

# 3. 환경변수 설정
# - GOOGLE_AI_API_KEY
# - MCP_PORT=3001
```

### 환경변수 관리

```bash
# 개발 환경
cp .env.example .env.local
# 필수 환경변수 설정

# 프로덕션 환경
# Vercel: Dashboard > Settings > Environment Variables
# Render: Dashboard > Environment
```

## 🔧 설정 최적화

### 성능 최적화

- **Vercel**: Edge 함수 활용
- **Render**: 자동 스케일링 설정
- **CDN**: 정적 자산 캐싱

### 보안 설정

- **API 키**: 환경변수로만 관리
- **CORS**: 허용 도메인 제한
- **Rate Limiting**: API 호출 제한

### 모니터링

- **Vercel Analytics**: 성능 모니터링
- **Render Logs**: 서버 로그 확인
- **헬스체크**: 자동 상태 확인

## 📋 주의사항

- ⚠️ **절대 이동 금지**: 이 파일들은 프로젝트 루트에 있어야 함
- 🔒 **보안**: API 키는 절대 커밋하지 마세요
- 🔄 이 폴더는 **백업/참조용**입니다
- 🚀 실제 배포 설정 변경은 **프로젝트 루트**에서 하세요
- 📊 배포 후 성능 모니터링 필수

## 🔗 관련 링크

- [배포 통합 가이드](../docs/deployment/배포_통합_가이드.md)
- [환경변수 설정 가이드](../../vercel.env.template)
- [MCP 서버 가이드](../docs/operations/MCP_운영_가이드.md)
- [모니터링 대시보드](../docs/monitoring/)

## 🆘 트러블슈팅

### 일반적인 문제

```bash
# Vercel 빌드 실패
vercel logs

# Render 서비스 재시작
# Dashboard > Manual Deploy

# 환경변수 확인
vercel env ls
```

### 연락처

- 🐛 버그 리포트: GitHub Issues
- 💬 질문: 팀 Slack #dev-support
- 📧 긴급: <admin@openmanager.dev>
