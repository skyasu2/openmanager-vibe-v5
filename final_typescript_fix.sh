#!/bin/bash

echo "🔧 최종 TypeScript 에러 수정 중..."

# validate-env.ts - TS2538 에러 수정
echo "1. validate-env.ts 수정 중..."
sed -i 's/process\.env\[requiredVar!\]/process.env[requiredVar!] ?? ""/g' src/lib/validate-env.ts
sed -i 's/\[requiredVar!\]/.get(requiredVar)/g' src/lib/validate-env.ts

# SystemWatchdog 정밀 수정
echo "2. SystemWatchdog 정밀 수정 중..."
if [[ -f "src/core/system/SystemWatchdog.refactored.ts" ]]; then
  # results[index] 안전 접근
  sed -i 's/results\[index\]\.status/results[index]?.status ?? "error"/g' src/core/system/SystemWatchdog.refactored.ts
  sed -i 's/results\[index\]\.message/results[index]?.message ?? "Unknown error"/g' src/core/system/SystemWatchdog.refactored.ts
  
  # validationResult?.error 안전 접근
  sed -i 's/validationResult\.error\./validationResult?.error\./g' src/core/system/SystemWatchdog.refactored.ts
fi

# utils-functions.ts 정밀 수정
echo "3. utils-functions.ts 정밀 수정 중..."
if [[ -f "src/lib/utils-functions.ts" ]]; then
  sed -i 's/results\[i\]!/results[i]!/g' src/lib/utils-functions.ts
fi

echo "✅ 최종 TypeScript 에러 수정 완료"
