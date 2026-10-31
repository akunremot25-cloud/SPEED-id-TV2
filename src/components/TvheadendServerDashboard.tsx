import React, { useState, useEffect } from 'react';
import { 
  Server, Cpu, Activity, Signal, Radio, Check, Copy, Download, 
  Settings, Wifi, Shield, RefreshCw, Smartphone, Monitor, Database, Trash2,
  Lock, KeyRound
} from 'lucide-react';
import { TunerStatus, TvheadendServerConfig } from '../types/tvheadend';
import { 
  fetchTuners, fetchServerConfig, updateServerConfig, fetchServerHealth,
  fetchChannels, syncAllChannelsToDatabase, resetDatabaseToDefault,
  syncAdminPinWithFirestore
} from '../services/api';

interface TvheadendServerDashboardProps {
  onClose: () => void;
  onOpenStreamingProxy?: () => void;
  onOpenChangePin?: () => void;
}

export const TvheadendServerDashboard: React.FC<TvheadendServerDashboardProps> = ({ 
  onClose, 
  onOpenStreamingProxy,
  onOpenChangePin,
}) => {
  const [tuners, setTuners] = useState<TunerStatus[]>([]);
  const [config, setConfig] = useState<TvheadendServerConfig>({
    mode: 'standalone',
    host: '127.0.0.1',
    port: 9981,
    username: 'admin',
    password: '',
    streamProfile: 'webtv-h264-aac-matroska',
    useProxy: true,
    transcodingEnabled: true,
    bufferSeconds: 15,
    lowLatencyMode: true,
  });
  const [serverHealth, setServerHealth] = useState<any>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isSyncingDb, setIsSyncingDb] = useState<boolean>(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);
  const [dbNotice, setDbNotice] = useState<string | null>(null);
  const [isSyncingPin, setIsSyncingPin] = useState<boolean>(false);
  const [pinSyncNotice, setPinSyncNotice] = useState<string | null>(null);

  const playlistUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/tvheadend/playlist.m3u` : '/api/tvheadend/playlist.m3u';

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [tData, cData, hData] = await Promise.all([
        fetchTuners().catch(() => []),
        fetchServerConfig().catch(() => null),
        fetchServerHealth().catch(() => null),
      ]);
      if (tData.length) setTuners(tData);
      if (cData) setConfig(cData);
      if (hData) setServerHealth(hData);
    } catch (err) {
      console.warn('Dashboard data fetch error:', err);
    }
  };

  const handleSyncAllChannels = async () => {
    setIsSyncingDb(true);
    setDbNotice(null);
    try {
      const allCh = await fetchChannels();
      const res = await syncAllChannelsToDatabase(allCh);
      setDbNotice(`Sukses: ${res.count} saluran berhasil disimpan permanen ke Database Cloud & Server!`);
      loadData();
      setTimeout(() => setDbNotice(null), 4000);
    } catch (err: any) {
      setDbNotice(`Gagal menyimpan ke database: ${err.message || 'Error'}`);
    } finally {
      setIsSyncingDb(false);
    }
  };

  const handleResetDatabase = async () => {
    setIsSyncingDb(true);
    setConfirmResetOpen(false);
    try {
      await resetDatabaseToDefault();
      setDbNotice('Database saluran berhasil direset ke konfigurasi bawaan.');
      loadData();
      setTimeout(() => setDbNotice(null), 4000);
    } catch (err: any) {
      setDbNotice(`Gagal mereset database: ${err.message || 'Error'}`);
    } finally {
      setIsSyncingDb(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateServerConfig(config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const copyPlaylistUrl = () => {
    navigator.clipboard.writeText(playlistUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSyncPinCloud = async () => {
    setIsSyncingPin(true);
    try {
      const res = await syncAdminPinWithFirestore();
      setPinSyncNotice(res.synced ? 'PIN admin berhasil disinkronkan dengan Cloud Firestore.' : 'PIN Cloud Firestore sudah terhubung.');
      setTimeout(() => setPinSyncNotice(null), 3500);
    } catch {
      setPinSyncNotice('Gagal menyinkronkan PIN ke Cloud.');
      setTimeout(() => setPinSyncNotice(null), 3500);
    } finally {
      setIsSyncingPin(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Server Tvheadend & IPTV Hub
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                  ONLINE
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Kontrol Tuner, Transcoder Profil Mobile, dan Ekspor Playlist M3U
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenStreamingProxy && (
              <button
                onClick={() => {
                  onClose();
                  onOpenStreamingProxy();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Radio className="w-3.5 h-3.5 text-indigo-400" />
                <span>Buka Streaming Proxy</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Server Resource Stats */}
          {serverHealth && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block mb-1 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                  Status Server
                </span>
                <span className="font-bold text-white text-sm capitalize">{serverHealth.serverMode}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block mb-1 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  Memori RAM
                </span>
                <span className="font-bold text-white text-sm">{serverHealth.memoryRssMb} MB</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block mb-1 flex items-center gap-1">
                  <Signal className="w-3.5 h-3.5 text-amber-400" />
                  Tuner Aktif
                </span>
                <span className="font-bold text-white text-sm">{serverHealth.activeTuners} / 3 Online</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block mb-1 flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-purple-400" />
                  Total Saluran
                </span>
                <span className="font-bold text-white text-sm">{serverHealth.channelCount} Siaran</span>
              </div>
            </div>
          )}

          {/* Tuners Grid */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Signal className="w-4 h-4 text-emerald-400" />
              Status Tuner Siaran (Hardware & Virtual IPTV)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tuners.map((tuner) => (
                <div
                  key={tuner.id}
                  className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-[200px]">
                      {tuner.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        tuner.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {tuner.status}
                    </span>
                  </div>

                  {tuner.activeChannel && (
                    <p className="text-xs text-blue-300 font-medium">
                      Menyiarkan: <span className="text-white">{tuner.activeChannel}</span>
                    </p>
                  )}

                  {/* Signal & SNR meters */}
                  <div className="space-y-1.5 mt-1">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                        <span>Kekuatan Sinyal</span>
                        <span>{tuner.signalStrength}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${tuner.signalStrength}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>SNR: <strong className="text-slate-200">{tuner.snrDb} dB</strong></span>
                      <span>Bitrate: <strong className="text-slate-200">{tuner.bitrateMbps} Mbps</strong></span>
                      <span>Klien: <strong className="text-slate-200">{tuner.clientCount}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Security PIN & Panel Lock Status */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  Kunci Keamanan Panel Administrator
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/20">
                    Aktif Terproteksi
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20 flex items-center gap-1">
                    <Database className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Cloud Sync</span>
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  Panel pengelola terkunci dengan PIN sandi. PIN bawaan pertama: <strong className="text-amber-300 font-mono">123456</strong>
                </p>
                {pinSyncNotice && (
                  <p className="text-xs text-emerald-300 font-medium mt-1 animate-in fade-in">
                    {pinSyncNotice}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncPinCloud}
                disabled={isSyncingPin}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow active:scale-95 transition-all cursor-pointer"
                title="Sinkronkan status PIN dengan Cloud Firestore"
              >
                <Database className={`w-3.5 h-3.5 text-emerald-400 ${isSyncingPin ? 'animate-spin' : ''}`} />
                <span>{isSyncingPin ? 'Menyinkronkan...' : 'Sinkronkan PIN Cloud'}</span>
              </button>
              {onOpenChangePin && (
                <button
                  type="button"
                  onClick={onOpenChangePin}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow active:scale-95 transition-all cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Ubah PIN Admin</span>
                </button>
              )}
            </div>
          </div>

          {/* M3U Playlist Export for External Mobile Apps (VLC / TiviMate) */}
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  Integrasi Pemutar Mobile (VLC, TiviMate, OTT Navigator)
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Gunakan URL playlist M3U ini pada aplikasi IPTV favorit Anda di Android, iOS, atau Smart TV.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={playlistUrl}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-blue-300 font-mono select-all focus:outline-none"
              />
              <button
                onClick={copyPlaylistUrl}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 active:scale-95 shadow transition-all shrink-0"
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? 'Tersalin' : 'Salin URL'}
              </button>
              <a
                href="/api/tvheadend/playlist.m3u"
                download="tvheadend-mobile.m3u"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors shrink-0"
                title="Download file .M3U"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Database Cloud Firestore Section */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Database Cloud Firestore
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                      Tersambung
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Database ID: <span className="font-mono text-slate-300">ai-studio-speedidtv</span> • Sinkronisasi otomatis data saluran siaran
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncAllChannels}
                  disabled={isSyncingDb}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  title="Simpan seluruh data saluran saat ini ke Database Cloud Firestore"
                >
                  <Database className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />
                  <span>{isSyncingDb ? 'Menyimpan...' : 'Simpan Semua Saluran ke DB'}</span>
                </button>

                {confirmResetOpen ? (
                  <div className="flex items-center gap-1.5 bg-rose-950/40 border border-rose-500/40 px-2.5 py-1 rounded-xl">
                    <span className="text-[11px] text-rose-300 font-medium">Reset semua?</span>
                    <button
                      type="button"
                      onClick={handleResetDatabase}
                      disabled={isSyncingDb}
                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-bold shadow"
                    >
                      {isSyncingDb ? 'Resetting...' : 'Ya'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmResetOpen(false)}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmResetOpen(true)}
                    disabled={isSyncingDb}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
                    title="Reset seluruh saluran ke daftar default"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reset Bawaan</span>
                  </button>
                )}
              </div>
            </div>

            {dbNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{dbNotice}</span>
              </div>
            )}
          </div>

          {/* Configuration Form (Mode, Transcoder, External Host) */}
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-blue-400" />
              Konfigurasi Server & Profil Transcoding
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Server Mode */}
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Mode Server:</label>
                <select
                  value={config.mode}
                  onChange={(e) => setConfig({ ...config, mode: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="standalone">Standalone Embedded Engine (Instan & Stabil)</option>
                  <option value="connected">Koneksi Remote ke Instance Tvheadend Hardware</option>
                </select>
              </div>

              {/* Streaming Profile for Mobile */}
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Profil Transcoding Mobile:</label>
                <select
                  value={config.streamProfile}
                  onChange={(e) => setConfig({ ...config, streamProfile: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="webtv-h264-aac-matroska">Mobile Balanced (H.264 720p 2.4Mbps - Rekomendasi)</option>
                  <option value="mobile-low-480p">Mobile Data Saver (H.264 480p 1.2Mbps)</option>
                  <option value="pass">Direct Passthrough (Original 1080p 60fps)</option>
                  <option value="webtv-h264-aac-hls">HLS Adaptive Multi-Bitrate</option>
                </select>
              </div>

              {/* If Connected Mode, Host & Port */}
              {config.mode === 'connected' && (
                <>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Tvheadend Host / IP:</label>
                    <input
                      type="text"
                      placeholder="Contoh: 192.168.1.100 atau my-tvh.local"
                      value={config.host}
                      onChange={(e) => setConfig({ ...config, host: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Port HTTP (Default 9981):</label>
                    <input
                      type="number"
                      value={config.port}
                      onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value, 10) || 9981 })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Checkbox settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.useProxy}
                  onChange={(e) => setConfig({ ...config, useProxy: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <div>
                  <span className="font-semibold text-white block">Auto HLS Proxy & CORS Bypass</span>
                  <span className="text-[10px] text-slate-400">Mencegah pemblokiran stream di HTTPS & mobile browser</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.transcodingEnabled}
                  onChange={(e) => setConfig({ ...config, transcodingEnabled: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <div>
                  <span className="font-semibold text-white block">Akselerasi Transcoding Server</span>
                  <span className="text-[10px] text-slate-400">Menyesuaikan audio/video AAC H.264 hemat daya baterai</span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {saveSuccess && (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in">
                  <Check className="w-3.5 h-3.5" /> Konfigurasi tersimpan
                </span>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
