---
id: tasks-template
title: "작업 분할 템플릿"
keywords: ["tasks", "breakdown", "sdd", "spec-driven", "template", "implementation"]
priority: high
ai_optimized: true
sdd_phase: "3-tasks"
related_docs: ["../requirements/template.md", "../design/template.md"]
updated: "2025-09-16"
---

# 🎯 작업 분할 (Tasks)

> **목적**: 설계를 구현 가능한 작업 단위로 분해

## 📋 설계 요약

### 연결된 설계 문서
```yaml
design_source: "../design/[project-name].md"
design_summary:
  - architecture: "[아키텍처 패턴]"
  - components: ["[주요 컴포넌트 목록]"]
  - apis: ["[API 엔드포인트 수]"]
  - data_models: ["[데이터 모델 수]"]
```

### 복잡도 평가
```yaml
complexity_assessment:
  overall: "[Low/Medium/High]"
  frontend: "[복잡도 점수 1-10]"
  backend: "[복잡도 점수 1-10]"
  database: "[복잡도 점수 1-10]"
  integration: "[복잡도 점수 1-10]"
  
estimated_effort:
  total_days: "[총 예상 일수]"
  developers: "[필요 개발자 수]"
  phases: "[단계 수]"
```

## 🏗️ 작업 단계 (Phases)

### Phase 1: 기반 설정
```yaml
phase_1_foundation:
  duration: "[예상 기간]"
  priority: "Critical"
  dependencies: "None"
  
  tasks:
    - id: "setup-001"
      title: "프로젝트 구조 설정"
      description: "디렉토리 구조, 기본 설정 파일 생성"
      effort: "[시간]"
      assignee: "[담당자]"
      prerequisites: []
      
    - id: "setup-002"
      title: "개발 환경 구성"
      description: "패키지 설치, 환경 변수, 도구 설정"
      effort: "[시간]"
      assignee: "[담당자]"
      prerequisites: ["setup-001"]
      
    - id: "setup-003"
      title: "데이터베이스 스키마 생성"
      description: "테이블 생성, 인덱스 설정, 초기 데이터"
      effort: "[시간]"
      assignee: "[담당자]"
      prerequisites: ["setup-002"]
```

### Phase 2: 핵심 기능 개발
```yaml
phase_2_core:
  duration: "[예상 기간]"
  priority: "High"
  dependencies: ["phase_1_foundation"]
  
  tasks:
    - id: "core-001"
      title: "[핵심 기능 1] 구현"
      description: "[상세 설명]"
      effort: "[시간]"
      assignee: "[담당자]"
      prerequisites: ["setup-003"]
      acceptance_criteria:
        - "[허용 기준 1]"
        - "[허용 기준 2]"
      
    - id: "core-002"
      title: "[핵심 기능 2] 구현"
      description: "[상세 설명]"
      effort: "[시간]"
      assignee: "[담당자]"
      prerequisites: ["core-001"]
      acceptance_criteria:
        - "[허용 기준 1]"
        - "[허용 기준 2]"
```

### Phase 3: 통합 및 테스트
```yaml
phase_3_integration:
  duration: "[예상 기간]"
  priority: "High"
  dependencies: ["phase_2_core"]
  
  tasks:
    - id: "test-001"
      title: "단위 테스트 작성"
      description: "각 컴포넌트별 단위 테스트 구현"
      effort: "[시간]"
      assignee: "[담당자]"
      prerequisites: ["core-002"]
      
    - id: "test-002"
      title: "통합 테스트 작성"
      description: "API 엔드포인트, 데이터베이스 연동 테스트"
      effort: "[시간]"
      assignee: "[담당자]"
      prerequisites: ["test-001"]
      
    - id: "deploy-001"
      title: "배포 파이프라인 구성"
      description: "CI/CD 설정, 프로덕션 배포"
      effort: "[시간]"
      assignee: "[담당자]"
      prerequisites: ["test-002"]
```

## 📝 세부 작업 목록 (Detailed Tasks)

