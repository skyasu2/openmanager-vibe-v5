# 🚀 "시스템 엔지니어의 AI 개발 도전기" - 2개월만에 모니터링 플랫폼 만들기

> **1인 바이브 코딩 (AI 이용) 대회 출품작** - 리눅스 시스템 엔지니어가 AI 도구로 웹 개발에 도전한 3단계 여정

## 📋 블로그 포스트 개요

### 🎯 포스트 목적
- **인프라 엔지니어의 개발 도전기**: 시스템 운영 경험을 바탕으로 한 웹 개발 진출
- **AI 도구 활용 실전 사례**: 비개발자가 AI로 개발하는 현실적 과정 공개
- **도구 전환 전략**: 각 단계별 AI 도구 선택과 역할 변화 분석

### 📊 예상 반응  
- **시스템 엔지니어들**: 개발 영역 확장 시 참고 사례
- **AI 도구 관심자들**: 실무 프로젝트에서의 AI 활용법
- **채용 관점**: 기존 역량을 넘어선 학습 능력과 적응력 증명

---

## 🎪 블로그 포스트 구성안

### 📖 **제목 후보들**
1. "ChatGPT → Cursor AI → Claude Code: 2개월 AI 개발 도구 여정"
2. "바이브 코딩 대회 출품작, 무료 티어만으로 AI 플랫폼 만들기"  
3. "혼자 개발하며 배운 것들: AI 도구로 만든 실시간 모니터링 시스템"
4. "MVP → 자동화 → AI 고도화: 포트폴리오 프로젝트 3단계 진화기"

---

## 📚 **포스트 상세 구조**

### **🌟 들어가며 (Hook)**
```markdown
"처음엔 ChatGPT로 HTML 페이지 하나씩 만들어서 
GitHub에 수동으로 올리는 게 전부였습니다.
2개월 후, Claude Code와 Gemini CLI를 활용해 
GCP Functions 기반 AI 시스템을 구축하고 있었죠."
```

### **📊 프로젝트 기본 정보**
- **개발 기간**: 2025년 5월 말 ~ 7월 말 (약 2개월)
- **개발 인원**: 1명 (솔로 개발)
- **목표**: 바이브 사내 코딭대회 출품 (6월 중순)
- **결과**: 대회 출품 후 지속적 고도화 진행

---

## 🚀 **1단계: ChatGPT 시대 (MVP 구축기)**

### **🎯 당시 상황 (시스템 엔지니어 관점)**
```markdown
- 배경: 리눅스 시스템 운영 경험 보유, 웹 개발은 초보 수준
- 목표: 빠른 프로토타입으로 아이디어 검증
- 제약: 시간 부족, 웹 개발 경험 부족
- 주력 도구: ChatGPT 3.5/4.0 (메인 개발 도구)
- 인프라: GitHub + Netlify (정적 호스팅)
```

### **⚡ 주요 작업**
1. **페이지별 개발**: ChatGPT로 HTML/CSS/JS 각각 생성
2. **수동 배포**: GitHub 저장소에 직접 파일 업로드
3. **정적 호스팅**: Netlify로 기본 배포 (동적 기능 없음)
4. **목업 UI**: 서버 모니터링 컨셉 시각화

### **🔥 기술적 도전과 해결**

#### **도전 1: 코드 일관성 부족**
```markdown
**문제**: ChatGPT로 각 페이지 개별 생성 시 스타일 불일치
**해결**: 
- 공통 CSS 프레임워크 도입 (Bootstrap)
- 페이지별 컴포넌트 패턴 정의
- 색상/폰트 가이드라인 수립
```

#### **도전 2: 수동 배포의 비효율성**
```markdown
**문제**: 수정 시마다 파일 복사 붙여넣기, Git 명령어 반복
**해결**: 
- Git 워크플로우 학습
- commit/push 자동화 배치 파일 생성
- Netlify 자동 배포 연동
```

#### **도전 3: 동적 데이터 처리 한계**
```markdown
**문제**: 정적 사이트로는 실시간 모니터링 불가능
**해결**: 우선 Mock 데이터로 UI/UX 완성에 집중
**학습**: 다음 단계에서 백엔드 필요성 인식
```

### **📈 1단계 성과**
- ✅ **빠른 MVP**: 1주일 내 기본 UI 완성
- ✅ **Git 워크플로우 학습**: 버전 관리 기초 습득
- ✅ **프론트엔드 기초**: HTML/CSS/JS 실무 경험
- ⚠️ **한계 인식**: 정적 사이트의 제약 체감

---

## 🔄 **2단계: Cursor AI 시대 (자동화 전환기)**

