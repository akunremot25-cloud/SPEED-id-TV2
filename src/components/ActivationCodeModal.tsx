import React, { useState } from 'react';
import { 
  KeyRound, ShieldCheck, AlertCircle, Check, X, RefreshCw, 
  HelpCircle, Tv, Lock, PhoneCall, Sparkles, AlertTriangle
} from 'lucide-react';
import { Subscriber } from '../types/subscriber';
import { verifyActivationCode } from '../services/subscriberApi';

interface ActivationCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubscriber: Subscriber | null;
  onActivated: (subscriber: Subscriber) => void;
  onDeactivate: () => void;
  isEnforced?: boolean; // If true, viewer cannot close modal without entering a valid active code
  accessDeniedReason?: string | null;
}

export const ActivationCodeModal: React.FC<ActivationCodeModalProps> = ({
  isOpen,
  onClose,
  currentSubscriber,
  onActivated,
  onDeactivate,
  isEnforced = false,
  accessDeniedReason = null,
}) => {
  const [inputCode, setInputCode] = useState<string>(currentSubscriber?.code || '');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(accessDeniedReason);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) {
      setErrorMsg('Masukkan kode aktivasi Anda terlebih dahulu.');
      return;
    }

    try {
      setIsVerifying(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const result = await verifyActivationCode(inputCode.trim());

      if (!result.valid || !result.subscriber) {
        setErrorMsg(result.reason || 'Kode aktivasi tidak valid atau telah dinonaktifkan.');
        return;
      }

      setSuccessMsg(`Selamat datang, ${result.subscriber.name}! Akses siaran aktif.`);
      setTimeout(() => {
        onActivated(result.subscriber!);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memverifikasi kode aktivasi.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleApplyDemoCode = (code: string) => {
    setInputCode(code);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Close Button (only if not strictly enforced) */}
        {!isEnforced && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="p-3 bg-gradient-to-tr from-rose-600 to-red-500 rounded-2xl text-white shadow-lg shadow-rose-950/50">
            <KeyRound className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-wide">
              Aktivasi Akses Siaran TV
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Masukkan kode aktivasi resmi dari administrator untuk membuka dan menonton siaran langsung.
            </p>
          </div>
        </div>

        {/* Disabled / Denied Warning Banner */}
        {(accessDeniedReason || errorMsg) && (
          <div className="mb-4 p-3.5 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-start space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Akses Siaran Dibatasi</p>
              <p className="mt-0.5 text-rose-300/90">{accessDeniedReason || errorMsg}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Kode Aktivasi Pelanggan
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Contoh: SPEED-8821-4912"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-800 border border-slate-700 focus:border-rose-500 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold text-white placeholder-slate-500 tracking-wider focus:outline-none uppercase transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isVerifying || !inputCode.trim()}
            className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-rose-950/50 flex items-center justify-center space-x-2"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memverifikasi Kode...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Aktifkan & Buka Siaran</span>
              </>
            )}
          </button>
        </form>

        {/* Current Active Info (if any) */}
        {currentSubscriber && (
          <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <div className="truncate">
              <span>Login sebagai: </span>
              <strong className="text-white">{currentSubscriber.name}</strong>
            </div>
            <button
              type="button"
              onClick={onDeactivate}
              className="text-rose-400 hover:text-rose-300 font-medium"
            >
              Hapus Kode
            </button>
          </div>
        )}

        {/* Quick Demo Code helper for quick test */}
        <div className="mt-5 p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>Uji Coba Cepat (Kode Demo):</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleApplyDemoCode('SPEED-VIP-TEST')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-lg font-mono text-xs font-semibold"
            >
              SPEED-VIP-TEST (Aktif)
            </button>
            <button
              type="button"
              onClick={() => handleApplyDemoCode('SPEED-OFF-TRIAL')}
              className="px-2.5 py-1 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/30 text-rose-300 rounded-lg font-mono text-xs font-semibold"
            >
              SPEED-OFF-TRIAL (Dimatikan)
            </button>
          </div>
        </div>

        {/* Help footer */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-500">
            Belum memiliki kode aktivasi? Hubungi penyedia layanan atau administrator Anda.
          </p>
        </div>
      </div>
    </div>
  );
};
