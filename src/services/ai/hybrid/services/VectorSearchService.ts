/**
 * 🔍 벡터 검색 서비스 v1.0
 * 
 * 책임:
 * - 벡터 기반 의미적 검색
 * - 문서 유사도 계산
 * - 하이브리드 문서 검색
 * - 검색 결과 랭킹
 */

import { LocalVectorDB } from '../../local-vector-db';
import { DocumentContext } from '../managers/DocumentIndexManager';

interface SmartQuery {
    originalQuery: string;
    intent: 'analysis' | 'search' | 'prediction' | 'optimization' | 'troubleshooting';
    keywords: string[];
    requiredDocs: string[];
    mcpActions: string[];
    tensorflowModels: string[];
    isKorean: boolean;
    useTransformers: boolean;
    useVectorSearch: boolean;
}

interface VectorSearchResult {
    documentId: string;
    similarity: number;
    relevanceScore: number;
    matchedKeywords: string[];
    searchType: 'vector' | 'keyword' | 'hybrid';
}

interface SearchOptions {
    maxResults?: number;
    minSimilarity?: number;
    useHybridRanking?: boolean;
    weightVector?: number;
    weightKeyword?: number;
    weightRelevance?: number;
}

export class VectorSearchService {
    private vectorDB: LocalVectorDB;
    private documentIndex: Map<string, DocumentContext>;
    private searchStats = {
        totalSearches: 0,
        vectorSearches: 0,
        keywordSearches: 0,
        hybridSearches: 0,
        avgSearchTime: 0,
    };

    constructor(vectorDB: LocalVectorDB, documentIndex: Map<string, DocumentContext>) {
        this.vectorDB = vectorDB;
        this.documentIndex = documentIndex;
    }

    /**
     * 🔍 벡터 검색 수행
     */
    async performVectorSearch(
        query: string,
        options: SearchOptions = {}
    ): Promise<VectorSearchResult[]> {
        const startTime = Date.now();

        try {
            // 쿼리 벡터 생성
            const queryEmbedding = await this.generateQueryEmbedding(query);

            // 벡터 DB에서 유사 문서 검색
            const similarDocuments = await this.vectorDB.search(
                queryEmbedding,
                options.maxResults || 10
            );

            // 결과 변환 및 필터링
            const results: VectorSearchResult[] = [];

            for (const result of similarDocuments) {
                if (result.similarity < (options.minSimilarity || 0.1)) {
                    continue;
                }

                const document = this.documentIndex.get(result.id);
                if (!document) {
                    continue;
                }

                const vectorResult: VectorSearchResult = {
                    documentId: result.id,
                    similarity: result.similarity,
                    relevanceScore: document.relevanceScore,
                    matchedKeywords: this.findMatchedKeywords(query, document.keywords),
                    searchType: 'vector',
                };

                results.push(vectorResult);
            }

            // 유사도순 정렬
            results.sort((a, b) => b.similarity - a.similarity);

            const searchTime = Date.now() - startTime;
            this.updateSearchStats('vector', searchTime);

            console.log(`🔍 벡터 검색 완료: ${results.length}개 결과 (${searchTime}ms)`);

            return results;
        } catch (error) {
            console.error('❌ 벡터 검색 실패:', error);
            return [];
        }
    }

    /**
     * 🔤 키워드 기반 검색
     */
    async performKeywordSearch(
        query: string,
        options: SearchOptions = {}
    ): Promise<VectorSearchResult[]> {
        const startTime = Date.now();

        try {
            const queryKeywords = this.extractQueryKeywords(query);
            const results: VectorSearchResult[] = [];

            // 모든 문서에 대해 키워드 매칭 검사
            for (const [documentId, document] of this.documentIndex) {
                const matchScore = this.calculateKeywordMatchScore(queryKeywords, document);

                if (matchScore > 0) {
                    const keywordResult: VectorSearchResult = {
                        documentId,
                        similarity: matchScore,
                        relevanceScore: document.relevanceScore,
                        matchedKeywords: this.findMatchedKeywords(query, document.keywords),
                        searchType: 'keyword',
                    };

                    results.push(keywordResult);
                }
            }

            // 매칭 점수순 정렬
            results.sort((a, b) => b.similarity - a.similarity);

            // 결과 개수 제한
            const limitedResults = results.slice(0, options.maxResults || 10);

            const searchTime = Date.now() - startTime;
            this.updateSearchStats('keyword', searchTime);

            console.log(`🔤 키워드 검색 완료: ${limitedResults.length}개 결과 (${searchTime}ms)`);

            return limitedResults;
        } catch (error) {
            console.error('❌ 키워드 검색 실패:', error);
            return [];
        }
    }

