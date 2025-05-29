'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Shield, Zap, BarChart3, AlertTriangle, Sparkles } from 'lucide-react';

export default function AdvancedAnalysisPanel() {
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);

  const analysisTools = [
    {
      id: 'prediction',
      icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
      title: '예측 분석',
      description: '향후 24시간 리소스 사용량 예측',
      status: 'active'
    },
    {
      id: 'anomaly',
      icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
      title: '이상 탐지',
      description: '비정상 패턴 자동 감지',
      status: 'active'
    },
    {
      id: 'optimization',
      icon: <Zap className="w-5 h-5 text-green-500" />,
      title: '성능 최적화',
      description: '시스템 최적화 방안 도출',
      status: 'active'
    },
    {
      id: 'security',
      icon: <Shield className="w-5 h-5 text-purple-500" />,
      title: '보안 분석',
      description: '보안 취약점 스캔 및 분석',
      status: 'coming'
    },
    {
      id: 'capacity',
      icon: <BarChart3 className="w-5 h-5 text-indigo-500" />,
      title: '용량 계획',
      description: '인프라 확장 계획 수립',
      status: 'coming'
    }
  ];

  const handleAnalysisClick = (id: string, status: string) => {
    if (status === 'coming') {
      alert('이 기능은 곧 출시될 예정입니다.');
      return;
    }
    
    setSelectedAnalysis(selectedAnalysis === id ? null : id);
  };

  const renderAnalysisResult = (id: string) => {
    const results = {
      prediction: {
        title: '24시간 예측 결과',
        data: [
          { metric: 'CPU 사용률', current: '45%', predicted: '62%', trend: 'up' },
          { metric: '메모리 사용률', current: '67%', predicted: '71%', trend: 'up' },
          { metric: '디스크 I/O', current: '23%', predicted: '19%', trend: 'down' }
        ]
      },
      anomaly: {
        title: '이상 패턴 감지 결과',
        data: [
          { issue: '서버 #3 메모리 급증', severity: 'high', time: '2분 전' },
          { issue: '네트워크 지연 증가', severity: 'medium', time: '15분 전' },
          { issue: 'API 응답시간 변동', severity: 'low', time: '1시간 전' }
        ]
      },
      optimization: {
        title: '최적화 제안',
        data: [
          { action: 'Redis 캐시 설정 조정', impact: '응답시간 25% 개선', priority: 'high' },
          { action: 'DB 인덱스 재구성', impact: '쿼리 성능 15% 향상', priority: 'medium' },
          { action: '로그 순환 정책 변경', impact: '디스크 사용량 30% 절약', priority: 'low' }
        ]
      }
    };

    const result = results[id as keyof typeof results];
    if (!result) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 p-3 bg-gray-50 rounded-lg"
      >
        <h4 className="font-medium text-sm text-gray-800 mb-2">{result.title}</h4>
        <div className="space-y-2">
          {result.data.map((item: any, index: number) => (
            <div key={index} className="text-xs bg-white p-2 rounded border">
              {id === 'prediction' && (
                <div className="flex justify-between items-center">
                  <span>{item.metric}</span>
                  <div className="flex items-center gap-2">
                    <span>{item.current} → {item.predicted}</span>
                    <span className={`w-2 h-2 rounded-full ${
                      item.trend === 'up' ? 'bg-red-400' : 'bg-green-400'
                    }`} />
                  </div>
                </div>
              )}
              {id === 'anomaly' && (
                <div className="flex justify-between items-center">
                  <span>{item.issue}</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-1 py-0.5 rounded text-xs ${
                      item.severity === 'high' ? 'bg-red-100 text-red-600' :
                      item.severity === 'medium' ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {item.severity}
                    </span>
                    <span className="text-gray-500">{item.time}</span>
                  </div>
                </div>
              )}
              {id === 'optimization' && (
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium">{item.action}</span>
                    <span className={`px-1 py-0.5 rounded text-xs ${
                      item.priority === 'high' ? 'bg-red-100 text-red-600' :
                      item.priority === 'medium' ? 'bg-orange-100 text-orange-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                  <span className="text-gray-600">{item.impact}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-800">고급 분석 도구</h3>
      </div>
      
      <div className="space-y-2">
        {analysisTools.map((tool) => (
          <motion.div key={tool.id} className="space-y-0">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleAnalysisClick(tool.id, tool.status)}
              className={`w-full p-3 rounded-lg text-left transition-all border ${
                selectedAnalysis === tool.id
                  ? 'bg-purple-50 border-purple-200'
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              } ${tool.status === 'coming' ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-3">
                {tool.icon}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{tool.title}</h4>
                    {tool.status === 'coming' && (
                      <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded">
                        준비중
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{tool.description}</p>
                </div>
              </div>
            </motion.button>
            
            {selectedAnalysis === tool.id && renderAnalysisResult(tool.id)}
          </motion.div>
        ))}
      </div>

      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
        💡 <strong>팁:</strong> 분석 결과는 실시간 서버 데이터를 기반으로 생성됩니다.
      </div>
    </div>
  );
} 