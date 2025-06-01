'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ModalAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
}

export interface ModalTemplateProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  actions?: ModalAction[];
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  loading?: boolean;
  centered?: boolean;
  scrollable?: boolean;
  animation?: 'scale' | 'slide' | 'fade';
}

const modalSizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4'
};

const variantConfig = {
  default: {
    icon: Info,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-100'
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-500',
    iconBg: 'bg-green-100'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    iconBg: 'bg-yellow-100'
  },
  error: {
    icon: AlertCircle,
    iconColor: 'text-red-500',
    iconBg: 'bg-red-100'
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-100'
  }
};

const animationVariants = {
  scale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  },
  slide: {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 }
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  }
};

export default function ModalTemplate({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  variant = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  actions = [],
  headerContent,
  footerContent,
  loading = false,
  centered = true,
  scrollable = true,
  animation = 'scale'
}: ModalTemplateProps) {

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onClose();
    }
  };

  const config = variantConfig[variant];
  const IconComponent = config.icon;
  const selectedAnimation = animationVariants[animation];

  const getButtonVariant = (actionVariant: string) => {
    switch (actionVariant) {
      case 'primary':
        return 'default';
      case 'danger':
        return 'destructive';
      case 'ghost':
        return 'ghost';
      default:
        return 'outline';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleOverlayClick}
          />

          {/* Modal Container */}
          <div className={`relative w-full ${modalSizes[size]} mx-4 ${centered ? 'my-auto' : 'mt-16'}`}>
            <motion.div
              {...selectedAnimation}
              transition={{ 
                type: "spring", 
                damping: 20, 
                stiffness: 300,
                duration: 0.3 
              }}
              className={`
                relative bg-white rounded-2xl shadow-2xl border border-gray-200
                ${scrollable ? 'max-h-[90vh] overflow-hidden flex flex-col' : ''}
              `}
            >
              {/* Loading Overlay */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl"
                  >
                    <div className="flex items-center gap-3 text-gray-600">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="font-medium">처리 중...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Header */}
              {(title || description || headerContent || showCloseButton) && (
                <div className="flex items-start justify-between p-6 border-b border-gray-200">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Variant Icon */}
                    {(title || description) && variant !== 'default' && (
                      <div className={`flex-shrink-0 w-10 h-10 ${config.iconBg} rounded-full flex items-center justify-center`}>
                        <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
                      </div>
                    )}

                    {/* Title & Description */}
                    <div className="flex-1 min-w-0">
                      {title && (
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                          {title}
                        </h2>
                      )}
                      {description && (
                        <p className="text-gray-600 leading-relaxed">
                          {description}
                        </p>
                      )}
                      {headerContent}
                    </div>
                  </div>

                  {/* Close Button */}
                  {showCloseButton && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={onClose}
                      className="flex-shrink-0 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors ml-4"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </motion.button>
                  )}
                </div>
              )}

              {/* Content */}
              {children && (
                <div className={`p-6 ${scrollable ? 'overflow-y-auto flex-1' : ''}`}>
                  {children}
                </div>
              )}

              {/* Footer */}
              {(actions.length > 0 || footerContent) && (
                <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50/50">
                  {/* Footer Content */}
                  <div className="flex-1">
                    {footerContent}
                  </div>

                  {/* Actions */}
                  {actions.length > 0 && (
                    <div className="flex items-center gap-3 ml-4">
                      {actions.map((action, index) => (
                        <Button
                          key={index}
                          variant={getButtonVariant(action.variant || 'secondary') as any}
                          size="sm"
                          onClick={action.onClick}
                          disabled={action.disabled || loading}
                          className="min-w-[80px]"
                        >
                          {action.loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            action.label
                          )}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Preset Modal Components
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "확인",
  description = "이 작업을 계속하시겠습니까?",
  confirmLabel = "확인",
  cancelLabel = "취소",
  variant = "warning",
  loading = false
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'warning' | 'error' | 'info';
  loading?: boolean;
}) {
  return (
    <ModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      variant={variant}
      size="sm"
      actions={[
        {
          label: cancelLabel,
          onClick: onClose,
          variant: 'ghost',
          disabled: loading
        },
        {
          label: confirmLabel,
          onClick: onConfirm,
          variant: variant === 'error' ? 'danger' : 'primary',
          loading
        }
      ]}
    />
  );
}

export function InfoModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  okLabel = "확인"
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  okLabel?: string;
}) {
  return (
    <ModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      variant="info"
      size="md"
      actions={[
        {
          label: okLabel,
          onClick: onClose,
          variant: 'primary'
        }
      ]}
    >
      {children}
    </ModalTemplate>
  );
}

export function FormModal({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = "저장",
  cancelLabel = "취소",
  loading = false,
  size = "lg"
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  size?: 'md' | 'lg' | 'xl';
}) {
  return (
    <ModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      scrollable
      actions={[
        {
          label: cancelLabel,
          onClick: onClose,
          variant: 'ghost',
          disabled: loading
        },
        {
          label: submitLabel,
          onClick: onSubmit,
          variant: 'primary',
          loading
        }
      ]}
    >
      {children}
    </ModalTemplate>
  );
} 