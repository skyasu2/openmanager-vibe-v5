-- 🚀 OpenManager Vibe v5 - Supabase 벡터 DB 수동 설정
-- Supabase Dashboard → SQL Editor에서 실행하세요
-- 1. pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;
-- 2. command_vectors 테이블 생성
CREATE TABLE IF NOT EXISTS command_vectors (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL,
    embedding vector(384),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 3. 벡터 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS command_vectors_embedding_cosine_idx ON command_vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS command_vectors_metadata_idx ON command_vectors USING gin (metadata);
-- 4. 벡터 검색 RPC 함수 생성
CREATE OR REPLACE FUNCTION search_similar_commands(
        query_embedding vector(384),
        match_threshold float DEFAULT 0.7,
        match_count int DEFAULT 5
    ) RETURNS TABLE (
        id text,
        content text,
        metadata jsonb,
        similarity float
    ) LANGUAGE sql STABLE AS $$
SELECT command_vectors.id,
    command_vectors.content,
    command_vectors.metadata,
    1 - (command_vectors.embedding <=> query_embedding) as similarity
FROM command_vectors
WHERE 1 - (command_vectors.embedding <=> query_embedding) > match_threshold
ORDER BY command_vectors.embedding <=> query_embedding
LIMIT match_count;
$$;
-- 5. RLS 정책 설정
ALTER TABLE command_vectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to command_vectors" ON command_vectors FOR
SELECT USING (true);
CREATE POLICY "Allow insert access to command_vectors" ON command_vectors FOR
INSERT WITH CHECK (true);
CREATE POLICY "Allow update access to command_vectors" ON command_vectors FOR
UPDATE USING (true);
-- 6. 테스트 데이터 삽입
INSERT INTO command_vectors (id, content, metadata, embedding)
VALUES (
        'test-vector-001',
        'top 명령어는 실시간으로 실행 중인 프로세스를 모니터링하는 도구입니다.',
        '{"category": "linux", "tags": ["monitoring", "process"], "commands": ["top"]}',
        ARRAY [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 
          0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.20,
          0.21, 0.22, 0.23, 0.24, 0.25, 0.26, 0.27, 0.28, 0.29, 0.30,
          0.31, 0.32, 0.33, 0.34, 0.35, 0.36, 0.37, 0.38, 0.39, 0.40,
          0.41, 0.42, 0.43, 0.44, 0.45, 0.46, 0.47, 0.48, 0.49, 0.50,
          0.51, 0.52, 0.53, 0.54, 0.55, 0.56, 0.57, 0.58, 0.59, 0.60,
          0.61, 0.62, 0.63, 0.64, 0.65, 0.66, 0.67, 0.68, 0.69, 0.70,
          0.71, 0.72, 0.73, 0.74, 0.75, 0.76, 0.77, 0.78, 0.79, 0.80,
          0.81, 0.82, 0.83, 0.84, 0.85, 0.86, 0.87, 0.88, 0.89, 0.90,
          0.91, 0.92, 0.93, 0.94, 0.95, 0.96, 0.97, 0.98, 0.99, 1.00,
          0.101, 0.102, 0.103, 0.104, 0.105, 0.106, 0.107, 0.108, 0.109, 0.110,
          0.111, 0.112, 0.113, 0.114, 0.115, 0.116, 0.117, 0.118, 0.119, 0.120,
          0.121, 0.122, 0.123, 0.124, 0.125, 0.126, 0.127, 0.128, 0.129, 0.130,
          0.131, 0.132, 0.133, 0.134, 0.135, 0.136, 0.137, 0.138, 0.139, 0.140,
          0.141, 0.142, 0.143, 0.144, 0.145, 0.146, 0.147, 0.148, 0.149, 0.150,
          0.151, 0.152, 0.153, 0.154, 0.155, 0.156, 0.157, 0.158, 0.159, 0.160,
          0.161, 0.162, 0.163, 0.164, 0.165, 0.166, 0.167, 0.168, 0.169, 0.170,
          0.171, 0.172, 0.173, 0.174, 0.175, 0.176, 0.177, 0.178, 0.179, 0.180,
          0.181, 0.182, 0.183, 0.184, 0.185, 0.186, 0.187, 0.188, 0.189, 0.190,
          0.191, 0.192, 0.193, 0.194, 0.195, 0.196, 0.197, 0.198, 0.199, 0.200,
          0.201, 0.202, 0.203, 0.204, 0.205, 0.206, 0.207, 0.208, 0.209, 0.210,
          0.211, 0.212, 0.213, 0.214, 0.215, 0.216, 0.217, 0.218, 0.219, 0.220,
          0.221, 0.222, 0.223, 0.224, 0.225, 0.226, 0.227, 0.228, 0.229, 0.230,
          0.231, 0.232, 0.233, 0.234, 0.235, 0.236, 0.237, 0.238, 0.239, 0.240,
          0.241, 0.242, 0.243, 0.244, 0.245, 0.246, 0.247, 0.248, 0.249, 0.250,
          0.251, 0.252, 0.253, 0.254, 0.255, 0.256, 0.257, 0.258, 0.259, 0.260,
          0.261, 0.262, 0.263, 0.264, 0.265, 0.266, 0.267, 0.268, 0.269, 0.270,
          0.271, 0.272, 0.273, 0.274, 0.275, 0.276, 0.277, 0.278, 0.279, 0.280,
          0.281, 0.282, 0.283, 0.284, 0.285, 0.286, 0.287, 0.288, 0.289, 0.290,
          0.291, 0.292, 0.293, 0.294, 0.295, 0.296, 0.297, 0.298, 0.299, 0.300,
          0.301, 0.302, 0.303, 0.304, 0.305, 0.306, 0.307, 0.308, 0.309, 0.310,
          0.311, 0.312, 0.313, 0.314, 0.315, 0.316, 0.317, 0.318, 0.319, 0.320,
          0.321, 0.322, 0.323, 0.324, 0.325, 0.326, 0.327, 0.328, 0.329, 0.330,
          0.331, 0.332, 0.333, 0.334, 0.335, 0.336, 0.337, 0.338, 0.339, 0.340,
          0.341, 0.342, 0.343, 0.344, 0.345, 0.346, 0.347, 0.348, 0.349, 0.350,
          0.351, 0.352, 0.353, 0.354, 0.355, 0.356, 0.357, 0.358, 0.359, 0.360,
          0.361, 0.362, 0.363, 0.364, 0.365, 0.366, 0.367, 0.368, 0.369, 0.370,
          0.371, 0.372, 0.373, 0.374, 0.375, 0.376, 0.377, 0.378, 0.379, 0.380,
          0.381, 0.382, 0.383, 0.384]::vector(384)
    ) ON CONFLICT (id) DO NOTHING;
-- 7. 설정 완료 확인 쿼리
SELECT 'Supabase 벡터 DB 설정 완료!' as status,
    COUNT(*) as total_documents,
    'search_similar_commands' as rpc_function
FROM command_vectors;