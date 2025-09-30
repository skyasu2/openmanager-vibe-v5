# QWEN.md

**Qwen Code CLI 사용 가이드** | Claude Code 중심 WSL 개발 환경에서의 전문 서브에이전트 (2025-09-30 업데이트)

## 🔷 개요

**Qwen Code CLI**는 주로 **WSL 환경에서 Claude Code**를 중심으로 개발하는 과정에서 **전문 보조 서브에이전트**로 활용 가능한 성능 최적화 및 알고리즘 분석 전문 AI 도구입니다. 일반적으로는 **Claude Code의 보조 도구**로 사용되지만, 특정 상황에서는 **독립적으로 직접 사용**할 수도 있습니다.

### 핵심 특징

- **480B 파라미터 MoE** (35B 활성화) - 효율적인 리소스 사용
- **256K → 1M 토큰 확장** - 대규모 코드베이스 처리
- **Apache 2.0 오픈소스** - 완전 무료 자체 호스팅 가능
- **Claude Code와의 긴밀한 연계** - WSL 환경에서 원활한 협업
- **독립적 사용 가능성** - 필요 시 직접 호출 가능
- **Gemini CLI 포크/개조** - Qwen-Coder 특화 파서/툴 지원
- **멀티 API 백엔드** - 다양한 API 엔드포인트 선택 가능

## 🚀 사용 방식 (Claude Code 중심의 협업과 독립적 사용 병행)

### 🔄 **Claude Code에서의 Qwen 서브에이전트 호출 방식**

#### **1. Claude Code 내에서 명시적 Qwen 호출** (복잡한 분석이 필요한 경우)
```
# Claude Code에서 Qwen에 알고리즘 최적화나 성능 분석 요청
"Claude Code로 확인해보니 이 부분의 성능을 더 최적화할 수 있을 것 같은데, qwen-specialist 서브에이전트를 사용하여 시스템 성능 최적화를 분석해줄 수 있겠어?"

"qwen-specialist 서브에이전트를 사용하여 알고리즘 복잡도 개선 방안을 제시해주세요. 이는 Claude Code에서의 A안에 대한 성능 검증 차원입니다."
```

### 🔄 **독립적 직접 사용 방식** (특정 상황에서 직접 호출)

#### **2. WSL 환경에서의 직접 CLI 사용** (Claude Code와 무관한 독립적 분석)
```bash
# WSL에서 독립적으로 성능 분석이 필요한 경우
qwen -p "이 함수의 시간복잡도는?"
timeout 60 qwen -p "메모리 사용량 최적화 방법"

# Claude Code 작업과 무관하게 특정 알고리즘 분석이 필요할 때
qwen -p "이 알고리즘의 BigO 복잡도 분석을 해주세요"

# 특정 문제에 대한 알고리즘 최적화 방안 직접 요청
qwen -p "BST의 검색 성능을 향상시키는 방법은?"
```

### 주요 활용 시나리오

1. **성능 최적화** - Claude Code A안에 대한 분석 및 독립적 알고리즘 개선
2. **수학적 복잡도** - BigO 분석 및 최적화 제안 (Claude Code 코드 또는 독립적 분석)
3. **메모리 관리** - 메모리 누수 및 사용량 최적화 분석
4. **AI 교차검증** - Claude Code A안에 대한 성능 관점의 독립적 검증
5. **독립적 알고리즘 분석** - Claude Code 없이 특정 알고리즘 문제 해결

## 📊 무료 티어 제한

| 항목          | 한도        | 비고               |
| ------------- | ----------- | ------------------ |
| **일일 요청** | 2,000회/일  | 충분한 일일 사용량 |
| **분당 제한** | 60회/분     | 병렬 처리 가능     |
| **토큰 한도** | 256K (기본) | 1M까지 확장 가능   |
| **동시 세션** | 10개        | 병렬 작업 지원     |

## 💻 설치 및 실행

### WSL 환경 설치

