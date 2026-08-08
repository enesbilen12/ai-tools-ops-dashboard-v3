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

  it('tekrar eden kategoriyi bir kez sayar', () => {
    const tekrarli = [{ category: 'Metin' }, { category: 'Metin' }, { category: 'Kod' }];
    expect(uniqueCategories(tekrarli).sort()).toEqual(['Kod', 'Metin']);
  });

  it('boş listede boş dizi döndürür', () => {
    expect(uniqueCategories([])).toEqual([]);
  });
});

// --- Sınır ve hatalı tip senaryoları (Gün 6) ---

describe('toolMatches — boş ve eksik girdiler', () => {
  it('boş arama tüm araçları geçirir', () => {
    araclar.forEach((arac) => expect(toolMatches(arac, { search: '' })).toBe(true));
  });

  it('filtre nesnesi verilmezse hepsi geçer', () => {
    expect(toolMatches(araclar[0])).toBe(true);
  });

  // K2: alanlar şablon dizgisiyle birleştirilirken eksik alan "undefined"
  // metnine dönüşüyordu; "undefined" araması eksik alanlı her aracı buluyordu.
  it('eksik alanlar aramaya "undefined" olarak sızmaz', () => {
    const eksik = { name: 'X' }; // category ve purpose yok
    expect(toolMatches(eksik, { search: 'undefined' })).toBe(false);
    expect(toolMatches(eksik, { search: 'null' })).toBe(false);
  });

  it('eksik alanlı araç kendi adıyla yine bulunur', () => {
    expect(toolMatches({ name: 'Yalnız' }, { search: 'yalnız' })).toBe(true);
  });

  it('hiçbir alanı olmayan araç çökertmez', () => {
    expect(() => toolMatches({}, { search: 'x' })).not.toThrow();
    expect(toolMatches({}, { search: 'x' })).toBe(false);
  });
});


describe('filterTools — sınırlar', () => {
  it('boş listede boş dizi döndürür', () => {
    expect(filterTools([], { search: 'x' })).toEqual([]);
  });

  it('hiçbiri eşleşmezse boş dizi döndürür', () => {
    expect(filterTools(araclar, { search: 'kesinlikle-yok' })).toEqual([]);
  });

  it('girdi dizisini değiştirmez', () => {
    const kopya = [...araclar];
    filterTools(araclar, { category: 'Metin' });
    expect(araclar).toEqual(kopya);
  });
});
