/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
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
  HelpCircle,
  CheckCircle,
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
    verifyAdminPassword,
    varieties,
    storageLocations,
    updateOptions
  } = useDatabase();

  // Authentication States
  const [isAuthenticated, setIsAuthenticated ] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [setupFeedback, setSetupFeedback] = useState('');

  // Tab Manager State
  const [activeTab, setActiveTab] = useState<'inventory' | 'shelling' | 'reports' | 'options'>('inventory');

  // Editing state for Purchases (Inline modal)
  const [editingPurchase, setEditingPurchase] = useState<PurchaseRecord | null>(null);
  const [editFarmerName, setEditFarmerName] = useState('');
  const [editIsResume, setEditIsResume] = useState(false);
  const [editLocation, setEditLocation] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editVariety, setEditVariety] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editTotalBags, setEditTotalBags] = useState<number>(0);
  const [editTotalWeightCatty, setEditTotalWeightCatty] = useState<number>(0);
  const [editStorageLocation, setEditStorageLocation] = useState('');

  // Selections Panel State (Settings Tab)
  const [newVariety, setNewVariety] = useState('');
  const [newStorageLocation, setNewStorageLocation] = useState('');

  // Shelling Form States
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [selectedBags, setSelectedBags] = useState<Record<string, number>>({});
  const [shellingDate, setShellingDate] = useState(new Date().toISOString().split('T')[0]);
  const [outputWeightKg, setOutputWeightKg] = useState<number | ''>('');
  const [moisture, setMoisture] = useState<number | ''>('');
  const [shellingFeedback, setShellingFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // Export Date Range States
  const [exportStartDate, setExportStartDate] = useState(() => {
    const d = new Date();
    // Default to 1st of current month
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [exportEndDate, setExportEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Custom Modal (Dialog & Confirmation) States
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm' | 'success';
    title: string;
    message: string;
    onConfirm?: () => Promise<void> | void;
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    onConfirm: undefined
  });

  const showCustomAlert = (title: string, message: string, type: 'alert' | 'success' = 'alert') => {
    setModalConfig({
      isOpen: true,
      type,
      title,
      message,
      onConfirm: undefined
    });
  };

  const showCustomConfirm = (title: string, message: string, onConfirm: () => Promise<void> | void) => {
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      onConfirm
    });
  };

  const closeCustomModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

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
    setEditIsResume(!!p.isResume);
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
        isResume: editIsResume,
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

  // Find remaining bags of a purchase record, considering other shelling batches.
  const getRemainingBags = (p: PurchaseRecord) => {
    let used = 0;
    shellingBatches.forEach(b => {
      if (b.sourceBagsUsed && b.sourceBagsUsed[p.id] !== undefined) {
        used += b.sourceBagsUsed[p.id];
      } else if (b.sourceBatchIds.includes(p.id)) {
        // Fallback for legacy batches (pre-existing) which used all bags
        used += p.totalBags;
      }
    });
    return Math.max(0, p.totalBags - used);
  };

  // Shelling logic calculations
  // Get all unique selected purchases objects
  const selectedPurchases = purchases.filter(p => selectedSourceIds.includes(p.id));
  
  // Total input weight in Taiwan catties (台斤) - calculated proportionally to manually input bags
  const totalInputCatty = selectedPurchases.reduce((acc, p) => {
    const bagsUsed = selectedBags[p.id] || 0;
    const itemWeight = p.totalBags > 0 ? (p.totalWeightCatty * (bagsUsed / p.totalBags)) : 0;
    return acc + itemWeight;
  }, 0);
  
  // Conversion formula: 1 台斤 = 0.6 公斤
  const totalInputKg = totalInputCatty * 0.6;

  // Recovery Rate / Yield Calculation (%)
  const calculatedRecoveryRate = typeof outputWeightKg === 'number' && outputWeightKg > 0 && totalInputKg > 0
    ? parseFloat(((outputWeightKg / totalInputKg) * 100).toFixed(2))
    : 0;

  // Toggle Source Batches selection
  const handleToggleSource = (id: string) => {
    const p = purchases.find(item => item.id === id);
    if (!p) return;
    const remaining = getRemainingBags(p);

    setSelectedSourceIds(prev => {
      if (prev.includes(id)) {
        const updatedBags = { ...selectedBags };
        delete updatedBags[id];
        setSelectedBags(updatedBags);
        return prev.filter(item => item !== id);
      } else {
        setSelectedBags(prevBags => ({
          ...prevBags,
          [id]: remaining
        }));
        return [...prev, id];
      }
    });
  };

  const handleSelectAllPurchases = () => {
    const availablePurchases = purchases.filter(p => getRemainingBags(p) > 0);
    if (selectedSourceIds.length === availablePurchases.length) {
      setSelectedSourceIds([]);
      setSelectedBags({});
    } else {
      const allIds = availablePurchases.map(p => p.id);
      setSelectedSourceIds(allIds);
      const allBags: Record<string, number> = {};
      availablePurchases.forEach(p => {
        allBags[p.id] = getRemainingBags(p);
      });
      setSelectedBags(allBags);
    }
  };

  const handleShellingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShellingFeedback(null);

    if (selectedSourceIds.length === 0) {
      return setShellingFeedback({ type: 'error', msg: '請勾選至少一筆花生來源貨源批次！' });
    }

    // Validate manually input bag counts
    for (const id of selectedSourceIds) {
      const p = purchases.find(item => item.id === id);
      if (!p) continue;
      const bCount = selectedBags[id];
      const remaining = getRemainingBags(p);
      if (typeof bCount !== 'number' || bCount <= 0) {
        return setShellingFeedback({ type: 'error', msg: `請為農民「${p.farmerName}」的花生貨源填寫大於 0 的使用包數！` });
      }
      if (bCount > remaining) {
        return setShellingFeedback({ type: 'error', msg: `農民「${p.farmerName}」的花生貨源最多僅剩 ${remaining} 包可供使用！` });
      }
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
        sourceBagsUsed: selectedBags,
        outputWeightKg,
        recoveryRate: calculatedRecoveryRate,
        moisture
      });

      setShellingFeedback({
        type: 'success',
        msg: `成功登錄脫殼批次！累計消化 ${totalInputCatty.toLocaleString(undefined, { maximumFractionDigits: 1 })} 台斤毛料。`
      });

      // Reset Form fields
      setSelectedSourceIds([]);
      setSelectedBags({});
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

  // Export Shelling Batch to a single workbook containing exactly two separate Worksheets
  const handleExportCSV = (batch: ShellingBatch) => {
    // Collect related sources details
    const relatedSources = purchases.filter(p => batch.sourceBatchIds.includes(p.id));
    
    // Total raw catty weight in this batch (considering proportional bags used!)
    const rawCattySum = relatedSources.reduce((sum, p) => {
      const bagsUsed = batch.sourceBagsUsed && batch.sourceBagsUsed[p.id] !== undefined
        ? batch.sourceBagsUsed[p.id]
        : p.totalBags;
      const weightUsed = p.totalBags > 0 ? (p.totalWeightCatty * (bagsUsed / p.totalBags)) : 0;
      return sum + weightUsed;
    }, 0);
    const rawKgSum = rawCattySum * 0.6;

    // Calculate Purchase Cost Statistics based on proportional bags used
    const totalCost = relatedSources.reduce((sum, p) => {
      const bagsUsed = batch.sourceBagsUsed && batch.sourceBagsUsed[p.id] !== undefined
        ? batch.sourceBagsUsed[p.id]
        : p.totalBags;
      const weightUsed = p.totalBags > 0 ? (p.totalWeightCatty * (bagsUsed / p.totalBags)) : 0;
      return sum + (p.price * weightUsed);
    }, 0);

    const avgPrice = rawCattySum > 0 ? totalCost / rawCattySum : 0;
    const rawMaterialCostPerFinishedKg = batch.outputWeightKg > 0 ? totalCost / batch.outputWeightKg : 0;

    // 1. Generate Shelling Work Sheet Table (脫殼作業報表)
    const shellingTable = [
      [
        "加工批號(Batch ID)", "代工脫殼日期", "加工品項說明", 
        "進料總重(台斤)", "進料公制重(公斤)", "脫殼出產重量(公斤)", 
        "出肉率(成品率%)", "測量水分(%)", "合計毛料收購成本(元)", 
        "成品每公斤原料收購成本(元/公斤)", "成品存放倉儲"
      ],
      [
        batch.id, batch.date, "多來源混合/合夥代工加工", 
        parseFloat(rawCattySum.toFixed(1)), parseFloat(rawKgSum.toFixed(1)), batch.outputWeightKg, 
        `${batch.recoveryRate}%`, `${batch.moisture}%`, parseFloat(totalCost.toFixed(0)), 
        parseFloat(rawMaterialCostPerFinishedKg.toFixed(2)), "脫殼完成出口倉"
      ]
    ];

    // 2. Generate Purchases Work Sheet Table (收購報表)
    const purchaseTable = [
      [
        "收購紀錄ID", "日期", "農民/烘乾地", "是否履歷",
        "物資品種", "物資單價(元/台斤)", "加工使用包數", "扣減使用重量(台斤)", "折算收購成本(元)", "原存放地點"
      ]
    ];

    relatedSources.forEach((p) => {
      const bagsUsed = batch.sourceBagsUsed && batch.sourceBagsUsed[p.id] !== undefined
        ? batch.sourceBagsUsed[p.id]
        : p.totalBags;
      const weightUsed = p.totalBags > 0 ? (p.totalWeightCatty * (bagsUsed / p.totalBags)) : 0;
      const pCost = p.price * weightUsed;

      purchaseTable.push([
        p.id,
        p.date,
        p.farmerName,
        p.isResume ? "是" : "否",
        p.variety,
        p.price,
        bagsUsed,
        parseFloat(weightUsed.toFixed(1)),
        parseFloat(pCost.toFixed(0)),
        p.storageLocation
      ]);
    });

    // Add empty separator row
    purchaseTable.push([]);

    // Add purchase cost statistics summary row (收購成本統計)
    const totalBags = relatedSources.reduce((sum, p) => {
      const bagsUsed = batch.sourceBagsUsed && batch.sourceBagsUsed[p.id] !== undefined
        ? batch.sourceBagsUsed[p.id]
        : p.totalBags;
      return sum + bagsUsed;
    }, 0);

    purchaseTable.push([
      "加總統計(收購成本統計)",
      "",
      `總共: ${relatedSources.length} 戶農民`,
      "",
      "",
      `加權平均單價: $${avgPrice.toFixed(2)} 元/台斤`,
      `${totalBags} 包`,
      `進料總重: ${parseFloat(rawCattySum.toFixed(1)).toLocaleString()} 台斤`,
      `總折算收購成本: $${parseFloat(totalCost.toFixed(0)).toLocaleString()} 元`,
      ""
    ]);

    try {
      // Create a brand new workbook
      const wb = XLSX.utils.book_new();

      // Convert arrays to worksheets
      const wsShelling = XLSX.utils.aoa_to_sheet(shellingTable);
      const wsPurchases = XLSX.utils.aoa_to_sheet(purchaseTable);

      // Append worksheets to workbook with precise sheet names
      XLSX.utils.book_append_sheet(wb, wsShelling, "脫殼作業報表");
      XLSX.utils.book_append_sheet(wb, wsPurchases, "收購報表");

      // Save workbook to file
      XLSX.writeFile(wb, `加工批次與收購報告明細_批號${batch.id.substring(0, 6)}.xlsx`);
    } catch (err) {
      console.error("Failed to export with multiple worksheets:", err);
      alert("匯出 Excel 發生錯誤，請聯絡管理員。");
    }
  };

  const handleExportByDateRange = () => {
    // Filter batches by date range (inclusive)
    const filteredBatches = shellingBatches.filter(b => b.date >= exportStartDate && b.date <= exportEndDate)
      .sort((a, b) => b.date.localeCompare(a.date)); // Sort by date descending

    if (filteredBatches.length === 0) {
      alert("選取區間內無任何脫殼加工批次紀錄！");
      return;
    }

    // 1. Generate "代工脫殼批次總表" Work Sheet
    const shellingHeaders = [
      "代工脫殼日期", "加工批號(Batch ID)", "加工品項說明", 
      "進料總重(台斤)", "進料公制重(公斤)", "脫殼出產重量(公斤)", 
      "出肉率(成品率%)", "測量水分(%)", "合計毛料收購成本(元)", 
      "成品每公斤原料收購成本(元/公斤)", "成品存放倉儲"
    ];

    const shellingRows: any[] = [];
    let totalRawCattyAll = 0;
    let totalRawKgAll = 0;
    let totalOutputKgAll = 0;
    let totalCostAll = 0;

    filteredBatches.forEach(b => {
      const relatedSources = purchases.filter(p => b.sourceBatchIds.includes(p.id));
      const rawCattySum = relatedSources.reduce((sum, p) => {
        const bagsUsed = b.sourceBagsUsed && b.sourceBagsUsed[p.id] !== undefined
          ? b.sourceBagsUsed[p.id]
          : p.totalBags;
        const weightUsed = p.totalBags > 0 ? (p.totalWeightCatty * (bagsUsed / p.totalBags)) : 0;
        return sum + weightUsed;
      }, 0);
      const rawKgSum = rawCattySum * 0.6;

      const totalCost = relatedSources.reduce((sum, p) => {
        const bagsUsed = b.sourceBagsUsed && b.sourceBagsUsed[p.id] !== undefined
          ? b.sourceBagsUsed[p.id]
          : p.totalBags;
        const weightUsed = p.totalBags > 0 ? (p.totalWeightCatty * (bagsUsed / p.totalBags)) : 0;
        return sum + (p.price * weightUsed);
      }, 0);

      const rawMaterialCostPerFinishedKg = b.outputWeightKg > 0 ? totalCost / b.outputWeightKg : 0;

      totalRawCattyAll += rawCattySum;
      totalRawKgAll += rawKgSum;
      totalOutputKgAll += b.outputWeightKg;
      totalCostAll += totalCost;

      shellingRows.push([
        b.date,
        b.id,
        "多來源混合/合夥代工加工",
        parseFloat(rawCattySum.toFixed(1)),
        parseFloat(rawKgSum.toFixed(1)),
        b.outputWeightKg,
        `${b.recoveryRate}%`,
        `${b.moisture}%`,
        parseFloat(totalCost.toFixed(0)),
        parseFloat(rawMaterialCostPerFinishedKg.toFixed(2)),
        "脫殼完成出口倉"
      ]);
    });

    // Add summary row for shelling table
    const avgRecoveryRateTotal = totalRawKgAll > 0 ? (totalOutputKgAll / totalRawKgAll) * 100 : 0;
    const shellingTable = [
      shellingHeaders,
      ...shellingRows,
      [], // Empty row separator
      [
        "加總統計(區間累計)",
        `區間共: ${filteredBatches.length} 批次`,
        "",
        parseFloat(totalRawCattyAll.toFixed(1)),
        parseFloat(totalRawKgAll.toFixed(1)),
        parseFloat(totalOutputKgAll.toFixed(1)),
        `${avgRecoveryRateTotal.toFixed(2)}%`,
        "", // moisture average empty
        parseFloat(totalCostAll.toFixed(0)),
        totalOutputKgAll > 0 ? parseFloat((totalCostAll / totalOutputKgAll).toFixed(2)) : 0,
        ""
      ]
    ];

    // 2. Generate "對應收購來源明細" Work Sheet
    const purchaseHeaders = [
      "加工批號", "加工日期", "收購紀錄ID", "收購日期", "農民/烘乾地", "是否履歷",
      "物資品種", "物資單價(元/台斤)", "加工使用包數", "扣減使用重量(台斤)", "折算收購成本(元)", "原存放地點"
    ];

    const purchaseRows: any[] = [];
    let totalBagsAll = 0;
    let totalWeightCattyAll = 0;
    let totalPurchaseCostAll = 0;

    filteredBatches.forEach(b => {
      const relatedSources = purchases.filter(p => b.sourceBatchIds.includes(p.id));
      relatedSources.forEach(p => {
        const bagsUsed = b.sourceBagsUsed && b.sourceBagsUsed[p.id] !== undefined
          ? b.sourceBagsUsed[p.id]
          : p.totalBags;
        const weightUsed = p.totalBags > 0 ? (p.totalWeightCatty * (bagsUsed / p.totalBags)) : 0;
        const pCost = p.price * weightUsed;

        totalBagsAll += bagsUsed;
        totalWeightCattyAll += weightUsed;
        totalPurchaseCostAll += pCost;

        purchaseRows.push([
          b.id,
          b.date,
          p.id,
          p.date,
          p.farmerName,
          p.isResume ? "是" : "否",
          p.variety,
          p.price,
          bagsUsed,
          parseFloat(weightUsed.toFixed(1)),
          parseFloat(pCost.toFixed(0)),
          p.storageLocation
        ]);
      });
    });

    const purchaseTable = [
      purchaseHeaders,
      ...purchaseRows,
      [], // Empty separation row
      [
        "加總統計(區間累計)",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        totalBagsAll,
        parseFloat(totalWeightCattyAll.toFixed(1)),
        parseFloat(totalPurchaseCostAll.toFixed(0)),
        ""
      ]
    ];

    try {
      // Create workbook
      const wb = XLSX.utils.book_new();

      // Convert arrays to worksheets
      const wsShelling = XLSX.utils.aoa_to_sheet(shellingTable);
      const wsPurchases = XLSX.utils.aoa_to_sheet(purchaseTable);

      // Append
      XLSX.utils.book_append_sheet(wb, wsShelling, "代工脫殼批次總表");
      XLSX.utils.book_append_sheet(wb, wsPurchases, "對應收購來源明細");

      // Save
      XLSX.writeFile(wb, `花生脫殼代工區間報表_${exportStartDate}_至_${exportEndDate}.xlsx`);
    } catch (err) {
      console.error("Failed to export by date range:", err);
      alert("匯出區間報表發生錯誤，請聯絡管理員。");
    }
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
      <div className="flex border-b border-slate-200 overflow-x-auto flex-nowrap scrollbar-none">
        <button
          id="tab-inventory-btn"
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-semibold text-sm transition-all focus:outline-none whitespace-nowrap cursor-pointer ${
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
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-semibold text-sm transition-all focus:outline-none whitespace-nowrap cursor-pointer ${
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
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-semibold text-sm transition-all focus:outline-none whitespace-nowrap cursor-pointer ${
            activeTab === 'reports'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>加工批次報告</span>
        </button>
        <button
          id="tab-options-btn"
          onClick={() => setActiveTab('options')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-semibold text-sm transition-all focus:outline-none whitespace-nowrap cursor-pointer ${
            activeTab === 'options'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Grid className="h-4 w-4" />
          <span>選單內容編輯</span>
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
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">1. 選取本次加工使用的花生貨源</h3>
                  <p className="text-xs text-slate-400 mt-0.5">可勾選多批不同農民、不同存放區的花生毛料混合脫殼。已用罄的貨源不會在清單中顯示。</p>
                </div>
                {purchases.filter(p => getRemainingBags(p) > 0).length > 0 && (
                  <button
                    onClick={handleSelectAllPurchases}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 cursor-pointer"
                  >
                    {selectedSourceIds.length === purchases.filter(p => getRemainingBags(p) > 0).length ? '取消全選' : '全選可使用貨源'}
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2">
                {purchases.filter(p => getRemainingBags(p) > 0).length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    目前原料庫存皆已全數代工脫殼完畢，或尚無收購紀錄。請先至收購前台登錄。
                  </div>
                ) : (
                  purchases
                    .filter(p => getRemainingBags(p) > 0)
                    .map((p) => {
                      const isChecked = selectedSourceIds.includes(p.id);
                      const remaining = getRemainingBags(p);
                      const remainingWeight = p.totalBags > 0 ? (p.totalWeightCatty * (remaining / p.totalBags)) : 0;

                      return (
                        <div
                          key={p.id}
                          onClick={() => handleToggleSource(p.id)}
                          className={`p-3 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer ${
                            isChecked 
                              ? 'border-amber-400 bg-amber-50/20' 
                              : 'border-slate-150 bg-white hover:bg-slate-50 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {/* Custom Checkbox */}
                            <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                              isChecked ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>

                            <div>
                              <div className="flex items-center space-x-1.5 flex-wrap">
                                <span className="text-sm font-bold text-slate-800">{p.farmerName}</span>
                                {p.isResume && (
                                  <span className="text-[10px] bg-emerald-50 border border-emerald-200 px-1 text-emerald-700 rounded font-semibold whitespace-nowrap">
                                    履歷
                                  </span>
                                )}
                                <span className="text-[10px] bg-slate-100 border border-slate-200 px-1 text-slate-600 rounded whitespace-nowrap">
                                  {p.variety}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                                存放：{p.storageLocation} | 收購日：{p.date}
                              </span>
                              <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded px-1.5 py-0.5 inline-block mt-1">
                                可用餘額：{remaining} 包 / 約 {remainingWeight.toFixed(0)} 台斤
                              </span>
                            </div>
                          </div>

                          {/* Weight in taiwan catty label */}
                          <div className="flex items-center space-x-3 shrink-0 self-end md:self-auto" onClick={(e) => e.stopPropagation()}>
                            {isChecked ? (
                              <div className="flex items-center space-x-1.5 bg-white border border-amber-300 rounded-xl px-2 py-1 shrink-0 shadow-sm">
                                <span className="text-xs font-semibold text-slate-600">使用包數:</span>
                                <input
                                  type="number"
                                  min="1"
                                  max={remaining}
                                  value={selectedBags[p.id] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? '' : Math.min(remaining, Math.max(1, parseInt(e.target.value) || 1));
                                    setSelectedBags(prev => ({
                                      ...prev,
                                      [p.id]: val as number
                                    }));
                                  }}
                                  className="w-14 text-center rounded-lg border border-slate-200 py-1 px-1.5 text-xs outline-none focus:border-amber-500 font-bold font-mono text-slate-800"
                                />
                                <span className="text-xs font-semibold text-slate-400">包</span>
                              </div>
                            ) : (
                              <div className="text-right">
                                <span className="text-sm font-semibold text-slate-700 block font-mono">{remaining} 包</span>
                                <span className="text-[10px] text-slate-400 font-mono">約 {remainingWeight.toFixed(0)} 台斤</span>
                              </div>
                            )}
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
              <p className="text-xs text-slate-500">歷史紀錄彙整，您在此處可以審閱成品轉化轉換明細，並依選定之時間區間打包下載統計報表。</p>
            </div>

            {/* Date-Range Bulk Export Section */}
            <div className="p-5 bg-amber-50/10 border-b border-slate-150 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center">
                  <Calendar className="h-3.5 w-3.5 text-amber-600 mr-1" />
                  匯出開始日期
                </label>
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 font-medium text-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center">
                  <Calendar className="h-3.5 w-3.5 text-amber-600 mr-1" />
                  匯出結束日期
                </label>
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 font-medium text-slate-700"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleExportByDateRange}
                  className="w-full flex items-center justify-center space-x-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 transition active:scale-[0.98] cursor-pointer shadow-sm"
                >
                  <FileSpreadsheet className="h-4 w-4 shrink-0" />
                  <span>批次與收購資料區間匯出 (.xlsx)</span>
                </button>
              </div>
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
                    <th className="py-3 px-4 text-center">管理</th>
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
                      const combinedCatty = relatedSources.reduce((sum, p) => {
                        const bagsUsed = b.sourceBagsUsed && b.sourceBagsUsed[p.id] !== undefined
                          ? b.sourceBagsUsed[p.id]
                          : p.totalBags;
                        const weightUsed = p.totalBags > 0 ? (p.totalWeightCatty * (bagsUsed / p.totalBags)) : 0;
                        return sum + weightUsed;
                      }, 0);
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
                                relatedSources.map((p) => {
                                  const bagsUsed = b.sourceBagsUsed && b.sourceBagsUsed[p.id] !== undefined
                                    ? b.sourceBagsUsed[p.id]
                                    : p.totalBags;
                                  return (
                                    <span key={p.id} className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700 font-medium border border-amber-100 whitespace-nowrap">
                                      {p.farmerName} ({p.variety}) [{bagsUsed}包]
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right font-mono text-xs">
                            <span className="font-semibold text-slate-600">{parseFloat(combinedCatty.toFixed(1)).toLocaleString()} 斤</span>
                            <span className="text-[10px] text-slate-400 block">({parseFloat(combinedKg.toFixed(1)).toLocaleString()} 公斤)</span>
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
                            <button
                              onClick={() => handleDeleteShellingClick(b.id)}
                              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 hover:border-rose-100 transition inline-flex items-center space-x-1 cursor-pointer text-xs font-medium"
                              title="刪除此加工紀錄報告"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>刪除</span>
                            </button>
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

        {/* =============== Tab 4: SELECTION OPTIONS EDIT =============== */}
        {activeTab === 'options' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Peanut Varieties Configuration Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center">
                  <Grid className="h-5 w-5 text-amber-600 mr-2" />
                  前台收購花生品種選單管理
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  在此新增、刪除或調整可供前台及後台選擇的花生品種清單。
                </p>
              </div>

              {/* Add form */}
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!newVariety.trim()) return;
                if (varieties.includes(newVariety.trim())) {
                  showCustomAlert("提示", "此花生品種已存在！");
                  return;
                }
                const updated = [...varieties, newVariety.trim()];
                try {
                  await updateOptions(updated, storageLocations);
                  setNewVariety('');
                  showCustomAlert("成功", "花生品種新增成功！", "success");
                } catch (err) {
                  console.error(err);
                  showCustomAlert("錯誤", "儲存失敗，請確認網路連線。");
                }
              }} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="輸入新品種名稱 (例如: 黑金剛, 九號)"
                  value={newVariety}
                  onChange={(e) => setNewVariety(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 font-medium"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-4 py-2 transition active:scale-[0.98] cursor-pointer"
                >
                  新增品種
                </button>
              </form>

              {/* List of current options */}
              <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {varieties.map((v) => (
                  <div key={v} className="flex justify-between items-center py-2.5 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50/50">
                    <span>{v}</span>
                    {v !== '其他' && (
                      <button
                        type="button"
                        onClick={() => {
                          showCustomConfirm(
                            "確認移除品種",
                            `確定要刪除「${v}」品種嗎？已登錄的歷史紀錄將不受影響。`,
                            async () => {
                              const updated = varieties.filter(x => x !== v);
                              try {
                                await updateOptions(updated, storageLocations);
                                showCustomAlert("成功", "品種已由選單移除。", "success");
                              } catch (err) {
                                console.error(err);
                                showCustomAlert("錯誤", "更新失敗，請確認網路。");
                              }
                            }
                          );
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="刪除此選項"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Storage Locations Configuration Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center">
                  <Archive className="h-5 w-5 text-amber-600 mr-2" />
                  存放地點選單管理
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  在這裡設定庫存儲物空間清單，存放地點將以選項下拉選單供前台輸入。
                </p>
              </div>

              {/* Add form */}
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!newStorageLocation.trim()) return;
                if (storageLocations.includes(newStorageLocation.trim())) {
                  showCustomAlert("提示", "此存放地點已存在！");
                  return;
                }
                const updated = [...storageLocations, newStorageLocation.trim()];
                try {
                  await updateOptions(varieties, updated);
                  setNewStorageLocation('');
                  showCustomAlert("成功", "存放地點新增成功！", "success");
                } catch (err) {
                  console.error(err);
                  showCustomAlert("錯誤", "儲存失敗，請確認網路連線。");
                }
              }} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="輸入存放地點名稱 (例如: A2 庫房, 西側烘乾場)"
                  value={newStorageLocation}
                  onChange={(e) => setNewStorageLocation(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 font-medium"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-4 py-2 transition active:scale-[0.98] cursor-pointer"
                >
                  新增地點
                </button>
              </form>

              {/* List of current options */}
              <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {storageLocations.map((loc) => (
                  <div key={loc} className="flex justify-between items-center py-2.5 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50/50">
                    <span>{loc}</span>
                    <button
                      type="button"
                      onClick={() => {
                        showCustomConfirm(
                          "確認移除存放地點",
                          `確定要刪除「${loc}」存放地點嗎？歷史收購資料不會被更改。`,
                          async () => {
                            const updated = storageLocations.filter(x => x !== loc);
                            try {
                              await updateOptions(varieties, updated);
                              showCustomAlert("成功", "存放地點已由選單移除。", "success");
                            } catch (err) {
                              console.error(err);
                              showCustomAlert("錯誤", "更新失敗，請確認網路。");
                            }
                          }
                        );
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                      title="刪除此選項"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
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
                    <div className="mt-2.5 flex items-center">
                      <input
                        id="edit-is-resume"
                        type="checkbox"
                        checked={editIsResume}
                        onChange={(e) => setEditIsResume(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <label htmlFor="edit-is-resume" className="ml-2 text-xs font-semibold text-slate-600 select-none cursor-pointer">
                        具備「履歷」認證
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">花生品種</label>
                    <select
                      id="edit-variety-select"
                      value={editVariety}
                      onChange={(e) => setEditVariety(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {varieties.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                      {!varieties.includes(editVariety) && editVariety && (
                        <option value={editVariety}>{editVariety}</option>
                      )}
                      {!varieties.includes('其他') && (
                        <option value="其他">其他</option>
                      )}
                    </select>
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
                  <select
                    id="edit-storage-select"
                    value={editStorageLocation}
                    onChange={(e) => setEditStorageLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {storageLocations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                    {!storageLocations.includes(editStorageLocation) && editStorageLocation && (
                      <option value={editStorageLocation}>{editStorageLocation}</option>
                    )}
                  </select>
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

      {/* Custom Confirmation/Notification dialog instead of blocking browser confirm/alert */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start space-x-3.5">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                modalConfig.type === 'confirm' 
                  ? 'bg-amber-100 text-amber-600'
                  : modalConfig.type === 'success'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-rose-100 text-rose-600'
              }`}>
                {modalConfig.type === 'confirm' ? (
                  <HelpCircle className="h-5 w-5" />
                ) : modalConfig.type === 'success' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">{modalConfig.title}</h3>
                <p className="text-xs text-slate-500 mt-1.5 whitespace-pre-line leading-relaxed">
                  {modalConfig.message}
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 text-xs">
              {modalConfig.type === 'confirm' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      closeCustomModal();
                    }}
                    className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const confirmCb = modalConfig.onConfirm;
                      closeCustomModal();
                      if (confirmCb) {
                        await confirmCb();
                      }
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold cursor-pointer"
                  >
                    確認
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={closeCustomModal}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold cursor-pointer"
                >
                  關閉
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
