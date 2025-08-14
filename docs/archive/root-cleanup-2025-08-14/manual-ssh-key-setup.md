# 🔑 수동 SSH 키 등록 가이드

## 현재 상황
- ✅ SSH 키 생성 완료
- ✅ VS Code Remote SSH 설정 완료
- ✅ VS Code 확장 프로그램 설치 완료
- ❌ SSH 키가 VM에 미등록

## 🚀 수동 SSH 키 등록 방법

### 방법 1: Google Cloud Console 사용 (권장)

1. **Cloud Console 열기**:
   ```
   https://console.cloud.google.com/compute/instances?project=openmanager-free-tier
   ```

2. **VM 인스턴스 선택**:
   - `mcp-server` 클릭

3. **편집 모드 진입**:
   - 상단의 "편집" 버튼 클릭

4. **SSH 키 추가**:
   - "보안" 섹션으로 스크롤
   - "SSH 키" 항목 찾기
   - "항목 추가" 클릭

5. **공개 키 복사**:
   ```
   파일 위치: C:\Users\skyas\.ssh\google_compute_engine.pub
   ```

6. **키 형식**:
   ```
   ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC3NnxZMhIrSOBIGmPoCThOrLB3edUqMqqBvZAZFP28PkOKJIegvvfL... skyasu2
   ```

7. **저장**:
   - "저장" 버튼 클릭
   - VM 재시작 대기 (약 1-2분)

### 방법 2: gcloud 명령어 사용

```powershell
# 1. 인증
./google-cloud-sdk/bin/gcloud auth login

# 2. SSH 키 등록
./google-cloud-sdk/bin/gcloud compute instances add-metadata mcp-server --zone=us-central1-a --metadata-from-file ssh-keys=C:\Users\skyas\.ssh\google_compute_engine.pub --project=openmanager-free-tier
```

## 🧪 연결 테스트

SSH 키 등록 후 다음 명령어로 테스트:

```powershell
# 직접 SSH 연결
ssh -i C:\Users\skyas\.ssh\google_compute_engine skyasu2@104.154.205.25

# 또는 설정된 호스트 사용
ssh gcp-vm-dev
```

## 🎯 VS Code 원격 개발 시작

1. **VS Code 열기**
2. **Ctrl+Shift+P** 누르기
3. **"Remote-SSH: Connect to Host"** 입력
4. **"gcp-vm-dev"** 선택
5. **새 VS Code 창에서 원격 개발 시작!**

## 🔗 포트 포워딩 활성화

로컬에서 VM 서비스에 접근하려면:

```powershell
./port-forward.ps1
```

그러면 다음 포트들이 포워딩됩니다:
- `localhost:3000` → VM의 3000 포트 (Next.js)
- `localhost:8080` → VM의 8080 포트 (API)
- `localhost:10000` → VM의 10000 포트 (MCP 서버)
- `localhost:5432` → VM의 5432 포트 (PostgreSQL)

## 📊 개발 워크플로우

1. **VS Code에서 원격 연결**
2. **포트 포워딩 실행**
3. **VM에서 개발 서버 시작**
4. **로컬 브라우저에서 `localhost:3000` 접속**
5. **실시간 개발 및 디버깅**

---
**다음 단계**: SSH 키 등록 후 `ssh gcp-vm-dev` 테스트