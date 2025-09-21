# QWEN.md

**Qwen Code CLI 사용 가이드** | 14개 서브에이전트 체계 통합 (2025-09-19 업데이트)

## 🔷 개요

**Qwen Code CLI**는 **qwen-specialist** 서브에이전트와 직접 CLI 호출 두 방식으로 활용 가능한 성능 최적화 전문 AI 도구입니다.

### 핵심 특징

- **480B 파라미터 MoE** (35B 활성화) - 효율적인 리소스 사용
- **256K → 1M 토큰 확장** - 대규모 코드베이스 처리
- **Apache 2.0 오픈소스** - 완전 무료 자체 호스팅 가능
- **70% 빠른 병렬 개발** - Claude와 독립적 모듈 동시 작업
- **Gemini CLI 포크/개조** - Qwen-Coder 특화 파서/툴 지원
- **멀티 API 백엔드** - 다양한 API 엔드포인트 선택 가능

## 🚀 사용 방식 (혼합 전략)

### 🔄 **공식 서브에이전트 호출 방식**

#### **1. 명시적 서브에이전트 호출** (복잡한 분석)
```
# 알고리즘 최적화나 성능 분석이 필요한 경우
"qwen-specialist 서브에이전트를 사용하여 시스템 성능을 최적화 전체 분석해주세요"
"qwen-specialist 서브에이전트를 사용하여 알고리즘 복잡도 개선 방안을 제시해주세요"
```

#### **2. 직접 CLI 방식** (간단한 질문)
```bash
# 빠른 확인이나 단순 계산
qwen -p "이 함수의 시간복잡도는?"
timeout 60 qwen -p "메모리 사용량 최적화 방법"
```

### 주요 활용 시나리오

1. **성능 최적화** - 알고리즘 효율성 분석 및 개선
2. **수학적 복잡도** - BigO 분석 및 최적화 제안
3. **메모리 관리** - 메모리 누수 및 사용량 최적화
4. **AI 교차검증** - 3-AI 병렬 검증에서 성능 관점 제시

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

## 🎯 병렬 개발 전략

### Claude + Qwen 협업 패턴

```typescript
// 1. Claude: 메인 아키텍처 설계
const mainSystem = await claudeCode.design();

// 2. Qwen: 독립 모듈 병렬 개발
const modules = await Promise.all([
  qwenCode.develop('auth-module'),
  qwenCode.develop('payment-module'),
  qwenCode.develop('notification-module'),
]);

// 3. 통합 및 검증
const integrated = await claudeCode.integrate(modules);
```

### 실전 활용 예시

```bash
# 성능 모니터링 모듈 개발 (15분 완성)
qwen-code generate --type "performance-monitor" \
  --features "real-time,charts,alerts" \
  --output "src/modules/performance-monitor"

# 테스트 자동 생성
qwen-code test --coverage 95 --framework vitest

# 리팩토링 제안
qwen-code refactor --analyze "./src" --suggest-patterns
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

## 🤝 다른 도구와의 협업

### Claude Code (메인)

- 전체 아키텍처 설계
- 핵심 비즈니스 로직
- 시스템 통합 및 조율

### Qwen Code (병렬)

- 독립 모듈 개발
- 대안적 구현 제시
- 테스트 코드 생성

### Gemini CLI (대규모)

- 전체 코드베이스 분석
- 대규모 리팩토링
- Google 서비스 통합

## 📊 비교 우위

| 측면             | Qwen 강점          | 활용 방법      |
| ---------------- | ------------------ | -------------- |
| **비용**         | 완전 무료 오픈소스 | API 비용 0원   |
| **프라이버시**   | 로컬 실행 가능     | 민감 코드 안전 |
| **속도**         | 병렬 처리 최적화   | 70% 빠른 개발  |
| **커스터마이징** | 소스 수정 가능     | 팀 맞춤 설정   |

## 🚦 사용 가이드라인

### DO ✅

- 사용자가 "Qwen으로" 명시할 때 사용
- 독립적인 모듈 개발에 활용
- 병렬 작업으로 개발 속도 향상
- 제3의 시선으로 코드 검증

### DON'T ❌

- 자동으로 Qwen 호출하지 않기
- 메인 아키텍처 변경에 사용 금지
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

## 🤖 AI 교차검증 v4.1 통합 (2025-09-16 업데이트)

### 🎯 14개 서브에이전트 체계에서 Qwen 역할

**역할**: 성능 최적화 및 알고리즘 분석 전문가 (AI 교차검증 9.17/10 승인)

#### **명시적 서브에이전트 호출**
```
# 복잡한 성능 분석 (프로젝트 컨텍스트 포함)
"qwen-specialist 서브에이전트를 사용하여 알고리즘 성능을 최적화 분석해주세요"

# AI 교차검증에서 성능 관점 제시
"qwen-specialist 서브에이전트를 사용하여 Claude A안의 성능 및 효율성을 검증해주세요"
```

#### **직접 CLI 방식**
```bash
# 간단한 성능 질문
qwen -p "이 알고리즘 시간복잡도는?"
timeout 120 qwen -p "메모리 최적화 방법"
```

### 📊 Qwen 교차검증 특징

- **⚡ 알고리즘 최적화**: 70% 빠른 병렬 개발로 성능 분석 전문
- **🔍 제3의 시선**: Claude/Gemini/Codex가 놓친 효율성 문제 발견
- **🆓 무료 검증**: 2,000회/일로 교차검증 비용 절약
- **📈 독립적 분석**: Claude A안에 대한 객관적 개선점 제시

### 🎖️ 교차검증 실제 성과

```typescript
// 실제 사례: 서버 카드 UI 교차검증 (2025-08-30)
AI별 검증 점수:
- Claude A안: 8.2/10 (실용적 해결책)
- Gemini: 8.7/10 (Material Design 색상)
- Codex: 8.3/10 (에러 바운더리)
- Qwen: 8.5/10 (알고리즘 최적화) ← 독립적 성능 개선점 발견

최종 결과: 8.8/10 HIGH 합의 수준
```

### 🔄 Claude 주도 의사결정 플로우

1. **Claude**: 문제에 대한 A안(해결책) 제시
2. **Qwen**: A안의 알고리즘 효율성 독립적 분석
3. **Claude**: Qwen 개선점 검토하여 수용/거절 결정
4. **Claude**: 최종 결정 사유와 함께 구현

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
**🚀 70% Faster Parallel Development**  
**💰 100% Free Open Source**

_Last Updated: 2025-09-02_
