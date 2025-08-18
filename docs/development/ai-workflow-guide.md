# 🤖 AI 개발 워크플로우 가이드

## 개발 환경 구성

### 주력 개발 환경: WSL + Claude Code

```bash
# WSL 터미널에서 실행
claude # Claude Code 실행
```

**Claude Code 역할:**

- 메인 코드 작성 및 리팩토링
- 아키텍처 설계 및 의사결정
- 프로젝트 전체 컨텍스트 관리

### 서브 AI 에이전트 활용

```bash
# 필요시 Claude Code에서 호출
gemini-cli    # 주력 보조 AI (Claude 사용량 조절 및 토큰 부족시)
codex-cli     # ChatGPT Plus 요금제 활용 (추가 코드 생성 옵션)
qwen-cli      # 무료 제공량 풍부 (비용 절약용 백업)
```

**활용 전략:**

- **gemini-cli**: Claude Code 토큰 부족시 대체, 사용량 조절
- **codex-cli**: ChatGPT Plus 요금제로 추가 코드 생성 옵션 확보
- **qwen-cli**: 무료 제공량이 풍부하여 비용 절약 목적

### 보조 개발 환경: VS Code + GitHub Copilot

**VS Code 주요 용도:**

1. **WSL 터미널 호스팅** - Claude Code 실행 환경 제공
2. **이미지 처리 전문**
   - 스크린샷 캡쳐 → Claude Code로 전달
   - 디자인 목업 이미지 → 컴포넌트 변환
   - UI/UX 참고 이미지 분석
3. **GitHub Copilot 보조 기능**
   - 빠른 스니펫 생성
   - 타입 정의 자동완성
   - 반복 패턴 코드 제안

## 실제 개발 플로우

### 1. 새 기능 개발

```bash
# WSL 터미널에서
cd /mnt/d/cursor/openmanager-vibe-v5
claude

# Claude Code에서:
# 1. 기능 분석 및 설계
# 2. 필요시 서브 에이전트 호출
# 3. 코드 작성 및 테스트
```

### 2. 이미지 기반 작업

```
# VS Code에서:
1. 스크린샷 캡쳐 (Ctrl+Shift+S)
2. 이미지 붙여넣기 (Ctrl+V)
3. GitHub Copilot으로 이미지 분석
4. 결과를 WSL의 Claude Code로 전달
```

### 3. 코드 리뷰 및 리팩토링

```bash
# Claude Code 주도:
# - 전체 아키텍처 검토
# - 모듈화 패턴 적용
# - 성능 최적화

# Copilot 보조:
# - 타입 오류 수정
# - 간단한 스타일 개선
```

## AI 에이전트별 전문 분야

### Claude Code (메인)

- **강점**: 컨텍스트 이해, 아키텍처 설계, 복잡한 로직
- **활용**: 전체 프로젝트 구조 관리, 핵심 비즈니스 로직

### gemini-cli (서브)

- **강점**: 토큰 관리, 사용량 조절, Claude 대체 AI
- **활용**: Claude Code 토큰 부족시 즉시 대체, 사용량 분산

### codex-cli (서브)

- **강점**: ChatGPT Plus 요금제 활용, 코드 생성
- **활용**: 추가 코드 생성 옵션, Plus 요금제 최대 활용

### qwen-cli (서브)

- **강점**: 무료 제공량 풍부, 비용 효율성
- **활용**: 비용 절약 목적, 무료 백업 AI

### GitHub Copilot (보조)

- **강점**: 실시간 자동완성, 이미지 분석, GUI 통합
- **활용**: 빠른 스니펫, 이미지 기반 작업

## 실제 사용 사례

### 사례 1: Claude Code 토큰 부족 상황

```bash
# 1. Claude Code로 개발 시작
claude
# "새로운 벡터 검색 서비스를 8개 모듈 패턴으로 설계해줘"

# 2. 토큰 부족시 gemini-cli로 즉시 전환
gemini-cli
# "앞서 논의한 벡터 검색 서비스 구현 계속해줘"

# 3. 추가 코드 생성은 codex-cli (ChatGPT Plus)
codex-cli
# "TypeScript 인터페이스를 Python Pydantic 모델로 변환"

# 4. 무료 백업으로 qwen-cli 활용
qwen-cli
# "간단한 유틸리티 함수들 생성해줘"
```

### 사례 2: UI 컴포넌트 개발 (이미지 기반)

```
# 1. VS Code에서 디자인 목업 캡쳐
# 2. GitHub Copilot으로 이미지 분석
#    "이 디자인을 React + Tailwind 컴포넌트로 변환해줘"
# 3. 생성된 코드를 WSL의 Claude Code로 전달
# 4. Claude Code에서 프로젝트 패턴에 맞게 리팩토링
```

### 사례 3: 비용 최적화 개발

```bash
# 1. 주요 로직은 Claude Code
claude
# "핵심 비즈니스 로직 구현"

# 2. 반복 작업은 무료 qwen-cli로 절약
qwen-cli 
# "테스트 케이스 생성, 문서화, 간단한 유틸리티"

# 3. Plus 요금제 최대한 활용
codex-cli
# "복잡한 코드 변환, 고급 패턴 구현"
```

## 개발 환경 최적화 팁

### WSL 터미널 설정

```bash
# .bashrc 또는 .zshrc에 추가
alias claude="claude-code"
alias gemini="gemini-cli"
alias codex="codex-cli" 
alias qwen="qwen-cli"

# 프로젝트 디렉토리로 빠른 이동
alias vibe="cd /mnt/d/cursor/openmanager-vibe-v5"
```

### VS Code 설정 최적화

```json
// WSL 통합 최적화
{
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "github.copilot.chat.localeOverride": "ko",
  "github.copilot.enable": {
    "typescript": true,
    "typescriptreact": true
  }
}
```

## 협업 및 통합 전략

### Claude Code ↔ 서브 에이전트 통합

- Claude Code가 태스크 분석 후 적절한 서브 에이전트 선택
- 결과를 Claude Code로 다시 통합하여 일관성 유지

### WSL ↔ VS Code 통합

- VS Code는 시각적 작업 후 결과를 WSL로 전달
- WSL에서의 개발 결과를 VS Code로 시각화

### 품질 관리

- 모든 최종 코드는 Claude Code에서 검토
- 프로젝트 패턴 및 아키텍처 일관성 유지
- TypeScript strict mode 100% 준수

이 워크플로우를 통해 각 AI 도구의 강점을 최대한 활용하면서도 프로젝트의 일관성을 유지할 수 있습니다.
