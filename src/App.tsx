/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DatabaseProvider, useDatabase } from './context/DatabaseContext';
import { Header } from './components/Header';
import { PurchaseDesk } from './components/PurchaseDesk';
import { AdminPanel } from './components/AdminPanel';
import { ShoppingBag, Layers, RefreshCw, Wifi, WifiOff } from 'lucide-react';


function MainApp() {
  const [view, setView] = useState<'desk' | 'admin'>('desk');
  const { isOnline, purchases, isSyncing, triggerManualSync } = useDatabase();

  const unsyncedCount = purchases.filter((p) => !p.isSynced).length;

  const handleSyncClick = async () => {
    if (isOnline && unsyncedCount > 0) {
      const synced = await triggerManualSync();
      alert(`已成功同步 ${synced} 筆離線紀錄至雲端！`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex antialiased">
      {/* Sidebar - Persistent on desktop, styled to the theme */}
      <aside className="w-64 bg-slate-900 flex-col shrink-0 min-h-screen hidden md:flex sticky top-0 h-screen border-r border-slate-800">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-white font-display">
              P
            </div>
            <h1 className="text-white font-bold tracking-tight text-base">花生溯源系統</h1>
          </div>
        </div>
        
        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-2 space-y-1">
          <button
            onClick={() => setView('desk')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm duration-150 cursor-pointer ${
              view === 'desk'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span>收購管理控制台</span>
          </button>
          <button
            onClick={() => setView('admin')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm duration-150 cursor-pointer ${
              view === 'admin'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span>脫殼加工與後台</span>
          </button>
        </nav>

        {/* Sync & Connectivity Bottom Widget */}
        <div className="p-6 mt-auto">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/40">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">網路與雲端狀態</p>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-rose-500 animate-ping'}`} />
              <span className="text-xs text-slate-300 font-medium font-mono">
                {isOnline ? 'Firebase 線上連線' : '離線模式'}
              </span>
            </div>
            
            <div className="mt-3">
              {unsyncedCount > 0 ? (
                <button
                  onClick={handleSyncClick}
                  disabled={isSyncing || !isOnline}
                  className={`w-full flex items-center justify-center space-x-1.5 rounded-lg py-1.5 px-2 text-[11px] font-bold transition-all duration-150 ${
                    isOnline 
                      ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-900/10 cursor-pointer' 
                      : 'bg-slate-750 text-slate-500 cursor-not-allowed'
                  }`}
                  title="手動同步本地未上傳之數據"
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{unsyncedCount} 筆待同步數據</span>
                </button>
              ) : (
                <p className="text-[10px] text-slate-400 flex items-center justify-center py-1">
                  ✓ 本地資料已安全同步
                </p>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Real-time Dynamic Top Header */}
        <Header currentView={view} onChangeView={setView} />
        
        {/* Main Body Workspace Container */}
        <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="transition-all duration-300">
            {view === 'desk' ? (
              <PurchaseDesk />
            ) : (
              <AdminPanel />
            )}
          </div>
        </main>

        {/* Footer Credits */}
        <footer className="w-full py-6 mt-12 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 font-mono">
            <span>© 115 花生收購加工合夥體系</span>
            <span>離線沙盒存檔與溯源認證已啟動</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DatabaseProvider>
      <MainApp />
    </DatabaseProvider>
  );
}

