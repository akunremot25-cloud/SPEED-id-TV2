import React, { useState, useEffect } from 'react';
import { 
  Tv, Server, Radio, Plus, Settings, Activity, ShieldCheck, 
  ExternalLink, Smartphone, Download, Info, Clock, PlayCircle,
  Volume2, Sun, Sparkles, RefreshCw, Pencil, Share2, Check,
  Maximize2, Eye, ShieldAlert, MonitorPlay, ChevronDown, RotateCw
} from 'lucide-react';
import { Channel } from './types/tvheadend';
import { fetchChannels, deleteChannel } from './services/api';
import { LivePlayer } from './components/LivePlayer';
import { ChannelList } from './components/ChannelList';
import { TvheadendServerDashboard } from './components/TvheadendServerDashboard';
import { AddChannelModal } from './components/AddChannelModal';
import { EditChannelModal } from './components/EditChannelModal';
import { StreamDiagnosticsModal } from './components/StreamDiagnosticsModal';
import { MobileQuickDrawer } from './components/MobileQuickDrawer';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Client Watching Mode (true = only video and channel list, false = admin/server management)
  const [isClientMode, setIsClientMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      if (isStandalone) return true; // Standalone installed apps are always in client watch mode

      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'admin') return false;
      if (params.get('mode') === 'client' || params.has('client')) return true;
      const saved = localStorage.getItem('tvh_app_mode');
      return saved !== null ? saved === 'client' : true; // Default to client watching mode
    }
    return true;
  });

  const [isLockedToClient] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      if (isStandalone) return true;

      const params = new URLSearchParams(window.location.search);
      return params.get('mode') === 'client' || params.has('client');
    }
    return false;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isServerModalOpen, setIsServerModalOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [isDiagnosticsModalOpen, setIsDiagnosticsModalOpen] = useState<boolean>(false);
  const [isQuickDrawerOpen, setIsQuickDrawerOpen] = useState<boolean>(false);

  // Load channels on mount
  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async (preferredId?: string) => {
    try {
      setIsLoading(true);
      const data = await fetchChannels();
      setChannels(data);

      if (data.length > 0) {
        // Select preferred channel or saved or first
        const savedId = preferredId || localStorage.getItem('tvh_last_channel_id');
        const match = data.find((c) => c.id === savedId) || data[0];
        setSelectedChannel(match);
      }
    } catch (err) {
      console.error('Gagal memuat saluran:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    localStorage.setItem('tvh_last_channel_id', channel.id);
  };

  // Channel flipping (Next / Previous)
  const handleNextChannel = () => {
    if (!selectedChannel || channels.length === 0) return;
    const currentIndex = channels.findIndex((c) => c.id === selectedChannel.id);
    const nextIndex = (currentIndex + 1) % channels.length;
    handleSelectChannel(channels[nextIndex]);
  };

  const handlePrevChannel = () => {
    if (!selectedChannel || channels.length === 0) return;
    const currentIndex = channels.findIndex((c) => c.id === selectedChannel.id);
    const prevIndex = (currentIndex - 1 + channels.length) % channels.length;
    handleSelectChannel(channels[prevIndex]);
  };

  const handleToggleFavorite = (channelId: string) => {
    setChannels((prev) => {
      const updated = prev.map((ch) =>
        ch.id === channelId ? { ...ch, isFavorite: !ch.isFavorite } : ch
      );
      const favIds = updated.filter((c) => c.isFavorite).map((c) => c.id);
      localStorage.setItem('tvh_favorites', JSON.stringify(favIds));
      return updated;
    });
  };

  const handleDeleteChannel = async (channelId: string) => {
    const success = await deleteChannel(channelId);
    if (success) {
      const remaining = channels.filter((c) => c.id !== channelId);
      setChannels(remaining);
      if (selectedChannel?.id === channelId && remaining.length > 0) {
        handleSelectChannel(remaining[0]);
      }
    }
  };

  const toggleClientMode = (clientMode: boolean) => {
    setIsClientMode(clientMode);
    localStorage.setItem('tvh_app_mode', clientMode ? 'client' : 'admin');
    setToastMessage(
      clientMode 
        ? 'Mode Nonton Client aktif: Hanya video & daftar saluran yang ditampilkan.' 
        : 'Mode Kelola Server aktif: Akses penuh tuner & pengaturan saluran terbuka.'
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyClientLink = () => {
    if (typeof window === 'undefined') return;
    const clientUrl = `${window.location.origin}${window.location.pathname}?mode=client`;
    navigator.clipboard.writeText(clientUrl);
    setToastMessage('Tautan menonton client tersalin! Kirimkan link ini ke penonton.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-blue-400/30 animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-900/40">
            <Tv className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
                SPEED-id-TV <span className="text-blue-400 font-medium text-xs sm:text-sm">Live</span>
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isClientMode ? 'Siaran Langsung' : 'Server Online'}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400">
              {isClientMode 
                ? 'Koneksi Nonton TV • Lancar & Hemat Kuota' 
                : 'Server Streaming Tvheadend & Manajemen Saluran'}
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Refresh Streams */}
          <button
            onClick={() => loadChannels(selectedChannel?.id)}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:text-white transition-colors"
            title="Muat Ulang Saluran"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Client Watching Mode specific actions */}
          {isClientMode ? (
            <>
              {/* Install PWA App Button */}
              <PWAInstallButton variant="header" />

              {/* Quick Landscape Fullscreen Button for Android & STB */}
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('tvh:toggle-landscape'));
                }}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-900/30 active:scale-95 transition-all"
                title="Buka Mode Layar Penuh Miring untuk Android & STB"
              >
                <RotateCw className="w-3.5 h-3.5 text-blue-200" />
                <span className="hidden xs:inline">Layar Miring</span>
              </button>

              {/* Copy Client Link */}
              <button
                onClick={copyClientLink}
                className="hidden sm:flex px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium items-center gap-1.5 transition-colors"
                title="Salin Tautan Menonton Client"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden md:inline">Bagikan Link</span>
              </button>

              {/* Mode indicator / switcher (discreet toggle for operator) */}
              {!isLockedToClient && (
                <button
                  onClick={() => toggleClientMode(false)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  title="Klik untuk membuka Mode Kelola / Server"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden xs:inline">Mode Nonton</span>
                </button>
              )}
            </>
          ) : (
            /* Admin Mode specific actions */
            <>
              {/* Switch back to Client Watch Mode */}
              <button
                onClick={() => toggleClientMode(true)}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Beralih ke Tampilan Menonton Client"
              >
                <MonitorPlay className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xs:inline">Tampilan Client</span>
              </button>

              {/* Copy Client Link */}
              <button
                onClick={copyClientLink}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:text-blue-400 transition-colors"
                title="Salin Tautan Menonton Client"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* Diagnostics Button */}
              <button
                onClick={() => setIsDiagnosticsModalOpen(true)}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:text-emerald-400 transition-colors"
                title="Diagnostik Bitrate & Buffer"
              >
                <Activity className="w-4 h-4" />
              </button>

              {/* Add Channel Modal */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="hidden sm:flex px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span>Tambah</span>
              </button>

              {/* Tvheadend Server Dashboard */}
              <button
                onClick={() => setIsServerModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-900/40 transition-all"
              >
                <Server className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Server & Tuner</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* PWA In-App Install Prompt Banner for Clients */}
      {isClientMode && (
        <PWAInstallButton variant="banner" />
      )}

      {/* Admin Mode Alert Banner */}
      {!isClientMode && (
        <div className="bg-blue-950/70 border-b border-blue-800/40 px-4 py-1.5 text-xs text-blue-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span>Mode Admin & Server aktif. Penonton client hanya akan melihat <strong>Video dan Daftar Saluran</strong>.</span>
          </div>
          <button
            onClick={() => toggleClientMode(true)}
            className="text-xs font-semibold text-white underline hover:text-blue-200 ml-4 shrink-0"
          >
            Buka Tampilan Client
          </button>
        </div>
      )}

      {/* Main Content Area: Video Player & Channel List */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left / Center Column: Video Player & EPG Program Guide */}
        <section className="lg:col-span-8 flex flex-col gap-3">
          {/* Live Mobile Player Container */}
          <div className="rounded-2xl overflow-hidden border border-slate-800/80 bg-black shadow-2xl">
            {selectedChannel ? (
              <LivePlayer
                channel={selectedChannel}
                channels={channels}
                onNextChannel={handleNextChannel}
                onPrevChannel={handlePrevChannel}
                onSelectChannel={handleSelectChannel}
                onOpenChannelDrawer={() => setIsQuickDrawerOpen(true)}
                onOpenDiagnostics={isClientMode ? undefined : () => setIsDiagnosticsModalOpen(true)}
                isClientMode={isClientMode}
              />
            ) : (
              <div className="aspect-video flex items-center justify-center bg-slate-950 text-slate-500 text-xs">
                Memuat pemutar siaran langsung...
              </div>
            )}
          </div>

          {/* Active Channel EPG Detail Card */}
          {selectedChannel && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-lg space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0">
                    <img
                      src={selectedChannel.logo}
                      alt={selectedChannel.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-blue-400 font-mono">
                        #{selectedChannel.number}
                      </span>
                      <h3 className="font-bold text-white text-sm sm:text-base truncate">
                        {selectedChannel.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-600/20 text-blue-400 border border-blue-500/30">
                        {selectedChannel.category}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                        {selectedChannel.quality}
                      </span>
                    </div>
                    {selectedChannel.epgCurrent && (
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-200 mt-0.5 truncate">
                        {selectedChannel.epgCurrent.title}
                      </h4>
                    )}
                  </div>
                </div>

                {/* Right actions on active channel card */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Edit Channel Button (HIDDEN in Client Mode) */}
                  {!isClientMode && (
                    <button
                      onClick={() => setEditingChannel(selectedChannel)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700/80 active:scale-95 transition-all shadow-sm"
                      title="Edit Saluran Ini"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit Saluran</span>
                    </button>
                  )}

                  {/* Mobile Quick Drawer Toggle */}
                  <button
                    onClick={() => setIsQuickDrawerOpen(true)}
                    className="lg:hidden px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700/80 shrink-0 active:scale-95 transition-all"
                  >
                    <Tv className="w-3.5 h-3.5 text-blue-400" />
                    Ganti
                  </button>
                </div>
              </div>

              {/* Current Show EPG Details */}
              {selectedChannel.epgCurrent && (
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5 text-blue-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      Sedang Tayang ({selectedChannel.epgCurrent.startTime} - {selectedChannel.epgCurrent.endTime})
                    </span>
                    <span>{selectedChannel.epgCurrent.progress}% Berjalan</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${selectedChannel.epgCurrent.progress}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {selectedChannel.epgCurrent.description}
                  </p>
                </div>
              )}

              {/* Next Show Preview */}
              {selectedChannel.epgNext && (
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-800/30 border border-slate-800/40 text-slate-400">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 shrink-0">
                      Selanjutnya
                    </span>
                    <span className="text-slate-200 truncate font-medium">
                      {selectedChannel.epgNext.title}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0 ml-2">
                    {selectedChannel.epgNext.startTime}
                  </span>
                </div>
              )}

              {/* Mobile & STB Quick Tips bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 bg-slate-950/40 p-2 rounded-xl border border-slate-800/50">
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Usap Kiri: Kecerahan</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950/40 p-2 rounded-xl border border-slate-800/50">
                  <Volume2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">Usap Kanan: Volume</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950/40 p-2 rounded-xl border border-slate-800/50">
                  <RotateCw className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">Layar Miring: STB/HP</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950/40 p-2 rounded-xl border border-slate-800/50">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Remote STB: ▲/▼ 0-9</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Channels Grid & Filter List (Pure channel list for viewers) */}
        <section className="lg:col-span-4 h-[600px] lg:h-auto flex flex-col">
          <ChannelList
            channels={channels}
            selectedChannelId={selectedChannel?.id || ''}
            onSelectChannel={handleSelectChannel}
            onToggleFavorite={handleToggleFavorite}
            onDeleteChannel={isClientMode ? undefined : handleDeleteChannel}
            onEditChannel={isClientMode ? undefined : (ch) => setEditingChannel(ch)}
            onOpenAddModal={isClientMode ? undefined : () => setIsAddModalOpen(true)}
            onOpenServerDashboard={isClientMode ? undefined : () => setIsServerModalOpen(true)}
            isClientMode={isClientMode}
          />
        </section>
      </main>

      {/* Modals (Only rendered when opened, typically in Admin Mode) */}
      {isServerModalOpen && (
        <TvheadendServerDashboard onClose={() => setIsServerModalOpen(false)} />
      )}

      {isAddModalOpen && (
        <AddChannelModal
          onClose={() => setIsAddModalOpen(false)}
          onChannelAdded={(newChan) => {
            loadChannels(newChan?.id);
          }}
        />
      )}

      {editingChannel && (
        <EditChannelModal
          channel={editingChannel}
          onClose={() => setEditingChannel(null)}
          onChannelUpdated={(updated) => {
            setChannels((prev) =>
              prev.map((c) => (c.id === updated.id ? updated : c))
            );
            if (selectedChannel?.id === updated.id) {
              setSelectedChannel(updated);
            }
            setEditingChannel(null);
          }}
          onChannelDeleted={(deletedId) => {
            handleDeleteChannel(deletedId);
            setEditingChannel(null);
          }}
        />
      )}

      {isDiagnosticsModalOpen && selectedChannel && (
        <StreamDiagnosticsModal
          channel={selectedChannel}
          onClose={() => setIsDiagnosticsModalOpen(false)}
        />
      )}

      {/* Mobile Quick Drawer for switching channels */}
      <MobileQuickDrawer
        channels={channels}
        selectedChannelId={selectedChannel?.id || ''}
        isOpen={isQuickDrawerOpen}
        onClose={() => setIsQuickDrawerOpen(false)}
        onSelectChannel={handleSelectChannel}
        onEditChannel={isClientMode ? undefined : (ch) => setEditingChannel(ch)}
        isClientMode={isClientMode}
      />

      {/* Network Connectivity Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}
