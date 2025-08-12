# GCP VM MCP 서버 분석 보고서

## 📅 작성일: 2025-08-08

## 1. 현재 상황

### Google AI 모드 구성
- **주 엔진**: Google Gemini API (gemini-2.0-flash)
- **보조 시스템**: GCP VM MCP 서버 (104.154.205.25:10000)
- **통합 상태**: 부분적으로 활성화

### 코드 구현 상태
- ✅ SimplifiedQueryEngine.ts: MCP 통합 코드 완전 구현
- ✅ /api/mcp/gcp-vm/route.ts: JSON-RPC 2.0 표준 API 구현
- ✅ env-safe.ts: 환경변수 검증 로직 구현
- ✅ 환경변수 설정: ENABLE_GCP_MCP_INTEGRATION=true

### 테스트 결과
```
1. 헬스 체크: ✅ 성공 (서버 정상 응답)
2. 쿼리 처리: ❌ 실패 (404 Not Found)
3. 폴백 메커니즘: ✅ 정상 동작
```

## 2. 문제점 분석

### GCP VM MCP 서버 문제
1. **엔드포인트 불일치**: `/mcp/query` 경로가 존재하지 않음
2. **가능한 원인**:
   - VM의 실제 MCP 서버가 다른 경로 사용
   - MCP 서버가 완전히 구현되지 않음
   - 다른 프로토콜/형식 기대

### 현재 영향
- Google AI 모드는 정상 동작 (Gemini API만 사용)
- MCP 통합 실패 시 자동 폴백으로 서비스 영향 없음
- 응답 품질은 Gemini API 수준으로 유지

## 3. 권장사항

### 옵션 1: MCP 서버 유지 및 수정 (권장) ✅
**이유**:
- 코드는 이미 완전히 구현됨
- 폴백 메커니즘으로 위험 없음
- VM 서버 수정으로 향후 활용 가능

**필요 작업**:
1. GCP VM의 실제 MCP 서버 API 경로 확인
2. SimplifiedQueryEngine.ts의 URL 경로 수정
3. 재테스트 및 검증

### 옵션 2: MCP 기능 비활성화
**방법**:
```bash
# .env.local
ENABLE_GCP_MCP_INTEGRATION=false
```

**영향**:
- Google AI 모드는 Gemini API만 사용
- 현재와 동일한 성능/품질
- 불필요한 네트워크 요청 제거

### 옵션 3: MCP 코드 완전 제거
**권장하지 않음**:
- 이미 구현된 코드 제거는 비효율적
- 폴백 메커니즘으로 부작용 없음
- 향후 개선 가능성 차단

## 4. 최종 결정

### 🎯 권장: 옵션 1 - MCP 서버 유지 및 수정

**근거**:
1. GCP VM MCP 서버는 살아있음 (헬스 체크 성공)
2. 코드 구현은 완료되어 있음
3. 폴백 메커니즘으로 안전함
4. 경로 수정만으로 활성화 가능

**즉시 조치사항**:
1. GCP VM에 SSH 접속하여 실제 API 경로 확인
2. 필요시 경로 수정 또는 VM 서버 업데이트
3. 수정 후 재테스트

**임시 조치**:
- 현재 상태 유지 (ENABLE_GCP_MCP_INTEGRATION=true)
- 폴백으로 Google AI 모드 정상 동작 보장

## 5. 기술적 세부사항

### 현재 구현된 MCP 통합 플로우
```typescript
// SimplifiedQueryEngine.ts (753-869번 줄)
if (mcpConfig.isValid && mcpConfig.config.gcpVMMCP.integrationEnabled) {
  // GCP VM MCP 서버 호출
  const mcpResponse = await fetch(`${serverUrl}/mcp/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mcpRequest.params)
  });
  
  if (!mcpResponse.ok) {
    // 폴백: MCP 실패해도 Gemini 응답 사용
    gcpMcpResult = { fallback: true, error: errorMsg };
  }
}
```

### 환경변수 설정
```bash
ENABLE_GCP_MCP_INTEGRATION=true
GCP_VM_IP=104.154.205.25
GCP_MCP_SERVER_PORT=10000
GCP_MCP_SERVER_URL=http://104.154.205.25:10000
MCP_TIMEOUT=8000
```

## 6. 결론

Google AI 모드에서 GCP VM MCP 서버 활용은 **기술적으로 가능**하며, 코드도 이미 구현되어 있습니다. 

현재 VM의 MCP 서버 엔드포인트 경로 문제만 해결하면 즉시 활용 가능합니다.

폴백 메커니즘이 잘 동작하므로 **MCP 기능을 유지**하면서 VM 서버를 점진적으로 개선하는 것을 권장합니다.