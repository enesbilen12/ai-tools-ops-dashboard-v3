// dashboard.js: Ana kapsayıcı. Sayfa iskeletini bir kez kurar, alt bileşenleri
// bağlar ve store'a abone olur.
//
// Yeniden çizimde sayfanın tamamı silinmez; yalnızca değişen parçalar
// (özet sayıları, tema etiketi, çöp menüsü, durum mesajı ve kart listesi)
// güncellenir. Aksi hâlde her tuş vuruşunda arama kutusu odağı kaybederdi.

import { escapeHtml } from '../utils/formatters.js';
import { toolsToCSV, downloadCSV } from '../utils/csv.js';
import {
  subscribe,
  getState,
  activeTools,
  deletedTools,
  isFavorite,
  toggleTheme,
  restoreTool,
  clearError,
} from '../state/store.js';
import { mountFilters } from './filters.js';
import { mountAddForm } from './toolForm.js';
import { mountToolTable } from './toolTable.js';

export function mountDashboard(kok) {
  kok.innerHTML = '';

  // --- Sağ üst köşe: silinen araçlar menüsü ---
  const silinenAlani = document.createElement('div');
  silinenAlani.className = 'silinen-alani';
  silinenAlani.innerHTML = `
    <button id="silinen-btn" class="silinen-btn" type="button">🗑 Silinen Araçlar (0)</button>
    <div id="silinen-liste" class="silinen-liste gizli"></div>
  `;
  kok.appendChild(silinenAlani);

  // --- Başlık ---
  const baslik = document.createElement('header');
  baslik.innerHTML = `
    <h1>🤖 AI Araçları Paneli</h1>
    <p>Yapay zeka araçlarını tek ekranda toplayan basit bir panel.</p>
    <button id="tema-btn" class="tema-btn" type="button">🌙 Koyu tema</button>
  `;
  kok.appendChild(baslik);

  // --- Durum şeridi ---
  // Yalnızca liste ekranda dururken oluşan aksiyon hatalarını gösterir
  // (ekleme/silme başarısız oldu gibi). İlk yükleme hatası şeritte değil,
  // tablonun içinde "Tekrar dene" butonuyla birlikte gösterilir.
  const durumMesaji = document.createElement('div');
  durumMesaji.className = 'durum-mesaji';
  durumMesaji.setAttribute('role', 'status');
  durumMesaji.hidden = true;
  durumMesaji.innerHTML = `
    <span class="durum-metin"></span>
    <button class="durum-kapat" type="button" aria-label="Mesajı kapat">×</button>
  `;
  kok.appendChild(durumMesaji);

  // --- Özet kutuları ---
  const ozet = document.createElement('section');
  ozet.className = 'ozet-alani';
  ozet.innerHTML = `
    <div class="ozet-kutu">Toplam Araç <strong id="ozet-toplam">0</strong></div>
    <div class="ozet-kutu">Favoriler <strong id="ozet-favori">0</strong></div>
  `;
  kok.appendChild(ozet);

  // --- Alt bileşenler (sıra v2 sayfa düzeniyle aynı) ---
  const filtreler = mountFilters(kok);
  const ekleFormu = mountAddForm(kok);

  // --- Dışa aktarma ---
  const exportAlani = document.createElement('section');
  exportAlani.className = 'export-alani';
  exportAlani.innerHTML =
    '<button id="export-btn" class="ekle-ac-btn" type="button">📤 CSV Dışa Aktar</button>';
  kok.appendChild(exportAlani);

  const tablo = mountToolTable(kok);

  // --- Alt bilgi ---
  const altBilgi = document.createElement('footer');
  altBilgi.className = 'alt-bilgi';
  altBilgi.innerHTML = '<p>AI Araçları Paneli · v3 (Vite + json-server)</p>';
  kok.appendChild(altBilgi);

  // --- Olay bağlantıları ---

  const temaBtn = baslik.querySelector('#tema-btn');
  const silinenBtn = silinenAlani.querySelector('#silinen-btn');
  const silinenListesi = silinenAlani.querySelector('#silinen-liste');
  const ozetToplam = ozet.querySelector('#ozet-toplam');
  const ozetFavori = ozet.querySelector('#ozet-favori');

  const durumMetni = durumMesaji.querySelector('.durum-metin');

  temaBtn.addEventListener('click', toggleTheme);
  durumMesaji.querySelector('.durum-kapat').addEventListener('click', clearError);

  // Çöp menüsünü aç/kapa.
  silinenBtn.addEventListener('click', () => {
    silinenListesi.classList.toggle('gizli');
  });

  // Listedeki bir araca tıklayınca geri yükle (olay delegasyonu).
  silinenListesi.addEventListener('click', async (olay) => {
    const oge = olay.target.closest('.silinen-oge');
    if (!oge) return;
    const sonuc = await restoreTool(oge.dataset.id);
    // Aynı adlı aktif araç varsa geri yükleme engellenir (US-06).
    if (!sonuc.ok) alert(sonuc.message);
  });

  // CSV dışa aktarma: yalnızca aktif araçlar, iç alanlar (id/deleted) hariç.
  exportAlani.querySelector('#export-btn').addEventListener('click', () => {
    downloadCSV(toolsToCSV(activeTools()));
  });

  // --- Yeniden çizim ---

  function ciz(durum) {
    temaBtn.textContent = durum.theme === 'dark' ? '☀️ Açık tema' : '🌙 Koyu tema';

    // Liste boşken hata zaten tabloda "Tekrar dene" ile gösteriliyor; şeritte
    // ikinci kez tekrar etmesin.
    const seritHatasi = durum.error && durum.tools.length > 0 ? durum.error : '';
    durumMetni.textContent = seritHatasi;
    durumMesaji.hidden = !seritHatasi;

    const aktifler = activeTools();
    ozetToplam.textContent = aktifler.length;
    ozetFavori.textContent = aktifler.filter((arac) => isFavorite(arac.name)).length;

    const silinenler = deletedTools();
    silinenBtn.textContent = `🗑 Silinen Araçlar (${silinenler.length})`;
    silinenListesi.innerHTML = silinenler.length
      ? silinenler
          .map(
            (arac) =>
              `<button class="silinen-oge" type="button" data-id="${escapeHtml(arac.id)}">↩︎ ${escapeHtml(arac.name)}</button>`
          )
          .join('')
      : '<p class="silinen-bos">Silinen araç yok.</p>';

    filtreler.update(durum);
    ekleFormu.update(durum);
    tablo.update(durum);
  }

  subscribe(ciz);
  ciz(getState()); // ilk çizim (veri henüz gelmemiş olabilir)
}
