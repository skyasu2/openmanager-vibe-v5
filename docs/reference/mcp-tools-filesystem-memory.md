# 📁 MCP 파일시스템 & 메모리 도구 레퍼런스

> **2025년 8월 18일 기준**  
> **환경**: Claude Code v1.0.81 + MCP 서버  
> **카테고리**: 파일시스템 조작 + 지식 관리

## 📋 목차

1. [개요](#개요)
2. [Filesystem MCP 도구](#filesystem-mcp-도구)
3. [Memory MCP 도구](#memory-mcp-도구)
4. [실전 활용 예시](#실전-활용-예시)
5. [문제 해결](#문제-해결)

---

## 🎯 개요

파일시스템 직접 조작과 지식 그래프 관리를 위한 **12개 핵심 도구**를 제공합니다.

### 📊 도구 개요

| 서버 | 도구 수 | 주요 기능 |
|------|---------|-----------|
| `filesystem` | 6개 | 파일/디렉토리 조작 |
| `memory` | 6개 | 지식 그래프 관리 |

**총 도구 수**: 12개  
**응답 속도**: 평균 50-200ms

---

## 📁 Filesystem MCP 도구

**목적**: 프로젝트 파일 시스템 직접 조작

### `mcp__filesystem__list_directory`

**파일/디렉토리 목록 조회**

```typescript
await mcp__filesystem__list_directory({
  path: string  // 절대 경로 또는 상대 경로
});

// 예시
await mcp__filesystem__list_directory({ 
  path: '/mnt/d/cursor/openmanager-vibe-v5' 
});

// 반환값 예시
{
  "directories": ["src", "docs", "scripts"],
  "files": ["package.json", "README.md", ".mcp.json"]
}
```

### `mcp__filesystem__read_text_file`

**텍스트 파일 읽기**

```typescript
await mcp__filesystem__read_text_file({
  path: string  // 파일 경로
});

// 예시
await mcp__filesystem__read_text_file({ 
  path: 'package.json' 
});

// 반환값: 파일 내용 (string)
```

### `mcp__filesystem__write_file`

**파일 쓰기/생성**

```typescript
await mcp__filesystem__write_file({
  path: string,    // 파일 경로
  content: string  // 파일 내용
});

// 예시
await mcp__filesystem__write_file({
  path: '/docs/new-guide.md',
  content: '# 새로운 가이드\n\n내용...'
});
```

### `mcp__filesystem__search_files`

**파일 검색**

```typescript
await mcp__filesystem__search_files({
  path: string,              // 검색 경로
  pattern: string,           // 파일 패턴 (glob)
  excludePatterns?: string[] // 제외 패턴
});

// 예시
await mcp__filesystem__search_files({
  path: '/mnt/d/cursor/openmanager-vibe-v5',
  pattern: '*.ts',
  excludePatterns: ['node_modules', '.next']
});

// 반환값: 매칭된 파일 경로 배열
```

### `mcp__filesystem__get_file_info`

**파일 정보 조회**

```typescript
await mcp__filesystem__get_file_info({
  path: string  // 파일 경로
});

// 반환값 예시
{
  "size": 1024,
  "modified": "2025-08-17T10:30:00Z",
  "isDirectory": false,
  "permissions": "rw-r--r--"
}
```

### `mcp__filesystem__create_directory`

**디렉토리 생성**

```typescript
await mcp__filesystem__create_directory({
  path: string  // 디렉토리 경로
});

// 예시
await mcp__filesystem__create_directory({ 
  path: '/docs/new-section' 
});
```

---

## 🧠 Memory MCP 도구

**목적**: 지식 그래프 및 컨텍스트 관리

### `mcp__memory__create_entities`

**지식 엔티티 생성**

```typescript
await mcp__memory__create_entities({
  entities: Array<{
    name: string,
    entityType: string,
    observations: string[]
  }>
});

// 예시
await mcp__memory__create_entities({
  entities: [{
    name: 'ProjectInfo',
    entityType: 'Knowledge',
    observations: [
      'OpenManager VIBE v5는 Next.js 15 기반',
      '12개 MCP 서버 통합',
      '무료 티어로 100% 운영'
    ]
  }]
});
```

### `mcp__memory__create_relations`

**엔티티 간 관계 생성**

```typescript
await mcp__memory__create_relations({
  relations: Array<{
    from: string,
    to: string,
    relationType: string
  }>
});

// 예시
await mcp__memory__create_relations({
  relations: [{
    from: 'ProjectInfo',
    to: 'MCP',
    relationType: 'uses'
  }]
});
```

### `mcp__memory__read_graph`

**전체 지식 그래프 읽기**

```typescript
await mcp__memory__read_graph();

// 반환값: 전체 엔티티와 관계 정보
{
  "entities": [...],
  "relations": [...],
  "metadata": {...}
}
```

### `mcp__memory__search_nodes`

**지식 노드 검색**

```typescript
await mcp__memory__search_nodes({
  query: string  // 검색 쿼리
});

// 예시
await mcp__memory__search_nodes({
  query: 'MCP 서버'
});
```

### `mcp__memory__delete_entities`

**엔티티 삭제**

```typescript
await mcp__memory__delete_entities({
  entityNames: string[]
});

// 예시
await mcp__memory__delete_entities({
  entityNames: ['TempEntity']
});
```

### `mcp__memory__open_nodes`

**지식 노드 열기**

```typescript
await mcp__memory__open_nodes({
  names: string[]  // 노드 이름 배열
});

// 예시
await mcp__memory__open_nodes({
  names: ['ProjectInfo', 'MCP']
});
```

---

## 🚀 실전 활용 예시

### 프로젝트 파일 분석 워크플로우

```typescript
// 1. 프로젝트 구조 파악
const structure = await mcp__filesystem__list_directory({
  path: '/mnt/d/cursor/openmanager-vibe-v5'
});

// 2. TypeScript 파일 검색
const tsFiles = await mcp__filesystem__search_files({
  path: '/mnt/d/cursor/openmanager-vibe-v5/src',
  pattern: '*.ts',
  excludePatterns: ['*.test.ts', '*.spec.ts']
});

// 3. 주요 파일 내용 읽기
const packageJson = await mcp__filesystem__read_text_file({
  path: 'package.json'
});

// 4. 프로젝트 정보를 지식 그래프에 저장
await mcp__memory__create_entities({
  entities: [{
    name: 'ProjectStructure',
    entityType: 'Analysis',
    observations: [
      `총 TypeScript 파일: ${tsFiles.length}개`,
      `메인 디렉토리: ${structure.directories.join(', ')}`,
      '프로젝트 분석 완료'
    ]
  }]
});
```

### 문서 관리 자동화

```typescript
// 1. 새 문서 생성
await mcp__filesystem__write_file({
  path: '/docs/api/new-endpoint.md',
  content: `# 새 API 엔드포인트

## 개요
...
`
});

// 2. 문서 디렉토리 생성
await mcp__filesystem__create_directory({
  path: '/docs/api'
});

// 3. 문서 메타데이터 저장
await mcp__memory__create_entities({
  entities: [{
    name: 'NewEndpointDoc',
    entityType: 'Documentation',
    observations: [
      '새 API 엔드포인트 문서 생성',
      '위치: /docs/api/new-endpoint.md',
      '작성일: 2025-08-18'
    ]
  }]
});
```

---

## 🚨 문제 해결

### 파일 시스템 오류

**증상**: `Permission denied` 또는 `File not found`

**해결책**:
```typescript
// 1. 파일 정보 확인
const info = await mcp__filesystem__get_file_info({
  path: '/target/file.txt'
});

// 2. 디렉토리 존재 확인
await mcp__filesystem__list_directory({
  path: '/target'
});
```

### Memory 그래프 관리

**증상**: 중복 엔티티 또는 관계 오류

**해결책**:
```typescript
// 1. 기존 엔티티 확인
const existing = await mcp__memory__search_nodes({
  query: 'EntityName'
});

// 2. 필요시 삭제 후 재생성
if (existing.length > 0) {
  await mcp__memory__delete_entities({
    entityNames: ['EntityName']
  });
}
```

---

## 📚 관련 문서

- [MCP 데이터베이스 & 클라우드 도구](./mcp-tools-database-cloud.md)
- [MCP 웹 & 브라우저 도구](./mcp-tools-web-browser.md)
- [MCP AI & 유틸리티 도구](./mcp-tools-ai-utility.md)
- [MCP 설치 가이드](../mcp/mcp-complete-installation-guide-2025.md)

---

**💡 팁**: 파일시스템과 메모리 도구를 조합하면 프로젝트 분석과 지식 관리를 자동화할 수 있습니다!