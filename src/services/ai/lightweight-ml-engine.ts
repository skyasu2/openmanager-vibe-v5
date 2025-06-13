/**
 * 🚀 경량 ML 엔진 (TensorFlow 대체)
 * 
 * TensorFlow.js 대신 경량 ML 라이브러리들을 사용:
 * - simple-statistics: 통계 분석
 * - ml-regression: 회귀 분석
 */

import { SimpleLinearRegression } from 'ml-regression-simple-linear';
import * as ss from 'simple-statistics';

export interface LightweightMLConfig {
    models: string[];
    algorithms: string[];
    maxComplexity: number;
    enableCaching: boolean;
}

export interface MLPredictionResult {
    predictions: number[];
    confidence: number;
    model: string;
    processingTime: number;
    anomalies?: any[];
}

export class LightweightMLEngine {
    private initialized = false;
    private config: LightweightMLConfig;
    private models: Map<string, any> = new Map();
    private cache: Map<string, MLPredictionResult> = new Map();

    constructor(config?: Partial<LightweightMLConfig>) {
        this.config = {
            models: ['linear-regression', 'simple-statistics'],
            algorithms: ['regression', 'anomaly-detection'],
            maxComplexity: 1000,
            enableCaching: true,
            ...config,
        };
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;

        console.log('🚀 경량 ML 엔진 초기화 시작...');
        const startTime = Date.now();

        try {
            // 모델 초기화
            this.initializeModels();

            this.initialized = true;
            const initTime = Date.now() - startTime;
            console.log(`✅ 경량 ML 엔진 초기화 완료 (${initTime}ms)`);
        } catch (error) {
            console.error('❌ 경량 ML 엔진 초기화 실패:', error);
            throw error;
        }
    }

    private initializeModels(): void {
        // 선형 회귀 모델
        this.models.set('linear-regression', {
            type: 'regression',
            predict: (data: number[][]) => this.linearRegression(data),
        });

        // 통계 분석 모델
        this.models.set('statistics', {
            type: 'statistics',
            predict: (data: number[][]) => this.statisticsAnalysis(data),
        });

        console.log(`✅ ${this.models.size}개 경량 ML 모델 초기화 완료`);
    }

    async predict(data: number[][], modelName?: string): Promise<MLPredictionResult> {
        if (!this.initialized) {
            await this.initialize();
        }

        const startTime = Date.now();
        const cacheKey = `${modelName || 'auto'}_${JSON.stringify(data).slice(0, 100)}`;

        // 캐시 확인
        if (this.config.enableCaching && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        try {
            let result: MLPredictionResult;

            if (modelName && this.models.has(modelName)) {
                // 특정 모델 사용
                const model = this.models.get(modelName)!;
                result = await model.predict(data);
            } else {
                // 자동 모델 선택
                result = await this.autoSelectModel(data);
            }

            result.processingTime = Date.now() - startTime;

            // 캐시 저장
            if (this.config.enableCaching) {
                this.cache.set(cacheKey, result);
            }

            return result;
        } catch (error) {
            console.error('❌ 경량 ML 예측 실패:', error);
            return {
                predictions: [],
                confidence: 0,
                model: 'error',
                processingTime: Date.now() - startTime,
            };
        }
    }

    private async autoSelectModel(data: number[][]): Promise<MLPredictionResult> {
        // 데이터 크기에 따라 모델 자동 선택
        const dataSize = data.length * (data[0]?.length || 0);

        if (dataSize < 100) {
            return this.linearRegression(data);
        } else {
            return this.statisticsAnalysis(data);
        }
    }

    private linearRegression(data: number[][]): MLPredictionResult {
        try {
            if (data.length < 2 || !data[0] || data[0].length < 1) {
                throw new Error('선형 회귀를 위한 데이터가 부족합니다');
            }

            const x = data.map((row, index) => index);
            const y = data.map(row => row[0]);

            const regression = new SimpleLinearRegression(x, y);
            const predictions = x.map(val => regression.predict(val));

            // R² 계산 (간단한 구현)
            const yMean = ss.mean(y);
            const totalSumSquares = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
            const residualSumSquares = predictions.reduce((sum, pred, i) => sum + Math.pow(y[i] - pred, 2), 0);
            const rSquared = 1 - (residualSumSquares / totalSumSquares);

            return {
                predictions,
                confidence: Math.max(0, Math.min(1, rSquared)),
                model: 'linear-regression',
                processingTime: 0,
            };
        } catch (error) {
            console.warn('⚠️ 선형 회귀 실패:', error);
            return {
                predictions: [],
                confidence: 0,
                model: 'linear-regression-error',
                processingTime: 0,
            };
        }
    }

    private statisticsAnalysis(data: number[][]): MLPredictionResult {
        try {
            if (data.length < 1 || !data[0]) {
                throw new Error('통계 분석을 위한 데이터가 부족합니다');
            }

            const flatData = data.map(row => row[0] || 0);

            // 기본 통계 계산
            const mean = ss.mean(flatData);
            const median = ss.median(flatData);
            const stdDev = ss.standardDeviation(flatData);

            // 간단한 예측: 이동평균 기반
            const windowSize = Math.min(5, Math.floor(flatData.length / 2));
            const predictions: number[] = [];

            for (let i = 0; i < flatData.length; i++) {
                if (i < windowSize) {
                    predictions.push(mean);
                } else {
                    const window = flatData.slice(i - windowSize, i);
                    predictions.push(ss.mean(window));
                }
            }

            // 이상치 탐지
            const anomalies = this.detectSimpleAnomalies(flatData, mean, stdDev);

            // 신뢰도 계산 (변동성 기반)
            const confidence = Math.max(0.1, Math.min(0.9, 1 - (stdDev / Math.abs(mean) || 0)));

            return {
                predictions,
                confidence,
                model: 'statistics-analysis',
                processingTime: 0,
                anomalies,
            };
        } catch (error) {
            console.warn('⚠️ 통계 분석 실패:', error);
            return {
                predictions: [],
                confidence: 0,
                model: 'statistics-error',
                processingTime: 0,
            };
        }
    }

    private detectSimpleAnomalies(data: number[], mean: number, stdDev: number): any[] {
        const anomalies: any[] = [];
        const threshold = stdDev * 2; // 2 표준편차

        data.forEach((value, index) => {
            const deviation = Math.abs(value - mean);
            if (deviation > threshold) {
                anomalies.push({
                    index,
                    value,
                    deviation,
                    severity: deviation > threshold * 1.5 ? 'high' : 'medium',
                });
            }
        });

        return anomalies;
    }

    getAvailableModels(): string[] {
        return Array.from(this.models.keys());
    }

    getModelInfo(modelName: string): any {
        return this.models.get(modelName);
    }

    clearCache(): void {
        this.cache.clear();
        console.log('🧹 경량 ML 엔진 캐시 정리 완료');
    }

    dispose(): void {
        this.models.clear();
        this.cache.clear();
        this.initialized = false;
        console.log('🧹 경량 ML 엔진 정리 완료');
    }
} 