# ⚡ OpenManager Vibe v5 - 빠른 시작 가이드

> **5분 안에 바이브 코딩 환경 구축하기**  
> **목표**: Cursor IDE + MCP + AI 협업 환경 완전 자동 설정

---

## 🚀 1단계: 기본 환경 설정 (2분)

### ✅ **필수 요구사항 확인**

```bash
# Node.js 버전 확인 (18.17.0 이상 필요)
node --version

# npm 버전 확인 (9.0.0 이상 필요)
npm --version

# Cursor IDE 설치 확인
# https://cursor.sh/ 에서 다운로드
```

### 📦 **프로젝트 클론 및 의존성 설치**

```bash
# 프로젝트 클론
git clone https://github.com/your-repo/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 의존성 설치 (자동으로 모든 개발 도구 포함)
npm install

# 환경 변수 설정
cp .env.example .env.local
# Google AI API 키가 있다면 .env.local에 추가
```

---

## 🤖 2단계: MCP 자동 설정 (1분)

### ⚡ **원클릭 MCP 설정**

#### **Windows 사용자**

```powershell
# PowerShell에서 실행
npm run mcp:perfect:setup

# 완료 후 Cursor 재시작
```

#### **Linux/macOS 사용자**

```bash
# 터미널에서 실행
npm run mcp:perfect:setup

# 완료 후 Cursor 재시작
```

### 🔍 **MCP 설정 확인**

```bash
# MCP 서버 상태 확인
npm run mcp:status

# 다음과 같은 출력이 나와야 함:
# ✅ filesystem: 활성화
# ✅ memory: 활성화
# ✅ duckduckgo-search: 활성화
# ✅ sequential-thinking: 활성화
```

---

## 🧪 3단계: 테스트 환경 확인 (1분)

### 🏃 **빠른 검증 실행**

```bash
# 전체 시스템 빠른 검증
npm run validate:quick

# 예상 결과:
# ✅ TypeScript 타입 체크 통과
# ✅ ESLint 검사 통과
# ✅ 단위 테스트 11개 통과
```

### 🎯 **개발 서버 시작**

```bash
# 개발 서버 시작
npm run dev

# 브라우저에서 확인
# http://localhost:3000 접속
# AI 사이드바 토글 버튼 확인
```

---

## 🎨 4단계: 바이브 코딩 시작 (1분)

### 💬 **첫 번째 AI 협업**

#### **Cursor에서 AI 채팅 시작**

```
💬 "안녕 AI! OpenManager Vibe v5 프로젝트를 분석해줘.
현재 구조와 주요 기능들을 요약해줘."
```

#### **MCP 기능 테스트**

```
💬 "src/components 폴더의 파일들을 분석해서
가장 자주 사용되는 컴포넌트 5개를 찾아줘."
```

#### **실시간 코딩 협업**

```
💬 "AI 사이드바 컴포넌트의 성능을 개선하고 싶어.
현재 코드를 분석해서 최적화 방안을 제시해줘."
```

---

## 📚 다음 단계

### 🔥 **추가 학습 리소스**

- [📖 바이브 코딩 완전 가이드](./VIBE_CODING_COMPLETE_GUIDE.md)
- [🤖 MCP 완전 가이드](../development/docs/guides/MCP_완전_가이드.md)
- [🛠️ 개발 완전 가이드](../development/docs/guides/개발_완전_가이드.md)

### 🚀 **고급 기능 활성화**

```bash
# AI 중심 MCP 프로필로 전환
npm run mcp:profile:ai-focused

# 성능 모니터링 시작
npm run generate:metrics

# E2E 테스트 환경 설정
npm run test:e2e:install
```

### 🎯 **실전 프로젝트 시작**

```bash
# 새 기능 브랜치 생성
git checkout -b feature/my-new-feature

# AI와 함께 기능 계획 수립
💬 "AI야, [새 기능명] 기능을 구현하기 위한
단계별 계획을 세워보자."

# 바이브 코딩 시작!
```

---

## ❓ 문제 해결

### 🚨 **MCP 연결 안됨**

```bash
# Cursor 완전 재시작
# MCP 설정 재실행
npm run mcp:perfect:setup

# 상태 재확인
npm run mcp:status
```

### 🐛 **테스트 실패**

```bash
# 의존성 재설치
npm ci

# 테스트 재실행
npm run test:unit
```

### 🔧 **개발 서버 에러**

```bash
# 포트 정리
npm run clean:ports

# 클린 빌드
npm run build:clean
```

---

## 🎉 완료

**축하합니다! 이제 바이브 코딩 환경이 완전히 구축되었습니다.**

- ✅ **Cursor IDE**: AI 협업 준비 완료
- ✅ **MCP 시스템**: 프로젝트 완전 분석 가능
- ✅ **테스트 환경**: 자동화된 품질 검증
- ✅ **배포 시스템**: Vercel 자동 배포 연결

### 🚀 **다음 액션**

1. 첫 번째 AI 협업 세션 시작
2. 기존 코드 리뷰 및 개선
3. 새로운 기능 개발 시작

**Happy Vibe Coding! 🎨**

---

_빠른 시작 가이드 - OpenManager Vibe v5 개발팀_  
_최종 업데이트: 2025년 6월 10일_
