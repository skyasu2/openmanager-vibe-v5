# Serena MCP 26개 도구 완전 가이드

**업데이트**: 2025-09-16 | **Serena MCP 버전**: 최신 | **상태**: ✅ 정상 작동

## ⚠️ 필수 주의사항 (컨텍스트 압축 방지)

**컨텍스트 압축이란?**: Claude Code가 과도한 토큰을 로드하여 성능이 저하되는 현상 (5-20% 발생률)

### 안티패턴 (절대 금지!)

```typescript
// ❌ 절대 금지: skip_ignored_files 없이 루트 디렉토리 스캔
mcp__serena__list_dir({
  relative_path: '.', // 루트 디렉토리
  recursive: true, // skip_ignored_files 누락!
});
// 결과: 180초 타임아웃, 43K+ 토큰 응답 (25K 한도 초과)

// ❌ 절대 금지: 광범위한 패턴 검색
mcp__serena__search_for_pattern({
  substring_pattern: '권장', // 너무 일반적인 패턴
  relative_path: '', // 전체 프로젝트 스캔
});
// 결과: 42,999 토큰 응답 → MCP 한도 초과 → 컨텍스트 압축
```

### ✅ 올바른 사용법

```typescript
// ✅ 권장: skip_ignored_files 필수
mcp__serena__list_dir({
  relative_path: 'src/components', // 특정 디렉토리
  recursive: true,
  skip_ignored_files: true, // 필수! 48배 빠름, 80% 압축 방지
  max_answer_chars: 5000,
});

// ✅ 권장: 특정 파일/디렉토리 대상 검색
mcp__serena__search_for_pattern({
  substring_pattern: 'skip_ignored_files.*권장',
  relative_path: 'docs/environment/tools/mcp', // 범위 제한
  max_answer_chars: 10000, // 토큰 제한
});
```

**핵심 규칙**:

1. `list_dir` 사용 시 `skip_ignored_files: true` **필수**
2. `search_for_pattern` 사용 시 `relative_path` 특정 디렉토리로 제한
3. `max_answer_chars` 설정으로 응답 크기 제한 (5K-15K 권장)
4. 500줄+ 파일은 Serena 우선, Read() 대신 `get_symbols_overview()` 사용

---

## 🎯 Serena MCP 개요

**정확한 역할**: Language Server Protocol (LSP) + Model Context Protocol (MCP) 결합형 **시맨틱 코드 분석 전문 도구**

- **핵심 기능**: TypeScript/JavaScript 코드 구조 이해, 심볼 분석, 참조 추적
- **특화 분야**: 대규모 코드베이스 탐색, 리팩토링, 의존성 분석
- **성능 최적화**: 300초 타임아웃, 비인터랙티브 모드로 JSON-RPC 간섭 제거

## 🔧 Serena 26개 도구 상세 분류

### 📂 1. 파일 시스템 도구 (5개)

#### `read_file` - 파일 내용 읽기

```typescript
// 사용법: 파일의 특정 라인 범위 읽기
mcp__serena__read_file({
  relative_path: 'src/components/Button.tsx',
  start_line: 10, // 선택적
  end_line: 50, // 선택적
  max_answer_chars: 10000,
});
```

**최적 활용**: 코드 리뷰 전 특정 구간 집중 분석

#### `create_text_file` - 새 파일 생성

```typescript
// 사용법: 완전히 새로운 파일 생성
mcp__serena__create_text_file({
  relative_path: 'src/utils/newHelper.ts',
  content: 'export const helper = () => {...}',
});
```

**최적 활용**: 리팩토링으로 분리된 유틸리티 파일 생성

#### `list_dir` - 디렉토리 구조 탐색

```typescript
// 사용법: 프로젝트 구조 파악
mcp__serena__list_dir({
  relative_path: 'src/components',
  recursive: true,
  skip_ignored_files: true, // ⚠️ 필수: 48배 빠름, 타임아웃 방지
  max_answer_chars: 5000,
});
```

**최적 활용**: 새로운 프로젝트 구조 이해, 파일 위치 파악

#### `find_file` - 파일명 패턴 검색

```typescript
// 사용법: 와일드카드로 파일 검색
mcp__serena__find_file({
  file_mask: '*Client*.tsx',
  relative_path: 'src',
});
```

**최적 활용**: 명명 규칙 기반 관련 파일들 빠른 탐색

#### `search_for_pattern` - 코드 패턴 검색

```typescript
// 사용법: 정규표현식으로 코드 내용 검색
mcp__serena__search_for_pattern({
  substring_pattern: 'useState.*string',
  relative_path: 'src/components',
  restrict_search_to_code_files: true,
  context_lines_before: 2,
  context_lines_after: 2,
});
```

**최적 활용**: 특정 패턴의 코드 사용량 파악, 리팩토링 대상 식별

### 🧭 2. 심볼 분석 도구 (6개)

#### `get_symbols_overview` - 파일 심볼 개요

```typescript
// 사용법: 파일의 최상위 심볼들 빠른 파악
mcp__serena__get_symbols_overview({
  relative_path: 'src/hooks/useAuth.ts',
  max_answer_chars: 3000,
});
```