### **🎯 전환 계기 (시스템 엔지니어의 판단)**
```markdown
"ChatGPT만으로는 복잡한 웹 애플리케이션 로직을 구현하기 어려웠습니다.
시스템 운영 경험으로는 정적 사이트로는 실시간 모니터링이 불가능함을 알고 있었죠.
Cursor AI에 투자하여 본격적인 동적 웹 서비스로 전환하기로 결정했습니다."
```

### **🛠️ 도구 및 아키텍처 대전환**
```diff
# 도구 변화
- ChatGPT (메인 개발 도구)
+ Cursor AI (메인 개발 도구) + ChatGPT (브레인스토밍/프롬프트 작성)

# 인프라 변화
- GitHub + Netlify (정적 호스팅)
+ Vercel (동적 웹 지원) + Supabase (DB) + Upstash Memory Cache (캐싱)
+ GitHub Actions (CI/CD 자동화)
```

### **⚡ 주요 작업**
1. **플랫폼 전환**: Netlify → Vercel (동적 웹 지원 위함)
2. **Next.js 도입**: React 기반 SPA 구축 (Cursor AI 가이드)
3. **백엔드 생태계**: Supabase PostgreSQL + Upstash Memory Cache 통합
4. **자동화 파이프라인**: GitHub Actions CI/CD 구축
5. **실시간 모니터링**: WebSocket + Server-Sent Events 구현

### **🔥 기술적 도전과 해결**

#### **도전 1: 시스템 관리자의 웹 개발 진출**
```markdown
**문제**: 시스템 운영 → 웹 애플리케이션 개발 패러다임 전환
**시스템 엔지니어 강점 활용**: 
- 서버 아키텍처 이해도로 백엔드 설계 유리
- 리눅스/네트워크 지식으로 인프라 구성 능숙
- 모니터링 시스템 구축 경험이 프로젝트 컨셉과 완벽 매치

**Cursor AI의 혁신적 도움**:
- 기존 HTML을 JSX로 실시간 변환 제안
- 파일 구조를 읽고 Next.js 패턴 자동 적용
- ChatGPT 대비 **컨텍스트 기반 학습이 5배 효과적**

**결과**: 1주일만에 React/Next.js 기본기 습득
```

#### **도전 2: 백엔드 아키텍처 설계 (시스템 엔지니어의 이점)**
```markdown
**상황**: 웹 개발은 초보지만 시스템 아키텍처는 전문 영역
**시스템 엔지니어 강점 발휘**:
- 서버 부하 분산 경험 → 서버리스 아키텍처 설계 능력
- 데이터베이스 운영 경험 → Supabase PostgreSQL 최적화
- 캐싱 시스템 구축 경험 → Memory Cache 활용 전략 수립

**기술 스택 선택 (전문성 기반)**:
- Supabase: RLS 정책으로 보안 강화 (시스템 보안 경험 활용)
- Upstash Memory Cache: 분산 캐싱 및 세션 관리 최적화
- Vercel Edge Runtime: CDN 최적화 (네트워크 지식 활용)

**결과**: 백엔드 설계는 오히려 프론트엔드보다 수월했음
```

#### **도전 3: CI/CD 파이프라인 구축**
```markdown
**문제**: 수동 배포에서 자동 배포로 전환 필요
**해결**:
- GitHub Actions 워크플로우 작성
- Vercel 자동 배포 연동  
- 환경변수 관리 체계 구축
- 테스트 자동화 도입

**실제 적용**:
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
```

#### **도전 4: 실시간 데이터 처리**
```markdown
**문제**: 서버 모니터링 데이터의 실시간 업데이트
**해결**:
- Server-Sent Events (SSE) 구현
- Supabase Realtime 구독
- Memory Cache를 활용한 캐싱 전략

**성능 개선**:
- 폴링 방식: 15초 간격 → 실시간 업데이트
- 응답 시간: 2-3초 → 500ms 이내
```

### **📈 2단계 성과**
- ✅ **동적 웹앱**: 완전한 SPA 구현
- ✅ **자동화**: CI/CD 파이프라인 구축  
- ✅ **실시간**: WebSocket 기반 실시간 모니터링
- ✅ **확장성**: 백엔드 서비스 통합
- 🎯 **대회 출품**: 바이브 코딩 대회 출품 완료 (6월 중순)

---

## 🤖 **3단계: Claude Code 시대 (AI 고도화기)**

### **🎯 전환 계기 (대회 출품 후 심화 단계)**
```markdown
"바이브 코딩 대회 출품은 성공했지만, 이제 진짜 포트폴리오 수준으로 발전시키고 싶었습니다.
시스템 엔지니어로서 더 복잡한 아키텍처와 AI 시스템을 구축해보고 싶었고,
Claude Code와 Gemini CLI의 조합을 발견하게 되었죠."
```

