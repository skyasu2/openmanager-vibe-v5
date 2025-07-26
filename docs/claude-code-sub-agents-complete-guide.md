# Claude Code 서브 에이전트 완벽 가이드 📚

> Claude Code 공식 문서 기반 완벽 분석 (2025.01.26)

## 🤖 서브 에이전트란?

서브 에이전트는 특정 목적을 가진 전문화된 AI 어시스턴트로, 다음과 같은 특징을 가집니다:

- **독립적 컨텍스트 윈도우**: 각 서브 에이전트는 별도의 컨텍스트에서 작동
- **맞춤형 시스템 프롬프트**: 특정 작업에 최적화된 지시사항
- **제한된 도구 접근**: 필요한 도구만 선택적으로 사용
- **자동/수동 호출**: 상황에 따라 자동으로 활성화되거나 명시적 호출 가능

## 📁 디렉토리 구조

### 프로젝트 서브 에이전트

```
.claude/agents/
├── ai-systems-engineer.md
├── code-review-specialist.md
├── database-administrator.md
└── ...
```

### 사용자 서브 에이전트 (글로벌)

```
~/.claude/agents/
├── personal-assistant.md
└── writing-helper.md
```

> **우선순위**: 프로젝트 레벨 에이전트가 사용자 레벨보다 우선

## 📝 YAML Frontmatter 구조

### 필수 필드

```yaml
---
name: agent-name # 고유한 소문자 식별자 (하이픈 허용)
description: | # 자연어 설명 (언제 호출되는지 명시)
  에이전트의 목적과 전문 분야를 상세히 기술
---
```

### 선택 필드

```yaml
---
name: code-reviewer
description: 코드 품질 검토 전문가
tools: # 도구 접근 설정 (선택사항)
  - Read
  - Grep
  - Task
---
```

## 🛠️ 도구 접근 설정

### 기본 동작

- 모든 도구 상속 (tools 필드 생략 시)
- 메인 Claude의 모든 도구 사용 가능

### 제한적 접근

```yaml
tools:
  - Read # 파일 읽기만 허용
  - Grep # 검색만 허용
  - WebSearch # 웹 검색만 허용
```

### 도구 제한 권장사항

- 필요한 최소한의 도구만 지정
- 보안이 중요한 작업은 읽기 전용 도구만 허용
- 파괴적 작업(Write, Edit)은 신중히 부여

## 📋 서브 에이전트 작성 모범 사례

### 1. 단일 책임 원칙

```yaml
---
name: security-scanner
description: 보안 취약점 스캔 전문가. XSS, SQL 인젝션 등 탐지
tools:
  - Read
  - Grep
---
보안 스캔에만 집중하는 전문 에이전트입니다.
```

### 2. 상세한 시스템 프롬프트

```markdown
You are a security specialist focused on:

1. Identifying security vulnerabilities
2. Suggesting concrete fixes
3. Following OWASP guidelines
```

### 3. 명확한 트리거 조건

```yaml
description: |
  코드 리뷰 전문가. 다음 상황에서 자동 활성화:
  - PR 생성 또는 업데이트 시
  - 코드 변경 후 품질 검토 요청 시
  - 보안 취약점 스캔 필요 시
```

## 🚀 서브 에이전트 호출 방법

### 1. 자동 호출 (Proactive)

```yaml
description: |
  코드 변경 시 자동으로 활성화되어 품질 검토 수행
```

### 2. 명시적 호출

```python
Task(
  subagent_type="code-review-specialist",
  description="PR #123 보안 검토",
  prompt="XSS 취약점에 집중하여 검토해주세요"
)
```

### 3. 체인 호출

```python
# 순차적 실행
1. code-review-specialist → 코드 검토
2. test-automation-specialist → 테스트 생성
3. doc-structure-guardian → 문서 업데이트
```

## 📌 실제 예시

### 코드 리뷰어

```yaml
---
name: code-reviewer
description: |
  코드 품질과 보안을 검토하는 전문가. 
  SOLID 원칙, 보안 취약점, 성능 이슈를 감지합니다.
tools:
  - Read
  - Grep
  - Task
---
You are a code review specialist...
[상세 시스템 프롬프트]
```

### 데이터 과학자

```yaml
---
name: data-scientist
description: |
  데이터 분석과 ML 모델링 전문가.
  통계 분석, 시각화, 예측 모델링을 수행합니다.
tools:
  - Read
  - Write
  - Bash
  - WebSearch
---
You specialize in data analysis...
```

## ⚙️ 고급 설정

### 도구 접근 제어

```bash
# 서브 에이전트 도구 설정 확인
/agents

# 특정 에이전트 도구 수정
/agents code-reviewer
```

### 버전 관리

- 프로젝트 서브 에이전트는 Git으로 버전 관리
- 변경 이력 추적 및 롤백 가능
- 팀 간 공유 및 협업 용이

## 🔍 현재 프로젝트 서브 에이전트 점검 결과

### ✅ 잘 구성된 부분

1. **일관된 네이밍**: 모든 에이전트가 소문자와 하이픈 사용
2. **명확한 설명**: description 필드가 상세하고 명확
3. **MCP 추천**: recommended_mcp로 도구 가이드 제공

### ⚠️ 개선 필요 사항

1. **tools 필드 누락**: 대부분의 에이전트에 tools 필드가 없음
2. **시스템 프롬프트 부족**: 일부 에이전트의 본문이 짧음
3. **트리거 조건 불명확**: 자동 활성화 조건이 모호한 경우 존재

## 📈 권장 개선사항

### 1. tools 필드 추가

```yaml
tools:
  - Read
  - Grep
  - Task
  # 필요한 도구만 명시
```

### 2. 시스템 프롬프트 강화

- 구체적인 작업 단계 명시
- 출력 형식 지정
- 제약사항 및 가이드라인 포함

### 3. 자동 활성화 조건 명확화

```yaml
description: |
  다음 상황에서 자동 활성화:
  - 조건 1: 구체적 트리거
  - 조건 2: 명확한 상황
```

## 🎯 결론

현재 프로젝트의 서브 에이전트는 기본 구조는 잘 갖추고 있으나, Claude Code 공식 가이드라인에 따른 세부 개선이 필요합니다. 특히 도구 접근 제어와 시스템 프롬프트 강화가 우선순위입니다.