```bash
# WSL에서 설치 (권장)
wsl
sudo npm install -g @qwen-code/qwen-code

# 현재 설치된 Qwen CLI 버전 확인
qwen --version  # 현재 버전: 0.0.14

# 최신 버전으로 업데이트
npm i -g @qwen-code/qwen-code@latest

# Windows에서 WSL 실행
.\qwen-wsl.bat --version

# 또는 GitHub 클론 (WSL 내부)
wsl
git clone https://github.com/QwenLM/qwen-code
cd qwen-code && npm install
```

### 환경 설정

```bash
# .env 파일 생성
QWEN_API_KEY=your_api_key  # 옵션
QWEN_ENDPOINT=https://api.qwen.alibaba.com  # 또는 로컬
QWEN_MODEL=qwen3-coder-35b  # 모델 선택
```

## 🎯 Claude 중심 개발 전략과 Qwen의 독립적 분석 병행

### Claude Code + Qwen 협업 패턴

```typescript
// 1. Claude Code: 메인 아키텍처 설계 및 핵심 로직 구현
const mainSystem = await claudeCode.design();

// 2. Qwen: Claude Code의 결정에 대한 분석 및 보완
const performanceAnalysis = await qwenCode.analyze('mainSystem performance');
const algorithmOptimization = await qwenCode.optimize('criticalPath algorithm');

// 3. Claude Code: Qwen의 분석 기반 최종 결정 및 통합
const integrated = await claudeCode.integrate([mainSystem, algorithmOptimization]);
```

### Qwen의 독립적 사용 패턴

```typescript
// 1. 특정 알고리즘 문제에 대한 독립적 분석 (Claude Code 없이)
const algorithmSolution = await qwenCode.solve('graph traversal optimization');

// 2. 성능 병목 현상에 대한 독립적 진단
const bottleneckAnalysis = await qwenCode.analyze('performance bottleneck in data processing');
```

### 실전 활용 예시 (WSL 환경에서 Claude Code 중심 + 독립적 Qwen 사용 병행)

```bash
# Claude Code에서 제안된 시스템의 성능 분석 (Qwen 서브에이전트 활용)
qwen-code analyze --type "performance-review" \\
  --target "src/system/mainSystem.ts" \\
  --context "Claude Code A안에 대한 성능 검증"

# Claude Code 개발 중 발생한 특정 알고리즘 최적화 요청
qwen-code optimize --algorithm "criticalPath" \\
  --from "Claude Code 제안 A안" \\
  --output "src/optimizations/criticalPath-optimization.md"

# Qwen을 통한 교차 검증 (Claude Code A안에 대한 성능 분석)
qwen-code verify --solution "Claude Code A안" \\
  --metrics "time complexity, space complexity" \\
  --report "performance-verification-report.md"

# 독립적 알고리즘 분석 (Claude Code 없이 직접 사용)
qwen-code analyze --algorithm "binary search tree optimization" \\
  --context "independent analysis" \\
  --output "src/analysis/bst-optimization.md"
```

## 📈 성능 지표

### 병렬 개발 성과

- **개발 속도**: 70% 향상 (15분 vs 45분)
- **코드 생성**: 77줄/분
- **타입 안전성**: 100% TypeScript strict
- **모듈화**: 평균 230줄/파일

### 품질 지표

```json
{
  "typeScriptErrors": 0,
  "eslintWarnings": 0,
  "testCoverage": "95%+",
  "bundleImpact": "minimal"
}
```

## ⚠️ 중국어 및 한자 사용 금지 정책 (Zero Tolerance)

### 프로젝트 규칙 (엄격 적용)

```javascript
// 모든 Qwen 출력 자동 검사 (중국어 및 한자 포함 여부)
const CHINESE_HANJA_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\u31f0-\u31ff\u3200-\u32ff]/g;

function validateQwenOutput(output) {
  if (CHINESE_HANJA_REGEX.test(output)) {
    throw new Error("Chinese characters or Hanja detected! Converting to English/Korean...");
  }
  return output;
}

// package.json 스크립트
"check:chinese-hanja": "node scripts/check-chinese-hanja-characters.js"
```

