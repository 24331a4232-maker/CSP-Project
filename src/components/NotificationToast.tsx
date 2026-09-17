import React, { useEffect } from 'react';
import { CheckCircle2, Sparkles, X } from 'lucide-react';

interface NotificationToastProps {
  message: string | null;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 bg-gradient-to-r from-emerald-900 to-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-400/40 flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
      <div className="w-8 h-8 rounded-full bg-[#22C55E] text-white flex items-center justify-center shrink-0 shadow-md">
        <CheckCircle2 className="w-5 h-5" />
      </div>
      <div>
        <p className="font-bold text-xs text-emerald-300">Rescue System Notification</p>
        <p className="text-xs text-gray-100 font-medium">{message}</p>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-white p-1 ml-2">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
