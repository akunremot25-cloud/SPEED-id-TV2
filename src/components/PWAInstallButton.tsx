import React, { useState } from 'react';
import { Download, Smartphone, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'floating' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroidOrSTB, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If already running in standalone / installed PWA mode, don't show prompt button
  if (isInstalled) {
    return null;
  }

  const handleClick = () => {
    if (isInstallable) {
      install().then((success) => {
        if (!success) {
          setIsModalOpen(true);
        }
      });
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleClick}
          className={`px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 active:scale-95 transition-all ${className}`}
          title="Pasang sebagai Aplikasi untuk Android, STB & iPhone"
        >
          <Download className="w-3.5 h-3.5 text-white animate-bounce" />
          <span className="hidden sm:inline">Install Apps</span>
        </button>
      )}

      {variant === 'banner' && (
        <div className="w-full bg-gradient-to-r from-emerald-950/80 via-slate-900 to-blue-950/80 border-b border-emerald-500/30 px-3 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white">Jadikan Aplikasi di Layar Utama</span>
              <p className="text-[11px] text-slate-300">Nonton siaran langsung lebih cepat, layar miring otomatis & remote STB</p>
            </div>
          </div>
          <button
            onClick={handleClick}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow shrink-0 active:scale-95 transition-all"
          >
            Pasang Apps
          </button>
        </div>
      )}

      <PWAInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNativeInstall={install}
        isInstallable={isInstallable}
      />
    </>
  );
};
