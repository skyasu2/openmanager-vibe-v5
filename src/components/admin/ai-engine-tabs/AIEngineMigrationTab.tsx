'use client';

import React from 'react';
import { Database, CheckCircle2, RefreshCw, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MigrationTabProps } from './types';

export default function AIEngineMigrationTab({
  migrationStatus,
  migrationProgress,
  isMigrating,
  startMigration,
  refreshEngineStatus,
}: MigrationTabProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-400" />
            AI 에이전트 마이그레이션
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 마이그레이션 진행률 */}
          {isMigrating && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white">
                  마이그레이션 진행 중...
                </span>
                <span className="text-blue-400">
                  {Math.round(migrationProgress)}%
                </span>
              </div>
              <Progress value={migrationProgress} className="w-full" />
            </div>
          )}

          {/* 마이그레이션 결과 */}
          {migrationStatus && (
            <div className="bg-slate-700 p-4 rounded-lg space-y-3">
              <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                마이그레이션 완료
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">
                    {migrationStatus.summary.userLogs}
                  </p>
                  <p className="text-slate-300 text-sm">유저 로그</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {migrationStatus.summary.patterns}
                  </p>
                  <p className="text-slate-300 text-sm">패턴</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">
                    {migrationStatus.summary.abTests}
                  </p>
                  <p className="text-slate-300 text-sm">A/B 테스트</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-400">
                    {migrationStatus.summary.performanceMetrics}
                  </p>
                  <p className="text-slate-300 text-sm">성능 지표</p>
                </div>
              </div>
            </div>
          )}

          {/* 마이그레이션 버튼 */}
          <div className="flex gap-4">
            <Button
              onClick={startMigration}
              disabled={isMigrating}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              {isMigrating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <PlayCircle className="w-4 h-4" />
              )}
              {isMigrating
                ? '마이그레이션 중...'
                : '전체 마이그레이션 시작'}
            </Button>

            <Button
              variant="outline"
              onClick={refreshEngineStatus}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              상태 새로고침
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}