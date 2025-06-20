# 🚀 안전한 마이그레이션 계획서

## 📋 **마이그레이션 전략**

### 1. 백업 우선 원칙

- 모든 삭제 작업 전 완전 백업
- 단계별 백업으로 롤백 지점 확보
- Git 브랜치 기반 버전 관리

### 2. 점진적 접근

- 한 번에 모든 파일 삭제 금지
- 카테고리별 단계적 정리
- 각 단계마다 검증 후 다음 단계 진행

### 3. 안전성 검증

- 의존성 분석 필수
- 빌드 및 테스트 통과 확인
- 기능 회귀 테스트 실시

## 📁 **임시 폴더 구조**

```
cleanup-analysis-2025-06-20/
├── README.md                    # 이 분석 보고서
├── detailed-analysis.md         # 상세 분석 결과
├── migration-plan.md           # 마이그레이션 계획
├── backup/                     # 백업 파일들
│   ├── ai-engines/             # AI 엔진 백업
│   ├── data-generators/        # 데이터 생성기 백업
│   ├── context-managers/       # 컨텍스트 매니저 백업
│   └── scripts/               # 스크립트 백업
├── analysis/                   # 분석 결과
│   ├── dependency-graph.md     # 의존성 그래프
│   ├── usage-report.md         # 사용처 분석
│   └── impact-assessment.md    # 영향도 평가
└── migration-scripts/          # 마이그레이션 스크립트
    ├── backup.sh              # 백업 스크립트
    ├── migrate.sh             # 마이그레이션 스크립트
    └── rollback.sh            # 롤백 스크립트
```

## 🔄 **단계별 마이그레이션 절차**

### Phase 1: 준비 단계 (1일)

#### 1.1 전체 백업 생성

```bash
# Git 브랜치 생성
git checkout -b cleanup/pre-deletion-backup
git add .
git commit -m "📦 삭제 작업 전 전체 백업"

# 물리적 백업
cp -r src/ cleanup-analysis-2025-06-20/backup/src-backup/
cp -r development/ cleanup-analysis-2025-06-20/backup/development-backup/
```

#### 1.2 의존성 분석 실행

```bash
# 각 삭제 대상 파일의 사용처 분석
grep -r "IntegratedAIEngineRefactored" src/ --include="*.ts" --include="*.tsx"
grep -r "OptimizedDataGenerator" src/ --include="*.ts" --include="*.tsx"
grep -r "HybridAIEngine" src/ --include="*.ts" --include="*.tsx"
grep -r "KoreanAIEngine" src/ --include="*.ts" --include="*.tsx"
```

#### 1.3 현재 시스템 상태 기록

```bash
# 빌드 상태 확인
npm run build > cleanup-analysis-2025-06-20/analysis/pre-cleanup-build.log

# 테스트 상태 확인
npm run test > cleanup-analysis-2025-06-20/analysis/pre-cleanup-test.log

# 타입 체크 상태 확인
npx tsc --noEmit > cleanup-analysis-2025-06-20/analysis/pre-cleanup-types.log
```

### Phase 2: 안전한 삭제 (2-3일)

#### 2.1 즉시 삭제 가능 파일 (사용처 없음)

```bash
# IntegratedAIEngineRefactored.ts 삭제
mv src/services/ai/engines/IntegratedAIEngineRefactored.ts \
   cleanup-analysis-2025-06-20/backup/ai-engines/

# 빌드 및 테스트 확인
npm run build && npm run test
```

#### 2.2 조건부 삭제 파일 (사용처 확인 필요)

```bash
# 사용처 재확인 후 삭제
if [ $(grep -r "HybridAIEngine" src/ | wc -l) -eq 0 ]; then
    mv src/services/ai/hybrid-ai-engine.ts \
       cleanup-analysis-2025-06-20/backup/ai-engines/
fi
```

#### 2.3 통합 후 삭제 파일

```bash
# OptimizedDataGenerator 사용처를 UnifiedDataGeneratorModule로 교체
# 1. API 엔드포인트 수정
# 2. import 문 교체
# 3. 기능 테스트 후 삭제
```

### Phase 3: 검증 및 정리 (1-2일)

#### 3.1 시스템 검증

```bash
# 전체 빌드 검증
npm run build

# 전체 테스트 실행
npm run test

# 타입 체크
npx tsc --noEmit

# 개발 서버 실행 테스트
npm run dev
```

#### 3.2 기능 회귀 테스트

- [ ] AI 엔진 쿼리 기능 테스트
- [ ] 데이터 생성기 동작 테스트
- [ ] 컨텍스트 매니저 기능 테스트
- [ ] API 엔드포인트 응답 테스트

#### 3.3 성능 측정

```bash
# 빌드 시간 측정
time npm run build

# 번들 크기 분석
npm run analyze

# 메모리 사용량 모니터링
npm run dev &
sleep 30
ps aux | grep node
```

