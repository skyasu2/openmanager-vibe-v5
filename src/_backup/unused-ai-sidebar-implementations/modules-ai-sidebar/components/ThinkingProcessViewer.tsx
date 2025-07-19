import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ThinkingFlow,
  LogicStep,
  ReActStep,
} from '../../ai-agent/core/LangGraphThinkingProcessor';
import {
  Loader,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  BrainCircuit,
  Search,
  Database,
  MessageSquare,
} from 'lucide-react';

const stepIconMapping: { [key: string]: React.ElementType } = {
  thought: BrainCircuit,
  observation: Search,
  action: Database,
  answer: MessageSquare,
  default: BrainCircuit,
};

const statusIconMapping = {
  processing: <Loader className='h-4 w-4 animate-spin text-blue-500' />,
  completed: <CheckCircle className='h-4 w-4 text-green-500' />,
  error: <AlertTriangle className='h-4 w-4 text-red-500' />,
};

const ReActStepView: React.FC<{ step: ReActStep }> = ({ step }) => {
  const Icon = stepIconMapping[step.type] || stepIconMapping.default;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className='ml-4 pl-4 border-l border-gray-200 dark:border-gray-700 text-xs'
    >
      <div className='flex items-center gap-2 text-gray-500 dark:text-gray-400'>
        <Icon className='h-3 w-3' />
        <span>{step.content}</span>
      </div>
    </motion.div>
  );
};

const LogicStepView: React.FC<{ step: LogicStep }> = ({ step }) => {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className='bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2'
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='w-full flex items-center justify-between text-left text-sm font-medium'
      >
        <div className='flex items-center gap-2'>
          {statusIconMapping[step.status as keyof typeof statusIconMapping] ||
            null}
          <span>{step.title}</span>
          <span className='text-gray-400 dark:text-gray-500 text-xs'>
            ({step.duration?.toFixed(0)}ms)
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className='h-4 w-4' />
        ) : (
          <ChevronRight className='h-4 w-4' />
        )}
      </button>
      <AnimatePresence>
        {isOpen && step.react_steps && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='pt-2 space-y-1'
          >
            {step.react_steps.map((reactStep, index) => (
              <ReActStepView key={index} step={reactStep} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const ThinkingProcessViewer: React.FC<{
  thinkingFlow: ThinkingFlow | null;
}> = ({ thinkingFlow }) => {
  if (!thinkingFlow) return null;

  return (
    <div className='p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700'>
      <div className='flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200'>
        <BrainCircuit className='h-5 w-5 text-purple-500' />
        <span>AI가 생각하는 중...</span>
      </div>
      <div className='space-y-2'>
        {thinkingFlow.logic_steps.map(step => (
          <LogicStepView key={step.id} step={step} />
        ))}
      </div>
    </div>
  );
};
