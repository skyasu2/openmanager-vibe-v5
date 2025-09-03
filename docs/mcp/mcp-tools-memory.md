# 🧠 Memory MCP 도구 가이드

> **지식 관리 시스템 - Knowledge Graph & 엔티티 관리**  
> 6개 도구 | Knowledge Graph 생성, 엔티티 관계 설정, 지식 검색

## 🎯 Memory MCP 개요

Memory MCP는 OpenManager VIBE v5의 **지식 관리 시스템**으로, Knowledge Graph를 통해 프로젝트 정보를 체계적으로 저장하고 검색할 수 있습니다.

### 🏗️ 핵심 구성요소

- **엔티티(Entity)**: 프로젝트, 파일, 함수, 개념 등
- **관계(Relation)**: 엔티티 간의 연결과 의존성
- **관찰(Observation)**: 각 엔티티에 대한 상세 정보
- **지식 그래프**: 모든 정보의 연결된 네트워크

---

## 🛠️ 도구 목록

### 1. `mcp__memory__create_entities`

**엔티티 생성 및 등록**

```typescript
await mcp__memory__create_entities({
  entities: [{
    name: string,           // 엔티티 이름
    entityType: string,     // 엔티티 유형
    observations: string[]  // 관련 정보 배열
  }]
});

// 실제 사용 예시
await mcp__memory__create_entities({
  entities: [{
    name: "ServerCard Component",
    entityType: "react_component",
    observations: [
      "Glassmorphism 디자인 적용된 서버 상태 카드",
      "Material You 색상 시스템 사용",
      "React.memo로 성능 최적화",
      "WCAG 접근성 준수"
    ]
  }]
});
```

**활용 시나리오**:
- 새로운 컴포넌트 개발 시 정보 등록
- 프로젝트 구조 변경 사항 기록
- AI 학습을 위한 컨텍스트 축적

### 2. `mcp__memory__create_relations`

**엔티티 간 관계 생성**

```typescript
await mcp__memory__create_relations({
  relations: [{
    from: string,      // 시작 엔티티
    to: string,        // 대상 엔티티  
    relationType: string  // 관계 유형
  }]
});

// 실제 사용 예시
await mcp__memory__create_relations({
  relations: [{
    from: "ServerCard Component",
    to: "Dashboard Page",
    relationType: "used_in"
  }, {
    from: "ServerCard Component", 
    to: "Material Design System",
    relationType: "implements"
  }]
});
```

**관계 유형 예시**:
- `depends_on`: 의존 관계
- `used_in`: 사용 관계
- `implements`: 구현 관계
- `extends`: 상속 관계
- `related_to`: 연관 관계

### 3. `mcp__memory__read_graph`

**지식 그래프 전체 조회**

```typescript
await mcp__memory__read_graph();

// 반환값 예시
{
  "entities": [
    {
      "name": "ServerCard Component",
      "entityType": "react_component",
      "observations": ["..."]
    }
  ],
  "relations": [
    {
      "from": "ServerCard Component",
      "to": "Dashboard Page", 
      "relationType": "used_in"
    }
  ]
}
```

**활용 시나리오**:
- 프로젝트 전체 구조 파악
- 의존성 분석
- 영향도 분석

### 4. `mcp__memory__search_nodes`

**엔티티 검색**

```typescript
await mcp__memory__search_nodes({
  query: string  // 검색 쿼리
});

// 실제 사용 예시
await mcp__memory__search_nodes({
  query: "React component optimization"
});

// 반환값: 관련 엔티티 목록
```

**검색 팁**:
- 키워드 중심으로 검색
- 엔티티 타입으로 필터링 가능
- 유사도 기반 추천 제공

### 5. `mcp__memory__delete_entities`

**엔티티 삭제**

```typescript
await mcp__memory__delete_entities({
  entityNames: string[]  // 삭제할 엔티티 이름 배열
});

// 실제 사용 예시  
await mcp__memory__delete_entities({
  entityNames: ["Old Component", "Deprecated Function"]
});
```

**⚠️ 주의사항**: 
- 관련 관계도 함께 삭제됨
- 실행 전 의존성 확인 필요

