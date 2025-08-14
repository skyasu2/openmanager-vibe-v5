# 🚀 윈도우 GCP VM SSH 접속 빠른 해결책

## 현재 상황
- ✅ VM 정상 작동 중 (IP: 104.154.205.25)
- ✅ SSH 키 생성 완료
- ❌ gcloud 인증 필요
- ❌ SSH 공개 키 미등록

## 🌟 즉시 사용 가능한 방법

### 1. Cloud Shell 사용 (권장 ⭐)
```
브라우저에서 열기:
https://shell.cloud.google.com/?project=openmanager-free-tier

Cloud Shell에서 실행:
gcloud compute ssh mcp-server --zone=us-central1-a
```

### 2. VM 상태 모니터링 (로컬에서)
```powershell
# 헬스체크
curl http://104.154.205.25:10000/health

# 시스템 상태
curl http://104.154.205.25:10000/api/status

# 메트릭
curl http://104.154.205.25:10000/api/metrics
```

### 3. gcloud 인증 완료 후 SSH
```powershell
# 1. 인증
./google-cloud-sdk/bin/gcloud auth login

# 2. 프로젝트 설정
./google-cloud-sdk/bin/gcloud config set project openmanager-free-tier

# 3. SSH 키 등록
./google-cloud-sdk/bin/gcloud compute instances add-metadata mcp-server --zone=us-central1-a --metadata-from-file ssh-keys=ssh-key-temp.txt

# 4. SSH 접속
ssh -i ~/.ssh/google_compute_engine skyasu2@104.154.205.25
```

## 🔧 SSH 키 파일 위치
- **Private Key**: `C:\Users\skyas\.ssh\google_compute_engine`
- **Public Key**: `C:\Users\skyas\.ssh\google_compute_engine.pub`

## 📊 VM 정보
- **IP**: 104.154.205.25
- **Zone**: us-central1-a
- **Instance**: mcp-server
- **User**: skyasu2
- **Project**: openmanager-free-tier

## 💡 문제 해결 팁

1. **gcloud 인증 문제**: 브라우저에서 수동 인증
2. **SSH 키 문제**: Cloud Console에서 메타데이터 직접 편집
3. **네트워크 문제**: 방화벽 규칙 확인

---
**상태**: VM 정상, SSH 키 생성 완료, 인증 필요
**권장**: Cloud Shell 사용