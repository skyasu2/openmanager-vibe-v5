'use client';

// import AIAssistantModal from './AIAssistantModal';
import AIAgentModal from './modal-v2/AIAgentModal';
import './modal-v2/styles.css';

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AgentModal({ isOpen, onClose }: AgentModalProps) {
  return (
    <AIAgentModal 
      isOpen={isOpen} 
      onClose={onClose} 
    />
  );
} 