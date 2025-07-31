#!/bin/bash

# Pre-push용 초고속 테스트 스크립트
# 가장 중요한 몇 가지 테스트만 빠르게 실행

echo "⚡ Pre-push 빠른 테스트 시작..."

# 환경 변수 설정
export USE_REAL_REDIS=false
export NODE_ENV=test

# Vitest 직접 실행 (npm 오버헤드 제거)
./node_modules/.bin/vitest run \
  src/test/env.test.ts \
  src/test/simplified-ai.test.ts \
  src/test/ai-engine.test.ts \
  --reporter=basic \
  --no-coverage \
  --bail=1 \
  --pool=forks \
  --test-timeout=1000 \
  --isolate=false \
  --passWithNoTests

exit $?