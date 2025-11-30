'use client';

// framer-motion 제거 - CSS 애니메이션 사용
import { AlertTriangle, Lightbulb, Server, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { timerManager } from '../../utils/TimerManager';

interface PresetsMetrics {
  criticalServers?: number;
  warningServers?: number;
  totalServers?: number;
}

interface DynamicPresetsProps {
  serverMetrics?: unknown;
  onSelect: (question: string) => void;
}

export default function DynamicPresets({
  serverMetrics,
  onSelect,
}: DynamicPresetsProps) {
  const [presets, setPresets] = useState<string[]>([]);

  const generateContextualQuestions = (
    metrics: PresetsMetrics | unknown
  ): string[] => {
    const questions = [
      '현재 시스템 전체 상태를 요약해줘',
      'CPU 사용률이 높은 서버들을 분석해줘',
      '메모리 최적화 방안을 추천해줘',
      '서버 성능 트렌드를 분석해줘',
      '시스템 보안 상태를 점검해줘',
    ];

    // 서버 메트릭스에 따른 동적 질문 생성
    if (
      metrics &&
      typeof metrics === 'object' &&
      'criticalServers' in metrics
    ) {
      const m = metrics as PresetsMetrics;
      if (m.criticalServers && m.criticalServers > 0) {
        questions.unshift('⚠️ 위험 상태 서버들을 즉시 점검해줘');
      }
      if (m.warningServers && m.warningServers > 2) {
        questions.unshift('📊 경고 상태 서버들의 패턴을 분석해줘');
      }
      if (m.totalServers && m.totalServers > 10) {
        questions.push('🔄 대규모 인프라 최적화 방안을 제안해줘');
      }
    }

    return questions.slice(0, 4); // 최대 4개까지
  };

  useEffect(() => {
    // 15초마다 갱신
    const updatePresets = () => {
      const newPresets = generateContextualQuestions(serverMetrics);
      setPresets(newPresets);
    };

    updatePresets();

    // TimerManager를 사용한 프리셋 업데이트
    timerManager.register({
      id: 'dynamic-presets-update',
      callback: updatePresets,
      interval: 15000,
      priority: 'low',
      enabled: true,
    });

    return () => {
      timerManager.unregister('dynamic-presets-update');
    };
  }, [serverMetrics, generateContextualQuestions]);

  const getQuestionIcon = (question: string) => {
    if (question.includes('위험') || question.includes('⚠️'))
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (question.includes('서버') || question.includes('📊'))
      return <Server className="h-4 w-4 text-blue-500" />;
    if (question.includes('최적화') || question.includes('트렌드'))
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <Lightbulb className="h-4 w-4 text-purple-500" />;
  };

  return (
    <div className="space-y-3 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-purple-600" />
        <p className="text-sm font-medium text-purple-700">
          💡 상황별 추천 질문
        </p>
      </div>

      <div className="space-y-2">
        {presets.map((preset, index) => (
          <button
            key={`${preset}-${index}`}
            onClick={() => onSelect(preset)}
            className="group w-full rounded-lg border bg-white px-3 py-3 text-left text-sm shadow-sm transition-all duration-200 hover:border-purple-200 hover:bg-purple-50 hover:shadow"
          >
            <div className="flex items-start gap-2">
              {getQuestionIcon(preset)}
              <span className="transition-colors group-hover:text-purple-700">
                {preset}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="border-t border-purple-100 pt-2 text-center text-xs text-gray-500">
        💡 질문이 15초마다 서버 상태에 맞춰 업데이트됩니다
      </div>
    </div>
  );
}
