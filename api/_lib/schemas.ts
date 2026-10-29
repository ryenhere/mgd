import { z } from 'zod';
import { MAX_PDF_SIZE_BYTES } from '../../src/constants/upload.ts';

const currentYear = new Date().getFullYear();

export const magazineInputSchema = z.object({
  title: z.string().trim().min(1, 'Judul majalah wajib diisi.').max(160),
  description: z.string().trim().min(1, 'Deskripsi edisi wajib diisi.').max(5000),
  theme: z.string().trim().min(1, 'Tema edisi wajib diisi.').max(120),
  semester: z.number().int().refine((value) => value === 1 || value === 2),
  publicationYear: z.number().int().min(2000).max(currentYear + 1),
  status: z.enum(['draft', 'published']),
});

export const magazineUpdateSchema = magazineInputSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Setidaknya satu kolom harus diubah.',
);

export const uploadDescriptorSchema = z.object({
  filename: z.string().trim().min(1).max(1024),
  mimeType: z.string().max(120),
  fileSizeBytes: z.number().int().positive().max(MAX_PDF_SIZE_BYTES),
});

export const uploadTicketSchema = z.object({
  storagePath: z.string().regex(/^magazines\/[0-9a-f-]{36}\.pdf$/i),
  originalFilename: z.string().min(1).max(255),
  fileSizeBytes: z.number().int().positive().max(MAX_PDF_SIZE_BYTES),
});

export const loginSchema = z.object({
  username: z.string().min(1).max(256),
  password: z.string().min(1).max(256),
});

export const listQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  theme: z.string().trim().max(120).optional(),
  semester: z.coerce.number().int().refine((value) => value === 1 || value === 2).optional(),
  year: z.coerce.number().int().min(2000).max(currentYear + 1).optional(),
  status: z.enum(['draft', 'published']).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(24).default(24),
});

export function sanitizeOriginalFilename(filename: string): string {
  const basename = filename.split(/[\\/]/).pop() ?? '';
  return basename
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, 255);
}

export function isPdfUploadDescriptor(value: z.infer<typeof uploadDescriptorSchema>): boolean {
  return (
    sanitizeOriginalFilename(value.filename).toLowerCase().endsWith('.pdf') &&
    value.mimeType.toLowerCase() === 'application/pdf'
  );
}
