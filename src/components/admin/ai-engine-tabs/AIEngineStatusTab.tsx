'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AIEngineTabProps } from './types';

export default function AIEngineStatusTab({ engines }: AIEngineTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {engines.map(engine => (
              <Card
                key={engine.name}
                className="bg-slate-800 border-slate-700"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          engine.status === 'active'
                            ? 'bg-green-400'
                            : engine.status === 'error'
                              ? 'bg-red-400'
                              : 'bg-yellow-400'
                        }`}
                      />
                      <h3 className="text-lg font-semibold text-white">
                        {engine.name}
                      </h3>
                    </div>
                    <Badge
                      variant={
                        engine.type === 'opensource'
                          ? 'secondary'
                          : 'default'
                      }
                    >
                      {engine.type === 'opensource'
                        ? '오픈소스'
                        : '커스텀'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">요청 수</p>
                      <p className="text-xl font-bold text-blue-400">
                        {engine.requests}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">정확도</p>
                      <p className="text-xl font-bold text-green-400">
                        {engine.accuracy}%
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">응답시간</p>
                      <p className="text-xl font-bold text-purple-400">
                        {engine.responseTime}ms
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">마지막 사용</p>
                      <p className="text-xl font-bold text-orange-400">
                        {engine.lastUsed}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}