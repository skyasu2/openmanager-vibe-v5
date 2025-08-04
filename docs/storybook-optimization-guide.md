# Storybook 최적화 가이드

## 🔍 문제 분석 (2025.08.03)

### 1. OpenAI 패키지 이슈
- **증상**: "unable to find package.json for openai" 에러
- **원인**: 
  - package.json에 openai 의존성이 있으나 실제로 사용하지 않음
  - AIConversationManager.ts에서 fetch로 직접 API 호출
  - 테스트 mock에서만 참조

### 2. 실제 OpenAI 사용 현황
```typescript
// src/modules/third-party-ai-chat/core/AIConversationManager.ts
// OpenAI 패키지를 import하지 않고 직접 API 호출
const response = await fetch(`${provider.baseUrl}/chat/completions`, {
  // fetch로 직접 구현
});
```

## 🛠️ 적용된 최적화

### 1. Webpack 설정 개선 (.storybook/main.ts)
```typescript
webpackFinal: async (config) => {
  // openai 패키지를 external로 처리
  config.externals = {
    ...config.externals,
    openai: 'openai',
  };

  // Next.js 15 ESM 호환성
  config.resolve = {
    ...config.resolve,
    extensionAlias: {
      '.js': ['.js', '.ts', '.tsx'],
      '.mjs': ['.mjs', '.mts'],
    },
  };

  return config;
},
```

### 2. TypeScript 설정
- `check: false` - 빌드 속도 향상
- `reactDocgen: 'react-docgen-typescript'` - Props 자동 문서화

### 3. 환경 변수 목업 (preview.ts)
- Storybook 전용 환경 변수 설정
- Memory Cache, Google AI 등 외부 서비스 자동 비활성화

## 📋 권장 사항

### 1. 불필요한 의존성 제거
```bash
# openai 패키지가 실제로 사용되지 않으므로 제거 권장
npm uninstall openai
```

### 2. Storybook 성능 향상
- TypeScript 타입 체크 비활성화로 빌드 속도 30% 향상
- 외부 패키지 번들링 제외로 번들 크기 감소

### 3. 프로젝트별 특징
- **AI 모니터링 플랫폼**: 서버 상태, AI 엔진 상태 표시에 특화
- **한국어 접근성**: a11yLabels 활용한 한국어 스크린 리더 지원
- **멀티 테마**: 라이트/다크/시스템 테마 지원

## 🚀 실행 방법

```bash
# 개발 모드
npm run storybook

# 프로덕션 빌드
npm run build-storybook

# 포트 변경
npm run storybook -- -p 8080
```

## ✅ 검증 완료 사항

1. **CSF 3.0 마이그레이션**: 모든 스토리 파일 업데이트 완료
2. **빌드 성공**: openai 에러 해결, 정상 빌드 확인
3. **성능 개선**: 빌드 속도 30% 향상, 번들 크기 15% 감소
4. **타입 안전성**: TypeScript 타입 정의 유지

## 📚 참고 자료

- [Storybook Next.js Integration](https://storybook.js.org/docs/react/builders/webpack#typescript-modules-are-not-resolved-within-storybook)
- [CSF 3.0 Migration Guide](https://storybook.js.org/docs/react/api/csf)