**최적 활용**: 새로운 파일 구조 빠른 이해, 리팩토링 계획 수립

#### `find_symbol` - 심볼 정밀 검색

```typescript
// 사용법: 특정 심볼과 그 하위 구조 분석
mcp__serena__find_symbol({
  name_path: 'AuthProvider/login', // 클래스/메서드
  relative_path: 'src/context/AuthContext.tsx',
  depth: 1, // 하위 심볼 포함
  include_body: true, // 코드 내용 포함
  include_kinds: [12, 6], // Function, Method만
  substring_matching: true,
});
```

**최적 활용**: 특정 함수/클래스 구현 분석, API 변경 영향도 파악

#### `find_referencing_symbols` - 참조 추적

```typescript
// 사용법: 특정 심볼을 사용하는 모든 곳 찾기
mcp__serena__find_referencing_symbols({
  name_path: 'useAuth',
  relative_path: 'src/hooks/useAuth.ts',
  include_kinds: [12], // Function 참조만
  max_answer_chars: 8000,
});
```

**최적 활용**: API 변경 전 영향도 분석, 안전한 리팩토링 계획

#### `replace_symbol_body` - 심볼 내용 교체

```typescript
// 사용법: 함수/클래스 전체 구현 교체
mcp__serena__replace_symbol_body({
  name_path: 'LoginForm/handleSubmit',
  relative_path: 'src/components/LoginForm.tsx',
  body: 'const handleSubmit = async (data: FormData) => {\n  // 새로운 구현\n}',
});
```

**최적 활용**: 메서드 구현 완전 교체, 타입 안전 보장

#### `insert_after_symbol` - 심볼 뒤 코드 삽입

```typescript
// 사용법: 특정 심볼 다음에 새 코드 추가
mcp__serena__insert_after_symbol({
  name_path: 'AuthProvider',
  relative_path: 'src/context/AuthContext.tsx',
  body: '\nexport const useAuthContext = () => {\n  return useContext(AuthContext);\n};',
});
```

**최적 활용**: 관련 유틸리티 함수 추가, 확장 기능 구현

#### `insert_before_symbol` - 심볼 앞 코드 삽입

```typescript
// 사용법: 특정 심볼 앞에 새 코드 추가
mcp__serena__insert_before_symbol({
  name_path: 'AuthProvider',
  relative_path: 'src/context/AuthContext.tsx',
  body: "import { createContext, useContext } from 'react';\n",
});
```

**최적 활용**: 필요한 import 자동 추가, 타입 정의 삽입

### 🔧 3. 고급 편집 도구 (2개)

#### `replace_regex` - 정규식 기반 교체

```typescript
// 사용법: 복잡한 패턴의 코드 일괄 교체
mcp__serena__replace_regex({
  relative_path: 'src/components/Dashboard.tsx',
  regex: 'const \\[(\\w+), set\\w+\\] = useState<(\\w+)>',
  repl: 'const [$1, set$1] = useState<$2>',
  allow_multiple_occurrences: true,
});
```

**최적 활용**: 코드 스타일 통일, 명명 규칙 일괄 적용

### 🧠 4. 메모리 관리 도구 (6개)

#### `write_memory` - 프로젝트 정보 기록

```typescript
// 사용법: 중요한 프로젝트 정보를 AI 메모리에 저장
mcp__serena__write_memory({
  memory_name: 'authentication-architecture',
  content:
    '# 인증 시스템 구조\n- OAuth + PIN 하이브리드\n- 세션 관리: localStorage + 서버 검증\n- 보안: bcrypt + rate limiting',
});
```

**최적 활용**: 아키텍처 결정사항 기록, 팀 지식 축적

#### `read_memory` - 저장된 정보 조회

```typescript
// 사용법: 이전에 저장한 프로젝트 정보 참조
mcp__serena__read_memory({
  memory_file_name: 'authentication-architecture.md',
});
```

**최적 활용**: 과거 설계 결정 참조, 일관성 있는 개발

#### `list_memories` - 메모리 목록 조회

**최적 활용**: 프로젝트 지식베이스 전체 파악

#### `delete_memory` - 불필요한 메모리 삭제

**최적 활용**: 오래된 정보 정리, 메모리 최적화

### ⚙️ 5. 시스템 도구 (7개)

#### `execute_shell_command` - 쉘 명령 실행

```typescript
// 사용법: 프로젝트 내에서 명령어 실행
mcp__serena__execute_shell_command({
  command: 'npm run test -- --coverage',
  cwd: './', // 프로젝트 루트
  capture_stderr: true,
  max_answer_chars: 10000,
});
```

**최적 활용**: 테스트 실행, 빌드 상태 확인, 의존성 설치

#### 기타 시스템 도구들

- `activate_project`: 프로젝트 전환
- `switch_modes`: 작업 모드 변경 (editing, interactive, planning 등)
- `get_current_config`: 현재 설정 상태 확인
- `check_onboarding_performed`: 프로젝트 초기화 상태 확인
- `onboarding`: 새 프로젝트 온보딩 가이드
- `prepare_for_new_conversation`: 새 대화 준비

