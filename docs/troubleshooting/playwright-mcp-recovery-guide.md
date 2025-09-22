# Playwright MCP 복구 가이드

**작성일**: 2025-09-22
**업데이트**: Claude Code v1.0.119, WSL 2 환경 기준

## 🎯 개요

Playwright MCP 서버가 갑자기 연결 실패하는 문제의 진단 및 복구 방법을 정리합니다.

## 🚨 주요 증상

```bash
claude mcp list
# 결과: playwright: /tmp/playwright-mcp-wrapper.sh - ✗ Failed to connect
```

**일반적 증상**:
- MCP 서버 목록에서 Playwright만 연결 실패
- `npx @playwright/mcp` 실행 시 ENOTEMPTY 에러
- 이전까지 정상 작동하다가 갑자기 실패

## 🔍 근본 원인

**npm 캐시 손상** (ENOTEMPTY 에러)
- **발생 시점**: 시스템 재부팅, WSL 재시작, 강제 종료 등
- **손상 위치**: `~/.npm/_npx/` 디렉토리의 패키지 설치 캐시
- **에러 메시지**: `ENOTEMPTY: directory not empty, rename`

## ✅ 단계별 복구 방법

### 1️⃣ 현재 상태 확인

```bash
# MCP 서버 상태 확인
claude mcp list

# @playwright/mcp 패키지 테스트
npx @playwright/mcp --help
```

### 2️⃣ npm 캐시 강제 정리

```bash
# npm 캐시 완전 정리
npm cache clean --force
```

### 3️⃣ 손상된 npx 캐시 직접 삭제

```bash
# 에러 메시지에서 손상된 디렉토리 경로 확인
# 예: /home/sky-note/.npm/_npx/86170c4cd1c5da32

# 손상된 디렉토리 삭제
rm -rf /home/sky-note/.npm/_npx/86170c4cd1c5da32

# 또는 전체 npx 캐시 삭제 (안전)
rm -rf ~/.npm/_npx/*
```

### 4️⃣ 패키지 재설치 확인

```bash
# @playwright/mcp 정상 설치 확인
timeout 30 npx @playwright/mcp --help

# 성공 시 도움말 출력됨
```

### 5️⃣ MCP 연결 상태 재확인

```bash
# MCP 서버 목록 다시 확인
claude mcp list

# 결과: playwright: /tmp/playwright-mcp-wrapper.sh - ✓ Connected
```

## 🧪 기능 테스트

### 브라우저 자동화 테스트

```javascript
// 테스트 스크립트 생성
cat << 'EOF' > playwright-test.js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://www.google.com');
  console.log('✅ 테스트 성공:', await page.title());
  await browser.close();
})();
EOF

# 테스트 실행
node playwright-test.js
```

### MCP 도구 테스트

Claude Code에서:
```
mcp__playwright__browser_navigate를 사용하여 https://www.google.com 방문
mcp__playwright__browser_snapshot으로 페이지 상태 확인
```

## 🛡️ 예방 조치

### 정기적 캐시 관리

```bash
# 월 1회 권장
npm cache clean --force
npm cache verify
```

### 모니터링 스크립트

```bash
# ~/.bashrc에 추가
alias mcp-status='claude mcp list'
alias mcp-fix='npm cache clean --force && rm -rf ~/.npm/_npx/*'
```

### WSL 안전 종료

```bash
# Windows에서 WSL 안전 종료
wsl --shutdown

# 재시작 후 MCP 상태 확인
wsl
claude mcp list
```

## 📊 복구 성과 지표

| 지표 | 복구 전 | 복구 후 |
|------|---------|---------|
| **MCP 연결** | ❌ Failed | ✅ Connected |
| **패키지 설치** | ❌ ENOTEMPTY | ✅ 정상 설치 |
| **브라우저 테스트** | ❌ 불가능 | ✅ 100% 성공 |
| **페이지 로드** | ❌ 실패 | ✅ 정상 작동 |

## 🚨 트러블슈팅

### Q: 캐시 정리 후에도 실패하는 경우

```bash
# 전체 npm 데이터 재설정
rm -rf ~/.npm
npm cache clean --force
npm config cache ~/.npm

# Node.js 모듈 캐시도 정리
rm -rf ~/.cache/ms-playwright
npx playwright install chromium
```

### Q: WSL 환경별 이슈

```bash
# WSL2 GUI 설정 확인
echo $DISPLAY  # :0 이어야 함
export DISPLAY=:0

# 브라우저 GUI 테스트
export LIBGL_ALWAYS_INDIRECT=1
```

### Q: 권한 관련 문제

```bash
# npm 권한 재설정
sudo chown -R $(whoami) ~/.npm
chmod 755 ~/.npm
```

## 🔄 정기 점검 체크리스트

- [ ] 주간: `claude mcp list`로 모든 MCP 서버 연결 확인
- [ ] 월간: `npm cache clean --force`로 캐시 정리
- [ ] 분기: Playwright 버전 업데이트 확인
- [ ] 반기: WSL 설정 및 메모리 최적화 검토

## 📝 관련 문서

- [WSL 모니터링 가이드](./wsl-monitoring-guide.md)
- [시스템 복구 가이드](./system-recovery-guide-2025.md)
- [MCP 설정 가이드](../mcp/setup-guide.md)

---

**⚠️ 주의사항**: 이 가이드는 WSL2 + Claude Code v1.0.119 환경을 기준으로 작성되었습니다. 다른 환경에서는 일부 경로나 명령어가 다를 수 있습니다.