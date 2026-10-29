/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { magazineService } from '../../services/magazineService.ts';
import { Magazine } from '../../types/magazine.ts';
import { ROUTES } from '../../constants/routes.ts';
import { Link } from '../../router/Router.tsx';
import { ArrowRight, Library, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { MagazineCard } from '../catalogue/MagazineCard.tsx';

export function CataloguePreview() {
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    magazineService.getPublishedMagazines({}, 1, 3)
      .then((result) => {
        if (isMounted) {
          setMagazines(result.items);
          setLoading(false);
        }
      })
      .catch((cause: unknown) => {
        if (isMounted) {
          setError(cause instanceof Error ? cause.message : 'Gagal memuat katalog majalah.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  return (
    <section className="py-20 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#D6C0B1]">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-[#660810] block mb-1">
            Arsip & Terbitan Terkini
          </span>
          <h2 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight text-[#270707]">
            Jelajahi Karya Santri
          </h2>
        </div>
        <Link
          href={ROUTES.CATALOGUE}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#660810] hover:text-[#50060C] hover:underline"
        >
          <span>Lihat Semua Majalah</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Content Area */}
      <div className="mt-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-[#FFFFFF] border border-[#D6C0B1] rounded-lg p-6 space-y-4 animate-pulse"
              >
                <div className="w-full h-56 bg-[#E8E0E0] rounded-md" />
                <div className="h-4 bg-[#E8E0E0] rounded-sm w-3/4" />
                <div className="h-3 bg-[#E8E0E0] rounded-sm w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="max-w-2xl mx-auto rounded-xl border border-[#D6C0B1] bg-white px-6 py-10 text-center">
            <AlertCircle className="mx-auto h-7 w-7 text-[#B3261E]" />
            <h3 className="mt-3 font-editorial text-xl font-bold text-[#270707]">Katalog belum dapat dimuat</h3>
            <p className="mt-2 text-sm text-[#5D4B4B]">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#660810] px-4 py-2 text-xs font-semibold text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Coba lagi
            </button>
          </div>
        ) : magazines.length > 0 ? (
          /* Ready to render cards when Copilot connects live records */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {magazines.map((mag) => (
              <MagazineCard key={mag.id} magazine={mag} />
            ))}
          </div>
        ) : (
          /* Empty-state view mandated by PRD Section 6.4 & 10 */
          <div className="text-center py-16 px-6 rounded-xl border border-dashed border-[#D6C0B1] bg-[#FFFFFF]/80 max-w-2xl mx-auto shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#F6ECEC] text-[#660810] flex items-center justify-center mb-4">
              <Library className="w-6 h-6" />
            </div>
            <h3 className="font-editorial text-xl font-bold text-[#270707] mb-2">
              Katalog Masih Kosong
            </h3>
            <p className="text-sm text-[#5D4B4B] max-w-md mx-auto leading-relaxed">
              Belum ada majalah yang diterbitkan. Karya terbaru akan tampil di sini setelah dipublikasikan.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#660810] font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Terbitan baru akan tampil setelah dipublikasikan</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
