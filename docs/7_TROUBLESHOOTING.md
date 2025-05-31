# 🔧 OpenManager v5 - 문제해결 가이드

**버전**: v5.13.5  
**최종 업데이트**: 2025-05-31  
**대상**: 개발자, 시스템 관리자, 사용자  

---

## 🎯 빠른 문제 진단

### 시스템 상태 확인
```bash
# 기본 헬스체크
curl http://localhost:3001/api/health

# 시스템 상태 확인
curl http://localhost:3001/api/system/status

# AI 에이전트 상태
curl http://localhost:3001/api/ai-agent/admin/status
```

### 일반적인 문제 해결 순서
1. **로그 확인** → 브라우저 콘솔/서버 로그
2. **네트워크 상태** → 연결성 확인
3. **환경 변수** → 설정 값 검증
4. **재시작** → 서비스 재시작
5. **캐시 정리** → 브라우저/서버 캐시

---

## 🚨 자주 발생하는 문제들

### 1. 시스템 시작/종료 문제

#### 문제: 시스템이 시작되지 않음
```bash
증상: "시스템 시작" 버튼 클릭 후 응답 없음
```

**해결 방법:**
```bash
# 1. 포트 충돌 확인
netstat -ano | findstr :3001  # Windows
lsof -i :3001                 # macOS/Linux

# 2. Node.js 프로세스 정리
taskkill /F /IM node.exe      # Windows
pkill -f node                 # macOS/Linux

# 3. 깔끔한 재시작
npm run dev:clean
```

#### 문제: 시스템이 종료되지 않음
```bash
증상: "시스템 종료" 버튼이 작동하지 않음
```

**해결 방법:**
```bash
# 1. TimerManager 상태 확인
curl http://localhost:3001/api/system/timers

# 2. 강제 종료
curl -X POST http://localhost:3001/api/system/force-stop

# 3. 수동 프로세스 종료
npm run clean:ports
```

### 2. AI 에이전트 문제

#### 문제: AI 에이전트 응답 없음
```bash
증상: AI 질의 후 무한 로딩
```

**해결 방법:**
```bash
# 1. Python 엔진 연결 확인
curl $AI_ENGINE_URL/health

# 2. TypeScript 폴백 테스트
curl http://localhost:3001/api/ai-agent/integrated

# 3. AI 엔진 재시작
# Python 서비스 재배포 또는 로컬 재시작
```

#### 문제: AI 분석 정확도 저하
```bash
증상: AI가 부정확한 답변 제공
```

**해결 방법:**
```typescript
// 1. 컨텍스트 데이터 확인
interface ContextDiagnostic {
  current_metrics: '최신 데이터 유무',
  historical_data: '충분한 히스토리 데이터',
  pattern_training: '패턴 학습 상태'
}

// 2. 모델 재훈련
POST /api/ai-agent/admin/retrain
{
  "force_update": true,
  "clear_cache": true
}
```

### 3. 대시보드 로딩 문제

#### 문제: 대시보드가 로드되지 않음
```bash
증상: 빈 화면 또는 무한 로딩
```

**해결 방법:**
```bash
# 1. 브라우저 콘솔 확인
F12 → Console 탭 → 에러 메시지 확인

# 2. 서버 메트릭 확인
curl http://localhost:3001/api/unified-metrics?action=servers

# 3. WebSocket 연결 확인
# 브라우저 Network 탭에서 WS 연결 상태 확인

# 4. 캐시 정리
Ctrl+Shift+R (브라우저 강새로고침)
```

#### 문제: 실시간 업데이트 안됨
```bash
증상: 데이터가 고정되어 변화하지 않음
```

**해결 방법:**
```bash
# 1. TimerManager 확인
curl http://localhost:3001/api/system/timers

# 2. WebSocket 재연결
# 페이지 새로고침 또는 브라우저 재시작

# 3. 데이터 생성기 재시작
curl -X POST http://localhost:3001/api/system/restart-generators
```

## 🔍 고급 문제 해결

### 1. 성능 문제

#### 메모리 사용량 과다
```bash
# 현재 메모리 사용량 확인
curl http://localhost:3001/api/system/memory

# 가비지 컬렉션 강제 실행
curl -X POST http://localhost:3001/api/system/gc

# 메모리 누수 탐지
node --expose-gc --inspect app.js
```

#### API 응답 지연
```bash
# API 응답 시간 측정
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/api/unified-metrics

# 병목 지점 확인
curl http://localhost:3001/api/system/performance
```

### 2. 데이터 문제

#### 메트릭 데이터 누락
```bash
증상: 일부 서버 데이터가 표시되지 않음
```

**해결 방법:**
```bash
# 1. 데이터 생성기 상태 확인
curl http://localhost:3001/api/data-generator/status

# 2. Redis 연결 확인
redis-cli ping

# 3. 데이터 복구
curl -X POST http://localhost:3001/api/data-generator/regenerate
```

#### 압축 데이터 오류
```bash
증상: 데이터 압축/해제 오류
```

