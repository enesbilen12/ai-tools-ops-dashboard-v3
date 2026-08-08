// stats.js: Özet alanındaki sayılar ve kategori dağılımı (saf fonksiyon).
//
// DİKKAT — bu projede iki ayrı "aktif" kavramı var:
//   • aktif araç   : çöp kutusunda değil        -> deleted !== true
//   • durumu Aktif : Deneme/Pasif değil          -> status === 'Aktif'
// computeStats'a YALNIZCA aktif araçlar (activeTools()) verilir; `active`
// alanı ikinci anlamı, yani durumu Aktif olanların sayısını taşır.

import { DEFAULT_STATUS, STATUSES } from '../constants.js';

// computeStats: özet kutuları ve dağılım çubukları için sayıları hesaplar.
// Girdi dizisi değiştirilmez.
export function computeStats(tools = [], favorites = []) {
  const durumSayilari = {};
  STATUSES.forEach((durum) => {
    durumSayilari[durum] = 0;
  });

  const kategoriSayilari = new Map();

  tools.forEach((arac) => {
    // status boşsa DEFAULT_STATUS sayılır (filters.js / sorting.js ile aynı kural).
    const durum = arac.status || DEFAULT_STATUS;
    durumSayilari[durum] = (durumSayilari[durum] || 0) + 1;

    const kategori = arac.category || 'Kategorisiz';
    kategoriSayilari.set(kategori, (kategoriSayilari.get(kategori) || 0) + 1);
  });

  const toplam = tools.length;

  // Dağılım: çoktan aza, eşitlikte Türkçe harf sırasına göre.
  const byCategory = [...kategoriSayilari.entries()]
    .map(([name, count]) => ({
      name,
      count,
      ratio: toplam > 0 ? count / toplam : 0,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'tr'));

  return {
    total: toplam,
    active: durumSayilari[DEFAULT_STATUS] || 0,
    favorites: tools.filter((arac) => favorites.includes(arac.name)).length,
    categoryCount: byCategory.length,
    byStatus: durumSayilari,
    byCategory,
  };
}
