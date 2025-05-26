'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  Activity,
  Zap
} from 'lucide-react';

interface AnalysisResult {
  id: string;
  type: 'pattern' | 'anomaly' | 'prediction' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  data?: any;
}

export default function AIAnalysisPage() {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    setIsLoading(true);
    try {
      // 시뮬레이션 데이터
      const mockAnalyses: AnalysisResult[] = [
        {
          id: '1',
          type: 'pattern',
          title: '서버 부하 패턴 분석',
          description: '주중 오후 2-4시 사이 CPU 사용률이 평균 15% 증가하는 패턴 감지',
          confidence: 92,
          impact: 'medium',
          timestamp: new Date(),
          status: 'completed'
        },
        {
          id: '2',
          type: 'anomaly',
          title: '메모리 사용량 이상 감지',
          description: 'api-server-03에서 비정상적인 메모리 증가 패턴 발견',
          confidence: 87,
          impact: 'high',
          timestamp: new Date(Date.now() - 3600000),
          status: 'completed'
        },
        {
          id: '3',
          type: 'prediction',
          title: '디스크 용량 예측',
          description: '현재 증가율로 db-server-01의 디스크가 7일 내 80% 도달 예상',
          confidence: 78,
          impact: 'critical',
          timestamp: new Date(Date.now() - 7200000),
          status: 'completed'
        }
      ];
      
      setAnalyses(mockAnalyses);
    } catch (error) {
      console.error('Failed to load analyses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runNewAnalysis = async (type: string) => {
    setIsLoading(true);
    try {
      // 새 분석 시뮬레이션
      const newAnalysis: AnalysisResult = {
        id: Date.now().toString(),
        type: type as any,
        title: `새로운 ${type} 분석`,
        description: '분석이 진행 중입니다...',
        confidence: 0,
        impact: 'medium',
        timestamp: new Date(),
        status: 'processing'
      };
      
      setAnalyses(prev => [newAnalysis, ...prev]);
      
      // 3초 후 완료 시뮬레이션
      setTimeout(() => {
        setAnalyses(prev => prev.map(a => 
          a.id === newAnalysis.id 
            ? { ...a, status: 'completed' as const, confidence: 85, description: '분석이 완료되었습니다.' }
            : a
        ));
      }, 3000);
    } catch (error) {
      console.error('Failed to run analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-500" />
            AI 분석 대시보드
          </h1>
          <p className="text-gray-600 mt-2">
            인공지능 기반 서버 성능 분석 및 예측
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => runNewAnalysis('pattern')} disabled={isLoading}>
            <BarChart3 className="h-4 w-4 mr-2" />
            패턴 분석
          </Button>
          <Button onClick={() => runNewAnalysis('anomaly')} disabled={isLoading}>
            <Activity className="h-4 w-4 mr-2" />
            이상 감지
          </Button>
          <Button onClick={() => runNewAnalysis('prediction')} disabled={isLoading}>
            <TrendingUp className="h-4 w-4 mr-2" />
            예측 분석
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="patterns">패턴 분석</TabsTrigger>
          <TabsTrigger value="anomalies">이상 감지</TabsTrigger>
          <TabsTrigger value="predictions">예측</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 분석</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyses.length}</div>
                <p className="text-xs text-muted-foreground">
                  +2 from last hour
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">완료된 분석</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyses.filter(a => a.status === 'completed').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((analyses.filter(a => a.status === 'completed').length / analyses.length) * 100)}% 완료율
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">평균 신뢰도</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(analyses.reduce((acc, a) => acc + a.confidence, 0) / analyses.length)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  +5% from last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">중요 알림</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyses.filter(a => a.impact === 'critical' || a.impact === 'high').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires attention
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>최근 분석 결과</CardTitle>
              <CardDescription>
                최근 실행된 AI 분석 결과들을 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyses.slice(0, 5).map((analysis) => (
                  <div key={analysis.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(analysis.status)}
                      <div>
                        <h3 className="font-medium">{analysis.title}</h3>
                        <p className="text-sm text-gray-600">{analysis.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className={`${getImpactColor(analysis.impact)} text-white`}>
                            {analysis.impact}
                          </Badge>
                          {analysis.confidence > 0 && (
                            <span className="text-xs text-gray-500">
                              신뢰도: {analysis.confidence}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {analysis.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle>패턴 분석</CardTitle>
              <CardDescription>
                서버 성능 패턴 및 트렌드 분석 결과
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyses.filter(a => a.type === 'pattern').map((analysis) => (
                  <div key={analysis.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{analysis.title}</h3>
                      <Badge variant="outline">패턴</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{analysis.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        신뢰도: {analysis.confidence}%
                      </span>
                      <span className="text-xs text-gray-500">
                        {analysis.timestamp.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies">
          <Card>
            <CardHeader>
              <CardTitle>이상 감지</CardTitle>
              <CardDescription>
                비정상적인 서버 동작 패턴 감지 결과
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyses.filter(a => a.type === 'anomaly').map((analysis) => (
                  <div key={analysis.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{analysis.title}</h3>
                      <Badge variant="destructive">이상</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{analysis.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        신뢰도: {analysis.confidence}%
                      </span>
                      <span className="text-xs text-gray-500">
                        {analysis.timestamp.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions">
          <Card>
            <CardHeader>
              <CardTitle>예측 분석</CardTitle>
              <CardDescription>
                미래 서버 상태 및 리소스 사용량 예측
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyses.filter(a => a.type === 'prediction').map((analysis) => (
                  <div key={analysis.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{analysis.title}</h3>
                      <Badge variant="secondary">예측</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{analysis.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        신뢰도: {analysis.confidence}%
                      </span>
                      <span className="text-xs text-gray-500">
                        {analysis.timestamp.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 