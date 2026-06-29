/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  MapPin, 
  Calendar, 
  Hash, 
  Layers, 
  DollarSign, 
  Scale, 
  QrCode, 
  Printer, 
  Search, 
  CheckCircle, 
  WifiOff, 
  HelpCircle,
  FilePlus,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';
import { PurchaseRecord } from '../types';
import { generateQrCode } from '../utils/qrcode';

export const PurchaseDesk: React.FC = () => {
  const { purchases, addPurchase, isOnline, isLoading, varieties, storageLocations, transporters } = useDatabase();

  const [farmerName, setFarmerName] = useState('');
  const [isResume, setIsResume] = useState(false);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [variety, setVariety] = useState('');
  const [customVariety, setCustomVariety] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [totalBags, setTotalBags] = useState<number | ''>('');
  const [totalWeightCatty, setTotalWeightCatty] = useState<number | ''>('');
  const [storageLocation, setStorageLocation] = useState('');
  
  // New payment and transporter state
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('unpaid');
  const [transporterName, setTransporterName] = useState('');
  const [transporterFeeStatus, setTransporterFeeStatus] = useState<'paid' | 'unpaid'>('unpaid');

  // UI state
  const [filterText, setFilterText] = useState('');
  const [filterVariety, setFilterVariety] = useState('全部');
  const [activeQrRecord, setActiveQrRecord] = useState<PurchaseRecord | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // Focus tracking for user manual
  const [helpMessage, setHelpMessage] = useState('請依欄位輸入花生農民收購之原始數據。');

  // Load and cache default selections and handle QR cache
  useEffect(() => {
    if (varieties && varieties.length > 0 && !variety) {
      setVariety(varieties[0]);
    }
  }, [varieties, variety]);

  useEffect(() => {
    if (storageLocations && storageLocations.length > 0 && !storageLocation) {
      setStorageLocation(storageLocations[0]);
    }
  }, [storageLocations, storageLocation]);

  useEffect(() => {
    if (transporters && transporters.length > 0 && !transporterName) {
      setTransporterName(transporters[0]);
    }
  }, [transporters, transporterName]);

  useEffect(() => {
    if (activeQrRecord) {
      const qrPayload = JSON.stringify({
        id: activeQrRecord.id,
        farmer: activeQrRecord.farmerName,
        variety: activeQrRecord.variety,
        weight: activeQrRecord.totalWeightCatty,
        bags: activeQrRecord.totalBags,
        date: activeQrRecord.date
      });
      generateQrCode(qrPayload).then(setQrCodeUrl);
    } else {
      setQrCodeUrl('');
    }
  }, [activeQrRecord]);

  // Set help hints dynamically
  const getHelpTip = (field: string) => {
    switch (field) {
      case 'farmer': return '請輸入農民真實姓名與是否符合履歷認證規格。';
      case 'location': return '例如「褒忠鄉」、「元長鄉農會前」，以利掌握貨源分布。';
      case 'variety': return '品種會影響出油率，脫殼加工時亦需區隔，請確實選填。';
      case 'price': return '目前行情約每台斤 $30 - $48 元不等，請填寫實收單價。';
      case 'bags': return '該批採收裝填之總袋數（包）。';
      case 'weight': return '直接抄寫磅秤顯示之原始「台斤（Catty）」總重。';
      case 'storage': return '請選取存放冷藏或一般批次倉庫，以利後續合夥加工尋料。';
      default: return '請依欄位輸入花生農民收購之原始數據。';
    }
  };

  const handleAddField = (field: string) => {
    setHelpMessage(getHelpTip(field));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    // Form Validation Checks
    if (!farmerName.trim()) return setFormFeedback({ type: 'error', msg: '請輸入農民名字！' });
    if (!location.trim()) return setFormFeedback({ type: 'error', msg: '請輸入收購地點！' });
    if (!date) return setFormFeedback({ type: 'error', msg: '請選擇日期！' });
    
    const finalVariety = variety === '其他' ? customVariety.trim() : variety;
    if (!finalVariety) return setFormFeedback({ type: 'error', msg: '請指定花生品種！' });

    if (typeof price !== 'number' || price <= 0) return setFormFeedback({ type: 'error', msg: '價格必須大於 0！' });
    if (typeof totalBags !== 'number' || totalBags <= 0) return setFormFeedback({ type: 'error', msg: '總數量（包）必須大於 0！' });
    if (typeof totalWeightCatty !== 'number' || totalWeightCatty <= 0) return setFormFeedback({ type: 'error', msg: '總重量（台斤）必須大於 0！' });
    if (!storageLocation.trim()) return setFormFeedback({ type: 'error', msg: '請選擇存放地點！' });

    setIsSubmitting(true);
    try {
      const added = await addPurchase({
        farmerName: farmerName.trim(),
        location: location.trim(),
        date,
        variety: finalVariety,
        price,
        totalBags,
        totalWeightCatty,
        storageLocation: storageLocation.trim(),
        isResume: isResume,
        paymentStatus,
        transporterName,
        transporterFeeStatus
      });

      setFormFeedback({
        type: 'success',
        msg: isOnline 
          ? `成功建檔！已儲存至雲端。` 
          : `已本地安全暫存！等恢復連線時將自動同步。`
      });

      // Clear Form Fields
      setFarmerName('');
      setIsResume(false);
      setLocation('');
      setPrice('');
      setTotalBags('');
      setTotalWeightCatty('');
      // If we cleared, let's keep defaults if possible, else reset
      setStorageLocation(storageLocations[0] || '');
      setVariety(varieties[0] || '');
      setCustomVariety('');
      setPaymentStatus('unpaid');
      setTransporterName(transporters[0] || '');
      setTransporterFeeStatus('unpaid');
      
      // Auto open QR label context for immediate printing/viewing
      setActiveQrRecord(added);
    } catch (err) {
      console.error(err);
      setFormFeedback({ type: 'error', msg: '儲存失敗，請重試！' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter computation
  const filteredPurchases = purchases.filter((p) => {
    const textMatch = 
      p.farmerName.toLowerCase().includes(filterText.toLowerCase()) ||
      p.location.toLowerCase().includes(filterText.toLowerCase()) ||
      p.storageLocation.toLowerCase().includes(filterText.toLowerCase());
    
    const varietyMatch = filterVariety === '全部' || p.variety === filterVariety;
    
    return textMatch && varietyMatch;
  });

  const uniqueVarieties = Array.from(new Set(purchases.map(p => p.variety)));

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("無法打開列印視窗，請檢查瀏覽器彈出視窗設定。");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>花生履歷條碼標籤</title>
          <style>
            body { 
              font-family: 'Inter', system-ui, sans-serif; 
              text-align: center; 
              padding: 20px; 
              color: #334155;
            }
            .label-card {
              border: 3px dashed #b45309;
              border-radius: 12px;
              padding: 30px;
              max-width: 450px;
              margin: auto;
              background-color: #fffbeb;
            }
            .label-title {
              font-size: 24px;
              font-weight: bold;
              color: #b45309;
              margin-bottom: 5px;
            }
            .label-subtitle {
              font-size: 14px;
              color: #78350f;
              margin-bottom: 20px;
            }
            .qr-code {
              width: 220px;
              height: 220px;
              margin: 15px auto;
            }
            .data-grid {
              text-align: left;
              margin-top: 20px;
              font-size: 16px;
              border-collapse: collapse;
              width: 100%;
            }
            .data-grid td {
              padding: 6px 4px;
              border-bottom: 1px solid #fed7aa;
            }
            .data-grid .label {
              font-weight: bold;
              color: #9a3412;
              width: 40%;
            }
            .footer-tip {
              margin-top: 20px;
              font-size: 12px;
              color: #9a3412;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="label-title">花生收購溯源條碼</div>
            <div class="label-subtitle">代工脫殼生產溯源專用標籤</div>
            <img class="qr-code" src="${qrCodeUrl}" alt="QR code" />
            <table class="data-grid">
              <tr>
                <td class="label">履歷批號：</td>
                <td style="font-family: monospace; font-size: 14px;">${activeQrRecord?.id}</td>
              </tr>
              <tr>
                <td class="label">生產農民：</td>
                <td>${activeQrRecord?.farmerName}${activeQrRecord?.isResume ? ' <span style="display: inline-block; color: #15803d; background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 1px 5px; border-radius: 4px; font-size: 11px; margin-left: 6px; font-weight: bold; vertical-align: middle;">履歷</span>' : ''}</td>
              </tr>
              <tr>
                <td class="label">花生品種：</td>
                <td>${activeQrRecord?.variety}</td>
              </tr>
              <tr>
                <td class="label">收購規格：</td>
                <td>${activeQrRecord?.totalBags} 包 / ${activeQrRecord?.totalWeightCatty} 台斤</td>
              </tr>
              <tr>
                <td class="label">存放倉庫：</td>
                <td>${activeQrRecord?.storageLocation}</td>
              </tr>
              <tr>
                <td class="label">收購日期：</td>
                <td>${activeQrRecord?.date}</td>
              </tr>
            </table>
            <div class="footer-tip">※ 脫殼時請掃描此 QR code 紀錄履歷來源</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Sleek Interface live stats calculations
  const totalWeightCattySum = purchases.reduce((sum, p) => sum + p.totalWeightCatty, 0);
  const totalCostSum = purchases.reduce((sum, p) => sum + (p.price * p.totalWeightCatty), 0);
  const averagePrice = totalWeightCattySum > 0 ? totalCostSum / totalWeightCattySum : 0;
  // Estimated final kernels in kg. Standard peanut processing yield is around 70%.
  const estimatedOutputKg = totalWeightCattySum * 0.6 * 0.7;

  return (
    <div className="space-y-6">
      {/* Dynamic User Guide Alert */}
      <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 transition-all duration-300">
        <div className="flex items-start space-x-3">
          <HelpCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-amber-900">系統即時助手</h3>
            <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">{helpMessage}</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 transition hover:shadow duration-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">總計收購量</p>
          <p className="text-2xl font-black text-slate-800 font-sans">
            {totalWeightCattySum.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-sm font-medium text-slate-500">台斤</span>
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 transition hover:shadow duration-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">成品預估</p>
          <p className="text-2xl font-black text-amber-600 font-sans">
            ~ {estimatedOutputKg.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-sm font-medium text-slate-400">公斤</span>
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 transition hover:shadow duration-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">收購均價</p>
          <p className="text-2xl font-black text-slate-800 font-sans">
            $ {averagePrice.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-sm font-medium text-slate-400">/台斤</span>
          </p>
        </div>
      </div>

      {/* Main Grid: Form on Left, History List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Purchase record Input Form block */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center space-x-2 pb-5 mb-5 border-b border-slate-100">
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <FilePlus className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-slate-800">登錄新收購紀錄</h2>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              {/* Farmer Name */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 label-required">農民名字</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    id="farmer-input"
                    type="text"
                    required
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    onFocus={() => handleAddField('farmer')}
                    placeholder="例如：張花生"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="mt-2.5 flex items-center">
                  <input
                    id="is-resume-checkbox"
                    type="checkbox"
                    checked={isResume}
                    onChange={(e) => setIsResume(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="is-resume-checkbox" className="ml-2 text-xs font-semibold text-slate-700 select-none cursor-pointer">
                    具備「履歷」認證
                  </label>
                </div>
              </div>

              {/* Purchase Date */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">收購日期</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Calendar className="h-4 w-4" />
                  </span>
                  <input
                    id="date-input"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    onFocus={() => handleAddField('date')}
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Purchase Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 label-required">收購地點</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <MapPin className="h-4 w-4" />
                </span>
                <input
                  id="location-input"
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onFocus={() => handleAddField('location')}
                  placeholder="例如：褒忠鄉民生路村外晒穀場"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Variety Block */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">花生品種</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Layers className="h-4 w-4" />
                  </span>
                  <select
                    id="variety-select"
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    onFocus={() => handleAddField('variety')}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500 hover:border-slate-300 cursor-pointer"
                  >
                    {varieties.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                    {!varieties.includes('其他') && (
                      <option value="其他">其他品種（自行輸入）</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Custom Variety input (if variety === '其他') */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  自行輸入品種 <span className="text-[10px] text-slate-400 font-normal">(選填)</span>
                </label>
                <input
                  id="custom-variety-input"
                  type="text"
                  disabled={variety !== '其他'}
                  required={variety === 'other'}
                  value={customVariety}
                  onChange={(e) => setCustomVariety(e.target.value)}
                  placeholder="例如：台南16號"
                  className={`w-full rounded-xl border py-2.5 px-3 text-sm outline-none transition ${
                    variety === '其他'
                      ? 'border-slate-200 bg-white focus:border-amber-500'
                      : 'border-slate-100 bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>

            {/* Numbers: Pricing & Weight */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 label-required">
                  單價 <span className="text-[10px] font-normal text-slate-400">(元/台斤)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                    <DollarSign className="h-3.5 w-3.5" />
                  </span>
                  <input
                    id="price-input"
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    onFocus={() => handleAddField('price')}
                    placeholder="41.5"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-7 pr-1.5 text-sm outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 label-required">
                  總數量 <span className="text-[10px] font-normal text-slate-400">(包)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                    <Hash className="h-3.5 w-3.5" />
                  </span>
                  <input
                    id="bags-input"
                    type="number"
                    min="1"
                    required
                    value={totalBags}
                    onChange={(e) => setTotalBags(e.target.value === '' ? '' : parseInt(e.target.value))}
                    onFocus={() => handleAddField('bags')}
                    placeholder="120"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-7 pr-1.5 text-sm outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 label-required">
                  總重量 <span className="text-[10px] font-normal text-slate-400">(台斤)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                    <Scale className="h-3.5 w-3.5" />
                  </span>
                  <input
                    id="weight-input"
                    type="number"
                    min="1"
                    required
                    value={totalWeightCatty}
                    onChange={(e) => setTotalWeightCatty(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    onFocus={() => handleAddField('weight')}
                    placeholder="15000"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-7 pr-1.5 text-sm outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Live calculation card helper */}
            {typeof price === 'number' && typeof totalWeightCatty === 'number' && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 flex justify-between items-center">
                <span className="text-xs font-medium text-emerald-800">💡 預計結算金額 (總重 × 單價)</span>
                <span className="text-sm font-black text-emerald-700 font-mono">
                  $ {(price * totalWeightCatty).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })} 元
                </span>
              </div>
            )}

            {/* Storage Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 label-required">存放地點</label>
              <select
                id="storage-input"
                required
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                onFocus={() => handleAddField('storage')}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500 hover:border-slate-300 cursor-pointer"
              >
                {storageLocations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Logistics and Payment Section */}
            <div className="p-4 bg-amber-50/20 rounded-2xl border border-amber-100/40 space-y-3">
              <h4 className="text-xs font-bold text-amber-800 tracking-wider uppercase">收付款與物流設定</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Farmer Payment Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">收購付款狀態</label>
                  <select
                    id="payment-status-select"
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as 'paid' | 'unpaid')}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500 hover:border-slate-300 cursor-pointer"
                  >
                    <option value="unpaid">未結清</option>
                    <option value="paid">已結清</option>
                  </select>
                </div>

                {/* Transporter */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">運送人員</label>
                  <select
                    id="transporter-select"
                    value={transporterName}
                    onChange={(e) => setTransporterName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500 hover:border-slate-300 cursor-pointer"
                  >
                    {transporters.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    {transporters.length === 0 && (
                      <option value="">無 (請至後台編輯名單)</option>
                    )}
                  </select>
                </div>

                {/* Transporter Fee Status */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">運送費用結清</label>
                  <select
                    id="transporter-fee-select"
                    value={transporterFeeStatus}
                    onChange={(e) => setTransporterFeeStatus(e.target.value as 'paid' | 'unpaid')}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500 hover:border-slate-300 cursor-pointer"
                  >
                    <option value="unpaid">未結清</option>
                    <option value="paid">已結清</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submission Status Feedback */}
            {formFeedback && (
              <div className={`p-3 rounded-xl border text-xs text-center font-medium ${
                formFeedback.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                  : 'bg-rose-50 text-rose-800 border-rose-100'
              }`}>
                {formFeedback.msg}
              </div>
            )}

            {/* Buttons */}
            <button
              id="submit-record-btn"
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center space-x-2 rounded-xl py-3 text-sm font-semibold text-white shadow-sm transition duration-300 ${
                isSubmitting 
                  ? 'bg-amber-400 cursor-not-allowed' 
                  : 'bg-amber-600 hover:bg-amber-700 active:scale-[0.98]'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>{isSubmitting ? '處理中...' : '確認登錄收購數據'}</span>
            </button>
          </form>
        </div>


        {/* Historical purchase records view list */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Header containing Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                id="search-purchase-input"
                type="text"
                placeholder="搜尋農民、收購地、存放地點..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-500"
              />
            </div>

            {/* Variety dropdown filter */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 shrink-0 font-medium select-none">篩選品種</span>
              <select
                id="filter-variety-select"
                value={filterVariety}
                onChange={(e) => setFilterVariety(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm outline-none focus:border-amber-500"
              >
                <option value="全部">全部品種</option>
                {uniqueVarieties.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* List display */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl">
                <RefreshCw className="h-8 w-8 text-amber-600 animate-spin mb-3" />
                <span className="text-sm text-slate-500 font-medium">資料庫同步載入中...</span>
              </div>
            ) : filteredPurchases.length === 0 ? (
              <div className="text-center py-20 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
                <ShoppingBag className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-600">目前無符合的收購紀錄</h3>
                <p className="text-xs text-slate-400 mt-1">請利用左側表單輸入，或調整上方篩選條件。</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPurchases.map((p) => {
                  const totalPrice = p.price * p.totalWeightCatty;
                  return (
                    <motion.div
                      key={p.id}
                      layoutId={p.id}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-amber-300 transition-all p-4 flex flex-col justify-between shadow-sm hover:shadow"
                    >
                      {/* Card Top Label */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-base font-bold text-slate-800">{p.farmerName}</span>
                            {p.isResume && (
                              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-100">
                                履歷
                              </span>
                            )}
                            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-100">
                              {p.variety}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 block mt-1">{p.date}</span>
                        </div>

                        {/* Sync status identifier */}
                        {p.isSynced === false ? (
                          <span className="flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600 border border-rose-100 animate-pulse">
                            <WifiOff className="h-3 w-3 mr-1" />
                            待同步
                          </span>
                        ) : (
                          <span className="flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 border border-emerald-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            雲端同步
                          </span>
                        )}
                      </div>

                      {/* Card Content Grid */}
                      <div className="grid grid-cols-2 gap-3 my-4 bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                        <div className="text-xs">
                          <span className="text-slate-400 block mb-0.5">收購地點</span>
                          <span className="font-semibold text-slate-700 truncate block">{p.location}</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-slate-400 block mb-0.5">存放倉庫</span>
                          <span className="font-semibold text-slate-700 truncate block">{p.storageLocation}</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-slate-400 block mb-0.5">單重配給</span>
                          <span className="font-semibold text-slate-700">
                            {p.totalBags} 包 / <span className="font-mono">{p.totalWeightCatty.toLocaleString()} 台斤</span>
                          </span>
                        </div>
                        <div className="text-xs">
                          <span className="text-slate-400 block mb-0.5">收貨單價</span>
                          <span className="font-semibold text-slate-700 font-mono">${p.price} / 台斤</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-slate-400 block mb-0.5">收購付款</span>
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                            p.paymentStatus === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {p.paymentStatus === 'paid' ? '已結清' : '未結清'}
                          </span>
                        </div>
                        <div className="text-xs col-span-2">
                          <span className="text-slate-400 block mb-0.5">運送人員 & 運費結清</span>
                          <span className="font-semibold text-slate-700 text-xs flex items-center space-x-1.5">
                            <span>{p.transporterName || '未指定'}</span>
                            <span className={`inline-flex items-center rounded-md px-1.5 py-0.2 text-[10px] font-semibold ${
                              p.transporterFeeStatus === 'paid'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                : 'bg-rose-50 text-rose-600 border border-rose-100'
                            }`}>
                              {p.transporterFeeStatus === 'paid' ? '運費已結' : '運費未結'}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Cost total sum & QR code popup trigger */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="text-xs">
                          <span className="text-slate-400 block mb-0.5">累計收費</span>
                          <span className="text-base font-black text-amber-600 font-mono">
                            ${totalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })} 元
                          </span>
                        </div>

                        {/* Open Label dialog button */}
                        <button
                          onClick={() => setActiveQrRecord(p)}
                          className="flex items-center space-x-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition cursor-pointer"
                        >
                          <QrCode className="h-4.5 w-4.5 text-slate-500" />
                          <span>溯源條碼</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR LABEL POPUP MODAL */}
      <AnimatePresence>
        {activeQrRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-amber-50/90 rounded-2xl p-6 border border-amber-100 shadow-2xl overflow-hidden"
            >
              {/* Decorative top pattern */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-600 to-amber-700" />

              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">花生履歷追蹤條碼</h3>
                  <p className="text-xs text-amber-800/80 mt-1">
                    每批農作物收購均有專屬二維標誌標記來源。
                  </p>
                </div>
                <button
                  onClick={() => setActiveQrRecord(null)}
                  className="rounded-lg bg-white/80 border border-slate-200 p-1.5 text-slate-400 hover:text-slate-700 shadow-sm"
                >
                  <span className="text-xs font-bold leading-none px-1">✕</span>
                </button>
              </div>

              {/* QR Image Frame */}
              <div className="flex flex-col items-center justify-center bg-white rounded-xl py-6 border border-orange-100/50 my-4 shadow-sm">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="Farmer QR Code" className="w-48 h-48 border border-slate-100 rounded-lg p-1" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-slate-50 rounded-lg">
                    <RefreshCw className="h-6 w-6 text-slate-400 animate-spin" />
                  </div>
                )}
                <span className="text-xs font-mono text-slate-400 mt-3 select-all">
                  批號: {activeQrRecord.id}
                </span>
              </div>

              {/* Data Summary Grid */}
              <div className="rounded-xl border border-amber-200/50 bg-amber-100/35 p-4 space-y-2 mb-5">
                <div className="flex justify-between text-xs border-b border-amber-200/40 pb-1.5">
                  <span className="font-semibold text-slate-500">來源農民：</span>
                  <span className="font-bold text-slate-800 flex items-center">
                    {activeQrRecord.farmerName}
                    {activeQrRecord.isResume && (
                      <span className="ml-1.5 inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                        履歷
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-xs border-b border-amber-200/40 pb-1.5">
                  <span className="font-semibold text-slate-500">作物種類：</span>
                  <span className="font-bold text-slate-800">{activeQrRecord.variety}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-amber-200/40 pb-1.5">
                  <span className="font-semibold text-slate-500">收購體量：</span>
                  <span className="font-bold text-slate-800">{activeQrRecord.totalBags} 包 / {activeQrRecord.totalWeightCatty} 台斤</span>
                </div>
                <div className="flex justify-between text-xs border-b border-amber-200/40 pb-1.5">
                  <span className="font-semibold text-slate-500">存放地點：</span>
                  <span className="font-bold text-slate-800">{activeQrRecord.storageLocation}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-500">收購日期：</span>
                  <span className="font-mono text-slate-700">{activeQrRecord.date}</span>
                </div>
              </div>

              {/* Action Buttons inside Dialog */}
              <div className="flex space-x-3">
                <button
                  id="print-label-btn"
                  onClick={handlePrint}
                  disabled={!qrCodeUrl}
                  className="flex-1 flex items-center justify-center space-x-2 rounded-xl bg-amber-700 hover:bg-amber-800 py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98]"
                >
                  <Printer className="h-4 w-4" />
                  <span>列印防水標籤</span>
                </button>
                <button
                  onClick={() => setActiveQrRecord(null)}
                  className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-5 text-sm font-semibold text-slate-600 transition"
                >
                  關閉
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
