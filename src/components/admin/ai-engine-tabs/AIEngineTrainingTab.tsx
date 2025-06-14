'use client';

import React from 'react';
import { Brain, PlayCircle, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AIEngineTabProps } from './types';

export default function AIEngineTrainingTab({ engines }: AIEngineTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {engines
          .filter(e => e.type === 'custom')
          .map(engine => (
            <Card
              key={engine.name}
              className="bg-slate-800 border-slate-700"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    {engine.name}
                  </CardTitle>
                  <Badge
                    className={`${
                      engine.status === 'active'
                        ? 'bg-green-500'
                        : engine.status === 'error'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                    } text-white`}
                  >
                    {engine.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 성능 지표 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">정확도</p>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={engine.accuracy}
                        className="flex-1"
                      />
                      <span className="text-sm font-mono text-white">
                        {engine.accuracy}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">응답시간</p>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={Math.min(
                          100,
                          (200 - engine.responseTime) / 2
                        )}
                        className="flex-1"
                      />
                      <span className="text-sm font-mono text-white">
                        {engine.responseTime}ms
                      </span>
                    </div>
                  </div>
                </div>

                {/* 훈련 진행률 (훈련 중인 경우) */}
                {engine.status === 'training' && (
                  <div>
                    <p className="text-slate-400 text-sm">훈련 진행률</p>
                    <div className="flex items-center gap-2">
                      <Progress value={75} className="flex-1" />
                      <span className="text-sm font-mono text-white">
                        75%
                      </span>
                    </div>
                  </div>
                )}

                {/* 통계 정보 */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">데이터셋:</span>
                    <span className="ml-2 font-mono text-white">
                      {(engine.requests * 100).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">에포크:</span>
                    <span className="ml-2 font-mono text-white">
                      45/100
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">마지막 훈련:</span>
                    <span className="ml-2 font-mono text-white">
                      {engine.lastUsed}
                    </span>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={engine.status === 'training'}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    <PlayCircle className="w-4 h-4 mr-1" />
                    {engine.status === 'training'
                      ? '훈련 중...'
                      : '훈련 시작'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    설정
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}