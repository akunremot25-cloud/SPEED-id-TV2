import { Subscriber, SubscriptionStatus, VerificationResult } from '../types/subscriber';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

const API_BASE = '/api';

// Generate unique formatted code: SPEED-XXXX-XXXX
export function generateRandomCode(prefix: string = 'SPEED'): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude ambiguous chars like 0/O, 1/I
  const segment = (len: number) => {
    let res = '';
    for (let i = 0; i < len; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };
  return `${prefix}-${segment(4)}-${segment(4)}`;
}

// Full two-way synchronization between Local Server and Cloud Firestore
export async function syncAllSubscribers(): Promise<{ count: number; serverCount: number; firestoreCount: number }> {
  let serverList: Subscriber[] = [];
  try {
    const res = await fetch(`${API_BASE}/subscribers`);
    if (res.ok) {
      serverList = await res.json();
    }
  } catch (err) {
    console.warn('Gagal memuat list subscriber server:', err);
  }

  const mergedMap = new Map<string, Subscriber>();
  serverList.forEach((s) => mergedMap.set(s.id, s));

  let fsList: Subscriber[] = [];
  try {
    const snap = await getDocs(collection(db, 'subscribers'));
    snap.docs.forEach((d) => {
      const data = d.data() as Subscriber;
      fsList.push(data);
      if (!mergedMap.has(d.id)) {
        mergedMap.set(d.id, data);
      } else {
        const prev = mergedMap.get(d.id)!;
        mergedMap.set(d.id, {
          ...prev,
          ...data,
        });
      }
    });

    // Write all merged subscribers to Firestore in batch
    const batch = writeBatch(db);
    Array.from(mergedMap.values()).forEach((sub) => {
      batch.set(doc(db, 'subscribers', sub.id), sub, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Gagal sinkronisasi batch ke Firestore:', err);
  }

  const allSubscribers = Array.from(mergedMap.values());
  // Sync merged list back to server backend
  try {
    await fetch(`${API_BASE}/subscribers/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscribers: allSubscribers }),
    });
  } catch (err) {
    console.warn('Gagal sinkronisasi data subscriber ke server:', err);
  }

  return {
    count: allSubscribers.length,
    serverCount: serverList.length,
    firestoreCount: fsList.length,
  };
}

// Fetch all subscribers with automatic Cloud Firestore sync
export async function fetchSubscribers(): Promise<Subscriber[]> {
  let serverList: Subscriber[] = [];
  try {
    const res = await fetch(`${API_BASE}/subscribers`);
    if (res.ok) {
      serverList = await res.json();
    }
  } catch (err) {
    console.warn('Gagal memuat pelanggan dari server, mencoba Firestore:', err);
  }

  // Cloud Firestore database sync
  try {
    const snap = await getDocs(collection(db, 'subscribers'));
    if (snap.empty && serverList.length > 0) {
      // Seed initial server subscribers to Firestore
      const batch = writeBatch(db);
      serverList.forEach((sub) => {
        batch.set(doc(db, 'subscribers', sub.id), sub);
      });
      await batch.commit();
    } else if (!snap.empty) {
      const fsMap = new Map<string, Subscriber>();
      snap.docs.forEach((d) => {
        fsMap.set(d.id, d.data() as Subscriber);
      });

      // Keep server list up to date with any server-created items
      serverList.forEach((s) => {
        if (!fsMap.has(s.id)) {
          fsMap.set(s.id, s);
        }
      });

      serverList = Array.from(fsMap.values());

      // Sync merged result back to server so server DB remains complete
      fetch(`${API_BASE}/subscribers/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscribers: serverList }),
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('Firestore subscribers sync note:', err);
  }

  // Sort: active first, then most recently created
  return serverList.sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

// Create new subscriber with activation code
export async function createSubscriber(data: Omit<Subscriber, 'id' | 'createdAt'>): Promise<Subscriber> {
  const id = `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newSub: Subscriber = {
    ...data,
    id,
    createdAt: new Date().toISOString(),
  };

  // 1. Save to server backend
  try {
    await fetch(`${API_BASE}/subscribers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSub),
    });
  } catch (err) {
    console.warn('Gagal simpan ke server lokal:', err);
  }

  // 2. Save to Cloud Firestore
  try {
    await setDoc(doc(db, 'subscribers', id), newSub);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `subscribers/${id}`);
  }

  return newSub;
}

