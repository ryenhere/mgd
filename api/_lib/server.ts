import { createHash, randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import argon2 from 'argon2';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';
import {
  isPdfUploadDescriptor,
  listQuerySchema,
  loginSchema,
  magazineInputSchema,
  magazineUpdateSchema,
  sanitizeOriginalFilename,
  uploadDescriptorSchema,
  uploadTicketSchema,
} from './schemas.ts';
import type { AdminStats, Magazine, MagazineStatus } from '../../src/types/magazine.ts';

const BUCKET_NAME = 'magazine-pdfs';
const SESSION_ISSUER = 'media-madrasah';
const SESSION_AUDIENCE = 'media-madrasah-admin';
const SESSION_SUBJECT = 'admin';
const SESSION_TTL_SECONDS = 6 * 60 * 60;
const UPLOAD_TICKET_TTL_SECONDS = 2 * 60 * 60;
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const LOGIN_ATTEMPT_LIMIT = 10;
const LOGIN_WINDOW_SECONDS = 15 * 60;
const PUBLIC_COLUMNS =
  'id,title,slug,description,theme,semester,publication_year,status,file_size_bytes,published_at,created_at,updated_at' as const;
const ADMIN_COLUMNS = `${PUBLIC_COLUMNS},storage_path,original_filename` as const;

type MagazineRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  theme: string;
  semester: 1 | 2;
  publication_year: number;
  status: MagazineStatus;
  storage_path: string;
  original_filename: string;
  file_size_bytes: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};
type MagazineView = Omit<MagazineRow, 'storage_path' | 'original_filename'>;
type Database = {
  public: {
    Tables: {
      magazines: {
        Row: MagazineRow;
        Insert: Omit<MagazineRow, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<MagazineRow, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<MagazineRow>;
        Relationships: [];
      };
      admin_login_rate_limits: {
        Row: { rate_key: string; window_started_at: string; attempt_count: number; updated_at: string };
        Insert: { rate_key: string; window_started_at: string; attempt_count: number; updated_at?: string };
        Update: Partial<{ rate_key: string; window_started_at: string; attempt_count: number; updated_at: string }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      allow_admin_login_attempt: {
        Args: { p_rate_key: string; p_attempt_limit: number; p_window_seconds: number };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
type MagazineUpdate = Database['public']['Tables']['magazines']['Update'];

function isSecureRequestEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production' ||
    process.env.VERCEL_ENV === 'preview'
  );
}

type RequestWithBody = IncomingMessage & { body?: unknown };

class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly publicMessage: string,
  ) {
    super(publicMessage);
  }
}

function respond(
  res: ServerResponse,
  status: number,
  data: unknown,
  error: { code: string; message: string } | null = null,
): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({ data, error }));
}

function sendError(
  res: ServerResponse,
  status: number,
  code: string,
  message: string,
): void {
  respond(res, status, null, { code, message });
}

function requestId(req: IncomingMessage): string {
  const vercelId = req.headers['x-vercel-id'];
  return typeof vercelId === 'string' ? vercelId : randomUUID();
}

function logFailure(
  id: string,
  endpoint: string,
  operation: string,
  error: unknown,
): void {
  const errorCode =
    error instanceof ApiError
      ? error.code
      : typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : 'UNEXPECTED_ERROR';
  console.error(JSON.stringify({ requestId: id, endpoint, operation, errorCode }));
}

function getSupabase(): SupabaseClient<Database> {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new ApiError(503, 'SERVICE_NOT_CONFIGURED', 'Layanan publikasi belum dikonfigurasi.');
  }

  return createClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || new TextEncoder().encode(secret).byteLength < 32) {
    throw new ApiError(503, 'SERVICE_NOT_CONFIGURED', 'Layanan admin belum dikonfigurasi.');
  }
  return new TextEncoder().encode(secret);
}

function parseBody(req: RequestWithBody): Record<string, unknown> {
  if (typeof req.body === 'string') {
    try {
      const parsed: unknown = JSON.parse(req.body);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      throw new ApiError(400, 'INVALID_JSON', 'Format permintaan tidak valid.');
    }
  }

  if (typeof req.body === 'object' && req.body !== null && !Array.isArray(req.body)) {
    return req.body as Record<string, unknown>;
  }
  throw new ApiError(400, 'INVALID_JSON', 'Format permintaan tidak valid.');
}

