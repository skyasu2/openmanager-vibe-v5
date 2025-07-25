# Sub Agents 설정 파일 작성 가이드

## 📌 개요

Claude Code의 Sub Agents 설정 파일을 효과적으로 작성하는 방법을 안내합니다.

## ✅ 권장 사항

### 1. Description 필드 작성

**❌ 피해야 할 방식:**

```yaml
description: Use this agent when you need to... [여러 줄에 걸친 긴 설명과 예시들]
```

**✅ 권장하는 방식:**

```yaml
description: 간결한 한 줄 설명. 핵심 기능만 언급. 최대 150자 이내.
```

### 2. 전체 파일 구조

```markdown
---
name: agent-name
description: 간결한 설명 (한 줄, 150자 이내)
color: blue # 선택사항
---

[에이전트 역할 설명]

## When to activate this agent:

- 활성화 조건 1
- 활성화 조건 2
- 활성화 조건 3

## Example scenarios:

- "사용자 요청 예시" → 에이전트가 수행할 작업
- "다른 요청 예시" → 처리 방법

[나머지 상세 지시사항]
```

### 3. 파일 길이 가이드라인

- **이상적**: 30-40줄
- **최대**: 50줄
- **경고**: 60줄 초과 시 내용 분할 고려

### 4. Description 필드 체크리스트

- [ ] 한 줄로 작성되었는가?
- [ ] 150자 이내인가?
- [ ] 핵심 기능만 포함했는가?
- [ ] 예시나 상세 설명은 본문으로 이동했는가?

## 🎯 좋은 예시

### test-automation-specialist

```yaml
description: Creates, runs, and analyzes tests. Handles test generation, suite execution, failure analysis, and coverage improvement.
```

- ✅ 간결함
- ✅ 핵심 기능 명시
- ✅ 한 줄로 정리

### doc-structure-guardian

```yaml
description: Manages document structure, enforces documentation policies, and maintains markdown file organization standards.
```

- ✅ 명확한 책임 영역
- ✅ 세 가지 주요 기능 요약

## ⚠️ 주의사항

1. **Multi-line YAML 문자열 피하기**
   - `\n` 이스케이프 시퀀스 사용 금지
   - 여러 줄 description은 가독성과 파싱 문제 야기

2. **예시는 본문에**
   - Description에 `<example>` 태그 포함 금지
   - "When to activate" 섹션에 간단히 정리

3. **중복 제거**
   - Description과 본문 내용 중복 피하기
   - Description은 요약, 본문은 상세 설명

## 📝 템플릿

```markdown
---
name: [agent-name]
description: [한 줄 요약, 150자 이내]
---

You are a [전문 분야] specialist who [주요 역할].

## When to activate this agent:

- [활성화 조건 1]
- [활성화 조건 2]
- [활성화 조건 3]

## Example scenarios:

- "[사용자 요청]" → [처리 방법]
- "[사용자 요청]" → [처리 방법]

## Core responsibilities:

1. **[책임 1]**: [설명]
2. **[책임 2]**: [설명]
3. **[책임 3]**: [설명]

## Workflow:

1. [단계 1]
2. [단계 2]
3. [단계 3]

## Output format:

[출력 형식 설명]
```

## 🚀 마이그레이션 가이드

기존의 긴 description을 개선하는 방법:

1. **핵심 추출**: Description에서 핵심 기능만 추출
2. **예시 이동**: 모든 예시를 "Example scenarios" 섹션으로
3. **구조화**: 활성화 조건을 별도 섹션으로 정리
4. **길이 확인**: 전체 파일이 50줄 이내인지 확인

이 가이드를 따르면 더 읽기 쉽고 관리하기 쉬운 Sub Agent 설정 파일을 만들 수 있습니다.
