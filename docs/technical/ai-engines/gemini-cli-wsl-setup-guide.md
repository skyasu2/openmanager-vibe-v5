# 🤖 Gemini CLI WSL 터미널 활용 가이드

> WSL(Windows Subsystem for Linux) 환경에서 Google Gemini CLI를 설치하고 활용하는 완전 가이드

## 📋 목차

1. [Gemini CLI 소개](#-gemini-cli-소개)
2. [설치 방법](#-설치-방법)
3. [인증 및 설정](#-인증-및-설정)
4. [활용 방법](#-활용-방법)
5. [Claude Code와 연동](#-claude-code와-연동)
6. [실전 사용 예시](#-실전-사용-예시)
7. [트러블슈팅](#-트러블슈팅)

## 🎯 Gemini CLI 소개

**Gemini CLI**는 Google의 Gemini 2.5 Pro 모델을 터미널에서 직접 사용할 수 있는 오픈소스 도구입니다.

### 주요 특징

- **1M 토큰 컨텍스트**: 초대형 코드베이스 분석 가능
- **무료 티어**: 일일 1,000회, 분당 60회 요청
- **멀티모달 지원**: 텍스트, 코드, 이미지, PDF 분석
- **ReAct 루프**: 자동화된 작업 수행

### 공식 리소스

- **GitHub**: https://github.com/google-gemini/gemini-cli
- **Google Cloud Docs**: https://cloud.google.com/gemini/docs/codeassist/gemini-cli
- **Google for Developers**: https://developers.google.com/gemini-code-assist/docs/gemini-cli

## 🔧 설치 방법

### 1. 사전 요구사항

```bash
# Node.js 20+ 확인
node --version  # v20.0.0 이상 필요

# Node.js 설치 (필요시)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Gemini CLI 설치

#### 방법 1: NPX (권장)

```bash
# 즉시 실행 (설치 없이)
npx gemini-cli

# 전역 설치
npm install -g gemini-cli
```

#### 방법 2: 직접 설치

```bash
# GitHub에서 클론
git clone https://github.com/google-gemini/gemini-cli.git
cd gemini-cli
npm install
npm link
```

### 3. 설치 확인

```bash
# 버전 확인
gemini --version

# 도움말
gemini --help
```

## 🔐 인증 및 설정

### 1. 개인 Google 계정 인증 (무료)

```bash
# Gemini CLI 시작
gemini

# 브라우저가 열리면 Google 계정으로 로그인
# 개인 계정 사용 시 자동으로 무료 라이선스 부여
```

### 2. API 키 설정 (선택사항)

```bash
# Gemini API 키 사용 (100회/일)
export GEMINI_API_KEY="your-api-key"

# Vertex AI 사용 (기업용)
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

### 3. 설정 파일

```bash
# ~/.gemini/config.json
{
  "model": "gemini-2.5-pro",
  "temperature": 0.7,
  "maxTokens": 1000000,
  "defaultPrompt": "You are a helpful AI assistant"
}
```

## 💻 활용 방법

### 1. 대화형 모드

```bash
# 기본 실행
gemini

# 프로젝트 디렉토리에서 실행
cd /mnt/d/cursor/openmanager-vibe-v5
gemini

# 이제 직접 대화 가능
> 이 프로젝트의 구조를 분석해줘
> src/services 디렉토리의 복잡도를 평가해줘
```

### 2. 단일 명령 모드

```bash
# 직접 질문
gemini "Next.js 15의 새로운 기능을 설명해줘"

# 파일 분석
gemini "이 파일의 보안 취약점을 찾아줘" < src/api/auth/route.ts

# 파이프와 함께 사용
cat README.md | gemini "이 문서를 개선할 방법을 제안해줘"
```

### 3. 배치 처리

```bash
# 여러 파일 분석
find src -name "*.ts" -exec sh -c 'echo "=== {} ===" && cat {} | gemini "복잡도 분석"' \;

# Git diff 분석
git diff main..feature | gemini "이 변경사항의 영향도를 분석해줘"

# 디렉토리 전체 분석
tar -cf - src/ | gemini "전체 소스코드 구조와 아키텍처를 분석해줘"
```

## 🔗 Claude Code와 연동

### 1. gemini-cli-collaborator 서브에이전트 활용

```typescript
// Claude Code에서 사용
Task({
  subagent_type: 'gemini-cli-collaborator',
  description: 'Gemini로 대규모 분석',
  prompt:
    'src/services 전체를 Gemini CLI로 분석하고 리팩토링 우선순위를 제시해줘',
});
```

### 2. 직접 요청 방법

```
// Claude Code에 직접 요청
"Gemini CLI를 사용해서 이 프로젝트의 성능 병목점을 찾아줘"
"Gemini에게 Next.js 15 마이그레이션 가이드를 물어봐줘"
```

### 3. Memory MCP를 통한 결과 공유

```bash
# Gemini 분석 결과를 파일로 저장
gemini "프로젝트 전체 분석" > analysis.txt

# Claude Code가 결과 활용
"analysis.txt 파일의 Gemini 분석 결과를 바탕으로 개선 계획을 세워줘"
```

## 📚 실전 사용 예시

### 1. 대규모 코드베이스 분석

```bash
# 전체 TypeScript 파일 복잡도 분석
find . -name "*.ts" -o -name "*.tsx" | \
  xargs wc -l | \
  gemini "이 파일들의 크기 분포를 분석하고 리팩토링이 필요한 파일을 추천해줘"
```

### 2. 아키텍처 리뷰

```bash
# 프로젝트 구조 시각화
tree -I 'node_modules|.git' | \
  gemini "이 프로젝트 구조를 분석하고 개선점을 제안해줘"
```

### 3. 보안 감사

```bash
# 환경변수 및 시크릿 검사
grep -r "process.env\|API_KEY\|SECRET" --include="*.ts" --include="*.js" | \
  gemini "보안 취약점이 있는지 검사하고 개선 방법을 제시해줘"
```

### 4. 성능 최적화

```bash
# 번들 크기 분석
npm run build --stats | \
  gemini "빌드 통계를 분석하고 번들 크기 최적화 방법을 제안해줘"
```

### 5. 문서 개선

```bash
# README 및 문서 검토
cat README.md docs/*.md | \
  gemini "문서의 일관성과 완성도를 평가하고 개선 사항을 제안해줘"
```

## 🐛 트러블슈팅

### 1. 인증 문제

```bash
# 토큰 재설정
rm -rf ~/.gemini/auth
gemini auth login
```

### 2. WSL에서 브라우저 열기 실패

```bash
# Windows 브라우저 연결 설정
export BROWSER="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"

# 또는 수동 URL 복사
gemini --no-browser
# 표시되는 URL을 수동으로 브라우저에 입력
```

### 3. 메모리 부족

```bash
# Node.js 메모리 증가
export NODE_OPTIONS="--max-old-space-size=8192"
gemini
```

### 4. 네트워크 프록시

```bash
# 프록시 설정
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
```

## 📊 사용량 모니터링

```bash
# 일일 사용량 확인 스크립트
cat > check-gemini-usage.sh << 'EOF'
#!/bin/bash
echo "🤖 Gemini CLI 사용량 확인"
echo "무료 티어: 1,000회/일, 60회/분"
echo ""
echo "오늘 사용량: $(grep -c "gemini" ~/.bash_history | tail -1)회 (추정)"
echo "남은 할당량: $((1000 - $(grep -c "gemini" ~/.bash_history | tail -1)))회"
EOF

chmod +x check-gemini-usage.sh
```

## 🎯 활용 팁

1. **컨텍스트 활용**: 1M 토큰을 활용해 전체 프로젝트 분석
2. **배치 처리**: 여러 파일을 한 번에 분석해 API 할당량 절약
3. **파이프 활용**: Unix 파이프와 조합해 강력한 분석 도구 구성
4. **결과 저장**: 중요한 분석 결과는 파일로 저장해 재사용
5. **Claude와 협업**: 복잡한 분석은 Gemini, 구현은 Claude로 역할 분담

## 📝 요약

Gemini CLI는 WSL 터미널에서 강력한 AI 어시스턴트로 활용할 수 있습니다. 특히:

- **무료로 Gemini 2.5 Pro 사용** (1,000회/일)
- **1M 토큰으로 대규모 분석** 가능
- **Claude Code와 완벽한 협업** 구성
- **배치 처리로 효율적인 작업** 수행

이제 WSL 터미널에서 `gemini` 명령으로 언제든지 Gemini 2.5 Pro와 대화할 수 있습니다!
