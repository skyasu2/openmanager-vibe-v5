/*
 * 🌱 Lightweight ML Engine
 * ----------------------------------------------------
 * TensorFlow 기반을 제거하고 순수 JS ML 라이브러리로 구현한
 * 경량 머신러닝 유틸리티 모듈입니다.
 *  - 선형 / 다항 회귀         : ml-regression
 *  - K-Means 클러스터링       : ml-kmeans
 *  - 주성분 분석(PCA)         : ml-pca
 *  - 통계 / z-score 분석      : simple-statistics
 *
 * 모든 함수는 서버리스(Vercel Edge)에서도 동작하도록
 * 동기 계산 + 최소 의존성으로 작성했습니다.
 */

import { SimpleLinearRegression } from 'ml-regression-simple-linear';
import KMeans from 'ml-kmeans';
import { PCA } from 'ml-pca';
import * as ss from 'simple-statistics';
import _ from 'lodash';

export interface MetricPoint {
  timestamp: string; // ISO
  cpu: number; // 0-100
  memory: number; // 0-100
  disk?: number; // 0-100
}

/**
 * 📈 서버 로드 예측 (선형/다항 회귀 기반)
 * @param history 최근 메트릭 배열 (최대 24xN)
 * @param hoursAhead 예측 시간(시간 단위)
 */
export function predictServerLoad(history: MetricPoint[], hoursAhead = 24) {
  const xs = history.map((_, idx) => idx);
  const ysCpu = history.map(m => m.cpu);
  const ysMem = history.map(m => m.memory);

  // 단순 선형 회귀
  const lrCpu = new SimpleLinearRegression(xs, ysCpu);
  const lrMem = new SimpleLinearRegression(xs, ysMem);

  const predictions: MetricPoint[] = [];
  for (let i = 1; i <= hoursAhead; i++) {
    const idx = xs.length + i;
    predictions.push({
      timestamp: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
      cpu: Math.max(0, Math.min(100, lrCpu.predict(idx))),
      memory: Math.max(0, Math.min(100, lrMem.predict(idx))),
    });
  }
  return predictions;
}

/**
 * 🚨 Z-Score 기반 이상 탐지
 */
export function detectAnomalies(history: MetricPoint[], threshold = 2.5) {
  const cpuValues = history.map(m => m.cpu);
  const memValues = history.map(m => m.memory);

  const meanCpu = ss.mean(cpuValues);
  const sdCpu = ss.standardDeviation(cpuValues);
  const meanMem = ss.mean(memValues);
  const sdMem = ss.standardDeviation(memValues);

  const anomalies = history.filter(m => {
    const zCpu = sdCpu ? Math.abs((m.cpu - meanCpu) / sdCpu) : 0;
    const zMem = sdMem ? Math.abs((m.memory - meanMem) / sdMem) : 0;
    return zCpu > threshold || zMem > threshold;
  });

  return anomalies;
}

/**
 * 🔍 클러스터 분석 (K-Means)
 */
export function clusterServers(dataset: MetricPoint[], k = 3) {
  const vectors = dataset.map(d => [d.cpu, d.memory]);
  const { clusters, centroids } = KMeans(vectors, k);
  return { clusters, centroids };
}

/**
 * 📊 PCA 차원 축소
 */
export function reduceDimensionality(dataset: MetricPoint[]) {
  const matrix = dataset.map(d => [d.cpu, d.memory, d.disk ?? 0]);
  const pca = new PCA(matrix);
  return pca.predict(matrix, { nComponents: 2 });
}

/**
 * 💡 성능 최적화 추천 (간단 규칙 기반)
 */
export function generateRecommendations(history: MetricPoint[]) {
  const avgCpu = ss.mean(history.map(h => h.cpu));
  const avgMem = ss.mean(history.map(h => h.memory));

  const recommendations: string[] = [];

  if (avgCpu > 80) {
    recommendations.push('CPU 오토스케일링을 고려하세요.');
  } else if (avgCpu < 30) {
    recommendations.push('CPU 리소스가 과잉입니다. 인스턴스 축소 고려.');
  }

  if (avgMem > 75) {
    recommendations.push('메모리 한도를 상향하거나 캐시 정책을 개선하세요.');
  }

  return recommendations;
}
