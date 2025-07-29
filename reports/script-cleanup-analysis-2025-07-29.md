# 스크립트 정리 분석 보고서

## 📅 작성일: 2025-07-29

## 📊 분석 결과 요약

### 전체 스크립트 현황
- **총 스크립트 파일**: 126개 (.sh 파일)
- **주요 디렉토리**: 
  - `/scripts/`: 메인 스크립트
  - `/.claude/`: Claude 관련 스크립트
  - `/hooks/`: Git hooks
  - `/gcp-functions/`: GCP 배포 스크립트

### 🔴 중복 스크립트 (삭제 권장)

#### 1. MCP 설정 스크립트
| 파일명 | 용도 | 권장 사항 |
|--------|------|-----------|
| `setup-mcp-env.sh` | 기본 MCP 환경 설정 | ✅ 유지 |
| `setup-mcp-env-wsl.sh` | WSL 전용 대화형 설정 | ✅ 유지 |
| `setup-mcp-wsl.sh` | 중복 (132줄) | ❌ 삭제 |
| `setup-mcp-wsl-final.sh` | 중복 (112줄) | ❌ 삭제 |

#### 2. 문서 관리 스크립트
| 파일명 | 용도 | 권장 사항 |
|--------|------|-----------|
| `docs/reorganize.sh` | 문서 재구성 메인 | ✅ 유지 |
| `docs-reorganize.sh` | 중복 | ❌ 삭제 |

#### 3. Git 관련 스크립트
| 파일명 | 문제점 | 권장 사항 |
|--------|--------|-----------|
| `git-push-helper.sh` | `decrypt-single-var.mjs` 의존성 없음 | ❌ 삭제 |
| `git-push-safe.sh` | 정상 작동 | ✅ 유지 |

### 🟡 보안 문제 스크립트 (수정 필요)

| 파일명 | 문제점 | 해결 방안 |
|--------|--------|-----------|
| `setup-mcp-env.sh` | 하드코딩된 플레이스홀더 | 환경변수 참조로 변경 |
| `fix-mcp-servers.sh` | 하드코딩된 URL | 설정 파일에서 읽도록 수정 |
| `test-supabase-rag.js` | 'SENSITIVE_INFO_REMOVED' | 실제 환경변수 사용 |

### 🟢 디렉토리별 권장 구조

```
scripts/
├── deployment/        # 배포 관련
├── docs/             # 문서 관리
├── env/              # 환경 설정
├── maintenance/      # 유지보수
├── mcp/              # MCP 관련
├── security/         # 보안 검사
├── testing/          # 테스트
└── backup-*/         # 백업 (30일 후 삭제)
```

### 📋 정리 작업 체크리스트

- [ ] MCP 중복 스크립트 2개 삭제
  - [ ] `setup-mcp-wsl.sh`
  - [ ] `setup-mcp-wsl-final.sh`
- [ ] 문서 중복 스크립트 삭제
  - [ ] `docs-reorganize.sh`
- [ ] Git 헬퍼 스크립트 삭제
  - [ ] `git-push-helper.sh`
- [ ] 보안 문제 스크립트 수정
  - [ ] 하드코딩된 값 제거
  - [ ] 환경변수 참조로 변경
- [ ] 오래된 백업 정리
  - [ ] `hooks/backup-consolidated-20250729/` (30일 후)

### 💡 개선 권장사항

1. **스크립트 명명 규칙 통일**
   - 기능별 접두사 사용 (예: `env-`, `mcp-`, `test-`)
   - WSL 전용은 `-wsl` 접미사 사용

2. **중복 방지 전략**
   - 공통 함수는 `shared-functions.sh`에 통합
   - 비슷한 기능은 매개변수로 분기 처리

3. **보안 강화**
   - 모든 민감 정보는 환경변수로
   - 플레이스홀더 대신 예제 환경변수 파일 제공

4. **문서화**
   - 각 디렉토리에 README.md 추가
   - 스크립트 상단에 용도와 사용법 명시

### 🚀 실행 방법

정리 스크립트가 생성되었습니다:
```bash
./scripts/cleanup-duplicate-scripts.sh
```

이 스크립트는 대화형으로 작동하며, 각 단계마다 확인을 요청합니다.

### ⚠️ 주의사항

1. 정리 전 전체 백업 권장
2. 백업된 파일은 `scripts/backup-YYYYMMDD-HHMMSS/`에 저장
3. 30일 후 백업 디렉토리 삭제 권장
4. CI/CD 파이프라인에서 사용하는 스크립트는 신중히 검토