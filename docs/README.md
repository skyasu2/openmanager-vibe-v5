# 📚 OpenManager VIBE v5 문서

> **JBGE 원칙 기반 체계적 문서 관리** - 찾기 쉽고, 유지보수 쉬운 문서  
> **최신 업데이트**: 2025-08-15 | 루트 파일 6개 제한 달성 ✅

## 🎯 문서 철학

**"Just Barely Good Enough (JBGE) + 체계적 분류"**

- **루트 레벨**: 핵심 가이드 5개 (JBGE 6개 제한 달성)
- **기술 문서**: Claude/AI 참조용 세부 구현
- **가이드**: 단계별 설정 및 사용법
- **AI 도구**: Claude/Gemini/Qwen CLI 통합 활용
- **아카이브**: 날짜별 보관 (중복 제거)

## 🚀 핵심 문서 (루트 레벨)

| 문서 | 설명 | 소요 시간 |
|------|------|-----------|
| **[⚡ 빠른 시작](./QUICK-START.md)** | 5분 내 개발 환경 완전 설정 | 5분 |
| **[🏗️ 시스템 아키텍처](./system-architecture.md)** | 전체 아키텍처와 기술 명세 | 15분 |
| **[🔌 MCP 가이드](./MCP-GUIDE.md)** | 11개 MCP 서버 완전 활용법 | 15분 |
| **[🤖 AI 시스템](./AI-SYSTEMS.md)** | Claude + Gemini + Qwen 협업 | 15분 |
| **[🚨 문제 해결](./TROUBLESHOOTING.md)** | 주요 문제들의 빠른 해결법 | 상황별 |

## 📂 체계적 문서 구조

### 📁 technical/ - Claude 참조용 기술 문서
```
technical/
├── mcp/                    # MCP 서버 관련 (16 문서, 중복 제거)
│   ├── mcp-development-guide-2025.md         # 통합 가이드
│   ├── mcp-best-practices-guide.md
│   ├── tavily-mcp-advanced-guide.md
│   └── ...
├── ai-engines/             # AI 시스템 세부 구현  
│   ├── ai-system-unified-guide.md            # AI 통합 가이드
│   ├── sub-agents-comprehensive-guide.md
│   └── ...
├── vercel-deployment/      # Vercel 배포 최적화
├── gcp-integration/        # GCP 서비스 통합
└── database/               # Supabase 최적화
```

### 📁 guides/ - 단계별 설정 가이드
```
guides/
├── setup/                  # 환경 설정
│   ├── supabase-oauth-setup-guide.md
│   ├── github-oauth-setup.md
│   ├── dev-mock-setup-guide.md
│   └── ...
├── development/            # 개발 워크플로우 (12 문서)
├── security/               # 보안 설정 (4 문서)
├── performance/            # 성능 최적화 (5 문서)
└── testing/                # 테스트 가이드 (8 문서)
```

### 📁 api/ - API 문서
```
api/
├── endpoints/              # API 엔드포인트 명세
├── schemas/                # 데이터 스키마 정의
└── authentication/         # 인증 방법
```

### 📁 ai-tools/ - AI 도구 통합 🆕
```
ai-tools/
├── qwen-cli-guide.md      # Qwen Code CLI 활용법 (루트에서 이동)
├── gemini-cli-guide.md    # Gemini CLI 연동
└── ai-tools-comparison.md # AI 도구 비교 분석
```

### 📁 archive/ - 아카이브
```
archive/
├── 2025-08-15/            # 오늘 정리된 문서들
│   ├── changelog-archive.md        # 루트에서 이동
│   └── duplicate-mcp-docs/         # 중복 MCP 문서들
├── 2025-08-12/            # 이전 분석 리포트들
├── mcp-legacy/            # 이전 MCP 설정 문서
└── wsl-legacy/            # WSL 관련 레거시 문서
```

## 📊 현재 상태

### 프로젝트 지표

| 지표                 | 현재                             | 목표    |
| -------------------- | -------------------------------- | ------- |
| **응답 시간**        | 152ms                            | < 200ms |
| **가동률**           | 99.95%                           | 99.9%+  |
| **무료 티어 사용률** | Vercel 30%, GCP 15%, Supabase 3% | < 80%   |
| **코드 품질**        | 400개 문제                       | < 100개 |

### 기술 스택

- **Frontend**: Next.js 14.2.4 + React 18.2.0 + TypeScript
- **Backend**: Vercel Edge Runtime + GCP Functions (Python 3.11)
- **Database**: Supabase PostgreSQL + pgvector
- **Cache**: Upstash Memory Cache
- **AI**: Google AI + Supabase RAG

## 💡 문서 활용 팁

### JBGE 원칙 (Just Barely Good Enough)
1. **루트 문서**: 핵심 정보만, 6개 이하 유지
2. **기술 문서**: Claude 참조용 세부 구현 및 API 문서
3. **가이드**: 인간 친화적 단계별 설명
4. **아카이브**: 오래된 문서는 날짜별 보관

### 빠른 정보 찾기
1. **5분 시작**: [QUICK-START.md](./QUICK-START.md)
2. **문제 발생**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
3. **MCP 설정**: [MCP-GUIDE.md](./MCP-GUIDE.md)
4. **AI 협업**: [AI-SYSTEMS.md](./AI-SYSTEMS.md)

### 문서 유지보수
- **중복 제거**: 같은 내용은 하나로 통합
- **정기 정리**: 30일 이상 사용하지 않는 문서는 아카이브
- **실시간 업데이트**: 코드 변경 시 관련 문서 즉시 수정

## 🔗 주요 링크

### 공식 문서

- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Upstash Docs](https://upstash.com/docs)
- [Google Cloud Docs](https://cloud.google.com/docs)

### 프로젝트

- [GitHub Repository](https://github.com/[your-org]/openmanager-vibe-v5)
- [프로덕션 사이트](https://your-app.vercel.app)
- [개발 환경](http://localhost:3000)

## 📈 문서 최적화 현황 (2025-08-15)

### JBGE 원칙 달성 ✅
- **루트 파일**: 7개 → 5개 (목표 6개 이하 달성)
- **중복 제거**: MCP 관련 16개 → 통합 예정
- **구조화**: AI 도구 전용 디렉토리 신설

### 접근성 개선
- **빠른 접근**: 핵심 문서 5개로 집중
- **체계적 분류**: 6개 카테고리별 명확한 역할
- **검색 최적화**: 명명 규칙 표준화

---

> **마지막 업데이트**: 2025-08-15 | **JBGE 원칙 적용 완료** ✅
