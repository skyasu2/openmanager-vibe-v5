# QWEN.md

**Qwen Code CLI Guide** - Performance Optimization Specialist for WSL Development

## 🔷 Overview

**Qwen Code CLI**는 성능 최적화 및 알고리즘 분석 전문 AI 도구로, **Claude Code 서브에이전트** 또는 **독립 실행** 모두 가능합니다.

### 📊 2025 Benchmark (Qwen 2.5 Coder v0.0.14)

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

## 🔧 v2.2.0 타임아웃 해결 (2025-10-10)

### 근본 원인 및 해결

**문제**: 복잡한 쿼리에서 300초(5분) 타임아웃 발생
**근본 원인**: Normal Mode가 비대화형 터미널에서 승인 입력 대기 상태로 블로킹
**해결책**: `--approval-mode plan` 명시적 사용

### 진단 과정 (Meta-Analysis)

```bash
# Codex의 코드 레벨 분석으로 발견:
Normal Mode (`qwen -p`)는 복잡한 작업에서:
1. "Approve? [y/N]" 입력 대기
2. 비대화형 터미널이라 입력 전달 안 됨
3. 프로세스가 멈춘 채 timeout으로 종료

# 실험적 검증 (10분 대기):
- 간단한 쿼리: 7-26초 성공 ✅
- 복잡한 쿼리: 10분 55초 타임아웃 ❌ (출력 없음)
```

### v2.2.0 개선 사항

```bash
# qwen-wrapper.sh v2.2.0 핵심 변경
qwen --approval-mode plan "$query"  # 승인 불필요, 즉시 응답
```

**효과**:

- ✅ 간단한 쿼리: 즉시 응답
- ✅ 복잡한 쿼리: 승인 대기 없이 즉시 응답
- ✅ AI 교차검증: 300초 타임아웃 내 안정적 완료
- 📊 근거: Codex Meta-Analysis + 10분 실험 검증

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

### 1. 성능 최적화

- Claude Code의 Option A 알고리즘 효율 분석
- 독립적인 알고리즘 개선 제안

### 2. 수학적 복잡도 분석

- BigO 분석 및 최적화 제안
- 시간/공간 복잡도 평가

### 3. 메모리 관리

- 메모리 누수 탐지
- 자원 효율 최적화

### 4. AI 교차 검증

- Claude Code 제안에 대한 성능 관점 검증
- 독립적인 제3자 시각 제공

### 5. Optimization Standards

최적화 제안 시 다음 핵심 코딩 규칙을 준수합니다:

- **Simplicity**: 복잡한 최적화보다 단순한 코드 우선 (KISS)
- **Scalability**: 확장성을 고려한 구조 제안
- **Readability**: 성능을 위해 가독성을 과도하게 희생하지 않음

---

## 🎯 Claude-Centric 개발 전략

### Claude Code 주도 워크플로우

```typescript
// 1. Claude Code: 메인 아키텍처 설계 및 핵심 로직 구현
const mainSystem = await claudeCode.design();

// 2. Qwen: Claude Code 결정사항의 성능 분석 및 보완
const perfAnalysis = await qwenCode.analyze('mainSystem performance');
const algoOptimization = await qwenCode.optimize('criticalPath algorithm');

// 3. Claude Code: Qwen 분석 기반 최종 결정 및 통합
const integrated = await claudeCode.integrate([mainSystem, algoOptimization]);
```

### 의사결정 흐름

1. **Claude Code**: 문제에 대한 Option A(해결책) 제시
2. **Qwen Sub-Agent**: Option A의 알고리즘 효율 분석 및 최적화 제안
3. **Claude Code**: Qwen 개선점 검토 및 수용/거부 결정
4. **Claude Code**: 최종 결정 근거와 함께 구현

---

## 🔧 고급 기능

### Agentic Coding 특화

- 자동 코드베이스 이해
- 패턴 인식 및 적용
- 자동 의존성 해결
- 자동 문서 생성 (JSDoc, README)

### 병렬 작업 최적화

```bash
# 여러 작업 동시 실행
qwen-code batch --tasks "
  - create: auth service
  - refactor: database layer
  - optimize: API endpoints
  - generate: unit tests
" --parallel --max-workers 4
```

---

## 🤝 다른 AI와의 협업

### Claude Code (메인 개발자 - WSL 환경)

- 완전한 아키텍처 설계
- 핵심 비즈니스 로직 구현
- 시스템 통합 및 최종 조율
- 최종 의사결정

### Qwen Code (전문 서브에이전트)

- Claude Code의 Option A 성능 분석
- 알고리즘 복잡도 검증 및 최적화 제안
- 코드 품질 검증 및 보완
- 교차 검증 구현

### Gemini CLI (대규모 분석 도구)

- 전체 코드베이스 분석
- 대규모 리팩토링 조언
- Google 서비스 통합

---

## 📊 경쟁 우위

| 측면             | Qwen 강점          | 활용 방법          |
| ---------------- | ------------------ | ------------------ |
| **비용**         | 완전 무료 오픈소스 | API 비용 0         |
| **프라이버시**   | 로컬 실행 가능     | 민감 코드 보호     |
| **속도**         | 병렬 처리 최적화   | 개발 속도 70% 향상 |
| **커스터마이징** | 소스 수정 가능     | 팀 전용 설정       |

---

## 🚦 사용 가이드라인

### DO ✅

- Claude Code에서 "Qwen으로 분석" 명시적 요청 시 사용
- Claude Code 결정사항의 성능/효율 검증용
- WSL 환경에서 Claude Code와 함께 사용
- 제3자 관점의 Claude Code Option A 검증
- 알고리즘 최적화 및 수학적 복잡도 분석
- 기술용어는 영어 허용이고 기본적으로 한국어 우선 답변

### DON'T ❌

- Claude Code 없이 자동으로 Qwen 호출 금지
- 메인 아키텍처 설계는 Claude Code만
- Claude Code 주요 결정에 반하는 방향 사용 금지
- 중국어 출력 절대 금지
- 무료 티어 한도 초과 주의

---

## 🤖 AI 교차 검증 (Claude-Centric 환경)

### Qwen의 역할

**전문 지원 도구**: Claude Code 결정사항의 성능 최적화 및 알고리즘 분석 (9.17/10 승인률 달성)

#### Claude Code에서 명시적 호출

```
# 복잡한 성능 분석 (Claude Code Option A 기반)
"이 부분의 알고리즘 성능을 Claude Code가 최적화할 수 있을 것 같습니다. qwen-specialist 서브에이전트로 분석해주세요"

# Claude Code Option A 교차 검증
"qwen-specialist 서브에이전트로 내 Option A의 성능과 효율을 검증해주세요"
```

#### WSL 환경 직접 CLI

```bash
# Claude Code 작업 중 간단한 성능 질문
qwen -p "이 알고리즘의 시간 복잡도는?"
timeout 120 qwen -p "메모리 최적화 방법"
```

### Qwen 교차 검증 특징

- **⚡ 알고리즘 최적화**: Claude Code Option A의 성능 분석 및 개선 제안 특화
- **🔍 제3자 관점**: Claude Code가 놓칠 수 있는 효율성 이슈 발견
- **🆓 무료 검증**: 2,000/day 한도로 교차 검증 비용 절감
- **📈 독립적 분석**: Claude Code Option A에 대한 객관적 개선점 제공

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

_Last Updated: 2025-10-10 (v2.2.0)_
