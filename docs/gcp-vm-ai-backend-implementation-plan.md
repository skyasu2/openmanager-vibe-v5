# GCP VM AI Backend 구현 계획

> 📅 작성일: 2025-08-08
> 📌 현재 상태: 미구현
> 🎯 목표: Google AI 모드 강화를 위한 VM 백엔드 구현

## 📊 현재 상황

### VM 정보
- **인스턴스**: e2-micro (1vCPU, 1GB RAM, 30GB SSD)
- **IP 주소**: 104.154.205.25
- **지역**: us-central1-a
- **상태**: RUNNING (하지만 서비스 미구현)

### 포트 상태
- **포트 10000**: 기본 헬스체크만 응답 (/health)
- **포트 10001**: 응답 없음
- **MCP 서버**: 미구현

## 🎯 구현 목표

### Phase 1: 기본 AI 백엔드 (우선순위: 높음)
```python
# main.py - FastAPI 기반 AI 백엔드
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os

app = FastAPI()

# Gemini API 설정
genai.configure(api_key=os.getenv("GOOGLE_AI_API_KEY"))
model = genai.GenerativeModel("gemini-2.0-flash")

class QueryRequest(BaseModel):
    query: str
    mode: str = "natural-language"
    context: dict = {}
    options: dict = {}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "gcp-vm-ai-backend"}

@app.post("/api/query")
async def process_query(request: QueryRequest):
    """자연어 쿼리 처리"""
    try:
        # Gemini API 호출
        response = model.generate_content(request.query)
        
        return {
            "success": True,
            "response": response.text,
            "metadata": {
                "mode": request.mode,
                "model": "gemini-2.0-flash",
                "processingTime": 0  # 실제 측정 필요
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Phase 2: MCP 서버 구현 (우선순위: 중간)
```python
# mcp_server.py - Model Context Protocol 서버
class MCPServer:
    """JSON-RPC 2.0 표준 MCP 서버"""
    
    @app.post("/mcp/query")
    async def mcp_query(request: dict):
        """MCP 표준 쿼리 처리"""
        # JSON-RPC 2.0 형식 처리
        if request.get("jsonrpc") != "2.0":
            return {"jsonrpc": "2.0", "error": {"code": -32600, "message": "Invalid Request"}}
        
        method = request.get("method")
        params = request.get("params", {})
        request_id = request.get("id")
        
        if method == "mcp.query":
            result = await process_mcp_query(params)
            return {
                "jsonrpc": "2.0",
                "result": result,
                "id": request_id
            }
```

### Phase 3: 고급 기능 (우선순위: 낮음)
- **세션 관리**: 대화 컨텍스트 유지
- **딥 분석**: 복잡한 분석 작업
- **스트리밍**: WebSocket 실시간 응답
- **피드백 학습**: 사용자 피드백 기반 개선

## 🚀 배포 계획

### 1. VM 환경 설정
```bash
# SSH 접속
gcloud compute ssh mcp-server --zone=us-central1-a

# Python 환경 설정
sudo apt update
sudo apt install python3.11 python3-pip
pip3 install fastapi uvicorn google-generativeai

# 환경변수 설정
export GOOGLE_AI_API_KEY="..."
```

### 2. 서비스 배포
```bash
# systemd 서비스 생성
sudo nano /etc/systemd/system/ai-backend.service

[Unit]
Description=GCP VM AI Backend
After=network.target

[Service]
Type=simple
User=skyasu2
WorkingDirectory=/home/skyasu2/ai-backend
ExecStart=/usr/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 10000
Restart=always

[Install]
WantedBy=multi-user.target

# 서비스 시작
sudo systemctl enable ai-backend
sudo systemctl start ai-backend
```

### 3. 방화벽 설정
```bash
# 포트 10000, 10001 열기
gcloud compute firewall-rules create allow-ai-backend \
  --allow tcp:10000,tcp:10001 \
  --source-ranges 0.0.0.0/0 \
  --target-tags ai-backend

# 인스턴스에 태그 추가
gcloud compute instances add-tags mcp-server \
  --tags ai-backend \
  --zone us-central1-a
```

## 📋 체크리스트

### 구현 전 준비
- [ ] VM SSH 접속 확인
- [ ] Python 3.11 설치
- [ ] 필요한 패키지 설치
- [ ] 환경변수 설정

### Phase 1 구현
- [ ] FastAPI 기본 구조 생성
- [ ] /health 엔드포인트 구현
- [ ] /api/query 엔드포인트 구현
- [ ] Gemini API 통합
- [ ] 에러 핸들링 추가

### Phase 2 구현
- [ ] JSON-RPC 2.0 파서 구현
- [ ] /mcp/query 엔드포인트 구현
- [ ] MCP 표준 응답 형식 구현
- [ ] 메타데이터 추가

### 테스트 및 검증
- [ ] 로컬 테스트
- [ ] VM 배포
- [ ] 통합 테스트
- [ ] SimplifiedQueryEngine.ts 연동 테스트

## 💡 임시 대안 (현재 사용 중)

MCP 서버가 구현될 때까지:
1. **Google AI 직접 호출**: SimplifiedQueryEngine에서 Gemini API 직접 사용
2. **폴백 메커니즘**: MCP 실패 시 자동으로 Gemini API 사용
3. **환경변수**: `ENABLE_GCP_MCP_INTEGRATION=false`로 비활성화

## 📈 예상 효과

VM AI 백엔드 구현 시:
- **응답 시간**: 30% 개선 (캐싱 및 최적화)
- **컨텍스트 유지**: 세션 기반 대화 지원
- **복잡한 분석**: 8초 타임아웃 제한 없음
- **확장성**: 독립 서버로 부하 분산

## 🔗 관련 파일

- **SimplifiedQueryEngine.ts**: line 753-869 (MCP 통합 코드)
- **.env.local**: ENABLE_GCP_MCP_INTEGRATION 설정
- **test-gcp-vm-mcp-direct.js**: 테스트 스크립트

## 📚 참고 자료

- [Google Cloud VM 설정 가이드](https://cloud.google.com/compute/docs)
- [FastAPI 공식 문서](https://fastapi.tiangolo.com)
- [Gemini API 문서](https://ai.google.dev/api/python/google/generativeai)
- [JSON-RPC 2.0 스펙](https://www.jsonrpc.org/specification)