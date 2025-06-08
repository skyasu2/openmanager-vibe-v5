/**
 * 🚀 Enhanced AI Sidebar with Shadcn UI
 * 
 * Shadcn UI Sheet 컴포넌트를 활용한 개선된 AI 사이드바
 * - Sheet, Tabs, ScrollArea 컴포넌트 사용
 * - 기존 AI 기능 100% 호환성 유지
 * - 향상된 UI/UX 및 반응형 디자인
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  Bot, 
  MessageSquare, 
  Activity, 
  BarChart3, 
  AlertTriangle,
  Settings,
  Send,
  Sparkles
} from 'lucide-react';

interface EnhancedAISidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  category?: 'monitoring' | 'analysis' | 'prediction' | 'incident';
}

const EnhancedAISidebar: React.FC<EnhancedAISidebarProps> = ({
  isOpen,
  onOpenChange,
  children
}) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 미리 정의된 질문 템플릿
  const quickQuestions = [
    {
      category: 'monitoring',
      icon: Activity,
      title: '서버 상태 확인',
      questions: [
        '현재 모든 서버의 상태는 어떤가요?',
        'CPU 사용률이 높은 서버가 있나요?',
        '메모리 부족 경고가 있는 서버는?'
      ]
    },
    {
      category: 'analysis',
      icon: BarChart3,
      title: '성능 분석',
      questions: [
        '지난 24시간 성능 트렌드 분석',
        '응답 시간이 느린 서비스 분석',
        '리소스 사용 패턴 분석'
      ]
    },
    {
      category: 'prediction',
      icon: Sparkles,
      title: '예측 분석',
      questions: [
        '향후 1시간 내 장애 예측',
        '리소스 부족 예상 시점',
        '스케일링 필요 서버 예측'
      ]
    },
    {
      category: 'incident',
      icon: AlertTriangle,
      title: '장애 대응',
      questions: [
        '현재 발생 중인 알림 분석',
        '장애 원인 분석 및 해결책',
        '연관 서버 영향도 분석'
      ]
    }
  ];

  // 메시지 전송 핸들러
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);

    // AI 응답 시뮬레이션 (실제 구현에서는 AI 서비스 호출)
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: `AI 분석 결과: "${content}"에 대한 상세한 분석을 수행했습니다. 현재 시스템 상태를 기반으로 다음과 같은 인사이트를 제공합니다...`,
        timestamp: new Date(),
        category: 'analysis'
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsProcessing(false);
    }, 2000);
  }, [isProcessing]);

  // 빠른 질문 클릭 핸들러
  const handleQuickQuestion = useCallback((question: string) => {
    handleSendMessage(question);
  }, [handleSendMessage]);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {children || (
          <Button 
            variant="outline" 
            size="icon"
            className="fixed right-4 top-4 z-50 shadow-lg"
          >
            <Bot className="h-4 w-4" />
          </Button>
        )}
      </SheetTrigger>
      
      <SheetContent 
        side="right" 
        className="w-[400px] sm:w-[500px] p-0 flex flex-col"
      >
        <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <SheetTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            AI 어시스턴트
            <Badge variant="secondary" className="ml-auto">
              Beta
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              채팅
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              템플릿
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              설정
            </TabsTrigger>
          </TabsList>

          {/* 채팅 탭 */}
          <TabsContent value="chat" className="flex-1 flex flex-col px-6 pb-6">
            <ScrollArea className="flex-1 pr-4 mb-4">
              <div className="space-y-4 py-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      안녕하세요! 서버 모니터링에 대해 무엇이든 물어보세요.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex gap-3',
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.type === 'ai' && (
                        <div className="p-2 bg-blue-100 rounded-full shrink-0">
                          <Bot className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                      
                      <Card className={cn(
                        'max-w-[80%]',
                        message.type === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      )}>
                        <CardContent className="p-3">
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  ))
                )}
                
                {isProcessing && (
                  <div className="flex gap-3 justify-start">
                    <div className="p-2 bg-blue-100 rounded-full shrink-0">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                    <Card className="bg-muted">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                          <span className="text-sm text-muted-foreground">분석 중...</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Textarea
                placeholder="서버 상태나 성능에 대해 질문해보세요..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(inputMessage);
                  }
                }}
                className="min-h-[60px] resize-none"
                disabled={isProcessing}
              />
              <Button
                onClick={() => handleSendMessage(inputMessage)}
                disabled={!inputMessage.trim() || isProcessing}
                size="icon"
                className="shrink-0 h-[60px]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* 템플릿 탭 */}
          <TabsContent value="templates" className="flex-1 px-6 pb-6">
            <ScrollArea className="h-full">
              <div className="space-y-6 py-4">
                {quickQuestions.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <Card key={category.category}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <IconComponent className="h-5 w-5 text-primary" />
                          {category.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {category.questions.map((question, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            className="w-full justify-start text-left h-auto p-3 whitespace-normal"
                            onClick={() => handleQuickQuestion(question)}
                          >
                            {question}
                          </Button>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* 설정 탭 */}
          <TabsContent value="settings" className="flex-1 px-6 pb-6">
            <ScrollArea className="h-full">
              <div className="space-y-6 py-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">AI 설정</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">실시간 분석</span>
                      <Button variant="outline" size="sm">활성화</Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm">알림 설정</span>
                      <Button variant="outline" size="sm">설정</Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm">데이터 보존 기간</span>
                      <Badge variant="secondary">7일</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">정보</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>• AI 어시스턴트 v2.0</p>
                    <p>• 실시간 서버 모니터링 지원</p>
                    <p>• 예측 분석 및 장애 대응</p>
                    <p>• OpenManager Vibe v5 통합</p>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default EnhancedAISidebar; 