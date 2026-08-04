// toolTable.js: Filtrelenmiş araç listesini kart ızgarası olarak çizer ve
// kart üzerindeki aksiyonları (favori, düzenle, sil) yürütür.
//
// Tıklamalar tek bir dinleyiciyle (olay delegasyonu) yakalanır; kartlar her
// çizimde yeniden oluşturulduğu için tek tek dinleyici bağlamak doğru olmaz.
//
// Kartın kendisi de tıklanabilir: boş bir yerine tıklamak detay çekmecesini
// açar. Düzenleme artık kartın içinde değil, sayfanın üstündeki tek formda.

import { DEFAULT_STATUS } from '../constants.js';
import { escapeHtml } from '../utils/formatters.js';
import { filterTools } from '../utils/filters.js';
import {
  activeTools,
  isFavorite,
  toggleFavorite,
  setEditing,
  removeTool,
  loadTools,
  openDrawer,
  findTool,
} from '../state/store.js';

// kartHtml: bir araç kartının içeriği.
function kartHtml(arac, kilitli) {
  const favori = isFavorite(arac.name);
  const yildiz = favori ? '★' : '☆';
  const aktifSinif = favori ? ' aktif' : '';
  const kilit = kilitli ? ' disabled' : '';

  // url varsa "Siteye Git" bağlantısı üret. rel="noopener noreferrer" güvenlik içindir.
  const siteBaglantisi = arac.url
    ? `<a class="site-btn" href="${escapeHtml(arac.url)}"
          target="_blank" rel="noopener noreferrer">🔗 Siteye Git</a>`
    : '';

  const abonelikRozeti = arac.subscription
    ? `<span class="abonelik">${escapeHtml(arac.subscription)}</span>`
    : '';

  // Durum rozeti: status yoksa DEFAULT_STATUS varsayılır.
  const durumRozeti = `<span class="abonelik">${escapeHtml(arac.status || DEFAULT_STATUS)}</span>`;

  return `
    <button class="favori-btn${aktifSinif}" type="button"
            title="Favori" aria-label="Favorilere ekle veya çıkar"${kilit}>${yildiz}</button>
    <h2>${escapeHtml(arac.name)}</h2>
    ${abonelikRozeti}
    ${durumRozeti}
    <p><strong>Kategori:</strong> ${escapeHtml(arac.category)}</p>
    <p>${escapeHtml(arac.purpose)}</p>
    <p><strong>Geliştiren:</strong> ${escapeHtml(arac.owner)}</p>
    <p><em>${escapeHtml(arac.note)}</em></p>
    <div class="kart-aksiyonlar">
      ${siteBaglantisi}
      <button class="duzenle-btn" type="button"${kilit}>✏️ Düzenle</button>
      <button class="sil-btn" type="button"${kilit}>🗑 Sil</button>
    </div>
  `;
}

// kartOlustur: araç için <section class="kart"> üretir.
// Kimlik kartın kendisinde durur (data-id / data-isim); butonlar tekrar etmez.
// tabindex: kart tıklanabilir olduğu için klavyeyle de ulaşılabilmeli.
function kartOlustur(arac, kilitli) {
  const kart = document.createElement('section');
  kart.className = 'kart';
  kart.dataset.id = String(arac.id);
  kart.dataset.isim = arac.name;
  kart.tabIndex = 0;
  kart.setAttribute('role', 'button');
  kart.setAttribute('aria-label', `${arac.name} detaylarını aç`);
  kart.innerHTML = kartHtml(arac, kilitli);
  return kart;
}

// mountToolTable: <main> ızgarasını kaba ekler ve tıklamaları bağlar.
export function mountToolTable(kap) {
  const ana = document.createElement('main');
  kap.appendChild(ana);

  ana.addEventListener('click', async (olay) => {
    const hedef = olay.target;

    // Yükleme başarısız olduğunda gösterilen "Tekrar dene" butonu; bir karta
    // değil doğrudan ızgaraya bağlı olduğu için kart kontrolünden önce gelir.
    if (hedef.closest('.tekrar-btn')) {
      await loadTools();
      return;
    }

    const kart = hedef.closest('.kart');
    if (!kart) return;
    const arac = findTool(kart.dataset.id);
    if (!arac) return;

    if (hedef.closest('.favori-btn')) {
      toggleFavorite(arac.name);
      return;
    }

    if (hedef.closest('.duzenle-btn')) {
      setEditing(arac.id);
      return;
    }

    if (hedef.closest('.sil-btn')) {
      // Onay diyaloğu yok; güvence 5 saniyelik geri alma toast'ı (US-06).
      await removeTool(arac.id);
      return;
    }

    // Butonların ve "Siteye Git" bağlantısının dışında kalan her yer:
    // kart gövdesi -> detay çekmecesi.
    if (hedef.closest('a')) return;
    openDrawer(arac.id);
  });

  // Klavye: kart odaktayken Enter/Space çekmeceyi açar (tıklamanın karşılığı).
  ana.addEventListener('keydown', (olay) => {
    if (olay.key !== 'Enter' && olay.key !== ' ') return;
    const kart = olay.target.closest('.kart');
    // Kartın içindeki butonlar kendi Enter/Space davranışını korusun.
    if (!kart || olay.target !== kart) return;
    olay.preventDefault();
    openDrawer(kart.dataset.id);
  });

  return {
    update(durum) {
      ana.innerHTML = '';

      // Dört ayrı boş durum. Hepsi tek bir "Araç bulunamadı."ya indirgenirse
      // kullanıcı yükleniyor mu, sunucu mu kapalı, yoksa filtresi mi tutmadı
      // ayırt edemez.

      // 1) Veri yolda.
      if (durum.loading) {
        ana.innerHTML = '<p class="bos-sonuc">Yükleniyor…</p>';
        return;
      }

      // 2) Yükleme başarısız: sebebi ve bir çıkış yolu göster.
      if (durum.error && durum.tools.length === 0) {
        ana.innerHTML = `
          <div class="bos-sonuc">
            <p>${escapeHtml(durum.error)}</p>
            <button class="tekrar-btn" type="button">↻ Tekrar dene</button>
          </div>
        `;
        return;
      }

      const aktifler = activeTools();

      // 3) Bağlantı var ama ortada hiç araç yok (yeni/boş db.json).
      if (aktifler.length === 0) {
        ana.innerHTML = '<p class="bos-sonuc">Henüz araç eklenmemiş.</p>';
        return;
      }

      // 4) Araç var ama filtre hiçbirini geçirmedi (US-01).
      const gosterilecek = filterTools(aktifler, durum.filters);
      if (gosterilecek.length === 0) {
        ana.innerHTML = '<p class="bos-sonuc">Araç bulunamadı.</p>';
        return;
      }

      gosterilecek.forEach((arac) => {
        ana.appendChild(kartOlustur(arac, durum.saving));
      });
    },
  };
}
