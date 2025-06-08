# 🚀 OpenManager Vibe v5 - MCP 개발 도구 완전 가이드

## 📋 목차
1. [개요](#개요)
2. [설치된 MCP 도구들](#설치된-mcp-도구들)
3. [빠른 시작](#빠른-시작)
4. [Magic MCP 사용법](#magic-mcp-사용법)
5. [Browser Tools MCP 사용법](#browser-tools-mcp-사용법)
6. [고급 기능들](#고급-기능들)
7. [문제 해결](#문제-해결)
8. [팁과 트릭](#팁과-트릭)

## 개요

이 프로젝트는 **Cursor AI**와 **Model Context Protocol (MCP)**를 활용한 차세대 개발 환경을 제공합니다. TypeScript, React, Next.js 개발에 특화된 강력한 AI 도구들이 준비되어 있습니다.

### 🎯 주요 장점
- **AI 기반 UI 컴포넌트 생성** - 자연어로 React 컴포넌트 생성
- **실시간 브라우저 디버깅** - 콘솔 로그, 네트워크 분석, 스크린샷
- **TypeScript 코드 분석** - 지능적인 코드 검토 및 최적화 제안
- **Git 통합** - AI가 커밋 히스토리 분석 및 브랜치 관리
- **배포 자동화** - Vercel 통합으로 원클릭 배포

## 설치된 MCP 도구들

### 🎨 **Magic MCP** (`@21st-dev/magic`)
- **기능**: AI 기반 UI 컴포넌트 생성
- **지원**: React, Next.js, TypeScript, Tailwind CSS
- **특징**: v0.dev와 유사한 컴포넌트 생성 능력

### 🌐 **Browser Tools MCP** (`@agentdeskai/browser-tools-mcp`)
- **기능**: 브라우저 실시간 모니터링
- **특징**: 콘솔 로그, 네트워크 추적, 스크린샷, SEO 분석
- **요구사항**: Chrome 확장 프로그램 설치 필요

### 📁 **파일시스템 MCP** (`@modelcontextprotocol/server-filesystem`)
- **기능**: 프로젝트 파일 분석 및 관리
- **범위**: `./src`, `./docs` 디렉토리
- **지원**: TypeScript, JavaScript, React 파일 특화



### 🔍 **DuckDuckGo Search MCP**
- **기능**: 웹 검색 및 최신 정보 조회
- **활용**: 최신 기술 문서, API 참조, 오류 해결

### 🧠 **Sequential Thinking MCP**
- **기능**: 단계별 문제 해결 및 분석
- **특징**: 복잡한 개발 문제를 체계적으로 접근

### 🔧 **Cursor MCP Installer**
- **기능**: 추가 MCP 서버 설치 및 관리
- **특징**: GUI 기반 MCP 서버 관리

### ☁️ **Vercel MCP** (추가 설정 필요)
- **기능**: Vercel 배포 및 관리
- **특징**: 자동 배포, 도메인 관리, 환경 변수 설정

## 빠른 시작

### 1️⃣ 기본 설정 (이미 완료됨)
```bash
npm run mcp:setup-dev-tools
```

### 2️⃣ Cursor 재시작
**중요**: MCP 설정이 적용되도록 Cursor를 완전히 재시작하세요.

### 3️⃣ Agent 모드 활성화
1. Cursor에서 `Ctrl+L` (또는 `Cmd+L`)
2. "Agent" 모드 선택
3. 이제 MCP 도구들을 사용할 수 있습니다!

## Magic MCP 사용법

### 🔑 API 키 설정
1. [21st.dev API Access](https://21st.dev/api-access) 방문
2. 무료 계정 생성 및 API 키 발급
3. `mcp-cursor.json` 파일에서 `YOUR_API_KEY_HERE`를 실제 키로 교체

### 💡 사용 예시

#### React 컴포넌트 생성
```
/ui 다크 테마를 지원하는 모던한 버튼 컴포넌트를 만들어줘. 호버 애니메이션과 로딩 상태도 포함해줘.
```

#### 폼 컴포넌트 생성
```
/ui 사용자 등록 폼을 만들어줘. 이메일, 비밀번호, 비밀번호 확인 필드가 있고, 유효성 검사와 에러 메시지 표시 기능이 필요해.
```

#### 대시보드 레이아웃
```
/ui 관리자 대시보드 레이아웃을 만들어줘. 사이드바, 헤더, 메인 컨텐츠 영역이 있고 반응형이어야 해.
```

### 🎨 생성된 컴포넌트 활용
- 자동으로 TypeScript 타입 정의 포함
- Tailwind CSS 스타일링 적용
- 현재 프로젝트 구조에 맞게 자동 조정

## Browser Tools MCP 사용법

### 🔧 Chrome 확장 프로그램 설치
1. [BrowserTools MCP 확장 프로그램](https://github.com/AgentDeskAI/browser-tools-mcp) 다운로드
2. Chrome에서 개발자 모드 활성화
3. 확장 프로그램 로드
4. 개발자 도구에서 "BrowserToolsMCP" 패널 확인

### 🌐 브라우저 서버 실행
```bash
npx @agentdeskai/browser-tools-server@latest
```

### 💡 사용 예시

#### 콘솔 로그 분석
```
현재 페이지의 콘솔 에러를 분석하고 해결 방법을 제안해줘
```

#### 네트워크 성능 분석
```
이 페이지의 네트워크 요청을 분석해서 성능 최적화 방안을 알려줘
```

#### SEO 분석
```
현재 페이지의 SEO를 분석하고 개선점을 제안해줘
```

#### 스크린샷 및 UI 분석
```
현재 페이지의 스크린샷을 찍고 UI/UX 개선 사항을 분석해줘
```

## 고급 기능들

### 🔄 코드 리팩토링
```
이 TypeScript 파일들을 분석해서 코드 품질을 개선해줘. Clean Code 원칙을 적용해서 리팩토링 제안을 해줘.
```

### 📊 프로젝트 분석
```
현재 프로젝트의 구조를 분석하고 개선점을 제안해줘. 특히 성능과 유지보수성 관점에서 봐줘.
```

### 🚀 배포 최적화
```
Vercel 배포를 위한 최적화 방안을 분석해줘. 번들 사이즈, 성능, SEO를 고려해서.
```

### 🔍 버그 진단
```
현재 발생하고 있는 오류를 Git 커밋 히스토리와 브라우저 로그를 종합해서 분석해줘.
```

## 문제 해결

### ❌ MCP 도구가 인식되지 않는 경우
1. Cursor 완전 재시작
2. `~/.cursor/mcp.json` 파일 확인
3. 설정 재적용: `npm run mcp:setup-dev-tools`

### ❌ Magic MCP API 오류
1. API 키 확인 (mcp-cursor.json)
2. 21st.dev 계정 상태 확인
3. 일일 사용량 제한 확인 (무료: 5회/일)

### ❌ Browser Tools 연결 실패
1. Chrome 확장 프로그램 설치 확인
2. 브라우저 서버 실행 확인
3. 방화벽 설정 확인 (포트 3100)



## 팁과 트릭

### 🎯 효과적인 프롬프트 작성

#### Magic MCP용 프롬프트
- 구체적인 요구사항 명시
- 원하는 스타일링 방식 설명
- 기능적 요구사항과 UI 요구사항 분리

**좋은 예시:**
```
/ui 다음 요구사항을 만족하는 할 일 목록 컴포넌트를 만들어줘:
- 할 일 추가/삭제/완료 처리 기능
- 드래그 앤 드롭으로 순서 변경
- 다크/라이트 테마 지원
- TypeScript 인터페이스 포함
- Tailwind CSS 사용
```

#### Browser Tools용 프롬프트
- 분석하고 싶은 특정 영역 명시
- 원하는 분석 깊이 설명

**좋은 예시:**
```
현재 Next.js 앱의 성능을 종합 분석해줘:
1. 번들 사이즈 최적화 방안
2. 런타임 성능 이슈
3. SEO 개선점
4. 접근성 문제점
브라우저 네트워크 탭과 콘솔 로그를 참고해서 구체적인 해결책을 제시해줘.
```

### 🔄 워크플로 최적화

#### 1️⃣ 컴포넌트 개발 워크플로
1. Magic MCP로 기본 컴포넌트 생성
2. 파일시스템 MCP로 기존 코드와 통합 검토
3. Browser Tools로 실제 렌더링 확인

#### 2️⃣ 디버깅 워크플로
1. Browser Tools로 에러 로그 수집
2. Sequential Thinking MCP로 문제 분석
3. 파일시스템 MCP로 관련 코드 검토

#### 3️⃣ 배포 워크플로
1. 파일시스템 MCP로 코드 품질 검토
2. Browser Tools로 성능 테스트
4. Vercel MCP로 배포 실행

### 📚 학습 리소스

#### MCP 관련
- [Model Context Protocol 공식 문서](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

#### 도구별 문서
- [Magic MCP 가이드](https://21st.dev/magic)
- [Browser Tools MCP 문서](https://github.com/AgentDeskAI/browser-tools-mcp)
- [Cursor MCP 통합 가이드](https://docs.cursor.com/context/model-context-protocol)

### 🎉 성공 사례

#### 빠른 프로토타이핑
```
"사용자 대시보드의 프로토타입을 30분 만에 완성했습니다. Magic MCP로 컴포넌트들을 생성하고, Browser Tools로 실시간 테스트하며 완성도를 높였습니다."
```

#### 버그 해결
```
"프로덕션 버그를 Browser Tools MCP를 활용해서 15분 만에 원인을 찾고 해결했습니다. 브라우저 로그를 AI가 분석해서 정확한 원인을 파악했어요."
```

---

## 🚀 개발을 시작하세요!

이제 모든 준비가 완료되었습니다. Cursor에서 Agent 모드를 활성화하고 위의 예시들을 참고해서 개발을 시작해보세요!

### 💡 추가 도움이 필요하시면:
1. 이 문서의 [문제 해결](#문제-해결) 섹션 확인
2. 각 도구의 공식 문서 참조
3. GitHub Issues를 통한 문의

**즐거운 개발 되세요! 🎉** 