function requireJson(req: IncomingMessage): void {
  const contentType = req.headers['content-type'];
  if (typeof contentType !== 'string' || !/^application\/json(?:\s*;|$)/i.test(contentType)) {
    throw new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Permintaan harus menggunakan JSON.');
  }
}

function requireSameOrigin(req: IncomingMessage): void {
  const expectedOrigin = process.env.APP_ORIGIN;
  if (!expectedOrigin) {
    throw new ApiError(503, 'SERVICE_NOT_CONFIGURED', 'Layanan aplikasi belum dikonfigurasi.');
  }
  const origin = req.headers.origin;
  if (origin !== undefined && origin !== expectedOrigin.replace(/\/$/, '')) {
    throw new ApiError(403, 'ORIGIN_NOT_ALLOWED', 'Permintaan lintas situs tidak diizinkan.');
  }
}

function sessionCookieName(): string {
  return isSecureRequestEnvironment()
    ? '__Host-media-madrasah-admin'
    : 'media-madrasah-admin';
}

function cookieAttributes(maxAge: number): string {
  const secure = isSecureRequestEnvironment() ? '; Secure' : '';
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function readCookie(req: IncomingMessage, name: string): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  for (const cookie of cookieHeader.split(';')) {
    const separator = cookie.indexOf('=');
    if (separator < 0 || cookie.slice(0, separator).trim() !== name) continue;
    return cookie.slice(separator + 1).trim();
  }
  return null;
}

async function getAdminSession(req: IncomingMessage): Promise<boolean> {
  const token = readCookie(req, sessionCookieName());
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
      algorithms: ['HS256'],
    });
    return payload.sub === SESSION_SUBJECT;
  } catch {
    return false;
  }
}

async function requireAdmin(req: IncomingMessage): Promise<void> {
  if (!(await getAdminSession(req))) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Sesi admin tidak valid. Silakan masuk kembali.');
  }
}

function zodErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Data yang dikirim tidak valid.';
}

function parseUuid(value: string): string {
  const result = z.string().uuid().safeParse(value);
  if (!result.success) throw new ApiError(404, 'NOT_FOUND', 'Majalah tidak ditemukan.');
  return result.data;
}

function slugify(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toMagazine(row: MagazineView | MagazineRow): Magazine {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    theme: row.theme,
    semester: row.semester,
    publicationYear: row.publication_year,
    publishedAt: row.published_at,
    status: row.status,
    fileSizeBytes: row.file_size_bytes,
  };
}

function queryValue(url: URL, name: string): string | undefined {
  const value = url.searchParams.get(name);
  return value === null ? undefined : value;
}

function parseListQuery(url: URL) {
  const result = listQuerySchema.safeParse({
    q: queryValue(url, 'q'),
    theme: queryValue(url, 'theme'),
    semester: queryValue(url, 'semester'),
    year: queryValue(url, 'year'),
    status: queryValue(url, 'status'),
    page: queryValue(url, 'page'),
    pageSize: queryValue(url, 'pageSize'),
  });
  if (!result.success) throw new ApiError(400, 'INVALID_QUERY', zodErrorMessage(result.error));
  return result.data;
}

function searchFilter(searchQuery: string | undefined): string | undefined {
  const search = searchQuery
    ?.normalize('NFC')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
  return search ? `title.ilike.%${search}%,description.ilike.%${search}%,theme.ilike.%${search}%` : undefined;
}

