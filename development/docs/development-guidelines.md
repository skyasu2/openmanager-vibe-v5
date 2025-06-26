# 🚀 OpenManager Vibe v5 개발 가이드라인

## 📋 **중복 개발 방지 원칙**

### 1. 컴포넌트 생성 전 검토 과정

- [ ] **기존 파일 존재 여부 확인**: `find . -name "*ComponentName*" -type f`
- [ ] **유사 기능 컴포넌트 검색**: `grep -r "similar-function" src/`
- [ ] **V\*, Enhanced, Optimized 버전 확인**: 기존 버전이 있다면 수정 고려
- [ ] **사용 중인 컴포넌트 확인**: `grep -r "ComponentName" src/`

### 2. 네이밍 규칙

```
❌ 금지사항:
- AISidebarV5.tsx
- AISidebarV6Enhanced.tsx
- AISidebarOptimized.tsx
- AISidebarNew.tsx

✅ 권장사항:
- AISidebar.tsx (메인 컴포넌트)
- AISidebar.mobile.tsx (플랫폼별)
- AISidebar.admin.tsx (역할별)
```

### 3. 단일 파일 버전 관리

```typescript
// AISidebar.tsx
interface AISidebarProps {
  version?: 'v5' | 'v6' | 'mobile' | 'admin';
  enhanced?: boolean;
  optimized?: boolean;
}

export const AISidebar: React.FC<AISidebarProps> = ({
  version = 'v6',
  enhanced = true,
  optimized = true,
  ...props
}) => {
  // 버전별 분기 처리
  if (version === 'mobile') {
    return <MobileAISidebar {...props} />;
  }

  return enhanced ? <EnhancedAISidebar {...props} /> : <BasicAISidebar {...props} />;
};
```

## 🔄 **컴포넌트 중복 해결 절차**

### 1. 백업 및 분석

```bash
# 1. 중복 파일 백업
mkdir -p development/scripts/backups/duplicate-components/[category]
mv src/components/[duplicate-files] development/scripts/backups/duplicate-components/[category]/

# 2. 사용 중인 컴포넌트 확인
grep -r "ComponentName" src/ --include="*.tsx" --include="*.ts"

# 3. 실제 사용되는 컴포넌트 식별
```

### 2. 통합 컴포넌트 생성

```typescript
// 통합된 컴포넌트 예시
export const UnifiedComponent: React.FC<Props> = ({
  variant = 'default',
  features = [],
  ...props
}) => {
  const config = useMemo(() => {
    switch (variant) {
      case 'enhanced': return enhancedConfig;
      case 'optimized': return optimizedConfig;
      case 'mobile': return mobileConfig;
      default: return defaultConfig;
    }
  }, [variant]);

  return <BaseComponent config={config} {...props} />;
};
```

## 📊 **백업된 중복 컴포넌트 현황**

### AI 사이드바 (4개 → 1개)

- ✅ `AISidebarV5.tsx` → 백업 완료
- ✅ `AISidebarV5Enhanced.tsx` → 백업 완료
- ✅ `AISidebarV6Enhanced.tsx` → 백업 완료
- ✅ `dashboard/AISidebar.tsx` → 백업 완료
- 🎯 **현재 사용**: `VercelOptimizedAISidebar.tsx`

### 대시보드 컴포넌트 (3개 → 1개)

- ✅ `DashboardEntrance.tsx` → 백업 완료
- ✅ `MLDashboard.tsx` → 백업 완료
- ✅ `SequentialLoader.tsx` → 백업 완료
- 🎯 **현재 사용**: `ServerDashboard.tsx`

## 🛠️ **개발 워크플로우**

### 1. 새 기능 개발 시

```bash
# 1. 기존 파일 검색
npm run search:components -- "FeatureName"

# 2. 유사 기능 확인
npm run search:similar -- "feature-keyword"

# 3. 컴포넌트 생성 (중복 방지)
npm run create:component -- ComponentName --check-duplicates
```

### 2. 기존 컴포넌트 수정 시

```bash
# 1. 사용 중인 곳 확인
npm run find:usage -- ComponentName

# 2. 테스트 실행
npm run test:component -- ComponentName

# 3. 안전한 수정 적용
npm run refactor:safe -- ComponentName
```

## 📈 **성과 지표**

### 정리 완료 현황

- 🗂️ **백업 이동**: 7개 중복 파일
- 🎯 **활성 컴포넌트**: 각 기능당 1개로 통합
- 🚀 **로딩 플로우**: 즉시 이동 / 3초 자동 이동 선택
- ⚡ **성능 향상**: 불필요한 컴포넌트 로딩 제거

### 사용자 경험 개선

- 🏠 **홈 → 시스템 시작**: 0.5초 후 즉시 이동
- ⏱️ **로딩 완료**: 3초 자동 카운트다운
- ⌨️ **중단 옵션**: ESC 키 / 배경 클릭
- 🎨 **시각적 피드백**: 카운트다운 UI 표시

## 🚫 **금지사항**

1. **무분별한 Enhanced/Optimized 접미사 사용**
2. **기존 컴포넌트 확인 없이 신규 생성**
3. **버전 관리 없는 V\* 파일 생성**
4. **사용하지 않는 컴포넌트 방치**
5. **중복 기능 구현**

## ✅ **권장사항**

1. **기존 컴포넌트 확장 우선**
2. **Props 기반 버전 관리**
3. **명확한 네이밍 규칙**
4. **정기적인 중복 검사**
5. **백업 후 정리**

## 테스트 환경 통일 규칙

### ✅ 사용할 도구

- **테스트 러너**: Vitest (단일 도구 사용)
- **설정 파일**: vitest.config.ts
- **테스트 문법**: `import { describe, expect, it } from 'vitest'`

### ❌ 금지 사항

- Jest 명령어를 package.json에 추가하지 말 것
- 테스트 파일에서 `@jest/globals` import 금지
- 이중 테스트 환경 설정 금지

### 🔧 새로운 테스트 추가 시

```typescript
// ✅ 올바른 방식
import { describe, expect, it } from 'vitest';

describe('새로운 기능', () => {
  it('정상 작동해야 함', () => {
    expect(true).toBe(true);
  });
});
```

### 🚨 문제 발생 시 체크리스트

1. `npm run test:unit` 명령어가 vitest를 사용하는가?
2. 테스트 파일에서 올바른 import를 사용하는가?
3. vitest.config.ts 설정이 올바른가?

---

> **📌 이 가이드라인을 따라 개발하면 중복 코드를 방지하고 유지보수성을 크게 향상시킬 수 있습니다.**
