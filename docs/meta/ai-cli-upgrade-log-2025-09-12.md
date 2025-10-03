---
id: ai-cli-upgrade-log-2025-09-12
title: "AI CLI 도구 업그레이드 로그 - 2025-09-12"
keywords: ["ai", "cli", "upgrade", "gemini", "ccusage", "log"]
priority: low
ai_optimized: true
related_docs: ["../ai/cli-strategy.md", "../guides/wsl.md"]
updated: "2025-09-16"
---

# AI CLI 도구 업그레이드 로그 - 2025-09-12

## 📊 업그레이드 요약

| AI 도구 | 이전 버전 | 현재 버전 | 업그레이드 상태 | 새로운 기능 |
|---------|-----------|-----------|-----------------|-------------|
| **Claude Code** | v1.0.108 | v1.0.108 | ✅ 최신 유지 | 서브에이전트 호출 방식 변경 |
| **Codex CLI** | v0.29.0 | v0.29.0 | ✅ 최신 유지 | 안정적 유지 |
| **Gemini CLI** | v0.3.4 | **v0.4.1** | 🎉 **업그레이드** | MCP 관리, 확장 시스템 |
| **Qwen CLI** | v0.0.10 | v0.0.10 | ✅ 최신 유지 | 안정적 유지 |
| **ccusage** | v16.2.3 | **v16.2.4** | 🎉 **업그레이드** | 컴팩트 모드, 프로젝트 별칭 |

## 🔍 주요 변경사항

### 1. Claude Code v1.0.108 (Task 도구 변경)

**중요한 변화: Task 도구 제거**
- **이전 방식**: `Task verification-specialist "파일 검증"`
- **현재 방식**: `"Use the verification-specialist subagent to analyze [파일명]"`

**원인**: Claude Code 버전 업그레이드로 인한 서브에이전트 호출 방식 변경
**해결책**: 자연어 기반 서브에이전트 호출로 전환

### 2. Gemini CLI v0.4.1 새로운 기능

#### 🆕 주요 추가 기능:
- **MCP 서버 관리**: `gemini mcp` 명령어 추가
- **확장 시스템**: `gemini extensions <command>` 지원
- **프롬프트 상호작용**: `-i, --prompt-interactive` 플래그 추가
- **접근성**: `--screen-reader` 모드 지원
- **세션 요약**: `--session-summary` 파일 출력 기능

#### 📋 새로운 CLI 옵션들:
```bash
# MCP 서버 관리
gemini mcp

# 확장 관리
gemini extensions <command>

# 대화형 프롬프트 모드
gemini -i "상호작용 프롬프트"

# 접근성 모드
gemini --screen-reader

# 세션 요약 저장
gemini --session-summary session.json
```

#### 🔧 설정 개선:
- 많은 CLI 플래그들이 `settings.json` 기반으로 변경 (deprecated 플래그들)
- 텔레메트리 옵션들 세분화
- 프록시 설정 지원

### 3. ccusage v16.2.4 새로운 기능

#### 🆕 주요 추가 기능:
- **컴팩트 모드**: `--compact` 플래그로 좁은 화면 최적화
- **프로젝트 별칭**: `--project-aliases` 프로젝트명 별칭 지원
- **인스턴스 분석**: `--instances` 프로젝트/인스턴스별 세부 분석

#### 📋 새로운 CLI 옵션들:
```bash
# 컴팩트 모드 (좁은 화면용)
ccusage daily --compact

# 모델별 세부 분석
ccusage daily --breakdown

# 프로젝트 별칭 설정
ccusage daily --project-aliases 'project1=My Project,project2=Another Project'

# 인스턴스별 분석
ccusage daily --instances
```

#### 🎯 실제 사용 예시:
```bash
# 컴팩트 모드 + 모델별 분석
ccusage daily --compact --breakdown

# 결과: 23일간 총 $2570.57 사용 내역
# - Sonnet-4: $1,678.30 (65%)
# - Opus-4: $892.27 (35%)
# - 총 토큰: 5,178,104개 (Input: 254,724, Output: 4,923,380)
```

