/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useEffect } from 'react';
import { RouterProvider, useRouter } from './router/Router.tsx';
import { ROUTES, ADMIN_ROUTES } from './constants/routes.ts';
import { Header } from './components/layout/Header.tsx';
import { Footer } from './components/layout/Footer.tsx';
import { HeroSection } from './components/home/HeroSection.tsx';
import { MissionSection } from './components/home/MissionSection.tsx';
import { CataloguePreview } from './components/home/CataloguePreview.tsx';
import { CataloguePage } from './components/catalogue/CataloguePage.tsx';
import { AboutPage } from './components/about/AboutPage.tsx';
import { AdminLoginPage } from './components/admin/AdminLoginPage.tsx';
import { AdminDashboardPage } from './components/admin/AdminDashboardPage.tsx';
import { NotFoundPage } from './components/common/NotFoundPage.tsx';

const MagazineReaderPage = lazy(() =>
  import('./components/reader/MagazineReaderPage.tsx').then((module) => ({
    default: module.MagazineReaderPage,
  })),
);

function AppContent() {
  const { path } = useRouter();

  useEffect(() => {
    const isAdminRoute = path.startsWith('/admin');
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (isAdminRoute && !robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    if (robots) {
      if (isAdminRoute) robots.content = 'noindex, nofollow';
      else robots.remove();
    }
    document.title = isAdminRoute
      ? 'Admin — Media Madrasah'
      : 'Media Madrasah — Majalah Digital Santri MA Plus Abu Hurairah';
    return () => {
      if (isAdminRoute) robots?.remove();
    };
  }, [path]);

  // Route: /admin (Direct URL login)
  if (path === ADMIN_ROUTES.LOGIN) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F1EBEB]">
        <main className="flex-1">
          <AdminLoginPage />
        </main>
      </div>
    );
  }

  // Route: /admin/dashboard (Direct URL admin content management)
  if (path === ADMIN_ROUTES.DASHBOARD) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F1EBEB]">
        <main className="flex-1">
          <AdminDashboardPage />
        </main>
      </div>
    );
  }

  // Route: / atau /home (Beranda)
  if (path === ROUTES.ROOT || path === ROUTES.HOME) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F1EBEB]">
        <Header />
        <main className="flex-1">
          <HeroSection />
          <MissionSection />
          <CataloguePreview />
        </main>
        <Footer />
      </div>
    );
  }

  // Route: /majalah (Majalah Digital)
  if (path === ROUTES.CATALOGUE) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F1EBEB]">
        <Header />
        <main className="flex-1">
          <CataloguePage />
        </main>
        <Footer />
      </div>
    );
  }

  // Route: /tentang (Tentang Media Madrasah)
  if (path === ROUTES.ABOUT) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F1EBEB]">
        <Header />
        <main className="flex-1">
          <AboutPage />
        </main>
        <Footer />
      </div>
    );
  }

  // Route: /majalah/:slug (Magazine Reader Shell)
  if (path.startsWith('/majalah/')) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F1EBEB]">
        <Header />
        <main className="flex-1">
          <Suspense fallback={<div className="py-20 text-center text-sm text-[#5D4B4B]">Menyiapkan pembaca PDF...</div>}>
            <MagazineReaderPage />
          </Suspense>
        </main>
        <Footer />
      </div>
    );
  }

  // Route: * (Not Found)
  return (
    <div className="min-h-screen flex flex-col bg-[#F1EBEB]">
      <Header />
      <main className="flex-1">
        <NotFoundPage />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  );
}
