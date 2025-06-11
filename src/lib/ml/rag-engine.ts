/**
 * 📚 Local RAG (Retrieval-Augmented Generation) Engine
 * 
 * 벡터 데이터베이스를 활용한 로컬 RAG 시스템
 * - 임베딩 기반 문서 검색
 * - 컨텍스트 증강 응답 생성
 * - 오프라인 AI 추론 지원
 */

export interface RAGDocument {
    id: string;
    content: string;
    metadata: {
        source: string;
        timestamp: string;
        category: string;
        tags: string[];
    };
    embedding?: number[];
}

export interface RAGQuery {
    query: string;
    maxResults?: number;
    threshold?: number;
    category?: string;
}

export interface RAGResponse {
    success: boolean;
    query: string;
    results: Array<{
        document: RAGDocument;
        score: number;
        relevance: number;
    }>;
    processingTime: number;
    metadata: {
        totalDocuments: number;
        searchTime: number;
        embedding: number[];
    };
}

export class LocalRAGEngine {
    private documents: Map<string, RAGDocument> = new Map();
    private embeddings: Map<string, number[]> = new Map();
    private initialized: boolean = false;

    constructor() {
        console.log('🔍 Local RAG Engine 초기화');
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            console.log('🚀 RAG Engine 초기화 시작...');

            // 기본 문서들 로드
            await this.loadDefaultDocuments();

            this.initialized = true;
            console.log('✅ RAG Engine 초기화 완료');
        } catch (error) {
            console.error('❌ RAG Engine 초기화 실패:', error);
            throw error;
        }
    }

    public async addDocument(document: RAGDocument): Promise<void> {
        try {
            // 간단한 텍스트 임베딩 (실제로는 트랜스포머 모델 사용)
            const embedding = await this.generateEmbedding(document.content);

            document.embedding = embedding;
            this.documents.set(document.id, document);
            this.embeddings.set(document.id, embedding);

            console.log(`📄 문서 추가됨: ${document.id}`);
        } catch (error) {
            console.error('❌ 문서 추가 실패:', error);
            throw error;
        }
    }

    public async search(query: RAGQuery): Promise<RAGResponse> {
        const startTime = Date.now();

        try {
            // 쿼리 임베딩 생성
            const queryEmbedding = await this.generateEmbedding(query.query);

            // 유사도 계산
            const results: Array<{
                document: RAGDocument;
                score: number;
                relevance: number;
            }> = [];

            for (const [docId, document] of this.documents) {
                if (query.category && document.metadata.category !== query.category) {
                    continue;
                }

                const docEmbedding = this.embeddings.get(docId);
                if (!docEmbedding) continue;

                const similarity = this.calculateCosineSimilarity(queryEmbedding, docEmbedding);

                if (similarity >= (query.threshold || 0.3)) {
                    results.push({
                        document,
                        score: similarity,
                        relevance: similarity * 100
                    });
                }
            }

            // 점수 순으로 정렬
            results.sort((a, b) => b.score - a.score);

            // 최대 결과 수 제한
            const maxResults = query.maxResults || 10;
            const finalResults = results.slice(0, maxResults);

            const processingTime = Date.now() - startTime;

            return {
                success: true,
                query: query.query,
                results: finalResults,
                processingTime,
                metadata: {
                    totalDocuments: this.documents.size,
                    searchTime: processingTime,
                    embedding: queryEmbedding
                }
            };
        } catch (error) {
            console.error('❌ RAG 검색 실패:', error);

            return {
                success: false,
                query: query.query,
                results: [],
                processingTime: Date.now() - startTime,
                metadata: {
                    totalDocuments: this.documents.size,
                    searchTime: 0,
                    embedding: []
                }
            };
        }
    }

    private async generateEmbedding(text: string): Promise<number[]> {
        try {
            // 간단한 TF-IDF 스타일 벡터화 (실제로는 트랜스포머 모델 사용)
            const words = text.toLowerCase().split(/\s+/);
            const wordFreq = new Map<string, number>();

            words.forEach(word => {
                wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
            });

            // 고정 크기 벡터 생성 (384차원)
            const embedding = new Array(384).fill(0);
            let index = 0;

            for (const [word, freq] of wordFreq) {
                const hash = this.hashString(word) % 384;
                embedding[hash] += freq;
                index++;
            }

            // 정규화
            const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
            return embedding.map(val => norm > 0 ? val / norm : 0);
        } catch (error) {
            console.error('❌ 임베딩 생성 실패:', error);
            return new Array(384).fill(0);
        }
    }

    private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
        if (vec1.length !== vec2.length) return 0;

        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }

        if (norm1 === 0 || norm2 === 0) return 0;

        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32bit integer 변환
        }
        return Math.abs(hash);
    }

    private async loadDefaultDocuments(): Promise<void> {
        const defaultDocs: RAGDocument[] = [
            {
                id: 'server-monitoring-guide',
                content: '서버 모니터링은 시스템의 성능과 가용성을 지속적으로 관찰하는 과정입니다. CPU, 메모리, 디스크, 네트워크 사용률을 추적하여 문제를 조기에 발견할 수 있습니다.',
                metadata: {
                    source: 'system-docs',
                    timestamp: new Date().toISOString(),
                    category: 'monitoring',
                    tags: ['server', 'monitoring', 'performance']
                }
            },
            {
                id: 'ai-analysis-basics',
                content: 'AI 분석은 머신러닝 알고리즘을 사용하여 시스템 데이터에서 패턴을 찾고 예측을 수행합니다. 이상 탐지, 용량 계획, 성능 최적화에 활용됩니다.',
                metadata: {
                    source: 'ai-docs',
                    timestamp: new Date().toISOString(),
                    category: 'ai',
                    tags: ['ai', 'analysis', 'prediction']
                }
            },
            {
                id: 'troubleshooting-common-issues',
                content: '일반적인 서버 문제는 높은 CPU 사용률, 메모리 부족, 디스크 공간 부족, 네트워크 연결 문제 등이 있습니다. 각 문제는 특정한 해결 방법과 예방 조치가 필요합니다.',
                metadata: {
                    source: 'troubleshooting-guide',
                    timestamp: new Date().toISOString(),
                    category: 'troubleshooting',
                    tags: ['troubleshooting', 'issues', 'solutions']
                }
            }
        ];

        for (const doc of defaultDocs) {
            await this.addDocument(doc);
        }
    }

    public getStats(): {
        totalDocuments: number;
        totalEmbeddings: number;
        initialized: boolean;
    } {
        return {
            totalDocuments: this.documents.size,
            totalEmbeddings: this.embeddings.size,
            initialized: this.initialized
        };
    }

    /**
     * 🔍 쿼리 메서드 (UnifiedAIEngine 호환)
     */
    public async query(query: string, options?: { limit?: number; threshold?: number; category?: string }): Promise<RAGResponse> {
        return this.search({
            query,
            maxResults: options?.limit,
            threshold: options?.threshold,
            category: options?.category
        });
    }
} 