### 6. `mcp__memory__open_notes`

**메모 관리**

```typescript
await mcp__memory__open_notes({
  path?: string  // 메모 파일 경로 (선택사항)
});

// 반환값: 메모 내용 또는 편집기 열기
```

---

## 🎯 실전 활용 패턴

### 패턴 1: 컴포넌트 개발 워크플로우

```typescript
// 1. 새 컴포넌트 등록
await mcp__memory__create_entities({
  entities: [{
    name: "UserProfile Component",
    entityType: "react_component", 
    observations: [
      "사용자 프로필 표시 컴포넌트",
      "Avatar, 이름, 역할 정보 포함",
      "반응형 디자인 적용"
    ]
  }]
});

// 2. 관련 컴포넌트와 관계 설정
await mcp__memory__create_relations({
  relations: [{
    from: "UserProfile Component",
    to: "Avatar Component", 
    relationType: "depends_on"
  }]
});

// 3. 개발 완료 후 정보 업데이트
await mcp__memory__create_entities({
  entities: [{
    name: "UserProfile Component",
    entityType: "react_component",
    observations: [
      "사용자 프로필 표시 컴포넌트",
      "Avatar, 이름, 역할 정보 포함", 
      "반응형 디자인 적용",
      "✅ 개발 완료 - 2025-09-03",
      "테스트 커버리지 95% 달성"
    ]
  }]
});
```

### 패턴 2: 프로젝트 구조 분석

```typescript
// 1. 전체 구조 파악
const graph = await mcp__memory__read_graph();

// 2. 특정 영역 검색
const components = await mcp__memory__search_nodes({
  query: "react_component"
});

// 3. 의존성 분석을 위한 관계 추적
// (반환된 데이터로 의존성 트리 구성)
```

### 패턴 3: 지식 축적 및 학습

```typescript
// 개발 과정에서 학습한 내용 기록
await mcp__memory__create_entities({
  entities: [{
    name: "Glassmorphism Design Pattern",
    entityType: "design_pattern",
    observations: [
      "반투명 배경과 블러 효과를 활용한 디자인",
      "backdrop-filter: blur() CSS 속성 사용",
      "성능 최적화를 위해 transform3d 활용",
      "접근성 고려사항: 충분한 색상 대비 필요"
    ]
  }]
});
```

---

## 📊 성능 및 최적화

### 배치 처리 최적화

```typescript
// ❌ 개별 호출 (비효율적)
for (const entity of entities) {
  await mcp__memory__create_entities({ entities: [entity] });
}

// ✅ 배치 처리 (효율적)
await mcp__memory__create_entities({ entities });
```

### 검색 성능 향상

```typescript
// 구체적인 키워드 사용
await mcp__memory__search_nodes({ 
  query: "react component performance optimization" 
});

// 너무 일반적인 검색어 지양
await mcp__memory__search_nodes({ query: "component" }); // ❌
```

---

## 🔧 문제 해결

### 일반적인 오류

1. **엔티티 중복 생성**: 동일한 이름의 엔티티는 업데이트됨
2. **관계 생성 실패**: 대상 엔티티가 존재하지 않는 경우
3. **메모리 사용량**: 대량 데이터 처리 시 배치 크기 조절

### 디버깅 팁

```typescript
// 엔티티 존재 확인
const nodes = await mcp__memory__search_nodes({ 
  query: "EntityName" 
});

// 전체 그래프 상태 확인
const graph = await mcp__memory__read_graph();
console.log(`총 엔티티: ${graph.entities.length}개`);
console.log(`총 관계: ${graph.relations.length}개`);
```

---

## 📚 참고 자료

- **[MCP 메인 가이드](../MCP-GUIDE.md)**: 전체 MCP 시스템 개요
- **[Knowledge Graph 베스트 프랙티스](./mcp-knowledge-graph-patterns.md)**
- **[엔티티 설계 가이드](./mcp-entity-design-guide.md)**

---

**💡 팁**: Memory MCP는 프로젝트의 "기억"이 되어 AI와의 협업 효율성을 크게 향상시킵니다. 지속적으로 정보를 축적하면 더 정확한 추천과 분석이 가능해집니다.