async function publicMagazineList(
  supabase: SupabaseClient<Database>,
  url: URL,
): Promise<{
  items: Magazine[];
  page: number;
  pageSize: number;
  total: number;
  themes: string[];
  years: number[];
}> {
  const filters = parseListQuery(url);
  const from = (filters.page - 1) * filters.pageSize;
  let listQuery = supabase
    .from('magazines')
    .select(PUBLIC_COLUMNS, { count: 'exact' })
    .eq('status', 'published');
  if (filters.theme) listQuery = listQuery.eq('theme', filters.theme);
  if (filters.semester) listQuery = listQuery.eq('semester', filters.semester);
  if (filters.year) listQuery = listQuery.eq('publication_year', filters.year);
  const search = searchFilter(filters.q);
  if (search) listQuery = listQuery.or(search);

  const [listResult, facetResult] = await Promise.all([
    listQuery
      .order('publication_year', { ascending: false })
      .order('published_at', { ascending: false })
      .range(from, from + filters.pageSize - 1),
    supabase
      .from('magazines')
      .select('theme,publication_year')
      .eq('status', 'published')
      .order('publication_year', { ascending: false })
      .limit(1000),
  ]);
  const { data, error, count } = listResult;
  if (error) throw new ApiError(500, 'DATABASE_ERROR', 'Gagal memuat katalog majalah.');
  if (facetResult.error) throw new ApiError(500, 'DATABASE_ERROR', 'Gagal memuat filter katalog.');
  const themes = Array.from(new Set((facetResult.data ?? []).map((row) => row.theme)))
    .filter((theme): theme is string => Boolean(theme))
    .sort((left, right) => left.localeCompare(right, 'id'));
  const years = Array.from(
    new Set(
      (facetResult.data ?? [])
        .map((row) => row.publication_year)
        .filter((year): year is number => typeof year === 'number'),
    ),
  ).sort((left, right) => right - left);

  return {
    items: ((data ?? []) as MagazineView[]).map(toMagazine),
    page: filters.page,
    pageSize: filters.pageSize,
    total: count ?? 0,
    themes,
    years,
  };
}

async function adminMagazineList(
  supabase: SupabaseClient<Database>,
  url: URL,
): Promise<{ items: Magazine[]; page: number; pageSize: number; total: number }> {
  const filters = parseListQuery(url);
  const from = (filters.page - 1) * filters.pageSize;
  let listQuery = supabase.from('magazines').select(ADMIN_COLUMNS, { count: 'exact' });
  if (filters.theme) listQuery = listQuery.eq('theme', filters.theme);
  if (filters.semester) listQuery = listQuery.eq('semester', filters.semester);
  if (filters.year) listQuery = listQuery.eq('publication_year', filters.year);
  if (filters.status) listQuery = listQuery.eq('status', filters.status);
  const search = searchFilter(filters.q);
  if (search) listQuery = listQuery.or(search);
  const { data, error, count } = await listQuery
    .order('updated_at', { ascending: false })
    .range(from, from + filters.pageSize - 1);
  if (error) throw new ApiError(500, 'DATABASE_ERROR', 'Gagal memuat data publikasi.');

  return {
    items: ((data ?? []) as MagazineRow[]).map(toMagazine),
    page: filters.page,
    pageSize: filters.pageSize,
    total: count ?? 0,
  };
}

async function getMagazineBySlug(supabase: SupabaseClient<Database>, slug: string): Promise<Magazine> {
  const { data, error } = await supabase
    .from('magazines')
    .select(PUBLIC_COLUMNS)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw new ApiError(500, 'DATABASE_ERROR', 'Gagal memuat detail majalah.');
  if (!data) throw new ApiError(404, 'NOT_FOUND', 'Majalah tidak ditemukan.');
  return toMagazine(data as MagazineView);
}

async function getMagazineById(
  supabase: SupabaseClient<Database>,
  id: string,
  admin: true,
): Promise<MagazineRow>;
async function getMagazineById(
  supabase: SupabaseClient<Database>,
  id: string,
  admin?: false,
): Promise<MagazineView>;
async function getMagazineById(
  supabase: SupabaseClient<Database>,
  id: string,
  admin = false,
): Promise<MagazineView | MagazineRow> {
  if (admin) {
    const { data, error } = await supabase
      .from('magazines')
      .select(ADMIN_COLUMNS)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new ApiError(500, 'DATABASE_ERROR', 'Gagal memuat detail majalah.');
    if (!data) throw new ApiError(404, 'NOT_FOUND', 'Majalah tidak ditemukan.');
    return data as MagazineRow;
  }

  const { data, error } = await supabase
    .from('magazines')
    .select(PUBLIC_COLUMNS)
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw new ApiError(500, 'DATABASE_ERROR', 'Gagal memuat detail majalah.');
  if (!data) throw new ApiError(404, 'NOT_FOUND', 'Majalah tidak ditemukan.');
  return data as MagazineView;
}

