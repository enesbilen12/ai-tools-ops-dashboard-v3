// filters.js: Arama kutusu ile kategori, durum ve sıralama menülerini çizer.
// Kendi başına filtreleme/sıralama yapmaz; yalnızca kullanıcı girdisini store'a iletir.

import { STATUSES } from '../constants.js';
import { optionsHtml } from '../utils/formatters.js';
import { uniqueCategories } from '../utils/filters.js';
import { SORT_OPTIONS } from '../utils/sorting.js';
import { debounce } from '../utils/debounce.js';
import { activeTools, setFilter, setSort, resetFilters } from '../state/store.js';

// Arama kutusunun store'u güncellemeden önce beklediği süre. Her tuş vuruşunda
// güncellemek tüm kart ızgarasını yeniden çizdiriyordu.
const ARAMA_GECIKMESI = 300;

// siralamaSecenekleri: SORT_OPTIONS'tan <option> listesi. optionsHtml burada
// kullanılamaz çünkü etiket ile değer farklı ('name-asc' -> 'Ad (A → Z)').
function siralamaSecenekleri() {
  return SORT_OPTIONS.map(
    (secenek) => `<option value="${secenek.value}">${secenek.label}</option>`
  ).join('');
}

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
    <select id="siralama" class="arama-kutusu" aria-label="Sıralama">
      ${siralamaSecenekleri()}
    </select>
    <button id="filtre-sifirla-btn" class="arama-kutusu" type="button">
      Filtreleri Temizle
    </button>
  `;
  kap.appendChild(bolum);

  const arama = bolum.querySelector('#arama');
  const kategori = bolum.querySelector('#kategori');
  const durumKutusu = bolum.querySelector('#durum');
  const siralama = bolum.querySelector('#siralama');
  const sifirlaBtn = bolum.querySelector('#filtre-sifirla-btn');

  // Arama gecikmeli uygulanır; kutunun kendi değeri anında güncellendiği için
  // yazma akıcı kalır, yalnızca listenin yeniden çizimi ertelenir (US-01).
  const aramayiUygula = debounce((deger) => setFilter('search', deger), ARAMA_GECIKMESI);

  arama.addEventListener('input', () => aramayiUygula(arama.value));
  kategori.addEventListener('change', () => setFilter('category', kategori.value));
  durumKutusu.addEventListener('change', () => setFilter('status', durumKutusu.value));
  siralama.addEventListener('change', () => setSort(siralama.value));
  sifirlaBtn.addEventListener('click', () => {
    // Bekleyen arama iptal edilmezse temizlemeden hemen sonra tetiklenip
    // eski metni geri yazardı.
    aramayiUygula.cancel();
    resetFilters();
  });

  // Kategori menüsü yalnızca gerçekten değiştiğinde yeniden çizilir; her
  // güncellemede innerHTML yazmak açık menüyü kapatır ve odağı kaçırır.
  let sonKategoriHtml = '';

  return {
    update(durum) {
      const kategoriler = uniqueCategories(activeTools());

      // Seçili kategori silinen son araçla birlikte kaybolmuş olabilir; o
      // durumda "Tüm kategoriler"e düşülür (v2 davranışı).
      //
      // Bu hizalama YALNIZCA veri geldikten sonra yapılır: URL'den gelen
      // kategori (?category=Metin) liste boşken "all"a çevrilir ve adres
      // çubuğundaki filtre daha ilk çizimde kaybolurdu.
      const veriHazir = durum.tools.length > 0;
      const secili =
        !veriHazir || kategoriler.includes(durum.filters.category)
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
      // Bekleyen bir arama varken kutuya dokunulmaz: store henüz eski metni
      // taşıdığı için kullanıcının yazdığı geri alınırdı.
      if (!aramayiUygula.pending() && arama.value !== durum.filters.search) {
        arama.value = durum.filters.search;
      }
      if (durumKutusu.value !== durum.filters.status) {
        durumKutusu.value = durum.filters.status;
      }
      if (siralama.value !== durum.sort) {
        siralama.value = durum.sort;
      }
    },
  };
}
