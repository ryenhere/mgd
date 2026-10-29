/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterMagazines,
  slugifyTitle,
  formatSemesterYear,
  formatIndonesianDate,
} from './magazineUtils.ts';
import { Magazine } from '../types/magazine.ts';

test('filterMagazines returns empty array when input is empty array', () => {
  const result = filterMagazines([], { search: 'dakwah' });
  assert.deepEqual(result, []);
});

test('filterMagazines correctly filters by search keyword', () => {
  const dummyMags: Magazine[] = [
    {
      id: '1',
      title: 'Cahaya Pena Santri',
      slug: 'cahaya-pena-santri',
      description: 'Menulis sebagai jalan dakwah generasi muda',
      theme: 'Dakwah Digital',
      semester: 1,
      publicationYear: 2026,
      publishedAt: '2026-05-10',
      status: 'published',
    },
    {
      id: '2',
      title: 'Ukhuwah dalam Kata',
      slug: 'ukhuwah-dalam-kata',
      description: 'Kisah persaudaraan santri di asrama',
      theme: 'Adab dan Akhlak',
      semester: 2,
      publicationYear: 2026,
      publishedAt: '2026-11-20',
      status: 'published',
    },
  ];

  const searchResults = filterMagazines(dummyMags, { search: 'pena' });
  assert.equal(searchResults.length, 1);
  assert.equal(searchResults[0].id, '1');

  const themeResults = filterMagazines(dummyMags, { theme: 'adab dan akhlak' });
  assert.equal(themeResults.length, 1);
  assert.equal(themeResults[0].id, '2');

  const semesterResults = filterMagazines(dummyMags, { semester: 2 });
  assert.equal(semesterResults.length, 1);
  assert.equal(semesterResults[0].id, '2');
});

test('slugifyTitle handles accents, spaces, and special symbols', () => {
  assert.equal(slugifyTitle('Dakwah Melalui Pena & Tulisan!'), 'dakwah-melalui-pena-tulisan');
  assert.equal(slugifyTitle('  Edisi 1: Santri Bersuara  '), 'edisi-1-santri-bersuara');
});

test('formatSemesterYear formats properly', () => {
  assert.equal(formatSemesterYear(1, 2026), 'Semester 1 • 2026');
  assert.equal(formatSemesterYear(2, 2025), 'Semester 2 • 2025');
});

test('formatIndonesianDate handles valid date and null', () => {
  assert.equal(formatIndonesianDate(null), 'Belum terbit');
  const formatted = formatIndonesianDate('2026-06-15');
  assert.match(formatted, /2026/);
});
