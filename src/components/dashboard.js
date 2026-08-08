// dashboard.js: Ana kapsayıcı. Sayfa iskeletini bir kez kurar, alt bileşenleri
// bağlar ve store'a abone olur.
//
// Yeniden çizimde sayfanın tamamı silinmez; yalnızca değişen parçalar
// (özet sayıları, tema etiketi, çöp menüsü, durum mesajı ve kart listesi)
// güncellenir. Aksi hâlde her tuş vuruşunda arama kutusu odağı kaybederdi.

import { escapeHtml } from '../utils/formatters.js';
import { toolsToCSV, downloadFile } from '../utils/csv.js';
import { toolsToJSON, exportFileName } from '../utils/exporters.js';
import {
  subscribe,
  getState,
  visibleTools,
  deletedTools,
  toggleTheme,
  restoreTool,
  clearError,
} from '../state/store.js';
import { mountFilters } from './filters.js';
import { mountToolForm } from './toolForm.js';
import { mountToolTable } from './toolTable.js';
import { mountToolDrawer } from './toolDrawer.js';
import { mountToast } from './toast.js';
import { mountPagination } from './pagination.js';
import { mountStats } from './stats.js';
import { mountImportPanel } from './importPanel.js';

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

  // --- Özet kutuları ve kategori dağılımı ---
  const ozet = mountStats(kok);

  // --- Alt bileşenler (sıra v2 sayfa düzeniyle aynı) ---
  const filtreler = mountFilters(kok);
  const aracFormu = mountToolForm(kok);

  // --- Veri aktarımı ---
  // Dışa aktarma FİLTRELENMİŞ listeyi verir (ekrandaki sayfayı değil):
  // kullanıcı 2. sayfadayken de eşleşen tüm kayıtlar iner.
  const exportAlani = document.createElement('section');
  exportAlani.className = 'export-alani';
  exportAlani.innerHTML = `
    <button id="export-csv-btn" class="ekle-ac-btn" type="button">📤 CSV</button>
    <button id="export-json-btn" class="ekle-ac-btn" type="button">📤 JSON</button>
    <button id="import-btn" class="ekle-ac-btn" type="button">📥 İçe Aktar</button>
  `;
  kok.appendChild(exportAlani);

  const tablo = mountToolTable(kok);
  const sayfalama = mountPagination(kok); // ızgaranın hemen altında

  // Detay çekmecesi ve geri alma toast'ı: sayfa akışının dışında (sabit
  // konumlu) durdukları için yerleşimde nerede olduklarının önemi yok.
  const cekmece = mountToolDrawer(kok);
  const toast = mountToast(kok);
  const iceAktarma = mountImportPanel(kok);

  // --- Alt bilgi ---
  const altBilgi = document.createElement('footer');
  altBilgi.className = 'alt-bilgi';
  altBilgi.innerHTML = '<p>AI Araçları Paneli · v3 (Vite + json-server)</p>';
  kok.appendChild(altBilgi);

  // --- Olay bağlantıları ---

  const temaBtn = baslik.querySelector('#tema-btn');
  const silinenBtn = silinenAlani.querySelector('#silinen-btn');
  const silinenListesi = silinenAlani.querySelector('#silinen-liste');
  const csvBtn = exportAlani.querySelector('#export-csv-btn');
  const jsonBtn = exportAlani.querySelector('#export-json-btn');

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

  // Dışa aktarma: filtreden geçen TÜM kayıtlar (sayfalanmadan), iç alanlar
  // (id/deleted) hariç. JSON, CSV ile aynı alanları taşır ki dosya doğrudan
  // geri içe aktarılabilsin.
  csvBtn.addEventListener('click', () => {
    downloadFile(toolsToCSV(visibleTools()), exportFileName('csv'), 'text/csv;charset=utf-8;');
  });

  jsonBtn.addEventListener('click', () => {
    downloadFile(
      toolsToJSON(visibleTools()),
      exportFileName('json'),
      'application/json;charset=utf-8;'
    );
  });

  exportAlani.querySelector('#import-btn').addEventListener('click', () => {
    iceAktarma.open();
  });

  // --- Yeniden çizim ---

  function ciz(durum) {
    temaBtn.textContent = durum.theme === 'dark' ? '☀️ Açık tema' : '🌙 Koyu tema';

    // Liste boşken hata zaten tabloda "Tekrar dene" ile gösteriliyor; şeritte
    // ikinci kez tekrar etmesin.
    const seritHatasi = durum.error && durum.tools.length > 0 ? durum.error : '';
    durumMetni.textContent = seritHatasi;
    durumMesaji.hidden = !seritHatasi;

    // Düğmelerde sonuç sayısı: kullanıcı neyi indirdiğini bilsin.
    const eslesen = visibleTools().length;
    csvBtn.textContent = `📤 CSV (${eslesen})`;
    jsonBtn.textContent = `📤 JSON (${eslesen})`;
    csvBtn.disabled = eslesen === 0;
    jsonBtn.disabled = eslesen === 0;

    const silinenler = deletedTools();
    silinenBtn.textContent = `🗑 Silinen Araçlar (${silinenler.length})`;
    silinenListesi.innerHTML = silinenler.length
      ? silinenler
          .map(
            (arac) =>
              `<button class="silinen-oge" type="button" data-id="${escapeHtml(arac.id)}"${durum.saving ? ' disabled' : ''}>↩︎ ${escapeHtml(arac.name)}</button>`
          )
          .join('')
      : '<p class="silinen-bos">Silinen araç yok.</p>';

    ozet.update(durum);
    filtreler.update(durum);
    aracFormu.update(durum);
    tablo.update(durum);
    sayfalama.update(durum);
    cekmece.update(durum);
    toast.update(durum);
    iceAktarma.update(durum);
  }

  subscribe(ciz);
  ciz(getState()); // ilk çizim (veri henüz gelmemiş olabilir)
}
