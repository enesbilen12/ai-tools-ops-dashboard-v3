// toolDrawer.js: Sağdan açılan salt-okunur detay çekmecesi.
//
// Kart ızgarasında yer kazanmak için kısaltılan alanların (id, tam not, tam
// URL, abonelik) tamamı burada görünür. Düzenleme burada YAPILMAZ; "Düzenle"
// butonu formu düzenleme moduna alır ve çekmeceyi kapatır (tek form kuralı).

import { DEFAULT_STATUS } from '../constants.js';
import { escapeHtml } from '../utils/formatters.js';
import {
  findTool,
  isFavorite,
  toggleFavorite,
  setEditing,
  removeTool,
  closeDrawer,
} from '../state/store.js';

// Çekmecede gösterilen alanlar: [etiket, araç alanı].
const SATIRLAR = [
  ['Kategori', 'category'],
  ['Kullanım amacı', 'purpose'],
  ['Geliştiren', 'owner'],
  ['Not', 'note'],
  ['Abonelik', 'subscription'],
];

// icerikHtml: çekmecenin gövdesi. Tüm kullanıcı metni escape edilir (US-10).
function icerikHtml(arac) {
  const favori = isFavorite(arac.name);

  const satirlar = SATIRLAR.map(([etiket, alan]) => {
    const deger = arac[alan];
    return `
      <div class="drawer-satir">
        <dt>${etiket}</dt>
        <dd>${deger ? escapeHtml(deger) : '<span class="drawer-bos">—</span>'}</dd>
      </div>
    `;
  }).join('');

  const baglanti = arac.url
    ? `<a href="${escapeHtml(arac.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(arac.url)}</a>`
    : '<span class="drawer-bos">—</span>';

  return `
    <div class="drawer-ust">
      <h2 id="drawer-baslik">${escapeHtml(arac.name)}</h2>
      <button class="drawer-kapat" type="button" aria-label="Çekmeceyi kapat">×</button>
    </div>

    <div class="drawer-rozetler">
      <span class="abonelik">${escapeHtml(arac.status || DEFAULT_STATUS)}</span>
      <span class="abonelik">#${escapeHtml(arac.id)}</span>
      <span class="abonelik">${favori ? '★ Favori' : '☆ Favori değil'}</span>
    </div>

    <dl class="drawer-alanlar">
      ${satirlar}
      <div class="drawer-satir">
        <dt>Site adresi</dt>
        <dd>${baglanti}</dd>
      </div>
    </dl>

    <div class="drawer-aksiyonlar">
      <button class="drawer-favori-btn" type="button">${favori ? '★ Favoriden çıkar' : '☆ Favorilere ekle'}</button>
      <button class="drawer-duzenle-btn" type="button">✏️ Düzenle</button>
      <button class="drawer-sil-btn" type="button">🗑 Sil</button>
    </div>
  `;
}

// mountToolDrawer: perdeyi ve çekmeceyi kaba ekler, olayları bağlar.
export function mountToolDrawer(kap) {
  const perde = document.createElement('div');
  perde.className = 'drawer-perde';
  perde.hidden = true;

  const cekmece = document.createElement('aside');
  cekmece.className = 'drawer';
  cekmece.setAttribute('role', 'dialog');
  cekmece.setAttribute('aria-modal', 'true');
  cekmece.setAttribute('aria-labelledby', 'drawer-baslik');
  cekmece.hidden = true;

  kap.appendChild(perde);
  kap.appendChild(cekmece);

  // Açıkken hangi aracın gösterildiği; kapanışta odağı kartına döndürmek için.
  let acikId = null;

  perde.addEventListener('click', closeDrawer);

  // Esc ile kapatma. Dinleyici belgede durur çünkü odak çekmecenin dışına
  // (ör. bağlantıya) kaymış olabilir.
  document.addEventListener('keydown', (olay) => {
    if (olay.key === 'Escape' && acikId !== null) closeDrawer();
  });

  cekmece.addEventListener('click', async (olay) => {
    const hedef = olay.target;
    const arac = findTool(acikId);

    if (hedef.closest('.drawer-kapat')) {
      closeDrawer();
      return;
    }
    if (!arac) return;

    if (hedef.closest('.drawer-favori-btn')) {
      toggleFavorite(arac.name);
      return;
    }

    if (hedef.closest('.drawer-duzenle-btn')) {
      // Önce çekmeceyi kapat: form sayfanın üstünde, üstünü perde örtmesin.
      closeDrawer();
      setEditing(arac.id);
      return;
    }

    if (hedef.closest('.drawer-sil-btn')) {
      // Onay diyaloğu yok; güvence 5 saniyelik geri alma toast'ı (US-06).
      await removeTool(arac.id);
    }
  });

  // İçerik yalnızca açılan araç DEĞİŞTİĞİNDE yeniden çizilir; her bildirimde
  // innerHTML yazmak çekmece içindeki odağı kaçırırdı.
  let sonDrawerId = null;

  return {
    update(durum) {
      const drawerId = durum.drawerId;

      if (String(drawerId) !== String(sonDrawerId)) {
        const oncekiId = sonDrawerId;
        sonDrawerId = drawerId;
        acikId = drawerId;

        if (drawerId === null) {
          cekmece.hidden = true;
          perde.hidden = true;
          cekmece.innerHTML = '';
          // Odağı geldiği karta döndür. Kart listesi yeniden çizilmiş
          // olabileceği için öğe referansı değil, id ile aranır.
          const kart = document.querySelector(`.kart[data-id="${CSS.escape(String(oncekiId))}"]`);
          if (kart) kart.focus();
        } else {
          const arac = findTool(drawerId);
          if (!arac) {
            // Araç arada silinmiş olabilir; çekmeceyi hiç açma.
            acikId = null;
            sonDrawerId = null;
            return;
          }
          cekmece.innerHTML = icerikHtml(arac);
          cekmece.hidden = false;
          perde.hidden = false;
          cekmece.querySelector('.drawer-kapat').focus();
        }
        return;
      }

      // Açıkken favori durumu değişmiş olabilir (buton etiketi + rozet).
      if (drawerId !== null) {
        const arac = findTool(drawerId);
        if (arac) {
          const favoriBtn = cekmece.querySelector('.drawer-favori-btn');
          if (favoriBtn) {
            const favori = isFavorite(arac.name);
            favoriBtn.textContent = favori ? '★ Favoriden çıkar' : '☆ Favorilere ekle';
          }
        }
        cekmece.querySelectorAll('.drawer-aksiyonlar button').forEach((btn) => {
          btn.disabled = durum.saving;
        });
      }
    },
  };
}
