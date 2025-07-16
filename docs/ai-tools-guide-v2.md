# 🤖 AI 도구 통합 가이드 v2.0

## 📋 목차
1. [개요](#개요)
2. [새로운 AI 도구 소개](#새로운-ai-도구-소개)
3. [설치 및 설정](#설치-및-설정)
4. [사용 가이드](#사용-가이드)
5. [WSL 환경 최적화](#wsl-환경-최적화)
6. [사용 시나리오](#사용-시나리오)
7. [문제 해결](#문제-해결)

## 개요

OpenManager VIBE v5에는 Claude Code와 Gemini CLI가 효율적으로 협업할 수 있는 차세대 AI 도구가 통합되었습니다.

### 🚀 주요 특징
- **스마트 Fallback 시스템**: Pro 모델 한도 초과 시 자동으로 Flash 모델로 전환
- **AI Orchestrator**: Claude와 Gemini의 체계적인 협업
- **실시간 대시보드**: 사용량 모니터링 및 비용 분석
- **WSL 최적화**: WSL 환경에서의 완벽한 통합

## 새로운 AI 도구 소개

### 1. 🧠 Smart Gemini Wrapper (`smart-gemini-wrapper.ts`)
자동 fallback 시스템이 내장된 지능형 Gemini 래퍼

**주요 기능:**
- Pro → Flash 자동 전환
- 캐싱 시스템 (5분 TTL)
- 사용량 추적 및 로깅
- Rate limiting 자동 적용

### 2. 🤝 AI Orchestrator (`ai-orchestrator.ts`)
Claude와 Gemini의 협업을 관리하는 오케스트레이터

**주요 기능:**
- 다각도 분석 (기술, 사용자, 비즈니스, 보안)
- 단계별 솔루션 생성
- 자동 리포트 생성
- 컨텍스트 누적 관리

### 3. 📊 AI Usage Dashboard (`ai-usage-dashboard.ts`)
실시간 사용량 모니터링 대시보드

**주요 기능:**
- 모델별 사용량 통계
- 비용 예측 및 분석
- 트렌드 분석
- CSV 내보내기

### 4. 🐧 WSL AI Wrapper (`wsl-ai-wrapper.sh`)
WSL 환경 통합 래퍼

**주요 기능:**
- 자동 환경 감지
- 경로 자동 변환
- 통합 명령어 인터페이스
- 별칭 설정

## 설치 및 설정

### 1. 기본 설정
```bash
# 실행 권한 부여
chmod +x tools/*.sh
chmod +x tools/g

# WSL 환경 설정 (권장)
npm run ai:setup
# 또는
./tools/wsl-ai-wrapper.sh setup
```

### 2. 별칭 설정 (WSL)
설정 후 사용 가능한 별칭:
- `ai` - 메인 도구
- `aic` - 빠른 채팅
- `aia` - 협업 분석
- `aiq` - 빠른 해결

## 사용 가이드

### 📱 npm 스크립트 사용

```bash
# 스마트 채팅 (자동 fallback)
npm run ai:smart chat "질문내용"

# AI 협업 분석
npm run ai:analyze "문제 설명"

# 빠른 해결책
npm run ai:quick "문제 설명"

# 사용량 대시보드
npm run ai:usage

# 실시간 모니터링
npm run ai:live
```

### 🖥️ 직접 실행

#### TypeScript 도구 (tsx 필요)
```bash
# Smart Gemini Wrapper
tsx tools/smart-gemini-wrapper.ts chat "질문"
tsx tools/smart-gemini-wrapper.ts health
tsx tools/smart-gemini-wrapper.ts report

# AI Orchestrator
tsx tools/ai-orchestrator.ts analyze "로그인이 간헐적으로 실패"
tsx tools/ai-orchestrator.ts quick "TypeScript 에러"

# Usage Dashboard
tsx tools/ai-usage-dashboard.ts show
tsx tools/ai-usage-dashboard.ts live 5
tsx tools/ai-usage-dashboard.ts export 30
```

#### WSL 통합 도구
```bash
# 기본 사용
./tools/wsl-ai-wrapper.sh chat "질문"
./tools/wsl-ai-wrapper.sh analyze "문제"
./tools/wsl-ai-wrapper.sh quick "문제"
./tools/wsl-ai-wrapper.sh stats
./tools/wsl-ai-wrapper.sh health

# 별칭 사용 (setup 후)
ai chat "질문"
aic "빠른 질문"
aia "복잡한 문제 분석"
aiq "빠른 해결책"
```

## WSL 환경 최적화

### 환경 감지 및 최적화
WSL 환경에서 자동으로:
- Windows ↔ WSL 경로 변환
- Shell 옵션 최적화
- 파일 시스템 호환성 보장

### 권장 설정
```bash
# 1. WSL 설정 실행
./tools/wsl-ai-wrapper.sh setup

# 2. bashrc 다시 로드
source ~/.bashrc

# 3. 환경 정보 확인
ai info
```

## 사용 시나리오

### 시나리오 1: 버그 분석
```bash
# Claude가 초기 분석을 수행하고, Gemini가 다각도로 검토
npm run ai:analyze "사용자 로그인이 간헐적으로 실패함"
```

### 시나리오 2: 코드 리뷰
```bash
# 변경사항을 Claude와 Gemini가 함께 리뷰
git diff | ./tools/g diff "SOLID 원칙 관점에서 리뷰"
```

### 시나리오 3: 성능 최적화
```bash
# 파일을 분석하고 최적화 방안 제시
./tools/wsl-ai-wrapper.sh file src/app/page.tsx "성능 최적화 방법"
```

### 시나리오 4: 사용량 관리
```bash
# 실시간 대시보드로 사용량 모니터링
npm run ai:live

# 30일 비용 예측
tsx tools/ai-usage-dashboard.ts cost 30
```

## 문제 해결

### 일반적인 문제

#### 1. tsx 명령을 찾을 수 없음
```bash
# 전역 설치
npm install -g tsx

# 또는 npx 사용
npx tsx tools/smart-gemini-wrapper.ts
```

#### 2. Gemini CLI 인증 오류
```bash
# 재인증
gemini auth

# 상태 확인
gemini /stats
```

#### 3. WSL 경로 문제
```bash
# 환경 정보 확인
./tools/wsl-ai-wrapper.sh info

# 경로 변환 테스트
wslpath -w /mnt/d/cursor/project
```

### 사용량 관련

#### Pro 모델 한도 초과
- 자동으로 Flash 모델로 전환됨
- 대시보드에서 사용량 확인: `npm run ai:usage`

#### 일일 한도 관리
```bash
# 현재 사용량 확인
npm run ai:usage

# 사용 패턴 분석
tsx tools/ai-usage-dashboard.ts trend

# CSV로 내보내기
tsx tools/ai-usage-dashboard.ts export 7 weekly_report.csv
```

## 기존 도구와의 차이점

### 기존 도구 (v1)
- 단순 래퍼 기능
- 수동 모델 선택
- 제한적인 에러 처리

### 새로운 도구 (v2)
- 스마트 fallback 시스템
- AI 협업 orchestration
- 실시간 모니터링
- WSL 환경 최적화
- 종합적인 에러 처리

## 마이그레이션 가이드

### 기존 명령어 호환성
```bash
# 기존 명령어도 계속 작동
./tools/g "질문"
npm run gemini:chat "질문"

# 새로운 명령어 (권장)
npm run ai:smart chat "질문"
ai chat "질문"  # WSL 별칭
```

### 권장 워크플로우
1. 간단한 질문: `ai chat` 또는 `aic`
2. 복잡한 문제: `ai analyze` 또는 `aia`
3. 빠른 해결: `ai quick` 또는 `aiq`
4. 사용량 확인: `ai stats` 또는 `npm run ai:usage`

## 고급 기능

### 협업 분석 커스터마이징
```typescript
// 프로그래밍 방식으로 사용
import { AIOrchestrator } from './tools/ai-orchestrator.js';

const orchestrator = new AIOrchestrator();
const result = await orchestrator.orchestrate({
  problem: "복잡한 문제 설명",
  projectPath: "/path/to/project",
  additionalContext: "추가 정보",
  saveReport: true
});
```

### 사용량 데이터 활용
```typescript
// 사용량 데이터 프로그래밍 접근
import { AIUsageDashboard } from './tools/ai-usage-dashboard.js';

const dashboard = new AIUsageDashboard();
const stats = await dashboard.getDailyStats();
const forecast = await dashboard.getCostForecast(90);
```

## 로드맵

### v2.1 (계획)
- [ ] 웹 기반 대시보드 UI
- [ ] 더 많은 AI 모델 지원
- [ ] 팀 협업 기능
- [ ] 자동 최적화 제안

### v3.0 (미래)
- [ ] 멀티 에이전트 시스템
- [ ] 자동 코드 생성 및 리팩토링
- [ ] 지속적 학습 시스템

---

**작성일**: 2025-07-16  
**버전**: 2.0.0  
**작성자**: Claude Code

> 💡 **팁**: WSL 환경에서는 `ai` 별칭을 사용하면 모든 기능에 빠르게 접근할 수 있습니다!