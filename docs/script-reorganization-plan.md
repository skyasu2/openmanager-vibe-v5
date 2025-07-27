# 스크립트 재구성 계획

## 현재 문제점

1. MCP 설정 스크립트가 여러 곳에 중복됨
2. 환경 설정 스크립트가 분산되어 있음
3. 동일한 파일이 다른 경로에 중복 존재
4. 체계적인 조직화 부족

## 중복 스크립트 현황

### MCP 관련 (11개 → 4개로 통합 예정)

- `.claude/setup-mcp-env.sh`
- `scripts/setup-mcp-env.sh`
- `scripts/setup-mcp-env-wsl.sh`
- `scripts/setup-mcp-wsl.sh`
- `scripts/setup-mcp-wsl-final.sh`
  → **통합: `scripts/mcp/setup.sh`**

### 환경 설정 관련 (8개 → 3개로 통합 예정)

- `.claude/setup-env.sh`
- `local-dev/scripts/setup/setup-env.sh`
- `scripts/setup-env-interactive.sh`
- `scripts/setup-vercel-env.sh`
- `scripts/vercel-env-setup.sh`
  → **통합: `scripts/env/setup.sh`, `scripts/env/vercel.sh`**

### 정리(Cleanup) 관련 (중복 제거)

- `local-dev/scripts/cleanup-branches.sh` (중복)
- `local-dev/scripts/maintenance/cleanup-branches.sh` (삭제)

## 제안하는 새로운 구조

```
scripts/
├── env/                    # 환경 설정
│   ├── setup.sh           # 통합 환경 설정
│   ├── vercel.sh          # Vercel 전용
│   └── interactive.sh     # 대화형 설정
├── mcp/                    # MCP 관련
│   ├── setup.sh           # MCP 설정 (WSL 포함)
│   ├── validate.sh        # MCP 검증
│   ├── monitor.sh         # 상태 모니터링
│   └── reset.sh           # 설정 초기화
├── security/               # 보안 관련
│   ├── check-secrets.sh   # 시크릿 검사
│   ├── fix-oauth.sh       # OAuth 수정
│   └── secure-env.sh      # 환경 보안
├── deployment/             # 배포 관련
│   ├── emergency.sh       # 긴급 배포
│   ├── vercel.sh          # Vercel 배포
│   └── gcp.sh             # GCP 배포
├── maintenance/            # 유지보수
│   ├── cleanup.sh         # 통합 정리 스크립트
│   ├── archive.sh         # 아카이브
│   └── weekly-review.sh   # 주간 검토
└── testing/                # 테스트 관련
    ├── run-tests.sh       # 테스트 실행
    └── fix-tests.sh       # 테스트 자동 수정
```

## 실행 계획

### Phase 1: 백업 및 분석 (즉시)

1. 모든 스크립트 백업
2. 중복 내용 상세 분석
3. 의존성 확인

### Phase 2: 통합 및 정리 (1일차)

1. 중복 스크립트 통합
2. 새로운 디렉토리 구조 생성
3. 통합된 스크립트 작성

### Phase 3: 테스트 및 문서화 (2일차)

1. 통합 스크립트 테스트
2. README 작성
3. 이전 경로에서 새 경로로 리다이렉션

### Phase 4: 정리 및 배포 (3일차)

1. 구 스크립트 제거
2. 문서 업데이트
3. 팀 공지

## 예상 효과

- 스크립트 개수: 55개 → 약 25개 (55% 감소)
- 유지보수 시간: 70% 감소
- 신규 개발자 온보딩: 50% 단축
- 중복 코드: 0%

## 주의사항

- CI/CD 파이프라인 영향 확인 필요
- 기존 스크립트 참조하는 문서 업데이트
- 팀원들에게 변경사항 공지