## 🔄 업그레이드 후 영향 분석

### ✅ 긍정적 변화:
1. **Gemini CLI**: MCP 서버 통합으로 확장성 크게 향상
2. **ccusage**: 컴팩트 모드로 터미널 호환성 개선
3. **전체적**: 모든 도구가 안정적으로 작동 중

### ⚠️ 주의사항:
1. **서브에이전트 호출**: Task → 자연어 방식으로 변경 필요
2. **기존 스크립트**: Task 명령어 사용하는 스크립트 업데이트 필요

### 🔧 필요한 업데이트:
1. `.claude/agents/` 내 모든 서브에이전트 호출 방식 변경
2. 자동화 스크립트의 Task 명령어 제거
3. 새로운 자연어 기반 호출로 전환

## 🚀 다음 단계

### 1. 서브에이전트 시스템 완전 전환
- [x] Task 도구 제거 원인 분석 완료
- [x] 자연어 기반 호출 방식 확인 완료
- [ ] 모든 서브에이전트 파일 업데이트
- [ ] AI 교차검증 시스템 테스트

### 2. 새로운 기능 활용
- [x] Gemini CLI v0.4.1 기본 기능 테스트 완료
- [x] ccusage v16.2.4 컴팩트 모드 테스트 완료
- [ ] MCP 서버 통합 활용 방안 검토
- [ ] 확장 시스템 활용 가능성 탐색

### 3. 문서 업데이트
- [x] CLAUDE.md 버전 정보 업데이트 완료
- [ ] 서브에이전트 가이드 업데이트
- [ ] AI 교차검증 시스템 가이드 수정

## 📚 참고 자료

- **Gemini CLI v0.4.0 Release Notes**: CloudRun/Security 통합, Gemini 2.5 Flash Lite 지원
- **ccusage GitHub**: https://github.com/ryoppippi/ccusage
- **Claude Code 공식 문서**: https://docs.anthropic.com/en/docs/claude-code

---

**업그레이드 완료 일시**: 2025-09-12 21:38 KST
**총 소요 시간**: 약 15분
**전체 평가**: 성공적 ✅

## 🔄 서브에이전트 설정 파일 업데이트 (2025-09-12 추가)

### ✅ verification-specialist.md 완전 업데이트 완료

**주요 수정사항:**
1. **description 필드 개선**: 
   - 이전: "코드 품질 검증 전문가 - 파일을 분석하고 품질 점수 및 개선사항 제시"
   - 개선: "PROACTIVELY analyze code quality, security, and performance for TypeScript files. Use me for quality scoring, vulnerability detection, and improvement recommendations. MUST BE USED for code reviews and file analysis."

2. **사용법 섹션 완전 재작성**:
   - Task 기반 예시 100% 제거
   - 자연어 기반 호출 방식으로 완전 전환
   - 모든 예시를 자연어 형태로 변경

3. **워크플로우 코드 업데이트**:
   - TypeScript 예시 코드에서 Task 호출 제거
   - 자연어 기반 설명으로 변경

**업데이트 전후 비교:**
```bash
# 이전 방식 (제거됨)
Task verification-specialist "src/app/api/auth/route.ts 검증"

# 새로운 방식 (적용됨)
"Use the verification-specialist to analyze src/app/api/auth/route.ts for code quality and security"
```

**남은 작업:**
- [ ] 다른 16개 서브에이전트 파일도 동일하게 업데이트 필요
- [ ] external-ai-orchestrator 의존성 제거 및 직접 구현 방식 전환
- [ ] AI CLI 래퍼들 (codex-wrapper, gemini-wrapper, qwen-wrapper) 재설계

**서브에이전트 업데이트 완료 시간**: 2025-09-12 22:15 KST