async function getPublishedFilePath(supabase: SupabaseClient<Database>, id: string): Promise<string> {
  const { data, error } = await supabase
    .from('magazines')
    .select('storage_path')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw new ApiError(500, 'DATABASE_ERROR', 'Gagal memuat berkas majalah.');
  if (!data) throw new ApiError(404, 'NOT_FOUND', 'Majalah tidak ditemukan.');
  return data.storage_path;
}

async function createSignedPdfUrl(
  supabase: SupabaseClient<Database>,
  storagePath: string,
  expiresIn = SIGNED_URL_TTL_SECONDS,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, expiresIn);
  if (error || !data?.signedUrl) {
    throw new ApiError(500, 'STORAGE_ERROR', 'Gagal menyiapkan berkas majalah.');
  }
  return data.signedUrl;
}

async function getAdminStats(supabase: SupabaseClient<Database>): Promise<AdminStats> {
  const countRows = async (status?: MagazineStatus): Promise<number> => {
    let query = supabase.from('magazines').select('id', { count: 'exact', head: true });
    if (status) query = query.eq('status', status);
    const { count, error } = await query;
    if (error) throw new ApiError(500, 'DATABASE_ERROR', 'Gagal memuat ringkasan publikasi.');
    return count ?? 0;
  };

  const [totalPublications, publishedCount, draftCount] = await Promise.all([
    countRows(),
    countRows('published'),
    countRows('draft'),
  ]);
  return { totalPublications, publishedCount, draftCount };
}

function clientIp(req: IncomingMessage): string {
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.length > 0) return realIp;

  const forwarded = req.headers['x-forwarded-for'];
  return typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : 'unknown';
}

async function allowLoginAttempt(
  supabase: SupabaseClient<Database>,
  req: IncomingMessage,
): Promise<boolean> {
  const rateKey = createHash('sha256').update(clientIp(req)).digest('hex');
  const { data, error } = await supabase.rpc('allow_admin_login_attempt', {
    p_rate_key: rateKey,
    p_attempt_limit: LOGIN_ATTEMPT_LIMIT,
    p_window_seconds: LOGIN_WINDOW_SECONDS,
  });
  if (error) throw new ApiError(500, 'RATE_LIMIT_ERROR', 'Gagal memverifikasi permintaan masuk.');
  return data === true;
}

async function login(
  req: RequestWithBody,
  res: ServerResponse,
  supabase: SupabaseClient<Database>,
): Promise<void> {
  requireSameOrigin(req);
  requireJson(req);
  const parsed = loginSchema.safeParse(parseBody(req));
  if (!parsed.success) throw new ApiError(400, 'INVALID_INPUT', zodErrorMessage(parsed.error));

  const configuredUsername = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const sessionSecret = getSessionSecret();
  if (!configuredUsername || !passwordHash || !passwordHash.startsWith('$argon2id$')) {
    throw new ApiError(503, 'SERVICE_NOT_CONFIGURED', 'Layanan admin belum dikonfigurasi.');
  }

  if (!(await allowLoginAttempt(supabase, req))) {
    throw new ApiError(429, 'RATE_LIMITED', 'Terlalu banyak percobaan masuk. Silakan coba kembali nanti.');
  }

  let passwordValid = false;
  try {
    passwordValid = await argon2.verify(passwordHash, parsed.data.password);
  } catch (error) {
    logFailure(requestId(req), '/api/admin/login', 'verify_password_hash', error);
    throw new ApiError(503, 'SERVICE_NOT_CONFIGURED', 'Layanan admin belum dikonfigurasi.');
  }

  const usernameValid = parsed.data.username.trim() === configuredUsername.trim();
  if (!usernameValid || !passwordValid) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Username atau password tidak valid.');
  }

  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setSubject(SESSION_SUBJECT)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(sessionSecret);
  res.setHeader(
    'Set-Cookie',
    `${sessionCookieName()}=${token}; ${cookieAttributes(SESSION_TTL_SECONDS)}`,
  );
  respond(res, 200, { authenticated: true });
}

