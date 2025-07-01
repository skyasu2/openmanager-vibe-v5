# 🧹 OpenManager Vibe v5 파일 정리 전략

## 📊 현재 상황 분석 (2025-07-02)

### 정리 대상 파일 현황

- **환경변수 백업**: 168KB (10개 파일)
- **테스트 HTML**: 400KB+ (24개 파일)
- **테스트 스크립트**: 1.2MB (32개 파일)
- **개발 로그**: 41KB (8개 파일)
- **총 정리 가능 용량**: ~1.8MB

## 🎯 정리 전략

### 1. 환경변수 백업 정리 (즉시 실행)

```bash
# 최신 1개만 유지, 나머지 삭제
cd config/env-backups/
ls -t | tail -n +2 | xargs rm -f
```

**효과**: 168KB → 17KB (90% 절약)

### 2. 테스트 HTML 파일 아카이브화 (단계적)

```bash
# 아카이브 폴더 생성
mkdir -p archive/test-html-files
mv public/test-*.html archive/test-html-files/
```

**재활용 방안**:

- 핵심 테스트 3개만 유지 (ai-integration, ai-modes, comparison)
- 나머지는 아카이브로 이동
- 필요시 언제든 복원 가능

### 3. 테스트 스크립트 분류 정리 (선별적)

**유지할 스크립트** (개발 필수):

- `test-ai-engines.js` - AI 엔진 테스트
- `test-data-integration.js` - 데이터 통합 테스트
- `cursor-auto-test.js` - 자동화 테스트

**아카이브할 스크립트** (레거시):

- `test-*-old.js` 형태의 구버전
- `demo-*.js` 데모용 스크립트
- 중복 기능 스크립트

### 4. 개발 로그 자동 정리 (자동화)

```bash
# 30일 이상 된 로그 삭제
find development/logs -name "*.json" -mtime +30 -delete
```

## 📁 새로운 폴더 구조

### 정리 후 구조

```
├── archive/                    # 아카이브 (필요시 복원)
│   ├── test-html-files/       # 테스트 HTML 파일들
│   ├── legacy-scripts/        # 레거시 스크립트
│   └── old-logs/             # 오래된 로그
├── config/
│   └── env-backups/          # 최신 1개만 유지
├── public/                   # 핵심 테스트 파일만
├── scripts/                  # 필수 스크립트만
└── development/
    └── logs/                 # 최근 30일 로그만
```

## 🔄 재활용 및 의도적 분리

### 재활용 가능한 파일들

1. **AI 테스트 HTML**: 향후 AI 기능 확장 시 참고용
2. **데모 스크립트**: 프레젠테이션 및 교육용
3. **환경변수 백업**: 롤백 시나리오 대응

### 의도적 분리 기준

1. **현재 사용 중**: `src/`, `docs/`, 핵심 설정 파일
2. **개발 필수**: 핵심 테스트 스크립트, 최신 백업
3. **아카이브**: 레거시, 중복, 임시 파일
4. **삭제 대상**: 명백한 중복, 오래된 로그

## ⚡ 자동화 스크립트

### 주간 정리 스크립트

```bash
#!/bin/bash
# weekly-cleanup.sh

# 1. 오래된 환경변수 백업 정리 (최신 3개만 유지)
cd config/env-backups && ls -t | tail -n +4 | xargs rm -f

# 2. 30일 이상 된 로그 삭제
find development/logs -name "*.json" -mtime +30 -delete

# 3. 임시 파일 정리
find . -name "*temp*" -o -name "*tmp*" | grep -v node_modules | xargs rm -f

echo "✅ 주간 정리 완료"
```

## 📈 예상 효과

### 용량 절약

- **즉시**: ~1.5MB 절약
- **장기**: 월 100MB+ 절약 (로그 누적 방지)

### 개발 효율성

- **파일 탐색 속도** 향상
- **Git 성능** 개선
- **배포 시간** 단축

### 유지보수성

- **명확한 파일 구조**
- **자동화된 정리**
- **필요시 복원 가능**

## 🚨 주의사항

### 삭제 전 확인사항

1. 현재 사용 중인 파일 여부
2. 다른 파일에서 참조 여부
3. 백업 존재 여부

### 안전 조치

1. 아카이브 폴더 우선 생성
2. 단계별 실행 (한 번에 모두 X)
3. Git 커밋 후 정리 실행

---

**생성일**: 2025-07-02  
**버전**: v1.0  
**적용 대상**: OpenManager Vibe v5.44.4
