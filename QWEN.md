# QWEN.md

**Qwen Code CLI Guide** - Universal Full-Stack Developer for WSL Development

<!-- Version: 1.0.0 | Author: Antigravity -->

**프로젝트**: OpenManager VIBE v5.80.0
**스택**: Next.js 16, React 19, TypeScript 5.9 strict, Node.js 22.21.1

## 🔷 Overview

**Qwen Code CLI**는 전반적인 개발 및 리뷰를 독립적으로 수행할 수 있는 **Universal AI 도구**로, **Claude Code 서브에이전트** 또는 **독립 실행** 모두 가능합니다. 성능 최적화에 강점이 있으나, 로직, 보안, 아키텍처 등 모든 영역을 커버합니다.

### 📊 2025 Benchmark (Qwen 2.5 Coder v0.4.0)

- **HumanEval**: 88.4% (7B), 92.7% (32B) - 오픈소스 최고 성능
- **MBPP**: 84.5% - Python 코드 생성 특화
- **Math**: 57.2% (32B) - 수학적 최적화
- **Plan Mode**: 안전한 계획 수립 모드 지원

### Key Features

- 대규모 컨텍스트 윈도우 (256K 기본, 1M 확장 가능)
- Apache 2.0 오픈소스 (100% 무료, 자체 호스팅 가능)
- WSL 환경 완벽 통합
- 독립 실행 및 Claude Code 서브에이전트 모두 지원

---

## 🚀 사용 방법

### 1. Claude Code 서브에이전트 호출 (권장)

```
# 복잡한 알고리즘 분석
"qwen-specialist 서브에이전트를 사용하여 시스템 성능 최적화를 분석해주세요"

# 성능 검증
"qwen-specialist 서브에이전트로 Option A의 성능 및 효율성을 검증해주세요"
```

### 2. 직접 CLI 사용 (WSL 환경)

```bash
# Wrapper 스크립트 사용 (권장) - v2.2.0
./scripts/ai-subagents/qwen-wrapper.sh "성능 병목점 분석"
./scripts/ai-subagents/qwen-wrapper.sh "알고리즘 최적화 방안"

# 직접 qwen 명령어 (고급 사용자)
qwen --approval-mode plan "복잡한 리팩토링 계획"
qwen --approval-mode plan "시간 복잡도 분석"
```

---

## 🔧 v2.2.0 타임아웃 해결

**문제**: 복잡한 쿼리 300초 타임아웃
**근본 원인**: Normal Mode 승인 대기 블로킹
**해결**: `--approval-mode plan` 사용

**효과**: 간단/복잡한 쿼리 모두 즉시 응답

**상세**: <!-- Imported from: docs/ai/qwen-timeout-analysis-and-fix.md -->

---

## 📊 무료 티어 한도

| 항목          | 한도        | 비고               |
| ------------- | ----------- | ------------------ |
| **일일 요청** | 2,000/day   | 충분한 일일 사용량 |
| **분당 한도** | 60/minute   | 병렬 처리 가능     |
| **토큰 한도** | 256K (기본) | 1M까지 확장 가능   |
| **동시 세션** | 10개        | 병렬 작업 지원     |

---

## 💻 설치 (WSL 환경)

```bash
# WSL 환경에서 설치
wsl
npm install -g @qwen-code/qwen-code

# 버전 확인
qwen --version

# 업데이트
npm update -g @qwen-code/qwen-code
```

### 환경 설정 (.env)

```bash
QWEN_API_KEY=your_api_key  # 선택사항
QWEN_ENDPOINT=https://api.qwen.alibaba.com
QWEN_MODEL=qwen3
```

---

## 🎯 주요 사용 시나리오

1. 성능 최적화 (알고리즘 효율 분석)
2. 수학적 복잡도 분석 (BigO, 시간/공간)
3. 메모리 관리 (누수 탐지, 자원 효율)
4. AI 교차 검증 (Claude Code 제안 검증)

**Optimization Standards**: Simplicity, Scalability, Readability

**상세**: <!-- Imported from: docs/ai/ai-coding-standards.md -->

---

## 🎯 Claude-Centric 개발 전략

### 의사결정 흐름

1. Claude Code → Option A 제시
2. Qwen → 알고리즘 효율 분석 및 최적화 제안
3. Claude Code → Qwen 개선점 검토 및 수용/거부
4. Claude Code → 최종 구현

