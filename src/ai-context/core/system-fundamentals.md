---
context_id: 'system-fundamentals'
priority: 1
domain: 'core-system'
scenarios: ['general', 'troubleshooting', 'monitoring', 'optimization']
keywords: ['system', 'fundamentals', 'basics', 'core', 'foundation']
confidence_level: 0.99
last_verified: '2025-06-10'
dependencies: []
ai_hints:
  - '모든 AI 분석의 기본이 되는 핵심 컨텍스트'
  - '시스템 상태 해석 시 최우선 참조'
  - '다른 컨텍스트의 기반 지식으로 활용'
---

# 🏗️ 시스템 기반 지식 - AI 엔진 핵심 컨텍스트

## 🎯 **AI 엔진 즉시 활용 가이드**

### **시스템 상태 즉시 판단 매트릭스**

```json
{
  "system_health_evaluation": {
    "cpu": {
      "excellent": {
        "range": [0, 50],
        "confidence": 0.99,
        "ai_response": "CPU 사용률이 매우 안정적입니다."
      },
      "good": {
        "range": [50, 70],
        "confidence": 0.95,
        "ai_response": "CPU 사용률이 정상 범위입니다."
      },
      "warning": {
        "range": [70, 85],
        "confidence": 0.9,
        "ai_response": "CPU 사용률이 높아지고 있습니다. 모니터링을 강화하세요."
      },
      "critical": {
        "range": [85, 95],
        "confidence": 0.95,
        "ai_response": "CPU 사용률이 위험 수준입니다. 즉시 조치가 필요합니다."
      },
      "emergency": {
        "range": [95, 100],
        "confidence": 0.99,
        "ai_response": "CPU가 과부하 상태입니다. 긴급 대응이 필요합니다."
      }
    },
    "memory": {
      "excellent": {
        "range": [0, 60],
        "confidence": 0.99,
        "ai_response": "메모리 사용률이 안정적입니다."
      },
      "good": {
        "range": [60, 75],
        "confidence": 0.95,
        "ai_response": "메모리 사용률이 적정 수준입니다."
      },
      "warning": {
        "range": [75, 85],
        "confidence": 0.9,
        "ai_response": "메모리 사용률이 증가하고 있습니다. 정리를 권장합니다."
      },
      "critical": {
        "range": [85, 95],
        "confidence": 0.95,
        "ai_response": "메모리 부족 위험이 있습니다. 즉시 확인하세요."
      },
      "emergency": {
        "range": [95, 100],
        "confidence": 0.99,
        "ai_response": "메모리 고갈 임박입니다. 긴급 조치가 필요합니다."
      }
    },
    "disk": {
      "excellent": {
        "range": [0, 70],
        "confidence": 0.99,
        "ai_response": "디스크 공간이 충분합니다."
      },
      "good": {
        "range": [70, 80],
        "confidence": 0.95,
        "ai_response": "디스크 공간이 적정 수준입니다."
      },
      "warning": {
        "range": [80, 90],
        "confidence": 0.9,
        "ai_response": "디스크 공간이 부족해지고 있습니다. 정리를 권장합니다."
      },
      "critical": {
        "range": [90, 95],
        "confidence": 0.95,
        "ai_response": "디스크 공간이 위험 수준입니다. 즉시 정리하세요."
      },
      "emergency": {
        "range": [95, 100],
        "confidence": 0.99,
        "ai_response": "디스크 공간이 거의 소진되었습니다. 긴급 대응이 필요합니다."
      }
    }
  }
}
```

### **복합 상태 평가 알고리즘**

```json
{
  "composite_evaluation": {
    "calculation_method": "weighted_average",
    "weights": {
      "cpu": 0.4,
      "memory": 0.35,
      "disk": 0.25
    },
    "overall_status": {
      "healthy": { "score_range": [0, 70], "ai_action": "정상 운영 중" },
      "warning": {
        "score_range": [70, 85],
        "ai_action": "주의 깊은 모니터링 필요"
      },
      "critical": { "score_range": [85, 100], "ai_action": "즉시 대응 필요" }
    }
  }
}
```

## 🔍 **패턴 인식 및 이상 탐지**

### **AI 자동 패턴 분석**

```json
{
  "anomaly_patterns": {
    "memory_leak": {
      "indicators": [
        "메모리 사용률의 지속적인 증가 (>1% per hour)",
        "프로세스 재시작 후 메모리 사용률 정상화",
        "특정 프로세스의 메모리 급증 (>50% increase)"
      ],
      "confidence_threshold": 0.7,
      "ai_response_template": "메모리 누수 패턴이 감지되었습니다. {process_name} 프로세스에서 {percentage}% 증가를 확인했습니다.",
      "recommended_actions": [
        "메모리 사용률이 높은 프로세스 식별",
        "애플리케이션 로그에서 메모리 관련 오류 확인",
        "프로세스 재시작 고려"
      ]
    },
    "cpu_spike": {
      "indicators": [
        "CPU 사용률이 평상시 대비 50% 이상 급증",
        "지속 시간이 5분 이상",
        "다른 리소스는 정상 범위"
      ],
      "confidence_threshold": 0.8,
      "ai_response_template": "CPU 스파이크가 감지되었습니다. 현재 사용률: {cpu_percent}%",
      "recommended_actions": [
        "높은 CPU 사용률 프로세스 확인",
        "시스템 로그에서 관련 이벤트 조사",
        "프로세스 우선순위 조정 고려"
      ]
    }
  }
}
```

