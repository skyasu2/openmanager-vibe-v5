# MCP Filesystem Server

HTTP 헬스체크를 지원하는 커스텀 파일시스템 MCP 서버입니다.

## 🎯 목적

이 서버는 두 가지 주요 기능을 제공합니다:
1. **MCP 파일시스템 기능**: 파일 읽기/쓰기, 디렉터리 탐색
2. **HTTP 헬스체크**: GCP 등 클라우드 플랫폼 배포 지원

## 🔧 주요 기능

### 파일시스템 작업
- 안전한 파일 읽기/쓰기
- 디렉터리 목록 조회
- 경로 보안 검증 (허용된 디렉터리만 접근)
- UTF-8 인코딩 지원

### HTTP 헬스체크
- `/health` 엔드포인트 제공
- 30초 캐싱으로 과도한 헬스체크 방지
- 업타임 모니터링

## 📋 설정

### 환경 변수
- `PORT`: HTTP 서버 포트 (기본: 10000)
- `NODE_ENV`: production 시 HTTP 서버 자동 활성화
- `ENABLE_HTTP`: true로 설정 시 HTTP 서버 강제 활성화

### 허용된 디렉터리
```javascript
const ALLOWED_DIRECTORIES = [
  process.cwd(),
  path.join(process.cwd(), 'src'),
  path.join(process.cwd(), 'docs'),
  path.join(process.cwd(), 'mcp-server'),
  path.join(process.cwd(), 'config'),
];
```

## 🚀 사용법

### 로컬 실행
```bash
npm install
npm start        # MCP 서버 시작
npm run health   # 헬스체크 테스트
```

### GCP 배포
1. GCP에서 Cloud Run 서비스 생성
2. 환경 변수 설정:
   - `NODE_ENV=production`
   - `PORT=10000`
3. 빌드 명령: `npm install`
4. 시작 명령: `npm start`

### 헬스체크 테스트
```bash
# 별도 터미널에서
node health-check.js

# 또는 curl 사용
curl http://localhost:10000/health
```

## 🔒 보안

- 경로 순회 공격 방지
- 허용된 디렉터리만 접근 가능
- 에러 메시지에 민감한 정보 노출 방지

## 📝 참고사항

- Claude Code는 기본적으로 공식 `@modelcontextprotocol/server-filesystem` 패키지 사용
- 이 서버는 HTTP 헬스체크가 필요한 배포 환경을 위한 것
- 로컬 개발에서는 공식 패키지 사용 권장