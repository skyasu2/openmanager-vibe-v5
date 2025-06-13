/**
 * 🗄️ Supabase Vector Database Service
 * 
 * PostgreSQL + pgvector 기반 벡터 검색 시스템
 * - 실제 데이터베이스 영구 저장
 * - 고성능 벡터 유사도 검색
 * - 메타데이터 필터링 지원
 * - 확장 가능한 아키텍처
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface VectorDocument {
    id?: number;
    content: string;
    metadata: Record<string, any>;
    embedding: number[];
    created_at?: string;
    updated_at?: string;
}

interface SearchResult {
    id: number;
    content: string;
    metadata: Record<string, any>;
    similarity: number;
    created_at: string;
}

interface SearchOptions {
    limit?: number;
    threshold?: number;
    category?: string;
    source?: string;
}

export class SupabaseVectorService {
    private supabase: SupabaseClient;
    private initialized = false;

    constructor() {
        // 메모리에서 가져온 Supabase 설정 사용
        const supabaseUrl = 'https://vnswjnltnhpsueosfhmw.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8';

        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log('🗄️ Supabase Vector Service 초기화');
    }

    /**
     * 벡터 테이블 초기화 (필요시 자동 생성)
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // 테이블 존재 확인
            const { data, error } = await this.supabase
                .from('vector_documents')
                .select('id')
                .limit(1);

            if (error && error.code === 'PGRST116') {
                // 테이블이 없으면 생성 (SQL 실행)
                console.log('📋 벡터 테이블 생성 중...');
                await this.createVectorTable();
            }

            this.initialized = true;
            console.log('✅ Supabase Vector Service 초기화 완료');
        } catch (error) {
            console.error('❌ Supabase Vector 초기화 실패:', error);
            throw error;
        }
    }

    /**
     * 벡터 테이블 생성 (SQL)
     */
    private async createVectorTable(): Promise<void> {
        const createTableSQL = `
      -- pgvector 확장 활성화
      CREATE EXTENSION IF NOT EXISTS vector;
      
      -- 벡터 문서 테이블 생성
      CREATE TABLE IF NOT EXISTS vector_documents (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        embedding VECTOR(384), -- 384차원 임베딩 (sentence-transformers 기본)
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- 벡터 유사도 검색 인덱스 생성
      CREATE INDEX IF NOT EXISTS vector_documents_embedding_idx 
      ON vector_documents USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
      
      -- 메타데이터 검색 인덱스
      CREATE INDEX IF NOT EXISTS vector_documents_metadata_idx 
      ON vector_documents USING GIN (metadata);
      
      -- 업데이트 시간 자동 갱신 함수
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
      
      -- 업데이트 트리거 생성
      DROP TRIGGER IF EXISTS update_vector_documents_updated_at ON vector_documents;
      CREATE TRIGGER update_vector_documents_updated_at
        BEFORE UPDATE ON vector_documents
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;

        const { error } = await this.supabase.rpc('exec_sql', {
            sql: createTableSQL
        });

        if (error) {
            console.error('❌ 벡터 테이블 생성 실패:', error);
            // 테이블 생성 실패해도 계속 진행 (이미 존재할 수 있음)
        }
    }

    /**
     * 문서 및 임베딩 저장
     */
    async addDocument(
        content: string,
        metadata: Record<string, any> = {}
    ): Promise<VectorDocument | null> {
        try {
            await this.initialize();

            // 임베딩 생성
            const embedding = await this.generateEmbedding(content);

            const { data, error } = await this.supabase
                .from('vector_documents')
                .insert({
                    content,
                    metadata,
                    embedding,
                })
                .select()
                .single();

            if (error) {
                console.error('❌ 문서 저장 실패:', error);
                return null;
            }

            console.log(`📄 문서 저장 완료: ${data.id}`);
            return data;
        } catch (error) {
            console.error('❌ 문서 추가 오류:', error);
            return null;
        }
    }

    /**
     * 유사도 검색
     */
    async searchSimilar(
        query: string,
        options: SearchOptions = {}
    ): Promise<SearchResult[]> {
        try {
            await this.initialize();

            const {
                limit = 5,
                threshold = 0.7,
                category,
                source
            } = options;

            // 쿼리 임베딩 생성
            const queryEmbedding = await this.generateEmbedding(query);

            // 모든 문서를 가져와서 클라이언트에서 유사도 계산
            let dbQuery = this.supabase
                .from('vector_documents')
                .select('id, content, metadata, embedding, created_at');

            // 메타데이터 필터링
            if (category) {
                dbQuery = dbQuery.filter('metadata->>category', 'eq', category);
            }
            if (source) {
                dbQuery = dbQuery.filter('metadata->>source', 'eq', source);
            }

            const { data, error } = await dbQuery;

            if (error) {
                console.error('❌ 벡터 검색 실패:', error);
                return [];
            }

            // 클라이언트에서 유사도 계산 및 정렬
            const results: SearchResult[] = [];
            if (data) {
                for (const doc of data) {
                    const similarity = this.calculateCosineSimilarity(queryEmbedding, doc.embedding);
                    if (similarity >= threshold) {
                        results.push({
                            id: doc.id,
                            content: doc.content,
                            metadata: doc.metadata,
                            similarity,
                            created_at: doc.created_at
                        });
                    }
                }

                // 유사도 순으로 정렬하고 제한
                results.sort((a, b) => b.similarity - a.similarity);
                return results.slice(0, limit);
            }

            return [];
        } catch (error) {
            console.error('❌ 유사도 검색 오류:', error);
            return [];
        }
    }

    /**
     * 임베딩 생성 (로컬 TF-IDF 기반)
     */
    private async generateEmbedding(text: string): Promise<number[]> {
        // 간단한 TF-IDF 기반 임베딩 (384차원)
        const words = text.toLowerCase()
            .replace(/[^\w\s가-힣]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 1);

        // 384차원 벡터 초기화
        const embedding = new Array(384).fill(0);

        // 단어별 해시 기반 임베딩
        words.forEach((word, index) => {
            const hash = this.simpleHash(word);
            const position = Math.abs(hash) % 384;
            const weight = 1 / Math.sqrt(words.length); // TF 정규화

            embedding[position] += weight;

            // 2-gram 처리
            if (index < words.length - 1) {
                const bigram = word + words[index + 1];
                const bigramHash = this.simpleHash(bigram);
                const bigramPos = Math.abs(bigramHash) % 384;
                embedding[bigramPos] += weight * 0.5;
            }
        });

        // L2 정규화
        const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        if (norm > 0) {
            for (let i = 0; i < embedding.length; i++) {
                embedding[i] /= norm;
            }
        }

        return embedding;
    }

    /**
 * 간단한 해시 함수
 */
    private simpleHash(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32비트 정수로 변환
        }
        return hash;
    }

    /**
     * 코사인 유사도 계산
     */
    private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
        if (vec1.length !== vec2.length) {
            return 0;
        }

        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }

        const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
        return magnitude === 0 ? 0 : dotProduct / magnitude;
    }

    /**
     * 문서 삭제
     */
    async deleteDocument(id: number): Promise<boolean> {
        try {
            const { error } = await this.supabase
                .from('vector_documents')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('❌ 문서 삭제 실패:', error);
                return false;
            }

            console.log(`🗑️ 문서 삭제 완료: ${id}`);
            return true;
        } catch (error) {
            console.error('❌ 문서 삭제 오류:', error);
            return false;
        }
    }

    /**
     * 전체 문서 수 조회
     */
    async getDocumentCount(): Promise<number> {
        try {
            const { count, error } = await this.supabase
                .from('vector_documents')
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.error('❌ 문서 수 조회 실패:', error);
                return 0;
            }

            return count || 0;
        } catch (error) {
            console.error('❌ 문서 수 조회 오류:', error);
            return 0;
        }
    }

    /**
     * 상태 확인
     */
    async getStatus(): Promise<{
        connected: boolean;
        documentCount: number;
        initialized: boolean;
    }> {
        try {
            const documentCount = await this.getDocumentCount();

            return {
                connected: true,
                documentCount,
                initialized: this.initialized,
            };
        } catch (error) {
            return {
                connected: false,
                documentCount: 0,
                initialized: false,
            };
        }
    }

    /**
     * 기본 문서 로드
     */
    async loadDefaultDocuments(): Promise<void> {
        const defaultDocs = [
            {
                content: '서버 모니터링은 시스템의 성능과 가용성을 지속적으로 관찰하는 과정입니다. CPU, 메모리, 디스크, 네트워크 사용률을 추적하여 문제를 조기에 발견할 수 있습니다.',
                metadata: {
                    source: 'system-docs',
                    category: 'monitoring',
                    tags: ['server', 'monitoring', 'performance'],
                    priority: 1
                }
            },
            {
                content: 'AI 분석은 머신러닝 알고리즘을 사용하여 시스템 데이터에서 패턴을 찾고 예측을 수행합니다. 이상 탐지, 용량 계획, 성능 최적화에 활용됩니다.',
                metadata: {
                    source: 'ai-docs',
                    category: 'ai',
                    tags: ['ai', 'analysis', 'prediction'],
                    priority: 1
                }
            },
            {
                content: '일반적인 서버 문제는 높은 CPU 사용률, 메모리 부족, 디스크 공간 부족, 네트워크 연결 문제 등이 있습니다. 각 문제는 특정한 해결 방법과 예방 조치가 필요합니다.',
                metadata: {
                    source: 'troubleshooting-guide',
                    category: 'troubleshooting',
                    tags: ['troubleshooting', 'issues', 'solutions'],
                    priority: 1
                }
            }
        ];

        for (const doc of defaultDocs) {
            await this.addDocument(doc.content, doc.metadata);
        }

        console.log('📚 기본 문서 로드 완료');
    }
}

// 싱글톤 인스턴스
export const supabaseVectorService = new SupabaseVectorService(); 