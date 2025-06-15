# 📝 **OpenManager Vibe v5 네이밍 컨벤션 가이드**

## 🎯 **목표**

- 일관성 있는 코드베이스 유지
- 가독성 및 유지보수성 향상
- 팀 협업 효율성 증대

## 📁 **파일 및 디렉토리 네이밍**

### TypeScript/JavaScript 파일

```
✅ 올바른 예시:
- UserService.ts (PascalCase for classes)
- utils-functions.ts (kebab-case for utilities)
- ai-engine.types.ts (kebab-case with descriptive suffix)

❌ 잘못된 예시:
- userservice.ts
- Utils_Functions.ts
- aiEngineTypes.ts
```

### React 컴포넌트

```
✅ 올바른 예시:
- UserProfile.tsx (PascalCase)
- ServerCard.tsx
- AIResponseModal.tsx

❌ 잘못된 예시:
- userProfile.tsx
- server-card.tsx
- ai_response_modal.tsx
```

### API 라우트

```
✅ 올바른 예시:
- /api/ai/prediction/route.ts
- /api/servers/[id]/route.ts
- /api/auth/login/route.ts

❌ 잘못된 예시:
- /api/AI/Prediction/route.ts
- /api/servers_status/route.ts
```

## 🔤 **변수 및 함수 네이밍**

### 변수명

```typescript
✅ 올바른 예시:
const userName = 'john';           // camelCase
const API_BASE_URL = 'https://';   // SCREAMING_SNAKE_CASE for constants
const isUserLoggedIn = true;       // boolean prefix: is, has, can, should

❌ 잘못된 예시:
const user_name = 'john';
const apibaseurl = 'https://';
const userLoggedIn = true;
```

### 함수명

```typescript
✅ 올바른 예시:
function getUserProfile() {}       // camelCase, verb + noun
function validateUserInput() {}    // descriptive action
async function fetchServerData() {} // async prefix when applicable

❌ 잘못된 예시:
function get_user_profile() {}
function validate() {}             // too generic
function serverData() {}           // missing action verb
```

### 클래스명

```typescript
✅ 올바른 예시:
class UserService {}               // PascalCase, noun
class AIEngineManager {}           // descriptive and specific
class DatabaseConnection {}        // clear purpose

❌ 잘못된 예시:
class userService {}
class AI_Engine {}
class DB {}                        // too abbreviated
```

## 🏷️ **타입 및 인터페이스 네이밍**

### 인터페이스

```typescript
✅ 올바른 예시:
interface User {                   // PascalCase, no 'I' prefix
  id: string;
  name: string;
}

interface APIResponse {            // descriptive and specific
  success: boolean;
  data: any;
}

❌ 잘못된 예시:
interface IUser {}                 // avoid 'I' prefix
interface response {}             // too generic
interface user_data {}            // snake_case
```

### 타입 별칭

```typescript
✅ 올바른 예시:
type UserRole = 'admin' | 'user';  // PascalCase
type APIEndpoint = string;         // descriptive
type EventHandler<T> = (event: T) => void; // generic with context

❌ 잘못된 예시:
type userRole = 'admin' | 'user';
type endpoint = string;
type Handler<T> = (event: T) => void; // too generic
```

## 📦 **모듈 및 패키지 네이밍**

### 디렉토리 구조

```
✅ 올바른 예시:
src/
  components/
    ui/                            // lowercase
    dashboard/
  services/
    ai/
    database/
  utils/
    validation/

❌ 잘못된 예시:
src/
  Components/                      // PascalCase for directories
  Services/
  Utils/
```

### Import/Export 네이밍

```typescript
✅ 올바른 예시:
import { UserService } from '@/services/UserService';
import { validateEmail } from '@/utils/validation';
export { default as AIEngine } from './AIEngine';

❌ 잘못된 예시:
import { userService } from '@/services/user-service';
import { validate_email } from '@/utils/validation';
```

## 🎨 **CSS 클래스 네이밍 (Tailwind + Custom)**

### Tailwind 클래스

```css
✅ 올바른 예시:
.btn-primary                       /* BEM-like for custom components */
.card-header
.modal-overlay

❌ 잘못된 예시:
.btnPrimary                        /* camelCase in CSS */
.CardHeader                        /* PascalCase in CSS */
```

## 🔧 **환경변수 네이밍**

```bash
✅ 올바른 예시:
NEXT_PUBLIC_API_URL=               # SCREAMING_SNAKE_CASE
DATABASE_URL=
GOOGLE_AI_API_KEY=

❌ 잘못된 예시:
nextPublicApiUrl=
databaseUrl=
googleAiApiKey=
```

## 📊 **데이터베이스 네이밍**

### 테이블명

```sql
✅ 올바른 예시:
users                              -- lowercase, plural
server_metrics                     -- snake_case
ai_responses

❌ 잘못된 예시:
Users                              -- PascalCase
serverMetrics                      -- camelCase
user                               -- singular
```

### 컬럼명

```sql
✅ 올바른 예시:
user_id                            -- snake_case
created_at
is_active

❌ 잘못된 예시:
userId                             -- camelCase
createdAt
isActive
```

## 🚀 **특수 케이스**

### AI 관련 네이밍

```typescript
✅ 올바른 예시:
class AIEngine {}                  // AI는 대문자 유지
interface MLModel {}               // ML도 대문자 유지
const apiKey = '';                 // API는 소문자로 시작

❌ 잘못된 예시:
class AiEngine {}
interface MlModel {}
const APIKey = '';
```

### 약어 처리

```typescript
✅ 올바른 예시:
const httpClient = new HTTPClient(); // 클래스명은 모두 대문자
const xmlParser = new XMLParser();
const userId = '123';               // 변수명은 camelCase

❌ 잘못된 예시:
const HTTPClient = new httpClient();
const XMLparser = new xmlParser();
const userID = '123';
```

## 📋 **체크리스트**

### 코드 리뷰 시 확인사항

- [ ] 파일명이 컨벤션을 따르는가?
- [ ] 변수명이 의미를 명확히 전달하는가?
- [ ] 함수명이 동작을 정확히 설명하는가?
- [ ] 클래스명이 역할을 명확히 나타내는가?
- [ ] 타입/인터페이스명이 구체적인가?
- [ ] 약어 사용이 일관적인가?
- [ ] boolean 변수에 적절한 prefix가 있는가?

### 자동화 도구

```json
// .eslintrc.js 설정 예시
{
  "rules": {
    "camelcase": ["error", { "properties": "always" }],
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "interface",
        "format": ["PascalCase"]
      },
      {
        "selector": "typeAlias",
        "format": ["PascalCase"]
      },
      {
        "selector": "class",
        "format": ["PascalCase"]
      }
    ]
  }
}
```

## 🎯 **마이그레이션 계획**

### Phase 1: 핵심 파일 (완료)

- [x] 타입 정의 파일들
- [x] 주요 서비스 클래스들
- [x] API 라우트들

### Phase 2: 컴포넌트 (진행 중)

- [ ] React 컴포넌트 파일명
- [ ] Props 인터페이스명
- [ ] Hook 함수명

### Phase 3: 유틸리티 (예정)

- [ ] 헬퍼 함수들
- [ ] 상수 정의들
- [ ] 설정 파일들

이 가이드를 통해 OpenManager Vibe v5의 코드 품질과 일관성을 크게 향상시킬 수 있습니다.
