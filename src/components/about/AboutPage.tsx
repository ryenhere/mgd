/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link } from '../../router/Router.tsx';
import { ROUTES } from '../../constants/routes.ts';
import {
  BookOpen,
  ArrowRight,
  Users,
  Calendar,
  Compass,
  PenTool,
  Quote,
  Sparkles,
} from 'lucide-react';

export function AboutPage() {
  return (
    <div className="py-12 md:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-[#5D4B4B]" aria-label="Breadcrumb">
          <Link href={ROUTES.HOME} className="hover:text-[#660810] transition-colors">
            Beranda
          </Link>
          <span>/</span>
          <span className="text-[#270707] font-medium">Tentang Media Madrasah</span>
        </nav>

        {/* Hero Section of About Page */}
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F6ECEC] text-[#660810] text-xs font-semibold tracking-wide border border-[#D6C0B1]">
            <Sparkles className="w-3.5 h-3.5 text-[#660810]" />
            <span>Mengenal Redaksi Santri MA Plus Abu Hurairah</span>
          </div>

          <h1 className="font-editorial text-4xl sm:text-5xl font-bold tracking-tight text-[#270707] leading-[1.15]">
            Tentang Media Madrasah
          </h1>

          <p className="text-lg text-[#5D4B4B] leading-relaxed">
            Media Madrasah lahir sebagai wadah dakwah literasi santri untuk menyuarakan gagasan, ilmu, dan nilai-nilai Islam melalui media cetak dan arsip digital yang terbit berkala setiap semester.
          </p>
        </div>

        {/* Brand Statement Callout (Editorial Quote) */}
        <div className="relative bg-[#FFFFFF] border-l-4 border-[#660810] p-8 sm:p-12 rounded-r-2xl shadow-xs border-y border-r border-[#D6C0B1]">
          <Quote className="w-12 h-12 text-[#660810]/20 absolute top-6 right-6 pointer-events-none" />
          <span className="text-xs font-bold tracking-widest uppercase text-[#660810] block mb-3">
            Pernyataan Resmi Misi
          </span>
          <p className="font-editorial text-2xl sm:text-3xl text-[#270707] leading-relaxed italic">
            “Tim Media Madrasah adalah tim yang beranggotakan <strong className="font-bold text-[#660810] not-italic">santri</strong> untuk membuat <strong className="font-bold text-[#660810] not-italic">majalah cetak</strong> yang terbit setiap semester dengan tema berbeda-beda sebagai ladang dakwah. Media Madrasah mengajak para pemuda meyakini bahwa <strong className="font-bold text-[#660810] not-italic">kita mampu menyebarkan Islam melalui tulisan</strong> yang kita tuliskan.”
          </p>
          <div className="mt-8 pt-6 border-t border-[#EAE2E2] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#660810] text-[#F1EBEB] flex items-center justify-center font-bold text-xs">
              MM
            </div>
            <div>
              <p className="text-sm font-semibold text-[#270707]">
                Tim Redaksi Media Madrasah
              </p>
              <p className="text-xs text-[#5D4B4B]">
                MA Plus Abu Hurairah
              </p>
            </div>
          </div>
        </div>

        {/* 4 Pilar Gerakan Literasi */}
        <div className="space-y-6">
          <div className="max-w-2xl">
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#270707]">
              Pilar & Nilai Dasar
            </h2>
            <p className="text-sm text-[#5D4B4B] mt-1">
              Empat fondasi yang menjadi kompas gerak redaksi santri dalam setiap terbitan majalah.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#FFFFFF] p-8 rounded-xl border border-[#D6C0B1] shadow-xs space-y-4">
              <div className="w-11 h-11 rounded-lg bg-[#F6ECEC] text-[#660810] flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-editorial text-xl font-bold text-[#270707]">
                Beranggotakan Santri
              </h3>
              <p className="text-sm text-[#5D4B4B] leading-relaxed">
                Karya dan struktur redaksi sepenuhnya digerakkan oleh para santri. Menjadi kawah candradimuka untuk mengasah daya analisis, kedalaman riset dalil, dan kecakapan komunikasi tulis sejak masa madrasah.
              </p>
            </div>

            <div className="bg-[#FFFFFF] p-8 rounded-xl border border-[#D6C0B1] shadow-xs space-y-4">
              <div className="w-11 h-11 rounded-lg bg-[#F6ECEC] text-[#660810] flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-editorial text-xl font-bold text-[#270707]">
                Terbit Setiap Semester
              </h3>
              <p className="text-sm text-[#5D4B4B] leading-relaxed">
                Penerbitan dilakukan teratur pada setiap pergantian semester. Ritme berkala ini melatih kedisiplinan redaksi dan memberikan arsip dokumentasi pemikiran santri dari generasi ke generasi.
              </p>
            </div>

            <div className="bg-[#FFFFFF] p-8 rounded-xl border border-[#D6C0B1] shadow-xs space-y-4">
              <div className="w-11 h-11 rounded-lg bg-[#F6ECEC] text-[#660810] flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-editorial text-xl font-bold text-[#270707]">
                Tema Berbeda Tiap Edisi
              </h3>
              <p className="text-sm text-[#5D4B4B] leading-relaxed">
                Setiap nomor terbitan memiliki fokus tema tersendiri yang kontekstual dengan isu-isu kontemporer umat dan tantangan kehidupan pemuda muslim di era digital.
              </p>
            </div>

            <div className="bg-[#FFFFFF] p-8 rounded-xl border border-[#D6C0B1] shadow-xs space-y-4">
              <div className="w-11 h-11 rounded-lg bg-[#F6ECEC] text-[#660810] flex items-center justify-center">
                <PenTool className="w-6 h-6" />
              </div>
              <h3 className="font-editorial text-xl font-bold text-[#270707]">
                Dakwah Melalui Tulisan
              </h3>
              <p className="text-sm text-[#5D4B4B] leading-relaxed">
                Menanamkan keyakinan teguh bahwa pena adalah ladang dakwah yang abadi. Tulisan yang berbobot dan santun mampu menembus batas ruang dan waktu untuk menebarkan kebenaran Islam.
              </p>
            </div>
          </div>
        </div>

        {/* Siklus Penerbitan & Ekosistem */}
        <div className="bg-[#EAE2E2] border border-[#D6C0B1] rounded-2xl p-8 sm:p-10 space-y-8">
          <div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#270707]">
              Dari Naskah Santri Menjadi Majalah
            </h2>
            <p className="text-sm text-[#5D4B4B] mt-1">
              Proses kerja redaksi di lingkungan pesantren dalam mewujudkan majalah cetak dan digital.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#660810]">
                <span>01</span>
                <span className="w-8 h-px bg-[#660810]/40" />
              </div>
              <h4 className="font-editorial text-base font-bold text-[#270707]">
                Penetapan Tema
              </h4>
              <p className="text-xs text-[#5D4B4B] leading-relaxed">
                Musyawarah redaksi santri untuk menentukan topik sentral yang relevan di awal semester.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#660810]">
                <span>02</span>
                <span className="w-8 h-px bg-[#660810]/40" />
              </div>
              <h4 className="font-editorial text-base font-bold text-[#270707]">
                Riset & Penulisan
              </h4>
              <p className="text-xs text-[#5D4B4B] leading-relaxed">
                Santri mengumpulkan rujukan kitab, dalil, dan data pendukung untuk menyusun artikel bernas.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#660810]">
                <span>03</span>
                <span className="w-8 h-px bg-[#660810]/40" />
              </div>
              <h4 className="font-editorial text-base font-bold text-[#270707]">
                Kurasi & Tata Letak
              </h4>
              <p className="text-xs text-[#5D4B4B] leading-relaxed">
                Penyuntingan bahasa, uji kelayakan isi, dan desain perwajahan majalah agar nyaman dibaca.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#660810]">
                <span>04</span>
                <span className="w-8 h-px bg-[#660810]/40" />
              </div>
              <h4 className="font-editorial text-base font-bold text-[#270707]">
                Distribusi Cetak & Digital
              </h4>
              <p className="text-xs text-[#5D4B4B] leading-relaxed">
                Pencetakan fisik untuk lingkungan madrasah serta pengarsipan digital di portal Media Madrasah.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA to Catalogue */}
        <div className="text-center pt-8 border-t border-[#D6C0B1] space-y-4">
          <h3 className="font-editorial text-2xl font-bold text-[#270707]">
            Tertarik Menikmati Tulisan Santri?
          </h3>
          <p className="text-sm text-[#5D4B4B] max-w-md mx-auto">
            Kunjungi katalog majalah digital untuk menelusuri edisi dan topik yang telah dipublikasikan.
          </p>
          <div className="pt-2">
            <Link
              href={ROUTES.CATALOGUE}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#660810] text-[#F1EBEB] text-sm font-semibold hover:bg-[#50060C] transition-colors"
            >
              <BookOpen className="w-4 h-4 text-[#F1EBEB]" />
              <span>Buka Katalog Majalah</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
