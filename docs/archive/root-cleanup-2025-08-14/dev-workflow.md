# 🚀 윈도우에서 GCP VM 원격 개발 워크플로우

## 🎯 완성된 개발 환경

### ✅ 설정 완료 항목
- SSH 키 생성 및 설정
- VS Code Remote SSH 구성
- 포트 포워딩 스크립트
- VS Code 확장 프로그램 설치
- 개발 태스크 및 디버그 설정

### 📋 SSH 키 등록 상태
- **SSH 공개 키**: 클립보드에 복사됨
- **Google Cloud Console**: 브라우저에서 열림
- **등록 필요**: VM 메타데이터에 SSH 키 추가

## 🔧 개발 환경 사용법

### 1단계: SSH 키 등록 (1회만)
```
1. 브라우저에서 Google Cloud Console 확인
2. mcp-server VM 편집
3. SSH 키 섹션에 공개 키 붙여넣기
4. 저장 후 VM 재시작 대기
```

### 2단계: VS Code 원격 연결
```
1. VS Code 열기
2. Ctrl+Shift+P
3. "Remote-SSH: Connect to Host"
4. "gcp-vm-dev" 선택
5. 새 창에서 원격 개발 시작
```

### 3단계: 포트 포워딩 활성화
```powershell
# 별도 터미널에서 실행
./port-forward.ps1
```

### 4단계: 개발 서버 시작 (VM에서)
```bash
# Next.js 개발 서버
npm run dev

# MCP 서버
npm run start:mcp

# 테스트
npm run test
```

## 🌐 접속 포트

| 서비스 | VM 포트 | 로컬 포트 | URL |
|--------|---------|-----------|-----|
| Next.js | 3000 | 3000 | http://localhost:3000 |
| API | 8080 | 8080 | http://localhost:8080 |
| MCP 서버 | 10000 | 10000 | http://localhost:10000 |
| PostgreSQL | 5432 | 5432 | localhost:5432 |

## 🛠️ VS Code 태스크 사용

**Ctrl+Shift+P** → **"Tasks: Run Task"** 선택:

- 🚀 **GCP VM 연결**: SSH 터미널 열기
- 🔗 **포트 포워딩 시작**: 백그라운드 포트 포워딩
- 🏥 **VM 헬스체크**: 서버 상태 확인
- 📊 **VM 상태 확인**: 시스템 정보 조회
- 🔧 **원격 개발 환경 설정**: 초기 설정 재실행

## 🐛 디버깅 설정

**F5** 또는 **디버그 패널**에서:

- 🚀 **Next.js 개발 서버 (원격)**: 웹 앱 디버깅
- 🔧 **MCP 서버 디버그**: API 서버 디버깅
- 🧪 **테스트 실행**: 단위 테스트
- 🔍 **타입 체크**: TypeScript 검증

## 📁 원격 파일 시스템

VS Code에서 원격 연결 시:
- VM의 `/home/skyasu2` 디렉토리가 워크스페이스 루트
- 로컬 파일과 동기화되지 않음 (독립적인 환경)
- Git, npm, 모든 개발 도구를 VM에서 직접 사용

## 🔄 개발 워크플로우

### 일반적인 개발 사이클:
1. **로컬**: VS Code에서 원격 연결
2. **로컬**: 포트 포워딩 실행
3. **VM**: 코드 편집 및 개발
4. **VM**: 개발 서버 실행
5. **로컬**: 브라우저에서 `localhost:3000` 접속
6. **실시간**: 코드 변경 시 자동 리로드

### AI 도구 통합:
- **Cursor/VS Code**: 원격 환경에서 AI 코딩 지원
- **GitHub Copilot**: VM에서 직접 사용 가능
- **MCP 서버**: AI 에이전트와 VM 직접 통신

## 🚨 문제 해결

### SSH 연결 실패:
```powershell
# 연결 테스트
ssh -v gcp-vm-dev

# 키 권한 확인
icacls C:\Users\skyas\.ssh\google_compute_engine
```

### 포트 포워딩 실패:
```powershell
# 포트 사용 확인
netstat -an | findstr :3000

# 방화벽 확인
netsh advfirewall firewall show rule name="SSH"
```

### VM 상태 확인:
```powershell
# 직접 헬스체크
curl http://104.154.205.25:10000/health

# VM 인스턴스 상태
./google-cloud-sdk/bin/gcloud compute instances describe mcp-server --zone=us-central1-a
```

## 🎉 완료!

이제 윈도우에서 Google Cloud VM에 직접 개발할 수 있는 완전한 환경이 구축되었습니다!

**다음 단계**: SSH 키 등록 후 `ssh gcp-vm-dev` 테스트