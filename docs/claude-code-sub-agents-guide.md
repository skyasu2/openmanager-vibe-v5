# Claude Code Sub Agents 사용 가이드

## 📌 개요

Claude Code의 Sub Agents는 특정 작업에 특화된 AI 에이전트로, 메인 Claude Code가 작업을 효율적으로 위임할 수 있도록 설계되었습니다.

## 🤖 현재 활성 Sub Agents

### 1. gemini-cli-collaborator

Gemini CLI와 협업하여 코드 품질을 검토하고 분석하는 전문 에이전트입니다.

**주요 기능:**

- 코드 품질 분석
- SOLID 원칙 위반 검사
- 타입 안전성 확인 (any 타입 사용 검출)
- 코드 중복 검사
- 문서 요약 및 설명

## 🎯 사용 방법

### 1. Sub Agents 확인

```bash
/agents
```

프로젝트에서 사용 가능한 모든 Sub Agents를 확인할 수 있습니다.

### 2. 자동 위임

Claude Code가 작업 내용을 분석하여 적절한 Sub Agent에 자동으로 위임합니다:

```
"이 코드의 보안 취약점을 검토해줘"
"모든 테스트 실행하고 실패하는 것들 수정해줘"
"프로젝트 구조를 분석해서 개선점을 제안해줘"
```

### 3. 명시적 요청

특정 Sub Agent를 직접 지정하여 사용할 수 있습니다:

```
"gemini-cli-collaborator를 사용해서 auth 모듈 검토해줘"
"gemini-cli-collaborator로 이 파일의 SOLID 원칙 위반 사항을 찾아줘"
```

## 💡 효과적인 활용 팁

### TDD 워크플로우에서의 활용

1. **Red 단계**: gemini-cli-collaborator로 기존 코드 분석
2. **Green 단계**: Claude가 테스트 통과하는 코드 작성
3. **Refactor 단계**: gemini-cli-collaborator로 코드 리뷰 후 개선

### 코드 리뷰 프로세스

```
# 1. 코드 품질 검토
"gemini-cli-collaborator로 src/services 디렉토리의 코드 품질을 분석해줘"

# 2. SOLID 원칙 검사
"이 클래스가 SOLID 원칙을 잘 따르는지 확인해줘"

# 3. 타입 안전성 확인
"any 타입 사용 여부를 검사하고 개선 방안을 제시해줘"
```

## 🔧 Custom Sub Agents 생성

프로젝트별 맞춤 Sub Agent를 생성할 수 있습니다:

```bash
# Sub Agent 생성 명령
/agents create [agent-name]

# 예시
/agents create security-reviewer
/agents create performance-optimizer
/agents create api-designer
```

생성된 Sub Agent는 `.claude/agents/` 디렉토리에 저장되어 팀원과 공유됩니다.

## 📊 Sub Agent vs 직접 도구 사용

### Sub Agent 사용이 적합한 경우:

- 복잡한 분석이 필요한 작업
- 여러 단계의 처리가 필요한 작업
- 전문적인 도메인 지식이 필요한 작업

### 직접 도구 사용이 적합한 경우:

- 단순한 파일 읽기/쓰기
- 빠른 검색이 필요한 경우
- 즉각적인 결과가 필요한 경우

## 🚀 향후 추가 예정 Sub Agents

- **security-reviewer**: 보안 취약점 전문 검토
- **performance-optimizer**: 성능 최적화 전문가
- **test-runner**: 테스트 실행 및 수정 전문가
- **api-designer**: API 설계 및 문서화 전문가

## 📝 참고사항

- Sub Agents는 프로젝트 컨텍스트를 이해하고 있어 더 정확한 분석이 가능합니다
- 여러 Sub Agent를 동시에 활용하여 병렬 처리가 가능합니다
- Sub Agent의 결과는 Claude Code가 통합하여 최종 솔루션을 제공합니다
