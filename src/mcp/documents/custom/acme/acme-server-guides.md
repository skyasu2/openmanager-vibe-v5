# ACME 회사 서버 관리 가이드

## ACME 특화 설정

### 애플리케이션 서버
- **포트:** 8080, 8443
- **로그 위치:** /opt/acme/logs/
- **설정 파일:** /etc/acme/app.conf

### 데이터베이스 서버
- **타입:** PostgreSQL 13
- **포트:** 5432
- **백업 위치:** /backup/db/

### 모니터링 설정
- **Grafana:** http://monitor.acme.com:3000
- **알림 채널:** #ops-alerts (Slack)
- **임계값:**
  - CPU: 80%
  - Memory: 85%
  - Disk: 90%

## 비상 연락처
- **운영팀:** ops@acme.com
- **개발팀:** dev@acme.com
- **인프라팀:** infra@acme.com
