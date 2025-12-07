-- Migration: Create ML Training Results Table
-- Description: ML 학습 결과 저장 및 이력 관리 (실제 통계 기반)
-- Date: 2025-12-04
-- Author: AI Assistant

-- 1. ML 학습 결과 테이블 생성
CREATE TABLE IF NOT EXISTS ml_training_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('patterns', 'anomaly', 'incident', 'prediction')),
  patterns_learned INTEGER NOT NULL DEFAULT 0,
  accuracy_improvement NUMERIC(5,2) NOT NULL DEFAULT 0,
  confidence NUMERIC(4,3) NOT NULL DEFAULT 0,
  insights JSONB DEFAULT '[]'::jsonb,
  next_recommendation TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 추가 컨텍스트
  server_id TEXT,
  time_range TEXT,
  config JSONB
);

-- 2. 인덱스 생성 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_ml_training_type
  ON ml_training_results(type);
CREATE INDEX IF NOT EXISTS idx_ml_training_created_at
  ON ml_training_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ml_training_server_id
  ON ml_training_results(server_id);
CREATE INDEX IF NOT EXISTS idx_ml_training_type_created
  ON ml_training_results(type, created_at DESC);

-- 3. RLS (Row Level Security) 정책
ALTER TABLE ml_training_results ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 학습 결과 삽입 가능
CREATE POLICY "Anyone can insert training results"
  ON ml_training_results
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 읽기는 인증된 사용자만
CREATE POLICY "Authenticated users can read training results"
  ON ml_training_results
  FOR SELECT
  TO authenticated
  USING (true);

-- 익명 사용자도 읽기 허용 (대시보드 표시용)
CREATE POLICY "Anonymous can read training results"
  ON ml_training_results
  FOR SELECT
  TO anon
  USING (true);

-- 4. 학습 이력 통계 뷰 (정확도 추적용)
CREATE OR REPLACE VIEW ml_training_history AS
SELECT
  type,
  DATE_TRUNC('day', created_at) as training_date,
  COUNT(*) as training_count,
  AVG(patterns_learned) as avg_patterns,
  AVG(accuracy_improvement) as avg_accuracy_improvement,
  AVG(confidence) as avg_confidence,
  MAX(created_at) as last_training
FROM ml_training_results
GROUP BY type, DATE_TRUNC('day', created_at)
ORDER BY training_date DESC;

-- 5. 최근 학습 결과 조회 함수 (정확도 비교용)
CREATE OR REPLACE FUNCTION get_previous_training_stats(
  p_type TEXT,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  avg_accuracy NUMERIC,
  avg_confidence NUMERIC,
  total_patterns INTEGER,
  training_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    AVG(accuracy_improvement)::NUMERIC as avg_accuracy,
    AVG(confidence)::NUMERIC as avg_confidence,
    SUM(patterns_learned)::INTEGER as total_patterns,
    COUNT(*)::BIGINT as training_count
  FROM (
    SELECT accuracy_improvement, confidence, patterns_learned
    FROM ml_training_results
    WHERE type = p_type
    ORDER BY created_at DESC
    LIMIT p_limit
  ) recent;
END;
$$ LANGUAGE plpgsql;

-- 6. 코멘트
COMMENT ON TABLE ml_training_results IS 'ML 학습 결과 저장 - 정확도 추적 및 개선 분석용';
COMMENT ON COLUMN ml_training_results.type IS '학습 유형: patterns, anomaly, incident, prediction';
COMMENT ON COLUMN ml_training_results.patterns_learned IS '학습된 패턴 수';
COMMENT ON COLUMN ml_training_results.accuracy_improvement IS '정확도 개선율 (%)';
COMMENT ON COLUMN ml_training_results.confidence IS '신뢰도 (0-1)';
COMMENT ON VIEW ml_training_history IS '일별 학습 이력 통계';
COMMENT ON FUNCTION get_previous_training_stats IS '이전 학습 통계 조회 (정확도 비교용)';
