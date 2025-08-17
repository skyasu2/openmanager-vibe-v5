# 🚨 OpenManager VIBE v5 문제 해결 가이드

> **빠른 해결책 중심** | WSL 2 + AI CLI 통합 환경  
> **최신 업데이트**: 2025-08-17 | **테스트 환경**: Windows 11 + WSL 2

## 🎯 자주 발생하는 문제 TOP 10

### 1. 🐧 WSL 메모리 부족 (가장 빈번)

**증상**: npm install 실패, AI 도구 응답 지연

```bash
# 메모리 확인
free -h
# Available이 1GB 미만이면 부족

# 빠른 해결
wsl --shutdown
wsl

# 영구 해결 (.wslconfig 편집)
# Windows에서: %USERPROFILE%\.wslconfig
[wsl2]
memory=10GB
swap=8GB
```

### 2. 🤖 AI CLI 도구 설치/실행 실패

**증상**: `claude: command not found`, `gemini: command not found`

```bash
# WSL에서 설치 확인
which claude gemini qwen ccusage

# 없으면 재설치 (WSL 내부에서)
sudo npm install -g @anthropic-ai/claude-code
sudo npm install -g @google/gemini-cli
sudo npm install -g @qwen-code/qwen-code
sudo npm install -g ccusage

# PATH 확인
echo $PATH | grep npm
```

### 3. 🔌 MCP 서버 연결 실패

**증상**: Claude Code에서 MCP 도구 사용 불가

```bash
# MCP 설정 확인
cat .mcp.json | head -5

# 환경변수 로드 확인
echo $GITHUB_PERSONAL_ACCESS_TOKEN
echo $TAVILY_API_KEY

# Claude MCP 재시작
claude mcp list
claude api restart
```

### 4. 🔑 GitHub 인증 실패

**증상**: git push 실패, "Invalid username or token"

```bash
# git 원격 URL 확인
git remote -v

# 하드코딩된 토큰 제거
git remote set-url origin https://github.com/skyasu2/openmanager-vibe-v5.git

# 환경변수에서 토큰 로드
source .env.local
git push
```

### 5. 📦 Node.js 버전 불일치

**증상**: npm install 오류, "engine not compatible"

```bash
# WSL에서 Node.js 버전 확인
node --version
# 필요: v22.18.0+

# 버전 업데이트
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 22.18.0
nvm use 22.18.0
```

### 6. 🌐 개발 서버 포트 충돌

**증상**: `EADDRINUSE: address already in use :::3000`

```bash
# 포트 사용 프로세스 확인
ss -tulpn | grep :3000

# 프로세스 종료
pkill -f "node.*3000"

# 다른 포트 사용
PORT=3001 npm run dev
```

### 7. 📄 환경변수 설정 오류

**증상**: API 호출 실패, 인증 오류

```bash
# 환경변수 파일 확인
ls -la .env.local

# 템플릿에서 복사
cp .env.local.template .env.local

# 필수 변수 설정 확인
grep -E "GITHUB_|GOOGLE_|SUPABASE_" .env.local
```

### 8. 🧪 테스트 실행 실패

**증상**: `npm test` 오류, Vitest 실행 안됨

```bash
# 빠른 테스트만 실행
npm run test:quick

# 캐시 정리 후 재시도
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 9. 🏗️ 빌드 실패 (TypeScript 오류)

**증상**: `npm run build` 실패, 타입 오류

```bash
# 타입 체크만 실행
npm run type-check

# 빠른 빌드 (타입 체크 스킵)
npm run build:fallback

# Vercel 배포용 빌드
npm run build:production
```

### 10. 💾 Supabase 연결 실패

**증상**: 데이터베이스 연결 오류, RAG 검색 실패

```bash
# Supabase 설정 확인
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# 연결 테스트
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY"
```

## 🔧 고급 문제 해결

### Windows ↔ WSL 파일 권한 문제

```bash
# WSL에서 파일 권한 수정
sudo chown -R $(whoami):$(whoami) /mnt/d/cursor/openmanager-vibe-v5
chmod -R 755 /mnt/d/cursor/openmanager-vibe-v5
```

### IDE 연동 문제 (Kiro, VSCode, Windsurf)

```bash
# WSL 터미널에서 IDE 연동 확인
echo $TERM
echo $SHELL

# 필요시 bash 프로파일 설정
source ~/.bashrc
source ~/.profile
```

### MCP 서버 개별 디버깅

```bash
# 개별 MCP 서버 테스트
timeout 10s uvx mcp-server-time --version
timeout 10s npx -y @supabase/mcp-server-supabase@latest --version

# 권한 문제 해결
sudo chmod +x ~/.local/bin/uvx
```

## 🛡️ 예방 조치

### 정기 시스템 유지보수

```bash
# 주간 정리 (매주 실행 권장)
#!/bin/bash
# WSL 캐시 정리
sudo apt autoremove
sudo apt autoclean
npm cache clean --force

# AI 도구 업데이트
sudo npm update -g @anthropic-ai/claude-code
sudo npm update -g ccusage
```

### 환경 백업

```bash
# 중요 설정 백업
cp .env.local .env.local.backup
cp .mcp.json .mcp.json.backup
cp ~/.wslconfig ~/.wslconfig.backup
```

## 📊 진단 도구

### 시스템 상태 한번에 확인

```bash
#!/bin/bash
echo "=== WSL 환경 상태 ==="
free -h
df -h /
echo "\n=== AI CLI 도구 ==="
claude --version 2>/dev/null || echo "Claude: 설치 안됨"
gemini --version 2>/dev/null || echo "Gemini: 설치 안됨"
echo "\n=== Node.js 환경 ==="
node --version
npm --version
echo "\n=== 프로젝트 상태 ==="
ls -la .env.local 2>/dev/null || echo "환경변수 파일 없음"
ls -la .mcp.json 2>/dev/null || echo "MCP 설정 파일 없음"
```

### 빠른 헬스체크

```bash
# 5초 만에 핵심 상태 확인
npm run health:quick || echo "헬스체크 스크립트 없음"
claude mcp list | head -3
echo "메모리: $(free -h | grep Mem | awk '{print $3"/"$2}')"
```

## 📞 추가 도움

### 우선순위별 문서 참조

1. **즉시 해결**: 위의 TOP 10 문제 확인
2. **환경 설정**: [QUICK-START.md](./QUICK-START.md)
3. **MCP 문제**: [MCP-GUIDE.md](./MCP-GUIDE.md)
4. **AI 협업**: [AI-SYSTEMS.md](./AI-SYSTEMS.md)
5. **전체 구조**: [system-architecture.md](./system-architecture.md)

### 긴급 상황 (5분 이내 해결)

```bash
# 모든 것이 안되면 마지막 수단
wsl --shutdown
wsl --unregister Ubuntu-24.04
wsl --install Ubuntu-24.04
# 주의: 모든 WSL 데이터 삭제됨
```

### 문제 보고 템플릿

```
🐛 버그 리포트

**환경**:
- OS: Windows 11 + WSL 2
- WSL 버전: `wsl --version`
- Node.js: `node --version`
- Claude: `claude --version`

**문제 상황**:
[구체적인 오류 메시지와 상황]

**재현 단계**:
1. ...
2. ...

**시도한 해결책**:
[위 가이드에서 시도한 방법들]
```

---

💡 **핵심 원칙**: WSL 우선 → AI CLI 확인 → 환경변수 검증 → MCP 서버 상태  
🚀 **빠른 시작**: [QUICK-START.md](./QUICK-START.md)에서 5분 설정 가능

> **99% 문제는 위 TOP 10으로 해결됩니다!** 📈
