# Claude Code 파일 읽기/쓰기 패턴 가이드

## 🎯 핵심 규칙

Claude Code는 파일 안전성을 위해 엄격한 읽기/쓰기 규칙을 적용합니다.

### 필수 규칙

1. **기존 파일 수정 시**: 반드시 Read → Write/Edit 순서 준수
2. **새 파일 생성 시**: Read 없이 Write 가능
3. **서브 에이전트도 동일**: Task 도구로 실행되는 에이전트도 같은 규칙 적용

## ❌ 자주 발생하는 에러

### "Error: File has not been read yet. Read it first before writing to it"

이 에러는 다음 상황에서 발생합니다:

- 기존 파일을 Read 없이 Write/Edit 시도
- 서브 에이전트가 main 에이전트의 컨텍스트 없이 파일 수정 시도
- 오래된 Read 컨텍스트로 파일 수정 시도

## ✅ 올바른 패턴

### 1. 단일 파일 수정

```python
# 1단계: 파일 읽기
Read(file_path="/path/to/file.ts")

# 2단계: 파일 수정
Edit(
    file_path="/path/to/file.ts",
    old_string="원본 내용",
    new_string="수정된 내용"
)
```

### 2. 여러 파일 수정

```python
# 모든 파일을 먼저 읽기
Read(file_path="/path/to/file1.ts")
Read(file_path="/path/to/file2.ts")

# 그 다음 수정
Edit(file_path="/path/to/file1.ts", ...)
Edit(file_path="/path/to/file2.ts", ...)
```

### 3. 서브 에이전트 사용 시

```python
Task(
    subagent_type="code-review-specialist",
    prompt="""다음 작업을 수행하세요:
    1. /src/file.ts 파일을 Read 도구로 읽으세요
    2. 코드 품질을 분석하세요
    3. 필요한 개선사항을 Edit 도구로 적용하세요

    주의: 파일 수정 전 반드시 Read를 먼저 실행하세요."""
)
```

## 🚨 주의사항

### 1. 컨텍스트 유효성

- Read한 파일 내용은 대화 중에만 유효
- 새로운 대화에서는 다시 Read 필요
- 파일이 외부에서 변경되었다면 다시 Read 필요

### 2. 서브 에이전트 독립성

- 각 서브 에이전트는 독립된 컨텍스트 보유
- main 에이전트가 읽은 파일을 서브 에이전트는 모름
- 서브 에이전트도 자체적으로 Read 필요

### 3. MultiEdit 사용

- 여러 부분을 수정할 때는 MultiEdit 권장
- 하지만 여전히 Read 먼저 필요

## 💡 베스트 프랙티스

### 1. 명시적 지시

서브 에이전트에게 파일 작업을 위임할 때:

```
"먼저 Read로 파일을 읽은 후 수정하세요"
```

### 2. 배치 읽기

관련 파일들을 한번에 읽기:

```python
# 병렬로 여러 파일 읽기
Read(file_path="/src/index.ts")
Read(file_path="/src/utils.ts")
Read(file_path="/src/types.ts")
```

### 3. 에러 핸들링

파일 읽기 실패 시 대처:

```python
# 파일 존재 확인
LS(path="/src")

# 파일이 있다면 읽기
Read(file_path="/src/file.ts")
```

## 🔄 워크플로우 예시

### 리팩토링 작업

```
1. 대상 파일 목록 확인 (LS)
2. 모든 파일 읽기 (Read)
3. 분석 및 계획 수립
4. 순차적으로 수정 (Edit/MultiEdit)
5. 결과 검증
```

### 서브 에이전트 활용

```
1. main: 작업 범위 파악
2. main: Task로 서브 에이전트 호출
3. sub: 파일 읽기 (Read)
4. sub: 분석 수행
5. sub: 파일 수정 (Edit)
6. main: 결과 확인
```

## 📖 관련 문서

- CLAUDE.md - 트러블슈팅 섹션
- docs/sub-agents-mcp-mapping-guide.md
- docs/mcp-usage-improvement-guide.md
