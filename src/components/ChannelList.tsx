import React, { useState } from 'react';
import { 
  Star, Search, Filter, Tv, Radio, Trash2, Plus, 
  ExternalLink, Check, Download, AlertCircle, Signal, Pencil
} from 'lucide-react';
import { Channel } from '../types/tvheadend';

interface ChannelListProps {
  channels: Channel[];
  selectedChannelId: string;
  onSelectChannel: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  onDeleteChannel?: (channelId: string) => void;
  onEditChannel?: (channel: Channel) => void;
  onOpenAddModal?: () => void;
  onOpenServerDashboard?: () => void;
  isClientMode?: boolean;
}

export const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  selectedChannelId,
  onSelectChannel,
  onToggleFavorite,
  onDeleteChannel,
  onEditChannel,
  onOpenAddModal,
  onOpenServerDashboard,
  isClientMode = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  const categories = ['Semua', 'Favorit', 'Nasional', 'Berita', 'Olahraga', 'Hiburan', 'Mancanegara', 'Test'];

  // Filter channels based on search and category
  const filteredChannels = channels.filter((ch) => {
    const matchesSearch = 
      ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(ch.number).includes(searchQuery) ||
      (ch.epgCurrent && ch.epgCurrent.title.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === 'Semua') return true;
    if (selectedCategory === 'Favorit') return !!ch.isFavorite;
    return ch.category === selectedCategory;
  });

  return (
    <div className="flex flex-col h-full bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
      {/* Header and Quick Actions */}
      <div className="p-3 sm:p-4 border-b border-slate-800/80 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600/20 rounded-xl text-blue-400">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Daftar Siaran TV</h3>
              <p className="text-xs text-slate-400">
                {channels.length} saluran aktif • Dioptimalkan untuk Mobile
              </p>
            </div>
          </div>

          {!isClientMode && (
            <div className="flex items-center gap-2">
              {onOpenAddModal && (
                <button
                  onClick={onOpenAddModal}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
                  title="Tambah Saluran atau Impor M3U"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              )}
              {onOpenServerDashboard && (
                <button
                  onClick={onOpenServerDashboard}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white rounded-xl text-xs border border-slate-700 transition-colors"
                  title="Tvheadend Server Status & Tuner"
                >
                  <Signal className="w-4 h-4 text-emerald-400" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari saluran atau nomor siaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-700/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills (horizontally scrollable on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all flex items-center gap-1 ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-900/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80'
              }`}
            >
              {cat === 'Favorit' && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Channel Cards List */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2">
        {filteredChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center p-4">
            <AlertCircle className="w-8 h-8 text-slate-500 mb-2" />
            <p className="text-sm font-semibold text-slate-300">Tidak ada saluran ditemukan</p>
            <p className="text-xs text-slate-500 mt-1">Coba kata kunci lain atau tambahkan saluran baru.</p>
          </div>
        ) : (
          filteredChannels.map((channel) => {
            const isSelected = channel.id === selectedChannelId;
            return (
              <div
                key={channel.id}
                onClick={() => onSelectChannel(channel)}
                className={`group relative p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-blue-950/40 border-blue-500/80 shadow-lg shadow-blue-950/50'
                    : 'bg-slate-800/40 border-slate-800/70 hover:bg-slate-800/80 hover:border-slate-700/80'
                }`}
              >
                {/* Left: Number & Logo */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={channel.logo}
                      alt={channel.name}
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg object-cover bg-slate-900 border border-slate-700/60 shadow-inner"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.2 rounded text-[10px] font-black bg-slate-900 text-blue-400 border border-slate-700 shadow">
                      {channel.number}
                    </span>
                    {isSelected && (
                      <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                      </span>
                    )}
                  </div>

                  {/* Channel Info & EPG */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                        {channel.name}
                      </h4>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-700/80 text-slate-300">
                        {channel.quality}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-800 text-slate-400">
                        {channel.category}
                      </span>
                    </div>

                    {/* Current EPG Program */}
                    {channel.epgCurrent && (
                      <div className="mt-1">
                        <p className="text-[11px] text-slate-300 truncate">
                          {channel.epgCurrent.title}
                        </p>
                        {/* Progress Bar */}
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1 bg-slate-700/70 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${channel.epgCurrent.progress}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-slate-400 shrink-0">
                            {channel.epgCurrent.startTime} - {channel.epgCurrent.endTime}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {!isClientMode && onEditChannel && (
                    <button
                      onClick={() => onEditChannel(channel)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-700/60 transition-colors"
                      title="Edit Saluran"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onToggleFavorite(channel.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-700/50 transition-colors"
                    title="Favorit"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        channel.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-500'
                      }`}
                    />
                  </button>
                  {!isClientMode && onDeleteChannel && channel.id.startsWith('custom-') && (
                    <button
                      onClick={() => onDeleteChannel(channel.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 transition-colors"
                      title="Hapus Saluran"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 sm:p-3 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Tv className="w-3.5 h-3.5 text-blue-400" />
          {isClientMode ? 'Siaran Langsung TV' : 'Tvheadend HLS Transmuxer'}
        </span>
        <span className="text-emerald-400 flex items-center gap-1 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {isClientMode ? 'Online & Lancar' : 'Aktif 24/7'}
        </span>
      </div>
    </div>
  );
};
