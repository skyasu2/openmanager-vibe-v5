# 📊 관리자 모니터링 가이드

OpenManager v5.17.10-MCP 관리자를 위한 완전한 모니터링 및 관리 가이드입니다.

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [MCP 모니터링 대시보드](#mcp-모니터링-대시보드)
3. [AI 에이전트 관리](#ai-에이전트-관리)
4. [성능 모니터링](#성능-모니터링)
5. [알림 및 경고 관리](#알림-및-경고-관리)
6. [문제 해결 가이드](#문제-해결-가이드)
7. [유지보수 작업](#유지보수-작업)

---

## 🎯 시스템 개요

### 핵심 컴포넌트

```
OpenManager v5.17.10-MCP
├── 🤖 MCP 오케스트레이터 (Model Context Protocol)
├── 🐍 FastAPI AI 엔진 (Python + KoNLPy)
├── 🔄 Keep-Alive 시스템 (Render 스핀다운 방지)
├── 🧠 3단계 컨텍스트 매니저
├── 📊 통합 모니터링 대시보드
└── 🚀 자동 배포 시스템 (Vercel + Render)
```

### 시스템 상태 개요

| 상태 | 의미 | 조치 필요 |
|------|------|-----------|
| 🟢 **Healthy** | 모든 시스템 정상 | 없음 |
| 🟡 **Degraded** | 일부 성능 저하 | 모니터링 강화 |
| 🔴 **Unhealthy** | 심각한 문제 | 즉시 조치 필요 |

---

## 📊 MCP 모니터링 대시보드

### 📍 접속 방법

```bash
# 관리자 대시보드 접속
https://your-app.com/admin/mcp-monitoring

# 직접 URL
https://your-app.onrender.com/admin/mcp-monitoring
```

### 🎛️ 대시보드 구성

#### 1. 전체 상태 요약 카드
```
┌─────────────────────────────────────────────────────────┐
│ ✅ 전체 상태     │ 📊 컴포넌트     │ 📈 총 질의     │ 🎯 성공률     │
│    Healthy      │    4/4 정상     │    1,247개     │    97.2%     │
└─────────────────────────────────────────────────────────┘
```

#### 2. 컴포넌트 상태 탭
- **FastAPI 엔진**: Python AI 서버 상태
- **MCP 오케스트레이터**: 핵심 MCP 시스템
- **Keep-Alive**: 자동 핑 시스템
- **컨텍스트 매니저**: 3단계 컨텍스트 시스템

#### 3. 성능 지표 탭
- **처리 통계**: 총 질의 수, 평균 응답시간, 성공률
- **캐시 효율성**: Redis 캐시 적중률
- **시스템 리소스**: 메모리, CPU 사용량

#### 4. 시스템 액션 탭
- **MCP 시스템 관리**: 핑, 헬스체크, 통계 리셋
- **AI 시스템 관리**: 웜업, 재시작

### 🔄 자동 새로고침 설정

```javascript
// 30초마다 자동 새로고침 (기본값)
setRefreshInterval(30);

// 수동 새로고침
onClick="fetchSystemStatus()"
```

---

## 🤖 AI 에이전트 관리

### 🔐 AI 모드 활성화

1. **프로필 버튼** → **통합 설정** 클릭
2. **AI 모드** 탭 선택
3. **관리자 비밀번호** 입력
4. **AI 모드 활성화** 버튼 클릭

### 📋 AI 에이전트 상태 확인

```bash
# API를 통한 상태 확인
curl https://your-app.com/api/ai/unified?action=health

# 응답 예시
{
  "health": {
    "overall": "healthy",
    "components": {
      "fastapi": { "status": "connected", "latency": 245 },
      "mcp": { "status": "healthy", "initialized": true },
      "keepAlive": { "status": "active", "uptime": 3600 }
    }
  }
}
```

### 🛠️ AI 에이전트 문제 해결

#### 상황 1: AI 응답이 느림 (3초 이상)
```bash
# FastAPI 웜업 실행
POST /api/system/python-warmup

# Keep-Alive 수동 트리거
POST /api/system/mcp-status?action=ping
```

#### 상황 2: AI 응답 품질 저하
1. **통합 설정** → **AI 모드** → **AI 모드 비활성화**
2. 30초 대기 후 재활성화
3. 캐시 정리 실행

#### 상황 3: 연결 끊김
```bash
# 시스템 재시작
PUT /api/ai/unified?action=restart

# 전체 시스템 재초기화
PUT /api/ai/unified?action=initialize
```

---

## 📈 성능 모니터링

### 🎯 주요 KPI 지표

| 지표 | 정상 범위 | 경고 임계값 | 심각 임계값 |
|------|-----------|-------------|-------------|
| 응답 시간 | < 1초 | 1-3초 | > 3초 |
| 성공률 | > 95% | 90-95% | < 90% |
| 캐시 적중률 | > 80% | 70-80% | < 70% |
| Keep-Alive 업타임 | > 99% | 95-99% | < 95% |

### 📊 성능 측정 도구

#### 1. 내장 성능 모니터링
```bash
# 현재 성능 지표 조회
GET /api/system/mcp-status?section=performance

# 응답 예시
{
  "queries": {
    "total": 1247,
    "successRate": 97,
    "avgResponseTime": 892,
    "cacheHitRate": 83
  }
}
```

#### 2. 외부 성능 테스트
```bash
# k6 성능 테스트 실행
k6 run scripts/performance-test.k6.js

# Postman 컬렉션 실행
newman run tests/performance-tests.json
```

### 📋 성능 최적화 체크리스트

- [ ] Redis 캐시 용량 확인 (< 25MB)
- [ ] FastAPI 연결 상태 점검
- [ ] Keep-Alive 연속 실패 확인 (< 3회)
- [ ] MCP 컨텍스트 캐시 상태
- [ ] 동시 접속자 수 모니터링

---

## 🚨 알림 및 경고 관리

### 📧 알림 설정

#### Slack 알림 설정
```bash
# 환경변수 설정
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SLACK_CHANNEL=#alerts

# 알림 테스트
npm run test:alerts
```

#### LogSnag 알림 설정
```bash
# 환경변수 설정
LOGSNAG_TOKEN=your-token
LOGSNAG_PROJECT=openmanager

# 알림 발송 테스트
curl -X POST https://api.logsnag.com/v1/log \
  -H "Authorization: Bearer $LOGSNAG_TOKEN" \
  -d '{"project":"openmanager","event":"Test Alert"}'
```

### 🔔 알림 규칙

| 조건 | 알림 레벨 | 채널 | 조치 |
|------|-----------|------|------|
| 시스템 Unhealthy | 🔴 Critical | Slack + Email | 즉시 대응 |
| 응답시간 > 3초 | 🟡 Warning | Slack | 모니터링 강화 |
| 캐시 적중률 < 70% | 🟡 Warning | LogSnag | 캐시 최적화 |
| Keep-Alive 연속 실패 | 🟠 High | Slack | 네트워크 점검 |

---

## 🔧 문제 해결 가이드

### 🚨 긴급 상황 대응

#### 1. 전체 시스템 다운
```bash
# 1단계: 헬스체크 실행
curl https://your-app.com/api/health

# 2단계: 서비스 재시작
# Render 대시보드에서 수동 재배포

# 3단계: 로그 확인
# Vercel 대시보드 → Functions → Logs
```

#### 2. AI 에이전트 응답 없음
```bash
# 1단계: FastAPI 상태 확인
curl https://your-fastapi.onrender.com/health

# 2단계: 시스템 웜업
POST /api/system/python-warmup

# 3단계: AI 시스템 재시작
PUT /api/ai/unified?action=restart
```

### 🐛 일반적인 문제들

#### 문제: "포트 3001이 이미 사용 중"
**해결책:**
```bash
# 다른 포트로 개발 서버 시작
npm run dev -- -p 3002

# 또는 프로세스 종료 후 재시작
pkill -f "next dev"
npm run dev
```

#### 문제: "Redis 연결 실패"
**해결책:**
```bash
# Upstash Redis 연결 확인
curl -X GET https://your-redis.upstash.io/ping \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"

# 환경변수 재확인
echo $UPSTASH_REDIS_REST_URL
```

#### 문제: "MCP 컨텍스트 로딩 실패"
**해결책:**
```bash
# 컨텍스트 캐시 정리
DELETE /api/ai/unified?target=context

# 컨텍스트 재초기화
PUT /api/ai/unified?action=initialize
```

---

## 🔄 유지보수 작업

### 📅 일일 점검 사항

- [ ] 전체 시스템 상태 확인
- [ ] AI 응답 품질 샘플링 (5-10개 질의)
- [ ] Keep-Alive 통계 확인
- [ ] 에러 로그 검토

### 📅 주간 점검 사항

- [ ] 성능 트렌드 분석
- [ ] 캐시 효율성 최적화
- [ ] 사용자 피드백 검토
- [ ] 보안 로그 점검

### 📅 월간 점검 사항

- [ ] 전체 시스템 성능 리포트 작성
- [ ] 용량 계획 수립 (Redis, 로그 저장소)
- [ ] 백업 및 복구 절차 테스트
- [ ] 업데이트 및 패치 계획

### 🛠️ 정기 유지보수 스크립트

```bash
# 자동 헬스체크 (매 5분)
*/5 * * * * /usr/local/bin/tsx /path/to/scripts/cron-check-health.ts

# 성능 데이터 수집 (매 시간)
0 * * * * /usr/local/bin/k6 run /path/to/scripts/performance-test.k6.js

# 로그 정리 (매일 자정)
0 0 * * * find /path/to/logs -name "*.log" -mtime +7 -delete
```

---

## 📞 지원 및 문의

### 🔗 유용한 링크

- **시스템 대시보드**: `/admin/mcp-monitoring`
- **API 문서**: `/docs/API_REFERENCE.md`
- **배포 가이드**: `/docs/DEPLOYMENT_CHECKLIST.md`
- **성능 테스트**: `/scripts/performance-test.k6.js`

### 📧 연락처

- **시스템 관리자**: admin@openmanager.com
- **기술 지원**: support@openmanager.com
- **긴급 상황**: emergency@openmanager.com

---

## 📝 버전 정보

- **문서 버전**: v1.0.0
- **시스템 버전**: OpenManager v5.17.10-MCP
- **최종 업데이트**: 2024년 12월 19일
- **다음 검토 예정**: 2024년 12월 26일

---

*이 가이드는 OpenManager v5.17.10-MCP 시스템의 안정적인 운영을 위한 완전한 관리자 매뉴얼입니다. 추가 질문이나 업데이트가 필요한 경우 기술 지원팀에 문의해주세요.* 