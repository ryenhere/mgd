/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useRouter, Link } from '../../router/Router.tsx';
import { ROUTES } from '../../constants/routes.ts';
import { BookOpen, Menu, X } from 'lucide-react';

export function Header() {
  const { path } = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active navigation states based on dedicated routes
  const isHome = path === ROUTES.HOME || path === ROUTES.ROOT;
  const isCatalogue = path.startsWith(ROUTES.CATALOGUE);
  const isAbout = path === ROUTES.ABOUT;

  return (
    <header className="sticky top-0 z-40 bg-[#F1EBEB]/95 backdrop-blur-md border-b border-[#D6C0B1] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Identity */}
          <Link
            href={ROUTES.HOME}
            className="group flex items-center gap-3.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#660810] rounded-lg p-1"
          >
            <div className="w-10 h-10 rounded-md bg-[#660810] text-[#F1EBEB] flex items-center justify-center shadow-xs group-hover:bg-[#50060C] transition-colors">
              <BookOpen className="w-5 h-5 text-[#F1EBEB]" />
            </div>
            <div className="flex flex-col">
              <span className="font-editorial text-xl sm:text-2xl font-bold tracking-tight text-[#270707] group-hover:text-[#660810] transition-colors leading-none">
                Media Madrasah
              </span>
              <span className="text-xs text-[#5D4B4B] font-medium tracking-wide mt-1">
                Santri MA Plus Abu Hurairah
              </span>
            </div>
          </Link>

          {/* Desktop Navigation with dedicated routes: /home, /majalah, /tentang */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium" aria-label="Navigasi Utama">
            {/* Beranda -> /home */}
            <Link
              href={ROUTES.HOME}
              className={`transition-colors py-2 relative text-sm ${
                isHome
                  ? 'text-[#660810] font-semibold'
                  : 'text-[#5D4B4B] hover:text-[#270707]'
              }`}
            >
              Beranda
              {isHome && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#660810] rounded-full" />
              )}
            </Link>

            {/* Majalah Digital -> /majalah */}
            <Link
              href={ROUTES.CATALOGUE}
              className={`transition-colors py-2 relative text-sm ${
                isCatalogue
                  ? 'text-[#660810] font-semibold'
                  : 'text-[#5D4B4B] hover:text-[#270707]'
              }`}
            >
              Majalah Digital
              {isCatalogue && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#660810] rounded-full" />
              )}
            </Link>

            {/* Tentang Media Madrasah -> /tentang */}
            <Link
              href={ROUTES.ABOUT}
              className={`transition-colors py-2 relative text-sm ${
                isAbout
                  ? 'text-[#660810] font-semibold'
                  : 'text-[#5D4B4B] hover:text-[#270707]'
              }`}
            >
              Tentang Media Madrasah
              {isAbout && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#660810] rounded-full" />
              )}
            </Link>
          </nav>

          {/* Mobile Menu Trigger */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-[#5D4B4B] hover:text-[#270707] hover:bg-[#E8E0E0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#660810]"
              aria-label={mobileMenuOpen ? 'Tutup navigasi' : 'Buka navigasi'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#D6C0B1] bg-[#F1EBEB] px-4 pt-2 pb-6 space-y-2 shadow-lg">
          <Link
            href={ROUTES.HOME}
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2.5 rounded-md text-base ${
              isHome
                ? 'bg-[#F6ECEC] text-[#660810] font-semibold'
                : 'text-[#5D4B4B] hover:bg-[#E8E0E0] hover:text-[#270707]'
            }`}
          >
            Beranda
          </Link>
          <Link
            href={ROUTES.CATALOGUE}
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2.5 rounded-md text-base ${
              isCatalogue
                ? 'bg-[#F6ECEC] text-[#660810] font-semibold'
                : 'text-[#5D4B4B] hover:bg-[#E8E0E0] hover:text-[#270707]'
            }`}
          >
            Majalah Digital
          </Link>
          <Link
            href={ROUTES.ABOUT}
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2.5 rounded-md text-base ${
              isAbout
                ? 'bg-[#F6ECEC] text-[#660810] font-semibold'
                : 'text-[#5D4B4B] hover:bg-[#E8E0E0] hover:text-[#270707]'
            }`}
          >
            Tentang Media Madrasah
          </Link>
        </div>
      )}
    </header>
  );
}
