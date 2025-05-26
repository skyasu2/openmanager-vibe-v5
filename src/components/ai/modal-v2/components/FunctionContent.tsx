'use client';

import { FunctionType } from '../types';

interface FunctionContentProps {
  functionType: FunctionType;
  data: any[];
}

export default function FunctionContent({
  functionType,
  data
}: FunctionContentProps) {
  // 데이터가 없는 경우 로딩 또는 안내 표시
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-10">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <i className="fas fa-spinner fa-spin text-gray-400"></i>
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">데이터 로드 중</h3>
        <p className="text-sm text-gray-500">
          {functionTypeToTitle(functionType)} 데이터를 불러오고 있습니다.
        </p>
      </div>
    );
  }

  // 기능 유형별 렌더링
  switch (functionType) {
    case 'auto-report':
      return <AutoReportContent data={data} />;
    case 'performance':
      return <PerformanceContent data={data} />;
    case 'log-analysis':
      return <LogAnalysisContent data={data} />;
    case 'trend-analysis':
      return <TrendAnalysisContent data={data} />;
    case 'quick-diagnosis':
      return <QuickDiagnosisContent data={data} />;
    case 'solutions':
      return <SolutionsContent data={data} />;
    default:
      return null;
  }
}

// 기능 타입 제목 변환
function functionTypeToTitle(type: FunctionType): string {
  const titles: Record<FunctionType, string> = {
    'auto-report': '자동 장애보고서',
    'performance': '성능 분석',
    'log-analysis': '로그 분석',
    'trend-analysis': '트렌드 분석',
    'quick-diagnosis': '빠른 진단',
    'solutions': '해결책 제안',
    'resource-usage': '리소스 사용량',
    'security-check': '보안 점검',
    'deployment-history': '배포 이력',
    'backup-status': '백업 상태',
    'network-traffic': '네트워크 트래픽',
    'config-checker': '설정 검사',
    'api-monitor': 'API 모니터',
    'database-health': 'DB 상태',
    'user-activity': '사용자 활동',
    'service-health': '서비스 상태',
    'cost-analysis': '비용 분석',
    'scheduled-tasks': '예약 작업'
  };
  return titles[type] || '';
}

// 자동 장애보고서 내용
function AutoReportContent({ data }: { data: any[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-800">자동 장애보고서</h3>
      {data.map((item, index) => (
        <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium text-gray-800">{item.title}</div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(item.timestamp).toLocaleString('ko-KR', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>
            <div className={`
              px-2 py-1 rounded-full text-xs font-medium
              ${item.severity === 'critical' ? 'bg-red-100 text-red-700' :
                item.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                item.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'}
            `}>
              {item.severity === 'critical' ? '심각' :
               item.severity === 'high' ? '높음' :
               item.severity === 'medium' ? '중간' : '낮음'}
            </div>
          </div>
          <button className="mt-3 w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium transition-colors">
            보고서 보기
          </button>
        </div>
      ))}
    </div>
  );
}

// 성능 분석 내용
function PerformanceContent({ data }: { data: any[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-800">성능 분석</h3>
      {data.map((item) => (
        <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="font-medium text-gray-800 mb-2">{item.name}</div>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-20 text-xs text-gray-500">CPU</div>
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className={`h-2 rounded-full ${
                      item.cpu > 80 ? 'bg-red-500' :
                      item.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${item.cpu}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-10 text-xs font-medium text-right">{item.cpu}%</div>
            </div>
            
            <div className="flex items-center">
              <div className="w-20 text-xs text-gray-500">Memory</div>
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className={`h-2 rounded-full ${
                      item.memory > 80 ? 'bg-red-500' :
                      item.memory > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${item.memory}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-10 text-xs font-medium text-right">{item.memory}%</div>
            </div>
            
            <div className="flex items-center">
              <div className="w-20 text-xs text-gray-500">Disk</div>
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className={`h-2 rounded-full ${
                      item.disk > 80 ? 'bg-red-500' :
                      item.disk > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${item.disk}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-10 text-xs font-medium text-right">{item.disk}%</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 로그 분석 내용
function LogAnalysisContent({ data }: { data: any[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-800">로그 분석</h3>
      {data.map((item) => (
        <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-start gap-3">
            <div className={`
              w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
              ${item.level === 'ERROR' ? 'bg-red-100 text-red-700' :
                item.level === 'WARN' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'}
            `}>
              <i className={`fas fa-${
                item.level === 'ERROR' ? 'times' :
                item.level === 'WARN' ? 'exclamation' : 'info'
              } text-xs`}></i>
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-800">{item.message}</div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(item.timestamp).toLocaleString('ko-KR', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                })}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 트렌드 분석 내용 (간단한 구현)
function TrendAnalysisContent({ data }: { data: any[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-800">트렌드 분석</h3>
      {data.map((item) => (
        <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="font-medium text-gray-800 mb-2">기간: {item.period}</div>
          <div className="h-32 bg-gray-50 rounded-lg p-2 flex items-end space-x-1">
            {item.cpu.map((value: number, i: number) => (
              <div key={`cpu-${i}`} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${value}%` }}
                ></div>
                <div className="text-xs text-gray-500 mt-1">{i+1}</div>
              </div>
            ))}
          </div>
          <div className="text-xs text-center text-gray-500 mt-2">시간별 CPU 사용률 변화</div>
        </div>
      ))}
    </div>
  );
}

// 빠른 진단 내용
function QuickDiagnosisContent({ data }: { data: any[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-800">빠른 진단</h3>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="grid grid-cols-2 gap-3">
          {data.map((item) => (
            <div key={item.id} className={`
              p-3 rounded-lg border
              ${item.status === 'good' ? 'border-green-200 bg-green-50' :
                item.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                'border-red-200 bg-red-50'}
            `}>
              <div className={`
                text-xs font-medium mb-1
                ${item.status === 'good' ? 'text-green-700' :
                  item.status === 'warning' ? 'text-yellow-700' :
                  'text-red-700'}
              `}>
                {item.name}
              </div>
              <div className="text-lg font-semibold">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 해결책 제안 내용
function SolutionsContent({ data }: { data: any[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-800">해결책 제안</h3>
      {data.map((item) => (
        <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-start gap-3">
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
              ${item.priority === 'high' ? 'bg-red-100 text-red-700' :
                item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'}
            `}>
              <i className="fas fa-bolt text-xs"></i>
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-800">{item.title}</div>
              <div className="text-sm text-gray-600 mt-1">{item.description}</div>
            </div>
          </div>
          <div className="mt-3 flex space-x-2">
            <button className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors">
              적용하기
            </button>
            <button className="flex-1 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium transition-colors">
              무시하기
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 