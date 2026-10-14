import React from 'react';
import { Activity, ShieldCheck, Zap, AlertTriangle, Wifi, Smartphone, Check } from 'lucide-react';
import { Channel } from '../types/tvheadend';

interface StreamDiagnosticsModalProps {
  channel: Channel;
  onClose: () => void;
}

export const StreamDiagnosticsModal: React.FC<StreamDiagnosticsModalProps> = ({ channel, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Diagnostik Stream Mobile</h2>
              <p className="text-xs text-slate-400">Monitor stabilitas siaran & buffer real-time</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* Diagnostics Body */}
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Target Channel */}
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[10px]">Saluran Sedang Tayang:</span>
              <span className="font-bold text-white text-sm">{channel.name}</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600/30 text-blue-400 border border-blue-500/30">
              CH {channel.number}
            </span>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <span className="text-slate-400 block text-[10px] mb-1">Video Codec</span>
              <span className="font-bold text-white">{channel.videoCodec || 'H.264 (AVC)'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <span className="text-slate-400 block text-[10px] mb-1">Audio Codec</span>
              <span className="font-bold text-white">{channel.audioCodec || 'AAC Stereo'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <span className="text-slate-400 block text-[10px] mb-1">Target Bitrate</span>
              <span className="font-bold text-emerald-400">{channel.bitrateKbps || 2500} kbps</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <span className="text-slate-400 block text-[10px] mb-1">Frame Rate</span>
              <span className="font-bold text-blue-400">{channel.fps || 30} FPS</span>
            </div>
          </div>

          {/* Tips for smooth mobile playback */}
          <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/40 space-y-2 text-slate-300">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
              <Smartphone className="w-4 h-4 text-blue-400" />
              Optimalisasi Streaming Lancar di Perangkat Mobile:
            </h4>
            <ul className="space-y-1.5 text-[11px] list-disc list-inside text-slate-300">
              <li>
                <strong className="text-white">Proxy Stabilizer:</strong> Aktifkan proxy server agar stream tidak terputus karena batas CORS atau koneksi ISP.
              </li>
              <li>
                <strong className="text-white">Koneksi Seluler (4G/5G):</strong> Gunakan profil <em>Mobile Balanced 720p</em> atau <em>Hemat Data 480p</em> agar bebas buffering saat sinyal turun.
              </li>
              <li>
                <strong className="text-white">Gesture Layar Sentuh:</strong> Geser jari ke atas/bawah di sisi kiri layar untuk mengatur kecerahan, dan sisi kanan layar untuk volume.
              </li>
              <li>
                <strong className="text-white">Kunci Layar:</strong> Gunakan ikon gembok untuk mencegah layar terpencet tanpa sengaja saat menonton.
              </li>
            </ul>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-all text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
