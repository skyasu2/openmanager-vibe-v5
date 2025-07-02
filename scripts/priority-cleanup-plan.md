# 🎯 OpenManager Vibe v5 우선순위별 정리 계획

## 📊 현재 코드베이스 건강도: 25.2/100 🚨

### 🔴 **긴급 개선 필요 (즉시 실행)**

#### 1. 대용량 파일 분리 (11개 파일, 1000줄 이상)

```
📏 분리 대상:
• AISidebarV2.tsx (1,463줄) → 컴포넌트 단위 분리
• real-mcp-client.ts (1,437줄) → 기능별 모듈 분리
• UnifiedAIEngineRouter.ts (1,430줄) → 엔진별 라우터 분리
• IntelligentMonitoringService.ts (1,273줄) → 서비스 단위 분리
• UnifiedDataGeneratorModule.ts (1,252줄) → 생성기별 분리
```

**예상 효과**: 건강도 +55점 (25.2 → 80.2)

#### 2. 미사용 API 라우트 정리 (79개)

```
🗑️ 즉시 삭제 가능:
• /api/ai/anomaly (5.8KB)
• /api/ai/anomaly-detection (4.6KB)
• /api/ai/correlation (2.7KB)
• /api/ai/predict (2.7KB)
• /api/ping (0.8KB)
```

**예상 효과**: 용량 절약 ~300KB, 유지보수성 향상

### 🟡 **중기 개선 계획 (1-2주 내)**

#### 3. 미사용 파일 정리 (기존 분석 결과 기반)

```
📁 정리 대상:
• lib/build-safety/TimerBlocker.ts (미사용)
• lib/cache/AICache.ts (미사용)
• lib/data-validation/DataIntegrityValidator.ts (미사용)
• services/ai/AIAgentMigrator.ts (미사용)
• services/ai/AIStateManager.ts (미사용)
```

#### 4. 중복 패턴 리팩토링

```
🔄 공통화 대상:
• "const response" 패턴 (317개) → ResponseUtil 생성
• "const result" 패턴 (211개) → ResultHandler 생성
• "const startTime" 패턴 (159개) → TimerUtil 생성
• "function GET" 패턴 (134개) → APIBaseHandler 생성
```

### 🟢 **장기 개선 계획 (1개월 내)**

#### 5. 테스트 커버리지 향상 (현재 5.6% → 목표 40%)

```
🧪 우선순위 테스트 대상:
• 핵심 AI 엔진 (UnifiedAIEngineRouter)
• 데이터 생성기 (RealServerDataGenerator)
• MCP 클라이언트 (real-mcp-client)
• API 라우트 핵심 기능
```

#### 6. 의존성 정리 (86개 미사용 의존성)

```
📦 제거 대상 (고용량):
• @tensorflow/tfjs-node (~200MB)
• @testing-library/* (개발용)
• winston-daily-rotate-file
• ml-regression-polynomial
• compromise
```

## 📋 단계별 실행 계획

### Phase 1: 긴급 정리 (이번 주)

- [ ] 대용량 파일 5개 우선 분리
- [ ] 미사용 API 20개 삭제
- [ ] 아카이브 구조 완성

### Phase 2: 구조 개선 (다음 주)

- [ ] 중복 패턴 유틸리티 생성
- [ ] 미사용 파일 30개 정리
- [ ] import 최적화

### Phase 3: 품질 강화 (3-4주차)

- [ ] 핵심 기능 테스트 추가
- [ ] 의존성 대폭 정리
- [ ] 문서화 완성

## 🎯 목표 건강도

| 단계    | 현재 | 목표 | 개선점 |
| ------- | ---- | ---- | ------ |
| Phase 1 | 25.2 | 65.0 | +39.8  |
| Phase 2 | 65.0 | 80.0 | +15.0  |
| Phase 3 | 80.0 | 90.0 | +10.0  |

## ⚡ 즉시 실행 가능한 작업

```bash
# 1. 미사용 API 삭제 (5분)
rm src/app/api/ping/route.ts
rm src/app/api/ai/predict/route.ts

# 2. 아카이브 정리 실행 (2분)
./scripts/weekly-cleanup.sh

# 3. 건강도 재점검 (1분)
node scripts/codebase-health-check.js
```

**예상 즉시 효과**: 건강도 25.2 → 35.0 (+9.8점)
