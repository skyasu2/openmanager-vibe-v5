'use client';
import React, { useEffect, useState } from 'react';
import { MetricPoint } from '@/lib/ml/lightweight-ml-engine';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface Props {
  history: MetricPoint[];
}

export default function MLDashboard({ history }: Props) {
  const [predictions, setPredictions] = useState<MetricPoint[]>([]);
  const [anomalies, setAnomalies] = useState<MetricPoint[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/ai/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ history, hoursAhead: 12 }),
        });
        const data = await res.json();
        setPredictions(data.predictions || []);

        const res2 = await fetch('/api/ai/anomaly', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ history, threshold: 2.5 }),
        });
        const data2 = await res2.json();
        setAnomalies(data2.anomalies || []);
      } catch (e) {
        console.error('[MLDashboard] fetch error', e);
      }
    }
    fetchData();
  }, [history]);

  return (
    <div className='grid gap-6 md:grid-cols-2'>
      <Card>
        <CardHeader>
          <CardTitle>서버 로드 예측 (CPU)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width='100%' height={240}>
            <LineChart data={predictions}>
              <XAxis dataKey='timestamp' hide />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type='monotone' dataKey='cpu' stroke='#4f46e5' />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>이상 탐지 결과</CardTitle>
        </CardHeader>
        <CardContent>
          {anomalies.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              이상 징후가 없습니다.
            </p>
          ) : (
            <ul className='space-y-2 text-sm'>
              {anomalies.map(a => (
                <li key={a.timestamp} className='text-red-600'>
                  {a.timestamp} — CPU {a.cpu.toFixed(1)}% / MEM{' '}
                  {a.memory.toFixed(1)}%
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
