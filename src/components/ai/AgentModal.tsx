'use client';

import AIAssistantModal from './AIAssistantModal';

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AgentModal({ isOpen, onClose }: AgentModalProps) {
  return (
    <AIAssistantModal 
      isOpen={isOpen} 
      onClose={onClose} 
    />
  );
} 