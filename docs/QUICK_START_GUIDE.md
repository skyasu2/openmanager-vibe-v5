# ⚡ OpenManager Vibe v5 - 빠른 시작 가이드

> **5분 안에 바이브 코딩 환경 구축하기**  
> **목표**: Cursor IDE + MCP + AI 협업 환경 완전 자동 설정  
> **검증됨**: 실제 20일 개발 경험으로 검증된 방법

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

# 환경 변수 설정 (선택사항)
cp .env.example .env.local
# Google AI API 키가 있다면 .env.local에 추가
```

---

## 🤖 2단계: MCP 자동 설정 (1분)

### ⚡ **원클릭 MCP 설정 (검증된 방법)**

#### **Windows 사용자**

```powershell
# PowerShell에서 실행 (관리자 권한 불필요)
npm run mcp:perfect:setup

# 완료 후 Cursor 재시작
```

#### **Linux/macOS 사용자**

```bash
# 터미널에서 실행
npm run mcp:perfect:setup

# 완료 후 Cursor 재시작
```

### 🔍 **MCP 설정 확인 (30초)**

```bash
# MCP 서버 상태 확인
npm run mcp:status

# 다음과 같은 출력이 나와야 함:
# ✅ filesystem: 활성화
# ✅ memory: 활성화
# ✅ duckduckgo-search: 활성화
# ✅ sequential-thinking: 활성화
# ✅ openmanager-local: 활성화 (포트 3100)
```

### 🎯 **MCP 프로필 선택 (30초)**

```bash
# AI 중심 개발용 (권장)
npm run mcp:profile:ai-focused

# 또는 전체 개발 환경용
npm run mcp:profile:full-dev

# 현재 프로필 확인
npm run mcp:profile:status
```

---

## 🧪 3단계: 테스트 환경 확인 (1분)

### 🏃 **빠른 검증 실행**

```bash
# 전체 시스템 빠른 검증 (30초)
npm run validate:quick

# 예상 결과:
# ✅ TypeScript 타입 체크 통과
# ✅ ESLint 검사 통과
# ✅ MCP 연결 확인 완료
```

### 🎯 **개발 서버 시작**

```bash
# 개발 서버 시작
npm run dev

# 브라우저에서 확인
# http://localhost:3000 접속
# AI 사이드바 토글 버튼 확인 (우측 상단)
```

### 📊 **실제 테스트 실행 (선택사항)**

```bash
# 단위 테스트 실행 (OpenManager Vibe v5: 11개 통과)
npm run test:unit

# 통합 테스트 실행 (OpenManager Vibe v5: 7개 통과)
npm run test:integration

# 전체 테스트 실행 (OpenManager Vibe v5: 92% 성공률)
npm run test:all
```

---

## 🎨 4단계: 바이브 코딩 시작 (1분)

### 💬 **첫 번째 AI 협업**

#### **Cursor에서 AI 채팅 시작**

```
💬 "안녕 AI! OpenManager Vibe v5 프로젝트를 분석해줘.
현재 구조와 주요 기능들을 요약해줘."
```

**예상 AI 응답**:

- 프로젝트 구조 분석 완료
- 주요 컴포넌트 식별
- AI 사이드바 시스템 설명
- 테스트 현황 보고

#### **MCP 기능 테스트**

```
💬 "src/components 폴더의 파일들을 분석해서
가장 자주 사용되는 컴포넌트 5개를 찾아줘."
```

**예상 AI 응답**:

- 파일 시스템 접근 성공
- 컴포넌트 사용 빈도 분석
- 최적화 제안 제공

#### **실시간 코딩 협업**

```
💬 "AI 사이드바 컴포넌트의 성능을 개선하고 싶어.
현재 코드를 분석해서 최적화 방안을 제시해줘."
```

**예상 AI 응답**:

- 현재 코드 분석
- 성능 병목 지점 식별
- React.memo, useMemo 등 최적화 제안
- 단계별 구현 계획 제시

---

## 🎯 성공 확인 체크리스트

### ✅ **환경 설정 완료**

```bash
# 모든 항목이 ✅ 상태여야 함
□ Node.js 18.17.0+ 설치됨
□ Cursor IDE 설치됨
□ 프로젝트 클론 완료
□ npm install 성공
□ MCP 설정 완료 (6개 서버)
□ 개발 서버 실행 중 (포트 3000)
```

### ✅ **AI 협업 준비 완료**

```bash
# 모든 항목이 ✅ 상태여야 함
□ Cursor에서 AI 채팅 가능
□ MCP 서버 연결 확인
□ 파일 시스템 접근 가능
□ 웹 검색 기능 작동
□ 메모리 시스템 활성화
□ 첫 AI 대화 성공
```

### ✅ **개발 환경 검증 완료**

```bash
# 모든 항목이 ✅ 상태여야 함
□ TypeScript 타입 체크 통과
□ ESLint 검사 통과
□ 테스트 실행 가능
□ 빌드 성공 확인
□ AI 사이드바 작동 확인
```

---

## 📚 다음 단계

### 🔥 **즉시 시작할 수 있는 AI 협업 미션**

#### **🥉 초급 미션 (10분)**

```
💬 "AI야, 간단한 카운터 컴포넌트를 만들어줘.
증가, 감소, 리셋 기능이 있어야 해."
```

#### **🥈 중급 미션 (30분)**

```
💬 "AI야, 실시간 서버 상태를 보여주는
대시보드 카드 컴포넌트를 만들어보자."
```

#### **🥇 고급 미션 (1시간)**

```
💬 "AI야, AI 사이드바의 성능을 최적화하고
새로운 기능을 추가해보자."
```

### 🚀 **추가 학습 리소스**

- [📖 바이브 코딩 완전 가이드](./VIBE_CODING_COMPLETE_GUIDE.md)
- [🤖 MCP 완전 가이드](../development/docs/guides/MCP_완전_가이드.md)
- [🛠️ 개발 완전 가이드](../development/docs/guides/개발_완전_가이드.md)

### 🎯 **고급 기능 활성화**

```bash
# AI 중심 MCP 프로필로 전환
npm run mcp:profile:ai-focused

