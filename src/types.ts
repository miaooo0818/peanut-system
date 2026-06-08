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
}

export interface ShellingBatch {
  id: string; // Shelling batch ID
  date: string; // 脫殼日期 (YYYY-MM-DD)
  sourceBatchIds: string[]; // Purchase IDs used as raw materials
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