**상세**: <!-- Imported from: docs/ai/ai-collaboration-architecture.md -->

---

## 🔧 고급 기능

**Agentic Coding**: 자동 코드베이스 이해, 패턴 인식, 의존성 해결, 문서 생성
**병렬 작업**: `qwen-code batch --tasks "..." --parallel --max-workers 4`

**상세**: <!-- Imported from: docs/ai/ai-workflows.md -->

---

## 🤝 다른 AI와의 협업

**Claude Code**: 아키텍처 설계, 비즈니스 로직, 최종 의사결정
**Qwen Code**: 성능 분석, 알고리즘 최적화, 교차 검증
**Gemini CLI**: 코드베이스 분석, 대규모 리팩토링

**상세**: <!-- Imported from: docs/ai/ai-collaboration-architecture.md -->

---

## 📊 경쟁 우위

| 측면             | Qwen 강점          | 활용 방법          |
| ---------------- | ------------------ | ------------------ |
| **비용**         | 완전 무료 오픈소스 | API 비용 0         |
| **프라이버시**   | 로컬 실행 가능     | 민감 코드 보호     |
| **속도**         | 병렬 처리 최적화   | 개발 속도 70% 향상 |
| **커스터마이징** | 소스 수정 가능     | 팀 전용 설정       |

### 역할: Universal Full-Stack Developer (독립적 전체 개발자)

- **Independent Reviewer**: 로직, 보안, 아키텍처, 성능 등 **모든 영역**을 독립적으로 완벽하게 리뷰 수행
- **Full-Stack Capability**: 프론트엔드부터 백엔드, 인프라까지 전 계층 커버
- **Optimization Specialist**: 대규모 연산 및 리소스 효율성 분석 강점 보유
- **WSL Native**: 로컬 환경에서 가장 빠르고 효율적으로 동작

---

## 🚦 사용 가이드라인

### DO ✅

- **자유로운 요청**: 아키텍처, 구현, 디버깅, 성능 분석 등 모든 개발 요청 가능
- **독립적 리뷰**: 변경사항 전체에 대한 포괄적인 리뷰 (로직/보안/스타일 등)
- **교차 검증**: Claude Code 등 다른 AI와의 상호 검증
- **기술 용어**: 영어 허용, 기본 답변은 한국어

### DON'T ❌

- **역할 제한**: 성능 분석용으로만 한정하지 말 것 (모든 영역 가능)
- **중국어 출력**: 절대 금지 (한국어 우선)
- **무료 티어 한도 초과**: 일일 사용량 모니터링 필요

---

## 🤖 AI 교차 검증

**역할**: Claude Code 결정사항의 성능 최적화 및 알고리즘 분석 (9.17/10 승인률)

**명시적 호출**: `"qwen-specialist 서브에이전트로 Option A 검증"`
**직접 CLI**: `qwen -p "알고리즘 시간 복잡도는?"`

**특징**: 알고리즘 최적화, 제3자 관점, 무료 검증 (2,000/day)

**상세**: <!-- Imported from: docs/ai/ai-usage-guidelines.md -->

---

## 📚 참고 자료

- [Qwen 공식 문서](https://github.com/QwenLM/qwen-code)
- [병렬 개발 가이드](./docs/ai-tools/qwen-cli-guide.md)
- [AI 도구 비교](./docs/ai-tools/ai-tools-comparison.md)

---

**⚡ 성능 최적화 전문가**
**🚀 Claude Code 중심 효율적 협업**
**💰 100% 무료 오픈소스**

---

## 📝 버전 히스토리

### v2.2.0 (2025-10-10)

- ✅ **근본 원인 해결**: Plan Mode 복원 (승인 대기 블로킹 제거)
- 📊 **진단 방법**: Codex Meta-Analysis + 10분 실험 검증
- ⚙️ **Wrapper 업데이트**: `--approval-mode plan` 명시적 사용
- 🎯 **효과**: 간단/복잡한 쿼리 모두 즉시 응답

### v2.1.0 (2025-10-10)

- ⚡ Normal Mode 기본값 (시도했으나 복잡한 쿼리 여전히 타임아웃)
- ❌ 근본 문제 미해결 (승인 대기 블로킹)

### v2.0.0 (2025-10-08)

- 🔧 타임아웃 300초 통일
- 📊 재시도 제거 (자원 낭비 방지)

---

_Last Updated: 2025-12-10 (v2.3.0)_
