/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PenTool, Calendar, Compass, Users, Quote } from 'lucide-react';

export function MissionSection() {
  return (
    <section id="tentang" className="py-20 md:py-28 bg-[#EAE2E2] border-b border-[#D6C0B1] scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl">
          <span className="text-xs font-bold tracking-wider uppercase text-[#660810] block mb-2">
            Tentang Kami & Landasan Dakwah
          </span>
          <h2 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight text-[#270707]">
            Misi & Identitas Media Madrasah
          </h2>
          <p className="mt-3 text-[#5D4B4B] text-base leading-relaxed">
            Menghidupkan tradisi literasi dan pemikiran Islam di lingkungan pesantren serta menyebarkannya kepada khalayak luas.
          </p>
        </div>

        {/* Brand Statement Callout (Editorial Quote Block) */}
        <div className="mt-12 relative bg-[#FFFFFF] border-l-4 border-[#660810] p-8 sm:p-10 rounded-r-lg shadow-xs border-y border-r border-[#D6C0B1]">
          <Quote className="w-10 h-10 text-[#660810]/20 absolute top-6 right-6 pointer-events-none" />
          <p className="font-editorial text-xl sm:text-2xl text-[#270707] leading-relaxed italic">
            “Tim Media Madrasah adalah tim yang beranggotakan <strong className="font-bold text-[#660810] not-italic">santri</strong> untuk membuat <strong className="font-bold text-[#660810] not-italic">majalah cetak</strong> yang terbit setiap semester dengan tema berbeda-beda sebagai ladang dakwah. Media Madrasah mengajak para pemuda meyakini bahwa <strong className="font-bold text-[#660810] not-italic">kita mampu menyebarkan Islam melalui tulisan</strong> yang kita tuliskan.”
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#660810] text-[#F1EBEB] flex items-center justify-center font-bold text-xs">
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

        {/* Pillars of Activity */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#FFFFFF] p-6 rounded-lg border border-[#D6C0B1] space-y-3">
            <div className="w-10 h-10 rounded-md bg-[#F6ECEC] text-[#660810] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-editorial text-lg font-bold text-[#270707]">
              Karya Asli Santri
            </h3>
            <p className="text-sm text-[#5D4B4B] leading-relaxed">
              Dipelopori, ditulis, dan dikurasi oleh para santri yang berproses mendalami ilmu agama dan literasi.
            </p>
          </div>

          <div className="bg-[#FFFFFF] p-6 rounded-lg border border-[#D6C0B1] space-y-3">
            <div className="w-10 h-10 rounded-md bg-[#F6ECEC] text-[#660810] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-editorial text-lg font-bold text-[#270707]">
              Terbit Setiap Semester
            </h3>
            <p className="text-sm text-[#5D4B4B] leading-relaxed">
              Majalah cetak dirilis secara berkala setiap semester sebagai wujud konsistensi berkarya dan evaluasi dakwah.
            </p>
          </div>

          <div className="bg-[#FFFFFF] p-6 rounded-lg border border-[#D6C0B1] space-y-3">
            <div className="w-10 h-10 rounded-md bg-[#F6ECEC] text-[#660810] flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-editorial text-lg font-bold text-[#270707]">
              Tema Berbeda Setiap Edisi
            </h3>
            <p className="text-sm text-[#5D4B4B] leading-relaxed">
              Menghadirkan topik tematik yang kontekstual dengan tantangan pemikiran dan kehidupan generasi muda saat ini.
            </p>
          </div>

          <div className="bg-[#FFFFFF] p-6 rounded-lg border border-[#D6C0B1] space-y-3">
            <div className="w-10 h-10 rounded-md bg-[#F6ECEC] text-[#660810] flex items-center justify-center">
              <PenTool className="w-5 h-5" />
            </div>
            <h3 className="font-editorial text-lg font-bold text-[#270707]">
              Dakwah Lewat Tulisan
            </h3>
            <p className="text-sm text-[#5D4B4B] leading-relaxed">
              Membangun keyakinan bahwa pena dan tulisan santri adalah instrumen ampuh untuk menyebarkan kebaikan Islam.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