    /**
     * 🔄 하이브리드 문서 검색
     */
    async hybridDocumentSearch(
        smartQuery: SmartQuery,
        options: SearchOptions = {}
    ): Promise<DocumentContext[]> {
        const startTime = Date.now();

        try {
            console.log(`🔄 하이브리드 검색 시작: "${smartQuery.originalQuery}"`);

            let allResults: VectorSearchResult[] = [];

            // 1. 벡터 검색 (의미적 유사성)
            if (smartQuery.useVectorSearch) {
                const vectorResults = await this.performVectorSearch(
                    smartQuery.originalQuery,
                    { ...options, maxResults: 15 }
                );
                allResults.push(...vectorResults);
            }

            // 2. 키워드 검색 (정확한 매칭)
            const keywordResults = await this.performKeywordSearch(
                smartQuery.originalQuery,
                { ...options, maxResults: 15 }
            );
            allResults.push(...keywordResults);

            // 3. 하이브리드 랭킹 적용
            if (options.useHybridRanking !== false) {
                allResults = this.applyHybridRanking(allResults, options);
            }

            // 4. 중복 제거 및 최종 정렬
            const uniqueResults = this.removeDuplicateResults(allResults);
            const finalResults = uniqueResults.slice(0, options.maxResults || 10);

            // 5. 문서 컨텍스트 변환
            const documents: DocumentContext[] = [];
            for (const result of finalResults) {
                const document = this.documentIndex.get(result.documentId);
                if (document) {
                    // 검색 메타데이터 추가
                    const enhancedDocument = {
                        ...document,
                        searchMetadata: {
                            similarity: result.similarity,
                            searchType: result.searchType,
                            matchedKeywords: result.matchedKeywords,
                        },
                    };
                    documents.push(enhancedDocument);
                }
            }

            const searchTime = Date.now() - startTime;
            this.updateSearchStats('hybrid', searchTime);

            console.log(`✅ 하이브리드 검색 완료: ${documents.length}개 문서 (${searchTime}ms)`);
            console.log(`📊 검색 유형별 결과:`, {
                vector: allResults.filter(r => r.searchType === 'vector').length,
                keyword: allResults.filter(r => r.searchType === 'keyword').length,
                final: documents.length,
            });

            return documents;
        } catch (error) {
            console.error('❌ 하이브리드 검색 실패:', error);
            return [];
        }
    }

    /**
     * 🧠 쿼리 임베딩 생성
     */
    private async generateQueryEmbedding(query: string): Promise<number[]> {
        // 실제 구현에서는 Transformers.js나 다른 임베딩 모델 사용
        // 현재는 간단한 해시 기반 벡터 생성
        const words = query.toLowerCase().split(/\s+/).slice(0, 50);
        const embedding = new Array(384).fill(0); // 384차원 벡터

        words.forEach((word, index) => {
            const hash = this.simpleHash(word);
            embedding[hash % 384] += 1;

            // 위치 가중치 적용 (앞쪽 단어일수록 중요)
            const positionWeight = 1 - (index / words.length) * 0.3;
            embedding[hash % 384] *= positionWeight;
        });

        // 정규화
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
    }

