# 🚀 MCP 시스템 배포 체크리스트

## ✅ 배포 완료 확인 사항

### 1. 기본 서비스 확인
- [ ] **웹사이트 접속 확인**
  ```bash
  curl -I https://your-app.onrender.com
  # 응답: HTTP/2 200
  ```

- [ ] **기본 헬스 체크**
  ```bash
  curl https://your-app.onrender.com/api/health
  # 응답: {"status": "ok", "timestamp": ...}
  ```

### 2. MCP 시스템 확인
- [ ] **MCP 상태 API**
  ```bash
  curl https://your-app.onrender.com/api/system/mcp-status
  # 응답: {"success": true, "data": {...}}
  ```

- [ ] **통합 AI 시스템 헬스**
  ```bash
  curl https://your-app.onrender.com/api/ai/unified?action=health
  # 응답: {"health": {...}}
  ```

### 3. FastAPI 연동 확인
- [ ] **Python 엔진 웜업**
  ```bash
  curl -X POST https://your-app.onrender.com/api/system/python-warmup
  # 응답: {"success": true, "warmupTime": ...}
  ```

- [ ] **AI 질의 테스트**
  ```bash
  curl -X POST https://your-app.onrender.com/api/ai/unified \
    -H "Content-Type: application/json" \
    -d '{"question": "시스템 상태는 어떤가요?"}'
  # 응답: {"answer": "...", "confidence": ...}
  ```

### 4. 환경 변수 설정 확인
- [ ] **FASTAPI_BASE_URL**: Render FastAPI 서비스 URL
- [ ] **UPSTASH_REDIS_REST_URL**: Redis 연결 URL
- [ ] **UPSTASH_REDIS_REST_TOKEN**: Redis 인증 토큰
- [ ] **NEXT_PUBLIC_APP_URL**: 프론트엔드 URL

---

## 🔄 다음 단계 가이드

### 1단계: 실시간 모니터링 설정 ⏱️

**모니터링 대시보드 접속**
```
https://your-app.onrender.com/admin/mcp-monitoring
```

**확인 사항:**
- [ ] 전체 시스템 상태가 "정상"으로 표시
- [ ] 모든 컴포넌트 상태 확인 (FastAPI, MCP, Keep-Alive)
- [ ] 자동 새로고침 기능 동작
- [ ] 시스템 액션 버튼들 정상 작동

### 2단계: Keep-Alive 시스템 검증 🔄

**자동 핑 확인**
- [ ] 10분 간격으로 자동 핑 실행 중
- [ ] Render 15분 스핀다운 방지 동작
- [ ] 연속 성공/실패 카운트 정상

**수동 테스트**
```bash
# 시스템 핑 트리거
curl -X POST https://your-app.onrender.com/api/system/mcp-status \
  -H "Content-Type: application/json" \
  -d '{"action": "ping"}'
```

### 3단계: AI 엔진 최적화 🧠

**FastAPI 성능 확인**
- [ ] 첫 요청 응답시간 < 30초 (콜드 스타트)
- [ ] 후속 요청 응답시간 < 5초
- [ ] 한국어 NLP 분석 정상 동작

**캐시 시스템 검증**
- [ ] Upstash Redis 연결 상태 확인
- [ ] 동일 질의 재요청 시 캐시 응답 확인
- [ ] 캐시 적중률 모니터링

### 4단계: 성능 벤치마크 📊

**부하 테스트 실행**
```bash
# 5개 동시 요청 테스트
for i in {1..5}; do
  curl -X POST https://your-app.onrender.com/api/ai/unified \
    -H "Content-Type: application/json" \
    -d "{\"question\": \"테스트 질의 $i\"}" &
done
wait
```

**성능 지표 확인**
- [ ] 평균 응답시간 < 10초
- [ ] 성공률 > 95%
- [ ] 동시 요청 처리 정상

### 5단계: 운영 모니터링 구성 📈

**알림 설정 (선택사항)**
- [ ] 시스템 장애 시 알림 (Slack, 이메일)
- [ ] 성능 저하 시 경고
- [ ] 일일/주간 상태 리포트

**로그 모니터링**
- [ ] Render 로그 확인
- [ ] 에러 패턴 분석
- [ ] 성능 병목 지점 파악

