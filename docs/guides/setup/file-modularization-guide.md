# 파일 모듈화 가이드

📅 **작성일**: 2025년 08월 12일  
🎯 **목적**: 대규모 파일 분리 및 코드 유지보수성 향상

## 📊 현재 상태 분석

### 경고 레벨 파일 (900-1000줄)

| 파일 | 현재 줄 수 | 유형 | 우선순위 |
|-----|-----------|------|---------|
| `serverCommandsConfig.ts` | 948 | Config | 중간 |
| `advanced-context-manager.ts` | 945 | Context | 높음 |
| `AISidebarV2.tsx` | 937 | Component | 높음 |
| `IntelligentMonitoringPage.tsx` | 923 | Page | 높음 |

### 파일 크기 정책

- **✅ 정상**: < 500줄 (권장)
- **⚠️ 주의**: 500-900줄 (모니터링)
- **🟡 경고**: 900-1500줄 (분리 권장)
- **🔴 위험**: > 1500줄 (즉시 분리)

## 🔧 모듈화 전략

### 1. Component 분리 패턴 (React/TSX)

#### Before: 단일 파일 (937줄)
```
AISidebarV2.tsx
```

#### After: 모듈화 구조
```
AISidebarV2/
├── index.tsx              # 진입점 (50줄)
├── AISidebarV2.container.tsx    # 로직 컨테이너 (200줄)
├── AISidebarV2.presentation.tsx # UI 컴포넌트 (300줄)
├── hooks/
│   ├── useAISidebar.ts   # 커스텀 훅 (150줄)
│   └── useAIChat.ts       # 채팅 로직 (100줄)
├── components/
│   ├── ChatSection.tsx    # 채팅 섹션 (100줄)
│   └── ControlPanel.tsx   # 컨트롤 패널 (100줄)
└── types.ts               # 타입 정의 (37줄)
```

### 2. Service 분리 패턴 (TypeScript)

#### Before: 단일 파일 (945줄)
```
advanced-context-manager.ts
```

#### After: 모듈화 구조
```
advanced-context-manager/
├── index.ts               # 진입점 (30줄)
├── core/
│   ├── ContextManager.ts  # 핵심 클래스 (200줄)
│   └── ContextStore.ts    # 상태 관리 (150줄)
├── providers/
│   ├── MemoryProvider.ts  # 메모리 제공자 (150줄)
│   └── StorageProvider.ts # 스토리지 제공자 (150줄)
├── utils/
│   ├── validators.ts      # 유효성 검사 (100줄)
│   └── helpers.ts         # 헬퍼 함수 (100줄)
└── types.ts               # 타입 정의 (65줄)
```

### 3. Config 분리 패턴

#### Before: 단일 파일 (948줄)
```
serverCommandsConfig.ts
```

#### After: 모듈화 구조
```
server-commands/
├── index.ts               # 진입점 (50줄)
├── commands/
│   ├── system.ts          # 시스템 명령 (200줄)
│   ├── network.ts         # 네트워크 명령 (200줄)
│   ├── process.ts         # 프로세스 명령 (200줄)
│   └── monitoring.ts      # 모니터링 명령 (200줄)
├── validators.ts          # 명령 검증 (50줄)
└── types.ts               # 타입 정의 (48줄)
```

## 🚀 자동화 도구

### 파일 크기 모니터링

```bash
# 설치
npm install --save-dev file-size-monitor

# 실행
npm run monitor:files

# Git Hook 통합
echo "node scripts/file-size-monitor.js || true" >> .husky/pre-commit
```

### 자동 분리 스크립트

```bash
#!/bin/bash
# auto-modularize.sh

FILE=$1
THRESHOLD=900

LINES=$(wc -l < "$FILE")
if [ $LINES -gt $THRESHOLD ]; then
  echo "⚠️  File $FILE has $LINES lines (threshold: $THRESHOLD)"
  echo "🔧 Starting modularization..."
  
  # Create module directory
  DIR=$(dirname "$FILE")
  BASE=$(basename "$FILE" .tsx)
  BASE=$(basename "$BASE" .ts)
  
  mkdir -p "$DIR/$BASE"
  
  # Generate structure
  echo "📁 Created module structure at $DIR/$BASE/"
fi
```

