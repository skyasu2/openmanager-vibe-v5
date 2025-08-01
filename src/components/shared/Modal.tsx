'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm'
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className='relative bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl'
            onClick={e => e.stopPropagation()}
          >
            <div className='flex items-center justify-between p-4 border-b border-slate-700'>
              <h3 className='text-lg font-semibold text-white'>{title}</h3>
              <button
                onClick={onClose}
                className='text-slate-400 hover:text-white transition-colors rounded-full p-1'
                aria-label='Close modal'
              >
                <X className='h-5 w-5' />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
