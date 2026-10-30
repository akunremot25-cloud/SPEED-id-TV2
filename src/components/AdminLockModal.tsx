import React, { useState, useEffect } from 'react';
import { 
  Lock, Unlock, ShieldCheck, KeyRound, AlertTriangle, 
  X, Check, Delete, Key, Sparkles, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { verifyAdminPin, changeAdminPin, fetchAdminStatus } from '../services/api';

interface AdminLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
  defaultMode?: 'unlock' | 'change-pin';
}

export const AdminLockModal: React.FC<AdminLockModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  defaultMode = 'unlock',
}) => {
  const [mode, setMode] = useState<'unlock' | 'change-pin'>(defaultMode);
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [currentPin, setCurrentPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [adminStatus, setAdminStatus] = useState<{ isProtected: boolean; hasCustomPin: boolean }>({
    isProtected: true,
    hasCustomPin: false,
  });

  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setPin('');
      setErrorMsg(null);
      setSuccessMsg(null);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      fetchAdminStatus()
        .then(setAdminStatus)
        .catch(() => {});
    }
  }, [isOpen, defaultMode]);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 12) {
      setPin((prev) => prev + num);
      setErrorMsg(null);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg(null);
  };

  const handleUnlockSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) {
      setErrorMsg('Masukkan PIN Pengelola terlebih dahulu.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await verifyAdminPin(pin);
      if (res.success) {
        setSuccessMsg('Kunci terbuka! Memasuki mode administrator...');
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('tvh_admin_auth', 'true');
        }
        setTimeout(() => {
          onAuthenticated();
          onClose();
        }, 600);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'PIN Admin salah! Akses ditolak.');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setErrorMsg('PIN baru minimal harus 4 angka/karakter.');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMsg('Konfirmasi PIN baru tidak cocok.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await changeAdminPin(currentPin, newPin);
      setSuccessMsg(res.message || 'PIN Admin berhasil diubah!');
      setAdminStatus((prev) => ({ ...prev, hasCustomPin: true }));
      setTimeout(() => {
        setMode('unlock');
        setPin(newPin);
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengubah PIN Admin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Batal & Kembali ke Mode Nonton"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col items-center text-center space-y-2 mb-5">
          <div className="p-3 bg-gradient-to-tr from-amber-600 to-rose-600 rounded-2xl text-white shadow-lg shadow-rose-950/50">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              {mode === 'unlock' ? 'Kunci Panel Administrator' : 'Ubah PIN Pengelola'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {mode === 'unlock' 
                ? 'Masukkan PIN keamanan untuk mengakses panel pengelola siaran & pelanggan.'
                : 'Buat PIN baru untuk mengamankan akses administrator panel ini.'}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center space-x-2 animate-in shake duration-200">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in duration-200">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {mode === 'unlock' ? (
          <div className="space-y-4">
            {/* PIN Display Input */}
            <form onSubmit={handleUnlockSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  autoFocus
                  placeholder="Ketik PIN..."
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full bg-slate-800/90 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-center text-2xl font-mono font-bold tracking-widest text-white placeholder-slate-600 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Default PIN Helper */}
              {!adminStatus.hasCustomPin && (
                <div className="flex items-center justify-between text-xs px-1 text-slate-400">
                  <span>PIN Bawaan Pabrik: <strong className="text-amber-400 font-mono">123456</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setPin('123456');
                      setErrorMsg(null);
                    }}
                    className="text-amber-400 hover:text-amber-300 font-semibold underline"
                  >
                    Gunakan
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !pin}
                className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-rose-950/40 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Buka Panel Admin</span>
                  </>
                )}
              </button>
            </form>

            {/* Numeric Keypad for Remote / Touch */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeyPress(digit)}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-mono text-lg font-bold rounded-xl transition-colors border border-slate-700/60 shadow-sm"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="py-2.5 bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition-colors border border-slate-700/60"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-mono text-lg font-bold rounded-xl transition-colors border border-slate-700/60 shadow-sm"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="py-2.5 bg-slate-800/60 hover:bg-slate-700 text-rose-400 hover:text-rose-300 flex items-center justify-center rounded-xl transition-colors border border-slate-700/60"
                title="Hapus Satu Angka"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            {/* Change PIN toggle button */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('change-pin');
                  setErrorMsg(null);
                }}
                className="text-xs text-slate-400 hover:text-amber-400 transition-colors flex items-center justify-center space-x-1 mx-auto"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Ingin mengubah PIN Admin? Klik di sini</span>
              </button>
            </div>
          </div>
        ) : (
          /* Change PIN Form */
          <form onSubmit={handleChangePinSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                PIN Saat Ini {adminStatus.hasCustomPin ? '' : '(Default: 123456)'}
              </label>
              <input
                type="password"
                placeholder={adminStatus.hasCustomPin ? 'Masukkan PIN lama' : '123456'}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                PIN Baru (Minimal 4 Angka/Karakter)
              </label>
              <input
                type="password"
                required
                placeholder="Contoh: 889900"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ulangi PIN Baru
              </label>
              <input
                type="password"
                required
                placeholder="Ulangi PIN baru"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('unlock');
                  setErrorMsg(null);
                }}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading || !newPin || !confirmPin}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center justify-center space-x-1"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Simpan PIN Baru</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
