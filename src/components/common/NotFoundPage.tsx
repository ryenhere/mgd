/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link } from '../../router/Router.tsx';
import { ROUTES } from '../../constants/routes.ts';
import { BookOpen, Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#F6ECEC] text-[#660810] flex items-center justify-center mx-auto shadow-xs">
          <BookOpen className="w-8 h-8 text-[#660810]" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-semibold text-[#660810] tracking-widest uppercase">
            Halaman Tidak Ditemukan • 404
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#270707]">
            Halaman Tidak Ada
          </h1>
          <p className="text-sm text-[#5D4B4B] leading-relaxed">
            Halaman yang Anda tuju mungkin telah dipindahkan, tautan tidak tepat, atau belum dipublikasikan oleh redaksi santri.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={ROUTES.HOME}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#660810] text-[#F1EBEB] text-xs font-semibold hover:bg-[#50060C] transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
          <Link
            href={ROUTES.CATALOGUE}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-[#D6C0B1] text-xs font-medium text-[#270707] hover:bg-[#EAE2E2] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Lihat Katalog Majalah</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
