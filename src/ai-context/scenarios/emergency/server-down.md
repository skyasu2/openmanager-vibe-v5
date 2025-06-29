---
context_id: 'server-down-emergency'
priority: 1
domain: 'emergency-response'
scenarios: ['server-down', 'service-outage', 'connectivity-issues']
keywords:
  ['server', 'down', 'offline', 'unresponsive', 'outage', 'connectivity']
confidence_level: 0.99
last_verified: '2025-06-10'
dependencies: ['system-fundamentals', 'network-troubleshooting']
ai_hints:
  - '서버 다운 상황 시 최우선 참조'
  - '순차적 진단 절차 제공'
  - '긴급 복구 가이드 포함'
---

# 🚨 서버 다운 긴급 대응 시나리오

## 🎯 **AI 즉시 진단 플로우**

### **1단계: 즉시 상태 확인**

```json
{
  "immediate_checks": {
    "network_connectivity": {
      "command": "ping -c 4 {server_ip}",
      "success_criteria": "packet_loss < 25%",
      "ai_interpretation": "네트워크 연결 상태 확인",
      "next_step_if_success": "ssh_connectivity",
      "next_step_if_fail": "network_diagnosis"
    },
    "ssh_connectivity": {
      "command": "ssh -o ConnectTimeout=10 {server_ip}",
      "success_criteria": "connection_established",
      "ai_interpretation": "SSH 서비스 및 서버 부팅 상태 확인",
      "next_step_if_success": "service_status_check",
      "next_step_if_fail": "server_hardware_check"
    },
    "service_status_check": {
      "command": "systemctl status {service_name}",
      "success_criteria": "active (running)",
      "ai_interpretation": "서비스 프로세스 상태 확인",
      "next_step_if_success": "application_level_diagnosis",
      "next_step_if_fail": "service_restart_attempt"
    }
  }
}
```

### **2단계: 문제 분류 및 대응**

```json
{
  "problem_classification": {
    "network_issue": {
      "indicators": ["ping_failure", "dns_resolution_failure"],
      "ai_response": "네트워크 연결 문제가 감지되었습니다. 네트워크 인프라를 확인하세요.",
      "immediate_actions": [
        "네트워크 케이블 연결 상태 확인",
        "스위치/라우터 상태 점검",
        "DNS 서버 응답 확인",
        "방화벽 규칙 검토"
      ],
      "escalation_time": "5분"
    },
    "server_hardware_issue": {
      "indicators": ["ssh_failure", "ping_success"],
      "ai_response": "서버 하드웨어 또는 OS 레벨 문제가 의심됩니다.",
      "immediate_actions": [
        "서버 콘솔 접근 시도",
        "전원 상태 확인",
        "하드웨어 오류 로그 확인",
        "재부팅 고려"
      ],
      "escalation_time": "10분"
    },
    "service_failure": {
      "indicators": ["ssh_success", "service_inactive"],
      "ai_response": "서비스 레벨 장애가 발생했습니다. 서비스 재시작을 시도하세요.",
      "immediate_actions": [
        "서비스 로그 확인",
        "프로세스 상태 점검",
        "리소스 사용량 확인",
        "서비스 재시작"
      ],
      "escalation_time": "3분"
    }
  }
}
```

## 🔧 **AI 자동 복구 시퀀스**

### **서비스 재시작 자동화**

```json
{
  "auto_recovery_sequence": {
    "step_1_graceful_restart": {
      "commands": [
        "systemctl stop {service_name}",
        "sleep 5",
        "systemctl start {service_name}",
        "systemctl status {service_name}"
      ],
      "success_criteria": "active (running)",
      "ai_monitoring": "서비스 상태를 30초간 모니터링",
      "rollback_if_fail": true
    },
    "step_2_force_restart": {
      "commands": [
        "pkill -9 {process_name}",
        "systemctl reset-failed {service_name}",
        "systemctl start {service_name}"
      ],
      "success_criteria": "process_running",
      "ai_monitoring": "강제 재시작 후 안정성 확인",
      "escalate_if_fail": true
    },
    "step_3_system_recovery": {
      "commands": [
        "systemctl daemon-reload",
        "systemctl restart {service_name}",
        "journalctl -u {service_name} --since '5 minutes ago'"
      ],
      "success_criteria": "no_error_logs",
      "ai_analysis": "시스템 로그 분석 및 근본 원인 파악"
    }
  }
}
```

### **헬스체크 및 모니터링**

