/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Magazine } from '../../types/magazine.ts';
import { ROUTES } from '../../constants/routes.ts';
import { Link } from '../../router/Router.tsx';
import { BookOpen, Calendar, ArrowRight } from 'lucide-react';
import { formatSemesterYear } from '../../utils/magazineUtils.ts';

interface MagazineCardProps {
  magazine: Magazine;
}

export function MagazineCard({ magazine }: MagazineCardProps) {
  return (
    <article className="group bg-[#FFFFFF] rounded-lg border border-[#D6C0B1] shadow-xs hover:border-[#C7AE9E] hover:shadow-md transition-all flex flex-col overflow-hidden">
      {/* Cover / Preview Area */}
      <div className="relative aspect-[3/4] bg-[#EAE2E2] border-b border-[#D6C0B1] flex items-center justify-center p-6 overflow-hidden">
        {magazine.coverImageUrl ? (
          <img
            src={magazine.coverImageUrl}
            alt={`Sampul ${magazine.title}`}
            className="w-full h-full object-cover rounded-sm shadow-xs transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="text-center p-6 border border-dashed border-[#D6C0B1] rounded-md bg-[#F1EBEB] w-full h-full flex flex-col items-center justify-center">
            <BookOpen className="w-10 h-10 text-[#660810]/60 mb-3" />
            <span className="font-editorial text-sm font-semibold text-[#270707] line-clamp-2">
              {magazine.title}
            </span>
            <span className="text-[11px] text-[#5D4B4B] mt-1">
              Tema: {magazine.theme}
            </span>
          </div>
        )}

        {/* Theme Pill */}
        <div className="absolute top-3 left-3 bg-[#660810] text-[#F1EBEB] text-xs font-semibold px-2.5 py-1 rounded shadow-xs">
          {magazine.theme}
        </div>
      </div>

      {/* Details Area */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 text-xs text-[#660810] font-semibold mb-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatSemesterYear(magazine.semester, magazine.publicationYear)}</span>
        </div>

        <h3 className="font-editorial text-xl font-bold text-[#270707] group-hover:text-[#660810] transition-colors line-clamp-1 mb-2">
          {magazine.title}
        </h3>

        <p className="text-sm text-[#5D4B4B] line-clamp-2 leading-relaxed mb-4 flex-1">
          {magazine.description}
        </p>

        <div className="pt-3 border-t border-[#EAE2E2] flex items-center justify-between mt-auto">
          <Link
            href={ROUTES.MAGAZINE_DETAIL(magazine.slug)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#660810] hover:text-[#50060C] group-hover:underline"
          >
            <span>Baca Majalah</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
          {magazine.pageCount && (
            <span className="text-[11px] text-[#6B5A5A]">
              {magazine.pageCount} Halaman
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