async function createUploadTicket(
  req: RequestWithBody,
  res: ServerResponse,
  supabase: SupabaseClient<Database>,
): Promise<void> {
  await requireAdmin(req);
  requireSameOrigin(req);
  requireJson(req);

  const parsed = uploadDescriptorSchema.safeParse(parseBody(req));
  if (!parsed.success) {
    const oversized = parsed.error.issues.some((issue) => issue.code === 'too_big');
    if (oversized) throw new ApiError(413, 'FILE_TOO_LARGE', 'Ukuran PDF maksimal 50 MB.');
    throw new ApiError(400, 'INVALID_INPUT', zodErrorMessage(parsed.error));
  }
  if (!isPdfUploadDescriptor(parsed.data)) {
    throw new ApiError(415, 'UNSUPPORTED_FILE_TYPE', 'Pilih berkas dengan format PDF.');
  }

  const originalFilename = sanitizeOriginalFilename(parsed.data.filename);
  if (!originalFilename.toLowerCase().endsWith('.pdf')) {
    throw new ApiError(415, 'UNSUPPORTED_FILE_TYPE', 'Pilih berkas dengan format PDF.');
  }

  const storagePath = `magazines/${randomUUID()}.pdf`;
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(storagePath, { upsert: false });
  if (error || !data?.token) {
    throw new ApiError(500, 'STORAGE_ERROR', 'Gagal menyiapkan unggahan PDF.');
  }

  const ticket = await new SignJWT({
    storagePath,
    originalFilename,
    fileSizeBytes: parsed.data.fileSizeBytes,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'upload-ticket+jwt' })
    .setIssuer(SESSION_ISSUER)
    .setAudience(`${SESSION_AUDIENCE}-upload`)
    .setSubject(SESSION_SUBJECT)
    .setIssuedAt()
    .setExpirationTime(`${UPLOAD_TICKET_TTL_SECONDS}s`)
    .sign(getSessionSecret());

  respond(res, 201, { path: storagePath, token: data.token, ticket });
}

async function verifyUploadTicket(ticket: unknown): Promise<z.infer<typeof uploadTicketSchema>> {
  if (typeof ticket !== 'string' || ticket.length > 4096) {
    throw new ApiError(400, 'INVALID_UPLOAD_TICKET', 'Sesi unggahan tidak valid atau kedaluwarsa.');
  }

  try {
    const { payload, protectedHeader } = await jwtVerify(ticket, getSessionSecret(), {
      issuer: SESSION_ISSUER,
      audience: `${SESSION_AUDIENCE}-upload`,
      algorithms: ['HS256'],
    });
    if (protectedHeader.typ !== 'upload-ticket+jwt' || payload.sub !== SESSION_SUBJECT) {
      throw new Error('Invalid upload ticket claims');
    }
    const parsed = uploadTicketSchema.safeParse(payload);
    if (!parsed.success) throw new Error('Invalid upload ticket payload');
    return parsed.data;
  } catch {
    throw new ApiError(400, 'INVALID_UPLOAD_TICKET', 'Sesi unggahan tidak valid atau kedaluwarsa.');
  }
}

async function verifyStoredPdf(
  supabase: SupabaseClient<Database>,
  ticket: z.infer<typeof uploadTicketSchema>,
): Promise<void> {
  const folder = ticket.storagePath.slice(0, ticket.storagePath.lastIndexOf('/'));
  const fileName = ticket.storagePath.slice(ticket.storagePath.lastIndexOf('/') + 1);
  const { data: files, error } = await supabase.storage.from(BUCKET_NAME).list(folder, {
    search: fileName,
    limit: 10,
  });
  if (error) throw new ApiError(500, 'STORAGE_ERROR', 'Gagal memverifikasi berkas unggahan.');
  const storedFile = files?.find((file) => file.name === fileName);
  if (!storedFile) throw new ApiError(400, 'UPLOAD_MISSING', 'Berkas PDF belum berhasil diunggah.');

  const metadata = storedFile.metadata as { size?: number; mimetype?: string } | null;
  if (
    metadata?.size !== ticket.fileSizeBytes ||
    metadata.mimetype?.toLowerCase() !== 'application/pdf'
  ) {
    throw new ApiError(415, 'INVALID_PDF', 'Berkas tidak sesuai dengan format PDF yang diizinkan.');
  }

  const signedUrl = await createSignedPdfUrl(supabase, ticket.storagePath, 60);
  const response = await fetch(signedUrl, { headers: { Range: 'bytes=0-4' } });
  if (!response.ok || !response.body) {
    throw new ApiError(500, 'STORAGE_ERROR', 'Gagal memverifikasi isi berkas PDF.');
  }

  const reader = response.body.getReader();
  const signature: number[] = [];
  try {
    while (signature.length < 5) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      for (const byte of value) {
        signature.push(byte);
        if (signature.length === 5) break;
      }
    }
  } finally {
    await reader.cancel();
  }
  if (String.fromCharCode(...signature) !== '%PDF-') {
    throw new ApiError(415, 'INVALID_PDF', 'Berkas tidak memiliki tanda tangan PDF yang valid.');
  }
}

