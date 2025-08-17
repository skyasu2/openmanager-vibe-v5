# ⚡ OpenManager VIBE v5 빠른 시작

> **5분 내 개발 환경 완전 설정** | WSL 2 + AI CLI 통합  
> **최종 업데이트**: 2025-08-17 | **테스트 환경**: Windows 11 + WSL 2

## 🎯 개요

OpenManager VIBE v5를 5분 내에 완전 설정하여 개발을 시작할 수 있습니다.

**필수 요구사항**:

- Windows 11 + WSL 2 (Ubuntu 24.04 LTS)
- Node.js v22.18.0+
- Git 설정 완료

## 🚀 1단계: 저장소 클론 및 이동

```bash
# WSL 터미널에서 실행
git clone https://github.com/skyasu2/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 현재 위치 확인
pwd
# 출력: /mnt/d/cursor/openmanager-vibe-v5 (예상)
```

## 🔧 2단계: 환경변수 설정

```bash
# 환경변수 템플릿 복사
cp .env.local.template .env.local

# 필수 환경변수 설정 (에디터로 열어서 수정)
nano .env.local
```

**필수 수정 항목**:

```bash
# GitHub 토큰 (개인 토큰 생성 필요)
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your_token_here

# Google AI API 키 (선택사항)
GOOGLE_AI_API_KEY=AIza_your_key_here

# Supabase 설정 (기본값 사용 가능)
NEXT_PUBLIC_SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
```

## 📦 3단계: 의존성 설치

```bash
# Node.js 버전 확인
node --version
# 필요: v22.18.0+

# 패키지 설치
npm install

# 설치 성공 확인
npm list --depth=0 | head -5
```

## 🤖 4단계: AI CLI 도구 설정

```bash
# Claude Code 버전 확인
claude --version
# 출력: 1.0.81 (Claude Code)

# 다른 AI 도구들 확인
gemini --version  # 0.1.21
qwen --version    # 0.0.6
ccusage --version # 15.9.7
```

**AI 도구가 없는 경우 설치**:

```bash
# WSL에서 전역 설치
sudo npm install -g @anthropic-ai/claude-code
sudo npm install -g @google/gemini-cli
sudo npm install -g @qwen-code/qwen-code
sudo npm install -g ccusage
```

## 🔌 5단계: MCP 서버 확인

```bash
# MCP 설정 파일 확인
cat .mcp.json | head -10

# Claude Code MCP 상태 확인
claude mcp list | head -5
```

**예상 출력**: 11개 MCP 서버 연결 확인

## 🧪 6단계: 빠른 테스트

```bash
# 빠른 테스트 실행 (30초)
npm run test:quick

# 개발 서버 시작
npm run dev
```

**성공 시 출력**:

```
✓ Ready in 2.1s
✓ Local: http://localhost:3000
✓ Network: use --host to expose
```

## ✅ 완료 확인

### 필수 체크리스트

- [ ] **Git 클론**: 저장소 다운로드 완료
- [ ] **환경변수**: `.env.local` 파일 설정 완료
- [ ] **의존성**: `npm install` 성공
- [ ] **AI 도구**: 4개 CLI 도구 작동 확인
- [ ] **MCP 서버**: 11개 서버 연결 확인
- [ ] **테스트**: `test:quick` 통과
- [ ] **개발 서버**: localhost:3000 접속 가능

### 다음 단계

✅ **개발 준비 완료!** 이제 다음 문서들을 참고하세요:

| 목적                    | 문서                                                                                               | 소요시간 |
| ----------------------- | -------------------------------------------------------------------------------------------------- | -------- |
| **전체 아키텍처 이해**  | [system-architecture.md](./system-architecture.md)                                                 | 15분     |
| **AI 도구 활용법**      | [AI-SYSTEMS.md](./AI-SYSTEMS.md)                                                                   | 15분     |
| **MCP 서버 완전 활용**  | [MCP-GUIDE.md](./MCP-GUIDE.md)                                                                     | 20분     |
| **개발 환경 상세 설정** | [development/current-development-environment.md](./development/current-development-environment.md) | 10분     |

## 🚨 문제 해결

**주요 문제들의 빠른 해결책**:

### Node.js 버전 문제

```bash
# nvm으로 Node.js 업데이트
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 22.18.0
nvm use 22.18.0
```

### WSL 메모리 부족

```bash
# WSL 메모리 확인
free -h

# Windows에서 WSL 재시작
wsl --shutdown
wsl
```

### AI CLI 도구 설치 실패

```bash
# 권한 문제 해결
sudo chown -R $(whoami) ~/.npm
npm cache clean --force

# 개별 설치 재시도
sudo npm install -g @anthropic-ai/claude-code --force
```

### MCP 서버 연결 실패

```bash
# 환경변수 다시 로드
source .env.local

# MCP 설정 확인
ls -la .mcp.json
```

## 💡 팁

### 개발 효율성 극대화

- **AI 협업**: Claude + Codex + Gemini + Qwen 동시 활용
- **실시간 모니터링**: `ccusage statusline` 활성화
- **빠른 테스트**: `npm run test:quick` (6초)
- **메모리 최적화**: WSL 8GB 할당 (실제 7.8GB 사용 가능)

### 자주 사용하는 명령어

```bash
# 개발 서버 (최적화)
npm run dev:optimized

# 전체 검증
npm run validate:all

# Git 상태 확인
npm run git:status

# 빠른 빌드
npm run build:fallback
```

---

🎯 **성공!** 5분 만에 OpenManager VIBE v5 개발 환경이 완전히 설정되었습니다!

**문제가 발생하면**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) 참고  
**전체 가이드**: [README.md](./README.md) 참고

💡 **핵심 원칙**: WSL 멀티 AI 통합 + Type-First 개발 + 무료 티어 최적화
