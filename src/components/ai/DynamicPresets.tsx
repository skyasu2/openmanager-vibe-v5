'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Server, TrendingUp, AlertTriangle } from 'lucide-react';
import { timerManager } from '../../utils/TimerManager';

interface DynamicPresetsProps {
  serverMetrics?: any;
  onSelect: (question: string) => void;
}

export default function DynamicPresets({ serverMetrics, onSelect }: DynamicPresetsProps) {
  const [presets, setPresets] = useState<string[]>([]);

  const generateContextualQuestions = (metrics: any): string[] => {
    const questions = [
      "현재 시스템 전체 상태를 요약해줘",
      "CPU 사용률이 높은 서버들을 분석해줘", 
      "메모리 최적화 방안을 추천해줘",
      "서버 성능 트렌드를 분석해줘",
      "시스템 보안 상태를 점검해줘"
    ];

    // 서버 메트릭스에 따른 동적 질문 생성
    if (metrics) {
      if (metrics.criticalServers > 0) {
        questions.unshift("⚠️ 위험 상태 서버들을 즉시 점검해줘");
      }
      if (metrics.warningServers > 2) {
        questions.unshift("📊 경고 상태 서버들의 패턴을 분석해줘");
      }
      if (metrics.totalServers > 10) {
        questions.push("🔄 대규모 인프라 최적화 방안을 제안해줘");
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
      priority: 'low'
    });
    
    return () => {
      timerManager.unregister('dynamic-presets-update');
    };
  }, [serverMetrics]);

  const getQuestionIcon = (question: string) => {
    if (question.includes('위험') || question.includes('⚠️')) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (question.includes('서버') || question.includes('📊')) return <Server className="w-4 h-4 text-blue-500" />;
    if (question.includes('최적화') || question.includes('트렌드')) return <TrendingUp className="w-4 h-4 text-green-500" />;
    return <Lightbulb className="w-4 h-4 text-purple-500" />;
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-purple-600" />
        <p className="text-sm font-medium text-purple-700">💡 상황별 추천 질문</p>
      </div>
      
      <div className="space-y-2">
        {presets.map((preset, index) => (
          <motion.button
            key={`${preset}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(preset)}
            className="w-full text-left text-sm px-3 py-3 bg-white rounded-lg border 
                     hover:bg-purple-50 hover:border-purple-200 transition-all duration-200 
                     shadow-sm hover:shadow group"
          >
            <div className="flex items-start gap-2">
              {getQuestionIcon(preset)}
              <span className="group-hover:text-purple-700 transition-colors">
                {preset}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
      
      <div className="text-xs text-gray-500 text-center pt-2 border-t border-purple-100">
        💡 질문이 15초마다 서버 상태에 맞춰 업데이트됩니다
      </div>
    </div>
  );
} 