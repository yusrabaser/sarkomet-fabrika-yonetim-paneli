import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastState {
  message: string;
  type: 'success' | 'danger' | 'info';
}

interface ToastNotificationProps {
  toast: ToastState | null;
  onClose: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isDanger = toast.type === 'danger';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-md">
      <div
        className={`p-4 rounded-xl border shadow-2xl flex items-center justify-between space-x-3 backdrop-blur-md ${
          isSuccess
            ? 'bg-slate-900/95 border-emerald-500/50 text-emerald-300'
            : isDanger
            ? 'bg-slate-900/95 border-rose-500/50 text-rose-300'
            : 'bg-slate-900/95 border-amber-500/50 text-amber-300'
        }`}
      >
        <div className="flex items-center space-x-3">
          {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
          {isDanger && <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
          {!isSuccess && !isDanger && <Info className="w-5 h-5 text-amber-400 flex-shrink-0" />}
          <p className="text-xs sm:text-sm font-semibold text-slate-100">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
