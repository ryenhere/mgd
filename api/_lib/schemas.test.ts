import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isPdfUploadDescriptor,
  magazineInputSchema,
  magazineUpdateSchema,
  sanitizeOriginalFilename,
  uploadDescriptorSchema,
} from './schemas.ts';
import { MAX_PDF_SIZE_BYTES } from '../../src/constants/upload.ts';

test('magazine metadata rejects invalid fields and accepts the documented limits', () => {
  const valid = {
    title: 'Edisi Media Madrasah',
    description: 'Ringkasan edisi.',
    theme: 'Literasi',
    semester: 1,
    publicationYear: new Date().getFullYear(),
    status: 'draft',
  };

  assert.equal(magazineInputSchema.safeParse(valid).success, true);
  assert.equal(magazineInputSchema.safeParse({ ...valid, semester: 3 }).success, false);
  assert.equal(magazineInputSchema.safeParse({ ...valid, title: ' ' }).success, false);
  assert.equal(magazineInputSchema.safeParse({ ...valid, title: 'x'.repeat(161) }).success, false);
  assert.equal(magazineUpdateSchema.safeParse({}).success, false);
  assert.equal(magazineUpdateSchema.safeParse({ status: 'published' }).success, true);
});

test('PDF upload descriptors enforce size, MIME type, and extension', () => {
  const valid = {
    filename: 'majalah.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 1024,
  };

  assert.equal(uploadDescriptorSchema.safeParse(valid).success, true);
  assert.equal(isPdfUploadDescriptor(valid), true);
  assert.equal(isPdfUploadDescriptor({ ...valid, filename: 'majalah.exe' }), false);
  assert.equal(isPdfUploadDescriptor({ ...valid, mimeType: 'text/plain' }), false);
  assert.equal(
    uploadDescriptorSchema.safeParse({ ...valid, fileSizeBytes: MAX_PDF_SIZE_BYTES + 1 }).success,
    false,
  );
  assert.equal(uploadDescriptorSchema.safeParse({ ...valid, fileSizeBytes: 0 }).success, false);
});

test('original filenames are reduced to a safe display name', () => {
  assert.equal(sanitizeOriginalFilename('../../edisi\\final.pdf'), 'final.pdf');
  assert.equal(sanitizeOriginalFilename('edisi\u0000.pdf'), 'edisi.pdf');
});