### 6단계: 사용자 테스트 👥

**기본 기능 테스트**
- [ ] 대시보드 접속 및 네비게이션
- [ ] AI 질의 기능 정상 동작
- [ ] 한국어 대화 품질 확인

**고급 기능 테스트**
- [ ] 컨텍스트 유지 대화
- [ ] 시스템 상태 질의 응답
- [ ] 문제 해결 가이드 제공

---

## 🛠️ 문제 해결 가이드

### 자주 발생하는 문제들

#### 1. FastAPI 연결 실패
**증상**: `FastAPI 연결 상태: 오류`
**해결방법**:
```bash
# FastAPI 서비스 상태 확인
curl https://openmanager-ai-engine.onrender.com/health

# 웜업 재시도
curl -X POST https://your-app.onrender.com/api/system/python-warmup
```

#### 2. Redis 캐시 오류
**증상**: 캐시 관련 에러 로그
**해결방법**:
- Upstash Redis 대시보드에서 연결 상태 확인
- 환경 변수 `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` 재확인

#### 3. 메모리 부족 오류
**증상**: `Memory limit exceeded`
**해결방법**:
- Render 플랜 업그레이드 고려
- 캐시 정리: `DELETE /api/ai/unified`

#### 4. 응답 시간 지연
**증상**: 응답시간 > 30초
**해결방법**:
```bash
# AI 엔진 웜업 실행
curl -X POST https://your-app.onrender.com/api/system/python-warmup

# 시스템 재시작
curl -X PUT https://your-app.onrender.com/api/ai/unified?action=restart
```

---

## 📋 운영 체크리스트 (매일 확인)

### 일일 모니터링 (5분)
- [ ] 전체 시스템 상태 확인
- [ ] 성능 지표 검토 (응답시간, 성공률)
- [ ] 에러 로그 확인
- [ ] Keep-Alive 정상 동작 확인

### 주간 점검 (30분)
- [ ] 성능 트렌드 분석
- [ ] 캐시 사용량 및 효율성 검토
- [ ] 사용자 피드백 수집
- [ ] 시스템 최적화 계획 수립

### 월간 리뷰 (2시간)
- [ ] 전체 시스템 아키텍처 검토
- [ ] 성능 벤치마크 재실행
- [ ] 보안 업데이트 적용
- [ ] 새로운 기능 계획 수립

---

## 🚀 고급 설정 옵션

### 성능 최적화
```javascript
// Keep-Alive 간격 조정 (src/services/ai/keep-alive-system.ts)
const config = {
  interval: 8 * 60 * 1000, // 8분으로 단축
  enableSmartScheduling: true
};

// 캐시 TTL 조정 (src/services/python-bridge/fastapi-client.ts)
const config = {
  cacheTTL: 600, // 10분으로 연장
  cacheEnabled: true
};
```

### 모니터링 알림
```javascript
// Slack 알림 추가 (선택사항)
const webhookUrl = process.env.SLACK_WEBHOOK_URL;
if (systemHealth.overall === 'unhealthy') {
  await fetch(webhookUrl, {
    method: 'POST',
    body: JSON.stringify({
      text: `🚨 MCP 시스템 장애 발생: ${systemHealth.issues.join(', ')}`
    })
  });
}
```

---

## 📞 지원 및 문의

### 기술 지원
- **GitHub Issues**: 버그 리포트 및 기능 요청
- **문서**: `/docs/MCP_SYSTEM_INTEGRATION_REPORT.md` 참조
- **모니터링**: `/admin/mcp-monitoring` 대시보드 활용

### 성능 문제
1. 모니터링 대시보드에서 병목 지점 확인
2. 로그 분석으로 원인 파악
3. 필요시 시스템 재시작 또는 캐시 정리

### 새로운 기능 추가
1. MCP 표준을 준수하여 개발
2. 기존 컨텍스트 시스템과 통합
3. 테스트 스크립트로 검증 후 배포

---

**🎉 축하합니다! MCP 기반 AI 에이전트 시스템이 성공적으로 배포되었습니다.**

이제 실시간 모니터링을 통해 시스템을 관리하고, 사용자들에게 고품질의 AI 서비스를 제공할 수 있습니다. 