// Update subscriber (status toggle, extend expiry, edit details)
export async function updateSubscriber(id: string, updates: Partial<Subscriber>): Promise<Subscriber> {
  let updatedSub: Subscriber | null = null;

  // 1. Update in local server backend
  try {
    const res = await fetch(`${API_BASE}/subscribers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const json = await res.json();
      updatedSub = json.subscriber;
    }
  } catch (err) {
    console.warn('Gagal perbarui di server lokal:', err);
  }

  // 2. Update in Cloud Firestore
  try {
    await setDoc(doc(db, 'subscribers', id), updates, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `subscribers/${id}`);
  }

  if (updatedSub) return updatedSub;

  return {
    id,
    code: updates.code || '',
    name: updates.name || '',
    status: (updates.status || 'active') as SubscriptionStatus,
    package: (updates.package || 'all'),
    createdAt: updates.createdAt || new Date().toISOString(),
    expiresAt: updates.expiresAt || 'permanent',
    deviceLimit: updates.deviceLimit || 1,
    ...updates,
  };
}

// Toggle status (Active <-> Disabled)
export async function toggleSubscriberStatus(id: string, currentStatus: SubscriptionStatus): Promise<SubscriptionStatus> {
  const nextStatus: SubscriptionStatus = currentStatus === 'active' ? 'disabled' : 'active';
  await updateSubscriber(id, { status: nextStatus });
  return nextStatus;
}

// Delete subscriber
export async function deleteSubscriber(id: string, code?: string): Promise<boolean> {
  // 1. Delete from server
  try {
    const res = await fetch(`${API_BASE}/subscribers/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 404) {
      console.warn(`Server status saat hapus subscriber: ${res.status}`);
    }
  } catch (err) {
    console.warn('Gagal hapus dari server lokal:', err);
  }

  // 2. Delete from Cloud Firestore
  try {
    await deleteDoc(doc(db, 'subscribers', id));
  } catch (err) {
    console.warn('Firestore delete note:', err);
  }

  // If code is provided and distinct from id, ensure any doc indexed by code is also removed
  if (code && code !== id) {
    try {
      await deleteDoc(doc(db, 'subscribers', code));
    } catch {
      // ignore
    }
  }

  return true;
}

// Verify activation code from viewer client
export async function verifyActivationCode(rawCode: string): Promise<VerificationResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) {
    return { valid: false, reason: 'Kode aktivasi tidak boleh kosong.' };
  }

  try {
    const res = await fetch(`${API_BASE}/subscribers/verify?code=${encodeURIComponent(code)}`);
    if (res.ok) {
      const data: VerificationResult = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Verifikasi server gagal, cek cache Firestore:', err);
  }

  // Fallback: check Firestore directly
  try {
    const snap = await getDocs(collection(db, 'subscribers'));
    const matched = snap.docs
      .map((d) => d.data() as Subscriber)
      .find((s) => s.code.toUpperCase() === code);

    if (!matched) {
      return { valid: false, reason: 'Kode aktivasi tidak ditemukan atau salah.' };
    }

    if (matched.status === 'disabled') {
      return {
        valid: false,
        subscriber: matched,
        reason: 'Akses siaran Anda telah DINONAKTIFKAN oleh administrator.',
      };
    }

    if (matched.expiresAt && matched.expiresAt !== 'permanent') {
      const expiry = new Date(matched.expiresAt).getTime();
      const now = Date.now();
      if (now > expiry) {
        return {
          valid: false,
          subscriber: matched,
          reason: 'Masa aktif kode aktivasi Anda telah berakhir (Kedaluwarsa). Hubungi admin untuk perpanjangan.',
        };
      }
      const remainingDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      return { valid: true, subscriber: matched, remainingDays };
    }

    return { valid: true, subscriber: matched, remainingDays: 9999 };
  } catch (err) {
    return { valid: false, reason: 'Gagal memverifikasi kode dengan database.' };
  }
}
