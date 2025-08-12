# Storybook 성능 최적화 가이드

## 🚀 적용된 최적화 사항

### 1. 스토리 파일 스캔 범위 제한
```typescript
stories: [
  '../src/components/**/*.stories.@(ts|tsx)',
  '../src/stories/**/*.stories.@(ts|tsx)',
]
```
- 전체 src 폴더 대신 특정 디렉토리만 스캔
- 불필요한 파일 검색 시간 단축

### 2. 불필요한 Addon 제거
- `@storybook/addon-onboarding` 제거
- 필수 addon만 유지 (docs, a11y)

### 3. 성능 기능 활성화
```typescript
features: {
  buildStoriesJson: true,  // 스토리 인덱싱 최적화
  storyStoreV7: true,      // 새로운 스토리 스토어
}
```

### 4. Webpack 캐시 설정
```typescript
config.cache = {
  type: 'filesystem',
  buildDependencies: {
    config: [__filename],
  },
}
```
- 파일시스템 캐시로 재빌드 시간 단축
- 의존성 변경 시에만 캐시 무효화

### 5. 번들 분할 최적화
```typescript
splitChunks: {
  chunks: 'all',
  cacheGroups: {
    vendor: {
      name: 'vendor',
      chunks: 'all',
      test: /node_modules/,
      priority: 20,
    },
    common: {
      minChunks: 2,
      priority: 10,
      reuseExistingChunk: true,
      enforce: true,
    },
  },
}
```

### 6. TypeScript 검사 비활성화
```typescript
typescript: {
  check: false,      // 타입 체크 비활성화
  reactDocgen: false, // 문서 생성 비활성화
}
```

## 📊 성능 개선 결과 예상

- **초기 빌드**: 2-3분 → 30-60초
- **재빌드**: 30초 → 5-10초
- **메모리 사용량**: 30-40% 감소
- **개발 서버 시작**: 60초 → 20-30초

## 🔧 추가 최적화 팁

### 1. 개발 시 특정 스토리만 로드
```bash
# 특정 컴포넌트 스토리만 실행
npm run storybook -- --stories="**/Button.stories.tsx"
```

### 2. 프로덕션 빌드 최적화
```bash
# 프로덕션 빌드 시에만 최적화 활성화
NODE_ENV=production npm run build-storybook
```

### 3. 큰 스토리 파일 분할
- 한 파일에 10개 이상의 스토리가 있다면 분할 고려
- 카테고리별로 별도 파일 생성

## 🚨 주의사항

1. **캐시 문제 발생 시**
   ```bash
   rm -rf node_modules/.cache/storybook
   ```

2. **스토리가 표시되지 않을 때**
   - stories 경로 패턴 확인
   - 파일명이 `.stories.tsx` 형식인지 확인

3. **메모리 부족 시**
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run storybook
   ```

## 📈 모니터링

빌드 시간 측정:
```bash
time npm run build-storybook
```

번들 크기 분석:
```bash
npm run build-storybook -- --webpack-stats-json
npx webpack-bundle-analyzer storybook-static/stats.json
```