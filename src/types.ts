/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PurchaseRecord {
  id: string; // The purchase transaction ID
  farmerName: string; // 農民名字
  location: string; // 收購地點
  date: string; // 日期 (YYYY-MM-DD)
  variety: string; // 花生品種
  price: number; // 單價 (元 / 台斤)
  totalBags: number; // 收購總數量 (包)
  totalWeightCatty: number; // 收購總重量 (台斤)
  storageLocation: string; // 存放地點
  createdAt: string; // ISO String or ISO date-time representation
  updatedAt: string; // ISO String
  isSynced?: boolean; // True if saved to Firebase, false if temporarily in offline storage
  isResume?: boolean; // 是否為「履歷」
  paymentStatus?: 'paid' | 'unpaid' | string; // 收購付款狀態: 'paid' (已結清) 或 'unpaid' (未結清)
  transporterName?: string; // 運送人員姓名
  transporterFeeStatus?: 'paid' | 'unpaid' | string; // 運送人員費用結清狀態: 'paid' (已結清) 或 'unpaid' (未結清)
}

export interface ShellingBatch {
  id: string; // Shelling batch ID
  date: string; // 脫殼日期 (YYYY-MM-DD)
  sourceBatchIds: string[]; // Purchase IDs used as raw materials
  sourceBagsUsed?: Record<string, number>; // Map of purchase record id -> quantity of bags used in this batch
  outputWeightKg: number; // 總產出重量 (公斤)
  recoveryRate: number; // 成品率 (%)
  moisture: number; // 測量水分 (%)
  createdAt: string;
  updatedAt: string;
}

export interface AdminSetting {
  adminPasswordHash: string; // SHA-256 hash or equivalent
  isConfigured: boolean;
}
