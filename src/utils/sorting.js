// sorting.js: Araç listesini sıralama (saf fonksiyonlar).
//
// Karşılaştırmalar Türkçe harf sırasına göre yapılır: JavaScript'in varsayılan
// sıralaması Unicode kod noktalarına bakar ve "Çizim" ile "Zoom"u ters dizer,
// "İ"/"ı" harflerini de yanlış yerleştirir.

import { DEFAULT_STATUS } from '../constants.js';

// Sıralama menüsündeki seçenekler. Etiket ile değer farklı olduğu için
// formatters.optionsHtml kullanılmaz; menü bu listeden üretilir.
export const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Ad (A → Z)' },
  { value: 'name-desc', label: 'Ad (Z → A)' },
  { value: 'category-asc', label: 'Kategori (A → Z)' },
  { value: 'status-asc', label: 'Durum (A → Z)' },
];

export const DEFAULT_SORT = 'name-asc';

// isSortOption: verilen değer menüdeki seçeneklerden biri mi?
// URL elle düzenlenebildiği için dışarıdan gelen her değer doğrulanır.
export function isSortOption(value) {
  return SORT_OPTIONS.some((secenek) => secenek.value === value);
}

// karsilastir: iki metni Türkçe harf sırasına göre karşılaştırır.
function karsilastir(a, b) {
  return String(a ?? '').localeCompare(String(b ?? ''), 'tr');
}

// Her seçeneğin karşılaştırma fonksiyonu. Ad dışındaki alanlarda eşitlik
// sıkça oluşur (aynı kategori/durum); o durumda ada düşülür, aksi hâlde eşit
// kayıtların sırası çizimden çizime oynardı.
const KARSILASTIRICILAR = {
  'name-asc': (a, b) => karsilastir(a.name, b.name),
  'name-desc': (a, b) => karsilastir(b.name, a.name),
  'category-asc': (a, b) =>
    karsilastir(a.category, b.category) || karsilastir(a.name, b.name),
  'status-asc': (a, b) =>
    karsilastir(a.status || DEFAULT_STATUS, b.status || DEFAULT_STATUS) ||
    karsilastir(a.name, b.name),
};

// sortTools: sıralanmış YENİ bir dizi döndürür.
//
// Girdi dizisi değiştirilmez: store'daki `durum.tools` yerinde sıralanırsa
// çöp menüsünün ve CSV dışa aktarmanın sırası da sessizce değişirdi.
// Bilinmeyen `sort` değeri varsayılana düşer (URL'den çöp gelebilir).
export function sortTools(tools, sort = DEFAULT_SORT) {
  const karsilastirici = KARSILASTIRICILAR[sort] || KARSILASTIRICILAR[DEFAULT_SORT];
  return [...tools].sort(karsilastirici);
}
