import React from 'react';
import { Smartphone, Tv, Monitor, Apple, Check, Download, X, Sparkles, ExternalLink } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNativeInstall?: () => void;
  isInstallable: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onNativeInstall,
  isInstallable,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-4 sm:p-6 text-white max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-2.5 flex items-center justify-center shadow-lg shadow-blue-900/40 shrink-0">
              <Tv className="w-full h-full text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-1.5">
                SPEED-id-TV <span className="text-blue-400 text-xs font-normal">App</span>
              </h3>
              <p className="text-xs text-slate-400">
                Jadikan Aplikasi untuk Android, STB & iPhone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Benefits List */}
        <div className="my-4 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Tampil langsung di layar utama seperti aplikasi bawaan</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Mode Layar Penuh Miring (Landscape) otomatis untuk Android & STB</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Navigasi remote STB (▲/▼ ganti channel, 0-9 nomor TV)</span>
          </div>
        </div>

        {/* Native 1-Click Install Button (if browser supports beforeinstallprompt) */}
        {isInstallable && (
          <button
            onClick={() => {
              onNativeInstall?.();
              onClose();
            }}
            className="w-full mb-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 active:scale-98 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Pasang Sekarang (1-Klik Install)</span>
          </button>
        )}

        {/* Instructions by Platform */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
          {/* Android */}
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200">Android (Chrome / Browser)</h4>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Tekan tombol menu titik tiga (<strong>⋮</strong>) di pojok kanan atas browser, lalu pilih <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Install Aplikasi"</strong>.
              </p>
            </div>
          </div>

          {/* STB / Android TV */}
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200">STB / Android TV Box</h4>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Buka browser di STB (Chrome / TV Browser), tekan tombol Menu remote &rarr; pilih <strong>"Tambahkan Pintasan / Layar Utama"</strong>. Ikon TV akan muncul langsung di menu Beranda STB.
              </p>
            </div>
          </div>

          {/* iOS iPhone / iPad */}
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
              <Apple className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200">iPhone / iPad (Safari)</h4>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Tekan tombol <strong>Share (Bagikan)</strong> di bilah bawah Safari, gulir ke bawah lalu pilih <strong>"Add to Home Screen" (Tambahkan ke Layar Utama)</strong>.
              </p>
            </div>
          </div>

          {/* PC / Laptop */}
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0 mt-0.5">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200">PC / Komputer</h4>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Klik ikon <strong>Install (⊕)</strong> pada address bar Chrome / Edge untuk memasang aplikasi di desktop.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="pt-4 border-t border-slate-800 mt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs active:scale-98 transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