### **🛠️ 도구 생태계의 진화 (연속성과 변화)**
```diff
# 메인 개발 도구 변화
- Cursor AI (메인 개발 도구)
+ Claude Code (메인 개발 도구) + Gemini CLI (보조 도구)

# ChatGPT 역할 지속 (보조 도구로 유지)
+ ChatGPT (브레인스토밍/프롬프트 작성) - 계속 유지

# 인프라 연속성 (안정성 확보)
= Vercel + Supabase + Upstash Memory Cache (2단계에서 그대로 유지)
+ GCP Functions (Python 3.11) - 새로 추가

# 새로운 AI 생태계
+ MCP 서버 9개 + 서브 에이전트 10개
```

### **⚡ 주요 작업**
1. **Google Cloud 통합**: GCP Functions 백엔드 구축
2. **AI 시스템 고도화**: 2-Mode AI (LOCAL + GOOGLE_ONLY)
3. **MCP 서버**: 9개 서버 생태계 구축
4. **서브 에이전트**: 10개 전문 에이전트 활용

### **🔥 기술적 도전과 해결**

#### **도전 1: Python 백엔드 진출**
```markdown
**문제**: 프론트엔드 위주에서 백엔드 전문성 필요
**해결**:
- GCP Functions + Python 3.11 학습
- AI/ML 라이브러리 활용 (transformers, numpy)
- 서버리스 아키텍처 설계

**구현 예시**:
```python
# gcp-functions/enhanced-korean-nlp/main.py
import functions_framework
from transformers import pipeline

@functions_framework.http
def korean_nlp(request):
    nlp = pipeline("sentiment-analysis", model="korean-bert")
    result = nlp(request.get_json()["text"])
    return {"sentiment": result[0]["label"]}, 200
```

#### **도전 2: 복합 AI 시스템 설계**
```markdown
**문제**: Claude Code + Gemini CLI 각각의 장점 활용 필요
**해결**:
- 2-Mode AI Router 설계
- LOCAL 모드: Supabase RAG + Korean NLP
- GOOGLE_ONLY 모드: Gemini 직접 연동
- 상황별 최적 AI 선택 로직

**아키텍처**:
```typescript
// AI Router 핵심 로직
class UnifiedAIRouter {
  async query(text: string, mode: 'LOCAL' | 'GOOGLE_ONLY') {
    switch(mode) {
      case 'LOCAL':
        return await this.supabaseRAG(text);
      case 'GOOGLE_ONLY': 
        return await this.geminiDirect(text);
    }
  }
}
```

#### **도전 3: MCP 서버 생태계 구축**
```markdown
**문제**: Claude Code의 MCP 서버를 효과적으로 활용
**해결**:
- 9개 MCP 서버 설정 (filesystem, github, supabase 등)
- 각 서버별 특화 기능 매핑
- 서버 간 데이터 동기화 체계

**실제 활용**:
- filesystem: 프로젝트 파일 관리
- github: 코드 리뷰 및 이슈 관리  
- supabase: DB 스키마 관리
- memory: 컨텍스트 기억 및 활용
```

#### **도전 4: 서브 에이전트 워크플로우**
```markdown
**문제**: 복잡한 작업을 효율적으로 처리할 방법 필요
**해결**:
- 10개 전문 서브 에이전트 활용
- central-supervisor: 작업 조율
- 각 에이전트별 특화 업무 분담

**워크플로우 예시**:
1. code-review-specialist: 코드 품질 검토
2. database-administrator: DB 최적화  
3. ux-performance-optimizer: 성능 튜닝
4. doc-structure-guardian: 문서 관리
```

### **📈 3단계 성과**
- ✅ **AI 전문성**: 복합 AI 시스템 구축 역량
- ✅ **백엔드 확장**: Python + GCP Functions 숙련
- ✅ **시스템 아키텍처**: 엔터프라이즈 수준 설계  
- ✅ **자동화 고도화**: AI 기반 개발 워크플로우
- 🚀 **포트폴리오 완성**: 기술적 깊이와 폭 모두 달성

---

## 🎯 **핵심 학습 내용 및 인사이트**

### **🔧 기술적 성장**
```markdown
1. **AI 도구 활용 진화**
   ChatGPT (코드 생성) → Cursor AI (IDE 통합) → Claude Code (워크플로우)

2. **아키텍처 사고 발전**  
   단순 웹페이지 → SPA → 마이크로서비스 + AI

3. **풀스택 역량 확보**
   프론트엔드 전용 → 백엔드 통합 → AI/ML 구현

4. **DevOps 실무 경험**
   수동 배포 → CI/CD → 서버리스 + 멀티 클라우드
```

