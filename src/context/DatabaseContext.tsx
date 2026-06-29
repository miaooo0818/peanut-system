/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  getDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { PurchaseRecord, ShellingBatch, AdminSetting } from '../types';
import { hashPassword } from '../utils/crypto';

interface DatabaseContextType {
  purchases: PurchaseRecord[];
  shellingBatches: ShellingBatch[];
  adminSetting: AdminSetting | null;
  isOnline: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  varieties: string[];
  storageLocations: string[];
  transporters: string[];
  // Actions
  addPurchase: (record: Omit<PurchaseRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PurchaseRecord>;
  updatePurchase: (id: string, updates: Partial<PurchaseRecord>) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
  addShellingBatch: (batch: Omit<ShellingBatch, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ShellingBatch>;
  deleteShellingBatch: (id: string) => Promise<void>;
  setupAdminPassword: (password: string) => Promise<void>;
  verifyAdminPassword: (password: string) => Promise<boolean>;
  triggerManualSync: () => Promise<number>;
  updateOptions: (varieties: string[], storageLocations: string[], transporters?: string[]) => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [shellingBatches, setShellingBatches] = useState<ShellingBatch[]>([]);
  const [adminSetting, setAdminSetting] = useState<AdminSetting | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [varieties, setVarieties] = useState<string[]>(() => {
    try {
      const v = localStorage.getItem('peanut_varieties');
      if (v) {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed)) return parsed;
      }
      return ['台南14號', '黑金剛', '台南9號', '紅莞香'];
    } catch {
      return ['台南14號', '黑金剛', '台南9號', '紅莞香'];
    }
  });

  const [storageLocations, setStorageLocations] = useState<string[]>(() => {
    try {
      const l = localStorage.getItem('peanut_storage_locations');
      if (l) {
        const parsed = JSON.parse(l);
        if (Array.isArray(parsed)) return parsed;
      }
      return ['冷藏庫1號', '冷藏庫2號', 'A棟倉庫', 'B棟倉庫'];
    } catch {
      return ['冷藏庫1號', '冷藏庫2號', 'A棟倉庫', 'B棟倉庫'];
    }
  });

  const [transporters, setTransporters] = useState<string[]>(() => {
    try {
      const t = localStorage.getItem('peanut_transporters');
      if (t) {
        const parsed = JSON.parse(t);
        if (Array.isArray(parsed)) return parsed;
      }
      return ['陳司機', '張司機', '林司機', '王司機'];
    } catch {
      return ['陳司機', '張司機', '林司機', '王司機'];
    }
  });

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      attemptAutoSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync real-time data from Firestore when online
  useEffect(() => {
    setIsLoading(true);
    
    // Purchases Subscriber
    const purchasesQuery = query(collection(db, 'purchases'), orderBy('date', 'desc'));
    const unsubscribePurchases = onSnapshot(
      purchasesQuery, 
      (snapshot) => {
        const remotePurchases: PurchaseRecord[] = [];
        snapshot.forEach((doc) => {
          remotePurchases.push({ id: doc.id, ...doc.data() } as PurchaseRecord);
        });

        // Blend in local unsynced records
        setPurchases((prev) => {
          const localOnly = getLocalPurchases().filter(lp => lp.isSynced === false);
          // Remove local duplicates if they exist in remote
          const remoteIds = new Set(remotePurchases.map(p => p.id));
          const filteredLocal = localOnly.filter(lp => !remoteIds.has(lp.id));
          
          const combined = [...filteredLocal, ...remotePurchases];
          // Sort by date desc, then by createdAt desc for sub-ordering
          return combined.sort((a, b) => {
            const dateCompare = b.date.localeCompare(a.date);
            if (dateCompare !== 0) return dateCompare;
            return b.createdAt.localeCompare(a.createdAt);
          });
        });
        setIsLoading(false);
      },
      (error) => {
        console.error("Firestore purchases stream error:", error);
        // On error, fall back strictly to local storage lists to keep system interactive
        const local = getLocalPurchases();
        setPurchases(local);
        setIsLoading(false);
      }
    );

    // Shelling Batches Subscriber
    const shellingQuery = query(collection(db, 'shelling_batches'), orderBy('date', 'desc'));
    const unsubscribeShelling = onSnapshot(
      shellingQuery,
      (snapshot) => {
        const batches: ShellingBatch[] = [];
        snapshot.forEach((doc) => {
          batches.push({ id: doc.id, ...doc.data() } as ShellingBatch);
        });
        setShellingBatches(batches);
      },
      (error) => {
        console.error("Firestore shelling_batches stream error:", error);
        const local = getLocalShelling();
        setShellingBatches(local);
      }
    );

    // Admin Settings Subscriber
    const adminDocRef = doc(db, 'settings', 'admin');
    const unsubscribeAdmin = onSnapshot(
      adminDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setAdminSetting(docSnap.data() as AdminSetting);
        } else {
          setAdminSetting({ adminPasswordHash: '', isConfigured: false });
        }
      },
      (error) => {
        console.error("Firestore Settings admin error:", error);
        // Fallback setting locally
        const cachedHash = localStorage.getItem('local_admin_password_hash');
        if (cachedHash) {
          setAdminSetting({ adminPasswordHash: cachedHash, isConfigured: true });
        } else {
          setAdminSetting({ adminPasswordHash: '', isConfigured: false });
        }
      }
    );