### 🎨 Frontend 작업
```yaml
frontend_tasks:
  ui_components:
    - task: "Button 컴포넌트 구현"
      files: ["src/components/ui/Button.tsx"]
      effort: "2h"
      tests: ["Button.test.tsx"]
      
    - task: "Modal 컴포넌트 구현"
      files: ["src/components/ui/Modal.tsx"]
      effort: "4h"
      tests: ["Modal.test.tsx"]
      dependencies: ["Button 컴포넌트"]
      
  pages:
    - task: "[페이지명] 페이지 구현"
      files: ["src/pages/[page-name].tsx"]
      effort: "[시간]"
      tests: ["[page-name].test.tsx"]
      dependencies: ["[필요 컴포넌트]"]
      
  state_management:
    - task: "[상태] 스토어 구현"
      files: ["src/store/[state-name].ts"]
      effort: "[시간]"
      tests: ["[state-name].test.ts"]
```

### ⚙️ Backend 작업
```yaml
backend_tasks:
  api_endpoints:
    - task: "[API명] 엔드포인트 구현"
      files: ["src/api/[endpoint-name].ts"]
      effort: "[시간]"
      tests: ["[endpoint-name].test.ts"]
      endpoints:
        - "GET /api/[resource]"
        - "POST /api/[resource]"
      
  services:
    - task: "[서비스명] 서비스 구현"
      files: ["src/services/[service-name].ts"]
      effort: "[시간]"
      tests: ["[service-name].test.ts"]
      dependencies: ["[의존 서비스]"]
      
  middleware:
    - task: "인증 미들웨어 구현"
      files: ["src/middleware/auth.ts"]
      effort: "[시간]"
      tests: ["auth.test.ts"]
```

### 🗄️ Database 작업
```yaml
database_tasks:
  schema:
    - task: "[테이블명] 테이블 생성"
      files: ["migrations/[timestamp]_create_[table].sql"]
      effort: "[시간]"
      
  indexes:
    - task: "성능 인덱스 생성"
      files: ["migrations/[timestamp]_add_indexes.sql"]
      effort: "[시간]"
      
  procedures:
    - task: "[프로시저명] 저장 프로시저"
      files: ["migrations/[timestamp]_[procedure_name].sql"]
      effort: "[시간]"
```

## 🧪 테스트 계획

### 테스트 레벨별 작업
```yaml
testing_tasks:
  unit_tests:
    - scope: "개별 함수/메소드"
    - coverage_target: "90%"
    - frameworks: ["Jest", "React Testing Library"]
    - effort: "[총 시간]"
    
  integration_tests:
    - scope: "API 엔드포인트"
    - coverage_target: "80%"
    - frameworks: ["Supertest", "Vitest"]
    - effort: "[총 시간]"
    
  e2e_tests:
    - scope: "사용자 여정"
    - coverage_target: "주요 플로우 100%"
    - frameworks: ["Playwright"]
    - effort: "[총 시간]"
```

### 테스트 시나리오
```yaml
test_scenarios:
  happy_path:
    - scenario: "[정상 케이스 1]"
      steps: ["[단계 1]", "[단계 2]", "[단계 3]"]
      expected: "[예상 결과]"
      
  edge_cases:
    - scenario: "[경계 케이스 1]"
      steps: ["[단계 1]", "[단계 2]"]
      expected: "[예상 결과]"
      
  error_handling:
    - scenario: "[에러 케이스 1]"
      steps: ["[단계 1]", "[단계 2]"]
      expected: "[에러 처리 결과]"
```

## 🚀 배포 작업

### 배포 환경별 작업
```yaml
deployment_tasks:
  development:
    - task: "개발 환경 설정"
      effort: "[시간]"
      files: ["docker-compose.dev.yml", ".env.development"]
      
  staging:
    - task: "스테이징 환경 설정"
      effort: "[시간]"
      files: ["docker-compose.staging.yml", ".env.staging"]
      
  production:
    - task: "프로덕션 환경 설정"
      effort: "[시간]"
      files: ["docker-compose.prod.yml", ".env.production"]
```

### CI/CD 파이프라인
```yaml
cicd_tasks:
  - task: "GitHub Actions 워크플로우 설정"
    files: [".github/workflows/deploy.yml"]
    effort: "[시간]"
    includes:
      - "테스트 자동화"
      - "빌드 자동화"
      - "배포 자동화"
      - "알림 설정"
```

