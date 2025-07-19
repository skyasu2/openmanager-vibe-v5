# 백업된 AI 사이드바 구현체들

이 폴더에는 더 이상 사용하지 않는 AI 사이드바 관련 구현체들이 백업되어 있습니다.

## 백업 일시
2025-07-19

## 백업된 구현체들

### 1. modules-ai-sidebar/
- **설명**: 모듈화된 AI 사이드바 구현체
- **상태**: 사용되지 않음
- **포함 파일들**:
  - `AISidebarMobile.tsx` - 모바일 전용 구현
  - `ChatInterface.tsx` - 채팅 인터페이스
  - `StatusIndicator.tsx` - 상태 표시기
  - 관련 훅들 및 타입 정의

### 2. components-ai-sidebar/
- **설명**: 컴포넌트 레이어의 AI 사이드바 관련 파일들
- **상태**: 사용되지 않음
- **포함 파일들**:
  - `AgentThinkingPanel.tsx` - AI 생각 과정 패널
  - `EnhancedPresetQuestions.tsx` - 향상된 프리셋 질문
  - `GoogleAIBetaSettings.tsx` - Google AI 설정

### 3. 개별 컴포넌트들
- `AIFunctionPanel.tsx` - AI 기능 패널
- `QAPanel.tsx` - 질의응답 패널
- `ThinkingView.tsx` - 생각 과정 시각화
- `ContextSwitchPanel.tsx` - 컨텍스트 전환 패널
- `SimplifiedAISidebar.tsx` - 간소화된 AI 사이드바 (중복 구현체)
- `useAIQuery.ts` - SimplifiedAISidebar 전용 훅

## 현재 활성 구현체

### 주요 사용 중인 구현체:
1. **AISidebarV2** (`src/domains/ai-sidebar/components/AISidebarV2.tsx`)
   - **메인 AI 사이드바 구현체**
   - 도메인 주도 설계(DDD) 적용
   - 실시간 AI 로그, MCP 서버 연동
   - 4개 기능 페이지 (채팅, 자동보고서, 지능형모니터링, 고급관리)
   - 오른쪽 아이콘 패널 포함

2. **AISidebar** (`src/presentation/ai-sidebar/components/AISidebar.tsx`)
   - 래퍼 컴포넌트
   - AISidebarV2를 감싸는 호환성 레이어
   - 모든 대시보드에서 사용

## 복원 방법

필요시 다음 명령어로 복원 가능:
```bash
# 특정 파일 복원
Move-Item -Path "src/_backup/unused-ai-sidebar-implementations/[파일명]" -Destination "src/components/ai/"

# 전체 폴더 복원
Move-Item -Path "src/_backup/unused-ai-sidebar-implementations/modules-ai-sidebar" -Destination "src/modules/ai-sidebar"
```

## 주의사항

- 백업된 파일들을 복원할 때는 import 경로 및 의존성을 다시 확인해야 합니다.
- 일부 파일들은 현재 사용 중인 스토어나 훅과 호환되지 않을 수 있습니다.
- 복원 전에 현재 구현체와의 충돌 여부를 확인하세요.