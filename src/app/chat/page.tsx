export default function ChatPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">MCP 대화형 인터페이스</h1>
        <p className="text-gray-600">
          자연어로 서버 상태를 질문하고 분석 결과를 확인하세요.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-3/4">
          <div className="bg-white rounded-xl shadow-md overflow-hidden h-[70vh] flex flex-col">
            <div className="bg-blue-600 text-white p-4 flex items-center">
              <div className="flex-1">
                <h2 className="font-semibold">MCP-V5 인터페이스</h2>
                <p className="text-xs text-blue-100">온라인 - 빠른 응답 가능</p>
              </div>
              <div className="h-3 w-3 bg-green-400 rounded-full"></div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <SystemMessage 
                message="안녕하세요! OpenManager Vibe V5에 오신 것을 환영합니다. 서버 상태, 성능 모니터링, 시스템 분석에 대해 질문해주세요." 
              />
              
              <UserMessage 
                message="현재 서버 상태 알려줘" 
                time="오후 2:05"
              />
              
              <BotMessage 
                message="서버 상태를 확인하겠습니다. 현재 모니터링 중인 서버들의 상태를 분석해드리겠습니다. 전체 4개 서버 중 2개가 정상 실행 중이고, 1개는 경고 상태, 1개는 오류 상태입니다."
                time="오후 2:05"
              >
                <div className="mt-2 bg-blue-50 p-3 rounded-lg text-sm">
                  <div className="font-medium text-blue-800 mb-1">서버 상태 요약</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                      <span>정상: 2</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                      <span>경고: 1</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                      <span>오류: 1</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-gray-500 rounded-full"></div>
                      <span>중지: 0</span>
                    </div>
                  </div>
                </div>
              </BotMessage>
              
              <UserMessage 
                message="어떤 서버가 문제가 있어?" 
                time="오후 2:06"
              />
              
              <BotMessage 
                message="현재 문제가 발생한 서버는 다음과 같습니다:"
                time="오후 2:06"
              >
                <div className="mt-2 space-y-2">
                  <div className="bg-yellow-50 p-3 rounded-lg text-sm">
                    <div className="font-medium">API서버-01 (Node.js)</div>
                    <div className="text-xs text-yellow-700 mt-1">경고: CPU 사용률 75%, 메모리 사용률 85%</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg text-sm">
                    <div className="font-medium">캐시서버-01 (Redis)</div>
                    <div className="text-xs text-red-700 mt-1">오류: CPU 사용률 89%, 메모리 사용률 91%</div>
                  </div>
                </div>
              </BotMessage>
              
              <UserMessage 
                message="캐시 서버 문제 원인이 뭐야?" 
                time="오후 2:07"
              />
              
              <BotMessage 
                message="캐시서버-01 (Redis)의 문제 원인을 분석했습니다. 지난 1시간 동안 급격한 메모리 사용량 증가가 발생했으며, 이는 커넥션 누수 문제와 연관된 것으로 보입니다. 현재 91%의 메모리 사용률을 보이고 있어 즉각적인 조치가 필요합니다."
                time="오후 2:07"
              >
                <div className="mt-2 bg-red-50 p-3 rounded-lg text-sm">
                  <div className="font-medium text-red-800 mb-1">문제 분석 결과</div>
                  <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                    <li>Redis 커넥션 누수 발생 (현재 487개 연결)</li>
                    <li>메모리 사용률 지속적 증가 (지난 30분 동안 15% 증가)</li>
                    <li>캐시 제거(eviction) 이벤트 급증</li>
                  </ul>
                  <div className="mt-2 font-medium text-red-800">권장 조치</div>
                  <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                    <li>불필요한 커넥션 정리</li>
                    <li>메모리 제한 설정 조정</li>
                    <li>Redis 설정 최적화</li>
                  </ul>
                </div>
              </BotMessage>
            </div>
            
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="메시지 입력..." 
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  전송
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:w-1/4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">도움말</h2>
            <div className="space-y-4">
              <div className="text-sm">
                <h3 className="font-medium mb-1">가능한 질문 예시:</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="bg-gray-50 p-2 rounded">"서버 상태 알려줘"</li>
                  <li className="bg-gray-50 p-2 rounded">"웹서버 CPU 사용률은?"</li>
                  <li className="bg-gray-50 p-2 rounded">"오늘 발생한 경고는?"</li>
                  <li className="bg-gray-50 p-2 rounded">"캐시서버 문제 분석해줘"</li>
                </ul>
              </div>
              
              <div className="text-sm">
                <h3 className="font-medium mb-1">명령 예시:</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="bg-gray-50 p-2 rounded">"서버 재부팅 필요한지 분석해줘"</li>
                  <li className="bg-gray-50 p-2 rounded">"어제와 오늘 성능 비교해줘"</li>
                  <li className="bg-gray-50 p-2 rounded">"지난 한 시간 로그 분석해줘"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface MessageProps {
  message: string
  time?: string
  children?: React.ReactNode
}

function SystemMessage({ message }: MessageProps) {
  return (
    <div className="bg-gray-100 p-3 rounded-lg max-w-[80%] mx-auto text-sm text-center text-gray-600">
      {message}
    </div>
  )
}

function UserMessage({ message, time }: MessageProps) {
  return (
    <div className="flex justify-end mb-3">
      <div className="bg-blue-600 text-white p-3 rounded-lg rounded-tr-none max-w-[70%]">
        <div>{message}</div>
        {time && <div className="text-xs text-blue-200 mt-1 text-right">{time}</div>}
      </div>
    </div>
  )
}

function BotMessage({ message, time, children }: MessageProps) {
  return (
    <div className="flex justify-start mb-3">
      <div className="bg-gray-100 p-3 rounded-lg rounded-tl-none max-w-[70%]">
        <div>{message}</div>
        {children}
        {time && <div className="text-xs text-gray-500 mt-1">{time}</div>}
      </div>
    </div>
  )
} 