### **💡 시스템 엔지니어의 AI 개발 방법론**
```markdown
1. **AI 도구별 역할 진화 패턴**
   - **ChatGPT**: 메인 도구(1단계) → 브레인스토밍 보조(2-3단계)
   - **Cursor AI**: 메인 개발 도구(2단계) → 사용 중단(3단계)
   - **Claude Code**: 메인 개발 도구로 부상(3단계)
   - **Gemini CLI**: 새로운 보조 도구로 추가(3단계)

2. **시스템 엔지니어 강점 활용**
   - **1단계**: 웹 개발 초보, AI 도구에 전적 의존
   - **2단계**: 시스템 아키텍처 경험 활용 (백엔드 설계 우위)
   - **3단계**: 복합 AI 시스템 구축 (AI 도구 조합 최적화)

3. **인프라 연속성 전략 (시스템 운영 관점)**
   - **변화하는 요소**: 개발 도구 (ChatGPT → Cursor → Claude)
   - **유지되는 요소**: 핵심 인프라 (Vercel, Supabase, Memory Cache)
   - **추가되는 요소**: 새로운 기능 레이어 (GCP Functions)
   - **안정성 우선**: 검증된 스택 기반으로 확장

4. **무료 티어 최적화 (비용 의식적 접근)**
   - Vercel: 100GB 대역폭, 무제한 배포
   - Supabase: 500MB DB, GitHub OAuth
   - GCP: 2백만 요청/월 무료
   - **총 운영비**: $0 (시스템 엔지니어의 리소스 최적화 능력 발휘)
```

### **🚀 시스템 엔지니어의 웹 개발 전환 성과**
```markdown
1. **기존 역량 활용**: 시스템 운영 경험을 웹 아키텍처 설계에 응용
2. **AI 도구 활용 전문성**: 2개월만에 4가지 AI 도구 조합 마스터
3. **아키텍처 사고 확장**: 서버 인프라 → 풀스택 웹 아키텍처로 확장
4. **자동화 DNA**: 시스템 관리 자동화 경험을 CI/CD로 자연스럽게 전환
5. **비용 최적화 역량**: 무료 티어 조합으로 엔터프라이즈급 시스템 구현
```

---

## 🎪 **마무리: 포트폴리오 프로젝트로서의 가치**

### **📊 정량적 성과**
- **개발 기간**: 2개월 (2025.05 ~ 2025.07)
- **코드 규모**: 45개 문서, 143개 npm 스크립트  
- **기술 스택**: 15+ 기술 (Frontend, Backend, AI/ML, DevOps)
- **무료 티어 활용**: 100% 무료로 완전한 시스템 구현
- **성능**: 평균 응답시간 200ms 이내

### **🎯 질적 성과**
- **AI 도구 전문성**: ChatGPT → Claude Code 진화 과정 완주
- **풀스택 역량**: 프론트엔드에서 AI/ML 백엔드까지 확장
- **시스템 설계**: 단일 페이지에서 마이크로서비스 아키텍처로 발전
- **실무 경험**: CI/CD, 멀티 클라우드, 서버리스 등 현업 기술 습득

### **💼 시스템 엔지니어의 웹 개발 전환 가치**
1. **도메인 전문성**: 서버 모니터링 시스템 구축 경험이 프로젝트와 완벽 매치
2. **학습 적응력**: 전혀 다른 영역(웹 개발)을 AI 도구로 빠르게 습득
3. **시스템 사고**: 인프라 관점에서 안정적이고 확장 가능한 아키텍처 설계
4. **비용 최적화**: 제한된 리소스로 최대 효과를 내는 엔지니어링 마인드
5. **AI 도구 활용**: 4가지 AI 도구를 상황별로 최적 조합하는 실무 경험
6. **지속 개발**: 2개월간 꾸준한 고도화로 입증된 성장 의지

---

## 📚 **다음 글 예고**

1. **"무료 티어만으로 AI 플랫폼 운영하기: 비용 최적화 전략"**
2. **"Claude Code MCP 서버 완전 활용 가이드"**  
3. **"2-Mode AI 시스템 설계: LOCAL vs GOOGLE_ONLY"**
4. **"1인 개발자를 위한 서브 에이전트 워크플로우"**

---

**🔗 프로젝트 링크**
- **GitHub**: [openmanager-vibe-v5](https://github.com/yourusername/openmanager-vibe-v5)
- **Live Demo**: [Vercel 배포 링크]
- **기술 문서**: [PROJECT-STRUCTURE.md](./PROJECT-STRUCTURE.md)

**📧 연락처**: [이메일] | **💼 LinkedIn**: [프로필]

---

*"시스템 엔지니어에서 웹 개발자로 전환하며 배운 가장 큰 교훈은, AI 도구는 단순히 코드를 생성해주는 것이 아니라 기존 전문성을 새로운 영역으로 확장시키는 bridge 역할을 한다는 것이었습니다. 서버 운영 경험이 웹 아키텍처 설계에, 자동화 스크립트 작성 경험이 CI/CD 구축에 자연스럽게 연결되는 순간들을 경험했습니다."*