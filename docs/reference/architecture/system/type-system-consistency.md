# TypeScript 타입 시스템 일관성 가이드

## 🎯 목표: async/await 패턴 타입 불일치 방지

### 📋 **발생했던 문제 패턴**

```typescript
// ❌ 문제 패턴: backup-status/route.ts
async function getBackupStatus(
  request: AuthenticatedRequest
): Promise<Response> {
  // async 제거 시 Promise<Response> vs Response 타입 불일치
  return NextResponse.json({ data });
}

export const GET = withAdminAuth(getBackupStatus);
// withAdminAuth가 Promise<Response>를 기대하는데 Response를 받으면 타입 에러
```

**문제 원인:**

- HOC(Higher-Order Component) 타입과 함수 시그니처 불일치
- async 키워드 제거 시 반환 타입 변경으로 인한 호환성 깨짐
- 명시적 타입 검증 부족

---

## 🏗️ **타입 시스템 표준**

### **Rule 1: API 핸들러 타입 표준화**

```typescript
// ✅ 표준 API 핸들러 패턴
import { NextResponse } from 'next/server';
import {
  withAdminAuth,
  type AuthenticatedRequest,
} from '@/lib/api/auth-middleware';

// 명시적 타입 정의
type ApiResponse<T = unknown> = Promise<Response>;

// 일관된 async 함수 시그니처
async function getBackupStatus(
  request: AuthenticatedRequest
): ApiResponse<BackupStatusData> {
  try {
    const backupStatus = await getBackupData();

    return NextResponse.json({
      success: true,
      data: backupStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to get backup status' },
      { status: 500 }
    );
  }
}

// 타입 안전한 내보내기
export const GET = withAdminAuth(getBackupStatus);
```

### **Rule 2: HOC 타입 일관성**

```typescript
// ✅ 타입 안전한 HOC 패턴
// lib/api/auth-middleware.ts
export interface AuthenticatedRequest extends Request {
  authInfo?: {
    userId: string;
    isAdmin: boolean;
  };
}

export type AuthenticatedHandler = (
  request: AuthenticatedRequest
) => Promise<Response>;

export function withAdminAuth(
  handler: AuthenticatedHandler
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    // 인증 로직
    const authInfo = await validateAdminAuth(request);

    if (!authInfo) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 타입 안전한 요청 객체 생성
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.authInfo = authInfo;

    return handler(authenticatedRequest);
  };
}
```

### **Rule 3: 타입 가드 및 검증**

```typescript
// ✅ 타입 가드 활용 패턴
// types/api-validation.ts
export interface BackupStatusData {
  lastBackup: string;
  status: 'healthy' | 'error' | 'warning';
  totalBackups: number;
}

export function isValidBackupStatus(data: unknown): data is BackupStatusData {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).lastBackup === 'string' &&
    ['healthy', 'error', 'warning'].includes((data as any).status) &&
    typeof (data as any).totalBackups === 'number'
  );
}

// API 핸들러에서 활용
async function getBackupStatus(
  request: AuthenticatedRequest
): Promise<Response> {
  const rawData = await fetchBackupData();

  if (!isValidBackupStatus(rawData)) {
    return NextResponse.json(
      { error: 'Invalid backup data format' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: rawData, // 이제 BackupStatusData 타입 보장
  });
}
```

---

## 🔧 **자동 검증 시스템**

### **TypeScript Strict 설정**

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

### **API 핸들러 타입 검증 스크립트**

```typescript
// scripts/validate-api-types.ts
import { glob } from 'glob';
import { readFileSync } from 'fs';

async function validateApiHandlers() {
  const apiFiles = await glob('src/app/api/**/route.ts');
  const errors: string[] = [];

  for (const file of apiFiles) {
    const content = readFileSync(file, 'utf-8');

    // async 누락 검사
    const exportedHandlers = content.match(
      /export const (GET|POST|PUT|DELETE|PATCH)/g
    );
    const asyncFunctions = content.match(/async function \w+/g);

    if (exportedHandlers && (!asyncFunctions || asyncFunctions.length === 0)) {
      errors.push(`${file}: API 핸들러에 async 함수가 없습니다`);
    }

    // withAdminAuth 타입 일치 검사
    if (
      content.includes('withAdminAuth') &&
      !content.includes('Promise<Response>')
    ) {
      errors.push(
        `${file}: withAdminAuth 사용 시 Promise<Response> 반환 타입 명시 필요`
      );
    }
  }

  if (errors.length > 0) {
    console.error('❌ API 핸들러 타입 오류:');
    errors.forEach((error) => console.error(`  ${error}`));
    process.exit(1);
  }

  console.log('✅ 모든 API 핸들러 타입 검증 통과');
}

validateApiHandlers().catch(console.error);
```

---

## 📊 **Migration 전략**

### **1단계: 현재 타입 오류 식별**

```bash
# 엄격한 타입 체크
npx tsc --strict --noEmit

# API 핸들러 특화 검사
npm run validate:api-types
```

### **2단계: 핵심 API부터 수정**

1. **인증 관련 API** (auth, admin)
2. **데이터 조작 API** (POST, PUT, DELETE)
3. **조회 API** (GET)

### **3단계: 점진적 엄격화**

```typescript
// 단계별 tsconfig 강화
{
  "compilerOptions": {
    // Phase 1: 기본 strict
    "strict": true,

    // Phase 2: 추가 검증
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,

    // Phase 3: 완전 엄격
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

---

## 🚀 **개발 워크플로우 통합**

### **개발 시 실시간 검증**

```json
// package.json
{
  "scripts": {
    "type-check:api": "tsx scripts/validate-api-types.ts",
    "type-check:strict": "tsc --strict --noEmit",
    "dev:type-safe": "npm run type-check:strict && npm run dev"
  }
}
```

### **Pre-commit 타입 검증**

```bash
# .husky/pre-commit
#!/usr/bin/env sh
npm run type-check:strict || {
  echo "❌ TypeScript strict 검사 실패로 커밋 차단"
  echo "💡 'npm run type-check:strict'로 문제 확인 후 수정"
  exit 1
}

npm run type-check:api || {
  echo "❌ API 핸들러 타입 검사 실패"
  exit 1
}
```

### **CI/CD 통합**

```yaml
# .github/workflows/type-safety.yml
- name: Strict Type Check
  run: |
    npx tsc --strict --exactOptionalPropertyTypes --noEmit
    npm run type-check:api
```

이 표준을 통해 backup-status/route.ts와 같은 **async/Promise 타입 불일치 문제를 사전에 방지**하고, **모든 API 핸들러의 타입 안전성을 보장**합니다.