    /**
     * 🔤 쿼리 키워드 추출
     */
    private extractQueryKeywords(query: string): string[] {
        return query
            .toLowerCase()
            .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2)
            .slice(0, 10); // 최대 10개 키워드
    }

    /**
     * 📊 키워드 매칭 점수 계산
     */
    private calculateKeywordMatchScore(
        queryKeywords: string[],
        document: DocumentContext
    ): number {
        if (queryKeywords.length === 0) return 0;

        let matchCount = 0;
        let weightedScore = 0;

        for (const keyword of queryKeywords) {
            // 완전 매칭
            if (document.keywords.includes(keyword)) {
                matchCount++;
                weightedScore += 2.0;
                continue;
            }

            // 부분 매칭
            const partialMatches = document.keywords.filter(docKeyword =>
                docKeyword.includes(keyword) || keyword.includes(docKeyword)
            );

            if (partialMatches.length > 0) {
                matchCount++;
                weightedScore += 1.0;
                continue;
            }

            // 내용에서 키워드 검색
            if (document.content.toLowerCase().includes(keyword)) {
                matchCount++;
                weightedScore += 0.5;
            }
        }

        // 매칭 비율 계산
        const matchRatio = matchCount / queryKeywords.length;
        const finalScore = (weightedScore / (queryKeywords.length * 2)) * matchRatio;

        return Math.min(1.0, finalScore);
    }

    /**
     * 🔍 매칭된 키워드 찾기
     */
    private findMatchedKeywords(query: string, documentKeywords: string[]): string[] {
        const queryWords = this.extractQueryKeywords(query);
        const matched: string[] = [];

        for (const queryWord of queryWords) {
            for (const docKeyword of documentKeywords) {
                if (docKeyword.includes(queryWord) || queryWord.includes(docKeyword)) {
                    if (!matched.includes(docKeyword)) {
                        matched.push(docKeyword);
                    }
                }
            }
        }

        return matched.slice(0, 5); // 최대 5개
    }

    /**
     * 🔄 하이브리드 랭킹 적용
     */
    private applyHybridRanking(
        results: VectorSearchResult[],
        options: SearchOptions
    ): VectorSearchResult[] {
        const weightVector = options.weightVector || 0.4;
        const weightKeyword = options.weightKeyword || 0.4;
        const weightRelevance = options.weightRelevance || 0.2;

        return results.map(result => {
            // 정규화된 점수들
            const vectorScore = result.searchType === 'vector' ? result.similarity : 0;
            const keywordScore = result.searchType === 'keyword' ? result.similarity : 0;
            const relevanceScore = result.relevanceScore / 100; // 0-1 범위로 정규화

            // 가중 평균 계산
            const hybridScore =
                vectorScore * weightVector +
                keywordScore * weightKeyword +
                relevanceScore * weightRelevance;

            return {
                ...result,
                similarity: hybridScore,
                searchType: 'hybrid' as const,
            };
        }).sort((a, b) => b.similarity - a.similarity);
    }

    /**
     * 🔄 중복 결과 제거
     */
    private removeDuplicateResults(results: VectorSearchResult[]): VectorSearchResult[] {
        const seen = new Set<string>();
        const unique: VectorSearchResult[] = [];

        for (const result of results) {
            if (!seen.has(result.documentId)) {
                seen.add(result.documentId);
                unique.push(result);
            }
        }

        return unique;
    }

    /**
     * 🔢 간단한 해시 함수
     */
    private simpleHash(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32bit integer
        }
        return Math.abs(hash);
    }

    /**
     * 📊 검색 통계 업데이트
     */
    private updateSearchStats(searchType: 'vector' | 'keyword' | 'hybrid', searchTime: number): void {
        this.searchStats.totalSearches++;
        this.searchStats[`${searchType}Searches`]++;

        // 평균 검색 시간 업데이트
        const totalTime = this.searchStats.avgSearchTime * (this.searchStats.totalSearches - 1) + searchTime;
        this.searchStats.avgSearchTime = totalTime / this.searchStats.totalSearches;
    }

    /**
     * 📊 검색 통계 조회
     */
    getSearchStats(): typeof this.searchStats {
        return { ...this.searchStats };
    }

    /**
     * 🔍 문서 인덱스 업데이트
     */
    updateDocumentIndex(documentIndex: Map<string, DocumentContext>): void {
        this.documentIndex = documentIndex;
        console.log(`🔄 문서 인덱스 업데이트됨: ${documentIndex.size}개 문서`);
    }

    /**
     * 🧹 검색 통계 리셋
     */
    resetSearchStats(): void {
        this.searchStats = {
            totalSearches: 0,
            vectorSearches: 0,
            keywordSearches: 0,
            hybridSearches: 0,
            avgSearchTime: 0,
        };
        console.log('📊 검색 통계 리셋 완료');
    }

    /**
     * 🧹 정리
     */
    dispose(): void {
        this.resetSearchStats();
        console.log('🧹 VectorSearchService 정리 완료');
    }
}
