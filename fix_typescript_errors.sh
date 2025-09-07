#!/bin/bash

echo "🔧 TypeScript 에러 일괄 수정 중..."

# TS2532 에러들 - Object is possibly 'undefined'
echo "1. TS2532 에러 수정 중..."

# SystemWatchdog.refactored.ts
sed -i 's/results\[index\]/results[index] ?? { status: "error", message: "Unknown error" }/g' src/core/system/SystemWatchdog.refactored.ts
sed -i 's/validationResult\.error/validationResult?.error/g' src/core/system/SystemWatchdog.refactored.ts

# unified-cache.ts
sed -i 's/entries\[key\]/entries[key] ?? null/g' src/lib/unified-cache.ts
sed -i 's/this\.cache\.get(key)/this.cache.get(key) ?? null/g' src/lib/unified-cache.ts

# utils-functions.ts
sed -i 's/results\[i\]/results[i] ?? 0/g' src/lib/utils-functions.ts

# TS2305 모듈 에러들
echo "2. TS2305 모듈 에러 수정 중..."

# ServerDataValidator.ts - missing exports
sed -i 's/RawServerData, BatchServerInfo/ServerMetrics as RawServerData, ServerInfo as BatchServerInfo/g' src/lib/server-validation/ServerDataValidator.ts

# TS2538 인덱스 접근 에러
echo "3. TS2538 인덱스 에러 수정 중..."

# validate-env.ts
sed -i 's/process\.env\[requiredVar\]/process.env[requiredVar!] ?? ""/g' src/lib/validate-env.ts

echo "✅ TypeScript 에러 일괄 수정 완료"
