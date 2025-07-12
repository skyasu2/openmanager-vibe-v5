# 🚀 Gemini CLI 개발도구

TypeScript 기반의 모듈화된 Gemini CLI 통합 개발도구입니다.

## ⚠️ 중요 사항

- **로컬 개발 전용**: 이 도구는 로컬 개발 환경에서만 사용됩니다
- **Vercel 배포 제외**: 프로덕션 빌드에서 자동으로 제외됩니다
- **재사용 가능**: 모듈화된 구조로 다른 프로젝트에서도 활용 가능

## 📁 프로젝트 구조

```
src/dev-tools/gemini-cli/
├── core/                           # 핵심 모듈
│   ├── types.ts                   # TypeScript 타입 정의
│   └── GeminiCLIManager.ts        # Gemini CLI 관리자
├── modules/                        # 기능별 모듈
│   ├── CodeAnalyzer.ts            # 코드 분석 모듈
│   ├── GitReviewer.ts             # Git 리뷰 모듈
│   ├── ProjectAnalyzer.ts         # 프로젝트 분석 모듈 (예정)
│   └── DocumentGenerator.ts       # 문서 생성 모듈 (예정)
├── cli/                           # CLI 인터페이스
│   └── index.ts                   # CLI 진입점
├── utils/                         # 유틸리티 (예정)
│   ├── fileUtils.ts              # 파일 유틸리티
│   ├── gitUtils.ts               # Git 유틸리티
│   └── promptUtils.ts            # 프롬프트 유틸리티
└── README.md                      # 이 파일
```

## 🚀 빠른 시작

### 1. 사전 요구사항

- Node.js 22+ (개발 환경)
- Gemini CLI 설치 및 로그인
- TypeScript 지원

### 2. 설치

```bash
# Gemini CLI 설치 (글로벌)
npm install -g @google/gemini-cli

# 로그인
gemini login
```

### 3. 사용법

#### 코드 분석

```bash
# 기본 분석
npm run gemini:analyze

# 특정 패턴 분석
npm run gemini:analyze -- --patterns "src/**/*.ts" --depth comprehensive

# 보안 중심 분석
npm run gemini:analyze -- --types security --output security-report.md
```

#### Git 리뷰

```bash
# 현재 변경사항 리뷰
npm run gemini:review

# 특정 브랜치 리뷰
npm run gemini:review -- --target feature/new-feature --base main

# 보안 중심 리뷰
npm run gemini:review -- --type security --output review-report.md
```

#### 상태 확인

```bash
# Gemini CLI 상태 확인
npm run gemini:status

# 확장 도움말
npm run gemini:help
```

## 📊 기능 상세

### 코드 분석 (CodeAnalyzer)

**기능:**
- 다중 파일 패턴 지원
- 언어별 분석
- 품질/보안/성능 평가
- 아키텍처 분석
- 개선 추천

**옵션:**
- `--patterns`: 분석할 파일 패턴 (기본: `src/**/*.{ts,tsx,js,jsx}`)
- `--depth`: 분석 깊이 (`basic`, `detailed`, `comprehensive`)
- `--types`: 분석 유형 (`structure`, `quality`, `security`, `performance`)
- `--format`: 출력 형식 (`markdown`, `json`, `text`)
- `--output`: 출력 파일 경로

**결과 예시:**
```
📊 분석 결과 요약:
• 총 파일: 45개
• 총 라인: 3,247줄
• 품질 점수: 8/10
• 보안 이슈: 2개
• 성능 이슈: 1개

💡 주요 추천사항:
• [높음] TypeScript 타입 안전성 개선
• [중간] 컴포넌트 재사용성 향상
• [낮음] 주석 추가
```

### Git 리뷰 (GitReviewer)

**기능:**
- Git diff 자동 분석
- 파일별 상세 리뷰
- 위험도 평가
- 커밋 메시지 제안
- 종합 피드백

**옵션:**
- `--target`: 리뷰할 브랜치/커밋
- `--base`: 베이스 브랜치 (기본: `main`)
- `--type`: 리뷰 유형 (`changes`, `full`, `security`, `performance`)
- `--exclude`: 제외할 파일 패턴
- `--output`: 출력 파일 경로

**결과 예시:**
```
🔍 리뷰 결과 요약:
• 변경된 파일: 3개
• 추가된 라인: 127줄
• 삭제된 라인: 45줄
• 위험도: 중간
• 전체 점수: 7/10

💬 제안 커밋 메시지:
"feat: 사용자 인증 시스템 개선 및 보안 강화"

💡 주요 추천사항:
• 입력 검증 로직 추가
• 에러 핸들링 개선
• 테스트 케이스 추가
```

