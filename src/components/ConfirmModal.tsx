import React from 'react';
import { AlertTriangle, Trash2, RotateCcw, X, ShieldAlert } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  iconType?: 'delete' | 'restore' | 'warning';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Evet, Onayla',
  cancelText = 'İptal',
  variant = 'danger',
  iconType = 'delete',
}) => {
  if (!isOpen) return null;

  const getHeaderIcon = () => {
    switch (iconType) {
      case 'restore':
        return <RotateCcw className="w-6 h-6 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-400" />;
      case 'delete':
      default:
        return <Trash2 className="w-6 h-6 text-rose-400" />;
    }
  };

  const getButtonBg = () => {
    switch (variant) {
      case 'warning':
        return 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-950/40';
      case 'info':
        return 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/40';
      case 'danger':
      default:
        return 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-950/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden my-auto text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${
              variant === 'info'
                ? 'bg-emerald-500/20 border-emerald-500/30'
                : variant === 'warning'
                ? 'bg-amber-500/20 border-amber-500/30'
                : 'bg-rose-500/20 border-rose-500/30'
            }`}>
              {getHeaderIcon()}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {title}
              </h3>
              <p className="text-[11px] text-slate-400">
                Sarkuysan A.Ş. İşlem Onayı
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-200 leading-relaxed">
            {message}
          </div>

          {variant === 'danger' && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Geri dönüşüm kutusundan silinen kayıtlar kalıcı olarak yok edilir.</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all cursor-pointer hover:scale-[1.02] ${getButtonBg()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
