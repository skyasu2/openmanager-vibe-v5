'use client';

import React from 'react';
import { Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AIEngineTabProps } from './types';

export default function AIEngineOverviewTab({ engines }: AIEngineTabProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            시스템 개요
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-purple-400">
                🔧 오픈소스 엔진 ({engines.filter(e => e.type === 'opensource').length}개)
              </h3>
              <div className="space-y-2">
                {engines
                  .filter(e => e.type === 'opensource')
                  .map(engine => (
                    <div
                      key={engine.name}
                      className="flex items-center justify-between bg-slate-700 p-3 rounded"
                    >
                      <span className="text-white">{engine.name}</span>
                      <Badge
                        variant={
                          engine.status === 'active'
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {engine.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-blue-400">
                ⚡ 커스텀 엔진 ({engines.filter(e => e.type === 'custom').length}개)
              </h3>
              <div className="space-y-2">
                {engines
                  .filter(e => e.type === 'custom')
                  .map(engine => (
                    <div
                      key={engine.name}
                      className="flex items-center justify-between bg-slate-700 p-3 rounded"
                    >
                      <span className="text-white">{engine.name}</span>
                      <Badge
                        variant={
                          engine.status === 'active'
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {engine.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}