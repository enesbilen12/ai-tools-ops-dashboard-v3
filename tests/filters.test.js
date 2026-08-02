import { describe, it, expect } from 'vitest';
import { toolMatches, filterTools, uniqueCategories } from '../src/utils/filters.js';

const araclar = [
  { id: 1, name: 'ChatGPT', category: 'Metin', purpose: 'sohbet', status: 'Aktif' },
  { id: 2, name: 'Midjourney', category: 'Görsel', purpose: 'görsel üret', status: 'Deneme' },
  { id: 3, name: 'Eski Araç', category: 'Kod', purpose: 'kod' }, // status yok -> Aktif sayılır
];

describe('toolMatches', () => {
  it('arama name+category+purpose üzerinde ve harf duyarsız çalışır', () => {
    expect(toolMatches(araclar[0], { search: 'chat' })).toBe(true); // name
    expect(toolMatches(araclar[1], { search: 'görsel' })).toBe(true); // category+purpose
    expect(toolMatches(araclar[0], { search: 'video' })).toBe(false);
  });

  it('owner/note aramaya dahil değildir', () => {
    const arac = { name: 'X', category: 'Metin', purpose: 'y', owner: 'Gizli' };
    expect(toolMatches(arac, { search: 'gizli' })).toBe(false);
  });

  it('kategori filtresi tam eşleşme ister, "all" hepsini geçirir', () => {
    expect(toolMatches(araclar[0], { category: 'Metin' })).toBe(true);
    expect(toolMatches(araclar[0], { category: 'Görsel' })).toBe(false);
    expect(toolMatches(araclar[0], { category: 'all' })).toBe(true);
  });

  it('status yoksa Aktif kabul edilir', () => {
    expect(toolMatches(araclar[2], { status: 'Aktif' })).toBe(true);
    expect(toolMatches(araclar[2], { status: 'Pasif' })).toBe(false);
  });

  it('filtreler VE (AND) mantığıyla birleşir', () => {
    expect(toolMatches(araclar[1], { search: 'görsel', category: 'Görsel', status: 'Deneme' })).toBe(true);
    expect(toolMatches(araclar[1], { search: 'görsel', category: 'Görsel', status: 'Aktif' })).toBe(false);
  });
});

describe('filterTools', () => {
  it('eşleşen araçları döndürür', () => {
    expect(filterTools(araclar, { category: 'Metin' })).toHaveLength(1);
    expect(filterTools(araclar, {})).toHaveLength(3);
  });
});

describe('uniqueCategories', () => {
  it('benzersiz kategorileri döndürür', () => {
    expect(uniqueCategories(araclar).sort()).toEqual(['Görsel', 'Kod', 'Metin']);
  });
});
