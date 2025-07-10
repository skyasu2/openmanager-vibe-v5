# Vercel 환경변수 업데이트 가이드

## MCP 서버 변경사항 반영

### 1. Vercel Dashboard 접속
1. https://vercel.com 로그인
2. `openmanager-vibe-v5` 프로젝트 선택
3. Settings → Environment Variables 이동

### 2. 업데이트할 환경변수

#### 필수 변경
```bash
# 기존 (Render URL)
GCP_MCP_SERVER_URL=https://openmanager-vibe-v5.onrender.com

# 변경 (GCP VM URL)
GCP_MCP_SERVER_URL=http://104.154.205.25:10000
```

#### 삭제 권장 (있는 경우)
- `RENDER_API_KEY`
- `RENDER_SERVICE_ID`
- `MCP_AI_ENGINE_ENABLED` (컨텍스트 보조로 역할 변경)

### 3. 추가 설정 (선택사항)

```bash
# MCP 서버 타입 명시
MCP_SERVER_TYPE=context-assistant

# MCP 용도 설정
MCP_PURPOSE=context-analysis
```

### 4. 배포 확인
1. 환경변수 저장 후 자동 재배포 대기
2. 배포 완료 후 `/api/ai/status` 엔드포인트 확인
3. MCP Context Assistant가 정상 상태인지 확인

### 5. 로컬 개발 환경 동기화
```bash
# .env.local 파일도 동일하게 업데이트
GCP_MCP_SERVER_URL=http://104.154.205.25:10000
```

## 주의사항
- GCP VM의 MCP 서버는 24시간 운영 중
- 컨텍스트 분석 전용으로 사용되며 메인 AI 엔진은 아님
- 수파베이스 RAG 엔진의 보조 역할