async function cleanupUploadedObject(
  supabase: SupabaseClient<Database>,
  storagePath: string,
): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
  if (error) throw new ApiError(500, 'STORAGE_CLEANUP_FAILED', 'Gagal membersihkan berkas unggahan.');
}

async function createMagazine(
  req: RequestWithBody,
  res: ServerResponse,
  supabase: SupabaseClient<Database>,
): Promise<void> {
  await requireAdmin(req);
  requireSameOrigin(req);
  requireJson(req);
  const body = parseBody(req);
  const parsed = magazineInputSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, 'INVALID_INPUT', zodErrorMessage(parsed.error));

  const ticket = await verifyUploadTicket(body.ticket);
  try {
    await verifyStoredPdf(supabase, ticket);
  } catch (error) {
    try {
      await cleanupUploadedObject(supabase, ticket.storagePath);
    } catch (cleanupError) {
      logFailure(requestId(req), '/api/admin/magazines', 'cleanup_after_invalid_upload', cleanupError);
      throw new ApiError(
        500,
        'STORAGE_CLEANUP_FAILED',
        'Berkas unggahan tidak valid dan belum dapat dibersihkan. Hubungi pengelola.',
      );
    }
    throw error;
  }
  const slug = slugify(parsed.data.title);
  if (!slug) throw new ApiError(400, 'INVALID_INPUT', 'Judul tidak dapat digunakan sebagai slug.');

  const { data: existing, error: existingError } = await supabase
    .from('magazines')
    .select('id')
    .eq('storage_path', ticket.storagePath)
    .maybeSingle();
  if (existingError) throw new ApiError(500, 'DATABASE_ERROR', 'Gagal memeriksa unggahan majalah.');
  if (existing) throw new ApiError(409, 'UPLOAD_ALREADY_USED', 'Unggahan ini sudah diproses.');

  const { data, error } = await supabase
    .from('magazines')
    .insert({
      title: parsed.data.title,
      description: parsed.data.description,
      theme: parsed.data.theme,
      semester: parsed.data.semester,
      publication_year: parsed.data.publicationYear,
      status: parsed.data.status,
      slug,
      storage_path: ticket.storagePath,
      original_filename: ticket.originalFilename,
      file_size_bytes: ticket.fileSizeBytes,
      published_at: parsed.data.status === 'published' ? new Date().toISOString() : null,
    })
    .select(ADMIN_COLUMNS)
    .single();

  if (error || !data) {
    let cleanupError: unknown = null;
    try {
      await cleanupUploadedObject(supabase, ticket.storagePath);
    } catch (caught) {
      cleanupError = caught;
    }
    if (cleanupError) {
      logFailure(requestId(req), '/api/admin/magazines', 'cleanup_after_insert_failure', cleanupError);
      throw new ApiError(
        500,
        'STORAGE_CLEANUP_FAILED',
        'Data majalah gagal disimpan dan berkas sementara belum dapat dibersihkan. Hubungi pengelola.',
      );
    }
    if (error?.code === '23505') {
      throw new ApiError(409, 'SLUG_CONFLICT', 'Judul majalah sudah digunakan. Ubah judul lalu coba lagi.');
    }
    throw new ApiError(500, 'DATABASE_ERROR', 'Gagal menyimpan data majalah.');
  }

  respond(res, 201, toMagazine(data as MagazineRow));
}

