import React, { useState } from 'react';
import { Plus, UploadCloud, FileText, Check, AlertCircle, Link, Database, Sparkles, Tv, CheckCheck } from 'lucide-react';
import { Channel } from '../types/tvheadend';
import { addCustomChannel, importM3uPlaylist, importProviderChannels } from '../services/api';

interface AddChannelModalProps {
  onClose: () => void;
  onChannelAdded: (newChannel?: Channel) => void;
}

export const AddChannelModal: React.FC<AddChannelModalProps> = ({ onClose, onChannelAdded }) => {
  const [activeTab, setActiveTab] = useState<'single' | 'providers' | 'm3u'>('providers');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Single channel form state
  const [name, setName] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [category, setCategory] = useState<Channel['category']>('Nasional');
  const [quality, setQuality] = useState<Channel['quality']>('720p');
  const [logo, setLogo] = useState('');

  // M3U import state
  const [m3uText, setM3uText] = useState('');

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !streamUrl.trim()) {
      setErrorMsg('Nama saluran dan URL stream wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const created = await addCustomChannel({
        name: name.trim(),
        streamUrl: streamUrl.trim(),
        category,
        quality,
        logo: logo.trim() || 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=128&auto=format&fit=crop&q=80',
        fps: 30,
        bitrateKbps: quality === '1080p' ? 3500 : quality === '720p' ? 2200 : 1200,
        audioCodec: 'AAC',
        videoCodec: 'H.264',
      });
      onChannelAdded(created);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menambahkan saluran ke database');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportProviders = async (provider: 'all' | 'vidio' | 'rctiplus') => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessNotice(null);
    try {
      const res = await importProviderChannels(provider);
      setSuccessNotice(res.message);
      onChannelAdded();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengambil saluran provider');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleM3uSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!m3uText.trim()) {
      setErrorMsg('Teks playlist M3U tidak boleh kosong.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await importM3uPlaylist(m3uText);
      onChannelAdded();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengimpor playlist M3U ke database');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Tambah Saluran Siaran</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Database className="w-2.5 h-2.5" />
                  Database Cloud
                </span>
              </div>
              <p className="text-xs text-slate-400">Tersimpan otomatis ke database server & cloud</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs">
          <button
            onClick={() => setActiveTab('providers')}
            className={`flex-1 py-3 text-center font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'providers'
                ? 'border-blue-500 text-blue-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Vidio & RCTI+</span>
            <span className="px-1 py-0.2 rounded text-[8px] bg-emerald-500/20 text-emerald-300 font-bold">1-KLIK</span>
          </button>
          <button
            onClick={() => setActiveTab('single')}
            className={`flex-1 py-3 text-center font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'single'
                ? 'border-blue-500 text-blue-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            Saluran Manual
          </button>
          <button
            onClick={() => setActiveTab('m3u')}
            className={`flex-1 py-3 text-center font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'm3u'
                ? 'border-blue-500 text-blue-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Impor M3U
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successNotice && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCheck className="w-4 h-4 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {activeTab === 'providers' ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/50 to-blue-950/40 border border-indigo-500/30 space-y-2">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Ambil Semua Saluran Vidio.com & RCTIplus</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Tarik otomatis seluruh saluran TV nasional dari Vidio.com (SCTV, Indosiar, Moji, Mentari TV, Kompas, Metro, TV One, BTV, dll.) dan MNC RCTI+ (RCTI, MNCTV, GTV, iNews, Sindonews, IDX, dll.) dengan proxy anti-CORS otomatis.
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleImportProviders('all')}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 active:scale-95 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? 'Mengambil Saluran...' : 'Ambil Semua Saluran (Vidio + RCTI+)'}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleImportProviders('vidio')}
                    className="py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Hanya Vidio.com (9 Saluran)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleImportProviders('rctiplus')}
                    className="py-2.5 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Hanya RCTI+ (9 Saluran)</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Catatan Integrasi Streaming Proxy:</p>
                <p>• Seluruh segmen stream HLS akan ditulis ulang secara otomatis melalui server proxy.</p>
                <p>• Data saluran akan disimpan secara permanen di database Cloud Firestore & server.</p>
              </div>
            </div>
          ) : activeTab === 'single' ? (
            <form onSubmit={handleSingleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Nama Saluran Siaran *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: RCTI Live, Trans7, CNN Indonesia"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">URL Stream HLS (.m3u8 atau TS) *</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/live/stream.m3u8"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Server proxy akan otomatis menangani CORS dan memutar stream dengan lancar di mobile.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Kategori</label>
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
                  <label className="text-slate-300 font-medium block mb-1">Kualitas Standar</label>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Auto">Auto (ABR)</option>
                    <option value="1080p">1080p Full HD</option>
                    <option value="720p">720p HD</option>
                    <option value="480p">480p Mobile Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">URL Logo Saluran (Opsional)</label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan ke Database'}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleM3uSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Tempel (Paste) Konten M3U Playlist:</label>
                <textarea
                  rows={8}
                  placeholder={`#EXTM3U\n#EXTINF:-1 tvg-logo="https://..." group-title="Nasional",Nama TV\nhttps://example.com/stream.m3u8`}
                  value={m3uText}
                  onChange={(e) => setM3uText(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-[11px] placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Mengimpor...' : 'Impor Seluruh Saluran'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
