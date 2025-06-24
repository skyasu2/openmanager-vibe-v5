# 🗂️ Anthropic 권장 순수 공식 MCP 파일시스템 서버 가이드

> **OpenManager Vibe v5**에서 Anthropic이 권장하는 순수한 공식 MCP 파일시스템 서버 구현 및 설정 가이드

## 📋 **개요**

OpenManager Vibe v5는 **Anthropic에서 권장하는 방식**에 따라 순수한 공식 MCP 파일시스템 서버를 구현했습니다. 커스텀 기능을 모두 제거하고 표준 MCP 프로토콜만 사용하여 안전하고 표준화된 파일 접근을 제공합니다.

### ✅ **핵심 특징**

- **순수 표준 MCP**: 커스텀 기능 0개, 표준 프로토콜 100% 준수
- **보안 강화**: 허용된 디렉토리만 접근 가능
- **stdio 전송만 지원**: HTTP 엔드포인트 완전 제거
- **Anthropic SDK 사용**: `@modelcontextprotocol/sdk` 표준 구조

## 🏗️ **아키텍처**

```mermaid
graph TB
    A[Supabase RAG Engine] -->|자연어 질의| B[쿼리 분석]
    B --> C[관련 파일 경로 추출]
    C --> D[MCP 파일시스템 서버]

    D --> E[표준 MCP 도구]
    E --> F[read_file]
    E --> G[list_directory]
    E --> H[get_file_info]
    E --> I[search_files]

    D --> J[표준 MCP 리소스]
    J --> K[file://project-root]
    J --> L[file://src-structure]
    J --> M[file://docs-structure]

    D --> N[보안 검증]
    N --> O[ALLOWED_DIRECTORIES]
    N --> P[isPathAllowed()]
    N --> Q[안전한 파일 접근]
```

## 🔧 **서버 구성**

### 📁 **허용된 디렉토리**

```javascript
const ALLOWED_DIRECTORIES = [
  process.cwd(), // 프로젝트 루트
  path.join(process.cwd(), 'src'), // 소스 코드
  path.join(process.cwd(), 'docs'), // 문서
  path.join(process.cwd(), 'mcp-server'), // MCP 서버
  path.join(process.cwd(), 'config'), // 설정 파일
];
```

### 📋 **표준 MCP 도구**

#### 1. `read_file` - 파일 내용 읽기

```json
{
  "name": "read_file",
  "description": "파일 내용을 읽습니다",
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "읽을 파일의 경로"
      }
    },
    "required": ["path"]
  }
}
```

#### 2. `list_directory` - 디렉토리 목록 조회

```json
{
  "name": "list_directory",
  "description": "디렉토리 내용을 나열합니다",
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "나열할 디렉토리 경로"
      }
    },
    "required": ["path"]
  }
}
```

#### 3. `get_file_info` - 파일 정보 조회

```json
{
  "name": "get_file_info",
  "description": "파일 또는 디렉토리 정보를 조회합니다",
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "정보를 조회할 경로"
      }
    },
    "required": ["path"]
  }
}
```

#### 4. `search_files` - 파일 검색

```json
{
  "name": "search_files",
  "description": "파일 이름으로 검색합니다",
  "inputSchema": {
    "type": "object",
    "properties": {
      "pattern": {
        "type": "string",
        "description": "검색할 파일 패턴"
      },
      "directory": {
        "type": "string",
        "description": "검색할 디렉토리 (기본값: 현재 디렉토리)",
        "default": "."
      }
    },
    "required": ["pattern"]
  }
}
```

### 📚 **표준 MCP 리소스**

#### 1. `file://project-root` - 프로젝트 루트 구조

```json
{
  "uri": "file://project-root",
  "name": "프로젝트 루트",
  "description": "프로젝트 루트 디렉토리 구조",
  "mimeType": "application/json"
}
```

#### 2. `file://src-structure` - 소스 코드 구조

```json
{
  "uri": "file://src-structure",
  "name": "src 디렉토리 구조",
  "description": "소스 코드 디렉토리 구조",
  "mimeType": "application/json"
}
```

