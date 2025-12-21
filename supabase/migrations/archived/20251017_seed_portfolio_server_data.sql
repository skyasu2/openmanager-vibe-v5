-- ==========================================
-- Portfolio Server Data Seeding
-- ==========================================
-- 목적: 포트폴리오 데모용 현실적인 서버 데이터 생성
-- 기반: src/types/server.ts의 SERVER_TYPE_DEFINITIONS (12개 서버 역할)
-- 적용 방법: 스키마 생성 후 Supabase Dashboard > SQL Editor에서 실행

-- ==========================================
-- 1. 서버 인스턴스 생성 (각 타입별 대표 서버)
-- ==========================================

-- Web Servers (프론트엔드, 고트래픽)
INSERT INTO servers (id, name, hostname, status, type, location, environment, provider, os, ip, specs, services) VALUES
('web-prod-01', 'Web Server 1', 'web-prod-01.example.com', 'online', 'web', '서울', 'production', 'AWS', 'Ubuntu 22.04 LTS', '10.0.1.10', 
 '{"cpu_cores": 8, "memory_gb": 32, "disk_gb": 512, "network_speed": "10Gbps"}',
 '[{"name": "nginx", "status": "running", "port": 80, "pid": 1234}, {"name": "pm2", "status": "running", "port": 3000, "pid": 5678}]'),
('web-prod-02', 'Web Server 2', 'web-prod-02.example.com', 'online', 'web', '서울', 'production', 'AWS', 'Ubuntu 22.04 LTS', '10.0.1.11',
 '{"cpu_cores": 8, "memory_gb": 32, "disk_gb": 512, "network_speed": "10Gbps"}',
 '[{"name": "nginx", "status": "running", "port": 80, "pid": 1235}, {"name": "pm2", "status": "running", "port": 3000, "pid": 5679}]'),
('web-prod-03', 'Web Server 3', 'web-prod-03.example.com', 'warning', 'web', '서울', 'production', 'AWS', 'Ubuntu 22.04 LTS', '10.0.1.12',
 '{"cpu_cores": 8, "memory_gb": 32, "disk_gb": 512, "network_speed": "10Gbps"}',
 '[{"name": "nginx", "status": "running", "port": 80, "pid": 1236}, {"name": "pm2", "status": "degraded", "port": 3000, "pid": 5680}]');

-- API Servers (백엔드 API, CPU 집약적)
INSERT INTO servers (id, name, hostname, status, type, location, environment, provider, os, ip, specs, services) VALUES
('api-prod-01', 'API Server 1', 'api-prod-01.example.com', 'online', 'api', '서울', 'production', 'AWS', 'Ubuntu 22.04 LTS', '10.0.2.10',
 '{"cpu_cores": 16, "memory_gb": 64, "disk_gb": 1024, "network_speed": "10Gbps"}',
 '[{"name": "node", "status": "running", "port": 8080, "pid": 2001}, {"name": "redis-client", "status": "running", "port": 6379, "pid": 2002}]'),
('api-prod-02', 'API Server 2', 'api-prod-02.example.com', 'online', 'api', '서울', 'production', 'GCP', 'Ubuntu 22.04 LTS', '10.0.2.11',
 '{"cpu_cores": 16, "memory_gb": 64, "disk_gb": 1024, "network_speed": "10Gbps"}',
 '[{"name": "node", "status": "running", "port": 8080, "pid": 2003}, {"name": "redis-client", "status": "running", "port": 6379, "pid": 2004}]');

-- Database Servers (PostgreSQL, 메모리 집약적)
INSERT INTO servers (id, name, hostname, status, type, location, environment, provider, os, ip, specs, services) VALUES
('db-prod-01', 'Database Primary', 'db-prod-01.example.com', 'online', 'database', '서울', 'production', 'AWS', 'Ubuntu 22.04 LTS', '10.0.3.10',
 '{"cpu_cores": 32, "memory_gb": 256, "disk_gb": 4096, "network_speed": "25Gbps"}',
 '[{"name": "postgresql", "status": "running", "port": 5432, "pid": 3001}, {"name": "pgbouncer", "status": "running", "port": 6432, "pid": 3002}]'),
('db-prod-02', 'Database Replica', 'db-prod-02.example.com', 'online', 'database', '서울', 'production', 'AWS', 'Ubuntu 22.04 LTS', '10.0.3.11',
 '{"cpu_cores": 32, "memory_gb": 256, "disk_gb": 4096, "network_speed": "25Gbps"}',
 '[{"name": "postgresql", "status": "running", "port": 5432, "pid": 3003}, {"name": "pgbouncer", "status": "running", "port": 6432, "pid": 3004}]');