async function cancelUpload(
  req: RequestWithBody,
  res: ServerResponse,
  supabase: SupabaseClient<Database>,
): Promise<void> {
  await requireAdmin(req);
  requireSameOrigin(req);
  requireJson(req);
  const body = parseBody(req);
  const ticket = await verifyUploadTicket(body.ticket);

  const { data, error } = await supabase
    .from('magazines')
    .select('id')
    .eq('storage_path', ticket.storagePath)
    .maybeSingle();
  if (error) throw new ApiError(500, 'DATABASE_ERROR', 'Gagal memeriksa status berkas.');
  if (!data) await cleanupUploadedObject(supabase, ticket.storagePath);
  respond(res, 200, { cancelled: !data });
}

async function updateMagazine(
  req: RequestWithBody,
  res: ServerResponse,
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  await requireAdmin(req);
  requireSameOrigin(req);
  requireJson(req);
  const magazineId = parseUuid(id);
  const parsed = magazineUpdateSchema.safeParse(parseBody(req));
  if (!parsed.success) throw new ApiError(400, 'INVALID_INPUT', zodErrorMessage(parsed.error));

  const current = await getMagazineById(supabase, magazineId, true);
  const updates: MagazineUpdate = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.theme !== undefined) updates.theme = parsed.data.theme;
  if (parsed.data.semester !== undefined) updates.semester = parsed.data.semester;
  if (parsed.data.publicationYear !== undefined) {
    updates.publication_year = parsed.data.publicationYear;
  }
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.title !== undefined) {
    const slug = slugify(parsed.data.title);
    if (!slug) throw new ApiError(400, 'INVALID_INPUT', 'Judul tidak dapat digunakan sebagai slug.');
    updates.slug = slug;
  }
  if (parsed.data.status === 'published' && current.published_at === null) {
    updates.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('magazines')
    .update(updates)
    .eq('id', magazineId)
    .select(ADMIN_COLUMNS)
    .maybeSingle();
  if (error?.code === '23505') {
    throw new ApiError(409, 'SLUG_CONFLICT', 'Judul majalah sudah digunakan. Ubah judul lalu coba lagi.');
  }
  if (error) throw new ApiError(500, 'DATABASE_ERROR', 'Gagal memperbarui data majalah.');
  if (!data) throw new ApiError(404, 'NOT_FOUND', 'Majalah tidak ditemukan.');
  respond(res, 200, toMagazine(data as MagazineRow));
}

async function deleteMagazine(
  req: RequestWithBody,
  res: ServerResponse,
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  await requireAdmin(req);
  requireSameOrigin(req);
  requireJson(req);
  parseBody(req);
  const magazineId = parseUuid(id);
  const magazine = await getMagazineById(supabase, magazineId, true);
  const { error: deleteError } = await supabase.from('magazines').delete().eq('id', magazineId);
  if (deleteError) throw new ApiError(500, 'DATABASE_ERROR', 'Gagal menghapus data majalah.');

  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([magazine.storage_path]);
  if (storageError) {
    const { error: restoreError } = await supabase.from('magazines').insert({
      id: magazine.id,
      title: magazine.title,
      slug: magazine.slug,
      description: magazine.description,
      theme: magazine.theme,
      semester: magazine.semester,
      publication_year: magazine.publication_year,
      status: magazine.status,
      storage_path: magazine.storage_path,
      original_filename: magazine.original_filename,
      file_size_bytes: magazine.file_size_bytes,
      created_at: magazine.created_at,
      updated_at: magazine.updated_at,
      published_at: magazine.published_at,
    });
    if (restoreError) {
      logFailure(requestId(req), `/api/admin/magazines/${magazineId}`, 'restore_after_storage_failure', restoreError);
      throw new ApiError(
        500,
        'DELETE_PARTIAL_FAILURE',
        'Penghapusan tidak tuntas. Hubungi pengelola untuk memeriksa konsistensi data.',
      );
    }
    throw new ApiError(500, 'STORAGE_ERROR', 'Berkas gagal dihapus; data majalah telah dipulihkan.');
  }
  respond(res, 200, { deleted: true });
}

