/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Application routes:
 * - ROOT: '/' (redirects or renders Home)
 * - HOME: '/home' (Beranda)
 * - CATALOGUE: '/majalah' (Majalah Digital)
 * - ABOUT: '/tentang' (Tentang Media Madrasah)
 * - MAGAZINE_DETAIL: '/majalah/:slug'
 * - ADMIN.LOGIN: '/admin' (Direct URL only)
 * - ADMIN.DASHBOARD: '/admin/dashboard' (Direct URL only)
 */
export const ROUTES = {
  ROOT: '/',
  HOME: '/home',
  CATALOGUE: '/majalah',
  ABOUT: '/tentang',
  MAGAZINE_DETAIL: (slug: string) => `/majalah/${slug}`,
  ADMIN: {
    LOGIN: '/admin',
    DASHBOARD: '/admin/dashboard',
  },
} as const;

export const ADMIN_ROUTES = ROUTES.ADMIN;