## 🔒 **안전 장치**

### 자동 롤백 조건

1. **빌드 실패**: TypeScript 컴파일 오류 발생
2. **테스트 실패**: 기존 통과 테스트가 실패
3. **기능 오류**: 핵심 기능 동작 불가
4. **성능 저하**: 빌드 시간 50% 이상 증가

### 롤백 절차

```bash
# 즉시 롤백
git reset --hard cleanup/pre-deletion-backup

# 선택적 롤백 (특정 파일만)
git checkout cleanup/pre-deletion-backup -- src/services/ai/MasterAIEngine.ts

# 물리적 백업에서 복구
cp cleanup-analysis-2025-06-20/backup/ai-engines/IntegratedAIEngineRefactored.ts \
   src/services/ai/engines/
```

## 📊 **마이그레이션 스크립트**

### backup.sh

```bash
#!/bin/bash
echo "🔄 백업 시작..."

# Git 백업
git checkout -b cleanup/backup-$(date +%Y%m%d)
git add .
git commit -m "📦 자동 백업 $(date)"

# 물리적 백업
mkdir -p cleanup-analysis-2025-06-20/backup
cp -r src/ cleanup-analysis-2025-06-20/backup/src-$(date +%Y%m%d)/

echo "✅ 백업 완료"
```

### migrate.sh

```bash
#!/bin/bash
echo "🚀 마이그레이션 시작..."

# 1. 사용처 없는 파일 삭제
echo "📝 사용처 없는 파일 삭제 중..."
if [ $(grep -r "IntegratedAIEngineRefactored" src/ | wc -l) -eq 0 ]; then
    mv src/services/ai/engines/IntegratedAIEngineRefactored.ts \
       cleanup-analysis-2025-06-20/backup/ai-engines/
    echo "✅ IntegratedAIEngineRefactored.ts 삭제됨"
fi

# 2. 빌드 검증
echo "🔍 빌드 검증 중..."
if npm run build; then
    echo "✅ 빌드 성공"
else
    echo "❌ 빌드 실패 - 롤백 실행"
    ./rollback.sh
    exit 1
fi

# 3. 테스트 검증
echo "🧪 테스트 검증 중..."
if npm run test; then
    echo "✅ 테스트 성공"
else
    echo "❌ 테스트 실패 - 롤백 실행"
    ./rollback.sh
    exit 1
fi

echo "🎉 마이그레이션 완료"
```

### rollback.sh

```bash
#!/bin/bash
echo "⏪ 롤백 시작..."

# Git 롤백
git reset --hard cleanup/pre-deletion-backup

# 물리적 백업에서 복구
if [ -d "cleanup-analysis-2025-06-20/backup/ai-engines" ]; then
    cp cleanup-analysis-2025-06-20/backup/ai-engines/* \
       src/services/ai/engines/ 2>/dev/null || true
fi

if [ -d "cleanup-analysis-2025-06-20/backup/data-generators" ]; then
    cp cleanup-analysis-2025-06-20/backup/data-generators/* \
       src/services/ 2>/dev/null || true
fi

echo "✅ 롤백 완료"
```

## 📈 **진행 상황 추적**

### 체크리스트

- [ ] Phase 1: 준비 단계 완료
  - [ ] 전체 백업 생성
  - [ ] 의존성 분석 완료
  - [ ] 현재 상태 기록
- [ ] Phase 2: 삭제 작업 완료
  - [ ] 즉시 삭제 파일 처리
  - [ ] 조건부 삭제 파일 처리
  - [ ] 통합 후 삭제 파일 처리
- [ ] Phase 3: 검증 및 정리 완료
  - [ ] 시스템 검증 완료
  - [ ] 기능 회귀 테스트 완료
  - [ ] 성능 측정 완료

### 성과 측정

```
삭제 전:
- 파일 수: 603개
- 라인 수: 200,081줄
- 빌드 시간: 10초
- 메모리 사용량: 70MB

삭제 후 목표:
- 파일 수: 420개 (30% 감소)
- 라인 수: 140,000줄 (30% 감소)
- 빌드 시간: 6초 (40% 단축)
- 메모리 사용량: 52MB (25% 감소)
```

## ⚠️ **주의사항**

1. **운영 중인 시스템**: MasterAIEngine은 실제 운영 중이므로 절대 삭제 금지
2. **의도적 분리**: 컨텍스트 매니저들은 의도적 분리 구조이므로 보존
3. **점진적 접근**: 한 번에 모든 파일을 삭제하지 말고 단계적으로 진행
4. **백업 필수**: 모든 작업 전 반드시 백업 실시
5. **검증 필수**: 각 단계마다 빌드/테스트 검증 실시

---

**마이그레이션 책임자**: 개발팀 리더  
**기술 검토자**: 시니어 개발자  
**최종 승인자**: 프로젝트 관리자
