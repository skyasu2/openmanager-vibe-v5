'use client';

import React from 'react';
import { BarChart3, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AIEngineTabProps } from './types';

export default function AIEngineDataTab({ }: AIEngineTabProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            학습 데이터 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <div className="flex items-center gap-4">
                <Database className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="font-medium text-white">
                    사용자 상호작용 로그
                  </p>
                  <p className="text-sm text-slate-400">
                    user_interaction • 12.5MB • 품질: 92%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600">처리완료</Badge>
                <span className="text-sm text-slate-400">
                  2024-01-15 15:30:00
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <div className="flex items-center gap-4">
                <Database className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="font-medium text-white">서버 성능 로그</p>
                  <p className="text-sm text-slate-400">
                    performance_log • 8.7MB • 품질: 88%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-600">대기중</Badge>
                <span className="text-sm text-slate-400">
                  2024-01-15 14:45:00
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <div className="flex items-center gap-4">
                <Database className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="font-medium text-white">패턴 분석 결과</p>
                  <p className="text-sm text-slate-400">
                    pattern_analysis • 15.2MB • 품질: 95%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600">처리완료</Badge>
                <span className="text-sm text-slate-400">
                  2024-01-15 13:20:00
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <div className="flex items-center gap-4">
                <Database className="w-5 h-5 text-green-400" />
                <div>
                  <p className="font-medium text-white">
                    AI 에이전트 행동 로그
                  </p>
                  <p className="text-sm text-slate-400">
                    agent_behavior • 7.3MB • 품질: 94%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600">처리중</Badge>
                <span className="text-sm text-slate-400">
                  2024-01-15 16:10:00
                </span>
              </div>
            </div>
          </div>

          {/* 데이터 업로드 */}
          <div className="mt-6 p-4 border-2 border-dashed border-slate-600 rounded-lg text-center">
            <Database className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-400 mb-2">
              새로운 학습 데이터 업로드
            </p>
            <Button
              variant="outline"
              className="border-slate-600 text-slate-300"
            >
              파일 선택
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}