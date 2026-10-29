/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useRouter } from '../../router/Router.tsx';
import { ROUTES, ADMIN_ROUTES } from '../../constants/routes.ts';
import { magazineService } from '../../services/magazineService.ts';
import { Magazine, AdminStats, MagazineStatus, MagazineFormInput } from '../../types/magazine.ts';
import { formatSemesterYear, formatIndonesianDate } from '../../utils/magazineUtils.ts';
import { ApiClientError } from '../../services/apiClient.ts';
import { MAX_PDF_SIZE_BYTES } from '../../constants/upload.ts';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  FileText,
  Upload,
  CheckCircle,
  Clock,
  Trash2,
  Edit3,
  ExternalLink,
  X,
  AlertTriangle,
  FolderOpen,
  LogOut,
  ChevronRight,
  Info,
  ShieldAlert,
} from 'lucide-react';

export function AdminDashboardPage() {
  const { navigate } = useRouter();

  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalPublications: 0,
    publishedCount: 0,
    draftCount: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<MagazineStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const pageSize = 24;

  // Modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Magazine | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Magazine | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

  // Form state for new publication
  const [formData, setFormData] = useState<MagazineFormInput>({
    title: '',
    description: '',
    theme: '',
    semester: 1,
    publicationYear: new Date().getFullYear(),
    status: 'draft',
    file: null,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    magazineService.getAdminSession()
      .then(() => {
        if (active) setAuthorized(true);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiClientError && error.status === 401) {
          navigate(ADMIN_ROUTES.LOGIN, { replace: true });
          return;
        }
        setPageError(error instanceof Error ? error.message : 'Gagal memeriksa sesi admin.');
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!authorized) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setListError(null);
      magazineService.getAdminMagazines({
        search: searchTerm,
        status: statusFilter,
      }, page, pageSize, controller.signal)
        .then((result) => {
          setMagazines(result.items);
          setTotal(result.total);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          if (error instanceof ApiClientError && error.status === 401) {
            navigate(ADMIN_ROUTES.LOGIN, { replace: true });
            return;
          }
          setMagazines([]);
          setTotal(0);
          setListError(error instanceof Error ? error.message : 'Gagal memuat data publikasi.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 200);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [authorized, searchTerm, statusFilter, page, reloadKey]);

  useEffect(() => {
    if (!authorized) return;
    setStatsLoading(true);
    setStatsError(null);
    magazineService.getAdminStats()
      .then((result) => {
        setStats(result);
        setStatsLoading(false);
      })
      .catch((error: unknown) => {
        if (error instanceof ApiClientError && error.status === 401) {
          navigate(ADMIN_ROUTES.LOGIN, { replace: true });
          return;
        }
        setStatsError(error instanceof Error ? error.message : 'Gagal memuat ringkasan publikasi.');
      });
  }, [authorized, reloadKey]);

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setFeedbackToast({ message, type });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4500);
  };

  const openNewMagazine = () => {
    setEditingTarget(null);
    setFormErrors({});
    setFormData({
      title: '',
      description: '',
      theme: '',
      semester: 1,
      publicationYear: new Date().getFullYear(),
      status: 'draft',
      file: null,
    });
    setIsUploadModalOpen(true);
  };

  const openEditMagazine = (magazine: Magazine) => {
    setEditingTarget(magazine);
    setFormErrors({});
    setFormData({
      title: magazine.title,
      description: magazine.description,
      theme: magazine.theme,
      semester: magazine.semester,
      publicationYear: magazine.publicationYear,
      status: magazine.status,
      file: null,
    });
    setIsUploadModalOpen(true);
  };

  const handleFormSubmit = async (targetStatus: MagazineStatus = formData.status) => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'Judul majalah wajib diisi.';
    if (!formData.description.trim()) errors.description = 'Deskripsi edisi wajib diisi.';
    if (!formData.theme.trim()) errors.theme = 'Tema edisi wajib ditentukan.';
    if (!Number.isInteger(formData.publicationYear) || formData.publicationYear < 2000) {
      errors.publicationYear = 'Tahun terbit tidak valid.';
    }
    if (!editingTarget && !formData.file) errors.file = 'Pilih berkas PDF untuk diunggah.';
    if (formData.file && !formData.file.name.toLowerCase().endsWith('.pdf')) {
      errors.file = 'Pilih berkas dengan ekstensi PDF.';
    }
    if (formData.file && formData.file.size > MAX_PDF_SIZE_BYTES) {
      errors.file = 'Ukuran PDF maksimal 50 MB.';
    }
    if (formData.file && formData.file.size === 0) errors.file = 'Berkas PDF tidak boleh kosong.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (
      editingTarget?.status !== 'published' &&
      targetStatus === 'published' &&
      !window.confirm('Majalah ini akan tampil di katalog publik. Lanjutkan publikasi?')
    ) {
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    try {
      const payload: MagazineFormInput = {
        ...formData,
        status: targetStatus,
      };

      if (editingTarget) {
        await magazineService.updateMagazine(editingTarget.id, payload);
        showToast('Metadata majalah berhasil diperbarui.', 'success');
      } else {
        await magazineService.createMagazine(payload);
        showToast(
          targetStatus === 'published'
            ? 'Majalah berhasil diunggah dan dipublikasikan.'
            : 'Majalah berhasil diunggah sebagai draf.',
          'success',
        );
      }
      setIsUploadModalOpen(false);
      setEditingTarget(null);
      setFormData({
        title: '',
        description: '',
        theme: '',
        semester: 1,
        publicationYear: new Date().getFullYear(),
        status: 'draft',
        file: null,
      });
      setReloadKey((key) => key + 1);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Gagal menyimpan publikasi.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await magazineService.deleteMagazine(deleteTarget.id);
      showToast('Majalah dan berkas PDF berhasil dihapus.', 'success');
      setDeleteTarget(null);
      setPage(1);
      setReloadKey((key) => key + 1);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Gagal menghapus publikasi.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await magazineService.logout();
      navigate(ADMIN_ROUTES.LOGIN, { replace: true });
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Gagal mengakhiri sesi admin.', 'error');
    }
  };
  const dashboardError = pageError ?? listError ?? statsError;

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1EBEB] text-sm text-[#5D4B4B]">
        Memeriksa sesi admin...
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1EBEB] p-6">
        <div className="max-w-md rounded-xl border border-[#D6C0B1] bg-white p-8 text-center">
          <h1 className="font-editorial text-2xl font-bold text-[#270707]">Dasbor tidak tersedia</h1>
          <p className="mt-3 text-sm text-[#5D4B4B]">
            {pageError ?? 'Sesi admin tidak ditemukan. Silakan masuk kembali.'}
          </p>
          <button
            type="button"
            onClick={() => navigate(ADMIN_ROUTES.LOGIN, { replace: true })}
            className="mt-5 rounded-lg bg-[#660810] px-4 py-2 text-sm font-semibold text-white"
          >
            Ke halaman masuk
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1EBEB] pb-24">
      {/* Admin Top Banner */}
      <div className="bg-[#270707] text-[#F1EBEB] border-b border-[#44171B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold bg-[#660810] px-2 py-0.5 rounded text-[11px] text-[#F1EBEB]">
            Pengelola Publikasi
            </span>
            <span className="text-[#D6C0B1] hidden sm:inline">
            Sesi admin terlindungi
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(ROUTES.HOME)}
              className="text-[#D6C0B1] hover:text-[#FFFFFF] underline cursor-pointer"
            >
              Pratinjau Situs Publik
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-[#D6C0B1] hover:text-[#FFFFFF] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Admin Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Breadcrumb & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#D6C0B1]">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#5D4B4B] mb-1">
              <span>Admin</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#270707] font-medium">Dasbor Publikasi</span>
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#270707]">
              Kelola Majalah Digital
            </h1>
            <p className="text-sm text-[#5D4B4B] mt-1">
              Pusat penerbitan majalah cetak dan arsip digital karya santri MA Plus Abu Hurairah.
            </p>
          </div>

          <button
            type="button"
            onClick={openNewMagazine}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#660810] text-[#F1EBEB] text-sm font-semibold hover:bg-[#50060C] shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#660810]"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Majalah</span>
          </button>
        </div>

        {dashboardError && (
        <div className="mt-6 bg-[#FFFFFF] border border-[#D6C0B1] rounded-xl p-4 flex items-start gap-3 text-xs text-[#5D4B4B]">
          <Info className="w-4 h-4 text-[#660810] shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold text-[#270707]">Data publikasi tidak dapat dimuat</p>
            <p>{dashboardError}</p>
          </div>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="font-semibold text-[#660810] hover:underline">
            Coba lagi
          </button>
        </div>
        )}

        {/* Summary Metric Cards (Initialised to 0 as required by PRD Section 9.2 & 10) */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#D6C0B1] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#5D4B4B]">Total Publikasi</span>
              <div className="w-8 h-8 rounded-md bg-[#F6ECEC] text-[#660810] flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold font-editorial text-[#270707]">
                    {statsLoading ? '—' : stats.totalPublications}
              </span>
              <p className="text-[11px] text-[#6B5A5A] mt-1">Seluruh edisi tersimpan</p>
            </div>
          </div>

          <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#D6C0B1] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#5D4B4B]">Majalah Terbit</span>
              <div className="w-8 h-8 rounded-md bg-[#F6ECEC] text-[#660810] flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold font-editorial text-[#270707]">
                {statsLoading ? '—' : stats.publishedCount}
              </span>
              <p className="text-[11px] text-[#6B5A5A] mt-1">Dapat dibaca di katalog publik</p>
            </div>
          </div>

          <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#D6C0B1] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#5D4B4B]">Draf Disimpan</span>
              <div className="w-8 h-8 rounded-md bg-[#F6ECEC] text-[#660810] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold font-editorial text-[#270707]">
                {statsLoading ? '—' : stats.draftCount}
              </span>
              <p className="text-[11px] text-[#6B5A5A] mt-1">Edisi belum dipublikasikan</p>
            </div>
          </div>

          <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#D6C0B1] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#5D4B4B]">Pembaca Digital</span>
              <div className="w-8 h-8 rounded-md bg-[#F6ECEC] text-[#660810] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold font-editorial text-[#270707]">
                —
              </span>
              <p className="text-[11px] text-[#6B5A5A] mt-1">Belum ada data pembacaan</p>
            </div>
          </div>
        </div>

        {/* Publications Table Section */}
        <div className="mt-10 bg-[#FFFFFF] rounded-xl border border-[#D6C0B1] shadow-xs overflow-hidden">
          {/* Table Toolbar */}
          <div className="p-4 sm:p-5 border-b border-[#D6C0B1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <label htmlFor="admin-search-input" className="sr-only">
                Cari publikasi
              </label>
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5A5A]" />
              <input
                id="admin-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari berdasarkan judul atau tema..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D6C0B1] bg-[#F1EBEB] text-xs text-[#270707] placeholder-[#6B5A5A] focus:outline-none focus:ring-2 focus:ring-[#660810]"
              />
            </div>

            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-[#6B5A5A]" />
              <label htmlFor="admin-status-filter" className="sr-only">
                Filter Status
              </label>
              <select
                id="admin-status-filter"
                value={statusFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'all' || value === 'draft' || value === 'published') {
                    setStatusFilter(value);
                  }
                  setPage(1);
                }}
                className="px-3 py-2 rounded-lg border border-[#D6C0B1] bg-[#F1EBEB] text-xs text-[#270707] focus:outline-none focus:ring-2 focus:ring-[#660810]"
              >
                <option value="all">Semua Status</option>
                <option value="published">Terbit</option>
                <option value="draft">Draf</option>
              </select>
            </div>
          </div>

          {/* Table Body or Empty State */}
          {loading ? (
            <div className="p-12 text-center text-xs text-[#6B5A5A]">
              Memuat data publikasi...
            </div>
          ) : listError && magazines.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8C1D18]">
              Data publikasi belum dapat dimuat. Gunakan tombol coba lagi di atas.
            </div>
          ) : magazines.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F1EBEB] border-b border-[#D6C0B1] text-[#5D4B4B] font-semibold">
                    <th className="py-3.5 px-4">Judul Majalah</th>
                    <th className="py-3.5 px-4">Tema</th>
                    <th className="py-3.5 px-4">Semester & Tahun</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Pembaruan</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D6C0B1]">
                  {magazines.map((mag) => (
                    <tr key={mag.id} className="hover:bg-[#F1EBEB]/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#270707]">
                        {mag.title}
                      </td>
                      <td className="py-3.5 px-4 text-[#5D4B4B]">{mag.theme}</td>
                      <td className="py-3.5 px-4 text-[#5D4B4B]">
                        {formatSemesterYear(mag.semester, mag.publicationYear)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            mag.status === 'published'
                              ? 'bg-[#F6ECEC] text-[#660810]'
                              : 'bg-[#EAE2E2] text-[#5D4B4B]'
                          }`}
                        >
                          {mag.status === 'published' ? 'Terbit' : 'Draf'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#6B5A5A]">
                        {formatIndonesianDate(mag.publishedAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(ROUTES.MAGAZINE_DETAIL(mag.slug))}
                            className="p-1 text-[#5D4B4B] hover:text-[#660810]"
                            title="Pratinjau Pembaca"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditMagazine(mag)}
                            className="p-1 text-[#5D4B4B] hover:text-[#660810]"
                            title="Ubah Metadata"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(mag)}
                            className="p-1 text-[#B3261E] hover:text-[#8C1D18]"
                            title="Hapus Publikasi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : searchTerm.trim().length > 0 || statusFilter !== 'all' ? (
            <div className="px-6 py-16 text-center">
              <h3 className="font-editorial text-xl font-bold text-[#270707]">Tidak ada publikasi yang sesuai</h3>
              <p className="mt-2 text-xs text-[#5D4B4B]">Ubah pencarian atau filter status untuk melihat publikasi lain.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPage(1);
                }}
                className="mt-4 rounded-lg border border-[#D6C0B1] px-4 py-2 text-xs font-semibold text-[#660810]"
              >
                Atur ulang filter
              </button>
            </div>
          ) : (
            /* Mandated Empty State PRD Section 9.2 */
            <div className="text-center py-20 px-6">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#F6ECEC] text-[#660810] border border-[#D6C0B1] flex items-center justify-center mb-4">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h3 className="font-editorial text-xl font-bold text-[#270707] mb-2">
                Belum Ada Publikasi
              </h3>
              <p className="text-xs text-[#5D4B4B] max-w-md mx-auto leading-relaxed mb-6">
                Belum ada publikasi. Unggah PDF pertama untuk mulai mengelola majalah digital.
              </p>
              <button
                type="button"
                onClick={openNewMagazine}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#660810] text-[#F1EBEB] text-xs font-semibold hover:bg-[#50060C] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Unggah Edisi Pertama</span>
              </button>
            </div>
          )}

          {!loading && total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#D6C0B1] px-4 py-3 text-xs text-[#5D4B4B]">
              <span>
                Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} dari {total} publikasi
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded border border-[#D6C0B1] px-3 py-1.5 disabled:opacity-40"
                >
                  Sebelumnya
                </button>
                <span>Halaman {page} / {Math.max(1, Math.ceil(total / pageSize))}</span>
                <button
                  type="button"
                  disabled={page >= Math.ceil(total / pageSize)}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded border border-[#D6C0B1] px-3 py-1.5 disabled:opacity-40"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload/Edit Modal as required by PRD Section 9.3 */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#270707]/60 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] border border-[#D6C0B1] rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#D6C0B1]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-[#F6ECEC] text-[#660810] flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-editorial text-xl font-bold text-[#270707]">
                    {editingTarget ? 'Ubah Metadata Majalah' : 'Tambah Publikasi Majalah'}
                  </h3>
                  <p className="text-xs text-[#5D4B4B]">
                    {editingTarget
                      ? 'Perbarui metadata dan status terbitan.'
                      : 'Unggah arsip PDF dan isi metadata terbitan.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-md text-[#6B5A5A] hover:text-[#270707] hover:bg-[#F1EBEB]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#F6ECEC] border border-[#D6C0B1] rounded-lg p-3 text-xs text-[#5D4B4B] flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-[#660810] shrink-0 mt-0.5" />
              <span>
                Berkas disimpan di bucket privat. Tautan baca publik hanya diterbitkan sementara untuk majalah berstatus terbit.
              </span>
            </div>

            <div className="space-y-4">
              {/* PDF File Picker & Drag-and-drop Zone */}
              {!editingTarget && <div>
                <label className="block text-xs font-semibold text-[#270707] mb-1.5">
                  Berkas Dokumen PDF
                </label>
                <div className="border-2 border-dashed border-[#D6C0B1] rounded-xl p-6 text-center bg-[#F1EBEB] hover:bg-[#EAE2E2] transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf"
                    aria-label="Pilih berkas PDF"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFormData({ ...formData, file });
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2 pointer-events-none">
                    <Upload className="w-8 h-8 text-[#660810] mx-auto" />
                    {formData.file ? (
                      <div className="text-xs">
                        <p className="font-semibold text-[#660810]">
                          Berkas dipilih: {formData.file.name}
                        </p>
                        <p className="text-[#6B5A5A]">
                          {(formData.file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="text-xs text-[#5D4B4B]">
                        <p className="font-semibold text-[#270707]">
                          Klik untuk memilih atau seret berkas PDF ke sini
                        </p>
                        <p className="text-[#6B5A5A]">Format PDF saja (maksimal 50 MB)</p>
                      </div>
                    )}
                  </div>
                </div>
                {formErrors.file && (
                  <p className="mt-1 text-[11px] text-[#B3261E]">{formErrors.file}</p>
                )}
              </div>}

              {/* Title */}
              <div>
                <label htmlFor="form-title" className="block text-xs font-semibold text-[#270707] mb-1">
                  Judul Majalah <span className="text-[#B3261E]">*</span>
                </label>
                <input
                  id="form-title"
                  type="text"
                  required
                  maxLength={160}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Lentera Pena Edisi 1"
                  className="w-full px-3 py-2 rounded-lg border border-[#D6C0B1] bg-[#F1EBEB] text-xs text-[#270707] focus:outline-none focus:ring-2 focus:ring-[#660810]"
                />
                {formErrors.title && (
                  <p className="text-[11px] text-[#B3261E] mt-1">{formErrors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="form-description" className="block text-xs font-semibold text-[#270707] mb-1">
                  Deskripsi / Sinopsis Edisi <span className="text-[#B3261E]">*</span>
                </label>
                <textarea
                  id="form-description"
                  rows={3}
                  required
                  maxLength={5000}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jelaskan ringkasan isi dan gagasan utama majalah edisi ini..."
                  className="w-full px-3 py-2 rounded-lg border border-[#D6C0B1] bg-[#F1EBEB] text-xs text-[#270707] focus:outline-none focus:ring-2 focus:ring-[#660810]"
                />
                {formErrors.description && (
                  <p className="text-[11px] text-[#B3261E] mt-1">{formErrors.description}</p>
                )}
              </div>

              {/* Theme & Semester & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="form-theme" className="block text-xs font-semibold text-[#270707] mb-1">
                    Tema Edisi <span className="text-[#B3261E]">*</span>
                  </label>
                  <input
                    id="form-theme"
                    type="text"
                    required
                    maxLength={120}
                    value={formData.theme}
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                    placeholder="Contoh: Dakwah Digital"
                    className="w-full px-3 py-2 rounded-lg border border-[#D6C0B1] bg-[#F1EBEB] text-xs text-[#270707] focus:outline-none focus:ring-2 focus:ring-[#660810]"
                  />
                  {formErrors.theme && (
                    <p className="text-[11px] text-[#B3261E] mt-1">{formErrors.theme}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="form-semester" className="block text-xs font-semibold text-[#270707] mb-1">
                    Semester <span className="text-[#B3261E]">*</span>
                  </label>
                  <select
                    id="form-semester"
                    value={formData.semester}
                    onChange={(e) => {
                      const semester = Number(e.target.value);
                      if (semester === 1 || semester === 2) {
                        setFormData({ ...formData, semester });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[#D6C0B1] bg-[#F1EBEB] text-xs text-[#270707] focus:outline-none focus:ring-2 focus:ring-[#660810]"
                  >
                    <option value={1}>Semester 1 (Ganjil)</option>
                    <option value={2}>Semester 2 (Genap)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="form-year" className="block text-xs font-semibold text-[#270707] mb-1">
                    Tahun Terbit <span className="text-[#B3261E]">*</span>
                  </label>
                  <input
                    id="form-year"
                    type="number"
                    min={2000}
                    max={new Date().getFullYear() + 1}
                    value={formData.publicationYear}
                    onChange={(e) =>
                      setFormData({ ...formData, publicationYear: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#D6C0B1] bg-[#F1EBEB] text-xs text-[#270707] focus:outline-none focus:ring-2 focus:ring-[#660810]"
                  />
                  {formErrors.publicationYear && (
                    <p className="text-[11px] text-[#B3261E] mt-1">{formErrors.publicationYear}</p>
                  )}
                </div>
              </div>
              {editingTarget && (
                <div>
                  <label htmlFor="form-status" className="block text-xs font-semibold text-[#270707] mb-1">
                    Status Publikasi
                  </label>
                  <select
                    id="form-status"
                    value={formData.status}
                    onChange={(e) => {
                      const status = e.target.value;
                      if (status === 'draft' || status === 'published') {
                        setFormData({ ...formData, status });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[#D6C0B1] bg-[#F1EBEB] text-xs text-[#270707] focus:outline-none focus:ring-2 focus:ring-[#660810]"
                  >
                    <option value="draft">Draf — tidak tampil di katalog publik</option>
                    <option value="published">Terbit — tampil di katalog publik</option>
                  </select>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-[#D6C0B1] flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setEditingTarget(null);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-[#D6C0B1] text-xs font-medium text-[#5D4B4B] hover:bg-[#F1EBEB]"
              >
                Batal
              </button>
              {editingTarget ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleFormSubmit()}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#660810] text-xs font-semibold text-[#F1EBEB] hover:bg-[#50060C] disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleFormSubmit('draft')}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#F1EBEB] border border-[#D6C0B1] text-xs font-semibold text-[#270707] hover:bg-[#EAE2E2] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Mengunggah...' : 'Simpan Draf'}
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleFormSubmit('published')}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#660810] text-xs font-semibold text-[#F1EBEB] hover:bg-[#50060C] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Mengunggah...' : 'Publikasikan Majalah'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete Action */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#270707]/60 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] border border-[#D6C0B1] rounded-xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#FDF3F2] text-[#B3261E] flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-editorial text-lg font-bold text-[#270707]">
              Konfirmasi Penghapusan
            </h3>
            <p className="text-xs text-[#5D4B4B] leading-relaxed">
              Apakah Anda yakin ingin menghapus arsip <strong className="text-[#270707]">{deleteTarget.title}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 rounded-lg border border-[#D6C0B1] text-xs text-[#5D4B4B] hover:bg-[#F1EBEB]"
              >
                Batalkan
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-3 py-1.5 rounded-lg bg-[#B3261E] text-xs font-semibold text-[#FFFFFF] hover:bg-[#8C1D18] disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating feedback toast */}
      {feedbackToast && (
        <div className={`fixed bottom-6 right-6 z-50 max-w-md rounded-xl p-4 shadow-xl border text-xs flex items-start gap-3 ${
          feedbackToast.type === 'error'
            ? 'bg-[#3D0C10] text-[#F1EBEB] border-[#8C1D18]'
            : 'bg-[#270707] text-[#F1EBEB] border-[#44171B]'
        }`}>
          <Info className="w-4 h-4 text-[#D6C0B1] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-[#F1EBEB]">
              {feedbackToast.type === 'error' ? 'Terjadi Kendala' : 'Pembaruan Publikasi'}
            </p>
            <p className="text-[#D6C0B1] mt-0.5 leading-relaxed">{feedbackToast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackToast(null)}
            className="text-[#6B5A5A] hover:text-[#F1EBEB]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
