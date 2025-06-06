# 🛠️ OpenManager Vibe v5 개발 가이드

## 🚀 시작하기

### 📋 개발 환경 요구사항

- **Node.js**: 20.x 이상
- **npm**: 10.x 이상
- **Git**: 2.x 이상

### 🔧 프로젝트 설정

```bash
# 저장소 클론
git clone https://github.com/your-username/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 종속성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 파일 편집

# 개발 서버 실행
npm run dev
```

---

## 🔄 개발 워크플로우

### 📝 코드 작성 전

1. **이슈 확인**: GitHub Issues에서 작업할 이슈 선택
2. **브랜치 생성**: `feature/이슈번호-간단설명` 또는 `bugfix/이슈번호-간단설명`
3. **로컬 환경 검증**: `npm run dev`로 정상 작동 확인

### ✍️ 코드 작성 중

1. **컨벤션 준수**: ESLint, Prettier 규칙 준수
2. **타입 안전성**: TypeScript 타입 정의 충실히 작성
3. **테스트 작성**: 새 기능에 대한 단위 테스트 추가

### 🔍 코드 작성 후

1. **로컬 검증**:

   ```bash
   npm run validate:all  # 종합 검증
   npm run type-check    # 타입 체크만
   npm run lint          # ESLint만
   npm run test:unit     # 테스트만
   ```

2. **커밋 전 자동 검증** (pre-commit hook)

   - TypeScript 타입 체크
   - ESLint 검사
   - 코드 포맷팅

3. **푸시 전 자동 검증** (pre-push hook)
   - 전체 품질 검사
   - 빌드 테스트

---

## 📦 사용 가능한 스크립트

### 🏃‍♂️ 개발 스크립트

```bash
npm run dev              # 개발 서버 실행
npm run dev:standalone   # 독립 실행 모드
npm run dev:integrated   # 통합 모드
```

### 🧪 테스트 스크립트

```bash
npm run test:unit        # 단위 테스트
npm run test:e2e         # E2E 테스트
npm run test:all         # 모든 테스트
npm run test:ci          # CI 환경 테스트
```

### 🔍 품질 검사

```bash
npm run type-check       # TypeScript 타입 체크
npm run lint             # ESLint 검사
npm run lint:fix         # ESLint 자동 수정
npm run validate:all     # 종합 검증
npm run validate:quick   # 빠른 검증
```

### 🏗️ 빌드 스크립트

```bash
npm run build           # 프로덕션 빌드
npm run build:analyze   # 번들 분석
npm run start           # 프로덕션 서버 실행
```

### 🚀 배포 스크립트

```bash
npm run deploy:safe     # 안전한 배포 (검증 후)
npm run deploy:github   # GitHub Actions 트리거
npm run deploy:quick    # 빠른 배포
```

---

## 🏗️ 프로젝트 구조

```
openmanager-vibe-v5/
├── 📁 src/
│   ├── 📁 app/              # Next.js App Router
│   │   ├── 📁 api/          # API 라우트
│   │   ├── 📁 dashboard/    # 대시보드 페이지
│   │   └── 📁 admin/        # 관리자 페이지
│   ├── 📁 components/       # React 컴포넌트
│   │   ├── 📁 ui/           # 기본 UI 컴포넌트
│   │   ├── 📁 charts/       # 차트 컴포넌트
│   │   └── 📁 dashboard/    # 대시보드 컴포넌트
│   ├── 📁 lib/              # 유틸리티 라이브러리
│   ├── 📁 types/            # TypeScript 타입 정의
│   ├── 📁 services/         # 외부 서비스 연동
│   ├── 📁 modules/          # 기능별 모듈
│   └── 📁 hooks/            # React 커스텀 훅
├── 📁 public/              # 정적 파일
├── 📁 docs/                # 문서
├── 📁 scripts/             # 유틸리티 스크립트
└── 📁 tests/               # 테스트 파일
```

---

## 🎯 개발 규칙

### 📝 코딩 컨벤션

1. **파일명**: kebab-case (예: `server-card.tsx`)
2. **컴포넌트명**: PascalCase (예: `ServerCard`)
3. **함수명**: camelCase (예: `fetchServerData`)
4. **상수명**: UPPER_SNAKE_CASE (예: `MAX_RETRY_COUNT`)

### 🏷️ 커밋 메시지 규칙

```
type: 간단한 설명

자세한 설명 (선택사항)

- feat: 새로운 기능 추가
- fix: 버그 수정
- docs: 문서 수정
- style: 코드 포맷팅, 세미콜론 누락 등
- refactor: 코드 리팩토링
- test: 테스트 추가 또는 수정
- chore: 빌드 프로세스 또는 보조 도구 변경
```

### 🌿 브랜치 전략

- `main`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- `feature/이슈번호-설명`: 새 기능 브랜치
- `bugfix/이슈번호-설명`: 버그 수정 브랜치
- `hotfix/이슈번호-설명`: 핫픽스 브랜치

---

## 🔧 주요 기능 개발 가이드

### 🤖 AI 기능 개발

```typescript
// AI 서비스 예시
export class AIService {
  async predict(data: MetricData[]): Promise<PredictionResult> {
    // AI 예측 로직
  }
}
```

### 📊 차트 컴포넌트 개발

```typescript
// 차트 컴포넌트 예시
export const MetricChart: React.FC<ChartProps> = ({ data }) => {
  return (
    <Chart
      type="line"
      data={data}
      options={chartOptions}
    />
  );
};
```

### 🔄 실시간 데이터 처리

```typescript
// WebSocket 훅 예시
export const useRealTimeData = () => {
  const [data, setData] = useState();

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    ws.onmessage = event => {
      setData(JSON.parse(event.data));
    };

    return () => ws.close();
  }, []);

  return data;
};
```

---

## 🚨 트러블슈팅

### ❌ 일반적인 문제들

#### 1. TypeScript 에러

```bash
# 타입 정의 재설치
npm install --save-dev @types/node @types/react

# 타입 체크 실행
npm run type-check
```

#### 2. ESLint 에러

```bash
# 자동 수정
npm run lint:fix

# 수동 검토 필요한 에러
npm run lint
```

#### 3. 빌드 실패

```bash
# 캐시 클리어 후 재빌드
npm run clean
npm run build
```

#### 4. 테스트 실패

```bash
# 특정 테스트 실행
npm run test:unit -- --grep "테스트명"

# 테스트 디버깅
npm run test:unit -- --inspect
```

### 🆘 도움 요청

1. **GitHub Issues**: 새로운 버그 또는 기능 요청
2. **팀 채널**: 즉시 도움이 필요한 경우
3. **코드 리뷰**: Pull Request에서 피드백 요청

---

## 📚 참고 자료

- [Next.js 공식 문서](https://nextjs.org/docs)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs)
- [React 공식 문서](https://react.dev)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [Supabase 문서](https://supabase.com/docs)

---

## 🔄 정기 작업

### 📅 주간 작업

- [ ] 종속성 업데이트 확인
- [ ] 보안 취약점 스캔
- [ ] 성능 지표 검토

### 📅 월간 작업

- [ ] 코드 품질 지표 검토
- [ ] 기술 부채 정리
- [ ] 문서 업데이트

---

**💡 팁**: 개발 중 문제가 발생하면 먼저 이 가이드를 확인하고, 해결되지 않으면 팀에 문의하세요!
