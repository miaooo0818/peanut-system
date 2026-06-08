/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Unlock, 
  Trash2, 
  Edit2, 
  Download, 
  Droplet, 
  TrendingUp, 
  Scale, 
  Grid,
  FileSpreadsheet,
  AlertTriangle,
  Check,
  Calendar,
  Layers,
  Archive,
  User,
  PlusCircle,
  Clock,
  X
} from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';
import { PurchaseRecord, ShellingBatch } from '../types';

export const AdminPanel: React.FC = () => {
  const { 
    purchases, 
    shellingBatches, 
    adminSetting, 
    addShellingBatch, 
    deleteShellingBatch,
    updatePurchase, 
    deletePurchase,
    setupAdminPassword, 
    verifyAdminPassword 
  } = useDatabase();

  // Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [setupFeedback, setSetupFeedback] = useState('');

  // Tab Manager State
  const [activeTab, setActiveTab] = useState<'inventory' | 'shelling' | 'reports'>('inventory');

  // Editing state for Purchases (Inline modal)
  const [editingPurchase, setEditingPurchase] = useState<PurchaseRecord | null>(null);
  const [editFarmerName, setEditFarmerName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editVariety, setEditVariety] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editTotalBags, setEditTotalBags] = useState<number>(0);
  const [editTotalWeightCatty, setEditTotalWeightCatty] = useState<number>(0);
  const [editStorageLocation, setEditStorageLocation] = useState('');

  // Shelling Form States
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [shellingDate, setShellingDate] = useState(new Date().toISOString().split('T')[0]);
  const [outputWeightKg, setOutputWeightKg] = useState<number | ''>('');
  const [moisture, setMoisture] = useState<number | ''>('');
  const [shellingFeedback, setShellingFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // ---------------- AUTHENTICATION GATES ----------------

  const handlePasswordSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupFeedback('');
    if (!newPassword) return setSetupFeedback('請輸入新密碼！');
    if (newPassword.length < 4) return setSetupFeedback('為了安全起見，密碼長度請至少填寫 4 碼！');
    if (newPassword !== confirmPassword) return setSetupFeedback('兩次輸入的密碼不一致！');

    try {
      await setupAdminPassword(newPassword);
      setSetupFeedback('密碼設定成功！已完成初次註冊。');
      setIsAuthenticated(true);
    } catch (err) {
      console.error(err);
      setSetupFeedback('密碼設定失敗，請確認資料庫狀態。');
    }
  };

  const handlePasswordVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!passwordInput) return setAuthError('請輸入密碼！');

    try {
      const isCorrect = await verifyAdminPassword(passwordInput);
      if (isCorrect) {
        setIsAuthenticated(true);
        setPasswordInput('');
      } else {
        setAuthError('密碼不正確，請再試一次！');
      }
    } catch (err) {
      console.error(err);
      setAuthError('驗證檢查中發生錯誤，請確認網頁連線。');
    }
  };

  if (!adminSetting) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl">
        <Clock className="h-8 w-8 text-amber-600 animate-spin mb-3" />
        <span className="text-sm text-slate-500 font-medium">載入管理者帳戶設定中...</span>
      </div>
    );
  }

  // First time entry check
  if (adminSetting.isConfigured === false) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="rounded-full bg-amber-50 p-3.5 text-amber-600">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">初次設定管理者密碼</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            系統偵測到您是第一次啟用此花生管理平台。請設定專屬登入密碼，之後進入此後台區塊皆需進行密碼確認。
          </p>
        </div>

        <form onSubmit={handlePasswordSetupSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">管理者密碼</label>
            <input
              id="new-password-input"
              type="password"
              placeholder="請輸入欲設定的密碼 (至少4碼)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">確認密碼</label>
            <input
              id="confirm-password-input"
              type="password"
              placeholder="請再次輸入密碼以資確認"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm outline-none focus:border-amber-500"
            />
          </div>

          {setupFeedback && (
            <div className="text-xs text-center p-2.5 rounded-lg bg-amber-50 border border-amber-100 text-amber-800 font-semibold">
              {setupFeedback}
            </div>
          )}

          <button
            id="register-password-btn"
            type="submit"
            className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 py-3 text-sm font-semibold text-white transition active:scale-[0.98]"
          >
            完成設定並進入後台
          </button>
        </form>
      </div>
    );
  }

  // Not authenticated check
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="rounded-full bg-slate-50 p-3.5 text-slate-600 border border-slate-100">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">後台管理區域驗證</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            此區塊包含花生收購歷史與代工脫殼的核心紀錄，請輸入核可密碼以利審閱。
          </p>
        </div>

        <form onSubmit={handlePasswordVerifySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">後台密碼管理驗證</label>
            <input
              id="verify-password-input"
              type="password"
              required
              placeholder="請輸入管理者密碼"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm outline-none focus:border-amber-500"
            />
          </div>

          {authError && (
            <div className="text-xs text-center p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-800 font-semibold animate-shake">
              {authError}
            </div>
          )}

          <button
            id="login-admin-btn"
            type="submit"
            className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 py-3 text-sm font-semibold text-white transition active:scale-[0.98]"
          >
            驗證並進入系統板塊
          </button>
        </form>
      </div>
    );
  }

  // ---------------- ADMIN PANEL CONTENT ----------------

  // Setup Edit Purchase handlers
  const handleEditOpen = (p: PurchaseRecord) => {
    setEditingPurchase(p);
    setEditFarmerName(p.farmerName);
    setEditLocation(p.location);
    setEditDate(p.date);
    setEditVariety(p.variety);
    setEditPrice(p.price);
    setEditTotalBags(p.totalBags);
    setEditTotalWeightCatty(p.totalWeightCatty);
    setEditStorageLocation(p.storageLocation);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPurchase) return;

    if (!editFarmerName.trim() || !editLocation.trim() || !editVariety.trim() || !editStorageLocation.trim() || editPrice <= 0 || editTotalBags <= 0 || editTotalWeightCatty <= 0) {
      alert("請確實填寫所有必要欄位與數值！");
      return;
    }

    try {
      await updatePurchase(editingPurchase.id, {
        farmerName: editFarmerName.trim(),
        location: editLocation.trim(),
        date: editDate,
        variety: editVariety.trim(),
        price: editPrice,
        totalBags: editTotalBags,
        totalWeightCatty: editTotalWeightCatty,
        storageLocation: editStorageLocation.trim()
      });
      setEditingPurchase(null);
      alert("收購紀錄修改成功！");
    } catch (err) {
      console.error(err);
      alert("修改失敗，請檢驗系統環境。");
    }
  };

  const handleDeletePurchaseClick = async (id: string, name: string) => {
    if (confirm(`確定要永久刪除農民「${name}」的收購紀錄嗎？這項動作無法復原。`)) {
      try {
        await deletePurchase(id);
        alert("該筆收購紀錄已成功移除。");
      } catch (err) {
        console.error(err);
        alert("刪除失敗。");
      }
    }
  };

  // Shelling logic calculations
  // Get all unique selected purchases objects
  const selectedPurchases = purchases.filter(p => selectedSourceIds.includes(p.id));
  
  // Total input weight in Taiwan catties (台斤)
  const totalInputCatty = selectedPurchases.reduce((acc, p) => acc + p.totalWeightCatty, 0);
  
  // Conversion formula: 1 台斤 = 0.6 公斤
  const totalInputKg = totalInputCatty * 0.6;

  // Recovery Rate / Yield Calculation (%)
  const calculatedRecoveryRate = typeof outputWeightKg === 'number' && outputWeightKg > 0 && totalInputKg > 0
    ? parseFloat(((outputWeightKg / totalInputKg) * 100).toFixed(2))
    : 0;

  // Toggle Source Batches selection
  const handleToggleSource = (id: string) => {
    setSelectedSourceIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllPurchases = () => {
    if (selectedSourceIds.length === purchases.length) {
      setSelectedSourceIds([]);
    } else {
      setSelectedSourceIds(purchases.map(p => p.id));
    }
  };

  const handleShellingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShellingFeedback(null);

    if (selectedSourceIds.length === 0) {
      return setShellingFeedback({ type: 'error', msg: '請勾選至少一筆花生來源貨源批次！' });
    }
    if (typeof outputWeightKg !== 'number' || outputWeightKg <= 0) {
      return setShellingFeedback({ type: 'error', msg: '請填寫正確的總產出重量（公斤）！' });
    }
    if (typeof moisture !== 'number' || moisture <= 0 || moisture > 100) {
      return setShellingFeedback({ type: 'error', msg: '請填寫合理的測量水分百分比 %（0.1 ~ 100）！' });
    }

    try {
      await addShellingBatch({
        date: shellingDate,
        sourceBatchIds: selectedSourceIds,
        outputWeightKg,
        recoveryRate: calculatedRecoveryRate,
        moisture
      });

      setShellingFeedback({
        type: 'success',
        msg: `成功登錄脫殼批次！累計消化 ${totalInputCatty.toLocaleString()} 台斤毛料。`
      });

      // Reset Form fields
      setSelectedSourceIds([]);
      setOutputWeightKg('');
      setMoisture('');
    } catch (err) {
      console.error(err);
      setShellingFeedback({ type: 'error', msg: '儲存脫殼紀錄失敗，請檢查網路。' });
    }
  };

  const handleDeleteShellingClick = async (id: string) => {
    if (confirm("確認刪除該筆脫殼批次報告？這會將加工紀錄自資料庫完全抹去。")) {
      try {
        await deleteShellingBatch(id);
        alert("已成功移除該代工脫殼報告。");
      } catch (err) {
        console.error(err);
        alert("移除失敗。");
      }
    }
  };

  // Export Shelling Batch to two separate CSV files (simulating worksheets)
  const handleExportCSV = (batch: ShellingBatch) => {
    // Collect related sources details
    const relatedSources = purchases.filter(p => batch.sourceBatchIds.includes(p.id));
    
    // Total raw catty weight in this batch
    const rawCattySum = relatedSources.reduce((sum, p) => sum + p.totalWeightCatty, 0);
    const rawKgSum = rawCattySum * 0.6;

    // Calculate Purchase Cost Statistics
    const totalCost = relatedSources.reduce((sum, p) => sum + (p.price * p.totalWeightCatty), 0);
    const avgPrice = rawCattySum > 0 ? totalCost / rawCattySum : 0;
    const rawMaterialCostPerFinishedKg = batch.outputWeightKg > 0 ? totalCost / batch.outputWeightKg : 0;

    // 1. Generate Shelling Work Sheet (脫殼作業報表)
    const shellingHeaders = [
      "報表類型", "加工批號(Batch ID)", "代工脫殼日期", "加工品項說明", 
      "進料總重(台斤)", "進料公制重(公斤)", "脫殼出產重量(公斤)", 
      "出肉率(成品率%)", "測量水分(%)", "合計毛料收購成本(元)", 
      "成品每公斤原料收購成本(元/公斤)", "成品存放倉儲"
    ];
    const shellingRow = [
      "脫殼作業報表", batch.id, batch.date, "多來源混合/合夥代工加工", 
      rawCattySum.toFixed(1), rawKgSum.toFixed(1), batch.outputWeightKg.toFixed(1), 
      `${batch.recoveryRate}%`, `${batch.moisture}%`, totalCost.toFixed(0), 
      rawMaterialCostPerFinishedKg.toFixed(2), "脫殼完成出口倉"
    ];
    const shellingCSVContent = "\uFEFF" + [shellingHeaders.join(","), shellingRow.join(",")].join("\n");

    // 2. Generate Purchases Work Sheet (收購報表)
    const purchaseHeaders = [
      "報表類型", "收購紀錄ID", "日期", "農民/烘乾地", 
      "物資品種", "收購單價(元/台斤)", "進料重量(台斤)", "合計收購成本(元)", "存放庫房地點"
    ];
    const purchaseRows = relatedSources.map((p, idx) => {
      const pCost = p.price * p.totalWeightCatty;
      return [
        `收購報表_來源#${idx+1}`, p.id, p.date, p.farmerName, 
        p.variety, p.price.toString(), p.totalWeightCatty.toString(), pCost.toFixed(0), 
        p.storageLocation
      ].join(",");
    });
    const purchaseCSVContent = "\uFEFF" + [purchaseHeaders.join(","), ...purchaseRows].join("\n");

    // Helper to download a single file blob
    const downloadBlob = (content: string, filename: string) => {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    // Download both files sequentially
    downloadBlob(shellingCSVContent, `1_脫殼作業報表_${batch.date}_${batch.id.substring(0, 6)}.csv`);
    
    // Brief timeout to avoid browser popup/multi-download block issues
    setTimeout(() => {
      downloadBlob(purchaseCSVContent, `2_收購報表_對應脫殼批號_${batch.id.substring(0, 6)}.csv`);
    }, 250);
  };

  const getMoistureBadge = (m: number) => {
    if (m <= 10) {
      return (
        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-100">
          🟢 {m}% (乾燥合格)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
          🟡 {m}% (偏濕需烘乾)
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Visual Admin Tabs header */}
      <div className="flex border-b border-slate-200">
        <button
          id="tab-inventory-btn"
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-semibold text-sm transition-all focus:outline-none ${
            activeTab === 'inventory'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Edit2 className="h-4 w-4" />
          <span>收購紀錄編輯</span>
        </button>
        <button
          id="tab-shelling-btn"
          onClick={() => setActiveTab('shelling')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-semibold text-sm transition-all focus:outline-none ${
            activeTab === 'shelling'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Archive className="h-4 w-4" />
          <span>脫殼代工登錄</span>
        </button>
        <button
          id="tab-reports-btn"
          onClick={() => setActiveTab('reports')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-semibold text-sm transition-all focus:outline-none ${
            activeTab === 'reports'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>加工批次報告</span>
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      <div>
        
        {/* =============== Tab 1: EDIT PURCHASES (INVENTORY) =============== */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-800">花生原始採購紀錄總覽</h3>
                <p className="text-xs text-slate-500">管理者在此可以修改或移除農民前期繳交的花生資料，並與前端自動同步。</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-xs text-slate-600 uppercase tracking-widest font-mono">
                    <th className="py-3 px-4">農民資訊</th>
                    <th className="py-3 px-4">收購地點</th>
                    <th className="py-3 px-4">花生規格</th>
                    <th className="py-3 px-4">存放地點</th>
                    <th className="py-3 px-4 text-right">單價</th>
                    <th className="py-3 px-4 text-right">估值總額</th>
                    <th className="py-3 px-4 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {purchases.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                        目前尚無任何收購紀錄，請先至收購前台登錄。
                      </td>
                    </tr>
                  ) : (
                    purchases.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{p.farmerName}</div>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="text-[10px] font-mono bg-amber-50 px-1 border border-amber-100 text-amber-700 rounded">
                              {p.variety}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{p.date}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-normal text-slate-600">{p.location}</td>
                        <td className="py-3 px-4 font-mono text-xs">
                          {p.totalBags} 包 / <span className="font-semibold">{p.totalWeightCatty.toLocaleString()} 台斤</span>
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold text-slate-600">{p.storageLocation}</td>
                        <td className="py-3 px-4 text-right font-mono text-xs">${p.price} / 斤</td>
                        <td className="py-3 px-4 text-right font-bold font-mono text-xs text-amber-600">
                          ${(p.price * p.totalWeightCatty).toLocaleString()} 元
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEditOpen(p)}
                              className="p-1 px-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition flex items-center space-x-1 hover:text-amber-700"
                              title="編輯此筆紀錄"
                            >
                              <Edit2 className="h-3 w-3" />
                              <span>修改</span>
                            </button>
                            <button
                              onClick={() => handleDeletePurchaseClick(p.id, p.farmerName)}
                              className="p-1 px-2 rounded-lg border border-rose-100 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition flex items-center space-x-1"
                              title="刪除此筆紀錄"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>刪除</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =============== Tab 2: NEW SHELLING BATCH =============== */}
        {activeTab === 'shelling' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Step A: Multi-select source records from Inventory (Left Column) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">1. 選取本次加工使用的花生貨源</h3>
                  <p className="text-xs text-slate-400 mt-0.5">可勾選多批不同農民、不同存放區的花生毛料混合脫殼。</p>
                </div>
                {purchases.length > 0 && (
                  <button
                    onClick={handleSelectAllPurchases}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800"
                  >
                    {selectedSourceIds.length === purchases.length ? '取消全選' : '全選全部'}
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2">
                {purchases.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    請先至前台登錄收購數據，方可進行脫殼混料。
                  </div>
                ) : (
                  purchases.map((p) => {
                    const isChecked = selectedSourceIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleToggleSource(p.id)}
                        className={`p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                          isChecked 
                            ? 'border-amber-400 bg-amber-50/30' 
                            : 'border-slate-150 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {/* Custom Checkbox */}
                          <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-colors ${
                            isChecked ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>

                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-sm font-bold text-slate-800">{p.farmerName}</span>
                              <span className="text-[10px] bg-slate-100 border border-slate-200 px-1 text-slate-600 rounded">
                                {p.variety}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                              存放於: {p.storageLocation} | 收購日: {p.date}
                            </span>
                          </div>
                        </div>

                        {/* Weight in taiwan catty label */}
                        <div className="text-right">
                          <span className="text-sm font-semibold text-slate-700 block font-mono">{p.totalWeightCatty.toLocaleString()} 台斤</span>
                          <span className="text-[10px] text-slate-400 font-mono">約 {p.totalBags} 包</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Step B: Fill processing values and submit (Right Column) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">2. 本批脫殼產出與品質回報</h3>
                <p className="text-xs text-slate-400 mt-0.5">系統將自動彙總來源總重量，並試算最終肉比產出率（成品率）。</p>
              </div>

              {/* Dynamic conversion board */}
              <div className="rounded-xl border border-amber-100 bg-amber-50/20 p-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">已勾選貨源：</span>
                  <span className="font-bold text-amber-700">{selectedSourceIds.length} 批</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">進料總重（台斤）：</span>
                  <span className="font-bold text-slate-800 font-mono text-sm">{totalInputCatty.toLocaleString()} 台斤</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-amber-100 pt-2">
                  <span className="font-semibold text-amber-800/90">試算公制總重（公斤）：</span>
                  <span className="font-black text-amber-700 font-mono text-base">
                    {totalInputKg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg
                  </span>
                </div>
                <span className="text-[10px] text-amber-700/70 block text-right font-semibold">
                  * 換算標準: 1 台斤等同 0.6 公斤 (kg)
                </span>
              </div>

              <form onSubmit={handleShellingSubmit} className="space-y-4">
                {/* Shelling Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">代工脫殼日期</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Calendar className="h-4 w-4" />
                    </span>
                    <input
                      id="shelling-date-input"
                      type="date"
                      required
                      value={shellingDate}
                      onChange={(e) => setShellingDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Processing output values */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 label-required">
                      出產總重量 <span className="text-[10px] font-normal text-slate-400">(公斤)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Scale className="h-4 w-4" />
                      </span>
                      <input
                        id="output-weight-input"
                        type="number"
                        min="1"
                        required
                        value={outputWeightKg}
                        onChange={(e) => setOutputWeightKg(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="例如: 5040"
                        className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 label-required">
                      測量水分含量 <span className="text-[10px] font-normal text-slate-400">(%)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Droplet className="h-4 w-4 text-indigo-500" />
                      </span>
                      <input
                        id="moisture-input"
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="100"
                        required
                        value={moisture}
                        onChange={(e) => setMoisture(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="例如: 9.2"
                        className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Recovery Rate live feedback panel */}
                {calculatedRecoveryRate > 0 && (
                  <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-3.5 flex justify-between items-center">
                    <span className="text-xs font-semibold text-sky-800 flex items-center">
                      <TrendingUp className="mr-1.5 h-4 w-4 text-sky-600" />
                      當前成品出肉率
                    </span>
                    <span className="text-lg font-black text-sky-700 font-mono">
                      {calculatedRecoveryRate} %
                    </span>
                  </div>
                )}

                {/* Submitting Feedback indicator */}
                {shellingFeedback && (
                  <div className={`p-3 rounded-xl border text-xs text-center font-medium ${
                    shellingFeedback.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                      : 'bg-rose-50 text-rose-800 border-rose-100'
                  }`}>
                    {shellingFeedback.msg}
                  </div>
                )}

                {/* CTA Submit Button */}
                <button
                  id="submit-shelling-btn"
                  type="submit"
                  className="w-full flex items-center justify-center space-x-2 rounded-xl bg-amber-600 hover:bg-amber-700 py-3 text-sm font-semibold text-white shadow-sm transition duration-300 active:scale-[0.98]"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>儲存並建檔此脫殼批次</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* =============== Tab 3: HISTORICAL BATCH REPORTS =============== */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-800">花生加工脫殼生產批次報告</h3>
              <p className="text-xs text-slate-500">歷史紀錄彙整，您在此處可以審閱成品轉化轉換明細，並打包匯出 CSV 試算表。</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-xs text-slate-600 uppercase tracking-widest font-mono">
                    <th className="py-3 px-4">批號 / 脫殼日期</th>
                    <th className="py-3 px-4">使用貨源歷史明細</th>
                    <th className="py-3 px-4 text-right">進料原料估算 (公斤)</th>
                    <th className="py-3 px-4 text-right">脫殼出產重量</th>
                    <th className="py-3 px-4 text-center">出肉率 (成品率)</th>
                    <th className="py-3 px-4 text-center">水分含量 (%)</th>
                    <th className="py-3 px-4 text-center">明細匯出與管理</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {shellingBatches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                        尚無任何代工加工脫殼報告，請前往上方「脫殼代工登錄」頁籤操作。
                      </td>
                    </tr>
                  ) : (
                    shellingBatches.map((b) => {
                      // Match referenced sources from local state
                      const relatedSources = purchases.filter(p => b.sourceBatchIds.includes(p.id));
                      const combinedCatty = relatedSources.reduce((sum, p) => sum + p.totalWeightCatty, 0);
                      const combinedKg = combinedCatty * 0.6;

                      return (
                        <tr key={b.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-4 px-4">
                            <span className="font-bold text-slate-800 block text-xs font-mono">{b.id}</span>
                            <span className="text-[11px] text-slate-400 font-mono mt-1 block">{b.date}</span>
                          </td>
                          <td className="py-4 px-4 max-w-xs">
                            <div className="flex flex-wrap gap-1.5">
                              {relatedSources.length === 0 ? (
                                <span className="text-xs text-rose-500 font-medium">使用來源已遭到刪除</span>
                              ) : (
                                relatedSources.map((p) => (
                                  <span key={p.id} className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700 font-medium border border-amber-100">
                                    {p.farmerName} ({p.variety})
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right font-mono text-xs">
                            <span className="font-semibold text-slate-600">{combinedCatty.toLocaleString()} 斤</span>
                            <span className="text-[10px] text-slate-400 block">({combinedKg.toLocaleString()} 公斤)</span>
                          </td>
                          <td className="py-4 px-4 text-right font-bold text-slate-800 font-mono">
                            {b.outputWeightKg.toLocaleString()} 公斤
                          </td>
                          <td className="py-4 px-4 text-center font-bold text-sky-700 font-mono">
                            {b.recoveryRate}%
                          </td>
                          <td className="py-4 px-4 text-center">
                            {getMoistureBadge(b.moisture)}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleExportCSV(b)}
                                className="p-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition flex items-center space-x-1"
                                title="打包成 CSV 表格下載"
                              >
                                <Download className="h-3 w-3 text-slate-500" />
                                <span>CSV 匯出</span>
                              </button>
                              <button
                                onClick={() => handleDeleteShellingClick(b.id)}
                                className="p-1.5 rounded-lg hover:bg-rose-50 border border-slate-100 text-rose-600 hover:border-rose-100"
                                title="刪除本報告"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* EDIT EXTRAS MODAL COMPONENT (FOR TAB 1 PURCHASES EDIT) */}
      <AnimatePresence>
        {editingPurchase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800 flex items-center">
                  <Edit2 className="h-5 w-5 text-amber-600 mr-2" />
                  修改收購前台資料 (唯讀防呆修改)
                </h3>
                <button
                  onClick={() => setEditingPurchase(null)}
                  className="rounded-lg hover:bg-slate-100 p-1.5 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleEditSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">農民名字</label>
                    <input
                      id="edit-farmer-input"
                      type="text"
                      required
                      value={editFarmerName}
                      onChange={(e) => setEditFarmerName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-2 px-3 text-sm outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">花生品種</label>
                    <input
                      id="edit-variety-input"
                      type="text"
                      required
                      value={editVariety}
                      onChange={(e) => setEditVariety(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-2 px-3 text-sm outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">收購日期</label>
                    <input
                      id="edit-date-input"
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-2 px-3 text-sm outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">收購地點</label>
                    <input
                      id="edit-location-input"
                      type="text"
                      required
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-2 px-3 text-sm outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">單價 (元/台斤)</label>
                    <input
                      id="edit-price-input"
                      type="number"
                      step="0.01"
                      required
                      value={editPrice}
                      onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-xl border border-slate-200 py-2 px-3 text-sm outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">數量 (包)</label>
                    <input
                      id="edit-bags-input"
                      type="number"
                      required
                      value={editTotalBags}
                      onChange={(e) => setEditTotalBags(parseInt(e.target.value) || 0)}
                      className="w-full rounded-xl border border-slate-200 py-2 px-3 text-sm outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">總重量 (台斤)</label>
                    <input
                      id="edit-weight-input"
                      type="number"
                      required
                      value={editTotalWeightCatty}
                      onChange={(e) => setEditTotalWeightCatty(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-xl border border-slate-200 py-2 px-3 text-sm outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">存放地點</label>
                  <input
                    id="edit-storage-input"
                    type="text"
                    required
                    value={editStorageLocation}
                    onChange={(e) => setEditStorageLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-2 px-3 text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex space-x-3 pt-4 justify-end border-t border-slate-100">
                  <button
                    type="submit"
                    className="rounded-xl bg-amber-600 hover:bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.01]"
                  >
                    存入資料庫
                  </button>
                  <button
                    onClick={() => setEditingPurchase(null)}
                    type="button"
                    className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-600 transition"
                  >
                    取消
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
