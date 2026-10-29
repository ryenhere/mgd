/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Publication status:
 * - 'draft': Created and managed in admin, not visible on public catalogue
 * - 'published': Live on public catalogue and reader
 */
export type MagazineStatus = 'draft' | 'published';

/**
 * Magazine entity interface according to Section 7 & 10 of PRD 1.
 * Note: Initial data across the application is strictly `[]`.
 * Copilot in VS Code will wire this up to Supabase / Backend database.
 */
export interface Magazine {
  id: string;
  title: string;
  slug: string;
  description: string;
  theme: string;
  semester: 1 | 2;
  publicationYear: number;
  publishedAt: string | null;
  status: MagazineStatus;
  coverImageUrl?: string;
  pageCount?: number;
  fileSizeBytes?: number;
}

/**
 * Filter parameters for public catalogue and admin listing.
 */
export interface MagazineFilters {
  search?: string;
  theme?: string;
  semester?: number | 'all';
  year?: number | 'all';
  status?: MagazineStatus | 'all';
}

export interface MagazineListResult {
  items: Magazine[];
  page: number;
  pageSize: number;
  total: number;
  themes?: string[];
  years?: number[];
}

/**
 * Admin overview metrics.
 * Note: PRD Section 9.2 & 10 mandates initial values must be 0 or omitted;
 * never invent fake metrics.
 */
export interface AdminStats {
  totalPublications: number;
  publishedCount: number;
  draftCount: number;
}

/**
 * Input payload for magazine creation/editing in admin forms.
 */
export interface MagazineFormInput {
  title: string;
  description: string;
  theme: string;
  semester: 1 | 2;
  publicationYear: number;
  status: MagazineStatus;
  file?: File | null;
}