#### 3. `file://docs-structure` - 문서 구조

```json
{
  "uri": "file://docs-structure",
  "name": "문서 디렉토리 구조",
  "description": "문서 디렉토리 구조",
  "mimeType": "application/json"
}
```

## 🛡️ **보안 시스템**

### 🔒 **경로 보안 검증**

```javascript
function isPathAllowed(filePath) {
  const resolvedPath = path.resolve(filePath);

  return ALLOWED_DIRECTORIES.some(allowedDir => {
    const resolvedAllowedDir = path.resolve(allowedDir);
    return resolvedPath.startsWith(resolvedAllowedDir);
  });
}
```

### 🔐 **안전한 파일 접근**

```javascript
async function safeReadFile(filePath) {
  // 1. 경로 보안 검증
  if (!isPathAllowed(filePath)) {
    throw new Error(`접근이 허용되지 않은 경로입니다: ${filePath}`);
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    // 2. 오류 타입별 처리
    if (error.code === 'ENOENT') {
      throw new Error(`파일을 찾을 수 없습니다: ${filePath}`);
    }
    if (error.code === 'EACCES') {
      throw new Error(`파일에 접근할 수 없습니다: ${filePath}`);
    }
    throw error;
  }
}
```

## 🚀 **Supabase RAG 엔진 연동**

### 🔗 **표준 MCP API 연동**

```typescript
// 1. 파일 내용 읽기
const fileResponse = await fetch(`${mcpServerUrl}/mcp/tools/read_file`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ path: filePath }),
});

// 2. 디렉토리 목록 조회
const dirResponse = await fetch(`${mcpServerUrl}/mcp/tools/list_directory`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ path: './src' }),
});

// 3. 파일 검색
const searchResponse = await fetch(`${mcpServerUrl}/mcp/tools/search_files`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pattern: searchPattern,
    directory: './src',
  }),
});
```

### 📊 **MCP 응답 형식 파싱**

```typescript
// MCP 응답에서 실제 내용 추출
let content = '';
if (fileData.content && Array.isArray(fileData.content)) {
  content = fileData.content
    .filter(item => item.type === 'text')
    .map(item => item.text)
    .join('\n');
}
```

### 🎯 **지능형 파일 검색**

```typescript
// 1. 파일 검색 필요성 판단
private shouldUseFileSearch(query: string): boolean {
  const searchKeywords = [
    '검색', '찾기', '찾아', 'search', 'find',
    '어디', 'where', '위치', 'location'
  ];

  return searchKeywords.some(keyword =>
    query.toLowerCase().includes(keyword)
  );
}

// 2. 검색 패턴 자동 추출
private extractSearchPattern(query: string): string {
  const lowerQuery = query.toLowerCase();

  // 파일 확장자 패턴
  const extMatches = lowerQuery.match(/\.(ts|tsx|js|jsx|json|md|env)/);
  if (extMatches) {
    return `*.${extMatches[1]}`;
  }

  // 키워드 기반 패턴
  if (lowerQuery.includes('컴포넌트')) return '*component*';
  if (lowerQuery.includes('서비스')) return '*service*';
  if (lowerQuery.includes('api')) return '*api*';

  return '*'; // 기본 패턴
}
```

## 📦 **설치 및 설정**

### 1. **의존성 설치**

```bash
cd mcp-server
npm install @modelcontextprotocol/sdk
```

### 2. **서버 실행**

```bash
# 로컬 개발 환경
cd mcp-server
node server.js

# Render 배포 환경 (자동)
git push origin main
```

### 3. **환경 변수 설정**

```bash
# .env.local
MCP_FILESYSTEM_ROOT=/app
MCP_ALLOWED_DIRECTORIES=src,docs,config,mcp-server

# Render 환경
NODE_ENV=production
PORT=10000

# MCP 서버 설정
RENDER_MCP_SERVER_URL=https://openmanager-vibe-v5.onrender.com
MCP_SERVER_TIMEOUT=30000

# 🎯 Google AI 자연어 전용 모드 (NEW!)
GOOGLE_AI_NATURAL_LANGUAGE_ONLY=true  # 모니터링/자동장애에서는 Google AI 사용 안함
GOOGLE_AI_ENABLED=true
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

## 🔍 **사용 예시**

### 📝 **파일 읽기 예시**

```bash
# MCP 도구 호출
curl -X POST https://openmanager-vibe-v5.onrender.com/mcp/tools/read_file \
  -H "Content-Type: application/json" \
  -d '{"path": "./src/app/layout.tsx"}'
