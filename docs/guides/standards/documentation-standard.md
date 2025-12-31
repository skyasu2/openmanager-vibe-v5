---
id: documentation-standard
title: 문서화 표준
keywords: [documentation, standards, versioning, markdown, guidelines]
priority: medium
ai_optimized: true
related_docs:
  - 'commit-conventions.md'
  - 'typescript-rules.md'
updated: '2025-12-19'
version: 'v5.83.x'
---

# Documentation Standards

<!-- Version: 1.0.0 | Author: Antigravity -->

이 문서는 프로젝트 내 문서 작성 및 관리에 대한 표준을 정의합니다. 모든 AI 에이전트와 개발자는 이 규칙을 준수해야 합니다.

## 1. 문서 버전 관리 (Versioning)

모든 주요 문서(`*.md`)는 상단에 HTML 주석 형식으로 버전과 작성자 정보를 포함해야 합니다.

### 형식
```markdown
<!-- Version: X.Y.Z | Author: {AI_NAME or USER_NAME} -->
```

### 규칙
- **X.Y.Z**: Semantic Versioning을 따르지 않아도 되지만, 변경 시마다 증가시켜야 합니다.
- **Author**: 문서를 마지막으로 수정한 주체(AI 모델명 또는 사용자명)를 기입합니다.
- **위치**: 문서 제목(`H1`) 바로 아래, 또는 파일 최상단에 위치합니다.

### 예시
```markdown
# My Document Title

<!-- Version: 1.2.0 | Author: Gemini -->

Content...
```

## 2. 문서 갱신 원칙

- 문서를 수정할 때는 반드시 버전 정보를 함께 업데이트합니다.
- `Last Updated`와 같은 별도 메타데이터는 선택사항이며, 버전 주석이 이를 대체할 수 있습니다.
