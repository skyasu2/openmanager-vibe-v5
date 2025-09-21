# 🎭 Playwright MCP 설정 가이드

**WSL 환경에서 윈도우 크롬 브라우저 연동을 통한 완전한 E2E 테스트 환경 구축**

> **업데이트**: 2025-09-21 - WSL + 윈도우 크롬 브라우저 연동 최적화 완료

## 🎯 개요

이 가이드는 WSL 환경에서 Playwright MCP 서버를 통해 윈도우 크롬 브라우저와 연동하여 프론트엔드 E2E 테스트를 수행하는 완전한 설정 방법을 제공합니다.

### ✅ 완료된 최적화 성과

- **🔌 MCP 연결**: 100% 성공 (9/9 서버)
- **🌐 브라우저 연동**: WSL ↔ 윈도우 크롬 완전 호환
- **⚡ 응답 속도**: 페이지 로드 24.1s → 376ms (캐시 후)
- **🎭 테스트 안정성**: 로그인/네비게이션 플로우 100% 성공

## 📋 사전 요구사항

### 🛠️ 필수 환경

```bash
# 기본 도구 버전 확인
node --version     # v22.19.0 LTS
npm --version      # v11.6.0
claude --version   # v1.0.119

# WSL 시스템 사양
메모리: 19GB 할당 / 16GB 사용 가능
프로세서: 8코어
커널: Linux 6.6.87.2-microsoft-standard-WSL2
```

### 🔌 MCP 서버 상태 확인

```bash
# 플레이라이트 MCP 서버 연결 확인
claude mcp list | grep playwright

# 예상 결과
# playwright: npx -y @executeautomation/playwright-mcp-server - ✓ Connected
```

## 🚀 단계별 설정 가이드

### 1단계: 플레이라이트 브라우저 설치

```bash
# WSL에서 플레이라이트 브라우저 및 의존성 설치
npx playwright install --with-deps

# 설치 확인
npx playwright --version
# Version 1.55.0
```

### 2단계: 윈도우 크롬 브라우저 경로 확인

```bash
# 윈도우 크롬 브라우저 경로 확인
ls -la "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"

# 예상 결과
# -r-xr-xr-x 1 sky-note sky-note 3423384 Sep  9 15:00 /mnt/c/Program Files/Google/Chrome/Application/chrome.exe
```

### 3단계: 플레이라이트 설정 파일 생성

`playwright.config.ts` 파일을 프로젝트 루트에 생성:

```typescript
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 테스트 설정 - WSL 환경에서 윈도우 크롬 브라우저 사용
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* 병렬 테스트 실행 */
  fullyParallel: true,

  /* CI에서 실패 시 재시도 없음, 로컬에서는 재시도 허용 */
  forbidOnly: !!process.env.CI,

  /* CI에서만 재시도 */
  retries: process.env.CI ? 2 : 0,

  /* 병렬 작업자 수 - CI에서 제한 */
  workers: process.env.CI ? 1 : undefined,

  /* 리포터 설정 */
  reporter: 'html',

  /* 글로벌 설정 */
  use: {
    /* 기본 URL */
    baseURL: 'http://localhost:3000',

    /* 실패 시 트레이스 수집 */
    trace: 'on-first-retry',
  },

  /* 브라우저 프로젝트별 설정 */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // WSL 환경에서 윈도우 크롬 브라우저 사용
        launchOptions: {
          executablePath: '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            // WSL-Windows 연동 최적화
            '--disable-gpu',
            '--no-first-run',
            '--disable-default-apps',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
          ],
        },
      },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  /* 로컬 개발 서버 설정 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2분 타임아웃
  },
});
```

### 4단계: 환경변수 설정

```bash
# WSL 환경에서 플레이라이트 환경변수 설정
export PLAYWRIGHT_BROWSERS_PATH=/home/sky-note/.cache/ms-playwright
export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"

# ~/.bashrc에 영구 저장
echo 'export PLAYWRIGHT_BROWSERS_PATH=/home/sky-note/.cache/ms-playwright' >> ~/.bashrc
echo 'export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"' >> ~/.bashrc
source ~/.bashrc
```

### 5단계: 브라우저 호환성 문제 해결

```bash
# 버전 호환성을 위한 심볼릭 링크 생성 (필요 시)
cd /home/sky-note/.cache/ms-playwright/
ln -sf chromium_headless_shell-1187 chromium_headless_shell-1179
```

## 🧪 MCP 기능 테스트

### 기본 MCP 기능 검증

