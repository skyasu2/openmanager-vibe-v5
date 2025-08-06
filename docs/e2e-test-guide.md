# E2E 테스트 가이드

## 📊 현재 상태 (2025.8.6)

### ✅ 구성 완료
- **Playwright 설치**: v1.54.1
- **브라우저 바이너리**: Chromium, Firefox, WebKit 설치 완료
- **시스템 의존성**: libnspr4, libnss3, libasound2t64 설치 완료
- **헬스체크 엔드포인트**: `/api/health` 구현 완료
- **포트 설정**: 3000 포트로 통일

### 📁 테스트 파일 구조
```
tests/e2e/
├── dashboard.e2e.ts               # 대시보드 기본 기능
├── system-state-transition.e2e.ts # 시스템 상태 전환
├── ui-modal-comprehensive.e2e.ts  # UI 모달 테스트
├── performance-optimized-query-engine.playwright.test.ts
├── global-setup.ts                # 테스트 전 환경 설정
└── global-teardown.ts             # 테스트 후 정리
```

## 🚀 실행 방법

### 1. 개발 서버 시작 (별도 터미널)
```bash
# 개발 서버를 먼저 시작
npm run dev

# 또는 테스트용 환경변수와 함께
NODE_ENV=test PORT=3000 npm run dev
```

### 2. E2E 테스트 실행
```bash
# 모든 E2E 테스트 실행
npm run test:e2e

# UI 모드로 실행 (디버깅용)
npx playwright test --ui

# 특정 파일만 실행
npx playwright test tests/e2e/dashboard.e2e.ts

# 특정 브라우저만 테스트
npx playwright test --project=chromium-stable

# 헤드 모드로 실행 (브라우저 보이게)
npx playwright test --headed

# 디버그 모드
npx playwright test --debug
```

## 🔧 설정 파일

### playwright.config.ts
- **기본 URL**: `http://localhost:3000`
- **타임아웃**: 테스트 60초, 서버 시작 3분
- **브라우저**: Chromium(기본), Firefox, Safari, Mobile
- **리포터**: HTML, JSON, JUnit
- **스크린샷**: 실패 시 자동 캡처

## ⚠️ 주의사항

### WSL 환경
WSL 환경에서는 다음 사항을 확인하세요:
1. X11 서버 설치 (헤드 모드 실행 시)
2. 충분한 메모리 할당 (최소 4GB)
3. 시스템 의존성 설치 확인

### 개발 서버
1. 개발 서버가 실행 중이어야 함
2. 환경변수 설정 확인 (`.env.local`)
3. 포트 충돌 확인 (3000 포트)

## 🐛 문제 해결

### 타임아웃 에러
```bash
# webServer 설정에서 reuseExistingServer를 true로 변경
# playwright.config.ts
webServer: {
  reuseExistingServer: true,
  // ...
}
```

### 브라우저 실행 실패
```bash
# 시스템 의존성 재설치
sudo apt-get update
sudo apt-get install -y libnspr4 libnss3 libasound2t64

# 또는 Playwright가 제안하는 명령어 실행
sudo npx playwright install-deps
```

### 포트 충돌
```bash
# 3000 포트 사용 중인 프로세스 확인
lsof -i :3000

# 프로세스 종료
kill -9 <PID>
```

## 📈 테스트 커버리지

### 현재 구현된 테스트
1. **대시보드 로드**: 페이지 정상 로드 확인
2. **서버 요소 표시**: 서버 카드 등 UI 요소 확인
3. **AI 기능 확인**: AI 관련 요소 존재 여부
4. **반응형 디자인**: 데스크톱/태블릿/모바일 뷰
5. **네비게이션**: 기본 링크 동작 확인

### 추가 필요한 테스트
- [ ] 로그인/로그아웃 플로우
- [ ] API 응답 모킹
- [ ] 실시간 데이터 업데이트
- [ ] 에러 핸들링
- [ ] 성능 메트릭 측정

## 🔄 CI/CD 통합

### GitHub Actions 설정 예시
```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
  env:
    CI: true

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: test-results/
```

## 📊 리포트

테스트 실행 후 생성되는 리포트:
- **HTML 리포트**: `test-results/e2e-report/`
- **JSON 결과**: `e2e-results.json`
- **JUnit XML**: `test-results/e2e-results.xml`

HTML 리포트 확인:
```bash
npx playwright show-report test-results/e2e-report
```

## 🎯 베스트 프랙티스

1. **Page Object Model 사용**
   - 재사용 가능한 페이지 객체 생성
   - 유지보수 용이성 향상

2. **데이터 테스트 ID 활용**
   - `data-testid` 속성으로 요소 선택
   - 클래스명 변경에 영향 없음

3. **적절한 대기 전략**
   - `waitForSelector` 사용
   - 네트워크 요청 완료 대기

4. **병렬 실행 최적화**
   - 독립적인 테스트 작성
   - 상태 공유 최소화

5. **스크린샷과 비디오 활용**
   - 디버깅 시간 단축
   - CI/CD에서 문제 파악 용이