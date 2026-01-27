# Vibe Coding 가이드

> AI와 함께하는 새로운 개발 패러다임

## Vibe Coding이란?

**Vibe Coding**은 AI 도구를 활용한 협업 개발 방식입니다. 개발자가 의도(vibe)를 전달하면 AI가 구현을 돕습니다.

### 핵심 원칙

1. **AI는 주니어 개발자** - 항상 검토 필수
2. **작은 단위로 작업** - Mega Prompt 금지
3. **명확한 컨텍스트** - Spec Before Code
4. **빠른 피드백 루프** - 작게 커밋, 자주 검증

## 도구 생태계

```
┌─────────────────────────────────────────────────────────┐
│                    Vibe Coding Stack                     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Claude Code │  │   Codex     │  │   Gemini    │     │
│  │  (메인 AI)   │  │ (코드리뷰)   │  │ (로직검증)   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                          ↓                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │              MCP Servers (9개)                    │  │
│  │  serena | context7 | supabase | playwright | ... │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Skills (11개)                        │  │
│  │  commit | review | lint-smoke | security | ...   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 문서 목록

| 문서 | 설명 |
|------|------|
| [설치 가이드](./setup.md) | AI 도구 설치 및 로그인 설정 |
| [Claude Code](./claude-code.md) | 메인 AI 도구 마스터 가이드 |
| [AI 도구들](./ai-tools.md) | 멀티 AI 활용 (Codex, Gemini) |
| [MCP 서버](./mcp-servers.md) | 9개 MCP 서버 활용법 |
| [Skills](./skills.md) | 11개 커스텀 스킬 레퍼런스 |
| [워크플로우](./workflows.md) | 실전 개발 워크플로우 |

## 빠른 시작

### 1. Claude Code 실행

```bash
# 프로젝트 디렉토리에서
claude

# 또는 특정 모델로
claude --model opus
```

### 2. 기본 워크플로우

```
1. 요구사항 전달 (한글 OK)
2. Claude가 계획 수립
3. 코드 작성/수정
4. /commit으로 커밋 (자동 AI 리뷰)
5. 리뷰 결과 확인 및 개선
```

### 3. 유용한 명령어

```bash
# 커밋 (AI 리뷰 포함)
/commit

# 코드 리뷰 결과 확인
/review

# PR 생성
/commit-push-pr
```

## 프로젝트 설정

### CLAUDE.md

프로젝트 루트의 `CLAUDE.md`가 AI에게 컨텍스트를 제공합니다.

```markdown
# CLAUDE.md
- 프로젝트 개요
- 기술 스택
- 규칙 참조 (.claude/rules/)
```

### .claude/rules/

세부 규칙 파일들:

```
.claude/rules/
├── code-style.md      # 코드 스타일
├── architecture.md    # 아키텍처
├── ai-tools.md        # AI 도구 사용
├── testing.md         # 테스트
└── deployment.md      # 배포
```

## 2-AI 코드 리뷰

모든 커밋은 **Codex 또는 Gemini**가 자동 리뷰합니다.

```
커밋 → post-commit hook → Codex/Gemini 리뷰 → 결과 저장
                              ↓
                    reports/ai-review/pending/
```

### 리뷰 처리

```bash
# 리뷰 확인
/review

# 상세 분석 및 개선
/ai-code-review
```

## Best Practices

### DO

- 작은 단위로 작업 (한 기능씩)
- 명확한 요구사항 전달
- AI 출력 항상 검토
- 자주 커밋, 자주 검증

### DON'T

- "앱 전체 만들어줘" (Mega Prompt)
- AI 출력 무검토 머지
- 보안 관련 AI 맹신
- 한 번에 너무 많은 변경

## 보안 주의사항

- API 키 절대 하드코딩 금지
- AI 출력은 untrusted로 취급
- 보안 검증: `/security-audit-workflow`

## 관련 문서

- [개발 환경](../development/README.md)
- [테스트 전략](../guides/testing/test-strategy.md)
- [아키텍처](../reference/architecture/system/system-architecture-current.md)
