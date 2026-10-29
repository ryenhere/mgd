/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { magazineService } from '../../services/magazineService.ts';
import type { Magazine } from '../../types/magazine.ts';
import { MagazineCard } from './MagazineCard.tsx';
import {
  Search,
  SlidersHorizontal,
  RefreshCw,
  Library,
  AlertCircle,
  X,
  FileQuestion,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export function CataloguePage() {
  const [allMagazines, setAllMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [availableThemes, setAvailableThemes] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const pageSize = 24;

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      magazineService.getPublishedMagazines({
      search: searchTerm,
      theme: selectedTheme === 'all' ? undefined : selectedTheme,
      semester: selectedSemester === 'all' ? 'all' : Number(selectedSemester),
      year: selectedYear === 'all' ? 'all' : Number(selectedYear),
      }, page, pageSize, controller.signal)
        .then((result) => {
          setAllMagazines(result.items);
          setTotal(result.total);
          setAvailableThemes(result.themes ?? []);
          setAvailableYears(result.years ?? []);
        })
        .catch((cause: unknown) => {
          if (controller.signal.aborted) return;
          setError(cause instanceof Error
            ? cause.message
            : 'Gagal memuat katalog majalah. Silakan coba kembali.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [searchTerm, selectedTheme, selectedSemester, selectedYear, page, pageSize, reloadKey]);

  const fetchMagazines = () => setReloadKey((key) => key + 1);

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedTheme !== 'all' ||
    selectedSemester !== 'all' ||
    selectedYear !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedTheme('all');
    setSelectedSemester('all');
    setSelectedYear('all');
    setPage(1);
  };

  return (
    <div className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="max-w-2xl">
          <span className="text-xs font-bold tracking-wider uppercase text-[#660810] block mb-2">
            Koleksi Majalah Santri
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#270707]">
            Katalog Majalah Digital
          </h1>
          <p className="mt-3 text-[#5D4B4B] text-base leading-relaxed">
            Temukan arsip edisi tematik majalah cetak MA Plus Abu Hurairah. Jelajahi karya dan tulisan dakwah santri semester demi semester.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-10 bg-[#FFFFFF] rounded-xl border border-[#D6C0B1] p-4 sm:p-5 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <label htmlFor="search-input" className="sr-only">
                Cari judul atau topik majalah
              </label>
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B5A5A]">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari judul, topik, atau kata kunci..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#D6C0B1] bg-[#F1EBEB] text-sm text-[#270707] placeholder-[#6B5A5A] focus:outline-none focus:ring-2 focus:ring-[#660810] focus:bg-[#FFFFFF] transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6B5A5A] hover:text-[#270707]"
                  aria-label="Hapus kata kunci pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Tema */}
            <div className="md:col-span-2">
              <label htmlFor="theme-filter" className="sr-only">
                Filter Tema
              </label>
              <select
                id="theme-filter"
                value={selectedTheme}
                onChange={(e) => {
                  setSelectedTheme(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2.5 rounded-lg border border-[#D6C0B1] bg-[#F1EBEB] text-sm text-[#270707] focus:outline-none focus:ring-2 focus:ring-[#660810]"
              >
                <option value="all">Semua Tema</option>
                {availableThemes.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Semester */}
            <div className="md:col-span-2">
              <label htmlFor="semester-filter" className="sr-only">
                Filter Semester
              </label>
              <select
                id="semester-filter"
                value={selectedSemester}
                onChange={(e) => {
                  setSelectedSemester(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2.5 rounded-lg border border-[#D6C0B1] bg-[#F1EBEB] text-sm text-[#270707] focus:outline-none focus:ring-2 focus:ring-[#660810]"
              >
                <option value="all">Semua Semester</option>
                <option value="1">Semester 1 (Ganjil)</option>
                <option value="2">Semester 2 (Genap)</option>
              </select>
            </div>

            {/* Filter Tahun */}
            <div className="md:col-span-2">
              <label htmlFor="year-filter" className="sr-only">
                Filter Tahun
              </label>
              <select
                id="year-filter"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2.5 rounded-lg border border-[#D6C0B1] bg-[#F1EBEB] text-sm text-[#270707] focus:outline-none focus:ring-2 focus:ring-[#660810]"
              >
                <option value="all">Semua Tahun</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filter Indicators */}
          {hasActiveFilters && (
            <div className="pt-2 flex items-center justify-between text-xs text-[#5D4B4B] border-t border-[#EAE2E2]">
              <div className="flex items-center gap-2 flex-wrap">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#660810]" />
                <span>Filter aktif terpasang</span>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-[#660810] font-semibold hover:underline cursor-pointer"
              >
                Atur Ulang Filter
              </button>
            </div>
          )}
        </div>

        {/* Content States */}
        <div className="mt-10">
          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-[#FFFFFF] border border-[#D6C0B1] rounded-lg p-5 space-y-4 animate-pulse"
                >
                  <div className="w-full h-64 bg-[#E8E0E0] rounded-md" />
                  <div className="h-5 bg-[#E8E0E0] rounded-sm w-3/4" />
                  <div className="h-4 bg-[#E8E0E0] rounded-sm w-full" />
                  <div className="h-3 bg-[#E8E0E0] rounded-sm w-1/3" />
                </div>
              ))}
            </div>
          )}

          {/* Error State with Retry Affordance */}
          {!loading && error && (
            <div className="bg-[#FFFFFF] border border-[#E5D4C0] rounded-xl p-8 max-w-xl mx-auto text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-[#FDF3F2] text-[#B3261E] flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-editorial text-xl font-bold text-[#270707]">
                Terjadi Kendala Memuat Data
              </h3>
              <p className="text-sm text-[#5D4B4B] leading-relaxed">
                {error}
              </p>
              <button
                type="button"
                onClick={fetchMagazines}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#660810] text-[#F1EBEB] text-sm font-semibold hover:bg-[#50060C] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Coba Muat Ulang</span>
              </button>
            </div>
          )}

          {/* Empty Search Results State */}
          {!loading && !error && total === 0 && hasActiveFilters && (
            <div className="text-center py-16 px-6 rounded-xl border border-dashed border-[#D6C0B1] bg-[#FFFFFF] max-w-xl mx-auto shadow-xs">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#EAE2E2] text-[#6B5A5A] flex items-center justify-center mb-4">
                <FileQuestion className="w-6 h-6" />
              </div>
              <h3 className="font-editorial text-xl font-bold text-[#270707] mb-2">
                Tidak Ada Majalah yang Sesuai
              </h3>
              <p className="text-sm text-[#5D4B4B] leading-relaxed max-w-md mx-auto mb-6">
                Tidak ditemukan hasil untuk kriteria pencarian atau filter yang dipilih. Silakan ubah kata kunci atau setel ulang filter.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#660810] text-[#F1EBEB] text-xs font-semibold hover:bg-[#50060C]"
              >
                Reset Semua Filter
              </button>
            </div>
          )}

          {/* Empty Catalogue State (Initial state required by PRD Section 6.4, 7, & 10) */}
          {!loading && !error && total === 0 && !hasActiveFilters && (
            <div className="text-center py-20 px-6 rounded-xl border border-dashed border-[#D6C0B1] bg-[#FFFFFF] max-w-2xl mx-auto shadow-xs">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#F6ECEC] text-[#660810] flex items-center justify-center mb-5">
                <Library className="w-8 h-8" />
              </div>
              <h3 className="font-editorial text-2xl font-bold text-[#270707] mb-3">
                Katalog Belum Memiliki Terbitan
              </h3>
              <p className="text-base text-[#5D4B4B] leading-relaxed max-w-lg mx-auto">
                Belum ada majalah yang diterbitkan. Karya terbaru akan tampil di sini setelah dipublikasikan.
              </p>
              <div className="mt-8 pt-6 border-t border-[#EAE2E2] text-xs text-[#6B5A5A] max-w-md mx-auto">
                Katalog ini menampilkan edisi yang telah dipublikasikan.
              </div>
            </div>
          )}

          {/* Magazine Cards Grid (when live records exist) */}
          {!loading && !error && allMagazines.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {allMagazines.map((mag) => (
                <MagazineCard key={mag.id} magazine={mag} />
              ))}
            </div>
          )}

          {!loading && !error && total > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-[#5D4B4B]">
              <span>
                Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} dari {total} majalah
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="inline-flex items-center gap-1 rounded border border-[#D6C0B1] bg-white px-3 py-2 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Sebelumnya
                </button>
                <span>Halaman {page} dari {Math.max(1, Math.ceil(total / pageSize))}</span>
                <button
                  type="button"
                  disabled={page >= Math.ceil(total / pageSize)}
                  onClick={() => setPage((current) => current + 1)}
                  className="inline-flex items-center gap-1 rounded border border-[#D6C0B1] bg-white px-3 py-2 disabled:opacity-40"
                >
                  Berikutnya
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
