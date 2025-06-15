import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import SystemBootSequence from './SystemBootSequence';
import { Server } from '@/types/server';
import { useState } from 'react';

const meta: Meta<typeof SystemBootSequence> = {
  title: 'System/SystemBootSequence',
  component: SystemBootSequence,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
🚀 **시스템 부팅 시퀀스**

서버 시스템 초기화 과정을 시각적으로 표현하는 체크리스트 기반 부팅 시퀀스입니다.

### ✨ 주요 기능
- **체크리스트 기반 부팅**: 실제 시스템 구성 요소별 단계적 초기화
- **병렬 처리 최적화**: 효율적인 시스템 준비 과정
- **서버 스포닝**: 연결된 서버들의 순차적 초기화
- **비상 완료 시스템**: 에러 발생 시 또는 장시간 로딩 시 우회 옵션
- **사용자 확인 대기**: 모든 초기화 완료 후 사용자 확인
- **키보드/마우스 상호작용**: ESC, 클릭 등으로 단계 제어

### 🎯 사용 사례
- 시스템 최초 실행 시 초기화 과정
- 서버 재시작 후 상태 확인
- 대시보드 진입 전 시스템 준비 과정
- 개발 환경에서 시스템 상태 시뮬레이션

### 🔧 기술 구현
- 체크리스트 기반 단계별 진행
- 의존성 관리 및 우선순위 처리
- 글로벌 에러 핸들러 통합
- 개발자 도구 및 디버깅 지원
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    skipAnimation: {
      control: 'boolean',
      description: '애니메이션 스킵 여부',
    },
    autoStart: {
      control: 'boolean',
      description: '자동 시작 여부',
    },
    onBootComplete: {
      action: 'boot-completed',
      description: '부팅 완료 콜백',
    },
    onServerSpawned: {
      action: 'server-spawned',
      description: '서버 스포닝 콜백',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SystemBootSequence>;

// 테스트용 서버 데이터
const mockServers: Server[] = [
  {
    id: 'server-01',
    name: 'Web Server 01',
    status: 'online',
    cpu: 45,
    memory: 62,
    disk: 78,
    uptime: '5d 12h',
    location: 'Production',
    alerts: 0,
    lastUpdate: new Date(),
    services: [],
  },
  {
    id: 'server-02',
    name: 'Database Server',
    status: 'online',
    cpu: 78,
    memory: 85,
    disk: 45,
    uptime: '12d 8h',
    location: 'Production',
    alerts: 1,
    lastUpdate: new Date(),
    services: [],
  },
  {
    id: 'server-03',
    name: 'API Gateway',
    status: 'warning',
    cpu: 92,
    memory: 71,
    disk: 56,
    uptime: '2d 3h',
    location: 'Staging',
    alerts: 2,
    lastUpdate: new Date(),
    services: [],
  },
  {
    id: 'server-04',
    name: 'Cache Server',
    status: 'online',
    cpu: 23,
    memory: 34,
    disk: 12,
    uptime: '8d 15h',
    location: 'Production',
    alerts: 0,
    lastUpdate: new Date(),
    services: [],
  },
];

// 부팅 시퀀스 래퍼 컴포넌트
const BootSequenceWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='relative w-full h-screen bg-black overflow-hidden'>
      {children}
    </div>
  );
};

// 인터랙티브 부팅 시퀀스
const InteractiveBootSequence = ({
  servers = mockServers,
  skipAnimation = false,
  autoStart = true,
}: {
  servers?: Server[];
  skipAnimation?: boolean;
  autoStart?: boolean;
}) => {
  const [isComplete, setIsComplete] = useState(false);
  const [restartKey, setRestartKey] = useState(0);

  const handleBootComplete = () => {
    console.log('🎉 부팅 시퀀스 완료!');
    setIsComplete(true);
    action('boot-completed')();
  };

  const handleRestart = () => {
    setIsComplete(false);
    setRestartKey(prev => prev + 1);
  };

  if (isComplete) {
    return (
      <BootSequenceWrapper>
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='text-center space-y-6'>
            <div className='text-4xl text-green-400'>✅</div>
            <h2 className='text-2xl font-bold text-white'>부팅 완료!</h2>
            <p className='text-gray-300'>모든 시스템이 준비되었습니다.</p>
            <button
              onClick={handleRestart}
              className='px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors'
            >
              🔄 다시 실행
            </button>
          </div>
        </div>
      </BootSequenceWrapper>
    );
  }

  return (
    <BootSequenceWrapper>
      <SystemBootSequence
        key={restartKey}
        servers={servers}
        onBootComplete={handleBootComplete}
        onServerSpawned={action('server-spawned')}
        skipAnimation={skipAnimation}
        autoStart={autoStart}
      />
    </BootSequenceWrapper>
  );
};

/**
 * 🎯 **기본 부팅 시퀀스**
 *
 * 표준 서버 데이터를 사용한 기본 부팅 시퀀스입니다.
 * 체크리스트 → 서버 스포닝 → 사용자 확인 순서로 진행됩니다.
 */
export const Default: Story = {
  render: () => <InteractiveBootSequence />,
};

/**
 * ⚡ **빠른 부팅 (애니메이션 스킵)**
 *
 * 애니메이션을 스킵하고 즉시 완료되는 부팅 시퀀스입니다.
 * 성능 테스트나 빠른 진행이 필요할 때 사용됩니다.
 */
export const SkipAnimation: Story = {
  render: () => <InteractiveBootSequence skipAnimation={true} />,
};