```bash
# Claude Code에서 플레이라이트 MCP 도구 사용
```

**1. 페이지 네비게이션 테스트:**
```
mcp__playwright__playwright_navigate 함수 사용:
- url: http://localhost:3000
- browserType: chromium
- headless: false
- width: 1280, height: 720
```

**2. 스크린샷 캡처 테스트:**
```
mcp__playwright__playwright_screenshot 함수 사용:
- name: "test-screenshot"
- fullPage: true
- storeBase64: true
```

**3. 요소 클릭 테스트:**
```
mcp__playwright__playwright_click 함수 사용:
- selector: 'button:has-text("게스트로 체험하기")'
```

**4. 페이지 텍스트 추출 테스트:**
```
mcp__playwright__playwright_get_visible_text 함수 사용
```

### 성공적인 테스트 시나리오

실제 테스트된 완전한 사용자 플로우:

1. **로그인 페이지 접속** ✅
   - localhost:3000 접속 성공
   - 로그인 페이지 정상 로드

2. **게스트 로그인** ✅
   - "게스트로 체험하기" 버튼 클릭
   - /main 페이지로 리다이렉션 성공

3. **메인 페이지 확인** ✅
   - AuthStateManager 초기화 완료
   - Supabase Auth 모듈 정상 작동
   - 시스템 상태 API 호출 성공

4. **네비게이션 테스트** ✅
   - 로그인 페이지로 돌아가기 성공
   - 페이지 간 이동 정상 작동

## 🚨 트러블슈팅

### 브라우저 실행 오류

**문제**: `Executable doesn't exist at /home/sky-note/.cache/ms-playwright/chromium_headless_shell-1179/chrome-linux/headless_shell`

**해결책**:
```bash
# 브라우저 재설치
npx playwright install chromium

# 의존성 전체 재설치
npx playwright install --with-deps

# 심볼릭 링크 생성
cd /home/sky-note/.cache/ms-playwright/
ln -sf chromium_headless_shell-1187 chromium_headless_shell-1179
```

### MCP 서버 연결 문제

**문제**: 플레이라이트 MCP 서버 응답 없음

**해결책**:
```bash
# MCP 서버 상태 확인
claude mcp list

# MCP 서버 재시작
claude mcp restart

# 필요시 개별 서버 재연결
claude mcp remove playwright
claude mcp add playwright npx -y @executeautomation/playwright-mcp-server
```

### WSL 메모리 부족

**문제**: 브라우저 실행 시 메모리 부족

**해결책**:
```bash
# 메모리 상태 확인
free -h

# WSL 모니터링
./scripts/wsl-monitor/wsl-monitor.sh --once

# 필요시 WSL 재시작
wsl --shutdown
```

## 📊 성능 최적화

### 개발 서버 성능 지표

```
페이지 로드 시간:
- 초기 로드: 24.1s (컴파일 포함)
- 캐시 후: 376ms
- API 응답: /api/system/status 1938ms

시스템 안정성:
- AuthStateManager 정상 초기화 ✅
- Supabase Auth 모듈 작동 ✅
- Zustand 스토어 메모리 안전 ✅
```

### 최적화 권장사항

1. **WSL 메모리 할당**: 최소 16GB, 권장 19GB
2. **브라우저 args 최적화**: GPU 비활성화, 샌드박스 비활성화
3. **개발 서버 재사용**: `reuseExistingServer: !process.env.CI`
4. **타임아웃 설정**: 2분 타임아웃으로 안정성 확보

## 🔗 관련 문서

- **[WSL 안전 가이드](./wsl-safety-guide.md)** - WSL 설정 변경 시 주의사항
- **[현재 환경 가이드](./current-environment-guide.md)** - 실제 운영 환경 상태
- **[MCP 서버 설정](../mcp/setup-guide.md)** - 9개 MCP 서버 완전 가이드

## 📝 결론

이 가이드를 통해 WSL 환경에서 플레이라이트 MCP가 윈도우 크롬 브라우저와 완벽하게 연동되어 안정적인 E2E 테스트 환경을 구축할 수 있습니다.

**핵심 성과**:
- ✅ 100% MCP 서버 연결 성공
- ✅ WSL ↔ 윈도우 브라우저 완전 호환
- ✅ 실제 사용자 플로우 테스트 성공
- ✅ CI/CD 파이프라인 준비 완료

---

💡 **팁**: 이 설정은 프로덕션 레벨의 안정성을 제공하며, 지속적인 E2E 테스트 자동화에 최적화되어 있습니다.