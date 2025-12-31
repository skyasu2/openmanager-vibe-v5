# 🔥 GCP 방화벽 규칙 설정 가이드

## 🚨 현재 상태
- **VM 상태**: RUNNING ✅
- **연결 상태**: 모든 포트 차단 ❌
- **원인**: 방화벽 규칙 미설정

## 📋 방화벽 규칙 생성 절차

### 1️⃣ GCP 콘솔 접속
```
https://console.cloud.google.com/networking/firewalls/list?project=openmanager-free-tier
```

### 2️⃣ 방화벽 규칙 생성
**방화벽 규칙 만들기** 클릭 후 다음 설정:

```
이름: allow-mcp-server-port
설명: MCP Server port 10000 access
방향: 입력(Ingress)
작업: 허용
대상: 지정된 태그
대상 태그: mcp-server
소스 IP 범위: 0.0.0.0/0
프로토콜 및 포트: 
  ✅ TCP 지정된 포트: 10000
  ✅ TCP 지정된 포트: 22 (SSH)
```

### 3️⃣ VM 인스턴스에 태그 추가

VM 인스턴스 페이지:
```
https://console.cloud.google.com/compute/instances?project=openmanager-free-tier
```

**mcp-server** 클릭 → **수정** → **네트워크 태그**:
```
네트워크 태그: mcp-server
```

### 4️⃣ 연결 테스트
방화벽 설정 후 연결 테스트:
```bash
curl http://104.154.205.25:10000/health
```

## 🔧 대안: gcloud CLI 명령어 (청구 활성화 후)

```bash
# 방화벽 규칙 생성
gcloud compute firewall-rules create allow-mcp-server-port \
    --allow tcp:10000,tcp:22 \
    --source-ranges 0.0.0.0/0 \
    --target-tags mcp-server \
    --description "Allow MCP server port 10000 and SSH"

# VM에 네트워크 태그 추가  
gcloud compute instances add-tags mcp-server \
    --tags mcp-server \
    --zone us-central1-a
```

## ⚡ 빠른 해결책: SSH 터널링 (임시)

VM에 SSH로 직접 접근이 가능하다면:
```bash
# 로컬에서 SSH 터널 생성
ssh -L 10000:localhost:10000 user@104.154.205.25

# 터널을 통한 테스트
curl http://localhost:10000/health
```