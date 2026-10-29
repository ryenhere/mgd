import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleApiRequest } from './_lib/server.ts';

type ApiRequest = IncomingMessage & { body?: unknown };

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default async function handler(req: ApiRequest, res: ServerResponse): Promise<void> {
  await handleApiRequest(req, res);
}
