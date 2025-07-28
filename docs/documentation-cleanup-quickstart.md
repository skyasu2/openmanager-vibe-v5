# 문서 정리 빠른 시작 가이드

_작성일: 2025-01-28_

## 즉시 실행 가능한 문서 정리 명령어

### 1단계: 현재 상태 분석

```bash
# 중복 문서 감지 및 분석
./scripts/docs/detect-duplicates.sh
```

### 2단계: 문서 재구성 실행

```bash
# 문서 구조 재구성 (백업 자동 생성)
./scripts/docs/reorganize.sh
```

### 3단계: 검증

```bash
# 링크 검증
./scripts/docs/validate-links.sh

# 인덱스 재생성
./scripts/docs/generate-index.sh
```

### 4단계: 정기 유지보수 설정

```bash
# 월간 검토 (매월 1일 자동 실행 권장)
./scripts/docs/monthly-review.sh
```

## 생성된 도구 목록

| 스크립트               | 용도                  | 실행 주기 |
| ---------------------- | --------------------- | --------- |
| `reorganize.sh`        | 문서 재구성 및 통합   | 1회성     |
| `detect-duplicates.sh` | 중복 문서 감지        | 필요시    |
| `validate-links.sh`    | 링크 검증             | 주간      |
| `generate-index.sh`    | 인덱스 생성           | 변경시    |
| `monthly-review.sh`    | 월간 검토 및 아카이빙 | 월간      |

## 예상 결과

### Before

- 전체 문서: 100개 이상
- README 파일: 1,744개
- MCP 문서: 22개
- 구조: 평면적 배치

### After

- 전체 문서: 30-40개 (60-70% 감소)
- README 파일: 필수 파일만 유지
- MCP 문서: 6개로 통합
- 구조: 체계적인 계층 구조

## 새로운 문서 구조

```
docs/
├── getting-started/     # 시작하기
├── guides/             # 가이드
│   ├── ai/            # AI 관련
│   ├── mcp/           # MCP 관련
│   ├── development/   # 개발
│   └── deployment/    # 배포
├── api/               # API 문서
├── reference/         # 참조 문서
├── troubleshooting/   # 문제 해결
└── archive/           # 아카이브
```

## 주의사항

1. **백업 확인**: `reorganize.sh` 실행 시 자동으로 백업 생성됨
2. **Git 커밋**: 변경사항이 많으므로 단계별로 커밋 권장
3. **팀 공유**: 주요 변경사항 팀에 공지 필요

## 문제 발생 시

백업에서 복구:

```bash
# 백업 디렉토리 확인
ls -la docs-backup-*

# 필요시 복구
cp -r docs-backup-TIMESTAMP/* docs/
```

## 다음 단계

1. ✅ 문서 정리 도구 생성 완료
2. ⏳ `reorganize.sh` 실행하여 문서 재구성
3. ⏳ 팀 리뷰 및 피드백
4. ⏳ CI/CD 통합 설정
