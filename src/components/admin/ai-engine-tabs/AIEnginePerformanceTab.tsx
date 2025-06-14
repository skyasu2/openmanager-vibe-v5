'use client';

import React from 'react';
import { TrendingUp, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AIEngineTabProps } from './types';

export default function AIEnginePerformanceTab({ overallStats }: AIEngineTabProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-400" />
            통합 성능 대시보드
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 성능 지표 카드들 */}
            <div className="bg-slate-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">
                💾 메모리 사용률
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-300">현재</span>
                  <span className="text-white font-bold">2.3GB</span>
                </div>
                <Progress value={58} className="w-full" />
                <p className="text-sm text-green-400">
                  이전 대비 50% 절약
                </p>
              </div>
            </div>

            <div className="bg-slate-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-400 mb-3">
                ⚡ 응답 시간
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-300">평균</span>
                  <span className="text-white font-bold">
                    {overallStats.avgResponseTime}ms
                  </span>
                </div>
                <Progress value={75} className="w-full" />
                <p className="text-sm text-green-400">
                  이전 대비 50% 향상
                </p>
              </div>
            </div>

            <div className="bg-slate-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-400 mb-3">
                🎯 전체 정확도
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-300">평균</span>
                  <span className="text-white font-bold">
                    {overallStats.avgAccuracy}%
                  </span>
                </div>
                <Progress value={overallStats.avgAccuracy} className="w-full" />
                <p className="text-sm text-green-400">목표 달성</p>
              </div>
            </div>
          </div>

          {/* 성능 요약 */}
          <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 p-6 rounded-lg border border-green-500/20">
            <h3 className="text-xl font-bold text-green-400 mb-4">
              🏆 성능 개선 요약
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-white">
                    메모리 사용량 50% 절약
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-white">응답 시간 50% 향상</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-white">100% 가용성 보장</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-white">
                    한국어 처리 300% 향상
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-white">번들 크기 38% 감소</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-white">11개 엔진 완전 통합</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}