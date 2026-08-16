// pagination.js: Kart ızgarasının altındaki sayfa gezinme çubuğu.
//
// Sayfa hesabı burada yapılmaz; sayı işleri utils/pagination.js'teki saf
// fonksiyonlarda durur (test edilebilir kalsın diye).

import { pageCount } from '../utils/pagination.js';
import { visibleTools, setPage } from '../state/store.js';

export function mountPagination(kap) {
  const bolum = document.createElement('nav');
  bolum.className = 'sayfalama';
  bolum.setAttribute('role', 'navigation');
  bolum.setAttribute('aria-label', 'Sayfalama');
  bolum.hidden = true;
  bolum.innerHTML = `
    <button class="sayfa-btn" data-yon="onceki" type="button">← Önceki</button>
    <span class="sayfa-bilgi" role="status" aria-live="polite"></span>
    <button class="sayfa-btn" data-yon="sonraki" type="button">Sonraki →</button>
  `;
  kap.appendChild(bolum);

  const onceki = bolum.querySelector('[data-yon="onceki"]');
  const sonraki = bolum.querySelector('[data-yon="sonraki"]');
  const bilgi = bolum.querySelector('.sayfa-bilgi');

  // Tıklama işleyicisinin güncel sayfayı görebilmesi için son çizilen durum.
  let mevcutDurum = null;

  // Sayfa değişince ızgaranın başına dön; aksi hâlde kullanıcı yeni sayfanın
  // ortasında başlıyor ve içerik değişmemiş gibi görünüyor.
  function sayfayaGit(no) {
    setPage(no);
    kap.querySelector('main')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  bolum.addEventListener('click', (olay) => {
    const btn = olay.target.closest('.sayfa-btn');
    if (!btn) return;
    const durum = mevcutDurum;
    if (!durum) return;
    sayfayaGit(btn.dataset.yon === 'onceki' ? durum.page - 1 : durum.page + 1);
  });

  return {
    update(durum) {
      mevcutDurum = durum;

      // Yükleme/hata ekranlarında sayfalama anlamsız; tablo zaten tek bir
      // mesaj gösteriyor.
      if (durum.loading || (durum.error && durum.tools.length === 0)) {
        bolum.hidden = true;
        return;
      }

      const toplam = visibleTools().length;
      const sonSayfa = pageCount(toplam, durum.pageSize);

      // Tek sayfaya sığıyorsa çubuğu hiç gösterme.
      if (sonSayfa <= 1) {
        bolum.hidden = true;
        return;
      }

      bolum.hidden = false;
      bilgi.textContent = `Sayfa ${durum.page} / ${sonSayfa} · ${toplam} araç`;
      onceki.disabled = durum.saving || durum.page <= 1;
      sonraki.disabled = durum.saving || durum.page >= sonSayfa;
    },
  };
}