-- Cache Servers (Redis, 초고속 메모리)
INSERT INTO servers (id, name, hostname, status, type, location, environment, provider, os, ip, specs, services) VALUES
('cache-prod-01', 'Redis Cache 1', 'cache-prod-01.example.com', 'online', 'cache', '서울', 'production', 'AWS', 'Ubuntu 22.04 LTS', '10.0.4.10',
 '{"cpu_cores": 8, "memory_gb": 128, "disk_gb": 256, "network_speed": "10Gbps"}',
 '[{"name": "redis", "status": "running", "port": 6379, "pid": 4001}]'),
('cache-prod-02', 'Redis Cache 2', 'cache-prod-02.example.com', 'online', 'cache', '서울', 'production', 'AWS', 'Ubuntu 22.04 LTS', '10.0.4.11',
 '{"cpu_cores": 8, "memory_gb": 128, "disk_gb": 256, "network_speed": "10Gbps"}',
 '[{"name": "redis", "status": "running", "port": 6379, "pid": 4002}]');

-- Storage Servers (파일 스토리지, 디스크 집약적)
INSERT INTO servers (id, name, hostname, status, type, location, environment, provider, os, ip, specs, services) VALUES
('storage-prod-01', 'Storage Server 1', 'storage-prod-01.example.com', 'online', 'storage', '서울', 'production', 'AWS', 'Ubuntu 22.04 LTS', '10.0.5.10',
 '{"cpu_cores": 8, "memory_gb": 64, "disk_gb": 10240, "network_speed": "10Gbps"}',
 '[{"name": "nfs-server", "status": "running", "port": 2049, "pid": 5001}, {"name": "s3-gateway", "status": "running", "port": 8000, "pid": 5002}]');

-- Load Balancer (트래픽 분산, 네트워크 집약적)
INSERT INTO servers (id, name, hostname, status, type, location, environment, provider, os, ip, specs, services) VALUES
('lb-prod-01', 'Load Balancer', 'lb-prod-01.example.com', 'online', 'load-balancer', '서울', 'production', 'AWS', 'Ubuntu 22.04 LTS', '10.0.6.10',
 '{"cpu_cores": 16, "memory_gb": 32, "disk_gb": 512, "network_speed": "100Gbps"}',
 '[{"name": "nginx", "status": "running", "port": 80, "pid": 6001}, {"name": "haproxy", "status": "running", "port": 443, "pid": 6002}]');

-- Backup Server
INSERT INTO servers (id, name, hostname, status, type, location, environment, provider, os, ip, specs, services) VALUES
('backup-prod-01', 'Backup Server', 'backup-prod-01.example.com', 'online', 'backup', '서울', 'production', 'AWS', 'Ubuntu 22.04 LTS', '10.0.7.10',
 '{"cpu_cores": 4, "memory_gb": 16, "disk_gb": 20480, "network_speed": "10Gbps"}',
 '[{"name": "restic", "status": "running", "port": null, "pid": 7001}, {"name": "rclone", "status": "running", "port": null, "pid": 7002}]');

-- Monitoring Server (Prometheus/Grafana)
INSERT INTO servers (id, name, hostname, status, type, location, environment, provider, os, ip, specs, services) VALUES
('monitoring-prod-01', 'Monitoring Server', 'monitoring-prod-01.example.com', 'online', 'monitoring', '서울', 'production', 'AWS', 'Ubuntu 22.04 LTS', '10.0.8.10',
 '{"cpu_cores": 8, "memory_gb": 32, "disk_gb": 2048, "network_speed": "10Gbps"}',
 '[{"name": "prometheus", "status": "running", "port": 9090, "pid": 8001}, {"name": "grafana", "status": "running", "port": 3000, "pid": 8002}]');

-- Security Server (방화벽/인증)
INSERT INTO servers (id, name, hostname, status, type, location, environment, provider, os, ip, specs, services) VALUES
('security-prod-01', 'Security Gateway', 'security-prod-01.example.com', 'online', 'security', '서울', 'production', 'AWS', 'Ubuntu 22.04 LTS', '10.0.9.10',
 '{"cpu_cores": 8, "memory_gb": 32, "disk_gb": 512, "network_speed": "10Gbps"}',
 '[{"name": "fail2ban", "status": "running", "port": null, "pid": 9001}, {"name": "ufw", "status": "running", "port": null, "pid": 9002}]');

