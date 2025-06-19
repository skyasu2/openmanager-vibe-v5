import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Clock,
  Shield,
  Server as ServerIcon,
  Layers,
  Terminal,
  FileText,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { Server } from '@/types/server';
import { useServerMetricsHistory } from '@/hooks/useServerMetricsHistory';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface EnhancedServerModalProps {
  isOpen: boolean;
  server: Server | null;
  onClose: () => void;
}

const tabs = [
  { id: 'overview', label: '개요', icon: <ServerIcon size={16} /> },
  { id: 'metrics', label: '실시간 메트릭', icon: <Cpu size={16} /> },
  { id: 'processes', label: '프로세스', icon: <Terminal size={16} /> },
  { id: 'logs', label: '로그', icon: <FileText size={16} /> },
];

const EnhancedServerModal: React.FC<EnhancedServerModalProps> = ({
  isOpen,
  server,
  onClose,
}) => {
  const [selectedTab, setSelectedTab] = useState(tabs[0].id);

  if (!server) return null;

  const handleTabClick = (tabId: string) => {
    setSelectedTab(tabId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className='bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-2xl w-full max-w-4xl h-[90vh] text-white flex flex-col'
            onClick={e => e.stopPropagation()}
          >
            <Header serverName={server.name} onClose={onClose} />
            <div className='flex p-4 gap-4 flex-grow min-h-0'>
              <Sidebar server={server} />
              <MainContent
                selectedTab={selectedTab}
                server={server}
                onTabClick={handleTabClick}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Header: React.FC<{ serverName: string; onClose: () => void }> = ({
  serverName,
  onClose,
}) => (
  <header className='flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0'>
    <h2 className='text-xl font-bold flex items-center gap-2'>
      <ServerIcon />
      {serverName}
    </h2>
    <div className='flex items-center gap-2'>
      <button
        aria-label='Settings'
        className='p-2 rounded-full hover:bg-white/10 transition-colors'
      >
        <Settings size={18} />
      </button>
      <button
        aria-label='Refresh'
        className='p-2 rounded-full hover:bg-white/10 transition-colors'
      >
        <RefreshCw size={18} />
      </button>
      <button
        aria-label='Close'
        onClick={onClose}
        className='p-2 rounded-full hover:bg-white/10 transition-colors'
      >
        <X size={20} />
      </button>
    </div>
  </header>
);

const Sidebar: React.FC<{ server: Server }> = ({ server }) => (
  <aside className='w-1/4 bg-white/5 rounded-lg p-4 flex flex-col gap-4'>
    <InfoItem
      icon={<Cpu size={18} />}
      label='CPU Cores'
      value={`${server.cpu || 0} %`}
    />
    <InfoItem
      icon={<MemoryStick size={18} />}
      label='Memory'
      value={`${server.memory || 0} %`}
    />
    <InfoItem
      icon={<HardDrive size={18} />}
      label='Disk'
      value={`${server.disk || 0} %`}
    />
    <InfoItem
      icon={<Network size={18} />}
      label='Network'
      value={`${server.network || 0} %`}
    />
    <InfoItem icon={<Clock size={18} />} label='Uptime' value={server.uptime} />
    <InfoItem
      icon={<Layers size={18} />}
      label='OS'
      value={server.os || 'N/A'}
    />
    <InfoItem
      icon={<Shield size={18} />}
      label='IP Address'
      value={server.ip || 'N/A'}
    />
  </aside>
);

const InfoItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div>
    <div className='text-sm text-gray-400 flex items-center gap-2'>
      {icon}
      {label}
    </div>
    <div className='text-lg font-semibold'>{value}</div>
  </div>
);

const MainContent: React.FC<{
  selectedTab: string;
  server: Server;
  onTabClick: (tabId: string) => void;
}> = ({ selectedTab, server, onTabClick }) => {
  return (
    <main className='w-3/4 flex flex-col'>
      <nav className='flex-shrink-0 mb-4'>
        <ul className='flex gap-2 p-1 bg-white/5 rounded-lg'>
          {tabs.map(tab => (
            <li key={tab.id} className='flex-1'>
              <button
                onClick={() => onTabClick(tab.id)}
                className={`w-full p-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  selectedTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-white/10'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className='flex-grow bg-white/5 rounded-lg p-4 overflow-y-auto'>
        <AnimatePresence mode='wait'>
          <motion.div
            key={selectedTab}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {selectedTab === 'overview' && <OverviewTab server={server} />}
            {selectedTab === 'metrics' && <MetricsTab serverId={server.id} />}
            {selectedTab === 'processes' && <ProcessesTab />}
            {selectedTab === 'logs' && <LogsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
};

const OverviewTab: React.FC<{ server: Server }> = ({ server }) => (
  <div>
    <h3 className='text-lg font-semibold mb-4'>서버 개요</h3>
    <div className='grid grid-cols-2 gap-4'>
      <p>
        <span className='font-semibold'>Status:</span>{' '}
        <span
          className={`capitalize ${server.status === 'online' ? 'text-green-400' : 'text-red-400'}`}
        >
          {server.status}
        </span>
      </p>
      <p>
        <span className='font-semibold'>Location:</span> {server.location}
      </p>
      <p>
        <span className='font-semibold'>Services:</span>{' '}
        {server.services?.length || 0} running
      </p>
      <p>
        <span className='font-semibold'>Alerts:</span> {server.alerts || 0}
      </p>
    </div>
  </div>
);

const MetricsTab: React.FC<{ serverId: string }> = ({ serverId }) => {
  const { metricsHistory } = useServerMetricsHistory(serverId);

  const chartData = useMemo(() => {
    return metricsHistory.cpu.map((_, i) => ({
      name: `Time ${i}`,
      cpu: metricsHistory.cpu[i],
      memory: metricsHistory.memory[i],
      disk: metricsHistory.disk[i],
      network: metricsHistory.network[i],
    }));
  }, [metricsHistory]);

  return (
    <div className='h-[400px]'>
      <ResponsiveContainer width='100%' height='100%'>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id='colorCpu' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#3b82f6' stopOpacity={0.8} />
              <stop offset='95%' stopColor='#3b82f6' stopOpacity={0} />
            </linearGradient>
            <linearGradient id='colorMemory' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#8b5cf6' stopOpacity={0.8} />
              <stop offset='95%' stopColor='#8b5cf6' stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray='3 3' stroke='rgba(255,255,255,0.1)' />
          <XAxis dataKey='name' stroke='#9ca3af' fontSize={12} />
          <YAxis stroke='#9ca3af' fontSize={12} unit='%' />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(31,41,55,0.8)',
              border: '1px solid #4b5563',
              borderRadius: '0.5rem',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          <Area
            type='monotone'
            dataKey='cpu'
            stroke='#3b82f6'
            fillOpacity={1}
            fill='url(#colorCpu)'
          />
          <Area
            type='monotone'
            dataKey='memory'
            stroke='#8b5cf6'
            fillOpacity={1}
            fill='url(#colorMemory)'
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const ProcessesTab = () => (
  <div>
    <h3 className='text-lg font-semibold'>실행 중인 프로세스</h3>
    <p className='text-gray-400'>프로세스 목록이 여기에 표시됩니다.</p>
  </div>
);

const LogsTab = () => (
  <div>
    <h3 className='text-lg font-semibold'>실시간 로그</h3>
    <p className='text-gray-400'>로그 데이터가 여기에 스트리밍됩니다.</p>
  </div>
);

export default EnhancedServerModal;
