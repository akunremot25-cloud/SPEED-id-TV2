import React, { useState, useEffect } from 'react';
import { 
  X, Users, Plus, Shield, Power, Check, Copy, RefreshCw, 
  Search, Calendar, Phone, AlertTriangle, Clock, ExternalLink,
  Tv, Lock, Unlock, CheckCircle2, XCircle, Trash2, Edit3, KeyRound
} from 'lucide-react';
import { Subscriber, SubscriptionStatus } from '../types/subscriber';
import { 
  fetchSubscribers, createSubscriber, updateSubscriber, 
  deleteSubscriber, toggleSubscriberStatus, generateRandomCode 
} from '../services/subscriberApi';

interface SubscriberManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSubscriberCode?: (code: string) => void;
}

export const SubscriberManagerModal: React.FC<SubscriberManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectSubscriberCode,
}) => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled' | 'expired'>('all');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // New Subscriber Form State
  const [isAddFormOpen, setIsAddFormOpen] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formCode, setFormCode] = useState<string>(() => generateRandomCode());
  const [formDurationDays, setFormDurationDays] = useState<string>('30'); // '1', '7', '30', '90', '365', 'permanent'
  const [formPackage, setFormPackage] = useState<'all' | 'nasional' | 'premium'>('all');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSubscribersList();
    }
  }, [isOpen]);

  const loadSubscribersList = async () => {
    try {
      setIsLoading(true);
      const data = await fetchSubscribers();
      setSubscribers(data);
    } catch (err) {
      console.error('Gagal memuat pelanggan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Toggle subscriber access (Active <-> Disabled)
  const handleToggleStatus = async (sub: Subscriber) => {
    try {
      setActionLoadingId(sub.id);
      const nextStatus = sub.status === 'active' ? 'disabled' : 'active';
      const updated = await updateSubscriber(sub.id, { status: nextStatus });
      setSubscribers((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, status: updated.status } : s))
      );
      showCopyToast(
        nextStatus === 'disabled'
          ? `Siaran untuk ${sub.name} berhasil DIMATIKAN!`
          : `Siaran untuk ${sub.name} berhasil DIAKTIFKAN kembali!`
      );
    } catch (err) {
      console.error('Gagal mengubah status pelanggan:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Extend expiration date
  const handleExtendDays = async (sub: Subscriber, additionalDays: number) => {
    try {
      setActionLoadingId(sub.id);
      let newExpiryIso = 'permanent';

      if (additionalDays > 0) {
        const baseTime = sub.expiresAt && sub.expiresAt !== 'permanent' && new Date(sub.expiresAt).getTime() > Date.now()
          ? new Date(sub.expiresAt).getTime()
          : Date.now();
        const newTime = baseTime + additionalDays * 24 * 60 * 60 * 1000;
        newExpiryIso = new Date(newTime).toISOString();
      }

      const updated = await updateSubscriber(sub.id, {
        expiresAt: newExpiryIso,
        status: 'active', // auto reactivate if was expired
      });

      setSubscribers((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, expiresAt: updated.expiresAt, status: 'active' } : s))
      );
      showCopyToast(`Masa aktif ${sub.name} diperpanjang +${additionalDays} hari.`);
    } catch (err) {
      console.error('Gagal memperpanjang masa aktif:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete subscriber
  const handleDelete = async (sub: Subscriber) => {
    if (!confirm(`Hapus pelanggan ${sub.name} (${sub.code})? Akses siaran akan terputus permanen.`)) {
      return;
    }
    try {
      setActionLoadingId(sub.id);
      await deleteSubscriber(sub.id);
      setSubscribers((prev) => prev.filter((s) => s.id !== sub.id));
      showCopyToast(`Pelanggan ${sub.name} berhasil dihapus.`);
    } catch (err) {
      console.error('Gagal menghapus pelanggan:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Form Submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Nama pelanggan wajib diisi.');
      return;
    }
    if (!formCode.trim()) {
      setFormError('Kode aktivasi wajib diisi.');
      return;
    }

    try {
      setIsLoading(true);
      let calculatedExpiry = 'permanent';
      if (formDurationDays !== 'permanent') {
        const days = parseInt(formDurationDays, 10);
        calculatedExpiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      }

      const created = await createSubscriber({
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        phone: formPhone.trim() || undefined,
        status: 'active',
        package: formPackage,
        expiresAt: calculatedExpiry,
        deviceLimit: 2,
        notes: formNotes.trim() || undefined,
      });

      setSubscribers((prev) => [created, ...prev]);
      setIsAddFormOpen(false);
      setFormName('');
      setFormPhone('');
      setFormNotes('');
      setFormCode(generateRandomCode());
      setFormError(null);
      showCopyToast(`Kode aktivasi ${created.code} untuk ${created.name} berhasil dibuat!`);
    } catch (err: any) {
      setFormError(err.message || 'Gagal membuat kode aktivasi.');
    } finally {
      setIsLoading(false);
    }
  };

  const showCopyToast = (msg: string) => {
    setCopyFeedback(msg);
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showCopyToast(`${label} tersalin ke clipboard!`);
  };

  // Filtered subscribers
  const filteredSubscribers = subscribers.filter((sub) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      sub.name.toLowerCase().includes(q) ||
      sub.code.toLowerCase().includes(q) ||
      (sub.phone && sub.phone.includes(q)) ||
      (sub.notes && sub.notes.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return sub.status === 'active';
    if (statusFilter === 'disabled') return sub.status === 'disabled';
    if (statusFilter === 'expired') {
      if (sub.status === 'expired') return true;
      if (sub.expiresAt !== 'permanent' && new Date(sub.expiresAt).getTime() < Date.now()) return true;
      return false;
    }
    return true;
  });

  // Calculate statistics
  const totalCount = subscribers.length;
  const activeCount = subscribers.filter((s) => s.status === 'active').length;
  const disabledCount = subscribers.filter((s) => s.status === 'disabled').length;
  const expiredCount = subscribers.filter(
    (s) => s.status === 'expired' || (s.expiresAt !== 'permanent' && new Date(s.expiresAt).getTime() < Date.now())
  ).length;

  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  Manajemen Pelanggan & Kode Aktivasi
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-rose-500/20 text-rose-300 rounded-full border border-rose-500/30">
                  Kontrol Penonton
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Atur kode aktivasi per pelanggan, pantau status live, dan matikan siaran pelanggan secara real-time.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {copyFeedback && (
          <div className="bg-emerald-600/90 text-white text-xs font-medium px-4 py-2 flex items-center justify-center space-x-2 shadow-inner">
            <Check className="w-4 h-4" />
            <span>{copyFeedback}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Total Pelanggan</span>
                <Users className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-2xl font-bold text-white mt-1">{totalCount}</div>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3">
              <div className="text-xs text-emerald-400 flex items-center justify-between">
                <span>Siaran Aktif</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-300 mt-1">{activeCount}</div>
            </div>

            <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3">
              <div className="text-xs text-rose-400 flex items-center justify-between">
                <span>Dimatikan (Off)</span>
                <Power className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold text-rose-300 mt-1">{disabledCount}</div>
            </div>

            <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3">
              <div className="text-xs text-amber-400 flex items-center justify-between">
                <span>Kedaluwarsa</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-300 mt-1">{expiredCount}</div>
            </div>
          </div>

          {/* Action Row: Search & Add Button */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama pelanggan, kode aktivasi, nomor HP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                    statusFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Semua ({totalCount})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                    statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Aktif ({activeCount})
                </button>
                <button
                  onClick={() => setStatusFilter('disabled')}
                  className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                    statusFilter === 'disabled' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dimatikan ({disabledCount})
                </button>
              </div>
            </div>

            <button
              onClick={() => setIsAddFormOpen(!isAddFormOpen)}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-rose-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddFormOpen ? 'Tutup Formulir' : 'Buat Kode Aktivasi Baru'}</span>
            </button>
          </div>

          {/* Form: Tambah Pelanggan / Kode Baru */}
          {isAddFormOpen && (
            <form onSubmit={handleCreateSubmit} className="bg-slate-800/80 border border-rose-500/30 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                <div className="flex items-center space-x-2 text-rose-400 font-semibold text-sm">
                  <KeyRound className="w-4 h-4" />
                  <span>Formulir Pembuatan Kode Aktivasi Penonton</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddFormOpen(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-950/50 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nama Pelanggan / Penonton <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pak Budi - Kamar Depan / Pelanggan #42"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nomor WhatsApp / Kontak (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: +628123456789"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300">
                      Kode Aktivasi Otomatis <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormCode(generateRandomCode())}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Acak Baru</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-900 border border-rose-500/40 rounded-xl px-3 py-2 text-sm font-mono font-bold text-rose-300 tracking-wider focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Durasi Masa Aktif
                  </label>
                  <select
                    value={formDurationDays}
                    onChange={(e) => setFormDurationDays(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="1">1 Hari (Uji Coba / Trial)</option>
                    <option value="7">7 Hari (1 Minggu)</option>
                    <option value="30">30 Hari (1 Bulan Standar)</option>
                    <option value="90">90 Hari (3 Bulan)</option>
                    <option value="365">1 Tahun (365 Hari)</option>
                    <option value="permanent">Permanen (Seumur Hidup / VIP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Paket Saluran
                  </label>
                  <select
                    value={formPackage}
                    onChange={(e) => setFormPackage(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="all">Semua Saluran (Nasional + ANTV + Sports + News)</option>
                    <option value="nasional">Paket Nasional Saja</option>
                    <option value="premium">Paket Hiburan Premium</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Catatan Administrator (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Sudah lunas via transfer BCA"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddFormOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan & Terbitkan Kode</span>
                </button>
              </div>
            </form>
          )}

          {/* Subscriber Cards List */}
          <div className="space-y-3">
            {isLoading && subscribers.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-400" />
                <p className="text-sm">Memuat data pelanggan & kode aktivasi...</p>
              </div>
            ) : filteredSubscribers.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-slate-800 p-6 space-y-3">
                <Users className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-semibold text-white">Tidak ada pelanggan ditemukan</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {searchQuery ? 'Coba ubah kata kunci pencarian Anda.' : 'Belum ada kode aktivasi yang dibuat. Klik tombol di atas untuk membuat kode baru.'}
                </p>
              </div>
            ) : (
              filteredSubscribers.map((sub) => {
                const isActive = sub.status === 'active';
                const isPermanent = sub.expiresAt === 'permanent';
                const isExpired = !isPermanent && new Date(sub.expiresAt).getTime() < Date.now();
                const remainingDays = !isPermanent
                  ? Math.max(0, Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                  : null;

                const directViewerUrl = `${originUrl}/?code=${encodeURIComponent(sub.code)}&mode=client`;
                const m3uPlaylistUrl = `${originUrl}/api/tvheadend/playlist.m3u?code=${encodeURIComponent(sub.code)}`;

                return (
                  <div
                    key={sub.id}
                    className={`p-4 rounded-xl border transition-all ${
                      !isActive
                        ? 'bg-rose-950/20 border-rose-500/40'
                        : isExpired
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : 'bg-slate-800/60 border-slate-700/70 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Customer Info & Code */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <h4 className="text-base font-bold text-white truncate">{sub.name}</h4>

                          {/* Status Badge */}
                          {sub.status === 'disabled' ? (
                            <span className="px-2 py-0.5 text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full flex items-center space-x-1">
                              <XCircle className="w-3 h-3 text-rose-400" />
                              <span>DIMATIKAN (OFF)</span>
                            </span>
                          ) : isExpired ? (
                            <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>KEDALUWARSA</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span>AKTIF (SIARAN ON)</span>
                            </span>
                          )}

                          <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                            {sub.package === 'all' ? 'Semua Saluran' : sub.package}
                          </span>
                        </div>

                        {/* Activation Code & Copy Button */}
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-400 font-mono">Kode Aktivasi:</span>
                          <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-rose-300 font-mono font-bold text-sm rounded tracking-wider select-all">
                            {sub.code}
                          </span>
                          <button
                            onClick={() => copyToClipboard(sub.code, `Kode ${sub.code}`)}
                            title="Salin Kode Aktivasi"
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Expiration & Details */}
                        <div className="flex items-center space-x-4 text-xs text-slate-400 flex-wrap gap-y-1">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>
                              {isPermanent
                                ? 'Masa Aktif: Permanen / Seumur Hidup'
                                : isExpired
                                ? `Kedaluwarsa sejak ${new Date(sub.expiresAt).toLocaleDateString('id-ID')}`
                                : `Sisa ${remainingDays} hari (s/d ${new Date(sub.expiresAt).toLocaleDateString('id-ID')})`}
                            </span>
                          </div>

                          {sub.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="w-3.5 h-3.5 text-slate-500" />
                              <span>{sub.phone}</span>
                            </div>
                          )}

                          {sub.notes && (
                            <span className="text-slate-400 italic">
                              "{sub.notes}"
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Quick Real-Time Controls */}
                      <div className="flex items-center flex-wrap gap-2 justify-start lg:justify-end">
                        {/* Instant On / Off Switch (The requested control to turn off or control) */}
                        <button
                          onClick={() => handleToggleStatus(sub)}
                          disabled={actionLoadingId === sub.id}
                          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                            sub.status === 'disabled'
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-rose-600 hover:bg-rose-500 text-white'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{sub.status === 'disabled' ? 'Aktifkan Siaran' : 'Matikan Akses'}</span>
                        </button>

                        {/* Quick Extension Buttons */}
                        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-0.5 text-xs">
                          <button
                            onClick={() => handleExtendDays(sub, 7)}
                            disabled={actionLoadingId === sub.id}
                            title="Tambah 7 Hari Masa Aktif"
                            className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded font-medium"
                          >
                            +7H
                          </button>
                          <button
                            onClick={() => handleExtendDays(sub, 30)}
                            disabled={actionLoadingId === sub.id}
                            title="Tambah 30 Hari Masa Aktif"
                            className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded font-medium"
                          >
                            +30H
                          </button>
                          <button
                            onClick={() => handleExtendDays(sub, 0)}
                            disabled={actionLoadingId === sub.id}
                            title="Jadikan Permanen Seumur Hidup"
                            className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded font-medium"
                          >
                            VIP
                          </button>
                        </div>

                        {/* Copy Direct Viewer URL */}
                        <button
                          onClick={() => copyToClipboard(directViewerUrl, 'Link Nonton Client')}
                          title="Salin Link Nonton Langsung untuk Penonton (Otomatis Aktif)"
                          className="flex items-center space-x-1 px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs border border-slate-700"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Link Web</span>
                        </button>

                        {/* Copy Personalized M3U URL */}
                        <button
                          onClick={() => copyToClipboard(m3uPlaylistUrl, 'Link M3U Playlist')}
                          title="Salin Link Playlist M3U Khusus Pelanggan Ini (Untuk VLC / TiviMate)"
                          className="flex items-center space-x-1 px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs border border-slate-700"
                        >
                          <Tv className="w-3.5 h-3.5" />
                          <span>Link M3U</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(sub)}
                          disabled={actionLoadingId === sub.id}
                          title="Hapus Pelanggan"
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Setiap perubahan status (Matikan / Aktifkan) berlaku seketika pada siaran HLS & M3U penonton.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
