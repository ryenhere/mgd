/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BookOpen, Feather } from 'lucide-react';
import { ROUTES } from '../../constants/routes.ts';
import { Link } from '../../router/Router.tsx';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#EAE2E2] border-t border-[#D6C0B1] text-[#5D4B4B] mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand & Editorial Identity */}
          <div className="md:col-span-7 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[#660810] text-[#F1EBEB] flex items-center justify-center shadow-xs">
                <BookOpen className="w-4 h-4 text-[#F1EBEB]" />
              </div>
              <span className="font-editorial text-xl font-bold text-[#270707]">
                Media Madrasah
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-xl text-[#5D4B4B]">
              Ruang publikasi dan dakwah karya santri MA Plus Abu Hurairah. Menyebarkan ilmu, hikmah, dan pemikiran Islam melalui majalah cetak dan arsip digital yang terbit berkala setiap semester.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#660810] font-semibold pt-1">
              <Feather className="w-3.5 h-3.5" />
              <span>Dakwah yang Hidup dalam Tulisan</span>
            </div>
          </div>

          {/* Navigasi Pintasan Publik dengan rute tersendiri: /home, /majalah, /tentang */}
          <div className="md:col-span-5 flex flex-col md:items-end space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#270707]">
              Pintasan Publik
            </h4>
            <ul className="space-y-2 text-sm text-left md:text-right">
              <li>
                <Link href={ROUTES.HOME} className="hover:text-[#660810] transition-colors">
                  Beranda (/home)
                </Link>
              </li>
              <li>
                <Link href={ROUTES.CATALOGUE} className="hover:text-[#660810] transition-colors">
                  Majalah Digital (/majalah)
                </Link>
              </li>
              <li>
                <Link href={ROUTES.ABOUT} className="hover:text-[#660810] transition-colors">
                  Tentang Media Madrasah (/tentang)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#D6C0B1] flex flex-col sm:flex-row items-center justify-between text-xs text-[#6B5A5A] gap-4">
          <p>
            © {currentYear} Tim Media Madrasah — MA Plus Abu Hurairah. Hak cipta dilindungi.
          </p>
          <p className="text-[#660810] italic font-serif">
            "Menulis untuk Menebar Manfaat dan Kebaikan"
          </p>
        </div>
      </div>
    </footer>
  );
}