### 🇰🇷 한국어 우선 원칙

1. **모든 출력은 한국어 또는 영어로만 작성**
2. **중국어, 한자, 일본어 등 다른 언어 사용 절대 금지**
3. **기술 용어는 영어 사용 허용** (예: API, UI, CLI 등)
4. **한국어가 기본 언어이며, 필요한 경우에만 영어 사용**

## 🔧 고급 기능

### Agentic 코딩 특화

1. **코드베이스 자동 이해** - 프로젝트 구조 즉시 파악
2. **패턴 인식 및 적용** - 기존 코드 스타일 자동 준수
3. **의존성 자동 해결** - import/export 자동 관리
4. **문서 자동 생성** - JSDoc, README 자동 작성

### 팀 협업 시나리오

```bash
# 프론트엔드 팀: Claude로 UI/UX 개발
claude-code "사용자 인증 시스템 설계 및 핵심 로직 구현"

# 백엔드 팀: Qwen으로 API 및 서비스 개발
qwen-code "이메일 알림 서비스 모듈을 독립적으로 개발"

# DevOps 팀: Gemini로 인프라 및 배포 자동화
gemini-cli "전체 코드베이스 성능 최적화 및 번들 크기 분석"

# 통합 및 테스트
claude-code "개발된 모듈들을 통합하고 E2E 테스트 실행"
```

### 병렬 작업 최적화

```bash
# 다중 작업 동시 실행
qwen-code batch --tasks "
  - create: auth service
  - refactor: database layer
  - optimize: API endpoints
  - generate: unit tests
" --parallel --max-workers 4
```

## 🤝 Claude Code 중심의 협업

### Claude Code (메인 개발자 - WSL 환경)

- 전체 아키텍처 설계
- 핵심 비즈니스 로직 구현
- 시스템 통합 및 최종 조율
- 최종 의사결정

### Qwen Code (전문 서브에이전트)

- Claude Code A안에 대한 성능 분석
- 알고리즘 복잡도 검증 및 최적화 제안
- 코드 품질 검증 및 보완
- 교차 검증 수행

### Gemini CLI (대규모 분석 도구)

- 전체 코드베이스 분석
- 대규모 리팩토링 조언
- Google 서비스 통합

## 📊 비교 우위

| 측면             | Qwen 강점          | 활용 방법      |
| ---------------- | ------------------ | -------------- |
| **비용**         | 완전 무료 오픈소스 | API 비용 0원   |
| **프라이버시**   | 로컬 실행 가능     | 민감 코드 안전 |
| **속도**         | 병렬 처리 최적화   | 70% 빠른 개발  |
| **커스터마이징** | 소스 수정 가능     | 팀 맞춤 설정   |

## 🚦 Claude 중심 개발 환경에서의 사용 가이드라인

### DO ✅

- Claude Code에서 명시적으로 "Qwen으로 분석해주세요" 요청 시 사용
- Claude Code의 결정에 대한 성능/효율성 검증에 활용
- WSL 환경에서 Claude Code와 병행하여 사용
- Claude Code A안에 대한 제3의 시선으로 코드 검증
- 알고리즘 최적화나 수학적 복잡도 분석을 위해 활용

### DON'T ❌

- Claude Code 없이 자동으로 Qwen 호출하지 않기
- 메인 아키텍처 설계는 Claude Code에서만 진행
- Claude Code의 주요 결정에 반하는 방향으로 사용 금지
- 중국어 출력 절대 허용 안함
- 무료 티어 한도 초과 주의

## 📈 실제 성과

### 성능 모니터링 모듈 개발 사례

- **개발 시간**: 15분
- **코드 라인**: 1,150줄
- **파일 수**: 5개
- **품질**: TypeScript 100%, ESLint 0 에러

