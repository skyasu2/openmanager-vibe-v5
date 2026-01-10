# P1: Console 정리 작업계획서

**작성일**: 2026-01-10
**버전**: v5.84.2
**기반**: 웹 리서치 베스트 프랙티스 분석

---

## 1. 로깅 라이브러리 비교 분석

### 조사 대상
| 라이브러리 | GitHub Stars | 특징 |
|-----------|:------------:|------|
| **Pino** | 14k+ | 가장 빠른 성능 (5-10x Winston) |
| Winston | 22k+ | 가장 유연한 설정 |
| Bunyan | 7k+ | JSON 중심, 안정적 |
| tslog | 1k+ | TypeScript 네이티브 |

### Next.js 환경 호환성

| 라이브러리 | Server-side | Client-side | Edge Runtime |
|-----------|:-----------:|:-----------:|:------------:|
| **Pino** | ✅ | ✅ | ✅ |
| Winston | ✅ | ❌ (fs 의존) | ❌ |
| Bunyan | ✅ | ❌ | ❌ |
| tslog | ✅ | ✅ | ⚠️ |

### 성능 벤치마크 (ops/sec)

```
Pino      ████████████████████ 76,000
tslog     ██████████           38,000
Winston   ████                 16,000
Bunyan    ███                  12,000
console   ██                    8,000
```

### 결론: **Pino 선택**

**선택 이유:**
1. **성능**: 가장 빠름 (5-10x Winston)
2. **Next.js 공식 추천**: Next.js 팀에서 권장
3. **Client/Server 양쪽 지원**: Winston의 'fs' 문제 없음
4. **JSON 기본 출력**: 구조화된 로깅에 최적
5. **Edge Runtime 호환**: Vercel Edge Functions 지원
6. **낮은 오버헤드**: 프로덕션 성능 영향 최소화

---

## 2. 현재 상태 분석

### Console 사용량 (총 1,603개)

| 타입 | 개수 | 비율 |
|------|:----:|:----:|
| `console.log` | 784 | 49% |
| `console.error` | 475 | 30% |
| `console.warn` | 302 | 19% |
| `console.debug` | 5 | 0.3% |
| `console.info` | 37 | 2% |

### 디렉토리별 분포

| 디렉토리 | 파일 수 | 예상 작업량 |
|----------|:------:|:----------:|
| services/ | 52 | 높음 |
| lib/ | 48 | 높음 |
| hooks/ | 35 | 중간 |
| app/api/ | 32 | 중간 |
| components/ | 28 | 낮음 |
| utils/ | 21 | 낮음 |
| 기타 | 39 | 낮음 |

---

## 3. 구현 계획

### Phase 1: 로거 인프라 구축 (30분)

#### 3.1 패키지 설치
```bash
npm install pino pino-pretty
npm install -D @types/pino
```

#### 3.2 로거 모듈 생성

**파일 구조:**
```
src/lib/logger/
├── index.ts          # 메인 진입점
├── config.ts         # 환경별 설정
├── browser.ts        # 클라이언트 로거
└── server.ts         # 서버 로거
```

**API 설계:**
```typescript
import { logger } from '@/lib/logger';

// 레벨별 로깅
logger.debug('상세 디버그 정보');
logger.info('일반 정보');
logger.warn('경고');
logger.error('에러', { context: {} });

// 자식 로거 (모듈별)
const apiLogger = logger.child({ module: 'api' });
apiLogger.info('API 요청 처리');
```

#### 3.3 환경별 설정

| 환경 | 레벨 | 출력 형식 |
|------|------|----------|
| development | debug | pino-pretty (컬러) |
| production | info | JSON (구조화) |
| test | silent | 없음 |

### Phase 2: 자동화 마이그레이션 스크립트 (1시간)

#### 3.4 마이그레이션 스크립트 생성

```typescript
// scripts/migrate-console-to-logger.ts
const CONSOLE_MAPPINGS = {
  'console.log': 'logger.info',
  'console.error': 'logger.error',
  'console.warn': 'logger.warn',
  'console.debug': 'logger.debug',
  'console.info': 'logger.info',
};
```

**자동화 범위:**
- ✅ 단순 console.log → logger.info 변환
- ✅ console.error → logger.error 변환
- ✅ import 문 자동 추가
- ⚠️ 수동 검토 필요: 복잡한 로깅 패턴

### Phase 3: 점진적 마이그레이션 (3-4시간)

#### 우선순위 순서

1. **app/api/** (32 파일) - API 라우트 먼저
2. **services/** (52 파일) - 핵심 서비스
3. **lib/** (48 파일) - 라이브러리
4. **hooks/** (35 파일) - React 훅
5. **components/** (28 파일) - UI 컴포넌트
6. **utils/** (21 파일) - 유틸리티

### Phase 4: 린트 규칙 적용 (15분)

#### 3.5 Biome 설정

```json
// biome.json
{
  "linter": {
    "rules": {
      "suspicious": {
        "noConsole": "error"
      }
    }
  }
}
```

**예외 처리:**
- `src/lib/logger/` - 로거 구현 파일
- `scripts/` - 개발 스크립트
- `*.test.ts` - 테스트 파일

---

## 4. 로거 구현 상세

### 4.1 서버 로거 (src/lib/logger/server.ts)

```typescript
import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

export const serverLogger = pino({
  level: isDev ? 'debug' : 'info',
  transport: isDev ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
    }
  } : undefined,
  base: {
    env: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
  },
});
```

### 4.2 브라우저 로거 (src/lib/logger/browser.ts)

```typescript
const levels = ['debug', 'info', 'warn', 'error'] as const;
const minLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug';

export const browserLogger = {
  debug: (...args) => shouldLog('debug') && console.debug(...args),
  info: (...args) => shouldLog('info') && console.info(...args),
  warn: (...args) => shouldLog('warn') && console.warn(...args),
  error: (...args) => shouldLog('error') && console.error(...args),
};
```

### 4.3 통합 진입점 (src/lib/logger/index.ts)

```typescript
import { serverLogger } from './server';
import { browserLogger } from './browser';

export const logger = typeof window === 'undefined'
  ? serverLogger
  : browserLogger;
```

---

## 5. 예상 결과

### Before vs After

| 지표 | Before | After |
|------|:------:|:-----:|
| console 사용 | 1,603개 | ~50개 (예외) |
| 프로덕션 로그 출력 | 모든 console.log | warn/error만 |
| 로그 구조화 | ❌ | ✅ JSON |
| 모듈별 추적 | ❌ | ✅ child logger |

### 성능 영향

- **번들 사이즈**: +~15KB (pino)
- **런타임 성능**: 개선 (프로덕션 로그 감소)
- **디버깅**: 동일 (개발 환경)

---

## 6. 실행 일정

| 단계 | 예상 시간 | 체크 |
|------|:--------:|:----:|
| Phase 1: 인프라 구축 | 30분 | ⬜ |
| Phase 2: 스크립트 작성 | 1시간 | ⬜ |
| Phase 3: 마이그레이션 | 3-4시간 | ⬜ |
| Phase 4: 린트 규칙 | 15분 | ⬜ |
| 검증 및 테스트 | 30분 | ⬜ |

**총 예상: 5-6시간**

---

## 7. 검증 체크리스트

- [ ] `npm run build` 성공
- [ ] `npm run test:quick` 통과
- [ ] 개발 환경에서 로그 출력 확인
- [ ] 프로덕션 빌드에서 로그 레벨 확인
- [ ] Biome noConsole 규칙 적용 확인

---

**작성 완료**: 2026-01-10
