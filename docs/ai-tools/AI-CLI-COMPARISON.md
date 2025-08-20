# AI CLI 코딩 에이전트 종합 비교

> **최종 업데이트**: 2025년 8월 18일  
> **버전**: v2.0 (2025년 하반기 업데이트)

## 🎯 한눈에 비교

| 항목 | Claude Code | Codex CLI | Gemini CLI | Qwen Code |
|------|-------------|-----------|------------|-----------|
| **성격/라이선스** | Anthropic 공식 CLI, 오픈소스 | OpenAI 공식 CLI, Apache-2.0 | Google 공식 CLI, Apache-2.0 | Qwen 공식 CLI, 오픈소스(연구 목적) |
| **설치** | `npm i -g @anthropic-ai/claude-code` 또는 네이티브 인스톨러 | `npm i -g @openai/codex` 또는 `brew install codex` | `npm i -g @google/gemini-cli` 또는 `npx` / Homebrew | `npm i -g @qwen-code/qwen-code` |
| **지원 OS** | macOS, Linux, Windows(WSL/Git Bash) | macOS, Linux, Windows(WSL2 필요) | macOS, Linux, Windows | macOS, Linux, Windows |
| **요구사항** | Node.js 18+ | Node.js 18+ | Node.js 20+ | Node.js 20+ |
| **인증/요금** | Anthropic Console(유료), Claude Pro/Max, Bedrock/Vertex | ChatGPT Plus/Pro/Team 또는 OpenAI API 키 | Google 계정 무료 Code Assist(미리보기) | Qwen OAuth(1-클릭) 또는 OpenAI 호환 API |
| **무료 할당** | - | - | 60 req/min, 1,000 req/day | 지역/프로바이더별 무료 티어 |
| **핵심 기능** | 코드 이해/편집, 명령 실행, Git 워크플로, MCP 지원, JSON/스트림 출력 | 로컬 샌드박스, 승인 모드(읽기전용/읽기쓰기/풀오토), MCP 지원 | 코드 이해/편집, 파일/셸/웹 검색, MCP/검색 그라운딩, 비대화형 자동화 | Gemini CLI 포크/개조, Qwen-Coder 특화 파서/툴, 멀티 API 백엔드 |

## 🚀 실제 활용 현황 (OpenManager VIBE v5 기준)

### 1. 🏆 Claude Code (메인 개발)

- **역할**: 주력 개발 환경
- **용도**: 모든 핵심 개발 작업
- **환경**: WSL 2 + Ubuntu 24.04 LTS
- **강점**: MCP 서버 완전 통합, Linux 네이티브 성능
- **비용**: Claude Max ($200/월)

### 2. 🤝 Codex CLI (서브 에이전트)

- **역할**: 병렬 개발 파트너
- **용도**: 테스트 코드 작성, 코드 리뷰
- **환경**: WSL 2 (동일 환경)
- **강점**: 로컬 샌드박스, 승인 모드
- **비용**: ChatGPT Plus ($20/월)

### 3. 👨‍💻 Gemini CLI (아키텍처 리뷰어)

- **역할**: Senior Code Architect Sub Agent
- **용도**: 코드 품질 검토, SOLID 원칙 검증
- **환경**: WSL 2 (토큰 절약 최적화)
- **강점**: 무료 할당, 빠른 분석
- **비용**: 무료 (1,000 req/day)

### 4. 🔷 Qwen Code (병렬 모듈 개발)

- **역할**: 제3의 시선, 독립 모듈 개발
- **용도**: 민감한 코드, 대안적 접근법
- **환경**: WSL 2 (로컬 실행)
- **강점**: 480B MoE 모델, 256K→1M 토큰
- **비용**: 무료 (2,000 req/day)

## 📊 성능 비교 (실제 측정 기준)

| 지표 | Claude Code | Codex CLI | Gemini CLI | Qwen Code |
|------|-------------|-----------|------------|-----------|
| **응답 속도** | 2-4초 | 3-6초 | 1-3초 | 4-8초 |
| **코드 품질** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **한국어 지원** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **토큰 효율성** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **MCP 통합** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

## 🛠️ 설치 및 설정

### Claude Code

```bash
# WSL 환경
curl -fsSL https://claude.ai/install.sh | sh
# 또는
npm install -g @anthropic-ai/claude-code
claude auth login
```

### Codex CLI

```bash
# WSL 환경
npm install -g @openai/codex
codex auth login
# Windows에서 실행: .\codex-wsl.bat
```

### Gemini CLI

```bash
# WSL 환경  
npm install -g @google/gemini-cli
gemini auth login
# Windows에서 실행: .\gemini-wsl.bat /stats
```

### Qwen Code

```bash
# WSL 환경
npm install -g @qwen-code/qwen-code  
qwen auth login
# Windows에서 실행: .\qwen-wsl.bat
```

## 🎯 사용 전략

### 동시 사용 워크플로우

1. **Claude Code**: 메인 기능 개발
2. **Codex CLI**: 테스트 코드 작성
3. **Gemini CLI**: 코드 리뷰 및 품질 검증
4. **Qwen Code**: 독립 모듈 및 대안 접근법

### 비용 최적화

- **무료 우선**: Gemini → Qwen → 유료 서비스
- **토큰 절약**: 압축 명령어 활용 (`/compress`, `/clear`)
- **역할 분담**: 각 도구의 강점에 맞는 작업 배분

## 📈 선택 가이드

### 개인 개발자

- **시작**: Gemini CLI (무료)
- **성장**: + Qwen Code (무료)
- **프로**: + Claude Code (유료)

### 팀 개발

- **코어**: Claude Code + Codex CLI
- **보조**: Gemini CLI + Qwen Code
- **특화**: 각 도구별 전문 영역 활용

### 기업 환경

- **보안**: Qwen Code (로컬 실행)
- **품질**: Claude Code + Gemini CLI
- **효율**: 전체 도구 조합 활용

---

> **💡 팁**: 모든 도구를 WSL 환경에 설치하여 일관된 Linux 개발 환경을 유지하고, Windows에서는 래퍼 스크립트(`.bat`)를 통해 접근하는 것을 권장합니다.
