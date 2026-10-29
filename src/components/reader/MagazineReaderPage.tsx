import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useRouter, Link } from '../../router/Router.tsx';
import { ROUTES } from '../../constants/routes.ts';
import { magazineService } from '../../services/magazineService.ts';
import type { Magazine } from '../../types/magazine.ts';
import { formatSemesterYear, formatIndonesianDate } from '../../utils/magazineUtils.ts';
import {
  ArrowLeft,
  Calendar,
  Tag,
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronLeft,
  ChevronRight,
  Download,
  FileX,
  Loader2,
  AlertCircle,
  Expand,
  RefreshCw,
} from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export function MagazineReaderPage() {
  const { params } = useRouter();
  const slug = params.slug;
  const [magazine, setMagazine] = useState<Magazine | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [containerWidth, setContainerWidth] = useState(900);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    setViewerError(null);
    setMagazine(null);
    setPdfUrl(null);
    setNumPages(null);
    setCurrentPage(1);

    if (!slug) {
      setLoading(false);
      setLoadError('Majalah tidak ditemukan.');
      return () => {
        active = false;
      };
    }

    void (async () => {
      let detail: Magazine;
      try {
        detail = await magazineService.getMagazineBySlug(slug);
        if (!active) return;
        setMagazine(detail);
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : 'Gagal memuat majalah.');
        }
        return;
      } finally {
        if (active) setLoading(false);
      }

      try {
        const file = await magazineService.getMagazineFileUrl(detail.id);
        if (!active) return;
        setPdfUrl(file.url);
      } catch (error) {
        if (active) {
          setViewerError(error instanceof Error ? error.message : 'Gagal menyiapkan PDF.');
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [slug, retryKey]);

  useEffect(() => {
    const element = pdfContainerRef.current;
    if (!element) return;
    const updateWidth = () => setContainerWidth(element.clientWidth);
    updateWidth();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateWidth);
      observer.observe(element);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [magazine, loading]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleZoomIn = () => setZoomLevel((previous) => Math.min(previous + 15, 200));
  const handleZoomOut = () => setZoomLevel((previous) => Math.max(previous - 15, 50));
  const handleFitWidth = () => setZoomLevel(100);

  const toggleFullscreen = async () => {
    const viewerElement = document.getElementById('pdf-viewer-shell');
    try {
      if (!document.fullscreenElement) {
        await viewerElement?.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      setViewerError('Mode layar penuh tidak tersedia pada perangkat ini.');
    }
  };

  const retryPdf = () => {
    setViewerError(null);
    setRetryKey((key) => key + 1);
  };

  return (
    <div className="py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <nav className="flex items-center gap-2 text-xs text-[#5D4B4B]" aria-label="Breadcrumb">
          <Link href={ROUTES.HOME} className="hover:text-[#660810] transition-colors">
            Beranda
          </Link>
          <span>/</span>
          <Link href={ROUTES.CATALOGUE} className="hover:text-[#660810] transition-colors">
            Katalog Majalah
          </Link>
          <span>/</span>
          <span className="text-[#270707] font-medium truncate max-w-xs">
            {magazine?.title ?? slug ?? 'Pembaca Dokumen'}
          </span>
        </nav>

        <div>
          <Link
            href={ROUTES.CATALOGUE}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#660810] hover:text-[#50060C] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Katalog</span>
          </Link>
        </div>

        <div className="bg-[#FFFFFF] rounded-xl border border-[#D6C0B1] p-6 sm:p-8 shadow-xs">
          {loading ? (
            <div className="space-y-4 animate-pulse" aria-label="Memuat informasi majalah">
              <div className="h-4 bg-[#E8E0E0] rounded-sm w-32" />
              <div className="h-8 bg-[#E8E0E0] rounded-sm w-3/4" />
              <div className="h-4 bg-[#E8E0E0] rounded-sm w-full" />
            </div>
          ) : loadError ? (
            <div className="space-y-3" role="alert">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#F6ECEC] text-[#660810] text-xs font-semibold">
                <FileX className="h-4 w-4" />
                Terbitan tidak tersedia
              </div>
              <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#270707]">
                Majalah tidak ditemukan
              </h1>
              <p className="text-sm text-[#5D4B4B]">{loadError}</p>
            </div>
          ) : magazine ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#660810] text-[#F1EBEB] text-xs font-semibold">
                  <Tag className="w-3 h-3" />
                  {magazine.theme}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-[#660810] font-semibold">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatSemesterYear(magazine.semester, magazine.publicationYear)}
                </span>
                <span className="text-xs text-[#6B5A5A]">
                  • Diterbitkan: {formatIndonesianDate(magazine.publishedAt)}
                </span>
              </div>
              <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#270707]">
                {magazine.title}
              </h1>
              <p className="text-base text-[#5D4B4B] leading-relaxed max-w-3xl">
                {magazine.description}
              </p>
            </div>
          ) : null}
        </div>

        {magazine && (
          <div
            id="pdf-viewer-shell"
            className="bg-[#270707] rounded-xl border border-[#44171B] shadow-xl overflow-hidden flex flex-col text-[#F1EBEB]"
          >
            <div className="bg-[#330C10] border-b border-[#44171B] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!numPages || currentPage <= 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  className="p-1.5 rounded bg-[#44171B] text-[#D6C0B1] hover:text-[#F1EBEB] disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono px-2 py-1 bg-[#270707] rounded border border-[#44171B] text-[#F1EBEB]">
                  Halaman {currentPage} / {numPages ?? '—'}
                </span>
                <button
                  type="button"
                  disabled={!numPages || currentPage >= numPages}
                  onClick={() => setCurrentPage((page) => Math.min(numPages ?? page, page + 1))}
                  className="p-1.5 rounded bg-[#44171B] text-[#D6C0B1] hover:text-[#F1EBEB] disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Halaman Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 rounded bg-[#44171B] text-[#F1EBEB] hover:bg-[#5C1E23] transition-colors"
                  aria-label="Perkecil Tampilan"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-[#D6C0B1] w-12 text-center">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 rounded bg-[#44171B] text-[#F1EBEB] hover:bg-[#5C1E23] transition-colors"
                  aria-label="Perbesar Tampilan"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-[#44171B] mx-1" />
                <button
                  type="button"
                  onClick={handleFitWidth}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#44171B] text-xs text-[#F1EBEB] hover:bg-[#5C1E23]"
                  aria-label="Sesuaikan Lebar"
                >
                  <Expand className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Paskan Lebar</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded bg-[#44171B] text-[#F1EBEB] hover:bg-[#5C1E23]"
                  aria-label={isFullscreen ? 'Keluar dari Layar Penuh' : 'Layar Penuh'}
                >
                  <Maximize className="w-4 h-4" />
                </button>
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#44171B] text-xs text-[#F1EBEB] hover:bg-[#5C1E23]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Buka PDF</span>
                  </a>
                )}
              </div>
            </div>

            <div
              ref={pdfContainerRef}
              className="relative min-h-[500px] sm:min-h-[640px] bg-[#1F0507] flex items-start justify-center overflow-auto p-4 sm:p-8"
            >
              {loading && (
                <div className="self-center text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-[#D6C0B1] animate-spin mx-auto" />
                  <p className="text-sm text-[#D6C0B1]">Menyiapkan berkas majalah...</p>
                </div>
              )}
              {!loading && viewerError && (
                <div className="self-center text-center max-w-sm p-6 rounded-lg bg-[#3D0C10] border border-[#660810] space-y-3" role="alert">
                  <AlertCircle className="w-8 h-8 text-[#E25C58] mx-auto" />
                  <h2 className="text-base font-semibold text-[#F1EBEB]">Gagal Membuka Berkas</h2>
                  <p className="text-xs text-[#E8AEB1]">{viewerError}</p>
                  <button
                    type="button"
                    onClick={retryPdf}
                    className="inline-flex items-center gap-2 rounded bg-[#660810] px-3 py-2 text-xs font-semibold text-white hover:bg-[#50060C]"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Minta tautan baru dan coba lagi
                  </button>
                </div>
              )}
              {!loading && !viewerError && pdfUrl && (
                <Document
                  file={pdfUrl}
                  onLoadSuccess={({ numPages: pageCount }) => {
                    setNumPages(pageCount);
                    setCurrentPage(1);
                  }}
                  onLoadError={() => setViewerError('Tidak dapat merender dokumen PDF. Coba muat ulang berkas.')}
                  loading={
                    <div className="self-center text-center space-y-3">
                      <Loader2 className="w-8 h-8 text-[#D6C0B1] animate-spin mx-auto" />
                      <p className="text-sm text-[#D6C0B1]">Memuat halaman PDF...</p>
                    </div>
                  }
                  error={<div className="self-center text-sm text-[#E8AEB1]">PDF gagal dimuat.</div>}
                >
                  <Page
                    pageNumber={currentPage}
                    width={Math.max(1, Math.min(960, containerWidth - 32) * zoomLevel / 100)}
                    renderAnnotationLayer
                    renderTextLayer
                    loading={<Loader2 className="h-8 w-8 animate-spin text-[#660810]" />}
                  />
                </Document>
              )}
            </div>
            <p className="border-t border-[#44171B] bg-[#2D0B0F] px-4 py-2 text-center text-[11px] text-[#D6C0B1]">
              PDF dikirim ke browser untuk dibaca. Pembacaan di browser tidak mencegah penyimpanan atau tangkapan layar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
