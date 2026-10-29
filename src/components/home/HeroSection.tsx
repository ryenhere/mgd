/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BookOpen, ArrowRight, Sparkles, ScrollText } from 'lucide-react';
import { ROUTES } from '../../constants/routes.ts';
import { Link } from '../../router/Router.tsx';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-[#D6C0B1]">
      {/* Subtle background ambient paper ornamentation */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#660810_1px,transparent_1px)] [background-size:24px_24px]" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-3xl">
          {/* Subtle Edition Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F6ECEC] text-[#660810] text-xs font-semibold tracking-wide mb-6 border border-[#D6C0B1]">
            <Sparkles className="w-3.5 h-3.5 text-[#660810]" />
            <span>Terbit Berkala Setiap Semester • MA Plus Abu Hurairah</span>
          </div>

          {/* Heading from PRD Section 6.2 */}
          <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#270707] leading-[1.12]">
            Dakwah yang Hidup dalam Tulisan.
          </h1>

          {/* Supporting copy from PRD Section 6.2 */}
          <p className="mt-6 text-lg sm:text-xl text-[#5D4B4B] font-normal leading-relaxed max-w-2xl">
            Media Madrasah adalah ruang karya para santri untuk menyebarkan ilmu, gagasan, dan nilai-nilai Islam melalui majalah yang terbit setiap semester.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Link
              href={ROUTES.CATALOGUE}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-md bg-[#660810] text-[#F1EBEB] text-base font-semibold shadow-xs hover:bg-[#50060C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#660810] focus-visible:ring-offset-2 transition-all cursor-pointer"
            >
              <BookOpen className="w-5 h-5 text-[#F1EBEB]" />
              <span>Jelajahi Majalah</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href={ROUTES.ABOUT}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md bg-[#F1EBEB] border border-[#D6C0B1] text-[#270707] text-base font-medium hover:bg-[#EAE2E2] hover:border-[#C7AE9E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#660810] transition-colors cursor-pointer"
            >
              <ScrollText className="w-4 h-4 text-[#660810]" />
              <span>Tentang Media Madrasah</span>
            </Link>
          </div>

          {/* Key Editorial Note */}
          <div className="mt-12 pt-6 border-t border-[#D6C0B1]/80 flex items-center gap-6 text-xs text-[#6B5A5A]">
            <div>
              <span className="font-semibold text-[#270707]">Edisi Tematik</span>
              <p className="text-[#5D4B4B]">Tema berganti setiap semester</p>
            </div>
            <div className="w-px h-8 bg-[#D6C0B1]" />
            <div>
              <span className="font-semibold text-[#270707]">Arsip Digital</span>
              <p className="text-[#5D4B4B]">Katalog cetak ramah bacaan digital</p>
            </div>
            <div className="w-px h-8 bg-[#D6C0B1]" />
            <div>
              <span className="font-semibold text-[#270707]">Karya Santri</span>
              <p className="text-[#5D4B4B]">Murni tulisan & karya pemuda</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
