# 🌐 AI 엔진 API 참조

> **목적**: AI 엔진이 API 관련 질문에 응답할 때 활용할 데이터
> **위치**: src/modules/ai-agent/context/
> **업데이트**: API 변경시 함께 업데이트

## 🎯 핵심 API 엔드포인트

### **AI 엔진**
```
POST /api/ai/enhanced
- 용도: 스마트 AI 쿼리 처리
- 입력: {"query": "string", "sessionId": "string"}
- 출력: AI 응답 + 관련 문서 + 성능 메트릭
- 예시: 시스템 분석, 문제 해결, 최적화 가이드
```

### **시스템 관리**
```
GET /api/system/status
- 용도: 시스템 전체 상태 확인
- 출력: 환경별 서버 상태 + 성능 지표

POST /api/system/start
- 용도: 모니터링 시스템 시작
- 효과: 자동 데이터 수집 + 알림 활성화

POST /api/system/stop
- 용도: 모니터링 시스템 중지
- 효과: 리소스 절약 + 유지보수 모드
```

### **서버 모니터링**
```
GET /api/servers
- 용도: 전체 서버 목록 조회
- 환경별: development(16개), test(4개), staging/production(9개)

GET /api/servers/[id]
- 용도: 특정 서버 상세 정보
- 포함: CPU, 메모리, 네트워크, 디스크

POST /api/servers/[id]/restart
- 용도: 서버 재시작
- 조건: 관리자 권한 필요
```

### **메트릭 및 성능**
```
GET /api/metrics/realtime
- 용도: 실시간 성능 지표
- 주기: 5초마다 업데이트
- 데이터: CPU, RAM, 네트워크, 응답시간

GET /api/metrics/history
- 용도: 과거 성능 데이터
- 범위: 최근 24시간/7일/30일
- 형식: 시계열 데이터 JSON
```

### **알림 시스템**
```
GET /api/alerts
- 용도: 현재 활성 알림 목록
- 분류: critical, warning, info

POST /api/alerts/config
- 용도: 알림 임계값 설정
- 설정: CPU(80%), 메모리(85%), 디스크(90%)

POST /api/notifications/test
- 용도: 알림 테스트 발송
- 지원: 이메일, Slack, 웹훅
```

## 🔧 환경별 API 동작

### **Development**
```yaml
API 응답 시간: 빠름 (디버깅 정보 포함)
로깅: 상세한 debug 로그
오류 처리: 개발자 친화적 메시지
제한: 없음 (자유로운 테스트)
```

### **Production**
```yaml
API 응답 시간: 최적화됨
로깅: 최소한의 error 로그만
오류 처리: 사용자 친화적 메시지
제한: Rate limiting 적용
```

## 🚀 일반적인 사용 시나리오

### **시스템 상태 확인**
```bash
# 1. 전체 시스템 상태
curl http://localhost:3000/api/system/status

# 2. AI로 상태 분석
curl -X POST http://localhost:3000/api/ai/enhanced \
  -H "Content-Type: application/json" \
  -d '{"query": "현재 시스템 상태는?", "sessionId": "monitoring"}'
```

### **성능 문제 진단**
```bash
# 1. 실시간 메트릭 확인
curl http://localhost:3000/api/metrics/realtime

# 2. AI로 성능 분석
curl -X POST http://localhost:3000/api/ai/enhanced \
  -H "Content-Type: application/json" \
  -d '{"query": "성능이 느려진 원인 분석", "sessionId": "troubleshoot"}'
```

### **알림 설정 및 관리**
```bash
# 1. 현재 알림 확인
curl http://localhost:3000/api/alerts

# 2. AI로 알림 설정 도움
curl -X POST http://localhost:3000/api/ai/enhanced \
  -H "Content-Type: application/json" \
  -d '{"query": "CPU 사용률 알림 설정 방법", "sessionId": "config"}'
```

## 📊 응답 형식 예시

### **AI 엔진 응답**
```json
{
  "success": true,
  "result": {
    "answer": "시스템 상태 분석 결과...",
    "confidence": 0.95,
    "sources": ["system-knowledge.md", "api-reference.md"],
    "reasoning": ["search intent detected"],
    "mcpActions": []
  },
  "performance": {
    "aiProcessingTime": 500,
    "totalApiTime": 1200
  }
}
```

### **시스템 상태 응답**
```json
{
  "environment": "development",
  "servers": {
    "total": 16,
    "active": 14,
    "inactive": 2
  },
  "performance": {
    "avgCpu": 45.2,
    "avgMemory": 62.8,
    "avgResponseTime": 150
  }
}
```

## 🔍 오류 처리

### **일반적인 오류**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_QUERY",
    "message": "쿼리 파라미터가 필요합니다",
    "details": "query 필드는 문자열이어야 합니다"
  }
}
```

### **서버 오류**
```json
{
  "success": false,
  "error": {
    "code": "SERVER_UNAVAILABLE",
    "message": "서버가 일시적으로 사용할 수 없습니다",
    "retryAfter": 30
  }
}
```

## 🛡️ 보안 및 인증

### **API 키 (프로덕션)**
```bash
# 환경변수 설정
export API_SECRET_KEY="your-secret-key"

# 요청시 헤더 포함
curl -H "X-API-Key: your-secret-key" \
  http://localhost:3000/api/admin/...
```

### **Rate Limiting**
```
- 기본: 100 요청/분
- AI 엔진: 20 요청/분 (처리 시간 고려)
- 관리자 API: 50 요청/분
```

---

**관리**: src/modules/ai-agent/context/
**활용**: AI 엔진의 API 관련 질문 응답시 참조
**업데이트**: API 스펙 변경시 즉시 반영 