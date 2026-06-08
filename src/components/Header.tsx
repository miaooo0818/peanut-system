/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Cloud, CloudOff, RefreshCw, Layers, ShoppingBag } from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';

interface HeaderProps {
  currentView: 'desk' | 'admin';
  onChangeView: (view: 'desk' | 'admin') => void;
}


export const Header: React.FC<HeaderProps> = ({ currentView, onChangeView }) => {
  const { isOnline, purchases, triggerManualSync, isSyncing } = useDatabase();

  const unsyncedCount = purchases.filter((p) => !p.isSynced).length;

  const handleSyncClick = async () => {
    if (isOnline && unsyncedCount > 0) {
      const synced = await triggerManualSync();
      alert(`已成功同步 ${synced} 筆離線紀錄至雲端！`);
    }
  };

  // Human-readable current date formatted beautifully
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    weekday: 'long' 
  };
  const formattedDate = today.toLocaleDateString('zh-TW', options);

  return (
    <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-40 shadow-sm">
      {/* Dynamic View-based Titles */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white shadow-md shadow-amber-500/10 shrink-0">
          <span className="text-base font-bold font-display">P</span>
        </div>
        <div className="text-left">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
            {currentView === 'desk' ? '當日收購與建檔總表' : '花生加工與統計管理後台'}
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {formattedDate}
          </p>
        </div>
      </div>

      {/* Right Controls & Offline Sync & Mobile Nav tabs */}
      <div className="flex flex-wrap items-center justify-end gap-3 w-full sm:w-auto">
        
        {/* Connection status on Header (Highly visible on all screens) */}
        <div className="flex items-center space-x-2 rounded-full bg-slate-50 px-3 py-1.5 border border-slate-100">
          {isOnline ? (
            <span className="flex items-center text-xs text-emerald-600 font-medium">
              <Cloud className="mr-1 h-3.5 w-3.5" />
              <span>線上串聯</span>
            </span>
          ) : (
            <span className="flex items-center text-xs text-rose-500 font-medium animate-pulse">
              <CloudOff className="mr-1 h-3.5 w-3.5" />
              <span>離線模式</span>
            </span>
          )}

          {unsyncedCount > 0 && (
            <button
              onClick={handleSyncClick}
              disabled={isSyncing || !isOnline}
              className={`flex items-center space-x-1 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-all duration-150 ${
                isOnline 
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-600 hover:text-white cursor-pointer shadow-sm' 
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
              title="點擊進行手動資料同步"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{unsyncedCount} 筆待同步</span>
            </button>
          )}
        </div>

        {/* Mobile-only Navigation Tabs switcher */}
        <nav className="flex items-center rounded-xl bg-slate-100 p-1 md:hidden border border-slate-200/50">
          <button
            onClick={() => onChangeView('desk')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
              currentView === 'desk'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>收購前台</span>
          </button>
          <button
            onClick={() => onChangeView('admin')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
              currentView === 'admin'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>管理後台</span>
          </button>
        </nav>

      </div>
    </header>
  );
};

