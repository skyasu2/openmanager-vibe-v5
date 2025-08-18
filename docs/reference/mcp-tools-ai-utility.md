# 🤖 MCP AI & 유틸리티 도구 레퍼런스

> **2025년 8월 18일 기준**  
> **환경**: Claude Code v1.0.81 + MCP 서버  
> **카테고리**: UI 컴포넌트 + 시간 도구 + 코드 검색

## 📋 목차

1. [개요](#개요)
2. [ShadCN MCP 도구](#shadcn-mcp-도구)
3. [Time MCP 도구](#time-mcp-도구)
4. [Serena MCP 도구](#serena-mcp-도구)
5. [실전 활용 예시](#실전-활용-예시)
6. [문제 해결](#문제-해결)

---

## 🎯 개요

UI 컴포넌트 관리, 시간대 처리, 코드 검색을 위한 **31개 핵심 도구**를 제공합니다.

### 📊 도구 개요

| 서버 | 도구 수 | 주요 기능 |
|------|---------|-----------| 
| `shadcn` | 4개 | UI 컴포넌트 관리 |
| `time` | 2개 | 시간대 변환 |
| `serena` | 25개 | 코드 검색 & 분석 |

**총 도구 수**: 31개  
**응답 속도**: 평균 100-300ms

---

## 🎨 ShadCN MCP 도구

**목적**: shadcn/ui 컴포넌트 통합 관리

### `mcp__shadcn__list_components`

**컴포넌트 목록 조회**

```typescript
await mcp__shadcn__list_components({
  category?: string  // 카테고리 필터 (선택)
});

// 예시
await mcp__shadcn__list_components({
  category: 'form'
});

// 반환값 예시
{
  "components": [
    {
      "name": "button",
      "description": "Displays a button or a component that looks like a button.",
      "category": "ui",
      "dependencies": ["@radix-ui/react-slot"]
    },
    {
      "name": "input", 
      "description": "Displays a form input field.",
      "category": "form",
      "dependencies": []
    }
  ]
}
```

### `mcp__shadcn__get_component`

**컴포넌트 소스 코드 조회**

```typescript
await mcp__shadcn__get_component({
  componentName: string  // 컴포넌트명
});

// 예시
await mcp__shadcn__get_component({
  componentName: 'button'
});

// 반환값 예시
{
  "name": "button",
  "type": "ui",
  "source": "import * as React from \"react\"\nimport { Slot } from \"@radix-ui/react-slot\"...",
  "files": [
    {
      "name": "button.tsx",
      "content": "// 컴포넌트 소스 코드"
    }
  ],
  "dependencies": ["@radix-ui/react-slot", "class-variance-authority"]
}
```

### `mcp__shadcn__get_block`

**shadcn/ui 블록 조회**

```typescript
await mcp__shadcn__get_block({
  blockName: string  // 블록명
});

// 예시
await mcp__shadcn__get_block({
  blockName: 'dashboard-01'
});

// 반환값: 완전한 대시보드 블록 구현
```

### `mcp__shadcn__list_blocks`

**블록 목록 조회**

```typescript
await mcp__shadcn__list_blocks();

// 반환값: 사용 가능한 모든 블록 목록
```

---

## ⏰ Time MCP 도구

**목적**: 시간대 관리 및 변환

### `mcp__time__get_current_time`

**현재 시간 조회**

```typescript
await mcp__time__get_current_time({
  timezone: string  // IANA 시간대명
});

// 예시
await mcp__time__get_current_time({
  timezone: 'Asia/Seoul'
});

// 반환값 예시
{
  "timezone": "Asia/Seoul",
  "datetime": "2025-08-18T15:30:45+09:00",
  "utc_datetime": "2025-08-18T06:30:45Z",
  "timestamp": 1724569845,
  "formatted": "2025년 8월 18일 일요일 오후 3:30"
}
```

### `mcp__time__convert_time`

**시간대 변환**

```typescript
await mcp__time__convert_time({
  source_timezone: string,    // 소스 시간대
  target_timezone: string,    // 대상 시간대  
  time: string               // 변환할 시간 (HH:MM 형식)
});

// 예시
await mcp__time__convert_time({
  source_timezone: 'America/New_York',
  target_timezone: 'Asia/Seoul',
  time: '14:30'
});

// 반환값 예시
{
  "source": {
    "timezone": "America/New_York",
    "time": "14:30",
    "datetime": "2025-08-18T14:30:00-04:00"
  },
  "target": {
    "timezone": "Asia/Seoul", 
    "time": "03:30",
    "datetime": "2025-08-19T03:30:00+09:00"
  },
  "time_difference": "+13 hours"
}
```

---

## 🔍 Serena MCP 도구

**목적**: 코드 검색 및 프로젝트 분석

### `mcp__serena__activate_project`

**프로젝트 활성화**

```typescript
await mcp__serena__activate_project({
  project_path: string  // 프로젝트 경로
});

// 예시
await mcp__serena__activate_project({
  project_path: '/mnt/d/cursor/openmanager-vibe-v5'
});
```

### `mcp__serena__list_dir`

**디렉토리 목록**

```typescript
await mcp__serena__list_dir({
  path: string  // 디렉토리 경로
});

// 예시
await mcp__serena__list_dir({
  path: 'src/components'
});
```

### `mcp__serena__read_file`

**파일 읽기**

```typescript
await mcp__serena__read_file({
  path: string,        // 파일 경로
  start_line?: number, // 시작 라인
  end_line?: number    // 종료 라인
});

// 예시
await mcp__serena__read_file({
  path: 'src/app/page.tsx',
  start_line: 1,
  end_line: 50
});
```

### `mcp__serena__search_for_pattern`

**패턴 검색**

```typescript
await mcp__serena__search_for_pattern({
  pattern: string,           // 검색 패턴 (정규식)
  file_pattern?: string,     // 파일 패턴
  case_sensitive?: boolean   // 대소문자 구분
});

// 예시
await mcp__serena__search_for_pattern({
  pattern: 'useState',
  file_pattern: '*.tsx',
  case_sensitive: true
});
```

### `mcp__serena__find_symbol`

**심볼 검색**

```typescript
await mcp__serena__find_symbol({
  symbol: string,      // 검색할 심볼명
  symbol_type?: string // 심볼 타입 (function, class, interface 등)
});

// 예시
await mcp__serena__find_symbol({
  symbol: 'ServerMonitor',
  symbol_type: 'class'
});
```

### `mcp__serena__execute_shell_command`

**쉘 명령 실행**

```typescript
await mcp__serena__execute_shell_command({
  command: string,      // 실행할 명령어
  working_dir?: string  // 작업 디렉토리
});

// 예시
await mcp__serena__execute_shell_command({
  command: 'npm run test',
  working_dir: '/mnt/d/cursor/openmanager-vibe-v5'
});
```

### 추가 Serena 도구들

- `mcp__serena__write_file`: 파일 쓰기
- `mcp__serena__create_file`: 새 파일 생성  
- `mcp__serena__delete_file`: 파일 삭제
- `mcp__serena__rename_file`: 파일 이름 변경
- `mcp__serena__create_directory`: 디렉토리 생성
- `mcp__serena__get_file_info`: 파일 정보 조회
- `mcp__serena__search_and_replace`: 검색 후 치환
- `mcp__serena__get_dependencies`: 의존성 분석
- `mcp__serena__analyze_code_quality`: 코드 품질 분석
- `mcp__serena__generate_documentation`: 문서 자동 생성
- `mcp__serena__refactor_code`: 코드 리팩토링
- `mcp__serena__find_unused_code`: 사용하지 않는 코드 찾기
- `mcp__serena__calculate_complexity`: 복잡도 계산
- `mcp__serena__suggest_improvements`: 개선 제안
- `mcp__serena__track_changes`: 변경 추적
- `mcp__serena__backup_project`: 프로젝트 백업
- `mcp__serena__restore_backup`: 백업 복원
- `mcp__serena__list_memories`: 메모리 목록
- `mcp__serena__save_memory`: 메모리 저장

---

## 🚀 실전 활용 예시

### shadcn/ui 컴포넌트 통합

```typescript
// 1. 사용 가능한 컴포넌트 확인
const components = await mcp__shadcn__list_components({
  category: 'form'
});

// 2. 필요한 컴포넌트 소스 가져오기
const buttonComponent = await mcp__shadcn__get_component({
  componentName: 'button'
});

// 3. 프로젝트에 컴포넌트 추가
await mcp__serena__create_file({
  path: 'src/components/ui/button.tsx',
  content: buttonComponent.source
});

// 4. 컴포넌트 사용 예제
const usage = `
import { Button } from '@/components/ui/button'

export function LoginForm() {
  return (
    <Button variant="default" size="lg">
      로그인
    </Button>
  )
}
`;
```

### 글로벌 개발 시간 관리

```typescript
// 1. 현재 한국 시간
const seoulTime = await mcp__time__get_current_time({
  timezone: 'Asia/Seoul'
});

// 2. 미국 동부 시간으로 변환
const nyTime = await mcp__time__convert_time({
  source_timezone: 'Asia/Seoul',
  target_timezone: 'America/New_York', 
  time: '09:00'
});

// 3. 개발팀 회의 시간 조정
console.log(`한국 오전 9시 = 뉴욕 ${nyTime.target.time}`);

// 4. 배포 스케줄링
const deployTime = await mcp__time__convert_time({
  source_timezone: 'Asia/Seoul',
  target_timezone: 'UTC',
  time: '02:00'
});
```

### 코드베이스 전체 분석

```typescript
// 1. 프로젝트 활성화
await mcp__serena__activate_project({
  project_path: '/mnt/d/cursor/openmanager-vibe-v5'
});

// 2. React Hook 사용 패턴 분석
const hookUsage = await mcp__serena__search_for_pattern({
  pattern: 'use[A-Z][a-zA-Z]*',
  file_pattern: '*.tsx',
  case_sensitive: true
});

// 3. 컴포넌트 복잡도 분석
const complexity = await mcp__serena__calculate_complexity({
  path: 'src/components',
  file_pattern: '*.tsx'
});

// 4. 사용하지 않는 코드 정리
const unusedCode = await mcp__serena__find_unused_code({
  path: 'src',
  exclude_patterns: ['*.test.ts', '*.spec.ts']
});

// 5. 코드 품질 개선 제안
const suggestions = await mcp__serena__suggest_improvements({
  path: 'src/lib',
  focus: 'performance'
});
```

---

## 🚨 문제 해결

### ShadCN 컴포넌트 오류

**증상**: `Component not found` 또는 `Invalid component name`

**해결책**:
```typescript
// 1. 사용 가능한 컴포넌트 확인
const available = await mcp__shadcn__list_components();
console.log('사용 가능한 컴포넌트:', available.components.map(c => c.name));

// 2. 정확한 컴포넌트명 사용
const validComponent = await mcp__shadcn__get_component({
  componentName: 'button' // 정확한 이름 사용
});
```

### 시간대 변환 오류

**증상**: `Invalid timezone` 또는 `Time format error`

**해결책**:
```typescript
// 1. IANA 표준 시간대명 사용
const validTimezones = [
  'Asia/Seoul',        // ✅ 올바름
  'America/New_York',  // ✅ 올바름
  'Europe/London',     // ✅ 올바름
  // 'KST',            // ❌ 잘못됨
  // 'EST'             // ❌ 잘못됨
];

// 2. 올바른 시간 형식 (HH:MM)
await mcp__time__convert_time({
  source_timezone: 'Asia/Seoul',
  target_timezone: 'America/New_York',
  time: '14:30'  // HH:MM 형식
});
```

### Serena 연결 오류

**증상**: `Connection timeout` 또는 `Server not responding`

**해결책**:
```typescript
// 1. 프로젝트 재활성화
await mcp__serena__activate_project({
  project_path: '/mnt/d/cursor/openmanager-vibe-v5'
});

// 2. 간단한 명령으로 연결 테스트
await mcp__serena__list_dir({
  path: '.'
});

// 3. SSE 모드 재시작 (필요시)
// ./scripts/start-serena-sse.sh
```

---

## ⚡ 성능 최적화 팁

### ShadCN 컴포넌트 최적화
- 필요한 컴포넌트만 가져오기
- 컴포넌트 캐싱 활용
- 의존성 최소화

### 시간 도구 효율성
- UTC 기준 시간 저장
- 시간대 변환 캐싱
- 배치 처리 활용

### Serena 성능 향상
- 프로젝트 인덱싱 최적화
- 검색 패턴 구체화
- 불필요한 파일 제외

---

## 📚 관련 문서

- [MCP 파일시스템 & 메모리 도구](./mcp-tools-filesystem-memory.md)
- [MCP 데이터베이스 & 클라우드 도구](./mcp-tools-database-cloud.md)
- [MCP 웹 & 브라우저 도구](./mcp-tools-web-browser.md)
- [ShadCN UI 설정 가이드](../guides/ui-components-setup.md)
- [Serena 코드 검색 고급 가이드](../mcp/serena-advanced-guide.md)

---

**💡 팁**: AI & 유틸리티 도구들을 조합하면 개발 워크플로우를 완전히 자동화할 수 있습니다!