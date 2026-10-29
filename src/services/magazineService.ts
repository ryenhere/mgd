import { createClient } from '@supabase/supabase-js';
import type {
  AdminStats,
  Magazine,
  MagazineFilters,
  MagazineFormInput,
  MagazineListResult,
} from '../types/magazine.ts';
import { apiRequest } from './apiClient.ts';

const STORAGE_BUCKET = 'magazine-pdfs';

interface UploadTicket {
  path: string;
  token: string;
  ticket: string;
}

function queryString(
  filters: MagazineFilters = {},
  page = 1,
  pageSize = 24,
): string {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (filters.search?.trim()) params.set('q', filters.search.trim());
  if (filters.theme && filters.theme !== 'all') params.set('theme', filters.theme);
  if (filters.semester && filters.semester !== 'all') params.set('semester', String(filters.semester));
  if (filters.year && filters.year !== 'all') params.set('year', String(filters.year));
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  return params.toString();
}

async function uploadPdf(file: File): Promise<UploadTicket> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error('Konfigurasi unggahan Supabase belum tersedia.');
  }

  const ticket = await apiRequest<UploadTicket>('/api/admin/uploads', {
    method: 'POST',
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
    }),
  });
  const supabase = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .uploadToSignedUrl(ticket.path, ticket.token, file, {
        contentType: 'application/pdf',
        upsert: false,
      });
    if (error) throw new Error('Gagal mengunggah PDF ke penyimpanan privat.');

    return ticket;
  } catch (error) {
    let cleanupFailed = false;
    try {
      await apiRequest<{ cancelled: boolean }>('/api/admin/uploads', {
        method: 'DELETE',
        body: JSON.stringify({ ticket: ticket.ticket }),
      });
    } catch {
      cleanupFailed = true;
    }
    if (cleanupFailed) {
      throw new Error('Unggahan PDF gagal dan berkas sementara belum dapat dipastikan terhapus. Hubungi pengelola.');
    }
    throw error;
  }
}

export const magazineService = {
  getPublishedMagazines(
    filters: MagazineFilters = {},
    page = 1,
    pageSize = 24,
    signal?: AbortSignal,
  ): Promise<MagazineListResult> {
    return apiRequest(`/api/public/magazines?${queryString(filters, page, pageSize)}`, { signal });
  },

  getMagazineBySlug(slug: string): Promise<Magazine> {
    return apiRequest(`/api/public/magazines/slug/${encodeURIComponent(slug)}`);
  },

  getMagazineFileUrl(id: string): Promise<{ url: string; expiresIn: number }> {
    return apiRequest(`/api/public/magazines/${encodeURIComponent(id)}/file-url`);
  },

  getAdminMagazines(
    filters: MagazineFilters = {},
    page = 1,
    pageSize = 24,
    signal?: AbortSignal,
  ): Promise<MagazineListResult> {
    return apiRequest(`/api/admin/magazines?${queryString(filters, page, pageSize)}`, { signal });
  },

  getAdminStats(): Promise<AdminStats> {
    return apiRequest('/api/admin/stats');
  },

  getAdminSession(): Promise<{ authenticated: boolean }> {
    return apiRequest('/api/admin/session');
  },

  login(username: string, password: string): Promise<{ authenticated: boolean }> {
    return apiRequest('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async logout(): Promise<void> {
    await apiRequest<{ loggedOut: boolean }>('/api/admin/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async createMagazine(input: MagazineFormInput): Promise<Magazine> {
    if (!input.file) throw new Error('Pilih berkas PDF sebelum menyimpan publikasi.');

    const upload = await uploadPdf(input.file);
    try {
      return await apiRequest<Magazine>('/api/admin/magazines', {
        method: 'POST',
        body: JSON.stringify({
          ticket: upload.ticket,
          title: input.title,
          description: input.description,
          theme: input.theme,
          semester: input.semester,
          publicationYear: input.publicationYear,
          status: input.status,
        }),
      });
    } catch (error) {
      let cleanupFailed = false;
      try {
        await apiRequest<{ cancelled: boolean }>('/api/admin/uploads', {
          method: 'DELETE',
          body: JSON.stringify({ ticket: upload.ticket }),
        });
      } catch {
        cleanupFailed = true;
      }
      if (cleanupFailed) {
        const cause = error instanceof Error ? error.message : 'Publikasi gagal disimpan.';
        throw new Error(`${cause} Berkas sementara belum dapat dipastikan terhapus; hubungi pengelola.`);
      }
      throw error;
    }
  },

  updateMagazine(id: string, input: Partial<MagazineFormInput>): Promise<Magazine> {
    return apiRequest(`/api/admin/magazines/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        theme: input.theme,
        semester: input.semester,
        publicationYear: input.publicationYear,
        status: input.status,
      }),
    });
  },

  deleteMagazine(id: string): Promise<{ deleted: boolean }> {
    return apiRequest(`/api/admin/magazines/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      body: JSON.stringify({}),
    });
  },
};
