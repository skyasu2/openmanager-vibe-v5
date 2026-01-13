# Tailwind v4 CSS 호환성 가이드

**Version**: v1.0.0
**Last Updated**: 2025-12-20

## 개요

Tailwind v4에서 발견된 호환성 이슈와 해결 방법을 문서화합니다.

---

## 🚨 알려진 이슈

### 1. Gradient Animation 충돌

**문제**: Tailwind gradient 클래스와 `background-position` 애니메이션이 충돌

```tsx
// ❌ 작동하지 않음 - Tailwind v4에서 gradient가 animation과 충돌
<span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-gradient">
  AI
</span>
```

**원인**: Tailwind v4에서 gradient 클래스가 background shorthand를 사용하여 animation의 `background-position` 변경을 덮어씀

**해결**: 인라인 스타일로 gradient + animation 적용

```tsx
// ✅ 올바른 방법 - 인라인 스타일 사용
<span
  className="bg-clip-text font-bold text-transparent"
  style={{
    background: 'linear-gradient(135deg, #60a5fa, #6366f1, #9333ea)',
    backgroundSize: '200% 200%',
    animation: 'gradient-shift 3s ease-in-out infinite',
    WebkitBackgroundClip: 'text',
  }}
>
  AI
</span>
```

---

## ✅ 프로젝트 표준 솔루션

### design-constants.ts 상수 사용

```typescript
import {
  AI_GRADIENT_ANIMATED_STYLE,
  AI_ICON_GRADIENT_ANIMATED_STYLE,
} from '@/styles/design-constants';

// 텍스트 그라데이션 애니메이션
<span style={AI_GRADIENT_ANIMATED_STYLE}>AI</span>

// 아이콘 그라데이션 애니메이션
<div style={AI_ICON_GRADIENT_ANIMATED_STYLE}>
  <Icon />
</div>
```

### text-rendering.tsx 유틸리티 사용

```tsx
import { renderAIGradientWithAnimation } from '@/utils/text-rendering';

// 텍스트 내 AI 단어에 자동으로 그라데이션 적용
<h3>{renderAIGradientWithAnimation('AI 기반 모니터링')}</h3>
```

---

## 🎨 CSS Keyframes 정의

`src/app/globals.css`에 정의된 keyframes:

```css
@keyframes gradient-shift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes ai-icon-gradient {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}
```

---

## 📁 관련 파일

| 파일 | 용도 |
|------|------|
| `src/styles/design-constants.ts` | 그라데이션 스타일 상수 정의 |
| `src/utils/text-rendering.tsx` | AI 텍스트 렌더링 유틸리티 |
| `src/app/globals.css` | CSS keyframes 정의 |
| `src/components/home/FeatureCardsGrid.tsx` | 적용 예시 |

---

## 🔍 디버깅 체크리스트

1. **애니메이션이 작동하지 않을 때**:
   - [ ] Tailwind gradient 클래스 대신 인라인 스타일 사용 확인
   - [ ] `backgroundSize: '200% 200%'` 설정 확인
   - [ ] CSS keyframes가 globals.css에 정의되어 있는지 확인

2. **텍스트가 보이지 않을 때**:
   - [ ] `WebkitBackgroundClip: 'text'` 설정 확인
   - [ ] `text-transparent` 클래스 적용 확인

3. **SSR/Hydration 오류 발생 시**:
   - [ ] `isMounted` 상태로 클라이언트 마운트 후 스타일 적용
   - [ ] 서버/클라이언트 렌더링 결과 일치 확인

---

## 변경 이력

- **2025-12-20**: v1.0.0 - 초기 문서 작성
  - Gradient animation 충돌 이슈 문서화
  - 프로젝트 표준 솔루션 정의
