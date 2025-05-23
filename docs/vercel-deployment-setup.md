# Vercel 배포 설정 가이드

OpenManager Vibe V5 프로젝트를 Vercel에 배포하기 위한 단계별 가이드입니다.

## 사전 준비사항

### 1. 필수 계정

- [GitHub](https://github.com/) 계정
- [Vercel](https://vercel.com/) 계정
- [Upstash](https://upstash.com/) 계정
- [Supabase](https://supabase.com/) 계정

### 2. 필수 도구

- Git
- Node.js 18.17 이상
- npm 또는 yarn

## 배포 단계

### 1. 코드 저장소 설정

1. GitHub에서 프로젝트 저장소를 복제합니다:

```bash
git clone https://github.com/your-username/openmanager-vibe-v5.git
cd openmanager-vibe-v5
```

2. 의존성을 설치합니다:

```bash
npm install
# 또는
yarn install
```

### 2. Upstash Redis 설정

1. [Upstash 콘솔](https://console.upstash.com/)에 로그인합니다.
2. 새 Redis 데이터베이스를 생성합니다:
   - 지역: 애플리케이션에 가장 가까운 지역 선택
   - 이름: `openmanager-vibe-v5`
3. 생성된 데이터베이스의 연결 정보를 확인합니다:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 3. Supabase 설정

1. [Supabase 대시보드](https://app.supabase.io/)에 로그인합니다.
2. 새 프로젝트를 생성합니다:
   - 이름: `openmanager-vibe-v5`
   - 데이터베이스 비밀번호 설정
   - 지역: 애플리케이션에 가장 가까운 지역 선택
3. 프로젝트 생성이 완료되면 다음 정보를 확인합니다:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

4. 필요한 테이블을 생성합니다:

```sql
-- servers 테이블: 모니터링 대상 서버 정보
CREATE TABLE public.servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  hostname VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- metrics 테이블: 성능 메트릭 데이터
CREATE TABLE public.metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID REFERENCES public.servers(id),
  key VARCHAR NOT NULL,
  data JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- alerts 테이블: 알림 기록
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID REFERENCES public.servers(id),
  type VARCHAR NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);
```

### 4. Vercel 배포 설정

1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인합니다.
2. "New Project" 버튼을 클릭합니다.
3. GitHub 저장소를 가져옵니다:
   - 저장소 목록에서 `openmanager-vibe-v5`를 찾아 선택합니다.
   - "Import" 버튼을 클릭합니다.

4. 프로젝트 설정:
   - 프레임워크 프리셋: Next.js
   - 루트 디렉토리: ./
   - 빌드 명령: 기본값 유지

5. 환경 변수 설정:
   - `UPSTASH_REDIS_REST_URL`: Upstash에서 복사한 URL
   - `UPSTASH_REDIS_REST_TOKEN`: Upstash에서 복사한 토큰
   - `SUPABASE_URL`: Supabase 프로젝트 URL
   - `SUPABASE_ANON_KEY`: Supabase 익명 키
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase 서비스 역할 키
   - `NEXT_PUBLIC_APP_URL`: 배포된 애플리케이션 URL (e.g., `https://openmanager-vibe-v5.vercel.app`)

6. "Deploy" 버튼을 클릭하여 배포를 시작합니다.

### 5. 배포 확인 및 테스트

1. 배포가 완료되면 제공된 URL로 접속하여 애플리케이션이 정상적으로 작동하는지 확인합니다.
2. 다음 엔드포인트를 테스트합니다:
   - `/api/health` - 상태 확인
   - `/api/monitoring/servers` - 서버 목록 확인
   - `/dashboard` - 대시보드 접속

## 지속적 배포 설정

Vercel은 기본적으로 GitHub 저장소와 연결되어 있어, 코드가 메인 브랜치에 푸시될 때마다 자동으로 배포가 진행됩니다.

### 브랜치별 환경 설정

다양한 환경(개발, 스테이징, 프로덕션)을 위한 설정:

1. Vercel 프로젝트 설정 페이지의 "Git" 탭으로 이동합니다.
2. "Production Branch"를 `main`으로 설정합니다.
3. "Preview Branch Deployments"를 활성화합니다.

이제 다음과 같이 브랜치에 따라 자동으로 환경이 구분됩니다:
- `main` 브랜치: 프로덕션 환경
- `dev` 브랜치: 개발 환경
- 기타 브랜치: 프리뷰 환경

### 환경별 변수 설정

각 환경에 맞는 환경 변수를 설정하려면:

1. Vercel 프로젝트 설정 페이지의 "Environment Variables" 탭으로 이동합니다.
2. 환경 변수를 추가할 때 "Environment"를 선택합니다:
   - Production: 프로덕션 환경에만 적용
   - Preview: 프리뷰 배포에만 적용
   - Development: 로컬 개발 환경에만 적용

## 문제 해결

### 배포 실패

1. **빌드 오류**:
   - Vercel 대시보드에서 배포 로그 확인
   - 로컬에서 `npm run build`를 실행하여 문제 재현 및 해결

2. **환경 변수 문제**:
   - 모든 필수 환경 변수가 올바르게 설정되었는지 확인
   - 환경 변수 이름이 코드의 참조와 일치하는지 확인

3. **API 오류**:
   - Vercel 대시보드의 "Functions" 탭에서 함수 로그 확인
   - 서버리스 함수 제한 시간(10초) 초과 여부 확인

### 성능 문제

1. **콜드 스타트 지연**:
   - 자주 액세스하는 API 경로에 `_middleware.ts` 파일 추가
   - Upstash Redis 캐싱 전략 최적화

2. **데이터베이스 연결 문제**:
   - Supabase 대시보드에서 연결 수 및 쿼리 성능 확인
   - 연결 풀링 구현 여부 확인

## 배포 모범 사례

1. **환경 변수 관리**:
   - 로컬 개발을 위해 `.env.local` 파일 사용
   - 비밀은 절대 저장소에 커밋하지 않음
   - 팀 내에서 안전하게 환경 변수 공유 (예: Vercel 팀 설정)

2. **미리보기 배포 활용**:
   - PR 생성 시 자동으로 생성되는 미리보기 URL로 변경사항 테스트
   - 테스트 후 문제가 없을 때만 메인 브랜치에 병합

3. **실패 안전 배포**:
   - 중요한 변경사항은 점진적으로 출시
   - 롤백 계획 준비
   - 배포 후 자동화된 테스트 실행