import { Channel, TvheadendServerConfig, TunerStatus } from '../types/tvheadend';

export const API_BASE = '/api';

export async function fetchServerHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Gagal memeriksa kesehatan server');
  return res.json();
}

export async function fetchChannels(): Promise<Channel[]> {
  try {
    const res = await fetch(`${API_BASE}/tvheadend/channels`);
    if (!res.ok) throw new Error('Gagal mengambil daftar saluran');
    const data: Channel[] = await res.json();
    
    // Merge favorites from localStorage if present
    const savedFavs = JSON.parse(localStorage.getItem('tvh_favorites') || '[]');
    return data.map(ch => ({
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
    throw new Error(err.error || 'Gagal menambahkan saluran');
  }
  const result = await res.json();
  return result.channel;
}

export async function updateChannel(id: string, updates: Partial<Channel>): Promise<Channel> {
  const res = await fetch(`${API_BASE}/tvheadend/channels/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal memperbarui saluran');
  }
  const result = await res.json();
  return result.channel;
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
    throw new Error(err.error || 'Gagal mengimpor playlist M3U');
  }
  return res.json();
}

export function getProxyStreamUrl(originalUrl: string): string {
  // If already relative proxy url, return it
  if (originalUrl.startsWith('/api/proxy/stream')) return originalUrl;
  return `${API_BASE}/proxy/stream?url=${encodeURIComponent(originalUrl)}`;
}
