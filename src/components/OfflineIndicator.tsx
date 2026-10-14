import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/90 text-white px-3.5 py-2 text-xs font-semibold shadow-2xl backdrop-blur-md border border-amber-300/40 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span>Koneksi Internet Terputus. Menunggu jaringan kembali...</span>
    </div>
  );
};
