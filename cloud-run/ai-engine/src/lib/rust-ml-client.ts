/**
 * Rust ML Inference Service Client
 * Cloud Run에 배포된 Rust ML 서비스와 통신
 */

const RUST_SERVICE_URL =
  process.env.RUST_ML_SERVICE_URL ||
  'https://rust-inference-490817238363.asia-northeast3.run.app';

export interface RustAnomalyResult {
  is_anomaly: boolean;
  score: number;
  severity: 'low' | 'medium' | 'high';
}

export interface RustTrendResult {
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  prediction?: number;
}

export interface RustClusterResult {
  clusters: Array<{
    id: number;
    size: number;
    representative_log: string;
    member_indices: number[];
  }>;
}

export const detectAnomaliesRust = async (
  metrics: Record<string, number>
): Promise<RustAnomalyResult | null> => {
  try {
    const response = await fetch(`${RUST_SERVICE_URL}/api/anomaly`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics }),
    });

    if (!response.ok) return null;
    return (await response.json()) as RustAnomalyResult;
  } catch (e) {
    console.error('Rust ML Service Error:', e);
    return null;
  }
};

export const predictTrendRust = async (
  data: number[]
): Promise<RustTrendResult | null> => {
  try {
    const response = await fetch(`${RUST_SERVICE_URL}/api/trend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) return null;
    return (await response.json()) as RustTrendResult;
  } catch (e) {
    console.error('Rust ML Service Error:', e);
    return null;
  }
};

export const clusterLogsRust = async (
  logs: string[]
): Promise<RustClusterResult | null> => {
  try {
    const response = await fetch(`${RUST_SERVICE_URL}/api/clustering`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs, num_clusters: 5 }),
    });

    if (!response.ok) return null;
    const json = await response.json();
    return json.result as RustClusterResult;
  } catch (e) {
    console.error('Rust ML Service Error:', e);
    return null;
  }
};
