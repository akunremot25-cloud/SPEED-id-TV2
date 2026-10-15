import React, { useState } from 'react';
import { 
  Pencil, Check, AlertCircle, Trash2, Wifi, Activity, 
  ExternalLink, Image as ImageIcon, Zap, Radio, RefreshCw, Database
} from 'lucide-react';
import { Channel } from '../types/tvheadend';
import { updateChannel, testStreamReachability, deleteChannel } from '../services/api';

interface EditChannelModalProps {
  channel: Channel;
  onClose: () => void;
  onChannelUpdated: (updatedChannel: Channel) => void;
  onChannelDeleted?: (channelId: string) => void;
}

export const EditChannelModal: React.FC<EditChannelModalProps> = ({
  channel,
  onClose,
  onChannelUpdated,
  onChannelDeleted,
}) => {
  const [name, setName] = useState(channel.name);
  const [number, setNumber] = useState(channel.number);
  const [category, setCategory] = useState<Channel['category']>(channel.category);
  const [streamUrl, setStreamUrl] = useState(channel.streamUrl);
  const [backupUrl, setBackupUrl] = useState(channel.backupUrls?.[0] || '');
  const [quality, setQuality] = useState<Channel['quality']>(channel.quality || 'Auto');
  const [logo, setLogo] = useState(channel.logo);
  const [fps, setFps] = useState(channel.fps || 30);
  const [bitrateKbps, setBitrateKbps] = useState(channel.bitrateKbps || 2500);
  const [audioCodec, setAudioCodec] = useState(channel.audioCodec || 'AAC');
  const [videoCodec, setVideoCodec] = useState(channel.videoCodec || 'H.264');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Stream Testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    reachable: boolean;
    latencyMs: number;
    statusCode?: number;
    contentType?: string;
    error?: string;
  } | null>(null);

  const handleTestStream = async () => {
    if (!streamUrl.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testStreamReachability(streamUrl.trim());
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        reachable: false,
        latencyMs: 0,
        error: err.message || 'Gagal menguji koneksi',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !streamUrl.trim()) {
      setErrorMsg('Nama saluran dan URL stream tidak boleh kosong');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const updated = await updateChannel(channel.id, {
        name: name.trim(),
        number: Number(number) || 1,
        category,
        streamUrl: streamUrl.trim(),
        backupUrls: backupUrl.trim() ? [backupUrl.trim()] : [],
        quality,
        logo: logo.trim() || 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=128&auto=format&fit=crop&q=80',
        fps: Number(fps) || 30,
        bitrateKbps: Number(bitrateKbps) || 2500,
        audioCodec,
        videoCodec,
      });

      setSuccessMsg('Perubahan berhasil disimpan permanen di Database Cloud & Server!');
      setTimeout(() => {
        onChannelUpdated(updated);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan perubahan ke database');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Apakah Anda yakin ingin menghapus saluran "${channel.name}"?`)) return;
    try {
      await deleteChannel(channel.id);
      onChannelDeleted?.(channel.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghapus saluran');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Edit Saluran #{channel.number}
                  <span className="text-xs text-blue-400 font-normal truncate max-w-[160px] sm:max-w-xs">
                    ({channel.name})
                  </span>
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Database className="w-2.5 h-2.5" />
                  Database
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Perubahan tersimpan permanen ke Database Cloud Firestore & Server
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body Form */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Row 1: Nomor & Nama */}
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-1">
                <label className="text-slate-300 font-medium block mb-1">No. CH *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={number}
                  onChange={(e) => setNumber(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-center focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="col-span-3">
                <label className="text-slate-300 font-medium block mb-1">Nama Saluran Siaran *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Contoh: TVRI Nasional HD"
                />
              </div>
            </div>

            {/* Row 2: Stream URL & Stream Tester */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-medium block">URL Stream Utama (.m3u8 / TS) *</label>
                <button
                  type="button"
                  onClick={handleTestStream}
                  disabled={isTesting || !streamUrl.trim()}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 font-medium flex items-center gap-1 active:scale-95 transition-all"
                >
                  <Activity className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'Menguji...' : 'Uji Sinyal Stream'}
                </button>
              </div>

              <input
                type="url"
                required
                value={streamUrl}
                onChange={(e) => {
                  setStreamUrl(e.target.value);
                  setTestResult(null);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-blue-500"
                placeholder="https://example.com/live/stream.m3u8"
              />

              {/* Stream test results badge */}
              {testResult && (
                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
                    testResult.reachable
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        testResult.reachable ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                    />
                    <span>
                      {testResult.reachable
                        ? `Stream Aktif • Respon ${testResult.latencyMs}ms • Status ${testResult.statusCode}`
                        : `Gagal: ${testResult.error || 'Server tidak merespon'}`}
                    </span>
                  </div>
                  {testResult.contentType && (
                    <span className="text-[10px] font-mono text-slate-400 truncate max-w-[150px]">
                      {testResult.contentType}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Row 3: Backup URL */}
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                URL Cadangan / Backup Stream (Opsional)
              </label>
              <input
                type="url"
                value={backupUrl}
                onChange={(e) => setBackupUrl(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-blue-500"
                placeholder="https://backup.example.com/live/backup.m3u8"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                Otomatis digunakan player jika URL utama mengalami gangguan jaringan.
              </p>
            </div>

            {/* Row 4: Kategori & Kualitas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Kategori Saluran</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Nasional">Nasional</option>
                  <option value="Berita">Berita</option>
                  <option value="Olahraga">Olahraga</option>
                  <option value="Hiburan">Hiburan</option>
                  <option value="Mancanegara">Mancanegara</option>
                  <option value="Religi">Religi</option>
                  <option value="Test">Test Mux</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Label Resolusi Standar</label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Auto">Auto (ABR Adaptif)</option>
                  <option value="1080p">1080p Full HD</option>
                  <option value="720p">720p HD</option>
                  <option value="480p">480p Mobile Low</option>
                </select>
              </div>
            </div>

            {/* Row 5: Bitrate & FPS */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Target Bitrate (kbps)</label>
                <input
                  type="number"
                  step="100"
                  value={bitrateKbps}
                  onChange={(e) => setBitrateKbps(parseInt(e.target.value, 10) || 2000)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Frame Rate (FPS)</label>
                <select
                  value={fps}
                  onChange={(e) => setFps(parseInt(e.target.value, 10) || 30)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={24}>24 FPS (Sinematik)</option>
                  <option value={25}>25 FPS (PAL Standar)</option>
                  <option value={30}>30 FPS (Standar)</option>
                  <option value={50}>50 FPS (Olahraga Halus)</option>
                  <option value={60}>60 FPS (Olahraga Tinggi)</option>
                </select>
              </div>
            </div>

            {/* Row 6: Logo URL & Preview */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium block">URL Logo / Ikon Saluran</label>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={logo}
                    alt="Logo Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <ImageIcon className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type="url"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-medium flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Saluran</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl font-semibold shadow-md shadow-blue-900/40 flex items-center gap-1.5 transition-all"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Menyimpan ke Database...' : 'Simpan ke Database'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
