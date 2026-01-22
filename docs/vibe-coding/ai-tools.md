# AI 도구 가이드

> 멀티 AI 활용으로 코드 품질 향상

## AI 도구 생태계

```
┌─────────────────────────────────────────────────────────┐
│                    AI 도구 구성                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Claude Code (메인)                     │   │
│  │  코드 생성, 수정, 분석, 디버깅                    │   │
│  └─────────────────────────────────────────────────┘   │
│                          ↓                              │
│  ┌────────────────┐  ┌────────────────┐               │
│  │     Codex      │  │     Gemini     │               │
│  │   (코드 리뷰)   │  │   (로직 검증)   │               │
│  │   홀수 커밋     │  │   짝수 커밋     │               │
│  └────────────────┘  └────────────────┘               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Claude Code

### 역할
- **메인 개발 AI**: 코드 작성, 수정, 리팩토링
- **대화형 인터페이스**: 자연어로 요청
- **도구 통합**: MCP, Skills, Subagents

### 사용법

```bash
# 기본 실행
claude

# 모델 선택
claude --model opus    # 복잡한 작업
claude --model sonnet  # 일반 작업 (기본)
claude --model haiku   # 빠른 작업
```

### 강점
- 긴 컨텍스트 (200k 토큰)
- 정밀한 코드 수정
- 멀티스텝 추론

## Codex (OpenAI)

### 역할
- **자동 코드 리뷰**: 커밋 후 자동 실행
- **보안 취약점 탐지**
- **베스트 프랙티스 검증**

### 실행 방식

```bash
# 자동 (post-commit hook)
git commit -m "feat: add feature"
# → Codex가 자동으로 리뷰

# 수동
codex "이 코드 리뷰해줘" < file.ts
```

### 리뷰 항목
- 버그 가능성
- 보안 취약점
- 성능 이슈
- 코드 스타일

## Gemini (Google)

### 역할
- **로직 검증**: 비즈니스 로직 정확성
- **아키텍처 분석**
- **대안 제시**

### 실행 방식

```bash
# 자동 (post-commit hook, 짝수 커밋)
git commit -m "fix: handle edge case"
# → Gemini가 자동으로 리뷰

# 수동
gemini "이 알고리즘 검증해줘"
```

### 리뷰 항목
- 로직 정확성
- 엣지 케이스
- 테스트 커버리지

## 2-AI 리뷰 시스템

### 로테이션 규칙

```
커밋 #1 → Codex 리뷰
커밋 #2 → Gemini 리뷰
커밋 #3 → Codex 리뷰
커밋 #4 → Gemini 리뷰
...
```

### 리뷰 결과 저장

```
reports/ai-review/
├── pending/           # 미확인 리뷰
│   └── review-codex-2026-01-22-14-23-19.md
└── history/           # 처리 완료
    └── 2026-01/
```

### 리뷰 처리

```bash
# 리뷰 요약 확인
/review

# 상세 분석 및 개선
/ai-code-review
```

## AI 선택 가이드

| 작업 | 추천 AI | 이유 |
|------|---------|------|
| 코드 작성 | Claude | 정밀한 수정, 컨텍스트 이해 |
| 코드 리뷰 | Codex/Gemini | 자동화, 다양한 관점 |
| 보안 검토 | Codex | OWASP 전문 |
| 로직 검증 | Gemini | 추론 능력 |
| 문서 작성 | Claude | 자연어 생성 |

## 제거된 도구

### Qwen (제거: 2026-01-07)

```
제거 이유:
- 평균 응답: 201초
- 실패율: 13.3%
- 비용 대비 효율 낮음
```

## Best Practices

### DO

```bash
# 작은 단위 리뷰
git commit -m "feat: add single feature"

# 명확한 커밋 메시지
git commit -m "fix(api): handle 404 gracefully"

# 리뷰 결과 확인
/review
```

### DON'T

```bash
# 대량 변경 커밋
git commit -m "update everything"

# 리뷰 무시
# (Critical 이슈 방치)

# AI 맹신
# (보안 관련 수동 검토 필수)
```

## 트러블슈팅

### Codex 타임아웃

```
증상: 리뷰가 5분 이상 소요
해결:
1. 커밋 크기 줄이기
2. .codexignore로 제외 파일 설정
```

### Gemini API 에러

```
증상: 429 Too Many Requests
해결:
1. 잠시 대기 (1분)
2. API 쿼터 확인
```

### 리뷰 누락

```
증상: pending 폴더에 리뷰 없음
해결:
1. post-commit hook 확인
2. API 키 유효성 확인
```

## 관련 문서

- [Claude Code](./claude-code.md)
- [MCP 서버](./mcp-servers.md)
- [워크플로우](./workflows.md)
