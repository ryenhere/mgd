import dotenv from 'dotenv';
import express from 'express';
import { handleApiRequest } from '../api/_lib/server.ts';

dotenv.config({ path: ['.env.local', '.env'] });

const app = express();
const port = Number(process.env.API_PORT ?? 3001);

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.all('/api/*', (req, res) => {
  void handleApiRequest(req, res);
});

app.listen(port, '127.0.0.1', () => {
  console.info(`Local API listening on http://127.0.0.1:${port}`);
});
