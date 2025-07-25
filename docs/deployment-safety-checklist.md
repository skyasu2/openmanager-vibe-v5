# 🔒 Vercel 배포 안전성 체크리스트

## 📊 점검 일시: 2025년 7월 26일

## ✅ 완료된 보안 조치

### 1. **.vercelignore 업데이트**

다음 항목들이 배포에서 제외되도록 설정했습니다:

#### 개발 전용 폴더

- `.serena-mcp/` - Python 기반 serena MCP 서버
- `.serena/` - serena 관련 파일
- `local-dev/` - 로컬 개발 전용 스크립트
- `.kiro/` - 개발 도구
- `.cursor/` - Cursor 에디터 설정

#### MCP 관련 파일 (개발 전용)

- `.mcp.json` - MCP 서버 설정
- `mcp-servers/` - MCP 서버 폴더
- `.claude/` - Claude 개발 도구
- 기타 MCP 관련 파일 패턴

#### 환경변수 파일

- `.env.local`
- `.env.production`
- `.env.development`
- `.env.test`
- 모든 `.env*` 파일

#### 보안 관련 파일

- `.github-auth.json`
- `*-auth.json`
- `*-token.json`
- `*-secret.json`
- `*-key.json`

#### 백업 및 임시 파일

- `*.backup`
- `*.bak`
- `*.tmp`
- `*.temp`
- `env-backup*`

#### 개발 문서

- `CLAUDE.md`
- `GEMINI.md`
- `CHANGELOG.md`
- `ENV-BACKUP-GUIDE.md`
- `SECURITY-SUMMARY.md`

### 2. **개발 전용 API 엔드포인트 보호**

다음 API들에 프로덕션 환경 체크 추가:

- `/api/auth/debug/route.ts` - NODE_ENV 체크 추가
- `/api/auth/test/route.ts` - NODE_ENV 체크 추가
- `/api/dev/key-manager/route.ts` - 이미 보호됨

```typescript
// 프로덕션에서 404 반환
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json(
    { error: 'This endpoint is not available in production' },
    { status: 404 }
  );
}
```

## ⚠️ 주의사항

### MCP 서버 배포 정책

- **개발용 MCP**: GitHub까지만 배포 (로컬 전용)
- **Vercel/GCP**: 개발 MCP는 배포하지 않음
- **프로덕션**: MCP 서버 설정 파일 완전 제외

### 환경변수 관리

- 민감한 환경변수는 Vercel 대시보드에서만 관리
- `.env` 파일들은 절대 커밋하지 않음
- 암호화된 파일도 배포에서 제외

## 🔍 정기 점검 항목

1. 새로운 개발 전용 파일 생성 시 `.vercelignore` 업데이트
2. 새로운 디버그/테스트 API 생성 시 환경 체크 추가
3. 환경변수 파일 노출 여부 확인
4. 백업/임시 파일 정리

## 📝 추가 권장사항

1. **API 라우트 감사**
   - 모든 `/api/dev/*`, `/api/test/*`, `/api/debug/*` 경로 점검
   - 민감한 정보 노출 가능성 확인

2. **환경변수 감사**
   - `vercel env pull` 명령으로 프로덕션 환경변수 확인
   - 불필요한 개발용 환경변수 제거

3. **빌드 로그 확인**
   - Vercel 빌드 로그에서 경고 메시지 확인
   - 포함된 파일 크기 및 수량 모니터링