**해결 방법:**
```bash
# 1. 압축 상태 확인
curl http://localhost:3001/api/system/compression-status

# 2. 압축 캐시 정리
curl -X DELETE http://localhost:3001/api/system/compression-cache

# 3. 원본 데이터로 복구
curl -X POST http://localhost:3001/api/system/rebuild-compressed-data
```

## 🛠️ 디버깅 도구

### 1. 로그 시스템

#### 로그 레벨 설정
```bash
# 개발 모드: 상세 로그
export LOG_LEVEL=debug

# 프로덕션 모드: 에러만
export LOG_LEVEL=error
```

#### 실시간 로그 조회
```bash
# 전체 로그
curl http://localhost:3001/api/admin/logs?limit=100

# 에러 로그만
curl http://localhost:3001/api/admin/logs?level=error

# 특정 컴포넌트 로그
curl http://localhost:3001/api/admin/logs?component=ai-agent
```

### 2. 성능 프로파일링

#### 시스템 메트릭 수집
```bash
# CPU/메모리 사용량
curl http://localhost:3001/api/system/metrics

# API 응답 시간 통계
curl http://localhost:3001/api/system/response-times

# 데이터베이스 쿼리 성능
curl http://localhost:3001/api/system/query-performance
```

### 3. 개발자 도구

#### 브라우저 디버깅
```javascript
// 개발자 콘솔에서 사용 가능한 디버깅 함수들

// 현재 로딩 상태 확인
window.debugLoadingState();

// 즉시 강제 완료
window.emergencyComplete();

// 서버 대시보드로 바로 이동
window.skipToServer();

// WebSocket 연결 상태
window.wsConnectionStatus();
```

## 🚨 응급 복구 절차

### 1. 시스템 완전 복구

#### 전체 리셋 (데이터 손실 없음)
```bash
# 1. 모든 서비스 안전 종료
curl -X POST http://localhost:3001/api/system/safe-shutdown

# 2. 캐시 및 임시 파일 정리
npm run clean
rm -rf .next/cache

# 3. 의존성 재설치
npm install

# 4. 시스템 재시작
npm run dev:clean
```

#### 데이터 백업 및 복구
```bash
# 1. 현재 데이터 백업
curl -X POST http://localhost:3001/api/admin/backup

# 2. 데이터 복구 (필요시)
curl -X POST http://localhost:3001/api/admin/restore \
  -H "Content-Type: application/json" \
  -d '{"backup_id": "backup_20250531_123456"}'
```

### 2. 프로덕션 환경 복구

#### Vercel 배포 문제
```bash
# 1. 빌드 로그 확인
vercel logs

# 2. 환경 변수 확인
vercel env ls

# 3. 재배포
vercel --prod --force
```

#### 함수 타임아웃 문제
```json
// vercel.json 수정
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

## 📋 문제 보고 템플릿

### 버그 리포트
```markdown
## 🐛 버그 리포트

### 환경 정보
- OS: [Windows 11 / macOS 13 / Ubuntu 22.04]
- 브라우저: [Chrome 118 / Firefox 119 / Safari 17]
- Node.js: [v18.17.0]
- 프로젝트 버전: [v5.13.5]

### 문제 설명
[문제가 발생하는 상황을 자세히 설명]

### 재현 단계
1. [첫 번째 단계]
2. [두 번째 단계]
3. [문제 발생]

### 예상 결과
[예상했던 정상적인 동작]

### 실제 결과
[실제로 발생한 문제]

### 에러 메시지
```
[콘솔 에러 메시지 또는 스크린샷]
```

### 추가 정보
[기타 도움이 될 수 있는 정보]
```

## 🔧 성능 최적화 팁

### 1. 개발 환경 최적화
```bash
# Node.js 메모리 제한 늘리기
export NODE_OPTIONS="--max-old-space-size=4096"

# 개발 서버 성능 향상
npm run dev -- --turbo

# TypeScript 빌드 캐시 활용
npm run build -- --incremental
```

### 2. 브라우저 성능 향상
```javascript
// 브라우저 캐시 활용
// 강력한 캐싱 정책 적용
Cache-Control: public, max-age=31536000, immutable

// 서비스 워커 등록 (PWA)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

## 📞 지원 및 문의

### 1. 자가 진단 체크리스트
- [ ] 시스템 요구사항 충족 확인
- [ ] 환경 변수 설정 확인
- [ ] 네트워크 연결 상태 확인
- [ ] 브라우저 콘솔 에러 확인
- [ ] 서버 로그 확인
- [ ] 재시작 및 캐시 정리 시도

### 2. 커뮤니티 지원
- **GitHub Issues**: 버그 리포트 및 기능 요청
- **Discord**: 실시간 커뮤니티 지원
- **문서 피드백**: 문서 개선 제안

---

**이전 문서**: [6_TESTING_AND_DEPLOYMENT.md](./6_TESTING_AND_DEPLOYMENT.md) - 테스트 및 배포  
**다음 문서**: [8_API_REFERENCE.md](./8_API_REFERENCE.md) - API 레퍼런스 