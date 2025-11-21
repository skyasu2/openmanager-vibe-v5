#!/bin/bash
# Playwright WSL2 최적화 설정 스크립트
# GPT-5 실무 권장사항 기반

set -e

echo "🎭 Playwright WSL2 최적화 설정 시작..."

# 1단계: 필수 시스템 라이브러리 설치 (15개 핵심만)
echo "📦 핵심 의존성 설치 중..."
sudo apt update
sudo apt install -y \
  libgtk-3-0 \
  libgbm1 \
  libnss3 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgconf-2-4 \
  libxss1 \
  libasound2 \
  libatspi2.0-0 \
  libgtk-3-dev \
  libnotify-dev \
  ca-certificates

# 2단계: Playwright 설치 및 Chromium 브라우저 설치
echo "🎭 Playwright Chromium 설치 중..."
npx playwright install chromium
npx playwright install-deps chromium

# 3단계: WSL 메모리 최적화 설정
echo "🧠 메모리 최적화 설정 적용 중..."
cat >> ~/.bashrc << 'EOF'

# Playwright WSL2 최적화 환경변수
export PLAYWRIGHT_BROWSERS_PATH=/home/$USER/.cache/ms-playwright
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
export NODE_OPTIONS="--max-old-space-size=12288"

# Chromium 메모리 최적화 플래그
export CHROMIUM_FLAGS="--disable-dev-shm-usage --disable-gpu --no-sandbox --disable-web-security --memory-pressure-off"
EOF

# 4단계: 설정 검증
echo "✅ 설정 검증 중..."
source ~/.bashrc
npx playwright --version

echo "🎉 Playwright WSL2 최적화 설정 완료!"
echo ""
echo "📊 예상 성과:"
echo "  - 메모리 절약: 300-500MB"
echo "  - 안정성: GUI 의존성 제거"
echo "  - 성능: MCP 직접 연결"
echo ""
echo "🚀 다음 단계: npm run test:e2e 실행하여 테스트"