# 📚 OpenManager VIBE v5 문서

> **JBGE 원칙 기반 체계적 문서 관리** - 찾기 쉽고, 유지보수 쉬운 문서  
> **최신 업데이트**: 2025-08-16 | JBGE 구조 최적화 완료 (핵심 문서만 루트 유지, 78% 감축) ✅

## 🎯 문서 철학

**"Just Barely Good Enough (JBGE) + 체계적 분류"**

- **루트 레벨**: 핵심 가이드만 유지 (JBGE 원칙 준수)
- **설정 통합**: setup/ 폴더로 모든 설정 가이드 통합
- **배포 통합**: deployment/ 폴더로 인프라 문서 통합
- **AI 도구**: ai-tools/ 폴더로 협업 도구 통합
- **기술 문서**: 평면화된 구조로 접근성 향상

## 🚀 핵심 문서 (루트 레벨) ✅

| 문서                                                      | 설명                               | 소요 시간 | 상태 |
| --------------------------------------------------------- | ---------------------------------- | --------- | ---- |
| **[📚 README.md](./README.md)**                           | 전체 문서 구조 (이 문서)           | 5분       | ✅   |
| **[⚡ QUICK-START.md](./QUICK-START.md)**                 | 5분 내 개발 환경 완전 설정         | 5분       | ✅   |
| **[🔌 MCP-GUIDE.md](./MCP-GUIDE.md)**                     | MCP 서버 완전 마스터 가이드 (통합) | 20분      | ✅   |
| **[🏗️ system-architecture.md](./system-architecture.md)** | 전체 아키텍처와 기술 명세          | 15분      | ✅   |
| **[🚨 TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**         | 통합 문제해결 가이드               | 상황별    | ✅   |
| **[📋 DOCUMENT-INDEX.md](./DOCUMENT-INDEX.md)**           | 전체 문서 색인                     | 5분       | ✅   |

## 📂 최적화된 문서 구조 (JBGE 원칙)

### 📁 setup/ - 모든 설정 가이드 통합

```
setup/
├── environment-setup-complete.md    # 환경 설정 완전 가이드
├── auth-security-setup.md           # 인증 및 보안 설정
├── platform-deployment-setup.md     # 플랫폼 배포 설정
└── services-integration-setup.md    # 서비스 통합 설정
```

### 📁 deployment/ - 배포 및 인프라

```
deployment/
├── vercel-deployment.md             # Vercel 배포 가이드
├── gcp-deployment.md                # GCP 백엔드 배포
└── free-tier-optimization.md        # 무료 티어 최적화
```

### 📁 ai-tools/ - AI 협업 도구

```
ai-tools/
├── ai-systems-guide.md              # AI 시스템 통합 가이드
├── ai-tools-comparison.md           # AI 도구 비교
├── gemini-cli-guide.md              # Gemini CLI 활용
└── qwen-cli-guide.md                # Qwen CLI 활용
```

### 📁 development/ - 개발 환경 (정리됨)

```
development/
├── development-guide.md             # 메인 개발 가이드
├── wsl-optimization-guide.md        # WSL 최적화 (통합)
├── typescript-guide.md              # TypeScript 설정 (통합)
├── react-optimization.md            # React 최적화 (통합)
├── git-workflow.md                  # Git 워크플로우 (통합)
├── testing-integration.md           # 테스트 통합
├── performance-dev.md               # 개발 성능
└── project-structure.md             # 프로젝트 구조
```

### 📁 mcp/ - MCP 기술 문서 (평면화)

```
mcp/
├── mcp-best-practices.md            # MCP 베스트 프랙티스
├── mcp-servers-guide.md             # 개별 서버 가이드
├── mcp-troubleshooting.md           # MCP 문제 해결
└── mcp-advanced-usage.md            # 고급 사용법
```

### 📁 archive/ - 아카이브된 문서들

```
archive/
├── removed-files-list.md            # 아카이브된 파일 목록
├── environment-setup-guide.md       # 구 환경 설정 가이드
├── performance-optimization-report.md  # 구 성능 리포트
└── ...                              # 기타 아카이브된 문서들
```

## 🎯 JBGE 최적화 성과

### 📊 구조 개선 지표

- **루트 파일**: 27개 → 핵심만 유지 (78% 감축) ✅
- **디렉토리**: 15개 → 8개 (47% 감축) ✅
- **최대 깊이**: 4레벨 → 2레벨 (50% 단순화) ✅
- **중복 문서**: 30개+ → 0개 (완전 제거) ✅

### 🔄 이전 vs 현재 구조

#### 이전 (복잡한 구조)

```
docs/
├── AI-SYSTEMS.md
├── environment-*.md (3개)
├── gcp-vm-*.md (3개)
├── git-workflow-*.md (2개)
├── performance-*.md (2개)
├── vm-*.md (2개)
├── guides/setup/ (중복)
├── setup/ (중복)
├── technical/mcp/ (깊은 중첩)
├── technical/ai-engines/ (깊은 중첩)
└── ... (총 27개 루트 파일)
```

#### 현재 (JBGE 최적화)

```
docs/
├── README.md                    # 문서 인덱스
├── QUICK-START.md              # 빠른 시작
├── TROUBLESHOOTING.md          # 문제 해결
├── MCP-GUIDE.md                # MCP 기본
├── MCP-ADVANCED.md             # MCP 고급
├── system-architecture.md     # 시스템 구조
├── setup/                      # 설정 통합
├── deployment/                 # 배포 통합
├── ai-tools/                   # AI 도구 통합
├── development/                # 개발 환경 (정리)
├── mcp/                        # MCP 기술 (평면화)
└── archive/                    # 아카이브
```

## 🚀 빠른 네비게이션

### 📋 상황별 가이드

#### 🏁 처음 시작하는 경우

1. **[⚡ 빠른 시작](./QUICK-START.md)** - 5분 내 개발 환경 설정
2. **[🛠️ 환경 설정](./setup/environment-setup-complete.md)** - 완전한 환경 설정
3. **[🔌 MCP 가이드](./MCP-GUIDE.md)** - MCP 서버 연결

#### 🔧 문제가 발생한 경우

1. **[🚨 문제 해결](./TROUBLESHOOTING.md)** - 일반적인 문제 해결
2. **[🔧 MCP 문제해결](./mcp/mcp-troubleshooting.md)** - MCP 관련 문제
3. **[🐧 WSL 최적화](./development/wsl-optimization-guide.md)** - WSL 환경 문제

#### 🚀 배포하려는 경우

1. **[☁️ Vercel 배포](./deployment/vercel-deployment.md)** - 프론트엔드 배포
2. **[🌐 GCP 배포](./deployment/gcp-deployment.md)** - 백엔드 배포
3. **[💰 무료 티어 최적화](./deployment/free-tier-optimization.md)** - 비용 최적화

#### 🤖 AI 도구를 활용하려는 경우

1. **[🤖 AI 시스템 가이드](./ai-tools/ai-systems-guide.md)** - AI 통합 활용
2. **[💎 Gemini CLI](./ai-tools/gemini-cli-guide.md)** - Google AI 활용
3. **[⚡ Qwen CLI](./ai-tools/qwen-cli-guide.md)** - Qwen AI 활용

## 📚 참고 정보

### 🔗 외부 링크

- **[Claude Code 공식 문서](https://docs.anthropic.com/en/docs/claude-code)**
- **[Next.js 15 문서](https://nextjs.org/docs)**
- **[Supabase 문서](https://supabase.com/docs)**
- **[Vercel 문서](https://vercel.com/docs)**

### 📝 문서 기여 가이드

1. **JBGE 원칙 준수**: 루트 레벨 핵심 파일만 유지
2. **명확한 분류**: 적절한 폴더에 배치
3. **중복 제거**: 기존 문서와 중복 확인
4. **링크 업데이트**: 관련 문서 간 링크 연결

### 🏷️ 문서 태그 규칙

- **🚀**: 시작/설정 가이드
- **🔧**: 문제 해결/트러블슈팅
- **⚡**: 빠른 참조/핵심 정보
- **🤖**: AI 관련 도구/기능
- **☁️**: 클라우드/배포 관련
- **🛠️**: 개발 도구/환경

---

> **📞 도움이 필요하시나요?**  
> [Issues](https://github.com/your-repo/issues)에 문제를 등록하거나  
> [Discussions](https://github.com/your-repo/discussions)에서 질문해주세요!
