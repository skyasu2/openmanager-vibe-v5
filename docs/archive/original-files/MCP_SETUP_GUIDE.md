# 🚀 OpenManager v5 - 프로젝트 전용 MCP 설정 가이드

## 📋 개요

`openmanager-vibe-v5` 프로젝트는 **프로젝트 전용 MCP 설정**을 사용하여 글로벌 MCP 설정과 격리된 환경에서 실행됩니다.

## 🎯 주요 특징

✅ **프로젝트 격리**: 글로벌 설정과 충돌 없이 프로젝트에만 적용  
✅ **깃 커밋 가능**: 설정을 버전 관리하여 협업에 유리  
✅ **확장성**: 프로젝트별로 다른 MCP 서버 구성 가능  
✅ **중복 실행 방지**: 동일 MCP 서버 중복 실행 문제 해결  

---

## 📁 파일 구조

```
openmanager-vibe-v5/
├── cursor.mcp.json              ✅ 프로젝트 전용 MCP 설정
├── mcp-server/
│   └── server.js               🏠 로컬 MCP 서버
├── scripts/
│   └── mcp-local-manager.js    🔧 MCP 관리 스크립트
└── package.json                📦 MCP CLI 명령어
```

---

## ⚙️ 설정된 MCP 서버

### 🏠 기본 MCP 서버

| MCP 서버 | 설명 | 포트 |
|---------|------|------|
| `openmanager-local` | 🏠 로컬 OpenManager MCP 서버 | 3100 |
| `filesystem` | 📁 프로젝트 파일시스템 접근 | - |
| `git` | 🔗 Git 저장소 관리 | - |
| `duckduckgo-search` | 🔍 실시간 웹 검색 | - |
| `sequential-thinking` | 🧠 단계별 사고 및 문제 해결 | - |

### ✨ TypeScript 개발 특화 MCP 서버

| MCP 서버 | 설명 | 주요 기능 |
|---------|------|----------|
| `magic-ui` | ✨ Magic MCP - AI 기반 UI 생성 | `/ui 모던한 버튼 만들어줘` |
| `shadcn-ui` | 🎨 Shadcn/UI 컴포넌트 문서 | 컴포넌트 예제 및 문서 |
| `cursor-mcp-installer` | 📦 MCP 서버 관리 | 자동 설치 및 설정 |

---

## 🚀 사용 방법

### 1. 프로젝트 전용 MCP 설정 활성화

```bash
# MCP 설정 검증 및 Cursor 가이드
npm run cursor:mcp
```

### 2. 로컬 MCP 서버 관리

```bash
# MCP 서버 개발 모드 실행
npm run mcp:dev

# 로컬 MCP 서버 상태 확인
npm run mcp:local:status

# 백그라운드에서 MCP 서버 시작
npm run mcp:local:start

# MCP 서버 재시작
npm run mcp:reset
```

### 3. 설정 관리

```bash
# cursor.mcp.json 유효성 검사
npm run mcp:cursor:validate

# Cursor 설정 가이드 출력
npm run mcp:cursor:guide

# 전체 도움말
npm run mcp:help

# TypeScript 개발 전용 명령어
npm run mcp:list
npm run mcp:magic:setup
npm run mcp:typescript
```

---

## 🔧 Cursor 설정 방법

### ✅ 자동 인식 (권장)

1. `cursor.mcp.json` 파일이 프로젝트 루트에 있는지 확인
2. **Cursor를 완전히 종료**
3. **Cursor 재시작**
4. Cursor가 자동으로 `cursor.mcp.json`을 인식

### 🔧 수동 설정 (선택사항)

Cursor Settings에서 MCP 설정 경로를 명시적으로 지정:

```json
{
  "mcp.configPath": "./cursor.mcp.json"
}
```

---

## 🧠 글로벌 vs 로컬 MCP 설정

| 설정 파일 | 용도 | 권장 여부 | 설명 |
|---------|------|-----------|------|
| `.cursor/mcp.json` | 전역 설정 | ❌ 지양 | 모든 프로젝트에 영향 |
| `cursor.mcp.json` | 프로젝트 전용 | ✅ 추천 | 현재 프로젝트만 |

---

## 🔍 트러블슈팅

### ❌ MCP 서버가 인식되지 않는 경우

```bash
# 1. 설정 검증
npm run mcp:cursor:validate

# 2. Cursor 완전히 종료 후 재시작
# 3. 로컬 MCP 서버 상태 확인
npm run mcp:local:status
```

### ❌ 포트 충돌 문제

```bash
# 기존 프로세스 정리
npm run mcp:reset

# 또는 수동으로 포트 3100 정리
taskkill /f /fi "PID eq $(netstat -ano | findstr :3100 | awk '{print $5}' | head -1)"
```

