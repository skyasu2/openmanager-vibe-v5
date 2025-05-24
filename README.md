# OpenManager Vibe V5 🚀

> AI 기반 서버 모니터링과 관리를 통합한 차세대 서버 관리 솔루션

## ✨ 주요 특징

- **🤖 AI 기반 분석**: 머신러닝을 활용한 지능형 이상 탐지 및 예측 분석
- **📊 실시간 모니터링**: 서버 상태와 성능을 실시간으로 모니터링
- **🔔 스마트 알림**: 중요한 이벤트를 즉시 감지하고 다중 채널로 알림 전송
- **🛡️ 보안 강화**: 고급 보안 모니터링과 취약점 스캔
- **⚙️ 자동화**: 반복적인 관리 작업 자동화
- **☁️ 클라우드 통합**: AWS, Azure, GCP 등 주요 클라우드 플랫폼과 완벽 통합

## 🛠️ 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: CSS Modules (Tailwind CSS 미사용)
- **Icons**: Font Awesome 6
- **Fonts**: Noto Sans KR (Google Fonts)
- **Architecture**: App Router (Next.js 14)

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 18.0.0 이상
- npm 또는 yarn 패키지 매니저

### 설치 및 실행

```bash
# 저장소 복제
git clone https://github.com/your-username/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

## 📁 프로젝트 구조

```
openmanager-vibe-v5/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── dashboard/          # 대시보드 페이지
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   ├── page.tsx           # 메인 랜딩 페이지
│   │   └── globals.css        # 글로벌 스타일
│   ├── components/            # 재사용 가능한 컴포넌트
│   ├── styles/               # CSS Modules
│   │   └── landing.module.css # 랜딩 페이지 스타일
│   ├── types/                # TypeScript 타입 정의
│   ├── hooks/                # 커스텀 훅
│   └── lib/                  # 유틸리티 함수
├── public/                   # 정적 파일
├── docs/                     # 프로젝트 문서
└── README.md
```

## 🎨 디자인 시스템

### 컬러 팔레트

```css
:root {
  --primary: #1a73e8;          /* 메인 블루 */
  --primary-light: #e8f0fe;    /* 라이트 블루 */
  --primary-dark: #0d47a1;     /* 다크 블루 */
  --secondary: #34a853;        /* 그린 */
  --accent: #ea4335;           /* 레드 */
  --warning: #fbbc04;          /* 옐로우 */
}
```

### 애니메이션

- **fadeIn**: 부드러운 페이드인 효과
- **float**: 로고와 아이콘의 플로팅 애니메이션
- **gradientShift**: 배경 그라데이션 이동 효과
- **hover**: 카드와 버튼의 호버 효과

### 반응형 디자인

- **데스크톱**: 1200px 이상
- **태블릿**: 768px - 1199px
- **모바일**: 767px 이하

## 🔧 개발 가이드

### CSS Modules 사용법

```tsx
import styles from '@/styles/landing.module.css';

export default function Component() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>제목</h1>
    </div>
  );
}
```

### TypeScript 타입 정의

```typescript
interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}
```

### 애니메이션 적용

```tsx
<div className={`${styles.card} ${styles.fadeInUp}`}>
  콘텐츠
</div>
```

## 📱 반응형 특징

- **모바일 우선**: Mobile-first 디자인 접근법
- **플렉스 그리드**: CSS Grid와 Flexbox 조합
- **적응형 타이포그래피**: 화면 크기에 따른 폰트 크기 조정
- **터치 친화적**: 모바일 터치 인터페이스 최적화

## 🎯 주요 기능

### 1. 랜딩 페이지
- 그라데이션 배경 애니메이션
- 글래스모피즘 디자인
- 인터랙티브 기능 카드
- CTA 버튼 효과

### 2. 대시보드 (준비중)
- 실시간 서버 모니터링
- AI 기반 분석 도구
- 알림 및 경고 시스템

### 3. 반응형 네비게이션
- 모바일 햄버거 메뉴
- 부드러운 스크롤 효과
- 동적 활성 상태 표시

## 🔍 SEO 최적화

- **메타데이터**: 완벽한 Open Graph 및 Twitter Card 지원
- **시맨틱 HTML**: 접근성을 고려한 마크업
- **성능 최적화**: Next.js 14의 최신 최적화 기법 활용
- **다국어 지원**: 한국어 기본, 확장 가능한 구조

## 📊 성능 지표

- **Lighthouse Score**: 95+ (목표)
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1

## 🤝 기여하기

1. 이 저장소를 Fork 하세요
2. 새로운 기능 브랜치를 만드세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 Push 하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 열어주세요

## 📜 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🆘 지원

- **문서**: [OpenManager 문서](https://docs.openmanager.com)
- **이슈**: [GitHub Issues](https://github.com/your-username/openmanager-vibe-v5/issues)
- **커뮤니티**: [Discord 서버](https://discord.gg/openmanager)

## 🗺️ 로드맵

### v5.1 (다음 마이너 버전)
- [ ] 실제 대시보드 구현
- [ ] 사용자 인증 시스템
- [ ] 서버 연결 기능

### v5.2 (향후 계획)
- [ ] AI 분석 엔진 통합
- [ ] 실시간 알림 시스템
- [ ] 모바일 앱 연동

---

**OpenManager Vibe V5** - 서버 모니터링의 미래를 만들어갑니다! 🚀
