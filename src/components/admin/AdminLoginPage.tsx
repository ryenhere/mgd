/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useRouter } from '../../router/Router.tsx';
import { ADMIN_ROUTES, ROUTES } from '../../constants/routes.ts';
import { BookOpen, Lock, User, Eye, EyeOff, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { magazineService } from '../../services/magazineService.ts';

export function AdminLoginPage() {
  const { navigate } = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password) {
      setErrorMessage('Nama pengguna dan kata sandi wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      await magazineService.login(username, password);
      setPassword('');
      navigate(ADMIN_ROUTES.DASHBOARD);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Gagal memverifikasi akses. Silakan coba kembali.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Back to Home navigation */}
        <div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.HOME)}
            className="inline-flex items-center gap-2 text-xs font-medium text-[#5D4B4B] hover:text-[#660810] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda Publik</span>
          </button>
        </div>

        {/* Card Header */}
        <div className="bg-[#FFFFFF] border border-[#D6C0B1] rounded-2xl p-8 sm:p-10 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#660810] text-[#F1EBEB] flex items-center justify-center mx-auto shadow-xs">
              <BookOpen className="w-6 h-6 text-[#F1EBEB]" />
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#270707]">
              Media Madrasah
            </h1>
            <p className="text-xs text-[#5D4B4B]">
              Portal Pengelola Majalah Digital Santri
            </p>
          </div>

          {/* Validation / Error Message */}
          {errorMessage && (
            <div className="bg-[#FDF3F2] border border-[#F5C2BE] rounded-lg p-3 flex items-center gap-2 text-xs text-[#B3261E]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-username" className="block text-xs font-semibold text-[#270707] mb-1.5">
                Nama Pengguna (Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B5A5A]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="admin-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  maxLength={256}
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan nama pengguna..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-[#D6C0B1] bg-[#F1EBEB] text-sm text-[#270707] placeholder-[#6B5A5A] focus:outline-none focus:ring-2 focus:ring-[#660810] focus:bg-[#FFFFFF]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold text-[#270707] mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B5A5A]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  maxLength={256}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-[#D6C0B1] bg-[#F1EBEB] text-sm text-[#270707] placeholder-[#6B5A5A] focus:outline-none focus:ring-2 focus:ring-[#660810] focus:bg-[#FFFFFF]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6B5A5A] hover:text-[#270707]"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-lg bg-[#660810] text-[#F1EBEB] text-sm font-semibold hover:bg-[#50060C] focus:outline-none focus:ring-2 focus:ring-[#660810] focus:ring-offset-2 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akses...</span>
                </>
              ) : (
                <span>Masuk ke Dasbor Admin</span>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <span className="text-[11px] text-[#6B5A5A]">
              Akses internal Media Madrasah MA Plus Abu Hurairah.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
