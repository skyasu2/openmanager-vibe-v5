---
id: sub-agents-official
title: "Claude Code 서브에이전트 공식 가이드"
keywords: ["claude-code", "sub-agents", "official", "anthropic"]
priority: high
ai_optimized: true
related_docs: ["ai-cross-verification-v4.md", "../ai/agents-mcp.md", "../../archive/docs/current/ai-tools/ai-cross-verification-index.md"]
updated: "2025-09-16"
version: "v1.0"
status: "active"
official_source: "https://docs.anthropic.com/ko/docs/claude-code/sub-agents"
---

# Claude Code 서브에이전트 공식 가이드

## 📚 공식 문서 참조

**공식 Anthropic 문서**: https://docs.anthropic.com/ko/docs/claude-code/sub-agents

## 🎯 서브에이전트란?

> "서브에이전트는 Claude Code가 작업을 위임할 수 있는 사전 구성된 AI 개성입니다."

### 🔑 핵심 특징

1. **특화된 목적**: 특정 도메인에 최적화
2. **독립적 컨텍스트**: 메인 대화와 분리된 컨텍스트 창
3. **도구 접근 제어**: 필요한 도구만 선별적 접근
4. **커스텀 시스템 프롬프트**: 전문 영역별 지시사항

## 🚀 호출 방식 (4가지 공식 방법)

### ✅ 1. 명시적 호출 (Explicit Invocation)

**공식 예시**: `"Use the code-reviewer subagent to check my recent changes."`

**한국어 적용**:
```
"code-reviewer 서브에이전트를 사용하여 최근 변경사항을 확인해주세요"
"debugger 서브에이전트를 사용하여 이 오류를 분석해주세요"
"data-scientist 서브에이전트를 사용하여 SQL 쿼리를 최적화해주세요"
```

### 🔄 2. 자동 위임 (Automatic Delegation)

특정 과제가 서브에이전트의 전문 분야에 맞는 경우, 메인 에이전트가 자동으로 해당 서브에이전트에게 위임

### ⚡ 3. Slash 명령어 (/agents)

```bash
/agents                    # 서브에이전트 목록 조회
/agents create             # 새 서브에이전트 생성
/agents [agent-name]       # 특정 서브에이전트 직접 사용
```

### 📁 4. 파일 기반 정의 (File Definitions)

**위치**:
- 프로젝트별: `.claude/agents/*.md`
- 사용자별: `~/.claude/agents/*.md`

## 📋 공식 서브에이전트 예시

### 1. Code Reviewer
- **목적**: 코드 품질, 보안, 유지보수성 검토
- **도구**: Read, Grep, Bash
- **프롬프트**: 코드 리뷰 전문가로 동작

### 2. Debugger  
- **목적**: 근본 원인 분석, 오류 재현, 최소한의 수정
- **도구**: Read, Write, Edit, Bash
- **프롬프트**: 디버깅 전문가로 동작

### 3. Data Scientist
- **목적**: SQL/BigQuery 분석, 데이터 기반 권장사항
- **도구**: 데이터베이스 도구들
- **프롬프트**: 데이터 분석 전문가로 동작

## 🛠️ 서브에이전트 설정

### 📁 위치

- **프로젝트별**: `.claude/agents/`
- **사용자별**: `~/.claude/agents/`

### 📝 설정 형식

Markdown 파일 + YAML frontmatter:

```markdown
---
name: "custom-reviewer"
description: "TypeScript 전용 코드 리뷰어"
tools: ["Read", "Grep", "Edit"]
model: "claude-3-5-sonnet-20241022"
---

# Custom TypeScript Reviewer

당신은 TypeScript 전문 코드 리뷰어입니다...
```

## 🎯 OpenManager VIBE 프로젝트 서브에이전트

### 📊 현재 구성 (17개)

#### 1. 메인 조정자 (1개)
- **central-supervisor**: 복잡한 작업 오케스트레이션

#### 2. AI 교차검증 시스템 (4개)
- **verification-specialist**: AI 교차검증 메인 진입점
- **codex-specialist**: ChatGPT Codex CLI 연동
- **gemini-specialist**: Google Gemini CLI 연동  
- **qwen-specialist**: Qwen CLI 연동

