-- OpenManager Vibe v5 개발 데이터베이스 초기화 스크립트
-- 한국어 설정
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
-- 필요한 확장 설치
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
-- 타임존 설정
SET timezone = 'Asia/Seoul';
-- 개발용 기본 스키마 생성
CREATE SCHEMA IF NOT EXISTS dev_monitoring;
CREATE SCHEMA IF NOT EXISTS dev_ai_engine;
CREATE SCHEMA IF NOT EXISTS dev_mcp;
-- 기본 테이블 생성 (예시)
CREATE TABLE IF NOT EXISTS dev_monitoring.servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INTEGER DEFAULT 22,
    status VARCHAR(50) DEFAULT 'unknown',
    cpu_usage DECIMAL(5, 2) DEFAULT 0.00,
    memory_usage DECIMAL(5, 2) DEFAULT 0.00,
    disk_usage DECIMAL(5, 2) DEFAULT 0.00,
    network_in BIGINT DEFAULT 0,
    network_out BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS dev_monitoring.metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID REFERENCES dev_monitoring.servers(id) ON DELETE CASCADE,
    metric_type VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10, 2) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS dev_ai_engine.ai_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engine_type VARCHAR(100) NOT NULL,
    request_data JSONB NOT NULL,
    response_data JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS dev_mcp.mcp_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_name VARCHAR(255) NOT NULL,
    server_info JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW()
);
-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_servers_status ON dev_monitoring.servers(status);
CREATE INDEX IF NOT EXISTS idx_servers_updated_at ON dev_monitoring.servers(updated_at);
CREATE INDEX IF NOT EXISTS idx_metrics_server_id ON dev_monitoring.metrics(server_id);
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON dev_monitoring.metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_metrics_type ON dev_monitoring.metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_ai_requests_engine_type ON dev_ai_engine.ai_requests(engine_type);
CREATE INDEX IF NOT EXISTS idx_ai_requests_status ON dev_ai_engine.ai_requests(status);
CREATE INDEX IF NOT EXISTS idx_ai_requests_created_at ON dev_ai_engine.ai_requests(created_at);
-- 트리거 함수 생성 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
-- 트리거 생성
CREATE TRIGGER update_servers_updated_at BEFORE
UPDATE ON dev_monitoring.servers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- 샘플 데이터 삽입 (개발용)
INSERT INTO dev_monitoring.servers (
        name,
        host,
        status,
        cpu_usage,
        memory_usage,
        disk_usage
    )
VALUES (
        'dev-server-01',
        '192.168.1.100',
        'active',
        45.67,
        78.23,
        65.45
    ),
    (
        'dev-server-02',
        '192.168.1.101',
        'active',
        23.12,
        56.78,
        43.21
    ),
    (
        'dev-server-03',
        '192.168.1.102',
        'warning',
        78.90,
        89.12,
        87.65
    ),
    (
        'dev-server-04',
        '192.168.1.103',
        'critical',
        95.45,
        98.76,
        95.23
    ) ON CONFLICT DO NOTHING;
-- 권한 설정
GRANT ALL PRIVILEGES ON SCHEMA dev_monitoring TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA dev_ai_engine TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA dev_mcp TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA dev_monitoring TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA dev_ai_engine TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA dev_mcp TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA dev_monitoring TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA dev_ai_engine TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA dev_mcp TO postgres;
-- 개발 환경 설정 완료 확인
SELECT 'OpenManager Vibe v5 개발 데이터베이스 초기화 완료!' as message;