/**
 * 🖥️ **서버 없음**
 *
 * 연결된 서버가 없는 상황에서의 부팅 시퀀스입니다.
 * 체크리스트만 진행되고 서버 스포닝 단계는 건너뜁니다.
 */
export const NoServers: Story = {
  render: () => <InteractiveBootSequence servers={[]} />,
};

/**
 * 🔧 **단일 서버**
 *
 * 하나의 서버만 연결된 환경에서의 부팅 시퀀스입니다.
 * 빠른 서버 스포닝 과정을 확인할 수 있습니다.
 */
export const SingleServer: Story = {
  render: () => <InteractiveBootSequence servers={[mockServers[0]]} />,
};

/**
 * 🚨 **많은 서버 (10개)**
 *
 * 다수의 서버가 연결된 환경에서의 부팅 시퀀스입니다.
 * 서버 스포닝 성능과 시각적 효과를 확인할 수 있습니다.
 */
export const ManyServers: Story = {
  render: () => {
    const manyServers: Server[] = Array.from({ length: 10 }, (_, i) => ({
      id: `server-${String(i + 1).padStart(2, '0')}`,
      name: `Server ${String(i + 1).padStart(2, '0')}`,
      status: ['online', 'warning'][Math.floor(Math.random() * 2)] as
        | 'online'
        | 'warning',
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 100),
      disk: Math.floor(Math.random() * 100),
      uptime: `${Math.floor(Math.random() * 30)}d ${Math.floor(Math.random() * 24)} h`,
      location: ['Production', 'Staging', 'Development'][
        Math.floor(Math.random() * 3)
      ],
      alerts: Math.floor(Math.random() * 5),
      lastUpdate: new Date(),
      services: [],
    }));

    return <InteractiveBootSequence servers={manyServers} />;
  },
};

/**
 * 🌙 **다크 모드 테스트**
 *
 * 부팅 시퀀스는 기본적으로 어두운 배경을 사용하지만,
 * 다양한 테마 환경에서의 호환성을 확인합니다.
 */
export const DarkMode: Story = {
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  render: () => <InteractiveBootSequence />,
};

/**
 * 📱 **모바일 반응형**
 *
 * 모바일 환경에서의 부팅 시퀀스 표시를 확인합니다.
 * 터치 인터랙션과 작은 화면 최적화를 테스트할 수 있습니다.
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => <InteractiveBootSequence />,
};

/**
 * 🛠️ **개발자 모드**
 *
 * 개발 환경에서의 부팅 시퀀스입니다.
 * 디버깅 정보 패널과 개발자 도구가 표시됩니다.
 */
export const DeveloperMode: Story = {
  parameters: {
    // 개발 모드 시뮬레이션
    docs: {
      description: {
        story: `
개발 환경에서는 우측 하단에 디버깅 정보 패널이 표시됩니다:
- 현재 단계 상태
    - 서버 수 정보
        - 에러 카운트
            - 강제 완료 명령어들

                ** 개발자 콘솔 명령어:**
                    - \`debugSystemBootSequence.forceComplete()\`: 강제 완료
- \`debugSystemBootSequence.skipAnimation()\`: 애니메이션 스킵
- \`emergencyCompleteBootSequence()\`: 비상 완료
        `,
      },
    },
  },
  render: () => <InteractiveBootSequence />,
};

/**
 * ⚡ **성능 테스트**
 *
 * 부팅 시퀀스의 성능과 메모리 사용량을 모니터링하기 위한 스토리입니다.
 * 개발자 도구에서 성능 프로파일링을 진행할 수 있습니다.
 */
export const PerformanceTest: Story = {
  render: () => (
    <BootSequenceWrapper>
      <div className='absolute top-4 left-4 z-50 bg-yellow-900/50 border border-yellow-600 p-3 rounded-lg max-w-sm'>
        <h4 className='text-yellow-300 font-medium mb-2'>⚡ 성능 모니터링</h4>
        <div className='text-xs text-yellow-200 space-y-1'>
          <div>• 개발자 도구 → Performance 탭 열기</div>
          <div>• Record 버튼 클릭 후 부팅 시퀀스 실행</div>
          <div>• 메모리 사용량과 렌더링 성능 확인</div>
        </div>
      </div>
      <InteractiveBootSequence />
    </BootSequenceWrapper>
  ),
};

/**
 * 🧪 **사용자 상호작용 테스트**
 *
 * 다양한 사용자 상호작용을 테스트하기 위한 스토리입니다.
 * 키보드, 마우스, 터치 이벤트의 응답성을 확인할 수 있습니다.
 */
export const InteractionTest: Story = {
  render: () => (
    <BootSequenceWrapper>
      <div className='absolute top-4 left-4 z-50 bg-blue-900/50 border border-blue-600 p-4 rounded-lg max-w-sm'>
        <h4 className='text-blue-300 font-medium mb-2'>🧪 상호작용 테스트</h4>
        <div className='text-xs text-blue-200 space-y-1'>
          <div>✅ 체크리스트 진행 중 화면 클릭</div>
          <div>✅ ESC 키로 카운트다운 중단</div>
          <div>✅ 사용자 확인 대기 시 클릭</div>
          <div>✅ 비상 완료 버튼 클릭</div>
          <div>✅ 키보드 내비게이션</div>
        </div>
      </div>
      <InteractiveBootSequence />
    </BootSequenceWrapper>
  ),
};