## 📊 진행률 추적

### 마일스톤
```yaml
milestones:
  - name: "Phase 1 완료"
    date: "[목표 날짜]"
    criteria: ["setup-001", "setup-002", "setup-003"]
    
  - name: "핵심 기능 완료"
    date: "[목표 날짜]"
    criteria: ["core-001", "core-002"]
    
  - name: "테스트 완료"
    date: "[목표 날짜]"
    criteria: ["test-001", "test-002"]
    
  - name: "배포 완료"
    date: "[목표 날짜]"
    criteria: ["deploy-001"]
```

### 일일 체크리스트
```yaml
daily_checklist:
  - "[ ] 오늘 완료 예정 작업 확인"
  - "[ ] 차단 요소(blockers) 식별"
  - "[ ] 진행률 업데이트"
  - "[ ] 다음 날 작업 계획"
  - "[ ] 팀 동기화"
```

## 🔄 리스크 관리

### 위험 요소 및 대응책
```yaml
risks:
  technical:
    - risk: "[기술적 위험 1]"
    - probability: "[High/Medium/Low]"
    - impact: "[High/Medium/Low]"
    - mitigation: "[대응 방안]"
      
  schedule:
    - risk: "[일정 위험 1]"
    - probability: "[High/Medium/Low]"
    - impact: "[High/Medium/Low]"
    - mitigation: "[대응 방안]"
      
  resources:
    - risk: "[리소스 위험 1]"
    - probability: "[High/Medium/Low]"
    - impact: "[High/Medium/Low]"
    - mitigation: "[대응 방안]"
```

## 🔧 도구 및 자원

### 개발 도구
```yaml
development_tools:
  ide: "[IDE/에디터]"
  version_control: "Git + GitHub"
  package_manager: "[npm/yarn/pnpm]"
  testing: "[테스트 프레임워크]"
  ci_cd: "[CI/CD 도구]"
  monitoring: "[모니터링 도구]"
```

### AI 협업 도구
```yaml
ai_collaboration:
  claude_code:
    usage: "메인 개발 환경"
    tasks: ["코드 작성", "리팩토링", "디버깅"]
    
  codex_specialist:
    usage: "코드 리뷰, 최적화"
    tasks: ["성능 개선", "버그 발견"]
    
  gemini_specialist:
    usage: "아키텍처 검토"
    tasks: ["설계 검증", "구조 개선"]
    
  qwen_specialist:
    usage: "알고리즘 최적화"
    tasks: ["복잡도 개선", "성능 분석"]
```

## ✅ 완료 기준 (Definition of Done)

### 코드 품질 기준
```yaml
code_quality:
  - "[ ] TypeScript strict 모드 준수"
  - "[ ] ESLint 경고 0개"
  - "[ ] 테스트 커버리지 [목표%] 달성"
  - "[ ] 코드 리뷰 완료"
  - "[ ] 성능 기준 충족"
```

### 기능 완성 기준
```yaml
feature_completion:
  - "[ ] 요구사항 모두 구현"
  - "[ ] 허용 기준 모두 충족"
  - "[ ] 사용자 테스트 통과"
  - "[ ] 보안 검토 완료"
  - "[ ] 문서화 완료"
```

### 배포 준비 기준
```yaml
deployment_readiness:
  - "[ ] 프로덕션 환경 테스트 통과"
  - "[ ] 성능 테스트 완료"
  - "[ ] 보안 스캔 통과"
  - "[ ] 백업/복구 계획 수립"
  - "[ ] 모니터링 설정 완료"
```

## 🔄 다음 단계

```yaml
next_steps:
  - phase: "4-implementation"
    focus: "실제 구현 시작"
    first_task: "[첫 번째 작업 ID]"
    
  validation:
    technical_feasibility:
      - "[ ] 기술적 구현 가능성 재검토"
      - "[ ] 리소스 할당 최종 확인"
      - "[ ] 일정 현실성 검증"
    
    stakeholder_sign_off:
      - "[ ] 개발팀 승인"
      - "[ ] 제품 담당자 승인"
      - "[ ] 일정 승인"
```

---

**✨ SDD Phase 3 완료** → **Phase 4: Implementation** 시작 준비 완료