-- Queue Server (RabbitMQ)
INSERT INTO servers (id, name, hostname, status, type, location, environment, provider, os, ip, specs, services) VALUES
('queue-prod-01', 'Message Queue', 'queue-prod-01.example.com', 'online', 'queue', '서울', 'production', 'AWS', 'Ubuntu 22.04 LTS', '10.0.10.10',
 '{"cpu_cores": 8, "memory_gb": 32, "disk_gb": 512, "network_speed": "10Gbps"}',
 '[{"name": "rabbitmq", "status": "running", "port": 5672, "pid": 10001}]');

-- App Server (마이크로서비스)
INSERT INTO servers (id, name, hostname, status, type, location, environment, provider, os, ip, specs, services) VALUES
('app-prod-01', 'App Server 1', 'app-prod-01.example.com', 'online', 'app', '서울', 'production', 'Vercel', 'Ubuntu 22.04 LTS', '10.0.11.10',
 '{"cpu_cores": 4, "memory_gb": 16, "disk_gb": 256, "network_speed": "10Gbps"}',
 '[{"name": "docker", "status": "running", "port": null, "pid": 11001}]');

-- Fallback Server (백업 시스템)
INSERT INTO servers (id, name, hostname, status, type, location, environment, provider, os, ip, specs, services) VALUES
('fallback-prod-01', 'Fallback Server', 'fallback-prod-01.example.com', 'maintenance', 'fallback', '서울', 'production', 'On-Premise', 'Ubuntu 22.04 LTS', '10.0.12.10',
 '{"cpu_cores": 8, "memory_gb": 32, "disk_gb": 1024, "network_speed": "10Gbps"}',
 '[{"name": "standby", "status": "standby", "port": null, "pid": null}]');

-- ==========================================
-- 2. 현실적인 서버 메트릭 생성 (현재 시각 기준)
-- ==========================================
-- SERVER_TYPE_DEFINITIONS의 특성 반영:
-- - web: cpuWeight 0.7, networkWeight 1.2
-- - api: cpuWeight 0.8
-- - database: memoryWeight 0.9, diskWeight 1.0
-- - cache: memoryWeight 1.2
-- - storage: diskWeight 1.2

-- Web Servers (높은 네트워크 사용률)
INSERT INTO server_metrics (server_id, cpu, memory, disk, network, response_time, connections, uptime, health_score) VALUES
('web-prod-01', 45.2, 62.5, 35.8, 78.3, 120, 1250, 2592000, 92),
('web-prod-02', 48.7, 58.3, 32.1, 82.1, 115, 1180, 2592000, 94),
('web-prod-03', 72.4, 68.9, 38.5, 85.6, 180, 1450, 2592000, 76);

-- API Servers (높은 CPU 사용률)
INSERT INTO server_metrics (server_id, cpu, memory, disk, network, response_time, connections, uptime, health_score) VALUES
('api-prod-01', 65.3, 55.2, 28.4, 45.7, 85, 850, 2592000, 88),
('api-prod-02', 58.9, 52.1, 25.3, 42.3, 78, 780, 2592000, 91);

-- Database Servers (높은 메모리, 디스크 사용률)
INSERT INTO server_metrics (server_id, cpu, memory, disk, network, response_time, connections, uptime, health_score) VALUES
('db-prod-01', 42.5, 78.6, 65.2, 38.9, 45, 320, 7776000, 95),
('db-prod-02', 38.2, 72.4, 62.8, 35.1, 42, 280, 7776000, 96);

-- Cache Servers (초고속, 높은 메모리)
INSERT INTO server_metrics (server_id, cpu, memory, disk, network, response_time, connections, uptime, health_score) VALUES
('cache-prod-01', 28.5, 82.3, 15.2, 58.7, 8, 2500, 5184000, 98),
('cache-prod-02', 25.8, 79.8, 12.8, 55.3, 7, 2350, 5184000, 99);

-- Storage Server (높은 디스크 사용률)
INSERT INTO server_metrics (server_id, cpu, memory, disk, network, response_time, connections, uptime, health_score) VALUES
('storage-prod-01', 35.2, 45.8, 72.5, 62.3, 95, 450, 7776000, 89);

-- Load Balancer (높은 네트워크)
INSERT INTO server_metrics (server_id, cpu, memory, disk, network, response_time, connections, uptime, health_score) VALUES
('lb-prod-01', 38.5, 42.3, 18.5, 88.9, 12, 5000, 7776000, 97);

