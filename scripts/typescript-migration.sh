#!/bin/bash

# TypeScript Strict Mode Migration Script
# 즉시 실행 가능한 any 타입 제거 도구

echo "🚀 TypeScript Strict Mode Migration Starting..."

# 1. any 타입 사용 현황 분석
echo "📊 Analyzing current 'any' usage..."
find src -name "*.ts" -o -name "*.tsx" | xargs grep -n "any" > any-usage-report.txt
echo "   Report saved to: any-usage-report.txt"

# 2. 가장 많이 사용되는 any 패턴 찾기
echo "🔍 Finding common 'any' patterns..."
grep -E "(: any|<any>|as any)" src/**/*.{ts,tsx} | head -20

# 3. 타입 정의 파일 생성 준비
echo "📝 Creating type definition structure..."
mkdir -p src/types/{api,components,utils}

# 4. 기본 타입 정의 파일 생성
cat > src/types/common.ts << 'EOF'
// 공통 타입 정의
export interface ApiResponse<T = unknown> {
  data: T;
  message: string;
  status: 'success' | 'error';
  timestamp: string;
}

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type EventHandler<T = Event> = (event: T) => void | Promise<void>;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
EOF

# 5. 타입 가드 유틸리티 생성
cat > src/utils/type-guards.ts << 'EOF'
// 타입 가드 유틸리티 함수들
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
}

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
}

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const isArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value);
}

export const hasProperty = <T extends string>(
  obj: Record<string, unknown>,
  prop: T
): obj is Record<T, unknown> => {
  return prop in obj;
}
EOF

# 6. tsconfig.json 백업 및 strict 모드 활성화
echo "⚙️ Updating TypeScript configuration..."
cp tsconfig.json tsconfig.json.backup

# 7. 문제가 있는 파일들 목록 생성
echo "🔍 Generating list of files with TypeScript errors..."
npx tsc --noEmit --skipLibCheck 2>&1 | grep "error TS" | cut -d'(' -f1 | sort | uniq > typescript-errors.txt
echo "   Error files saved to: typescript-errors.txt"

# 8. 마이그레이션 우선순위 파일 생성
echo "📋 Creating migration priority list..."
cat > migration-plan.md << 'EOF'
# TypeScript Migration Plan

## Phase 1: Quick Wins (1-2 hours)
- [ ] Replace simple any types with union types
- [ ] Add type guards for object property access
- [ ] Define basic interface types

## Phase 2: Structural Types (2-4 hours)
- [ ] Create comprehensive type definitions
- [ ] Migrate API response types
- [ ] Update component prop types

## Phase 3: Advanced Patterns (ongoing)
- [ ] Implement generic types
- [ ] Add runtime type validation
- [ ] Create type utilities

## Files to migrate (by priority):
EOF

# 9. 우선순위가 높은 파일들 추가
head -10 typescript-errors.txt >> migration-plan.md

echo "✅ Migration preparation complete!"
echo ""
echo "📁 Generated files:"
echo "   - any-usage-report.txt (current any usage)"
echo "   - typescript-errors.txt (files with errors)"
echo "   - migration-plan.md (step-by-step plan)"
echo "   - src/types/common.ts (basic type definitions)"
echo "   - src/utils/type-guards.ts (type guard utilities)"
echo ""
echo "🚀 Next steps:"
echo "   1. Review migration-plan.md"
echo "   2. Start with Phase 1 quick wins"
echo "   3. Run 'npm run type-check' after each change"
echo "   4. Use type guards instead of 'as any'"