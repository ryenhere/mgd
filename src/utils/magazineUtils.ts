/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Magazine, MagazineFilters } from '../types/magazine.ts';

/**
 * Pure function to filter magazines according to search query, theme, semester, and year.
 * Decoupled from React components so it can be tested with fast unit tests.
 */
export function filterMagazines(magazines: Magazine[], filters: MagazineFilters): Magazine[] {
  if (!magazines || magazines.length === 0) {
    return [];
  }

  const search = filters.search?.trim().toLowerCase() || '';
  const theme = filters.theme?.trim().toLowerCase() || '';
  const semester = filters.semester;
  const year = filters.year;
  const status = filters.status;

  return magazines.filter((mag) => {
    // Status filter
    if (status && status !== 'all' && mag.status !== status) {
      return false;
    }

    // Search filter across title, description, and theme
    if (search) {
      const matchTitle = mag.title.toLowerCase().includes(search);
      const matchDesc = mag.description.toLowerCase().includes(search);
      const matchTheme = mag.theme.toLowerCase().includes(search);
      if (!matchTitle && !matchDesc && !matchTheme) {
        return false;
      }
    }

    // Theme filter
    if (theme && theme !== 'all' && mag.theme.toLowerCase() !== theme) {
      return false;
    }

    // Semester filter
    if (semester !== undefined && semester !== 'all' && mag.semester !== Number(semester)) {
      return false;
    }

    // Year filter
    if (year !== undefined && year !== 'all' && mag.publicationYear !== Number(year)) {
      return false;
    }

    return true;
  });
}

/**
 * Creates a URL-safe slug from a magazine title.
 */
export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Formats semester and year for editorial display in Indonesian.
 * E.g., "Semester 1 • 2026"
 */
export function formatSemesterYear(semester: number, year: number): string {
  return `Semester ${semester} • ${year}`;
}

/**
 * Formats ISO date into readable Indonesian format.
 */
export function formatIndonesianDate(dateString: string | null): string {
  if (!dateString) return 'Belum terbit';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Belum terbit';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}
