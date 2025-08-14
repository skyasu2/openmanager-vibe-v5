# Windows에서 GCP VM SSH 접속 가이드

## 🚨 Windows SSH 제한사항

Windows에서 gcloud compute ssh는 기본적으로 **지원되지 않습니다**.
```
ERROR: (gcloud.compute.ssh) Your platform does not support SSH.
```

## ✅ 대체 솔루션 (3가지)

### 방법 1: 🌐 Cloud Shell 사용 (권장)
**브라우저에서 직접 접속 - 가장 간단!**

1. **Cloud Shell 열기**:
   ```
   https://shell.cloud.google.com/?project=openmanager-free-tier
   ```

2. **SSH 접속**:
   ```bash
   gcloud compute ssh mcp-server --zone=us-central1-a
   ```

### 방법 2: 🔧 Windows OpenSSH 사용

1. **SSH 키 수동 생성**:
   ```powershell
   ssh-keygen -t rsa -b 2048 -f ~/.ssh/google_compute_engine
   ```

2. **공개 키를 VM에 추가**:
   ```bash
   # Git Bash에서 실행
   ./google-cloud-sdk/bin/gcloud compute instances add-metadata mcp-server \
     --zone=us-central1-a \
     --metadata-from-file ssh-keys=~/.ssh/google_compute_engine.pub
   ```

3. **SSH 직접 접속**:
   ```bash
   ssh -i ~/.ssh/google_compute_engine skyasu2@104.154.205.25
   ```

### 방법 3: 🖥️ PuTTY 사용

1. **PuTTY 다운로드**: https://www.putty.org/

2. **PuTTYgen으로 키 생성**:
   - Type: RSA
   - Bits: 2048
   - Save private key (.ppk)

3. **PuTTY 설정**:
   - Host: 104.154.205.25
   - Port: 22
   - Connection > SSH > Auth: Private key 파일 선택
   - Username: skyasu2

## 🎯 현재 사용 가능한 방법

### Git Bash에서 gcloud 실행 후 Cloud Shell 사용:
```bash
# 1. Git Bash에서 인증
./google-cloud-sdk/bin/gcloud auth login

# 2. 브라우저에서 Cloud Shell 열기
# https://shell.cloud.google.com

# 3. Cloud Shell에서 SSH
gcloud compute ssh mcp-server --zone=us-central1-a
```

## 📊 VM 상태 확인 (Windows에서 가능)

```bash
# 서비스 헬스체크
curl http://104.154.205.25:10000/health

# API 상태
curl http://104.154.205.25:10000/api/status

# 메트릭
curl http://104.154.205.25:10000/api/metrics
```

## 🔑 SSH 접속 정보

- **VM IP**: 104.154.205.25
- **Zone**: us-central1-a
- **Instance**: mcp-server
- **User**: skyasu2@gmail.com
- **Project**: openmanager-free-tier

## 💡 추천 워크플로우

1. **일반 작업**: Cloud Shell 사용 (브라우저)
2. **API 테스트**: curl 명령어 (로컬)
3. **파일 전송**: gcloud compute scp (Git Bash)
4. **로그 확인**: Cloud Console UI

---

**작성일**: 2025-08-14 09:15 KST
**상태**: Windows SSH 직접 지원 불가, Cloud Shell 권장