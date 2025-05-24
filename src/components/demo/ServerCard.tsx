'use client';

import { motion } from 'framer-motion';
import { Cpu, HardDrive, Wifi, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

interface Server {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  location: string;
  type: string;
  metrics: ServerMetrics;
  uptime: number;
  lastUpdate: Date;
}

interface ServerCardProps {
  server: Server;
  isHighlighted?: boolean;
  onClick?: () => void;
}

const MetricBar = ({ value, color }: { value: number; color: string }) => (
  <div className="w-full bg-gray-200 rounded-full h-2">
    <motion.div
      className={`h-2 rounded-full ${color}`}
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
  </div>
);

const StatusIcon = ({ status }: { status: Server['status'] }) => {
  switch (status) {
    case 'healthy':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'critical':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
  }
};

const getStatusColor = (status: Server['status']) => {
  switch (status) {
    case 'healthy':
      return 'border-green-500 bg-green-50';
    case 'warning':
      return 'border-yellow-500 bg-yellow-50';
    case 'critical':
      return 'border-red-500 bg-red-50';
  }
};

const getMetricColor = (value: number) => {
  if (value < 60) return 'bg-green-500';
  if (value < 80) return 'bg-yellow-500';
  return 'bg-red-500';
};

export default function ServerCard({ server, isHighlighted = false, onClick }: ServerCardProps) {
  return (
    <motion.div
      className={`
        relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300
        ${isHighlighted 
          ? 'border-blue-500 bg-blue-50 shadow-xl scale-105 z-10' 
          : `${getStatusColor(server.status)} shadow-md hover:shadow-lg hover:scale-102`
        }
      `}
      onClick={onClick}
      whileHover={{ y: -2 }}
      animate={isHighlighted ? {
        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.3)",
        scale: 1.05
      } : {
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        scale: 1
      }}
      transition={{ duration: 0.2 }}
    >
      {/* 상태 표시 및 펄스 효과 */}
      {isHighlighted && (
        <motion.div
          className="absolute -inset-1 rounded-xl bg-blue-500 opacity-20"
          animate={{
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.02, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <StatusIcon status={server.status} />
          <h3 className="font-semibold text-gray-800 text-sm truncate">
            {server.name}
          </h3>
        </div>
        <div className="text-xs text-gray-500 font-mono">
          {server.uptime}d
        </div>
      </div>

      {/* 서버 정보 */}
      <div className="flex items-center justify-between mb-3 text-xs text-gray-600">
        <span className="flex items-center space-x-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
          <span>{server.type}</span>
        </span>
        <span>{server.location}</span>
      </div>

      {/* 메트릭 */}
      <div className="space-y-3">
        {/* CPU */}
        <div className="flex items-center space-x-3">
          <Cpu className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-600">CPU</span>
              <span className="text-xs font-semibold text-gray-800">
                {server.metrics.cpu}%
              </span>
            </div>
            <MetricBar 
              value={server.metrics.cpu} 
              color={getMetricColor(server.metrics.cpu)} 
            />
          </div>
        </div>

        {/* Memory */}
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 bg-gray-500 rounded-sm flex-shrink-0"></div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-600">Memory</span>
              <span className="text-xs font-semibold text-gray-800">
                {server.metrics.memory}%
              </span>
            </div>
            <MetricBar 
              value={server.metrics.memory} 
              color={getMetricColor(server.metrics.memory)} 
            />
          </div>
        </div>

        {/* Disk */}
        <div className="flex items-center space-x-3">
          <HardDrive className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-600">Disk</span>
              <span className="text-xs font-semibold text-gray-800">
                {server.metrics.disk}%
              </span>
            </div>
            <MetricBar 
              value={server.metrics.disk} 
              color={getMetricColor(server.metrics.disk)} 
            />
          </div>
        </div>

        {/* Network */}
        <div className="flex items-center space-x-3">
          <Wifi className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-600">Network</span>
              <span className="text-xs font-semibold text-gray-800">
                {server.metrics.network}%
              </span>
            </div>
            <MetricBar 
              value={server.metrics.network} 
              color={getMetricColor(server.metrics.network)} 
            />
          </div>
        </div>
      </div>

      {/* 마지막 업데이트 */}
      <div className="mt-3 pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          {server.lastUpdate.toLocaleTimeString()}
        </div>
      </div>
    </motion.div>
  );
} 