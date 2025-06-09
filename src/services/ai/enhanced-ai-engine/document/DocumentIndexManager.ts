/**
 * 📚 Document Index Manager v1.0
 * 
 * 문서 인덱싱 및 관리 전담 모듈
 * - MCP 기반 문서 검색
 * - 문서 분석 및 키워드 추출
 * - 폴백 지식베이스 관리
 */

import { RealMCPClient } from '@/services/mcp/real-mcp-client';
import {
    IDocumentIndexManager,
    DocumentContext,
    SmartQuery,
    IndexStats,
    FallbackKnowledge,
    AIEngineError
} from '../types/EnhancedAITypes';

export class DocumentIndexManager implements IDocumentIndexManager {
    private mcpClient: RealMCPClient;
    private documentIndex: Map<string, DocumentContext> = new Map();
    private lastIndexUpdate: number = 0;
    private indexStats: IndexStats;

    constructor(mcpClient: RealMCPClient) {
        this.mcpClient = mcpClient;
        this.indexStats = {
            documentCount: 0,
            lastUpdate: 0,
            indexSize: 0,
            averageRelevanceScore: 0,
            topKeywords: []
        };
    }

    /**
     * 📚 MCP 기반 문서 인덱스 구축
     */
    async buildDocumentIndex(): Promise<void> {
        const startTime = Date.now();
        let documentCount = 0;

        try {
            console.log('🔍 문서 인덱싱 시작...');

            // MCP를 통한 문서 검색
            const mcpResult = await this.mcpClient.searchDocuments('');

            if (mcpResult.success && mcpResult.results.length > 0) {
                console.log(`📚 MCP를 통해 ${mcpResult.results.length}개 문서 발견`);

                for (const doc of mcpResult.results) {
                    try {
                        const docContext = await this.analyzeDocument(doc.path, doc.content);
                        this.documentIndex.set(doc.path, docContext);
                        documentCount++;
                    } catch (error) {
                        console.warn(`⚠️ 문서 분석 실패: ${doc.path}`, error);
                        // 실패한 경우 기본 컨텍스트 생성
                        const fallbackContext = await this.createFallbackDocumentContext(doc.path);
                        this.documentIndex.set(doc.path, fallbackContext);
                        documentCount++;
                    }
                }
            } else {
                console.log('📚 MCP 문서 검색 실패, 폴백 지식베이스 로드');
                await this.loadFallbackKnowledge();
                documentCount = this.documentIndex.size;
            }

            // 인덱스 통계 업데이트
            this.updateIndexStats();

            const processingTime = Date.now() - startTime;
            this.lastIndexUpdate = Date.now();

            console.log(`✅ 문서 인덱싱 완료: ${documentCount}개 문서, ${processingTime}ms`);

        } catch (error) {
            console.error('❌ 문서 인덱싱 실패:', error);
            throw new AIEngineError(
                '문서 인덱스 구축 실패',
                'DOCUMENT_INDEX_ERROR',
                error
            );
        }
    }

    /**
     * 📝 문서 분석 및 컨텍스트 생성
     */
    async analyzeDocument(path: string, content: string): Promise<DocumentContext> {
        try {
            const keywords = this.extractKeywords(content);
            const contextLinks = this.findContextLinks(content);
            const relevanceScore = this.calculateRelevanceScore(path, content);

            return {
                path,
                content: content.slice(0, 5000), // 처음 5000자만 저장 (메모리 최적화)
                keywords,
                lastModified: Date.now(),
                relevanceScore,
                contextLinks
            };
        } catch (error) {
            console.warn(`⚠️ 문서 분석 중 오류: ${path}`, error);
            return this.createFallbackDocumentContext(path);
        }
    }

    /**
     * 🔍 관련 문서 검색
     */
    async searchRelevantDocuments(smartQuery: SmartQuery): Promise<DocumentContext[]> {
        const startTime = Date.now();
        const relevantDocs: DocumentContext[] = [];

        try {
            // 1. 키워드 기반 검색
            const keywordMatches = this.searchByKeywords(smartQuery.keywords);
            relevantDocs.push(...keywordMatches);

            // 2. 의도 기반 문서 필터링
            const intentBasedDocs = this.filterByIntent(relevantDocs, smartQuery.intent);

            // 3. 관련성 점수로 정렬
            const sortedDocs = intentBasedDocs.sort((a, b) => b.relevanceScore - a.relevanceScore);

            // 4. 상위 5개 문서만 반환 (성능 최적화)
            const topDocs = sortedDocs.slice(0, 5);

            const searchTime = Date.now() - startTime;
            console.log(`🔍 문서 검색 완료: ${topDocs.length}개 문서, ${searchTime}ms`);

            return topDocs;
        } catch (error) {
            console.error('❌ 문서 검색 실패:', error);
            return []; // 빈 배열 반환으로 서비스 중단 방지
        }
    }

