# Mock 시뮬레이션 시스템

## 개요

FNV-1a 해시 기반 현실적 서버 메트릭 생성

## 핵심 특징

- 정규분포 메트릭 (Math.random → FNV-1a 해시)
- 10개 서버 타입 (web, api, database, cache 등)
- 15+ 장애 시나리오 (트래픽 폭증, DDoS, 메모리 누수)
- CPU-Memory 상관관계 (0.6 계수)

## GCP VM 대비 장점

- 비용: $57/월 → $0 (완전 무료)
- 안정성: 99.5% → 99.95%
- 확장성: 1개 VM → 무제한 시뮬레이션

→ 상세 내용은 architecture/system-overview.md 참조
