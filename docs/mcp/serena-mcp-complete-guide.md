# 🚀 Serena MCP 완전 가이드

> **상태**: ✅ 연결 성공, 도구 등록 실패 (프로토콜 호환성 문제)  
> **업데이트**: 2025년 8월 16일  
> **통합 완료**: 설정 가이드 + 실전 활용법 통합 문서

## 📋 목차

1. [개요](#개요)
2. [설치 및 설정](#설치-및-설정)
3. [현재 상태](#현재-상태)
4. [핵심 기능 (이론)](#핵심-기능)
5. [활용 시나리오](#활용-시나리오)
6. [문제 해결](#문제-해결)
7. [대안 도구](#대안-도구)

## 🎯 개요

Serena는 **Language Server Protocol(LSP)** 기반의 강력한 코드 분석 및 편집 도구를 제공하는 MCP 서버입니다. Claude Code에서 고급 코드 분석을 위해 설계되었습니다.

### 핵심 특징

- **심볼 기반 분석**: 텍스트가 아닌 코드 구조 수준에서 이해
- **안전한 리팩토링**: 심볼 단위로 정확한 코드 수정
- **프로젝트 지식 관리**: 메모리 기능으로 컨텍스트 유지
- **빠른 코드 탐색**: 참조 관계 및 의존성 추적

### 다른 도구와의 차이점

| 기능            | Filesystem MCP | GitHub MCP  | Serena MCP       |
| --------------- | -------------- | ----------- | ---------------- |
| 파일 읽기       | ✅ 텍스트 기반 | ✅ API 기반 | ✅ 심볼 기반     |
| 코드 구조 파악  | ❌             | ❌          | ✅ LSP 활용      |
| 리팩토링        | ❌             | ❌          | ✅ 안전한 변경   |
| 의존성 추적     | ❌             | ❌          | ✅ 자동 분석     |
| 프로젝트 메모리 | ❌             | ❌          | ✅ 컨텍스트 유지 |

## ⚙️ 설치 및 설정

### 사전 준비

```bash
# UV 설치 확인 (필수)
uvx --version
# 출력: uvx 0.8.8 이상

# 없다면 설치
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### MCP 서버 등록

```bash
# 1. JSON 방식으로 등록 (권장)
claude mcp add-json "serena" \
'{"command":"uvx","args":["--from","git+https://github.com/oraios/serena","serena-mcp-server"]}'

# 2. 일반 명령어 방식 (대안)
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena-mcp-server

# 3. 설정 확인
claude mcp list
claude mcp get serena
```

### WSL 환경 최적화

```bash
# WSL에서 UV 환경 확인
echo $PATH | grep -o "[^:]*uv[^:]*"

# UV 캐시 위치 확인
uvx --help | grep cache

# 필요시 권한 설정
sudo chown -R $USER:$USER ~/.local/share/uv
```

## 📊 현재 상태

### ✅ 연결 성공, ⚠️ 도구 등록 실패

```
MCP Server: serena
Status: ✓ Connected
Available tools: 0  (문제 상황)
```

**문제 분석**:

1. **연결 성공**: Serena MCP 서버 자체는 정상 실행
2. **도구 미등록**: 프로토콜 호환성 문제로 도구들이 Claude Code에 등록되지 않음
3. **호환성 이슈**: Serena 프로토콜 버전과 Claude Code MCP 호환성 불일치

### 예상 도구 목록 (정상 작동 시)

```typescript
// 코드 구조 분석
mcp__serena__get_symbols_overview(); // 디렉토리/파일 심볼 개요
mcp__serena__find_symbol(); // 특정 심볼 검색
mcp__serena__get_references(); // 심볼 참조 관계

// 코드 편집
mcp__serena__edit_symbol(); // 심볼 단위 수정
mcp__serena__replace_symbol(); // 심볼 교체
mcp__serena__refactor_symbol(); // 안전한 리팩토링

// 프로젝트 관리
mcp__serena__remember(); // 컨텍스트 저장
mcp__serena__recall(); // 컨텍스트 회수
mcp__serena__analyze_dependencies(); // 의존성 분석
```

## 🔧 핵심 기능 (이론적 활용법)

Serena가 정상 작동한다면 다음과 같은 고급 기능을 사용할 수 있습니다:

### 1. 코드 구조 파악

```typescript
// 전체 디렉토리 심볼 개요
mcp__serena__get_symbols_overview({
  relative_path: 'src/services/ai',
  max_answer_chars: 10000,
});

// 특정 파일의 모든 심볼
mcp__serena__get_symbols_overview({
  relative_path: 'src/services/ai/SimplifiedQueryEngine.ts',
});
```

### 2. 심볼 검색 및 분석

```typescript
// 클래스 찾기
mcp__serena__find_symbol({
  name_path: 'SimplifiedQueryEngine',
  relative_path: 'src/services/ai/SimplifiedQueryEngine.ts',
  include_body: true,
  depth: 1,
});

// 특정 메소드 찾기
mcp__serena__find_symbol({
  name_path: 'SimplifiedQueryEngine/query',
  relative_path: 'src/services/ai/SimplifiedQueryEngine.ts',
  include_body: true,
});

// 패턴으로 심볼 찾기
mcp__serena__find_symbol({
  name_path: 'process',
  substring_matching: true,
  relative_path: 'src/',
});
```

### 3. 참조 관계 분석

```typescript
// 함수/클래스 사용처 찾기
mcp__serena__get_references({
  symbol_path: 'SimplifiedQueryEngine/query',
  relative_path: 'src/services/ai/SimplifiedQueryEngine.ts',
  include_external: true,
});

// 의존성 트리 분석
mcp__serena__analyze_dependencies({
  target_symbol: 'SimplifiedQueryEngine',
  depth: 3,
});
```

### 4. 안전한 코드 편집

```typescript
// 심볼 단위 수정
mcp__serena__edit_symbol({
  symbol_path: 'SimplifiedQueryEngine/query',
  relative_path: 'src/services/ai/SimplifiedQueryEngine.ts',
  new_implementation: `
    async query(prompt: string): Promise<QueryResult> {
      // 개선된 구현
      return this.enhancedQuery(prompt);
    }
  `,
});

// 심볼 이름 변경 (리팩토링)
mcp__serena__refactor_symbol({
  old_name: 'query',
  new_name: 'executeQuery',
  symbol_path: 'SimplifiedQueryEngine/query',
  update_references: true,
});
```

### 5. 프로젝트 컨텍스트 관리

```typescript
// 분석 결과 저장
mcp__serena__remember({
  key: 'ai-service-architecture',
  context:
    'SimplifiedQueryEngine이 메인 쿼리 처리기이며, PostgreSQLAdapter와 연동',
});

// 저장된 컨텍스트 회수
mcp__serena__recall({
  key: 'ai-service-architecture',
});
```

## 💡 활용 시나리오

### 시나리오 1: 레거시 코드 분석

```typescript
// 1. 복잡한 클래스 구조 파악
const overview = await mcp__serena__get_symbols_overview({
  relative_path: 'src/legacy/ComplexService.ts',
});

// 2. 의존성 분석
const deps = await mcp__serena__analyze_dependencies({
  target_symbol: 'ComplexService',
  depth: 2,
});

// 3. 사용처 분석
const refs = await mcp__serena__get_references({
  symbol_path: 'ComplexService',
  include_external: true,
});

// 4. 분석 결과 저장
await mcp__serena__remember({
  key: 'complex-service-analysis',
  context: `${overview}\n\nDependencies: ${deps}\n\nReferences: ${refs}`,
});
```

### 시나리오 2: 안전한 리팩토링

```typescript
// 1. 리팩토링 대상 메소드 찾기
const method = await mcp__serena__find_symbol({
  name_path: 'UserService/processUser',
  include_body: true,
});

// 2. 모든 사용처 확인
const usages = await mcp__serena__get_references({
  symbol_path: 'UserService/processUser',
});

// 3. 안전한 이름 변경
await mcp__serena__refactor_symbol({
  old_name: 'processUser',
  new_name: 'processUserData',
  symbol_path: 'UserService/processUser',
  update_references: true,
});
```

### 시나리오 3: 새 팀원 온보딩

```typescript
// 1. 주요 서비스 구조 문서화
const coreServices = [
  'src/services/ai/',
  'src/services/database/',
  'src/services/auth/',
];

for (const service of coreServices) {
  const structure = await mcp__serena__get_symbols_overview({
    relative_path: service,
    max_answer_chars: 5000,
  });

  await mcp__serena__remember({
    key: `architecture-${service.replace(/[^\w]/g, '-')}`,
    context: structure,
  });
}

// 2. 온보딩 문서 생성
const onboardingDoc = await mcp__serena__recall({
  key: 'all-architecture-docs',
});
```

## 🚨 문제 해결

### 현재 알려진 문제

#### 1. 도구 등록 실패

**증상**: 연결은 성공하지만 사용 가능한 도구가 0개

**원인**:

- Serena MCP 프로토콜 버전 불일치
- Claude Code MCP 호환성 문제
- UV 환경 설정 문제

**해결 시도 방법**:

```bash
# 1. 캐시 클리어 후 재설치
claude mcp remove serena
uvx --cache-dir ~/.cache/uv pip cache purge
claude mcp add-json "serena" \
'{"command":"uvx","args":["--from","git+https://github.com/oraios/serena","serena-mcp-server"]}'

# 2. 버전 강제 지정
claude mcp add-json "serena" \
'{"command":"uvx","args":["--from","git+https://github.com/oraios/serena@main","serena-mcp-server"]}'

# 3. 수동 설치 후 경로 지정
uvx --from git+https://github.com/oraios/serena serena-mcp-server --help
# 설치 경로 확인 후 절대 경로로 등록
```

#### 2. UV 권한 문제

```bash
# 권한 복구
sudo chown -R $USER:$USER ~/.local/share/uv
sudo chown -R $USER:$USER ~/.cache/uv

# UV 재설정
curl -LsSf https://astral.sh/uv/install.sh | sh
```

#### 3. 환경변수 문제

```bash
# PATH 확인
echo $PATH | grep uv

# 필요시 PATH 추가
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### 4. 시작 메시지 최적화

**문제**: Serena 시작 시 과도한 로그 출력 (시스템 프롬프트 180+ 줄)

**해결 방법**:

```yaml
# ~/.serena/serena_config.yml 설정
agent:
  startup:
    show_system_prompt: false
    show_tool_details: false
    concise_mode: true

logging:
  console:
    level: INFO
    filter_system_prompt: true
  file:
    level: DEBUG
    include_all: true
```

**환경변수 방식**:

```bash
# ~/.bashrc 또는 ~/.zshrc에 추가
export SERENA_STARTUP_MODE="concise"
export SERENA_LOG_SYSTEM_PROMPT="false"
export SERENA_SHOW_QUICK_START="true"
```

**커스텀 래퍼 스크립트**:

```bash
#!/bin/bash
# ~/bin/serena-start

# 간결한 모드로 Serena 시작
SERENA_STARTUP_MODE=concise \
SERENA_LOG_LEVEL=INFO \
serena mcp 2>&1 | grep -v "System prompt:" | \
sed 's/INFO.*serena.agent:create_system_prompt.*/✓ System configured/'
```

**기대 효과**:
- 시작 시간: 5초 → 2초
- 가독성 향상: 핵심 정보만 표시
- 사용성 개선: 명확한 다음 단계 안내

### 연결 상태 확인

```bash
# MCP 서버 상태 확인
claude mcp get serena

# 로그 확인 (있다면)
claude mcp logs serena

# 수동 실행 테스트
uvx --from git+https://github.com/oraios/serena serena-mcp-server --help
```

## 🔄 대안 도구

Serena MCP가 작동하지 않는 동안 유사한 기능을 위한 대안:

### 1. Filesystem MCP + 수동 분석

```typescript
// 파일 구조 분석
const files = await mcp__filesystem__list_directory({
  path: '/mnt/d/cursor/openmanager-vibe-v5/src/services/ai',
});

// 파일별 내용 분석
for (const file of files) {
  if (file.endsWith('.ts')) {
    const content = await mcp__filesystem__read_file({
      path: file,
    });
    // 수동으로 클래스/함수 추출
  }
}
```

### 2. GitHub MCP 활용

```typescript
// GitHub API로 코드 검색
const searchResults = await mcp__github__search_code({
  query: 'class SimplifiedQueryEngine',
  owner: 'username',
  repo: 'openmanager-vibe-v5',
});
```

### 3. 외부 도구 통합

```bash
# AST 분석 도구 활용
npx ts-node -e "
import * as ts from 'typescript';
import * as fs from 'fs';

const sourceFile = ts.createSourceFile(
  'temp.ts',
  fs.readFileSync('src/services/ai/SimplifiedQueryEngine.ts', 'utf8'),
  ts.ScriptTarget.ES2020,
  true
);

// AST 순회하여 심볼 추출
"
```

## 📈 향후 개선 계획

### 단기 계획

1. **프로토콜 호환성 해결**: Serena MCP 버전 업그레이드 대기
2. **대안 도구 개발**: 유사 기능의 커스텀 MCP 서버 검토
3. **수동 분석 도구**: TypeScript AST 기반 분석 스크립트 개발

### 장기 계획

1. **LSP 통합**: 직접 Language Server 연동
2. **커스텀 MCP**: 프로젝트 특화 코드 분석 서버 개발
3. **AI 코드 분석**: Claude 자체 코드 이해 능력 활용

---

## 💡 결론

Serena MCP는 강력한 코드 분석 도구이지만 현재 프로토콜 호환성 문제로 인해 사용할 수 없습니다. 연결은 성공하지만 도구가 등록되지 않는 상황입니다.

**현재 상황**:

- ✅ 설치 성공
- ✅ 연결 성공
- ❌ 도구 등록 실패

**대안 활용**:

- Filesystem MCP + 수동 분석
- GitHub MCP 코드 검색
- 외부 AST 분석 도구

향후 Serena MCP 호환성 문제가 해결되면 이 가이드의 모든 기능을 활용할 수 있을 것입니다.