### ❌ 글로벌 MCP와 충돌

```bash
# 글로벌 MCP 설정 비활성화 (임시)
mv ~/.cursor/mcp.json ~/.cursor/mcp.json.backup

# Cursor 재시작 후 로컬 설정만 사용
```

---

## 📦 개발 워크플로우

### 1. 새 기능 개발 시

```bash
# 1. MCP 서버 시작
npm run mcp:dev

# 2. 개발 서버 시작
npm run dev

# 3. Cursor에서 MCP 기능 활용
```

### 2. 협업 시

```bash
# 팀원이 프로젝트 클론 후
git clone <repository>
cd openmanager-vibe-v5

# MCP 설정 검증 및 안내
npm run cursor:mcp

# 의존성 설치
npm install

# 개발 시작
npm run dev
```

---

## 🎯 MCP 서버별 세부 기능

### 🏠 기본 MCP 서버

#### 🏠 `openmanager-local`
- 서버 헬스체크
- 시스템 상태 모니터링
- 프로젝트별 컨텍스트 제공

#### 📁 `filesystem`
- `./src`, `./docs`, `./mcp-server` 접근
- TypeScript/React 코드 분석
- 파일 검색 및 수정

#### 🔗 `git`
- 현재 프로젝트 Git 저장소 분석
- 커밋 히스토리 조회
- 브랜치 관리

#### 🔍 `duckduckgo-search`
- 실시간 웹 검색
- 기술 문서 검색
- 최신 정보 조회

#### 🧠 `sequential-thinking`
- 단계별 문제 해결
- 복잡한 로직 분석
- 의사결정 지원

### ✨ TypeScript 개발 특화 MCP 서버

#### ✨ `magic-ui` - Magic MCP
- **AI 기반 UI 컴포넌트 생성**: `/ui 모던한 버튼 만들어줘`
- **React/Next.js 지원**: TypeScript + Tailwind CSS
- **실시간 미리보기**: 컴포넌트 즉시 확인
- **21st.dev 라이브러리 통합**: 프로 품질 컴포넌트
- **사용법**: 
  ```
  /ui 현대적인 로그인 폼 만들어줘
  /ui 반응형 네비게이션 바 컴포넌트
  /ui 다크모드 지원하는 카드 컴포넌트
  ```

#### 🎨 `shadcn-ui` - Shadcn/UI 문서
- **컴포넌트 문서 접근**: 모든 shadcn/ui 컴포넌트 정보
- **사용 예제 제공**: 실제 구현 코드
- **설치 가이드**: 컴포넌트별 설치 방법
- **Props 및 변형**: 상세한 API 문서

#### 📦 `cursor-mcp-installer` - MCP 관리
- **자동 MCP 설치**: npm 패키지 및 저장소
- **설정 관리**: Cursor 설정 자동 업데이트
- **로컬 서버 지원**: 커스텀 MCP 서버 설치
- **사용법**:
  ```
  "MCP 서버 설치해줘: @modelcontextprotocol/server-xxx"
  "로컬 MCP 서버 설정해줘: /path/to/server"
  ```

---

## ✨ Magic MCP 설정 방법

Magic MCP는 API 키가 필요합니다:

### 1. API 키 생성
1. https://21st.dev/magic 방문
2. 계정 생성 및 API 키 생성

### 2. 환경변수 설정

#### Windows (PowerShell)
```powershell
$env:API_KEY="your-api-key-here"
```

#### macOS/Linux
```bash
export API_KEY="your-api-key-here"
```

#### .env 파일 (권장)
프로젝트 루트에 `.env` 파일 생성:
```
API_KEY=your-api-key-here
```

### 3. Magic MCP 사용법
```
/ui 모던한 버튼 컴포넌트 만들어줘
/ui 반응형 카드 레이아웃 생성해줘
/ui 다크모드 지원하는 네비게이션 바
/ui 로그인 폼 컴포넌트 (유효성 검사 포함)
```

### 4. 설정 확인
```bash
npm run mcp:magic:setup
```

---

## 📞 지원

MCP 설정 관련 문제가 발생하면:

1. **도움말 확인**: `npm run mcp:help`
2. **설정 검증**: `npm run cursor:mcp`
3. **서버 상태 확인**: `npm run mcp:local:status`
4. **TypeScript 전용**: `npm run mcp:typescript`

---

## 🔗 관련 링크

- [Model Context Protocol 공식 문서](https://modelcontextprotocol.io)
- [Cursor MCP 설정 가이드](https://cursor.sh/docs/mcp)
- [OpenManager v5 프로젝트 문서](./README.md) 