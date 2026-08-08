// filters.js: Arama + kategori + durum filtreleme (saf fonksiyonlar).
// v2'deki aracFiltreyeUyuyor / applyFilters mantığının taşınmış hâli.

import { DEFAULT_STATUS } from '../constants.js';

// toolMatches: araç, arama metnine VE kategoriye VE duruma birden uyuyor mu?
// - Arama: name + category + purpose üzerinde, büyük/küçük harf duyarsız.
// - Kategori: "all" ise herkes geçer, yoksa tam eşleşme.
// - Durum: "all" ise herkes geçer; status yoksa DEFAULT_STATUS kabul edilir.
export function toolMatches(tool = {}, { search = '', category = 'all', status = 'all' } = {}) {
  // Alanlar `?? ''` ile birleştirilir: şablon dizgisi eksik alanı "undefined"
  // metnine çevirdiği için "undefined" araması eksik alanlı her aracı buluyordu.
  const haystack = [tool.name, tool.category, tool.purpose]
    .map((alan) => alan ?? '')
    .join(' ')
    .toLowerCase();
  const textOk = haystack.includes(search.toLowerCase());
  const categoryOk = category === 'all' || tool.category === category;
  const toolStatus = tool.status || DEFAULT_STATUS;
  const statusOk = status === 'all' || toolStatus === status;
  return textOk && categoryOk && statusOk;
}

// filterTools: bir liste üzerinde toolMatches'i uygular.
export function filterTools(tools, filters) {
  return tools.filter((tool) => toolMatches(tool, filters));
}

// uniqueCategories: listedeki benzersiz kategorileri döndürür (menüyü doldurmak için).
export function uniqueCategories(tools) {
  return [...new Set(tools.map((tool) => tool.category))];
}