### 🤔 6. 메타인지 도구 (3개)

#### `think_about_collected_information` - 수집 정보 검토

**사용 시점**: 복잡한 탐색/분석 작업 완료 후 반드시 호출
**최적 활용**: 정보 수집의 완성도와 관련성 검증

#### `think_about_task_adherence` - 작업 일치도 검토

**사용 시점**: 코드 수정/삽입/삭제 전 반드시 호출
**최적 활용**: 원래 요청사항과 현재 작업의 일치도 확인

#### `think_about_whether_you_are_done` - 완료도 검토

**사용 시점**: 작업 완료했다고 생각할 때 반드시 호출
**최적 활용**: 놓친 부분이 없는지 최종 검증

## 🎯 서브에이전트 연계 활용법

### code-review-specialist + Serena

```bash
# 1단계: Serena로 심볼 분석
find_symbol + find_referencing_symbols

# 2단계: code-review-specialist 서브에이전트로 품질 검토
"code-review-specialist 서브에이전트를 사용하여 Serena 분석 결과 기반으로 코드 품질을 검토해주세요"
```

### structure-refactor-specialist + Serena

```bash
# 1단계: Serena로 프로젝트 구조 파악
list_dir + get_symbols_overview

# 2단계: structure-refactor-specialist로 아키텍처 개선
"structure-refactor-specialist 서브에이전트를 사용하여 Serena가 분석한 구조를 기반으로 아키텍처를 개선해주세요"
```

### debugger-specialist + Serena

```bash
# 1단계: Serena로 버그 관련 심볼들 추적
search_for_pattern + find_referencing_symbols

# 2단계: debugger-specialist로 근본 원인 분석
"debugger-specialist 서브에이전트를 사용하여 Serena가 찾은 패턴을 기반으로 버그 원인을 분석해주세요"
```

## ⚡ 성능 최적화 팁

### 1. 타임아웃 관리

- **현재 설정**: 300초 (5분) - 대용량 프로젝트 대응
- **권장 사용**: 작은 범위부터 시작, 점진적 확장

### 2. 메모리 효율성

```typescript
// ✅ 좋은 예: 필요한 정보만 요청
get_symbols_overview({
  relative_path: 'specific/file.ts', // 특정 파일만
  max_answer_chars: 3000, // 적정 크기
});

// ❌ 피해야 할 예: 과도한 정보 요청
search_for_pattern({
  relative_path: 'src', // 전체 src 디렉토리
  max_answer_chars: 50000, // 과도한 크기
});
```

### 3. 단계적 탐색 전략

```bash
# 1단계: 개요 파악
list_dir → get_symbols_overview

# 2단계: 관심 영역 집중
find_symbol(depth=0, include_body=false)

# 3단계: 상세 분석
find_symbol(include_body=true) + find_referencing_symbols
```

## 🚀 실전 활용 시나리오

### 시나리오 1: 새로운 기능 추가

```bash
# 1. 프로젝트 구조 파악
list_dir + get_symbols_overview

# 2. 관련 기존 코드 분석
search_for_pattern + find_symbol

# 3. 영향도 분석
find_referencing_symbols

# 4. 안전한 코드 삽입
insert_after_symbol / insert_before_symbol

# 5. 메모리에 결정사항 기록
write_memory
```

### 시나리오 2: 버그 수정

```bash
# 1. 버그 관련 패턴 검색
search_for_pattern

# 2. 문제 심볼 식별
find_symbol(include_body=true)

# 3. 사용처 전체 파악
find_referencing_symbols

# 4. 안전한 수정
replace_symbol_body / replace_regex

# 5. 영향도 재검증
find_referencing_symbols
```

### 시나리오 3: 대규모 리팩토링

```bash
# 1. 전체 아키텍처 파악
list_dir(recursive=true) + 여러 get_symbols_overview

# 2. 의존성 맵 구축
다수의 find_referencing_symbols

# 3. 안전한 변경 계획 수립
write_memory로 계획 기록

# 4. 단계적 실행
replace_symbol_body, insert_after_symbol 등 단계적 적용

# 5. 각 단계마다 검증
think_about_task_adherence 필수 호출
```

---

## ⚠️ 주의사항

1. **타임아웃 관리**: 대용량 검색 시 300초 한계 인식
2. **메모리 효율성**: max_answer_chars로 응답 크기 제한
3. **안전한 편집**: 항상 find_referencing_symbols로 영향도 먼저 파악
4. **메타인지 활용**: think*about*\* 도구들을 적극 활용하여 작업 품질 보장

## 🎉 결론

Serena MCP는 **시맨틱 코드 분석의 강력한 도구**로, Claude Code의 코드 이해 능력을 대폭 강화시킵니다. 특히 대규모 TypeScript 프로젝트에서 안전하고 정밀한 리팩토링을 가능하게 하는 핵심 도구입니다.

**핵심 가치**: 코드를 '텍스트'가 아닌 '구조화된 심볼'로 이해하고 조작할 수 있게 해주는 혁신적 도구
