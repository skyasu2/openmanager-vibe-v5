# 🔧 개발 환경 보안 설정 가이드

## 📋 **개요**

OpenManager Vibe v5.9.0은 개발 테스트 및 시연을 위해 보안 정책을 완화할 수 있도록 설계되었습니다.

## 🛡️ **보안 정책 차이**

### 개발 환경 (Development)
```typescript
// next.config.ts
const isDevelopment = process.env.NODE_ENV === 'development';

// 개발 환경에서는 CSP 완전 해제
...(isDevelopment ? [] : [CSP_HEADERS])
```

- ✅ **CSP 해제**: Content Security Policy 비활성화
- ✅ **외부 CDN 허용**: 모든 도메인 리소스 로딩 가능
- ✅ **Frame 정책 완화**: iframe 삽입 허용
- ✅ **스크립트 실행**: unsafe-eval, unsafe-inline 허용

### 프로덕션 환경 (Production)
- 🔒 **엄격한 CSP**: 허용된 도메인만 리소스 로딩
- 🔒 **Frame 보호**: iframe 삽입 차단
- 🔒 **스크립트 제한**: 인라인 스크립트 차단
- 🔒 **XSS 보호**: 모든 보안 헤더 활성화

## 🎨 **외부 리소스 활용**

### Google Fonts
```css
/* globals.css - 개발 환경에서 활성화 */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap');
```

### Font Awesome
```css
/* CDN 로딩 */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
```

### 혼합 아이콘 시스템
```typescript
// Lucide React + Font Awesome 동시 지원
const renderIcon = (iconName: string) => {
  switch (iconName) {
    case 'MessageCircle': return <MessageCircle />;     // Lucide
    case 'fa-brain': return <i className="fas fa-brain"></i>; // Font Awesome
  }
};
```

## 🚀 **개발 서버 실행**

```bash
# 개발 모드 (보안 완화)
npm run dev
# ➡️ localhost:3000 (CSP 해제됨)

# 프로덕션 모드 (보안 강화)
npm run build && npm start
# ➡️ localhost:3000 (CSP 활성화됨)
```

## 🎯 **시연 환경 최적화**

### 장점
- ✅ **모든 CDN 리소스 로딩 가능**
- ✅ **브라우저 개발자 도구 에러 없음**
- ✅ **완전한 UI/UX 기능 체험**
- ✅ **외부 위젯/플러그인 테스트 가능**

### 주의사항
- ⚠️ **개발 환경에서만 사용**
- ⚠️ **프로덕션 배포 시 보안 정책 자동 적용**
- ⚠️ **외부 스크립트 실행 주의**

## 🔄 **환경 전환**

```bash
# 개발 → 프로덕션
NODE_ENV=production npm run build
NODE_ENV=production npm start

# 프로덕션 → 개발
NODE_ENV=development npm run dev
```

## 📊 **보안 체크리스트**

| 항목 | 개발 환경 | 프로덕션 |
|------|----------|----------|
| CSP 정책 | 🔓 해제 | 🔒 활성화 |
| 외부 CDN | ✅ 허용 | 🔍 검증됨 |
| Frame 삽입 | ✅ 허용 | ❌ 차단 |
| 인라인 스크립트 | ✅ 허용 | ❌ 차단 |
| XSS 보호 | 🟡 기본 | 🔒 강화 |

---

**🎉 완료**: 개발 환경에서 보안 정책이 완화되어 모든 외부 리소스를 자유롭게 사용할 수 있습니다! 