-- Backup Server
INSERT INTO server_metrics (server_id, cpu, memory, disk, network, response_time, connections, uptime, health_score) VALUES
('backup-prod-01', 22.5, 35.2, 68.5, 28.3, 250, 50, 7776000, 93);

-- Monitoring Server
INSERT INTO server_metrics (server_id, cpu, memory, disk, network, response_time, connections, uptime, health_score) VALUES
('monitoring-prod-01', 45.8, 68.5, 52.3, 45.2, 150, 200, 5184000, 90);

-- Security Server
INSERT INTO server_metrics (server_id, cpu, memory, disk, network, response_time, connections, uptime, health_score) VALUES
('security-prod-01', 32.5, 48.2, 25.8, 52.3, 35, 1500, 7776000, 95);

-- Queue Server
INSERT INTO server_metrics (server_id, cpu, memory, disk, network, response_time, connections, uptime, health_score) VALUES
('queue-prod-01', 42.8, 58.5, 32.5, 48.5, 65, 650, 5184000, 91);

-- App Server
INSERT INTO server_metrics (server_id, cpu, memory, disk, network, response_time, connections, uptime, health_score) VALUES
('app-prod-01', 55.2, 62.8, 38.5, 52.3, 120, 380, 2592000, 87);

-- Fallback Server (대기 중)
INSERT INTO server_metrics (server_id, cpu, memory, disk, network, response_time, connections, uptime, health_score) VALUES
('fallback-prod-01', 5.2, 12.5, 15.8, 8.5, 0, 0, 7776000, 100);

-- ==========================================
-- 3. 현실적인 알림 생성 (FAILURE_IMPACT_GRAPH 기반)
-- ==========================================

-- Web Server 3 경고 (높은 CPU 사용률)
INSERT INTO server_alerts (server_id, type, severity, message, status, metadata) VALUES
('web-prod-03', 'cpu', 'warning', 'CPU 사용률이 70%를 초과했습니다', 'active',
 '{"threshold": 70, "current_value": 72.4, "duration_minutes": 15, "trend": "increasing"}');

-- Web Server 3 성능 경고
INSERT INTO server_alerts (server_id, type, severity, message, status, metadata) VALUES
('web-prod-03', 'performance', 'warning', '응답 시간이 평균보다 50% 느립니다', 'acknowledged',
 '{"avg_response_time": 120, "current_response_time": 180, "affected_endpoints": ["/api", "/dashboard"]}');

-- API Server 1 CPU 경고 (의존성: database, cache)
INSERT INTO server_alerts (server_id, type, severity, message, status, metadata) VALUES
('api-prod-01', 'cpu', 'warning', 'CPU 사용률이 임계값에 근접했습니다', 'active',
 '{"threshold": 70, "current_value": 65.3, "cascade_impact": ["database", "cache"], "auto_recovery": true}');

-- Database Primary 디스크 경고 (연쇄 영향: api, backup)
INSERT INTO server_alerts (server_id, type, severity, message, status, metadata) VALUES
('db-prod-01', 'disk', 'warning', '디스크 사용률이 65%를 초과했습니다', 'active',
 '{"threshold": 70, "current_value": 65.2, "affected_services": ["api-prod-01", "api-prod-02", "backup-prod-01"]}');

-- Cache Server 메모리 정보 (정상 범위)
INSERT INTO server_alerts (server_id, type, severity, message, status, metadata) VALUES
('cache-prod-01', 'memory', 'info', '캐시 메모리 최적화 완료', 'resolved',
 '{"optimization_type": "eviction_policy", "memory_freed_mb": 2048, "performance_gain": "8%"}');

-- Security Server 보안 이벤트
INSERT INTO server_alerts (server_id, type, severity, message, status, metadata) VALUES
('security-prod-01', 'security', 'critical', '비정상적인 로그인 시도 탐지', 'resolved',
 '{"ip_address": "185.220.101.45", "attempts": 15, "blocked": true, "geolocations": ["Russia", "China"]}');

-- Load Balancer 트래픽 급증 (해결됨)
INSERT INTO server_alerts (server_id, type, severity, message, status, metadata) VALUES
('lb-prod-01', 'network', 'warning', '트래픽이 평소보다 40% 증가했습니다', 'resolved',
 '{"normal_rps": 5000, "current_rps": 7000, "auto_scaling": true, "new_instances": 2}');

-- ==========================================
-- 완료
-- ==========================================
-- 총 생성된 데이터:
-- - 서버: 17개 (12개 서버 타입 모두 포함)
-- - 메트릭: 17개 (현재 시각 기준 스냅샷)
-- - 알림: 7개 (다양한 시나리오)