# 성능 모니터링 시작
npm run generate:metrics

# E2E 테스트 환경 설정
npm run test:e2e:install
```

### 🔧 **개발 도구 마스터하기**

```bash
# 158개 npm 스크립트 중 핵심 스크립트
npm run validate:quick           # 빠른 검증 (매일 사용)
npm run test:quality             # 코드 품질 검사
npm run build:analyze            # 번들 크기 분석
npm run deploy:safe              # 안전한 배포
npm run perf:vitals              # 성능 측정
```

---

## ❓ 문제 해결

### 🚨 **MCP 연결 안됨**

```bash
# 1. MCP 상태 확인
npm run mcp:status

# 2. MCP 재설정
npm run mcp:perfect:setup

# 3. Cursor 완전 재시작
# 4. 상태 재확인
npm run mcp:status
```

### 🐛 **테스트 실패**

```bash
# 1. 의존성 재설치
npm ci

# 2. 캐시 정리
npm run clean

# 3. 테스트 재실행
npm run test:unit
```

### 🔧 **개발 서버 에러**

```bash
# 1. 포트 정리
npm run clean:ports

# 2. 서버 재시작
npm run dev:clean

# 3. 전체 검증
npm run validate:all
```

### 💡 **AI 응답이 느림**

```bash
# 1. MCP 프로필 최적화
npm run mcp:profile:ai-focused

# 2. 메모리 정리
# Cursor 재시작

# 3. 연결 상태 확인
npm run mcp:status
```

---

## 🎉 성공! 이제 바이브 코딩을 시작하세요

### 🚀 **첫 번째 실전 프로젝트**

```bash
# 새 기능 브랜치 생성
git checkout -b feature/my-first-vibe-coding

# AI와 함께 기능 계획 수립
💬 "AI야, [새 기능명] 기능을 구현하기 위한
단계별 계획을 세워보자."

# 바이브 코딩 시작!
# - 30분 개발 + 5분 AI 검토 사이클
# - 1시간마다 npm run validate:quick
# - 완료 후 npm run deploy:safe
```

### 📈 **성과 측정하기**

```bash
# 일일 성과 측정
npm run generate:metrics

# 개발 속도 확인
git log --since="1 day ago" --oneline | wc -l

# 코드 품질 확인
npm run test:quality
```

### 🎯 **목표 설정**

**1주일 목표**:

- AI와 매일 2시간 이상 협업
- 간단한 기능 5개 구현
- 테스트 커버리지 80% 달성

**1개월 목표**:

- 복잡한 기능 10개 구현
- 개발 속도 200% 향상
- AI 협업 패턴 마스터

**3개월 목표**:

- 대규모 프로젝트 완성
- 개발 속도 300% 향상
- 팀 바이브 코딩 리더

---

_바이브 코딩으로 개발의 새로운 차원을 경험하세요! 🚀_

_최종 업데이트: 2025년 6월 10일_  
_OpenManager Vibe v5 개발팀 - 실제 5분 설정 검증 완료_
