import { Channel, TvheadendServerConfig, TunerStatus } from '../types/tvheadend';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

export const API_BASE = '/api';

export async function fetchServerHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Gagal memeriksa kesehatan server');
  return res.json();
}

export async function fetchChannels(): Promise<Channel[]> {
  try {
    let serverChannels: Channel[] = [];
    try {
      const res = await fetch(`${API_BASE}/tvheadend/channels`);
      if (res.ok) {
        serverChannels = await res.json();
      }
    } catch (err) {
      console.warn('Gagal mengambil daftar dari server local, mencoba Firestore:', err);
    }

    // Sync with Cloud Firestore persistent database
    try {
      const snap = await getDocs(collection(db, 'channels'));
      if (snap.empty && serverChannels.length > 0) {
        // First boot: Seed initial channels to Firestore in background
        const batch = writeBatch(db);
        serverChannels.forEach((ch) => {
          const { epgCurrent, epgNext, ...saveData } = ch;
          batch.set(doc(db, 'channels', ch.id), {
            ...saveData,
            number: Number(saveData.number) || 1,
            fps: Number(saveData.fps) || 30,
            bitrateKbps: Number(saveData.bitrateKbps) || 2500,
            updatedAt: new Date().toISOString(),
          });
        });
        await batch.commit();
      } else if (!snap.empty) {
        // Persistent database exists in Firestore: load user changes!
        const mergedMap = new Map<string, Channel>();

        // 1. Add all from Firestore with auto-upgrade for stale test/placeholder streams
        const toUpdateInFirestore: Channel[] = [];
        snap.docs.forEach((docSnap) => {
          const fsData = docSnap.data() as Channel;
          const matchServer = serverChannels.find((s) => s.id === docSnap.id);

          let streamUrl = fsData.streamUrl;
          let name = fsData.name;
          let logo = fsData.logo;

          // Auto-upgrade stale dummy/test streams or outdated streams in Firestore to current active streams
          const isStalePlaceholder = !streamUrl || 
            streamUrl.includes('test-streams.mux.dev') || 
            streamUrl.includes('dwamdstream102') || 
            streamUrl.includes('static.france24.com') ||
            streamUrl.includes('rbmn-live') ||
            streamUrl.includes('103.58.160.157') ||
            streamUrl.includes('ntv1.akamaized');

          const hasNewerServerStream = matchServer?.streamUrl && (
            matchServer.streamUrl.includes('202.150.172.59') ||
            matchServer.streamUrl.includes('dens.tv') ||
            matchServer.streamUrl.includes('detik.com')
          ) && streamUrl !== matchServer.streamUrl;

          if ((isStalePlaceholder || hasNewerServerStream) && matchServer?.streamUrl) {
            streamUrl = matchServer.streamUrl;
            if (matchServer.logo) logo = matchServer.logo;
            if (matchServer.name) name = matchServer.name;
          }

          const resolvedChannel: Channel = {
            ...(matchServer || {}),
            ...fsData,
            name,
            logo,
            streamUrl,
            id: docSnap.id,
            number: Number(fsData.number) || 1,
            fps: Number(fsData.fps) || 50,
            bitrateKbps: Number(fsData.bitrateKbps) || 3200,
          };

          if (streamUrl !== fsData.streamUrl) {
            toUpdateInFirestore.push(resolvedChannel);
          }

          mergedMap.set(docSnap.id, resolvedChannel);
        });

        // Background update upgraded channels to Firestore
        if (toUpdateInFirestore.length > 0) {
          const updateBatch = writeBatch(db);
          toUpdateInFirestore.forEach((upCh) => {
            const { epgCurrent, epgNext, ...saveData } = upCh;
            updateBatch.set(doc(db, 'channels', upCh.id), {
              ...saveData,
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          });
          updateBatch.commit().catch((e) => console.warn('Background Firestore upgrade note:', e));
        }

        // 2. Also keep any server channels not yet in Firestore
        serverChannels.forEach((sc) => {
          if (!mergedMap.has(sc.id)) {
            mergedMap.set(sc.id, sc);
          }
        });

        const mergedList = Array.from(mergedMap.values());
        mergedList.sort((a, b) => (a.number || 0) - (b.number || 0));
        serverChannels = mergedList;
      }
    } catch (fsErr) {
      console.warn('Firestore database sync note:', fsErr);
    }

    // Merge favorites from localStorage if present
    const savedFavs = JSON.parse(localStorage.getItem('tvh_favorites') || '[]');
    return serverChannels.map((ch) => ({
      ...ch,
      isFavorite: savedFavs.includes(ch.id) || !!ch.isFavorite,
    }));
  } catch (err) {
    console.warn('Menggunakan fallback data saluran:', err);
    return [];
  }
}

export async function addCustomChannel(channel: Partial<Channel>): Promise<Channel> {
  const res = await fetch(`${API_BASE}/tvheadend/channels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(channel),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal menambahkan saluran ke database');
  }
  const result = await res.json();
  const created: Channel = result.channel;

  // Persist to Cloud Firestore database
  try {
    const { epgCurrent, epgNext, ...saveData } = created;
    await setDoc(doc(db, 'channels', created.id), {
      ...saveData,
      number: Number(saveData.number) || 1,
      fps: Number(saveData.fps) || 30,
      bitrateKbps: Number(saveData.bitrateKbps) || 2500,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `channels/${created.id}`);
  }

  return created;
}

export async function updateChannel(id: string, updates: Partial<Channel>): Promise<Channel> {
  const res = await fetch(`${API_BASE}/tvheadend/channels/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal memperbarui saluran di database');
  }
  const result = await res.json();
  const updated: Channel = result.channel;

  // Persist update to Cloud Firestore database
  try {
    const { epgCurrent, epgNext, ...saveData } = updated;
    await setDoc(
      doc(db, 'channels', id),
      {
        ...saveData,
        number: Number(saveData.number) || 1,
        fps: Number(saveData.fps) || 30,
        bitrateKbps: Number(saveData.bitrateKbps) || 2500,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `channels/${id}`);
  }

  return updated;
}

export async function testStreamReachability(url: string): Promise<{
  reachable: boolean;
  statusCode?: number;
  latencyMs: number;
  contentType?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/tvheadend/test-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return await res.json();
  } catch (err: any) {
    return {
      reachable: false,
      latencyMs: 0,
      error: err.message || 'Gagal menghubungi server',
    };
  }
}

export async function deleteChannel(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/tvheadend/channels/${id}`, {
    method: 'DELETE',
  });

  if (res.ok) {
    // Delete from Cloud Firestore database
    try {
      await deleteDoc(doc(db, 'channels', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `channels/${id}`);
    }
  }

  return res.ok;
}

export async function resetDatabaseToDefault(): Promise<boolean> {
  const res = await fetch(`${API_BASE}/tvheadend/database/reset`, {
    method: 'POST',
  });
  if (res.ok) {
    try {
      const snap = await getDocs(collection(db, 'channels'));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'channels');
    }
  }
  return res.ok;
}

export async function fetchServerConfig(): Promise<TvheadendServerConfig> {
  const res = await fetch(`${API_BASE}/tvheadend/config`);
  if (!res.ok) throw new Error('Gagal memuat konfigurasi server');
  return res.json();
}

export async function updateServerConfig(config: Partial<TvheadendServerConfig>): Promise<TvheadendServerConfig> {
  const res = await fetch(`${API_BASE}/tvheadend/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Gagal memperbarui konfigurasi server');
  const result = await res.json();
  return result.config;
}

export async function fetchTuners(): Promise<TunerStatus[]> {
  const res = await fetch(`${API_BASE}/tvheadend/tuners`);
  if (!res.ok) throw new Error('Gagal memuat status tuner');
  return res.json();
}

export async function importM3uPlaylist(content: string): Promise<{ importedCount: number; totalChannels: number }> {
  const res = await fetch(`${API_BASE}/tvheadend/import-m3u`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal mengimpor playlist M3U ke database');
  }
  const result = await res.json();

  // Sync imported channels to Cloud Firestore database
  try {
    const channelsRes = await fetch(`${API_BASE}/tvheadend/channels`);
    if (channelsRes.ok) {
      const allChannels: Channel[] = await channelsRes.json();
      const batch = writeBatch(db);
      allChannels.forEach((ch) => {
        const { epgCurrent, epgNext, ...saveData } = ch;
        batch.set(
          doc(db, 'channels', ch.id),
          {
            ...saveData,
            number: Number(saveData.number) || 1,
            fps: Number(saveData.fps) || 30,
            bitrateKbps: Number(saveData.bitrateKbps) || 2500,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      });
      await batch.commit();
    }
  } catch (syncErr) {
    console.warn('Gagal sinkronisasi saluran import M3U ke Firestore:', syncErr);
  }

  return result;
}

export function getProxyStreamUrl(originalUrl: string): string {
  if (originalUrl.startsWith('/api/proxy/stream')) return originalUrl;
  return `${API_BASE}/proxy/stream?url=${encodeURIComponent(originalUrl)}`;
}

export async function syncAllChannelsToDatabase(channels: Channel[]): Promise<{ count: number }> {
  // 1. Sync to Cloud Firestore in batch
  try {
    const batch = writeBatch(db);
    channels.forEach((ch) => {
      const { epgCurrent, epgNext, ...saveData } = ch;
      batch.set(
        doc(db, 'channels', ch.id),
        {
          ...saveData,
          number: Number(saveData.number) || 1,
          fps: Number(saveData.fps) || 30,
          bitrateKbps: Number(saveData.bitrateKbps) || 2500,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'channels');
  }

  // 2. Also persist to local server database file
  try {
    const res = await fetch(`${API_BASE}/tvheadend/channels/sync-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channels }),
    });
    if (!res.ok) {
      console.warn('Gagal sinkronisasi saluran ke server lokal');
    }
  } catch (err) {
    console.warn('Gagal menghubungi server lokal:', err);
  }

  return { count: channels.length };
}

export async function fetchProviderChannels(provider: 'all' | 'vidio' | 'rctiplus' = 'all'): Promise<{
  vidio?: Channel[];
  rctiplus?: Channel[];
  channels: Channel[];
}> {
  const res = await fetch(`${API_BASE}/proxy/providers/channels?provider=${provider}`);
  if (!res.ok) throw new Error('Gagal mengambil daftar saluran provider');
  return res.json();
}

export async function importProviderChannels(provider: 'all' | 'vidio' | 'rctiplus' = 'all'): Promise<{
  success: boolean;
  message: string;
  importedCount: number;
  totalChannels: number;
  channels: Channel[];
}> {
  const res = await fetch(`${API_BASE}/proxy/providers/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider }),
  });
  if (!res.ok) throw new Error('Gagal mengimpor saluran provider');
  const data = await res.json();

  // Also sync newly imported channels to Cloud Firestore database
  if (data.channels && data.channels.length > 0) {
    try {
      await syncAllChannelsToDatabase(data.channels);
    } catch (fsErr) {
      console.warn('Gagal sinkronisasi saluran provider ke Firestore:', fsErr);
    }
  }

  return data;
}

export async function resolveVidioRctiUrl(url: string): Promise<{
  success: boolean;
  inputUrl: string;
  channelName?: string;
  provider?: 'vidio' | 'rctiplus';
  logo?: string;
  streamUrl: string;
  proxyUrl: string;
  note?: string;
}> {
  const res = await fetch(`${API_BASE}/proxy/resolve?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error('Gagal meresolusi URL');
  return res.json();
}

