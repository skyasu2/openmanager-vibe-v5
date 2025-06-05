# 🔧 MCP 사용 구분 가이드

> **작성일**: 2025년 6월 2일  
> **개발자**: jhhong (개인 프로젝트)  
> **목적**: MCP의 두 가지 사용 용도 명확히 구분

---

## 📋 MCP 사용 구분 개요

본 프로젝트에서 MCP(Model Context Protocol)는 **두 가지 완전히 다른 용도**로 사용됩니다:

1. **🛠️ 개발도구로서의 MCP** - Cursor IDE에서 개발 시 사용
2. **🤖 애플리케이션 AI 엔진의 MCP** - 실제 서비스에서 AI 기능 구현

---

## 🛠️ **개발도구로서의 MCP**

### **용도**: Cursor IDE 개발 환경에서 사용
### **목적**: 개발자(jhhong)가 코딩할 때 AI 어시스턴트가 프로젝트 파일에 접근

#### **설치된 MCP 서버 (4개)**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "D:/cursor/openmanager-vibe-v5/docs", "D:/cursor/openmanager-vibe-v5/src"]
    },
    "memory": {
      "command": "npx", 
      "args": ["@modelcontextprotocol/server-memory"]
    },
    "git": {
      "command": "npx",
      "args": ["git-mob-mcp-server", "--repository", "D:/cursor/openmanager-vibe-v5"]
    },
    "github": {
      "command": "npx", 
      "args": [
        "-y", 
        "@smithery/cli@latest", 
        "run", 
        "@smithery-ai/github",
        "--config", 
        "{\"githubPersonalAccessToken\":\"YOUR_GITHUB_TOKEN\"}"
      ]
    }
  }
}
```

#### **제공 기능**
- **Filesystem Server**: 프로젝트 파일 검색, 읽기, 분석
- **Memory Server**: 개발 세션 컨텍스트 유지
- **Git Server**: 커밋 히스토리 분석, 브랜치 관리
- **GitHub Server**: GitHub 저장소 관리, 이슈/PR 분석

#### **사용 예시**
```
개발자: "src 폴더에서 AI 관련 파일들을 찾아서 분석해줘"
→ Cursor AI가 MCP Filesystem을 통해 파일 검색 및 분석
```

---

## 🤖 **애플리케이션 AI 엔진의 MCP**

### **용도**: 실제 서비스 내부 AI 기능 구현
### **목적**: 애플리케이션 사용자가 AI 기능을 사용할 때 컨텍스트 관리

#### **구현 위치**
```typescript
// src/core/mcp/real-mcp-client.ts
export class RealMCPClient {
  // 애플리케이션 내부 AI 엔진용 MCP 클라이언트
}

// src/services/ai/integrated-ai-engine.ts  
export class IntegratedAIEngine {
  // MCP를 활용한 AI 추론 엔진
}
```

#### **제공 기능**
- **컨텍스트 관리**: 사용자 세션별 대화 컨텍스트 유지
- **도구 체인**: AI가 필요한 도구들을 순차적으로 호출
- **메모리 관리**: 이전 분석 결과 기억 및 활용

#### **사용 예시**
```typescript
// 사용자가 AI에게 질문
const result = await mcpClient.query({
  text: "서버 상태를 분석해주세요",
  context: userSession
});
```

---

## ⚠️ **중요: 절대 혼재하지 말 것**

### 🚫 **잘못된 설명 (혼재)**
```markdown
❌ "MCP 시스템으로 개발하고 AI 기능도 구현했습니다"
❌ "Cursor의 MCP가 애플리케이션 AI 엔진에도 사용됩니다"
❌ "MCP 서버 3개로 AI 추론을 합니다"
```

### ✅ **올바른 설명 (구분)**
```markdown
✅ "Cursor IDE의 MCP 개발도구로 개발했습니다"
✅ "애플리케이션에는 별도의 MCP 기반 AI 엔진이 있습니다"
✅ "개발용 MCP와 서비스용 MCP는 완전히 다릅니다"
```

---

## 📊 **구분 비교표**

| 구분 | 개발도구 MCP | 애플리케이션 MCP |
|------|-------------|-----------------|
| **사용자** | 개발자 (jhhong) | 서비스 사용자 |
| **환경** | Cursor IDE | 웹 애플리케이션 |
| **목적** | 코딩 지원 | AI 기능 제공 |
| **설치 위치** | `~/.cursor/mcp.json` | `src/core/mcp/` |
| **서버 종류** | Filesystem, Memory, Git, GitHub | 커스텀 AI 도구들 |
| **데이터** | 프로젝트 파일 | 서버 메트릭 데이터 |

---

## 🔧 **기술적 구현 차이**

### **개발도구 MCP**
```bash
# Cursor IDE 설정 파일
c:\Users\jhhong\.cursor\mcp.json

# 사용하는 패키지
@modelcontextprotocol/server-filesystem
@modelcontextprotocol/server-memory  
git-mob-mcp-server
@smithery/cli (GitHub 서버용)
```

### **애플리케이션 MCP**
```typescript
// 애플리케이션 코드 내부
import { MCPProcessor } from '@/modules/mcp';
import { IntegratedAIEngine } from '@/services/ai/integrated-ai-engine';

// 커스텀 MCP 구현
class ApplicationMCPClient {
  // 서버 모니터링 특화 도구들
}
```

---

## 📝 **문서 작성 시 주의사항**

### ✅ **올바른 표현**
- "Cursor IDE의 MCP 개발도구를 활용하여 개발"
- "애플리케이션에는 MCP 기반 AI 엔진 구현"
- "개발 시 MCP 도구 사용, 서비스에는 별도 AI 엔진"

### 🚫 **피해야 할 표현**
- "MCP 시스템으로 AI 기능 구현"
- "MCP 서버들이 AI 추론 담당"
- "개발과 서비스에서 같은 MCP 사용"

---

## 🎯 **요약**

1. **개발도구 MCP**: Cursor IDE에서 개발자가 코딩할 때 사용
2. **애플리케이션 MCP**: 실제 서비스에서 AI 기능 구현에 사용
3. **완전 분리**: 두 용도는 절대 혼재되어서는 안 됨
4. **명확한 구분**: 문서나 설명에서 반드시 구분하여 기술

**이 가이드를 참고하여 MCP 관련 내용을 정확하게 작성하세요!** 🚀 