## 📊 **메트릭 상관관계 분석**

### **AI 상관관계 매트릭스**

```json
{
  "correlation_matrix": {
    "high_cpu_low_memory": {
      "description": "CPU 사용률은 높지만 메모리 사용률은 낮음",
      "interpretation": "CPU 집약적 작업 실행 중",
      "ai_response": "CPU 집약적인 작업이 실행되고 있습니다. 메모리는 충분하니 작업 완료를 기다리거나 프로세스 우선순위를 조정하세요.",
      "confidence": 0.85
    },
    "high_memory_normal_cpu": {
      "description": "메모리 사용률은 높지만 CPU는 정상",
      "interpretation": "메모리 집약적 작업 또는 메모리 누수 가능성",
      "ai_response": "메모리 사용량이 높습니다. 메모리 누수가 의심되니 관련 프로세스를 확인하세요.",
      "confidence": 0.8
    },
    "high_all_resources": {
      "description": "CPU, 메모리, 디스크 모두 높은 사용률",
      "interpretation": "시스템 전반적 과부하",
      "ai_response": "시스템이 전반적으로 과부하 상태입니다. 긴급히 부하를 줄이거나 리소스를 추가해야 합니다.",
      "confidence": 0.95
    }
  }
}
```

## 🚨 **즉시 대응 가이드**

### **AI 자동 대응 매뉴얼**

```json
{
  "immediate_actions": {
    "cpu_overload": {
      "priority": 1,
      "steps": [
        "top 명령으로 CPU 사용률 높은 프로세스 확인",
        "불필요한 프로세스 종료 고려",
        "프로세스 우선순위 조정 (nice/renice)",
        "시스템 로드 분산 검토"
      ],
      "ai_script_template": "현재 CPU 사용률이 {cpu_percent}%입니다. 다음 단계를 수행하세요: {action_steps}"
    },
    "memory_shortage": {
      "priority": 1,
      "steps": [
        "ps aux --sort=-%mem | head 명령으로 메모리 사용량 확인",
        "캐시 정리: echo 3 > /proc/sys/vm/drop_caches",
        "메모리 누수 프로세스 재시작",
        "스왑 사용량 확인 및 최적화"
      ],
      "ai_script_template": "메모리 사용률이 {memory_percent}%입니다. 즉시 다음 조치를 취하세요: {action_steps}"
    },
    "disk_full": {
      "priority": 1,
      "steps": [
        "df -h 명령으로 디스크 사용량 확인",
        "du -sh /* | sort -hr | head -10 으로 큰 디렉터리 식별",
        "로그 파일 정리 (/var/log)",
        "임시 파일 정리 (/tmp)",
        "불필요한 패키지 제거"
      ],
      "ai_script_template": "디스크 사용률이 {disk_percent}%입니다. 긴급히 공간을 확보하세요: {action_steps}"
    }
  }
}
```

## 🔧 **AI 엔진 활용 최적화**

### **컨텍스트 우선순위 규칙**

```json
{
  "context_priority_rules": {
    "emergency_keywords": {
      "keywords": ["긴급", "위험", "다운", "장애", "오류"],
      "priority_boost": 100,
      "confidence_threshold": 0.9
    },
    "performance_keywords": {
      "keywords": ["느림", "지연", "성능", "최적화"],
      "priority_boost": 50,
      "confidence_threshold": 0.8
    },
    "monitoring_keywords": {
      "keywords": ["상태", "모니터링", "확인", "점검"],
      "priority_boost": 25,
      "confidence_threshold": 0.7
    }
  }
}
```

### **AI 응답 생성 템플릿**

```json
{
  "response_templates": {
    "status_summary": {
      "template": "현재 시스템 상태: {overall_status}\nCPU: {cpu_percent}% ({cpu_status})\n메모리: {memory_percent}% ({memory_status})\n디스크: {disk_percent}% ({disk_status})",
      "confidence_required": 0.8
    },
    "issue_analysis": {
      "template": "문제 분석 결과:\n- 주요 이슈: {primary_issue}\n- 심각도: {severity_level}\n- 예상 원인: {probable_causes}\n- 권장 조치: {recommended_actions}",
      "confidence_required": 0.7
    },
    "prediction": {
      "template": "예측 분석:\n- 현재 추세: {current_trend}\n- 예상 시나리오: {predicted_scenario}\n- 조치 필요 시점: {action_timeframe}\n- 예방 조치: {preventive_actions}",
      "confidence_required": 0.6
    }
  }
}
```
