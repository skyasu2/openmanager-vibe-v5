/**
 * 🌐 실시간 시스템 상태 공유 테스트 페이지 v3
 *
 * 모든 사용자가 자유롭게 시스템 제어 가능
 * - 실시간 상태 브로드캐스트
 * - 제어 히스토리 추적
 * - 베르셀 환경 최적화
 */

'use client';

import { RealTimeSystemControl } from '@/components/system/RealTimeSystemControl';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Globe, TestTube, User, Users, Zap } from 'lucide-react';
import { useState } from 'react';

export default function TestRealTimeSystemPage() {
  const [selectedUser, setSelectedUser] = useState('user1');

  // 테스트 사용자들
  const testUsers = [
    { id: 'user1', name: '김개발자', emoji: '👨‍💻', color: 'bg-blue-500' },
    { id: 'user2', name: '이디자이너', emoji: '👩‍🎨', color: 'bg-purple-500' },
    { id: 'user3', name: '박매니저', emoji: '👨‍💼', color: 'bg-green-500' },
    { id: 'user4', name: '최운영자', emoji: '👩‍🔧', color: 'bg-orange-500' },
  ];

  const currentUser = testUsers.find(user => user.id === selectedUser);

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4'>
      <div className='max-w-7xl mx-auto space-y-6'>
        {/* 헤더 */}
        <Card className='bg-white/80 backdrop-blur-sm border-blue-200'>
          <CardHeader className='text-center'>
            <CardTitle className='flex items-center justify-center gap-3 text-2xl'>
              <Globe className='w-8 h-8 text-blue-600' />
              실시간 시스템 상태 공유 테스트
              <Badge
                variant='secondary'
                className='bg-green-100 text-green-700'
              >
                v3.0 - 실시간 상태 공유
              </Badge>
            </CardTitle>
            <CardDescription className='text-lg'>
              🌐 모든 사용자가 자유롭게 시스템을 제어하고 실시간으로 상태를
              공유합니다
            </CardDescription>
          </CardHeader>
        </Card>

        {/* 새로운 방식 소개 */}
        <Alert className='bg-green-50 border-green-200'>
          <CheckCircle className='h-4 w-4 text-green-600' />
          <AlertDescription className='text-green-800'>
            <strong>🎯 실시간 상태 공유 방식:</strong> 제어권 독점 없이 모든
            사용자가 자유롭게 시스템을 제어할 수 있으며, 모든 액션과 상태 변경이
            실시간으로 공유됩니다. 베르셀 환경에 최적화된 SSE 기반 구조입니다.
          </AlertDescription>
        </Alert>

        {/* 방식 비교 테이블 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Zap className='w-5 h-5' />
              실시간 상태 공유 vs 제어권 독점 비교
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b'>
                    <th className='text-left p-2 font-medium'>구분</th>
                    <th className='text-left p-2 font-medium bg-red-50'>
                      이전 방식 (제어권 독점)
                    </th>
                    <th className='text-left p-2 font-medium bg-green-50'>
                      현재 방식 (상태 공유)
                    </th>
                  </tr>
                </thead>
                <tbody className='text-sm'>
                  <tr className='border-b'>
                    <td className='p-2 font-medium'>철학</td>
                    <td className='p-2 bg-red-50'>한 번에 한 명만 제어</td>
                    <td className='p-2 bg-green-50'>
                      모든 사용자가 자유롭게 제어
                    </td>
                  </tr>
                  <tr className='border-b'>
                    <td className='p-2 font-medium'>사용성</td>
                    <td className='p-2 bg-red-50'>대기열, 락 시스템</td>
                    <td className='p-2 bg-green-50'>즉시 제어 가능</td>
                  </tr>
                  <tr className='border-b'>
                    <td className='p-2 font-medium'>베르셀 적합성</td>
                    <td className='p-2 bg-red-50'>복잡한 락 관리</td>
                    <td className='p-2 bg-green-50'>SSE 기반 단순함</td>
                  </tr>
                  <tr className='border-b'>
                    <td className='p-2 font-medium'>실시간성</td>
                    <td className='p-2 bg-red-50'>폴링 기반</td>
                    <td className='p-2 bg-green-50'>SSE 스트림</td>
                  </tr>
                  <tr>
                    <td className='p-2 font-medium'>협업성</td>
                    <td className='p-2 bg-red-50'>순차적 제어</td>
                    <td className='p-2 bg-green-50'>동시 상태 공유</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 사용자 선택 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <User className='w-5 h-5' />
              테스트 사용자 선택
            </CardTitle>
            <CardDescription>
              여러 사용자 관점에서 실시간 상태 공유를 테스트해보세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
              {testUsers.map(user => (
                <Button
                  key={user.id}
                  onClick={() => setSelectedUser(user.id)}
                  variant={selectedUser === user.id ? 'default' : 'outline'}
                  className='h-auto p-4 flex flex-col items-center gap-2'
                >
                  <div
                    className={`w-8 h-8 rounded-full ${user.color} flex items-center justify-center text-white text-lg`}
                  >
                    {user.emoji}
                  </div>
                  <span className='font-medium'>{user.name}</span>
                  {selectedUser === user.id && (
                    <Badge variant='secondary' className='text-xs'>
                      선택됨
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 실시간 시스템 제어 */}
        <Tabs defaultValue='control' className='space-y-4'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='control' className='flex items-center gap-2'>
              <Globe className='w-4 h-4' />
              실시간 제어
            </TabsTrigger>
            <TabsTrigger value='guide' className='flex items-center gap-2'>
              <TestTube className='w-4 h-4' />
              테스트 가이드
            </TabsTrigger>
          </TabsList>

          <TabsContent value='control' className='space-y-4'>
            <Card className='bg-white/90 backdrop-blur-sm'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <div
                    className={`w-6 h-6 rounded-full ${currentUser?.color} flex items-center justify-center text-white text-sm`}
                  >
                    {currentUser?.emoji}
                  </div>
                  {currentUser?.name}님의 시스템 제어 대시보드
                </CardTitle>
                <CardDescription>
                  실시간으로 다른 사용자들과 시스템 상태를 공유하며 제어합니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RealTimeSystemControl
                  userId={selectedUser}
                  userName={currentUser?.name || '익명'}
                  enableNotifications={true}
                  showUserList={true}
                  showActionHistory={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='guide' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <TestTube className='w-5 h-5' />
                  실시간 상태 공유 테스트 가이드
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-3'>
                  <div className='flex items-start gap-3'>
                    <Badge variant='outline' className='bg-blue-50'>
                      1
                    </Badge>
                    <div>
                      <p className='font-medium'>다중 브라우저 탭 테스트</p>
                      <p className='text-sm text-muted-foreground'>
                        새 탭에서 이 페이지를 열고 다른 사용자로 로그인하여
                        동시에 시스템을 제어해보세요
                      </p>
                    </div>
                  </div>

                  <div className='flex items-start gap-3'>
                    <Badge variant='outline' className='bg-green-50'>
                      2
                    </Badge>
                    <div>
                      <p className='font-medium'>실시간 상태 동기화 확인</p>
                      <p className='text-sm text-muted-foreground'>
                        한 탭에서 시스템을 시작/중지하면 다른 탭에서도 즉시
                        상태가 변경되는지 확인하세요
                      </p>
                    </div>
                  </div>

                  <div className='flex items-start gap-3'>
                    <Badge variant='outline' className='bg-purple-50'>
                      3
                    </Badge>
                    <div>
                      <p className='font-medium'>제어 히스토리 공유</p>
                      <p className='text-sm text-muted-foreground'>
                        누가 언제 어떤 액션을 했는지 모든 사용자에게 실시간으로
                        공유되는지 확인하세요
                      </p>
                    </div>
                  </div>

                  <div className='flex items-start gap-3'>
                    <Badge variant='outline' className='bg-orange-50'>
                      4
                    </Badge>
                    <div>
                      <p className='font-medium'>연결 상태 모니터링</p>
                      <p className='text-sm text-muted-foreground'>
                        연결된 사용자 목록이 실시간으로 업데이트되는지
                        확인하세요
                      </p>
                    </div>
                  </div>

                  <div className='flex items-start gap-3'>
                    <Badge variant='outline' className='bg-red-50'>
                      5
                    </Badge>
                    <div>
                      <p className='font-medium'>자동 재연결 테스트</p>
                      <p className='text-sm text-muted-foreground'>
                        네트워크를 일시적으로 끊었다가 연결해서 자동 재연결이
                        되는지 확인하세요
                      </p>
                    </div>
                  </div>
                </div>

                <Alert className='bg-blue-50 border-blue-200'>
                  <Users className='h-4 w-4 text-blue-600' />
                  <AlertDescription className='text-blue-800'>
                    <strong>💡 팁:</strong> 이 방식은 베르셀 서버리스 환경에
                    최적화되어 있어 복잡한 상태 관리 없이도 안정적인 실시간
                    협업이 가능합니다.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