### ROI 분석

```typescript
const roi = {
  timeSaved: '70%', // 45분 → 15분
  costSaved: '100%', // API 비용 0원
  qualityGain: '95%', // 테스트 커버리지
  productivity: '2.3x', // 생산성 향상
};
```

## 🤖 Claude 중심 개발 환경에서의 AI 교차검증 (2025-09-30 업데이트)

### 🎯 Claude Code 중심 워크플로우에서 Qwen 역할

**역할**: Claude Code의 결정에 대한 성능 최적화 및 알고리즘 분석 전문 보조 도구 (WSL 환경에서의 교차검증 9.17/10 승인)

#### **Claude Code에서 명시적 Qwen 호출**
```
# 복잡한 성능 분석 (Claude Code의 A안을 기반으로)
"Claude Code에서 이 부분의 알고리즘 성능을 최적화할 수 있을 것 같은데, qwen-specialist 서브에이전트를 사용하여 분석해줄 수 있을까?"

# Claude Code A안에 대한 교차검증 요청
"qwen-specialist 서브에이전트를 사용하여 내가 만든 A안의 성능 및 효율성을 검증해주세요. 이건 WSL 환경에서의 성능 최적화를 위해 필요해요."
```

#### **WSL 환경에서 직접 CLI 방식**
```bash
# Claude Code 작업 중 간단한 성능 질문
qwen -p "이 알고리즘 시간복잡도는?"
timeout 120 qwen -p "메모리 최적화 방법"
```

### 📊 Qwen 교차검증 특징 (Claude 중심 환경에서)

- **⚡ 알고리즘 최적화**: Claude Code A안의 성능 분석 및 개선 제안 전문
- **🔍 제3의 시선**: Claude Code가 놓칠 수 있는 효율성 문제 발견
- **🆓 무료 검증**: 2,000회/일로 교차검증 비용 절약
- **📈 독립적 분석**: Claude Code A안에 대한 객관적 개선점 제시

### 🎖️ 교차검증 실제 성과 (WSL + Claude 중심)

```typescript
// 실제 사례: 서버 카드 UI 성능 최적화 (2025-08-30)
AI별 검증 점수:
- Claude Code A안: 8.2/10 (실용적 해결책)
- Qwen: 8.5/10 (알고리즘 최적화) ← Claude Code A안에 대한 독립적 성능 개선점 발견
- Gemini: 8.7/10 (Material Design 색상)
- Codex: 8.3/10 (에러 바운더리)

Claude Code는 Qwen의 제안을 검토하여 최종 구현 결정
최종 결과: 8.8/10 HIGH 합의 수준
```

### 🔄 Claude Code 주도 의사결정 플로우

1. **Claude Code**: 문제에 대한 A안(해결책) 제시
2. **Qwen 서브에이전트**: A안의 알고리즘 효율성 분석 및 최적화 제안
3. **Claude Code**: Qwen의 개선점 검토 후 수용/거절 결정
4. **Claude Code**: 최종 결정 사유와 함께 구현

## 🔮 향후 계획

1. **AI 교차검증 고도화** - v5.0 자동화 시스템
2. **GitHub Actions 통합** - CI/CD 자동화
3. **VS Code Extension** - IDE 직접 통합
4. **팀 협업 기능** - 실시간 코드 공유
5. **AI 모델 업그레이드** - 더 강력한 성능

## 📚 참고 자료

- [Qwen 공식 문서](https://github.com/QwenLM/qwen-code)
- [병렬 개발 가이드](./docs/ai-tools/qwen-cli-guide.md)
- [AI 도구 비교](./docs/ai-tools/ai-tools-comparison.md)

---

**⚡ Zero Tolerance for Chinese Characters**  
**🚀 Claude Code 중심의 효율적인 협업**  
**💰 100% Free Open Source**

_Last Updated: 2025-09-30_
