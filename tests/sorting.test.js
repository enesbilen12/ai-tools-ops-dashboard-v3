import { describe, it, expect } from 'vitest';
import {
  sortTools,
  isSortOption,
  SORT_OPTIONS,
  DEFAULT_SORT,
} from '../src/utils/sorting.js';

const araclar = [
  { id: 1, name: 'Midjourney', category: 'Görsel', status: 'Deneme' },
  { id: 2, name: 'ChatGPT', category: 'Metin', status: 'Aktif' },
  { id: 3, name: 'Eski Araç', category: 'Kod' }, // status yok -> Aktif sayılır
];

const adlar = (liste) => liste.map((a) => a.name);

describe('sortTools', () => {
  it('ada göre A→Z sıralar', () => {
    expect(adlar(sortTools(araclar, 'name-asc'))).toEqual([
      'ChatGPT',
      'Eski Araç',
      'Midjourney',
    ]);
  });

  it('ada göre Z→A sıralar', () => {
    expect(adlar(sortTools(araclar, 'name-desc'))).toEqual([
      'Midjourney',
      'Eski Araç',
      'ChatGPT',
    ]);
  });

  it('kategoriye göre sıralar', () => {
    expect(sortTools(araclar, 'category-asc').map((a) => a.category)).toEqual([
      'Görsel',
      'Kod',
      'Metin',
    ]);
  });

  it('duruma göre sıralarken status yoksa Aktif kabul eder', () => {
    // 'Eski Araç' status taşımıyor; Aktif sayılıp Deneme'den önce gelmeli.
    expect(adlar(sortTools(araclar, 'status-asc'))).toEqual([
      'ChatGPT',
      'Eski Araç',
      'Midjourney',
    ]);
  });

  // Türkçe harf sırası: varsayılan (Unicode) sıralamada Ç ve Ş, Z'den sonra
  // gelir ve liste yanlış dizilir.
  it('Türkçe harfleri doğru sıralar (Ç/Ş/İ)', () => {
    const turkce = [
      { name: 'Zoom' },
      { name: 'Çizim' },
      { name: 'Şema' },
      { name: 'İzleme' },
      { name: 'Analiz' },
    ];
    expect(adlar(sortTools(turkce, 'name-asc'))).toEqual([
      'Analiz',
      'Çizim',
      'İzleme',
      'Şema',
      'Zoom',
    ]);
  });

  it('eşit kategoride ada göre ikincil sıralama yapar', () => {
    const ayniKategori = [
      { name: 'Zoom', category: 'Metin' },
      { name: 'Alfa', category: 'Metin' },
    ];
    expect(adlar(sortTools(ayniKategori, 'category-asc'))).toEqual(['Alfa', 'Zoom']);
  });

  it('girdi dizisini değiştirmez', () => {
    const kopya = [...araclar];
    sortTools(araclar, 'name-asc');
    expect(araclar).toEqual(kopya);
  });

  it('bilinmeyen sıralama değerinde varsayılana düşer', () => {
    expect(adlar(sortTools(araclar, 'bozuk-deger'))).toEqual(
      adlar(sortTools(araclar, DEFAULT_SORT))
    );
  });

  it('boş listede boş dizi döndürür', () => {
    expect(sortTools([], 'name-asc')).toEqual([]);
  });
});

describe('isSortOption', () => {
  it('menüdeki tüm değerleri kabul eder', () => {
    SORT_OPTIONS.forEach((secenek) => {
      expect(isSortOption(secenek.value)).toBe(true);
    });
  });

  it('tanınmayan değeri reddeder', () => {
    expect(isSortOption('xyz')).toBe(false);
    expect(isSortOption(null)).toBe(false);
  });
});