    /**
     * 🗂️ 키워드 기반 문서 검색
     */
    private searchByKeywords(keywords: string[]): DocumentContext[] {
        const matches: DocumentContext[] = [];

        for (const [path, doc] of this.documentIndex) {
            let matchScore = 0;

            for (const keyword of keywords) {
                if (doc.keywords.some(docKeyword =>
                    docKeyword.toLowerCase().includes(keyword.toLowerCase())
                )) {
                    matchScore += 1;
                }

                if (doc.content.toLowerCase().includes(keyword.toLowerCase())) {
                    matchScore += 0.5;
                }
            }

            if (matchScore > 0) {
                // 임시로 matchScore를 relevanceScore에 추가
                const enhancedDoc = {
                    ...doc,
                    relevanceScore: doc.relevanceScore + matchScore
                };
                matches.push(enhancedDoc);
            }
        }

        return matches;
    }

    /**
     * 🎯 의도 기반 문서 필터링
     */
    private filterByIntent(docs: DocumentContext[], intent: SmartQuery['intent']): DocumentContext[] {
        const intentKeywords = {
            analysis: ['분석', '해석', 'analysis', 'examine'],
            search: ['검색', '찾기', 'search', 'find'],
            prediction: ['예측', '전망', 'prediction', 'forecast'],
            optimization: ['최적화', '개선', 'optimization', 'improve'],
            troubleshooting: ['문제해결', '디버깅', 'troubleshoot', 'debug']
        };

        const targetKeywords = intentKeywords[intent] || [];

        return docs.filter(doc => {
            const hasIntentKeywords = targetKeywords.some(keyword =>
                doc.content.toLowerCase().includes(keyword.toLowerCase()) ||
                doc.keywords.some(docKeyword =>
                    docKeyword.toLowerCase().includes(keyword.toLowerCase())
                )
            );

            return hasIntentKeywords || doc.relevanceScore > 3.0; // 높은 관련성은 항상 포함
        });
    }

    /**
     * 📋 기본 문서 컨텍스트 생성 (폴백)
     */
    private async createFallbackDocumentContext(path: string): Promise<DocumentContext> {
        const fallbackKeywords = this.getFallbackKeywords(path);

        return {
            path,
            content: `문서 파일: ${path}`,
            keywords: fallbackKeywords,
            lastModified: Date.now(),
            relevanceScore: 2.0,
            contextLinks: []
        };
    }

