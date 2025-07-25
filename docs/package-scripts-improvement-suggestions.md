# package.json Scripts 개선 제안

## 중복 제거 및 통합

### 1. Lint 명령어 통합

```json
// 변경 전
"lint": "eslint src --cache",
"lint:fast": "eslint src --ext .ts,.tsx --cache",
"lint:debug": "eslint . --debug",

// 변경 후
"lint": "eslint src --cache",
"lint:debug": "eslint . --debug",
// lint:fast 제거 (lint와 동일한 기능)
```

### 2. 환경변수 명령어 정리

```json
// 변경 전
"env:check": "node scripts/verify-env.cjs",
"env:verify": "node scripts/verify-env.cjs",
"env:check-old": "node scripts/check-env.js",

// 변경 후
"env:check": "node scripts/verify-env.cjs",
// env:verify 제거 (중복)
// env:check-old 제거 (레거시)
```

### 3. Redis 명령어 통합

```json
// 변경 전
"redis:check": "tsx scripts/test-redis-connection.ts",
"redis:check:dev": "USE_REAL_REDIS=false tsx scripts/test-redis-connection.ts",
"redis:check:real": "USE_REAL_REDIS=true tsx scripts/test-redis-connection.ts",

// 변경 후
"redis:check": "tsx scripts/test-redis-connection.ts",
"redis:check:mock": "cross-env USE_REAL_REDIS=false tsx scripts/test-redis-connection.ts",
"redis:check:real": "cross-env USE_REAL_REDIS=true tsx scripts/test-redis-connection.ts",
```

### 4. 검증 명령어 체계 개선

```json
// 변경 후
"validate": "npm run type-check && npm run lint",
"validate:test": "npm run validate && npm run test:tdd-safe",
"validate:full": "npm run validate:test && npm run analyze:free-tier",
// cursor:validate, validate:competition 제거
```

### 5. MCP 명령어 통합

```json
// 서브커맨드 패턴으로 통합
"mcp": "node scripts/mcp-cli.js",
// 사용법: npm run mcp setup, npm run mcp verify, npm run mcp reset 등

// 또는 네임스페이스로 그룹화
"mcp:setup": "...",
"mcp:setup:complete": "...",
"mcp:verify": "...",
"mcp:verify:playwright": "...",
// 나머지는 제거하거나 통합
```

## 크로스 플랫폼 호환성 개선

### 1. PowerShell 스크립트를 Node.js로 전환

```json
// 변경 전
"mcp:check": "powershell -ExecutionPolicy Bypass -File scripts/check-mcp-status.ps1",

// 변경 후
"mcp:check": "node scripts/check-mcp-status.js",
```

### 2. 플랫폼별 스크립트 분리

```json
"env:setup": "node scripts/setup-env.js",
"env:setup:windows": "powershell -ExecutionPolicy Bypass -File scripts/setup-env-windows.ps1",
"env:setup:unix": "./scripts/setup-env-interactive.sh",
```

## 네이밍 규칙 통일

### 1. 콜론(:) 구분자로 통일

```json
// 변경 전
"redis-test", "build-storybook"

// 변경 후
"redis:test", "storybook:build"
```

### 2. 카테고리별 그룹화

```json
// 테스트 관련
"test:*"

// 환경변수 관련
"env:*"

// 보안 관련
"security:*"

// 분석 관련
"analyze:*"

// MCP 관련
"mcp:*"
```

## 추가 개선사항

### 1. 사용하지 않는 스크립트 제거

- 실제로 사용되지 않는 스크립트 식별 및 제거
- 레거시 스크립트 정리

### 2. 문서화

```json
"help": "node scripts/show-available-commands.js",
"help:test": "echo 'Available test commands: test, test:unit, test:integration, test:coverage'",
```

### 3. 복합 명령어 개선

```json
// 더 명확한 이름과 설명
"dev:full": "npm run env:check && npm run dev",
"deploy:safe": "npm run validate:full && npm run deploy",
```

## 구현 우선순위

1. **높음**: 중복 제거, 네이밍 통일
2. **중간**: 크로스 플랫폼 호환성
3. **낮음**: 문서화, 추가 기능

이러한 개선을 통해 스크립트 관리가 더욱 효율적이고 유지보수가 쉬워질 것입니다.
