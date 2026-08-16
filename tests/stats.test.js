import { describe, it, expect } from 'vitest';
import { computeStats } from '../src/utils/stats.js';

const araclar = [
  { name: 'ChatGPT', category: 'Metin', status: 'Aktif' },
  { name: 'Claude', category: 'Metin', status: 'Aktif' },
  { name: 'Midjourney', category: 'Görsel', status: 'Deneme' },
  { name: 'Eski Araç', category: 'Kod' }, // status yok -> Aktif sayılır
  { name: 'Pasif Araç', category: 'Kod', status: 'Pasif' },
];

describe('computeStats', () => {
  it('toplam kayıt sayısını verir', () => {
    expect(computeStats(araclar).total).toBe(5);
  });

  // "Durumu Aktif" ile "silinmemiş" farklı kavramlar; burada ölçülen ilkidir.
  it('durumu Aktif olanları sayar, status yoksa Aktif kabul eder', () => {
    expect(computeStats(araclar).active).toBe(3); // ChatGPT, Claude, Eski Araç
  });

  it('durum dağılımını üç seçenek için de doldurur', () => {
    expect(computeStats(araclar).byStatus).toEqual({ Aktif: 3, Deneme: 1, Pasif: 1 });
  });

  it('favorileri ada göre sayar', () => {
    expect(computeStats(araclar, ['Claude', 'Yok Böyle Bir Araç']).favorites).toBe(1);
  });

  it('kategori dağılımını çoktan aza sıralar', () => {
    const dagilim = computeStats(araclar).byCategory;
    expect(dagilim.map((k) => k.name)).toEqual(['Kod', 'Metin', 'Görsel']);
    expect(dagilim.map((k) => k.count)).toEqual([2, 2, 1]);
  });

  it('eşit sayıda kategoriyi Türkçe harf sırasına göre dizer', () => {
    // Kod (2) ve Metin (2) eşit; K < M olduğu için Kod önce gelir.
    const dagilim = computeStats(araclar).byCategory;
    expect(dagilim[0].name).toBe('Kod');
    expect(dagilim[1].name).toBe('Metin');
  });

  it('oranları toplam üzerinden hesaplar', () => {
    const metin = computeStats(araclar).byCategory.find((k) => k.name === 'Metin');
    expect(metin.ratio).toBeCloseTo(2 / 5);
  });

  it('kategori sayısını bildirir', () => {
    expect(computeStats(araclar).categoryCount).toBe(3);
  });

  it('kategorisi olmayan aracı "Kategorisiz" altında toplar', () => {
    const dagilim = computeStats([{ name: 'X', status: 'Aktif' }]).byCategory;
    expect(dagilim[0]).toMatchObject({ name: 'Kategorisiz', count: 1 });
  });

  it('boş listede sıfırlarla döner (bölme hatası vermez)', () => {
    const bos = computeStats([]);
    expect(bos.total).toBe(0);
    expect(bos.active).toBe(0);
    expect(bos.byCategory).toEqual([]);
    expect(bos.byStatus).toEqual({ Aktif: 0, Deneme: 0, Pasif: 0 });
  });

  it('girdi dizisini değiştirmez', () => {
    const kopya = JSON.parse(JSON.stringify(araclar));
    computeStats(araclar, ['Claude']);
    expect(araclar).toEqual(kopya);
  });
});