    /**
     * 🔤 키워드 추출
     */
    private extractKeywords(text: string): string[] {
        const words = text
            .toLowerCase()
            .replace(/[^\w\s가-힣]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !this.isCommonWord(word));

        // 빈도수 계산
        const wordFreq = new Map<string, number>();
        words.forEach(word => {
            wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        });

        // 빈도수 기준 상위 20개 키워드 반환
        return Array.from(wordFreq.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
            .map(([word]) => word);
    }

    /**
     * 🔗 컨텍스트 링크 찾기
     */
    private findContextLinks(content: string): string[] {
        const links: string[] = [];

        // 파일 경로 패턴 매칭
        const pathPatterns = [
            /\.\/[a-zA-Z0-9/_-]+\.(ts|js|tsx|jsx|md|json)/g,
            /\/[a-zA-Z0-9/_-]+\.(ts|js|tsx|jsx|md|json)/g,
            /src\/[a-zA-Z0-9/_-]+/g
        ];

        pathPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                links.push(...matches);
            }
        });

        return [...new Set(links)]; // 중복 제거
    }

    /**
     * 📊 관련성 점수 계산
     */
    private calculateRelevanceScore(path: string, content: string): number {
        let score = 1.0;

        // 파일 타입별 가중치
        if (path.includes('.md')) score += 1.0; // 문서 파일
        if (path.includes('README')) score += 1.5; // README 파일
        if (path.includes('/docs/')) score += 1.2; // 문서 디렉토리
        if (path.includes('.ts') || path.includes('.js')) score += 0.8; // 코드 파일

        // 내용 길이별 가중치
        if (content.length > 5000) score += 0.5;
        if (content.length > 10000) score += 0.3;

        // 한국어 포함 여부
        if (/[가-힣]/.test(content)) score += 0.8;

        // 기술 키워드 포함 여부
        const techKeywords = ['AI', 'MCP', 'API', 'server', 'database', 'config'];
        const keywordCount = techKeywords.filter(keyword =>
            content.toLowerCase().includes(keyword.toLowerCase())
        ).length;
        score += keywordCount * 0.2;

        return Math.min(score, 5.0); // 최대 5점
    }

    /**
     * 🗂️ 폴백 지식베이스 로드
     */
    async loadFallbackKnowledge(): Promise<void> {
        console.log('📚 폴백 지식베이스 로드 중...');

        const fallbackKnowledge: FallbackKnowledge[] = [
            {
                category: 'AI',
                title: 'AI 엔진 활용법',
                content: 'OpenManager AI 엔진은 한국어 NLP와 TensorFlow.js를 통합한 하이브리드 시스템입니다.',
                keywords: ['AI', '인공지능', 'NLP', 'TensorFlow', '한국어'],
                priority: 5
            },
            {
                category: 'MCP',
                title: 'MCP 프로토콜 가이드',
                content: 'Model Context Protocol을 통해 AI 모델과 도구들이 상호작용합니다.',
                keywords: ['MCP', 'protocol', '모델', '컨텍스트'],
                priority: 4
            },
            {
                category: 'API',
                title: 'API 사용법',
                content: 'REST API와 GraphQL을 통해 시스템과 상호작용할 수 있습니다.',
                keywords: ['API', 'REST', 'GraphQL', 'endpoint'],
                priority: 3
            }
        ];

        // 폴백 지식을 문서 인덱스에 추가
        for (const knowledge of fallbackKnowledge) {
            const docContext: DocumentContext = {
                path: `fallback/${knowledge.category.toLowerCase()}.md`,
                content: knowledge.content,
                keywords: knowledge.keywords,
                lastModified: Date.now(),
                relevanceScore: knowledge.priority,
                contextLinks: []
            };

            this.documentIndex.set(docContext.path, docContext);
        }

        console.log(`✅ 폴백 지식베이스 로드 완료: ${fallbackKnowledge.length}개 항목`);
    }

    /**
     * 🏷️ 폴백 키워드 생성
     */
    private getFallbackKeywords(path: string): string[] {
        const pathKeywords: Record<string, string[]> = {
            'README': ['가이드', '문서', '설명'],
            'config': ['설정', '환경', '구성'],
            'api': ['API', '인터페이스', '엔드포인트'],
            'service': ['서비스', '비즈니스', '로직'],
            'component': ['컴포넌트', 'UI', '인터페이스'],
            'util': ['유틸리티', '도구', '헬퍼'],
            'test': ['테스트', '검증', '검사']
        };

        for (const [key, keywords] of Object.entries(pathKeywords)) {
            if (path.toLowerCase().includes(key)) {
                return keywords;
            }
        }

        return ['문서', '파일', 'document'];
    }

    /**
     * 📋 일반적인 단어 필터링
     */
    private isCommonWord(word: string): boolean {
        const commonWords = [
            'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been',
            '이', '그', '저', '의', '를', '을', '에', '와', '과', '로', '으로', '에서', '까지',
            '있다', '없다', '하다', '되다', '같다', '다르다'
        ];
        return commonWords.includes(word.toLowerCase());
    }

    /**
     * 📊 인덱스 통계 업데이트
     */
    private updateIndexStats(): void {
        const docs = Array.from(this.documentIndex.values());

        this.indexStats = {
            documentCount: docs.length,
            lastUpdate: Date.now(),
            indexSize: this.documentIndex.size,
            averageRelevanceScore: docs.reduce((sum, doc) => sum + doc.relevanceScore, 0) / docs.length,
            topKeywords: this.getTopKeywords(docs)
        };
    }

    /**
     * 🏆 상위 키워드 추출
     */
    private getTopKeywords(docs: DocumentContext[]): string[] {
        const keywordFreq = new Map<string, number>();

        docs.forEach(doc => {
            doc.keywords.forEach(keyword => {
                keywordFreq.set(keyword, (keywordFreq.get(keyword) || 0) + 1);
            });
        });

        return Array.from(keywordFreq.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([keyword]) => keyword);
    }

    /**
     * 📄 문서 컨텍스트 조회
     */
    getDocumentContext(path: string): DocumentContext | undefined {
        return this.documentIndex.get(path);
    }

    /**
     * 📊 인덱스 통계 조회
     */
    getIndexStats(): IndexStats {
        return { ...this.indexStats };
    }

    /**
     * 🧹 리소스 정리
     */
    dispose(): void {
        this.documentIndex.clear();
        console.log('🧹 DocumentIndexManager 리소스 정리 완료');
    }
} 