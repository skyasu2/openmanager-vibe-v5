# 🗣️ 자연어 처리 방식 플로우 다이어그램

## Mermaid 다이어그램 코드

```mermaid
graph TD
    A["🗣️ 자연어 질의 입력"] --> B["🧠 의도 분석<br/>(analyzeQueryIntent)"]

    B --> C{"🎯 의도 패턴 매칭"}
    C --> D1["서버상태<br/>(server_status)"]
    C --> D2["성능분석<br/>(performance)"]
    C --> D3["오류분석<br/>(error_analysis)"]
    C --> D4["예측<br/>(prediction)"]
    C --> D5["최적화<br/>(optimization)"]
    C --> D6["비교<br/>(comparison)"]
    C --> D7["트렌드<br/>(trend)"]

    D1 --> E["🎯 최적 전략 선택<br/>(selectOptimalStrategy)"]
    D2 --> E
    D3 --> E
    D4 --> E
    D5 --> E
    D6 --> E
    D7 --> E

    E --> F1["dual_core<br/>(복잡한 분석)"]
    E --> F2["unified<br/>(실시간 데이터)"]
    E --> F3["chain<br/>(예측 관련)"]
    E --> F4["smart_fallback<br/>(일반적)"]

    F1 --> G["🚀 AI 엔진 실행"]
    F2 --> G
    F3 --> G
    F4 --> G

    G --> H["✨ 응답 최적화<br/>(enhanceNaturalLanguageResponse)"]

    H --> I1["서버 상태 컨텍스트 추가"]
    H --> I2["성능 지표 추가"]
    H --> I3["오류 분석 세부사항 추가"]
    H --> I4["단계별 설명 추가<br/>(복잡한 질의)"]

    I1 --> J["📝 최종 응답 생성"]
    I2 --> J
    I3 --> J
    I4 --> J

    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style E fill:#fff3e0
    style G fill:#e8f5e8
    style H fill:#fff8e1
    style J fill:#f1f8e9
```

## 처리 단계 설명

### 1단계: 자연어 질의 입력

- 사용자가 한국어로 시스템 관련 질문 입력
- 예: "CPU 사용률이 높은 서버를 찾아주세요"

### 2단계: 의도 분석 (analyzeQueryIntent)

- 7가지 의도 패턴 매칭
- 정규표현식 기반 한국어 특화 분석
- 신뢰도 점수 계산

### 3단계: 최적 전략 선택 (selectOptimalStrategy)

- 의도 분석 결과 기반 전략 선택
- 복잡도 및 데이터 요구사항 고려
- 4가지 AI 처리 전략 중 최적 선택

### 4단계: AI 엔진 실행

- 선택된 전략에 따른 AI 엔진 조합 실행
- MCP, RAG, Google AI 등 적절한 조합 활용

### 5단계: 응답 최적화 (enhanceNaturalLanguageResponse)

- 의도별 응답 개선
- 컨텍스트 정보 추가
- 복잡한 질의의 경우 단계별 설명 추가

### 6단계: 최종 응답 생성

- 사용자 친화적 형태로 응답 포맷팅
- 추가 메트릭 및 권장사항 포함
- 한국어 자연어 응답 완성
