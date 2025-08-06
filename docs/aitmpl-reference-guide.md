# aitmpl.com 템플릿 시스템 참조 가이드

## 📋 개요

**Claude Code Templates**는 Claude Code 사용자를 위한 커뮤니티 기반 오픈소스 템플릿 시스템입니다.

- **웹사이트**: https://aitmpl.com
- **문서**: https://docs.aitmpl.com
- **GitHub**: https://github.com/davila7/claude-code-templates
- **NPM 패키지**: `claude-code-templates`
- **라이선스**: MIT

### 제공 규모
- **100+ 에이전트**: 다양한 전문 도메인 AI 에이전트
- **159+ 명령어**: 커스텀 슬래시 명령어
- **23+ MCP**: Model Context Protocol 서버 통합
- **14+ 템플릿**: 프레임워크별 프로젝트 템플릿

## 🛠️ 설치 및 사용

### 글로벌 설치
```bash
npm install -g claude-code-templates
```

### 직접 실행 (npx)
```bash
# 대화형 설정
npx claude-code-templates@latest

# 애널리틱스 대시보드
npx claude-code-templates@latest --analytics

# Chat Web UI
npx claude-code-templates@latest --chats

# 시스템 헬스 체크
npx claude-code-templates@latest --health-check
```

## 🤖 에이전트 템플릿

### 에이전트 컬렉션
- **wshobson/agents**: 48개 전문 에이전트 모음
- **커뮤니티 기여**: 지속적으로 확장 중

### 에이전트 구조
```markdown
# Agent Name

## Role
에이전트의 역할과 전문 분야 정의

## Tools
사용 가능한 도구 목록

## Instructions
상세한 작업 지침

## Collaboration
다른 에이전트와의 협업 방식
```

### 주요 에이전트 카테고리
1. **코드 리뷰**: 코드 품질 분석 전문
2. **테스트**: 테스트 작성 및 자동화
3. **문서화**: 문서 생성 및 관리
4. **디버깅**: 오류 분석 및 해결
5. **아키텍처**: 시스템 설계 및 구조화

## 🔌 MCP (Model Context Protocol) 템플릿

### MCP 서버 유형
1. **파일 시스템**: 파일 읽기/쓰기 작업
2. **데이터베이스**: DB 연결 및 쿼리
3. **API 통합**: 외부 서비스 연동
4. **모니터링**: 시스템 상태 추적
5. **배포**: CI/CD 파이프라인

### MCP 설정 패턴
```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@package/name@latest"],
      "env": {
        "API_KEY": "${API_KEY}"
      }
    }
  }
}
```

## 💡 명령어 템플릿

### awesome-claude-code 컬렉션
21개 유용한 슬래시 명령어 모음

### 주요 명령어 예시
- `/generate-tests`: 테스트 코드 자동 생성
- `/check-file`: 파일 검증 및 분석
- `/refactor`: 코드 리팩토링
- `/document`: 문서 자동 생성
- `/review`: 코드 리뷰 수행

### 명령어 구조
```typescript
{
  name: string;
  description: string;
  parameters: {
    [key: string]: {
      type: string;
      description: string;
      required: boolean;
    }
  };
  handler: (params) => Promise<Result>;
}
```

## 📦 프레임워크 템플릿

### Frontend 프레임워크
- **React**: CRA, Next.js, Vite 설정
- **Vue**: Vue 3, Nuxt 3 설정
- **Angular**: Angular 15+ 설정
- **Svelte**: SvelteKit 설정

### Backend 프레임워크
- **Node.js**: Express, Fastify, NestJS
- **Python**: Django, FastAPI, Flask
- **Ruby**: Rails, Sinatra
- **Go**: Gin, Echo, Fiber

### 템플릿 구성 요소
```
template/
├── CLAUDE.md           # Claude Code 프로젝트 지침
├── .claude/            # Claude 설정 디렉토리
│   ├── settings.json   # 프로젝트 설정
│   ├── agents/         # 커스텀 에이전트
│   └── commands/       # 커스텀 명령어
├── scripts/            # 자동화 스크립트
└── docs/               # 프로젝트 문서
```

## 📊 도구 및 기능

### 실시간 애널리틱스
```bash
npx claude-code-templates@latest --analytics
```
- 세션 모니터링
- 성능 메트릭
- 사용 패턴 분석
- 에러 추적

### Chat Web UI
```bash
npx claude-code-templates@latest --chats
```
- 웹 기반 채팅 인터페이스
- 대화 히스토리
- 멀티 세션 지원

### 시스템 헬스 체크
```bash
npx claude-code-templates@latest --health-check
```
- Claude Code 상태 확인
- MCP 서버 연결 검증
- 설정 파일 검증

## 🔄 자동 프로젝트 설정

### Smart Project Setup
1. **프레임워크 자동 감지**
   - package.json 분석
   - 프로젝트 구조 파악
   - 의존성 확인

2. **최적화된 설정 생성**
   - 프레임워크별 CLAUDE.md
   - 관련 에이전트 추가
   - 유용한 명령어 설정

3. **베스트 프랙티스 적용**
   - 코드 스타일 가이드
   - 테스트 전략
   - 문서화 규칙

## 📈 커뮤니티 및 기여

### 기여 방법
1. GitHub 저장소 Fork
2. 새 템플릿/에이전트 추가
3. Pull Request 제출
4. 리뷰 및 머지

### 커뮤니티 리소스
- GitHub Issues: 버그 리포트 및 기능 요청
- Discussions: 아이디어 공유 및 토론
- Discord: 실시간 커뮤니티 지원 (계획 중)

## 🔗 관련 프로젝트

### 공식 Claude Code
- **GitHub**: https://github.com/anthropics/claude-code
- **문서**: https://docs.anthropic.com/en/docs/claude-code

### 연관 프로젝트
- **awesome-claude-code**: 유용한 리소스 모음
- **wshobson/agents**: 에이전트 컬렉션

## 📌 주요 특징 요약

| 특징 | 설명 |
|------|------|
| **오픈소스** | MIT 라이선스, 자유로운 사용 및 수정 |
| **커뮤니티 주도** | 지속적인 업데이트 및 개선 |
| **다양한 템플릿** | 14+ 프레임워크 지원 |
| **실시간 모니터링** | 애널리틱스 대시보드 제공 |
| **쉬운 설치** | npx 한 줄로 즉시 사용 |
| **확장 가능** | 커스텀 에이전트/명령어 추가 가능 |

---

*마지막 업데이트: 2025-08-06*
*참조 출처: aitmpl.com, GitHub 저장소, npm 패키지 정보*