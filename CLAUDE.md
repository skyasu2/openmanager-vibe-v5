# CLAUDE.md

**OpenManager VIBE** - Claude Code 프로젝트 가이드

## 🚀 빠른 시작

```bash
npm run dev              # 개발 서버
npm run validate:all     # 전체 검증 (린트+타입+테스트)
claude --version         # 버전 확인 (v1.0.112)
```

**아키텍처**: Next.js 15+ + TypeScript (strict) + Vercel + Supabase + WSL 2

## 🎯 핵심 워크플로우

1. **타입 우선 개발**: 타입 정의 → 구현 → 테스트
2. **AI 검증**: `Task verification-specialist "파일경로"`
3. **커밋**: 이모지 + 간결한 메시지 + 사이드 이펙트 분석 필수

## 🤖 AI 도구 활용

### MCP 서버 (9개 통합 - 27% 토큰 절약)
- **memory**: Knowledge Graph 저장
- **supabase**: PostgreSQL 쿼리 
- **playwright**: 브라우저 자동화
- **vercel**: 배포 관리 (신규 추가)

### 핵심 서브에이전트
- `Task verification-specialist "파일"` - 자동 코드 검증 
- `Task central-supervisor "복잡작업"` - 작업 자동 분해
- `Task codex-specialist "요청"` - GPT-5 외부 연동

## 📐 필수 규칙

1. **TypeScript**: any 금지, strict mode 필수
2. **테스트**: 커버리지 70%+, TDD 적용
3. **파일 크기**: 500줄 권장, 1500줄 초과 시 분리
4. **사이드 이펙트 분석**: 모든 수정/삭제/개발 시 영향 분석 필수

## 🔧 트러블슈팅

- **MCP 오류**: `claude mcp status`
- **서브에이전트 실패**: WSL 환경 점검
- **타입 오류**: strict 설정 확인
- **배포 실패**: `npm run build` 로컬 테스트

## 📚 상세 문서

- [AI 시스템 완전 가이드](docs/AI-SYSTEMS.md)
- [시스템 아키텍처](docs/system-architecture.md)  
- [빠른 시작](docs/QUICK-START.md)

---

💡 **핵심 원칙**: Type-First + TDD + 이모지 커밋 + 사이드 이펙트 필수 고려