interface ApiEnvelope<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: 'same-origin',
  });

  let envelope: ApiEnvelope<T>;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiClientError('Respons server tidak dapat dibaca.', response.status, 'INVALID_RESPONSE');
  }
  if (!response.ok || envelope.error) {
    throw new ApiClientError(
      envelope.error?.message ?? 'Permintaan gagal. Silakan coba kembali.',
      response.status,
      envelope.error?.code ?? 'REQUEST_FAILED',
    );
  }
  if (envelope.data === null) {
    throw new ApiClientError('Respons server tidak berisi data.', response.status, 'EMPTY_RESPONSE');
  }
  return envelope.data;
}