async function handleRoute(req: RequestWithBody, res: ServerResponse, url: URL): Promise<void> {
  const method = req.method ?? 'GET';
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (path === '/api/admin/login' && method === 'POST') {
    await login(req, res, getSupabase());
    return;
  }
  if (path === '/api/admin/logout' && method === 'POST') {
    requireSameOrigin(req);
    requireJson(req);
    parseBody(req);
    res.setHeader('Set-Cookie', `${sessionCookieName()}=; ${cookieAttributes(0)}`);
    respond(res, 200, { loggedOut: true });
    return;
  }
  if (path === '/api/admin/session' && method === 'GET') {
    if (!(await getAdminSession(req))) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Sesi admin tidak valid.');
    }
    respond(res, 200, { authenticated: true });
    return;
  }
  if (path === '/api/public/magazines' && method === 'GET') {
    respond(res, 200, await publicMagazineList(getSupabase(), url));
    return;
  }
  if (path === '/api/admin/magazines' && method === 'GET') {
    await requireAdmin(req);
    respond(res, 200, await adminMagazineList(getSupabase(), url));
    return;
  }
  if (path === '/api/admin/stats' && method === 'GET') {
    await requireAdmin(req);
    respond(res, 200, await getAdminStats(getSupabase()));
    return;
  }
  if (path === '/api/admin/uploads' && method === 'POST') {
    await createUploadTicket(req, res, getSupabase());
    return;
  }
  if (path === '/api/admin/uploads' && method === 'DELETE') {
    await cancelUpload(req, res, getSupabase());
    return;
  }
  if (path === '/api/admin/magazines' && method === 'POST') {
    await createMagazine(req, res, getSupabase());
    return;
  }
  const slugMatch = path.match(/^\/api\/public\/magazines\/slug\/([^/]+)$/);
  if (slugMatch && method === 'GET') {
    let slug: string;
    try {
      slug = decodeURIComponent(slugMatch[1]);
    } catch {
      throw new ApiError(404, 'NOT_FOUND', 'Majalah tidak ditemukan.');
    }
    respond(res, 200, await getMagazineBySlug(getSupabase(), slug));
    return;
  }
  const fileMatch = path.match(/^\/api\/public\/magazines\/([^/]+)\/file-url$/);
  if (fileMatch && method === 'GET') {
    const id = parseUuid(fileMatch[1]);
    const supabase = getSupabase();
    const storagePath = await getPublishedFilePath(supabase, id);
    respond(res, 200, {
      url: await createSignedPdfUrl(supabase, storagePath),
      expiresIn: SIGNED_URL_TTL_SECONDS,
    });
    return;
  }
  const adminMagazineMatch = path.match(/^\/api\/admin\/magazines\/([^/]+)$/);
  if (adminMagazineMatch && method === 'PATCH') {
    await updateMagazine(req, res, getSupabase(), adminMagazineMatch[1]);
    return;
  }
  if (adminMagazineMatch && method === 'DELETE') {
    await deleteMagazine(req, res, getSupabase(), adminMagazineMatch[1]);
    return;
  }
  const publicIdMatch = path.match(/^\/api\/public\/magazines\/([^/]+)$/);
  if (publicIdMatch && method === 'GET') {
    const id = parseUuid(publicIdMatch[1]);
    const row = await getMagazineById(getSupabase(), id);
    respond(res, 200, toMagazine(row));
    return;
  }

  throw new ApiError(404, 'NOT_FOUND', 'Alamat API tidak ditemukan.');
}

export async function handleApiRequest(
  req: RequestWithBody,
  res: ServerResponse,
): Promise<void> {
  const id = requestId(req);
  res.setHeader('X-Request-Id', id);
  const url = new URL(req.url ?? '/', 'http://localhost');
  const endpoint = url.pathname;
  try {
    await handleRoute(req, res, url);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status >= 500) logFailure(id, endpoint, 'request', error);
      sendError(res, error.status, error.code, error.publicMessage);
      return;
    }
    logFailure(id, endpoint, 'request', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Terjadi kesalahan pada server. Silakan coba lagi.');
  }
}