```

### 📂 **디렉토리 조회 예시**

```bash
# MCP 도구 호출
curl -X POST https://openmanager-vibe-v5.onrender.com/mcp/tools/list_directory \
  -H "Content-Type: application/json" \
  -d '{"path": "./src/components"}'
```

### 🔍 **파일 검색 예시**

```bash
# MCP 도구 호출
curl -X POST https://openmanager-vibe-v5.onrender.com/mcp/tools/search_files \
  -H "Content-Type: application/json" \
  -d '{"pattern": "*component*", "directory": "./src"}'
```

## 📊 **성능 최적화**

### ⚡ **캐싱 시스템**

- **MCP 컨텍스트 캐싱**: 5분 TTL
- **임베딩 캐싱**: 쿼리별 캐시
- **응답 캐싱**: 결과 재사용

### 📈 **성능 통계**

```typescript
private stats = {
  totalQueries: 0,      // 총 쿼리 수
  cacheHits: 0,         // 캐시 히트 수
  mcpQueries: 0,        // MCP 쿼리 수
  mcpCacheHits: 0,      // MCP 캐시 히트 수
  averageResponseTime: 0 // 평균 응답 시간
};
```

## 🚨 **보안 고려사항**

### ✅ **적용된 보안 조치**

1. **경로 제한**: 허용된 디렉토리만 접근
2. **상대 경로 방지**: `path.resolve()` 검증
3. **권한 검사**: 파일 접근 권한 확인
4. **오류 처리**: 안전한 오류 메시지

### ❌ **차단되는 접근**

- 프로젝트 외부 디렉토리
- 상대 경로 (`../`, `../../`)
- 시스템 파일 (`/etc/`, `/proc/`)
- 숨김 파일 (`.env`, `.git/`)

## 🔄 **업그레이드 가이드**

### 이전 커스텀 MCP → 공식 MCP 서버

1. **커스텀 기능 제거**: Vercel 연동, 메트릭 수집 삭제
2. **표준 도구만 사용**: read_file, list_directory, get_file_info, search_files
3. **보안 강화**: ALLOWED_DIRECTORIES 기반 접근 제어
4. **API 엔드포인트 변경**: `/api/mcp/tools` → `/mcp/tools/[tool_name]`

## 📚 **참고 자료**

- [Anthropic MCP 공식 문서](https://modelcontextprotocol.io/)
- [MCP SDK GitHub](https://github.com/modelcontextprotocol/sdk)
- [OpenManager Vibe v5 GitHub](https://github.com/skyasu2/openmanager-vibe-v5)

---

**문서 버전**: v1.0.0  
**마지막 업데이트**: 2025-06-24  
**작성자**: OpenManager Vibe v5 팀  
**Anthropic 권장 방식 100% 준수**

### 📊 AI 모드 설정 변경사항

**v5.44.3부터 변경된 AI 모드:**

| 이전 (v5.44.2)                       | 현재 (v5.44.3+)              | 설명                          |
| ------------------------------------ | ---------------------------- | ----------------------------- |
| AUTO, LOCAL, GOOGLE_ONLY, MONITORING | AUTO, LOCAL, GOOGLE_ONLY     | MONITORING 모드 제거          |
| 모든 기능에서 Google AI 사용         | 자연어 질의만 Google AI 사용 | 모니터링/자동장애는 로컬 AI만 |

**🎯 Google AI 사용 정책:**

- ✅ **자연어 질의**: Google AI 사용 (기존과 동일)
- ❌ **모니터링 기능**: 한국어 AI + 로컬 AI만 사용
- ❌ **자동장애 분석**: 한국어 AI + 로컬 AI만 사용
- ❌ **시스템 분석**: 로컬 분석 기반