## 🔧 설정

### 환경 변수

```bash
# 개발 모드 (자동 설정)
NODE_ENV=development

# Gemini CLI 경로 (선택적)
GEMINI_CLI_PATH=gemini

# 로그 레벨 (선택적)
GEMINI_LOG_LEVEL=info
```

### TypeScript 설정

`tsconfig.json`에서 다음 설정이 권장됩니다:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  },
  "include": [
    "src/dev-tools/**/*"
  ]
}
```

## 🚀 확장 가능성

### 새로운 모듈 추가

1. `modules/` 디렉토리에 새 모듈 생성
2. `core/types.ts`에 타입 정의 추가
3. `cli/index.ts`에 명령어 추가

**예시 모듈:**
```typescript
// modules/CustomAnalyzer.ts
export class CustomAnalyzer {
  constructor(private gemini: GeminiCLIManager) {}
  
  async analyze(options: CustomOptions): Promise<ModuleResult<CustomResult>> {
    // 구현
  }
}
```

### CLI 명령어 추가

```typescript
// cli/index.ts
program
  .command('custom')
  .description('커스텀 분석')
  .action(async (options) => {
    const analyzer = new CustomAnalyzer(gemini);
    const result = await analyzer.analyze(options);
    // 결과 처리
  });
```

## 📚 API 참조

### GeminiCLIManager

**주요 메서드:**
- `executeQuery(query: GeminiQuery): Promise<GeminiResponse>`
- `executeWithFileReference(files: string[], prompt: string): Promise<GeminiResponse>`
- `executeBatch(queries: GeminiQuery[]): Promise<GeminiResponse[]>`
- `healthCheck(): Promise<boolean>`
- `getStats(): object`

### 타입 정의

**GeminiQuery:**
```typescript
interface GeminiQuery {
  prompt: string;
  input?: string;
  fileReferences?: string[];
  context?: Record<string, any>;
}
```

**ModuleResult:**
```typescript
interface ModuleResult<T = any> {
  data: T;
  metadata: {
    executionTime: number;
    processedFiles: number;
    outputSize: number;
    geminiCalls: number;
  };
  success: boolean;
  errors?: string[];
  warnings?: string[];
}
```

## 🔒 보안 고려사항

- **환경 격리**: 개발 환경에서만 실행
- **Vercel 차단**: 프로덕션 배포 자동 방지
- **파일 접근**: 프로젝트 루트 내로 제한
- **토큰 관리**: Gemini CLI 일일 제한 (1,000회) 준수

## 🚫 제한사항

- **로컬 전용**: 서버 환경에서 실행 불가
- **파일 크기**: 대용량 파일 처리 시 메모리 주의
- **API 제한**: Gemini CLI 일일 사용량 제한
- **의존성**: Node.js 22+ 및 Gemini CLI 필수

## 🛠️ 문제 해결

### 일반적인 문제

1. **"Gemini CLI 연결 실패"**
   ```bash
   # Gemini CLI 설치 확인
   gemini --version
   
   # 로그인 상태 확인
   gemini login
   ```

2. **"개발 환경에서만 사용 가능"**
   ```bash
   # NODE_ENV 확인
   echo $NODE_ENV
   
   # 개발 모드로 설정
   export NODE_ENV=development
   ```

3. **"모듈을 찾을 수 없음"**
   ```bash
   # TypeScript 컴파일
   npm run build
   
   # 의존성 설치
   npm install
   ```

## 📈 성능 최적화

- **배치 처리**: 여러 파일을 배치로 처리
- **캐싱**: 반복 분석 시 결과 캐싱
- **병렬 처리**: 독립적인 작업 병렬 실행
- **메모리 관리**: 대용량 파일 스트리밍 처리

## 🔄 업데이트 및 마이그레이션

새 버전 업데이트 시:

1. 타입 정의 변경사항 확인
2. 모듈 인터페이스 호환성 검토
3. CLI 명령어 변경사항 반영
4. 기존 결과 파일 마이그레이션

---

## 📝 라이센스

이 도구는 프로젝트의 개발 생산성 향상을 위한 내부 도구로 제작되었습니다.

**생성일**: 2025-07-12  
**버전**: 1.0.0  
**상태**: 개발 중 (로컬 전용)