# 🌍 환경별 설정 가이드

> **자동 환경 감지 및 최적화**  
> **개발/테스트/스테이징/프로덕션 4개 환경 지원**

> ✅ **통합 완료**: 이 내용은 [ESSENTIAL_DOCUMENTATION.md - 환경별 설정](./ESSENTIAL_DOCUMENTATION.md#-환경별-설정)에 완전 통합되었습니다.  
> 📚 **최신 정보**는 **메인 문서**를 참조해주세요.

---

## 🔄 자동 리다이렉트

이 문서의 모든 내용은 **통합 문서**로 이전되었습니다:

### 📚 [**→ ESSENTIAL_DOCUMENTATION.md**](./ESSENTIAL_DOCUMENTATION.md)

#### 주요 섹션:
- [🌍 환경별 설정](./ESSENTIAL_DOCUMENTATION.md#-환경별-설정)
- [🔧 MCP 시스템](./ESSENTIAL_DOCUMENTATION.md#-mcp-시스템)
- [🤖 Enhanced AI Engine v2.0](./ESSENTIAL_DOCUMENTATION.md#-enhanced-ai-engine-v20)

---

## ⚡ 빠른 시작

### **환경 자동 감지**
```typescript
import { env, isDevelopment, isProduction } from '@/config/environment';

console.log('현재 환경:', env.name);
console.log('Vercel 환경:', env.isVercel);
```

### **환경별 차이점**
- 🧪 **테스트**: 4개 서버, 최소 구성
- 🛠️ **개발**: 16개 서버, 풍부한 디버깅
- 🎭 **스테이징**: 9개 서버, 기본 기능
- 🚀 **프로덕션**: 9개 서버, 완전 기능

---

> 📝 **이 파일은 향후 제거될 예정입니다.**  
> **북마크를 [메인 문서](./ESSENTIAL_DOCUMENTATION.md)로 업데이트해주세요.** 