    // Options Subscriber
    const optionsDocRef = doc(db, 'settings', 'options');
    const unsubscribeOptions = onSnapshot(
      optionsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data) {
            if (Array.isArray(data.varieties)) {
              setVarieties(data.varieties);
              localStorage.setItem('peanut_varieties', JSON.stringify(data.varieties));
            }
            if (Array.isArray(data.storageLocations)) {
              setStorageLocations(data.storageLocations);
              localStorage.setItem('peanut_storage_locations', JSON.stringify(data.storageLocations));
            }
            if (Array.isArray(data.transporters)) {
              setTransporters(data.transporters);
              localStorage.setItem('peanut_transporters', JSON.stringify(data.transporters));
            }
          }
        }
      },
      (error) => {
        console.error("Firestore Settings options error:", error);
      }
    );

    return () => {
      unsubscribePurchases();
      unsubscribeShelling();
      unsubscribeAdmin();
      unsubscribeOptions();
    };
  }, []);

  // Helper functions for LocalStorage management
  const getLocalPurchases = (): PurchaseRecord[] => {
    try {
      const p = localStorage.getItem('peanut_purchases');
      return p ? JSON.parse(p) : [];
    } catch {
      return [];
    }
  };

  const saveLocalPurchases = (list: PurchaseRecord[]) => {
    try {
      localStorage.setItem('peanut_purchases', JSON.stringify(list));
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
    }
  };

  const getLocalShelling = (): ShellingBatch[] => {
    try {
      const s = localStorage.getItem('peanut_shelling');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  };

  const saveLocalShelling = (list: ShellingBatch[]) => {
    try {
      localStorage.setItem('peanut_shelling', JSON.stringify(list));
    } catch (e) {
      console.error("Failed to save shelling records to localStorage:", e);
    }
  };

  // Add a Purchase Record
  const addPurchase = async (record: Omit<PurchaseRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<PurchaseRecord> => {
    const id = `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const nowStr = new Date().toISOString();
    
    const newRecord: PurchaseRecord = {
      ...record,
      id,
      createdAt: nowStr,
      updatedAt: nowStr,
      isSynced: false
    };

    // 1. Immediately save to local storage for instant frontend rendering & offline safety
    const localList = getLocalPurchases();
    const updatedLocalList = [newRecord, ...localList];
    saveLocalPurchases(updatedLocalList);

    // Update state immediately so UI updates instantly
    setPurchases(updatedLocalList);

    // 2. Try saving to Firestore if online
    if (isOnline) {
      try {
        const { isSynced, ...firestorePayload } = newRecord;
        await setDoc(doc(db, 'purchases', id), {
          ...firestorePayload,
          // Firestore doesn't strictly require us to remove isSynced, but keeping db clean is nice.
        });
        
        // Mark as synced locally
        const syncedList = getLocalPurchases().map(p => p.id === id ? { ...p, isSynced: true } : p);
        saveLocalPurchases(syncedList);
        
        // Sync our react state
        setPurchases(syncedList);
        newRecord.isSynced = true;
      } catch (err) {
        // If write fails, it is silent – remaining labeled as isSynced: false
        console.warn("Failed to write to firestore, stored offline locally.", err);
      }
    }

    return newRecord;
  };

  // Update a Purchase Record
  const updatePurchase = async (id: string, updates: Partial<PurchaseRecord>): Promise<void> => {
    const nowStr = new Date().toISOString();
    
    // 1. Update localStorage list
    const currentLocal = getLocalPurchases();
    const updatedLocal = currentLocal.map(p => {
      if (p.id === id) {
        return {
          ...p,
          ...updates,
          updatedAt: nowStr,
          isSynced: false // mark as requiring re-sync
        };
      }
      return p;
    });
    saveLocalPurchases(updatedLocal);
    setPurchases(updatedLocal);

    // 2. Try Firestore Update
    if (isOnline) {
      try {
        const targetRecord = updatedLocal.find(p => p.id === id);
        if (targetRecord) {
          const { isSynced, ...firestorePayload } = targetRecord;
          await setDoc(doc(db, 'purchases', id), firestorePayload, { merge: true });
          
          // Set as synced
          const syncedLocal = getLocalPurchases().map(p => p.id === id ? { ...p, isSynced: true } : p);
          saveLocalPurchases(syncedLocal);
          setPurchases(syncedLocal);
        }
      } catch (err) {
        console.warn("Firestore update postponed (offline state):", err);
      }
    }
  };

  // Delete a Purchase Record
  const deletePurchase = async (id: string): Promise<void> => {
    // 1. Remove from local storage
    const currentLocal = getLocalPurchases();
    const updatedLocal = currentLocal.filter(p => p.id !== id);
    saveLocalPurchases(updatedLocal);
    setPurchases(updatedLocal);

    // 2. Remove from Firestore
    if (isOnline) {
      try {
        await deleteDoc(doc(db, 'purchases', id));
      } catch (err) {
        console.warn("Firestore delete postponed/failed:", err);
      }
    }
  };

  // Add shelling batch operation
  const addShellingBatch = async (batch: Omit<ShellingBatch, 'id' | 'createdAt' | 'updatedAt'>): Promise<ShellingBatch> => {
    const id = `s-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const nowStr = new Date().toISOString();

    const newBatch: ShellingBatch = {
      ...batch,
      id,
      createdAt: nowStr,
      updatedAt: nowStr
    };

    // 1. Save locally
    const currentLocal = getLocalShelling();
    const updatedLocal = [newBatch, ...currentLocal];
    saveLocalShelling(updatedLocal);
    setShellingBatches(updatedLocal);

    // 2. Write to Firestore if online
    if (isOnline) {
      try {
        await setDoc(doc(db, 'shelling_batches', id), newBatch);
      } catch (err) {
        console.warn("Shelling batch saved offline:", err);
      }
    }

    return newBatch;
  };

  // Delete Shelling Batch
  const deleteShellingBatch = async (id: string): Promise<void> => {
    const currentLocal = getLocalShelling();
    const updatedLocal = currentLocal.filter(b => b.id !== id);
    saveLocalShelling(updatedLocal);
    setShellingBatches(updatedLocal);

    if (isOnline) {
      try {
        await deleteDoc(doc(db, 'shelling_batches', id));
      } catch (err) {
        console.warn("Firestore shelling batch delete failed (offline):", err);
      }
    }
  };

  // Set up Admin Password
  const setupAdminPassword = async (password: string): Promise<void> => {
    const hash = await hashPassword(password);
    
    // Save locally
    localStorage.setItem('local_admin_password_hash', hash);
    setAdminSetting({ adminPasswordHash: hash, isConfigured: true });

    // Write to Firestore if online
    if (isOnline) {
      try {
        await setDoc(doc(db, 'settings', 'admin'), {
          adminPasswordHash: hash,
          isConfigured: true
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'settings/admin');
      }
    }
  };

  // Verify Admin Password
  const verifyAdminPassword = async (password: string): Promise<boolean> => {
    const inputHash = await hashPassword(password);
    
    // Check in remote configuration if online, else check local backup
    let actualHash = '';
    if (isOnline) {
      try {
        const snap = await getDoc(doc(db, 'settings', 'admin'));
        if (snap.exists()) {
          actualHash = (snap.data() as AdminSetting).adminPasswordHash;
        }
      } catch (err) {
        console.warn("Could not fetch remote password configuration, checking local.", err);
      }
    }

    if (!actualHash) {
      actualHash = adminSetting?.adminPasswordHash || localStorage.getItem('local_admin_password_hash') || '';
    }

    return inputHash === actualHash;
  };

  // Manual & Auto-sync executor
  const triggerManualSync = async (): Promise<number> => {
    if (!isOnline) {
      throw new Error('無法同步：無網路連線');
    }

    setIsSyncing(true);
    let syncCount = 0;

    try {
      // 1. Sync purchases
      const localOnlyPurchases = getLocalPurchases().filter(p => p.isSynced === false);
      for (const record of localOnlyPurchases) {
        const { isSynced, ...firestorePayload } = record;
        await setDoc(doc(db, 'purchases', record.id), firestorePayload);
        syncCount++;
      }

      // Re-mark all purchases as synced locally
      const updatedLocalPurchases = getLocalPurchases().map(p => ({ ...p, isSynced: true }));
      saveLocalPurchases(updatedLocalPurchases);
      
      // 2. Sync shelling batches to ensure everything has been backed up in Firestore
      const localShelling = getLocalShelling();
      for (const batch of localShelling) {
        await setDoc(doc(db, 'shelling_batches', batch.id), batch);
      }

      // 3. Make sure admin settings are synced as well
      const localAdminHash = localStorage.getItem('local_admin_password_hash');
      if (localAdminHash && adminSetting && !adminSetting.isConfigured) {
        await setDoc(doc(db, 'settings', 'admin'), {
          adminPasswordHash: localAdminHash,
          isConfigured: true
        });
      }

      console.log(`Successfully synchronized ${syncCount} pending records to Firestore.`);
    } catch (e) {
      console.error("Synchronization experienced errors:", e);
    } finally {
      setIsSyncing(false);
    }

    return syncCount;
  };

  const attemptAutoSync = () => {
    // Run sync in back-ground without showing blocking progress bars
    const pendingCount = getLocalPurchases().filter(p => !p.isSynced).length;
    if (pendingCount > 0) {
      triggerManualSync().catch(err => console.warn("Auto-sync failed in background:", err));
    }
  };

  // Update Options Action
  const updateOptions = async (newVarieties: string[], newStorageLocations: string[], newTransporters?: string[]): Promise<void> => {
    const finalTransporters = newTransporters !== undefined ? newTransporters : transporters;
    setVarieties(newVarieties);
    setStorageLocations(newStorageLocations);
    setTransporters(finalTransporters);
    localStorage.setItem('peanut_varieties', JSON.stringify(newVarieties));
    localStorage.setItem('peanut_storage_locations', JSON.stringify(newStorageLocations));
    localStorage.setItem('peanut_transporters', JSON.stringify(finalTransporters));

    if (isOnline) {
      try {
        await setDoc(doc(db, 'settings', 'options'), {
          varieties: newVarieties,
          storageLocations: newStorageLocations,
          transporters: finalTransporters
        });
      } catch (err) {
        console.warn("Offline option saving:", err);
      }
    }
  };

  return (
    <DatabaseContext.Provider value={{
      purchases,
      shellingBatches,
      adminSetting,
      isOnline,
      isLoading,
      isSyncing,
      varieties,
      storageLocations,
      transporters,
      addPurchase,
      updatePurchase,
      deletePurchase,
      addShellingBatch,
      deleteShellingBatch,
      setupAdminPassword,
      verifyAdminPassword,
      triggerManualSync,
      updateOptions
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};
