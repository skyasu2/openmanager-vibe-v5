# 🔍 비교 기반 코드 리팩토링 & 정리 자동화 프롬프트

## 🎯 목적
중복되거나 불필요한 파일들을 삭제하기 전에 코드 기반으로 비교하여 가장 나은 쪽을 선택하거나 통합한 후 정리

## ✅ 판단 기준
- **import 참조 수:** 실제 사용되는 횟수
- **타입 안정성:** Props 설계 및 TypeScript 활용도
- **실제 호출:** 라우팅 또는 컴포넌트 사용 여부
- **테스트 코드:** 커버리지 및 테스트 존재 여부
- **UI 구성:** 명확성 및 재사용성
- **코드 품질:** 길이, 주석, 구조화 정도

## 📦 처리 방식

| 판단 결과 | 처리 방법 |
|-----------|-----------|
| 기존이 더 좋음 | 새 코드를 archive로 이동 |
| 새 코드가 더 나음 | 기존 코드를 archive로 이동 |
| 일부씩 좋음 | 통합 버전을 새로 생성 |
| 완전히 불필요 | 모두 archive로 이동 |

## 🛠️ 자동화 스크립트

### 1. 분석 스크립트 (`scripts/compare-and-refactor.js`)
```javascript
// 중복 파일 그룹 정의
const duplicateGroups = [
  {
    name: 'ComponentName',
    files: [
      'src/path1/Component.tsx',
      'src/path2/Component.tsx'
    ]
  }
];

// 분석 기준
- 파일 크기 및 줄 수
- TypeScript 타입 정의
- React Hooks 사용
- Export 패턴
- 사용 횟수 검색
```

### 2. 실행 스크립트 (`scripts/execute-refactor.js`)
```javascript
// 실제 파일 이동
- 중복 파일 → archive/duplicates/
- 미사용 파일 → archive/unused/
- import 경로 업데이트
- 빌드 설정 수정
```

## 📁 생성 결과

### 문서
- `scripts/refactor-decision-log.md`: 비교 분석 결과
- `scripts/refactor-execution-report.md`: 실행 결과
- `scripts/refactor-final-summary.md`: 최종 요약

### 백업
- `archive/duplicates/`: 중복 파일 백업
- `archive/unused/`: 미사용 파일 백업

### 설정 업데이트
- `tsconfig.json`: archive 디렉토리 제외
- `next.config.ts`: 빌드에서 archive 제외

## 🚀 실행 순서

1. **분석 실행:**
   ```bash
   node scripts/compare-and-refactor.js
   ```

2. **결과 검토:**
   - `scripts/refactor-decision-log.md` 확인
   - 선택 기준 및 이유 검토

3. **실제 리팩토링:**
   ```bash
   node scripts/execute-refactor.js
   ```

4. **빌드 테스트:**
   ```bash
   npm run build
   npm run dev
   ```

## 📋 커밋 메시지 템플릿

```
refactor: 중복 파일 비교 후 선택/통합 정리

- X개 중복 컴포넌트 그룹 분석 및 최적 버전 선택
- Y개 미사용 파일 정리 (Z KB 절약)
- 컴포넌트 구조 최적화
- archive 디렉토리로 백업 보관
- 빌드 설정 최적화

성능 개선: 빌드 시간 단축, 번들 크기 감소
```

## ⚠️ 주의사항

1. **백업 필수:** 모든 변경사항은 archive에 백업
2. **테스트 필수:** 빌드 및 기능 테스트 반드시 수행
3. **점진적 적용:** 한 번에 너무 많은 파일 변경 금지
4. **복구 계획:** 문제 발생시 복구 방법 숙지

## 🎯 기대 효과

- **코드 크기 감소:** 중복 제거로 번들 크기 최적화
- **빌드 성능:** 불필요한 파일 제거로 빌드 시간 단축
- **유지보수성:** 명확한 구조로 개발 효율성 향상
- **타입 안전성:** 더 나은 TypeScript 활용 