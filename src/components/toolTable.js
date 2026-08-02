// toolTable.js: Filtrelenmiş araç listesini kart ızgarası olarak çizer ve
// kart üzerindeki aksiyonları (favori, düzenle, sil, kaydet, iptal) yürütür.
//
// Tıklamalar tek bir dinleyiciyle (olay delegasyonu) yakalanır; kartlar her
// çizimde yeniden oluşturulduğu için tek tek dinleyici bağlamak doğru olmaz.

import { DEFAULT_STATUS } from '../constants.js';
import { escapeHtml } from '../utils/formatters.js';
import { filterTools } from '../utils/filters.js';
import { validateForm, isValid } from '../utils/validators.js';
import {
  getState,
  activeTools,
  isFavorite,
  toggleFavorite,
  setEditing,
  editTool,
  removeTool,
} from '../state/store.js';
import { editFormHtml, readEditForm, showEditError } from './toolForm.js';

// kartHtml: bir araç kartının okuma görünümü.
function kartHtml(arac) {
  const favori = isFavorite(arac.name);
  const yildiz = favori ? '★' : '☆';
  const aktifSinif = favori ? ' aktif' : '';

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
            title="Favori" aria-label="Favorilere ekle veya çıkar">${yildiz}</button>
    <h2>${escapeHtml(arac.name)}</h2>
    ${abonelikRozeti}
    ${durumRozeti}
    <p><strong>Kategori:</strong> ${escapeHtml(arac.category)}</p>
    <p>${escapeHtml(arac.purpose)}</p>
    <p><strong>Geliştiren:</strong> ${escapeHtml(arac.owner)}</p>
    <p><em>${escapeHtml(arac.note)}</em></p>
    <div class="kart-aksiyonlar">
      ${siteBaglantisi}
      <button class="duzenle-btn" type="button">✏️ Düzenle</button>
      <button class="sil-btn" type="button">🗑 Sil</button>
    </div>
  `;
}

// kartOlustur: araç için <section class="kart"> üretir.
// Kimlik kartın kendisinde durur (data-id / data-isim); butonlar tekrar etmez.
function kartOlustur(arac, duzenlenenAd) {
  const kart = document.createElement('section');
  kart.className = 'kart';
  kart.dataset.id = String(arac.id);
  kart.dataset.isim = arac.name;
  // Bu araç düzenleniyorsa bilgiler yerine düzenleme formunu göster.
  kart.innerHTML = arac.name === duzenlenenAd ? editFormHtml(arac) : kartHtml(arac);
  return kart;
}

// aracBul: karttaki id ile ilgili aracı bulur.
// id karşılaştırması metin üzerinden yapılır: db.json'daki sayısal id'ler ile
// json-server'ın yeni kayıtlara ürettiği id'ler farklı tipte olabilir.
function aracBul(kart) {
  return getState().tools.find((a) => String(a.id) === kart.dataset.id);
}

// mountToolTable: <main> ızgarasını kaba ekler ve tıklamaları bağlar.
export function mountToolTable(kap) {
  const ana = document.createElement('main');
  kap.appendChild(ana);

  ana.addEventListener('click', async (olay) => {
    const hedef = olay.target;
    const kart = hedef.closest('.kart');
    if (!kart) return;
    const arac = aracBul(kart);
    if (!arac) return;

    if (hedef.closest('.favori-btn')) {
      toggleFavorite(arac.name);
      return;
    }

    if (hedef.closest('.duzenle-btn')) {
      setEditing(arac.name);
      return;
    }

    if (hedef.closest('.sil-btn')) {
      // Onay diyaloğu bileşen katmanında durur ki store test edilebilir kalsın.
      if (!confirm(`"${arac.name}" aracını silmek istediğine emin misin?`)) return;
      await removeTool(arac.id);
      return;
    }

    if (hedef.closest('.kaydet-btn')) {
      const alanlar = readEditForm(kart);
      // Ekleme ile aynı kurallar; benzersizlikte aracın kendi kaydı hariç tutulur.
      const hatalar = validateForm(alanlar, activeTools(), arac.id);
      if (!isValid(hatalar)) {
        // Form modunda kal ki kullanıcının girdileri kaybolmasın.
        showEditError(kart, Object.values(hatalar).join(' · '));
        return;
      }
      await editTool(arac.id, alanlar);
      return;
    }

    if (hedef.closest('.iptal-btn')) {
      setEditing(null); // değişiklikleri kaydetmeden çık
    }
  });

  return {
    update(durum) {
      const gosterilecek = filterTools(activeTools(), durum.filters);
      ana.innerHTML = '';

      // Hiç sonuç yoksa bilgi mesajı göster (US-01).
      if (gosterilecek.length === 0) {
        ana.innerHTML = '<p class="bos-sonuc">Araç bulunamadı.</p>';
        return;
      }

      gosterilecek.forEach((arac) => {
        ana.appendChild(kartOlustur(arac, durum.editingName));
      });
    },
  };
}
