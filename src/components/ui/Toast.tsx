import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-400" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'border-l-4 border-emerald-400';
      case 'error':
        return 'border-l-4 border-red-500';
      case 'warning':
        return 'border-l-4 border-amber-400';
    }
  };

  return (
    <div className={`glass-menu flex items-center justify-between p-4 rounded-xl ${getStyles()} min-w-[320px] max-w-md animate-slide-in`}>
      <div className="flex items-center space-x-3">
        {getIcon()}
        <p className="text-sm font-medium text-white">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="ml-4 text-white/50 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