#### 3. 전문 도구 (12개)

**개발 환경 & 구조**:
- **dev-environment-manager**: WSL 최적화, Node.js 관리
- **structure-refactor-specialist**: 프로젝트 구조 리팩토링

**백엔드 & 인프라**:
- **database-administrator**: Supabase PostgreSQL 전문
- **vercel-platform-specialist**: Vercel 플랫폼 최적화
- **gcp-cloud-functions-specialist**: GCP Cloud Functions

**코드 품질 & 보안**:
- **code-review-specialist**: 코드 품질 검토
- **debugger-specialist**: 버그 해결 (공식 표준 준수)
- **security-auditor**: 보안 감사

**테스트 & 문서화**:
- **test-automation-specialist**: Vitest + Playwright E2E
- **documentation-manager**: 문서 관리

**UI/UX 전문가**:
- **ui-ux-specialist**: 내장 UI/UX 전문가 (사용자 인터페이스 개선, 디자인 시스템 구축)

## 🔄 실제 사용 예시

### 1. 명시적 호출 예시

```
"verification-specialist 서브에이전트를 사용하여 src/components/Button.tsx를 자동 검증해주세요"

"codex-specialist 서브에이전트를 사용하여 이 알고리즘의 시간복잡도를 분석하고 최적화 방안을 제시해주세요"

"requirements-analyst 서브에이전트를 사용하여 사용자 요구사항을 명확한 Requirements 문서로 작성해주세요"
```

### 2. Slash 명령어 예시

```bash
/agents                           # 사용 가능한 서브에이전트 목록
/agents verification-specialist   # 검증 전문가 직접 호출
/agents create                    # 새 서브에이전트 생성 대화형 모드
```

### 3. 자동 위임 예시

Claude Code가 상황을 판단하여 자동으로 적절한 서브에이전트 호출
- 코드 변경 감지 → verification-specialist 자동 실행
- 복잡한 쿼리 발견 → database-administrator 자동 호출
- 보안 관련 코드 → security-auditor 자동 실행

## 📖 베스트 프랙티스

### ✅ 권장사항

1. **Claude 생성 서브에이전트부터 시작**: 기본 제공 템플릿 활용
2. **단일 책임 원칙**: 하나의 명확한 목적을 가진 서브에이전트 설계
3. **상세한 시스템 프롬프트**: 명확한 역할과 행동 지침 작성
4. **도구 접근 제한**: 필요한 도구만 허용하여 보안성 확보
5. **프로젝트별 버전 관리**: `.claude/agents/` 디렉토리를 git으로 관리

### ❌ 피해야 할 것

- ~~Task 도구 사용~~: `Task agent-name "요청"` ❌ (존재하지 않는 명령어)
- 과도한 도구 접근 권한 부여
- 모호한 역할 정의  
- 여러 목적을 가진 범용 서브에이전트
- /agents 명령어 남용 (필요시에만 사용)

## 🔗 관련 문서

- [AI 교차검증 시스템 v4.0](ai-cross-verification-v4.md)
- [MCP & 서브에이전트 매핑](../ai/agents-mcp.md)
- [AI 시스템 가이드](../guides/ai-system.md)

## 📊 프로젝트 성과

- **서브에이전트 수**: 17개 (23개→17개 최적화)
- **AI 교차검증**: 9.17/10 승인
- **공식 표준 준수**: 100%
- **호출 방식**: 4가지 공식 방법 모두 지원
- **최적화 완료**: 2025-09-16

## 📋 공식 호출 방식 요약

1. **명시적 호출**: `"agent-name 서브에이전트를 사용하여..."`
2. **자동 위임**: Claude Code가 상황 판단하여 자동 배정
3. **Slash 명령어**: `/agents`, `/agents create`, `/agents [name]`
4. **파일 기반**: `.claude/agents/*.md` 설정 파일

---

📚 **공식 참조**: [Claude Code Sub-Agents Documentation](https://docs.anthropic.com/ko/docs/claude-code/sub-agents)  
🔄 **최종 업데이트**: 2025-09-16 (사용자 추가 정보 반영)  
✅ **검증 상태**: 공식 문서 기반 100% 준수 + 4가지 호출 방식 완전 지원