## 📋 실행 계획

### Phase 1: 즉시 조치 (1일)

1. **파일 크기 모니터 설치**
   ```bash
   node scripts/file-size-monitor.js
   ```

2. **Git Hook 통합**
   ```bash
   # .husky/pre-commit에 추가
   node scripts/file-size-monitor.js || true
   ```

3. **CI/CD 통합**
   ```yaml
   # .github/workflows/ci.yml
   - name: Check file sizes
     run: node scripts/file-size-monitor.js
   ```

### Phase 2: 점진적 리팩토링 (1주)

#### Week 1: Component 분리
- [ ] `AISidebarV2.tsx` → 모듈화
- [ ] `IntelligentMonitoringPage.tsx` → 모듈화

#### Week 2: Service 분리
- [ ] `advanced-context-manager.ts` → 모듈화
- [ ] `serverCommandsConfig.ts` → 모듈화

### Phase 3: 지속적 관리

- 매주 파일 크기 리포트 생성
- 800줄 이상 파일 사전 경고
- 분기별 코드 리뷰 및 리팩토링

## 🎯 Best Practices

### DO ✅
- 단일 책임 원칙 준수
- 관련 기능끼리 그룹화
- 명확한 폴더 구조 유지
- 타입 정의 분리
- 테스트 파일 분리

### DON'T ❌
- 무분별한 파일 분할
- 순환 의존성 생성
- 과도한 추상화
- 네이밍 일관성 무시
- 테스트 없이 리팩토링

## 📈 예상 효과

### 개발 생산성
- **코드 탐색**: 50% 개선
- **디버깅 시간**: 30% 단축
- **PR 리뷰**: 40% 효율화
- **테스트 작성**: 25% 간소화

### 유지보수성
- **가독성**: 크게 향상
- **재사용성**: 모듈화로 증가
- **확장성**: 새 기능 추가 용이
- **팀 협업**: 충돌 감소

## 🔍 모니터링 대시보드

```typescript
// file-size-dashboard.tsx
interface FileMetrics {
  path: string;
  lines: number;
  complexity: number;
  lastModified: Date;
  contributors: string[];
  trend: 'growing' | 'stable' | 'shrinking';
}

const FileSizeDashboard = () => {
  const metrics = useFileMetrics();
  
  return (
    <Dashboard>
      <MetricCard title="Files > 900 lines" value={4} trend="down" />
      <MetricCard title="Average File Size" value={245} trend="stable" />
      <MetricCard title="Largest File" value={948} trend="warning" />
      <FileList files={metrics} threshold={900} />
    </Dashboard>
  );
};
```

## 🛠️ 도구 및 리소스

### VS Code Extensions
- **CodeMetrics**: 복잡도 측정
- **Import Cost**: 번들 크기 표시
- **SonarLint**: 코드 품질 검사

### npm 패키지
```json
{
  "devDependencies": {
    "plop": "^3.1.2",        // 파일 생성 자동화
    "madge": "^6.1.0",        // 의존성 분석
    "size-limit": "^8.2.6",   // 번들 크기 제한
    "depcheck": "^1.4.3"      // 미사용 의존성 체크
  }
}
```

### GitHub Actions
```yaml
name: File Size Check
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check file sizes
        run: |
          node scripts/file-size-monitor.js
          if [ $? -ne 0 ]; then
            echo "::error::Files exceed size limit"
            exit 1
          fi
```

## ✅ 체크리스트

- [ ] 파일 크기 모니터링 스크립트 설치
- [ ] Git Hook 설정
- [ ] CI/CD 파이프라인 통합
- [ ] 900줄 이상 파일 식별
- [ ] 모듈화 계획 수립
- [ ] 팀 리뷰 및 승인
- [ ] 점진적 리팩토링 시작
- [ ] 문서 업데이트

---

💡 **핵심 원칙**: 작은 모듈, 명확한 책임, 높은 응집도, 낮은 결합도