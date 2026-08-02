// filters.js: Arama kutusu ile kategori ve durum menülerini çizer.
// Kendi başına filtreleme yapmaz; yalnızca kullanıcı girdisini store'a iletir.

import { STATUSES } from '../constants.js';
import { optionsHtml } from '../utils/formatters.js';
import { uniqueCategories } from '../utils/filters.js';
import { activeTools, setFilter, resetFilters } from '../state/store.js';

export function mountFilters(kap) {
  const bolum = document.createElement('section');
  bolum.className = 'arama-alani';
  bolum.innerHTML = `
    <input type="text" id="arama" class="arama-kutusu" placeholder="Araç ara... (örn. chat)" />
    <select id="kategori" class="arama-kutusu"></select>
    <select id="durum" class="arama-kutusu">
      <option value="all">Tüm durumlar</option>
      ${optionsHtml(STATUSES)}
    </select>
    <button id="filtre-sifirla-btn" class="arama-kutusu" type="button">
      Filtreleri Temizle
    </button>
  `;
  kap.appendChild(bolum);

  const arama = bolum.querySelector('#arama');
  const kategori = bolum.querySelector('#kategori');
  const durumKutusu = bolum.querySelector('#durum');
  const sifirlaBtn = bolum.querySelector('#filtre-sifirla-btn');

  // Arama her tuş vuruşunda, menüler değişimde uygulanır (US-01 / US-03).
  arama.addEventListener('input', () => setFilter('search', arama.value));
  kategori.addEventListener('change', () => setFilter('category', kategori.value));
  durumKutusu.addEventListener('change', () => setFilter('status', durumKutusu.value));
  sifirlaBtn.addEventListener('click', resetFilters);

  // Kategori menüsü yalnızca gerçekten değiştiğinde yeniden çizilir; her
  // güncellemede innerHTML yazmak açık menüyü kapatır ve odağı kaçırır.
  let sonKategoriHtml = '';

  return {
    update(durum) {
      const kategoriler = uniqueCategories(activeTools());
      // Seçili kategori silinen son araçla birlikte kaybolmuş olabilir; o
      // durumda "Tüm kategoriler"e düşülür (v2 davranışı).
      const secili = kategoriler.includes(durum.filters.category)
        ? durum.filters.category
        : 'all';

      const yeniHtml =
        '<option value="all">Tüm kategoriler</option>' + optionsHtml(kategoriler, secili);
      if (yeniHtml !== sonKategoriHtml) {
        kategori.innerHTML = yeniHtml;
        sonKategoriHtml = yeniHtml;
      }
      kategori.value = secili;

      if (secili !== durum.filters.category) {
        setFilter('category', secili); // durumu da hizala; bu tekrar update tetikler
        return;
      }

      // "Filtreleri Temizle" gibi dışarıdan gelen değişiklikleri girdilere yansıt.
      if (arama.value !== durum.filters.search) arama.value = durum.filters.search;
      if (durumKutusu.value !== durum.filters.status) {
        durumKutusu.value = durum.filters.status;
      }
    },
  };
}
