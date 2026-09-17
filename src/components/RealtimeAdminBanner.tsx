import React from 'react';
import { ShieldCheck, Radio, RefreshCw, Filter, CheckCircle2, AlertCircle } from 'lucide-react';

interface RealtimeAdminBannerProps {
  showAdminOnly: boolean;
  onToggleAdminOnly: (val: boolean) => void;
  adminUpdatedCount: number;
  totalCount: number;
  realtimeConnected: boolean;
  lastSyncTime: string;
}

export const RealtimeAdminBanner: React.FC<RealtimeAdminBannerProps> = ({
  showAdminOnly,
  onToggleAdminOnly,
  adminUpdatedCount,
  totalCount,
  realtimeConnected,
  lastSyncTime
}) => {
  return (
    <div className="sticky top-20 z-20 w-full bg-slate-900/95 backdrop-blur-md text-white border-b border-emerald-500/30 py-2.5 px-4 sm:px-6 shadow-md transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Left: Real-time Connection Status */}
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="flex items-center gap-2">
            <span className="font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Real-Time Feed
            </span>
            <span className="text-gray-400 hidden md:inline">|</span>
            <span className="text-gray-300 font-medium hidden md:inline">
              Firestore Sync: <span className="text-white font-semibold">{realtimeConnected ? 'Connected' : 'Reconnecting...'}</span>
            </span>
            {lastSyncTime && (
              <span className="text-gray-400 text-[11px] hidden lg:inline">
                (Last event: {lastSyncTime})
              </span>
            )}
          </div>
        </div>

        {/* Middle & Right: Admin Filter Toggle */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          
          <div className="flex items-center gap-2">
            <span className="text-gray-300 font-medium text-[11px] hidden sm:inline">
              Data Filter:
            </span>
            <div className="inline-flex bg-slate-800 p-0.5 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => onToggleAdminOnly(true)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  showAdminOnly
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin-Updated Only ({adminUpdatedCount})</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleAdminOnly(false)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  !showAdminOnly
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>All Live Data ({totalCount})</span>
              </button>
            </div>
          </div>

          {showAdminOnly && (
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md whitespace-nowrap">
              Active: Admin Real-Time Only
            </span>
          )}

        </div>

      </div>
    </div>
  );
};
