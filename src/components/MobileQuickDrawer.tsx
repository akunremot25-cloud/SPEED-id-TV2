import { Tv, Star, X, Check, Pencil, Radio } from 'lucide-react';
import { Channel } from '../types/tvheadend';

interface MobileQuickDrawerProps {
  channels: Channel[];
  selectedChannelId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectChannel: (channel: Channel) => void;
  onEditChannel?: (channel: Channel) => void;
  onOpenStreamingProxy?: () => void;
  isClientMode?: boolean;
}

export const MobileQuickDrawer: React.FC<MobileQuickDrawerProps> = ({
  channels,
  selectedChannelId,
  isOpen,
  onClose,
  onSelectChannel,
  onEditChannel,
  onOpenStreamingProxy,
  isClientMode = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-h-[75vh] bg-slate-900 border-t border-slate-700/80 rounded-t-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-200"
      >
        {/* Grab Handle */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mt-2.5 mb-1" />

        {/* Drawer Header */}
        <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-white text-sm">Ganti Saluran Cepat</h3>
            <span className="text-xs text-slate-400">({channels.length})</span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenStreamingProxy && (
              <button
                onClick={() => {
                  onClose();
                  onOpenStreamingProxy();
                }}
                className="px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5"
              >
                <Radio className="w-3 h-3 text-indigo-400" />
                <span>Proxy Hub</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Channels List */}
        <div className="overflow-y-auto p-3 space-y-2">
          {channels.map((channel) => {
            const isSelected = channel.id === selectedChannelId;
            return (
              <div
                key={channel.id}
                onClick={() => {
                  onSelectChannel(channel);
                  onClose();
                }}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'bg-blue-950/60 border-blue-500 text-white font-bold'
                    : 'bg-slate-800/40 border-slate-800/80 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                    <img 
                      src={channel.logo} 
                      alt={channel.name} 
                      className="w-full h-full object-cover" 
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800 text-blue-400">
                        #{channel.number}
                      </span>
                      <h4 className="text-xs font-semibold truncate">{channel.name}</h4>
                    </div>
                    {channel.epgCurrent && (
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {channel.epgCurrent.title}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {channel.quality}
                  </span>
                  {!isClientMode && onEditChannel && (
                    <button
                      onClick={() => {
                        onClose();
                        onEditChannel(channel);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-700/60"
                      title="Edit Saluran"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
