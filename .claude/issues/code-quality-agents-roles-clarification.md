# Code Quality Agents Role Clarification

생성일: 2025-08-02 10:46 KST

## 현재 중복 분석

### 1. code-review-specialist

- **핵심 역할**: 코드 품질 분석 및 리뷰
- **중복 문제**:
  - structure-refactor-agent와 중복 검출 기능 중복
  - quality-control-checker와 SOLID 원칙 검사 중복
  - quality-control-checker와 파일 크기 검사 중복

### 2. quality-control-checker

- **핵심 역할**: CLAUDE.md 규칙 준수 검증
- **중복 문제**:
  - code-review-specialist와 SOLID 원칙 검사 중복
  - code-review-specialist와 파일 크기 검사 중복

### 3. structure-refactor-agent

- **핵심 역할**: 프로젝트 구조 분석 및 리팩토링
- **중복 문제**:
  - code-review-specialist와 중복 코드 검출 중복

## 명확한 역할 재정의

### 1. code-review-specialist (코드 로직 전문가)

**전담 영역**:

- 함수/메서드 레벨 코드 품질
- 알고리즘 복잡도 분석
- 버그 가능성 검출
- 성능 이슈 발견
- 타입 안전성 검증

**제거할 기능**:

- ❌ 파일 크기 검사 (quality-control-checker로 이관)
- ❌ 중복 코드 검출 (structure-refactor-agent로 이관)
- ❌ SOLID 원칙 검사 (quality-control-checker로 이관)

**집중할 기능**:

- ✅ 순환 복잡도 (Cyclomatic Complexity) 분석
- ✅ 인지 복잡도 (Cognitive Complexity) 분석
- ✅ 잠재적 버그 패턴 검출
- ✅ 성능 안티패턴 발견
- ✅ 타입 추론 개선 제안

### 2. quality-control-checker (프로젝트 규칙 감시자)

**전담 영역**:

- CLAUDE.md 모든 규칙 준수
- 프로젝트 표준 검증
- 문서화 규칙
- 보안 정책
- 파일/폴더 구조 규칙

**통합할 기능**:

- ✅ 파일 크기 제한 (500-1500줄)
- ✅ SOLID 원칙 준수 (프로젝트 차원)
- ✅ 커밋 규칙 검증
- ✅ 환경변수 사용 검증
- ✅ 문서 위치 규칙

**집중할 기능**:

- ✅ 프로젝트별 커스텀 규칙
- ✅ 무료 티어 한계 준수
- ✅ 보안 정책 준수
- ✅ 개발 환경 일관성
- ✅ 종합 검증 리포트

### 3. structure-refactor-agent (구조 설계 전문가)

**전담 영역**:

- 프로젝트 전체 구조 분석
- 모듈 간 의존성 분석
- 중복 코드 검출 및 통합
- 안전한 파일 이동/이름 변경
- import 경로 자동 업데이트

**통합할 기능**:

- ✅ 중복 코드 패턴 검출
- ✅ 모듈 경계 분석
- ✅ 순환 의존성 검출
- ✅ 폴더 구조 최적화
- ✅ 대규모 리팩토링 실행

**집중할 기능**:

- ✅ Before/After 영향 분석
- ✅ 점진적 마이그레이션 계획
- ✅ Git 히스토리 보존
- ✅ 롤백 전략 수립
- ✅ Gemini CLI 협업 조율

## 협업 프로토콜

### 순차적 실행 순서

1. **structure-refactor-agent**: 구조 분석 및 중복 검출
2. **code-review-specialist**: 개별 코드 품질 분석
3. **quality-control-checker**: 최종 규칙 준수 검증

### 병렬 실행 가능 조합

- code-review-specialist + structure-refactor-agent (독립적 분석)
- 단, quality-control-checker는 항상 마지막 실행

### 정보 공유 (Memory MCP)

```typescript
// structure-refactor-agent가 중복 발견 시
await mcp__memory__create_entities({
  entities: [
    {
      name: 'DuplicateCode:AuthValidation',
      entityType: 'code-issue',
      observations: [
        'Files: auth/login.ts, admin/auth.ts',
        'Lines: 45-89, 23-67',
        'Similarity: 87%',
      ],
    },
  ],
});

// code-review-specialist가 조회
const duplicates = await mcp__memory__search_nodes({
  query: 'DuplicateCode',
});
```

## 업데이트된 트리거 조건

### code-review-specialist

- PR 리뷰 요청 시
- 복잡한 함수/클래스 작성 후
- 성능 크리티컬 코드 수정 시
- 타입 에러 발생 시

### quality-control-checker

- 커밋 직전 (pre-commit)
- PR 생성 시
- 배포 준비 시
- 주간 정기 검사

### structure-refactor-agent

- 새 기능 추가 전 구조 검토
- 중복 코드 임계값 초과 시
- 폴더 구조 변경 필요 시
- 대규모 리팩토링 계획 시

## 구현 변경사항

각 에이전트의 description을 다음과 같이 수정:

1. **code-review-specialist**:
   "코드 로직 품질 전문가. 함수/메서드 레벨 분석, 복잡도 계산, 버그 패턴 검출, 성능 이슈 발견, 타입 안전성 검증. SOLID/파일크기는 quality-control-checker 담당, 중복검출은 structure-refactor-agent 담당."

2. **quality-control-checker**:
   "CLAUDE.md 규칙 감시자. 프로젝트 전체 규칙 준수 검증, 파일 크기(500-1500줄), SOLID 원칙, 문서 위치, 보안 정책, 환경 일관성. 개별 코드 품질은 code-review-specialist 담당."

3. **structure-refactor-agent**:
   "프로젝트 구조 설계가. 전체 구조 분석, 중복 코드 검출/통합, 모듈 의존성 분석, 안전한 리팩토링 실행. 코드 품질은 code-review-specialist, 규칙 준수는 quality-control-checker 담당."