```json
{
  "health_monitoring": {
    "immediate_checks": {
      "response_time": {
        "command": "curl -w '%{time_total}' -o /dev/null -s {service_url}",
        "threshold": "< 5 seconds",
        "ai_interpretation": "서비스 응답 시간 확인"
      },
      "port_availability": {
        "command": "nc -zv {server_ip} {port}",
        "threshold": "connection_successful",
        "ai_interpretation": "서비스 포트 접근성 확인"
      },
      "resource_usage": {
        "command": "top -bn1 | grep {process_name}",
        "threshold": "cpu < 90%, memory < 90%",
        "ai_interpretation": "복구 후 리소스 사용량 정상성 확인"
      }
    },
    "continuous_monitoring": {
      "interval": "30_seconds",
      "duration": "10_minutes",
      "alert_threshold": "2_consecutive_failures",
      "ai_action": "재발 시 자동 에스컬레이션"
    }
  }
}
```

## 📊 **AI 근본 원인 분석**

### **로그 분석 패턴**

```json
{
  "log_analysis_patterns": {
    "memory_exhaustion": {
      "patterns": [
        "OutOfMemoryError",
        "Cannot allocate memory",
        "killed by signal 9"
      ],
      "ai_diagnosis": "메모리 부족으로 인한 프로세스 종료",
      "recommended_fix": "메모리 증설 또는 메모리 사용량 최적화",
      "prevention": "메모리 모니터링 임계값 설정"
    },
    "disk_space_full": {
      "patterns": ["No space left on device", "Disk quota exceeded"],
      "ai_diagnosis": "디스크 공간 부족으로 인한 서비스 중단",
      "recommended_fix": "디스크 정리 또는 용량 확장",
      "prevention": "디스크 사용량 자동 모니터링"
    },
    "configuration_error": {
      "patterns": [
        "Configuration error",
        "Invalid configuration",
        "Failed to parse"
      ],
      "ai_diagnosis": "설정 파일 오류로 인한 서비스 시작 실패",
      "recommended_fix": "설정 파일 검증 및 수정",
      "prevention": "설정 변경 시 자동 검증"
    }
  }
}
```

### **예측 분석 및 예방**

```json
{
  "predictive_analysis": {
    "failure_indicators": {
      "gradual_performance_degradation": {
        "pattern": "response_time_increase > 20% over 1_hour",
        "ai_prediction": "서비스 장애 가능성 높음 (다음 2시간 내)",
        "preventive_action": "프로세스 재시작 권장"
      },
      "resource_trend_analysis": {
        "pattern": "memory_usage_increase > 5% per hour",
        "ai_prediction": "메모리 누수 가능성, 6시간 내 장애 예상",
        "preventive_action": "메모리 누수 조사 및 프로세스 재시작"
      },
      "error_rate_spike": {
        "pattern": "error_rate > 1% and increasing",
        "ai_prediction": "서비스 불안정, 30분 내 장애 가능성",
        "preventive_action": "즉시 로그 분석 및 대기 상태 전환"
      }
    }
  }
}
```

## 🚀 **AI 자동 에스컬레이션**

### **에스컬레이션 매트릭스**

```json
{
  "escalation_matrix": {
    "level_1_auto_recovery": {
      "duration": "0-5분",
      "actions": ["서비스 재시작", "기본 헬스체크"],
      "ai_decision": "자동 복구 시도",
      "success_rate": "70%"
    },
    "level_2_advanced_recovery": {
      "duration": "5-15분",
      "actions": ["시스템 재부팅", "백업 서버 활성화"],
      "ai_decision": "고급 복구 절차 실행",
      "human_notification": "운영팀 알림"
    },
    "level_3_manual_intervention": {
      "duration": "15분+",
      "actions": ["수동 개입 필요", "전문가 호출"],
      "ai_decision": "인간 개입 필요",
      "escalation": "긴급 대응팀 호출"
    }
  }
}
```

### **AI 의사결정 트리**

```json
{
  "decision_tree": {
    "server_unresponsive": {
      "if": "ping_fails",
      "then": "network_diagnosis",
      "confidence": 0.9
    },
    "service_down": {
      "if": "ssh_success AND service_inactive",
      "then": "service_restart_sequence",
      "confidence": 0.95
    },
    "partial_failure": {
      "if": "service_running AND high_error_rate",
      "then": "application_level_diagnosis",
      "confidence": 0.8
    }
  }
}
```
