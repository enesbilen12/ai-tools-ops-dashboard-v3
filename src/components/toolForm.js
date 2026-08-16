// toolForm.js: Araç formu. TEK form, iki mod:
//
//   ekleme   (durum.editingId === null) -> "➕ Yeni Araç Ekle" / "Ekle"   -> POST
//   düzenleme (durum.editingId dolu)    -> "✏️ Düzenle: <ad>" / "💾 Kaydet" -> PATCH
//
// v3 Gün 3'e kadar ekleme formu burada, düzenleme formu ise kartın içinde ayrı
// bir HTML üreticisiydi; aynı 8 alan iki yerde tekrar ediyordu. Artık tek yer.

import { SUBSCRIPTIONS, STATUSES, DEFAULT_STATUS } from '../constants.js';
import { optionsHtml } from '../utils/formatters.js';
import { validateForm, isValid } from '../utils/validators.js';
import { activeTools, addTool, editTool, setEditing, findTool } from '../state/store.js';

// Doğrulama hatası gösterilen alanlar (alan altı satır içi mesajlar).
const HATA_ALANLARI = ['name', 'category', 'purpose', 'url'];

// Formun okuyup yazdığı tüm alanlar.
const ALANLAR = [
  'name',
  'category',
  'purpose',
  'owner',
  'note',
  'url',
  'subscription',
  'status',
];

// mountToolForm: form bölümünü kaba ekler.
// Dönüş: { update } — mod değişimini ve istek sırasındaki kilidi işler.
export function mountToolForm(kap) {
  const bolum = document.createElement('section');
  bolum.className = 'ekle-alani';
  bolum.innerHTML = `
    <button id="ekle-ac-btn" class="ekle-ac-btn" type="button">➕ Yeni Araç Ekle</button>
    <form id="ekle-form" class="ekle-form gizli">
      <h2 id="form-baslik" class="form-baslik">Yeni Araç</h2>
      <input id="ekle-name" class="ekle-alan" placeholder="Ad (zorunlu)" />
      <p id="hata-name" class="hata-mesaji"></p>
      <input id="ekle-category" class="ekle-alan" placeholder="Kategori (zorunlu)" />
      <p id="hata-category" class="hata-mesaji"></p>
      <input id="ekle-purpose" class="ekle-alan" placeholder="Kullanım amacı (zorunlu)" />
      <p id="hata-purpose" class="hata-mesaji"></p>
      <input id="ekle-owner" class="ekle-alan" placeholder="Geliştiren" />
      <input id="ekle-note" class="ekle-alan" placeholder="Not" />
      <input id="ekle-url" class="ekle-alan" placeholder="Site adresi (URL) — http:// veya https:// ile" />
      <p id="hata-url" class="hata-mesaji"></p>
      <select id="ekle-subscription" class="ekle-alan">${optionsHtml(SUBSCRIPTIONS)}</select>
      <select id="ekle-status" class="ekle-alan">${optionsHtml(STATUSES, DEFAULT_STATUS)}</select>
      <div class="ekle-aksiyonlar">
        <button type="submit" id="ekle-btn" class="ekle-btn">Ekle</button>
        <button type="button" id="ekle-iptal-btn" class="ekle-iptal-btn">İptal</button>
      </div>
    </form>
  `;
  kap.appendChild(bolum);

  const acBtn = bolum.querySelector('#ekle-ac-btn');
  const form = bolum.querySelector('#ekle-form');
  const baslik = bolum.querySelector('#form-baslik');
  const gonderBtn = bolum.querySelector('#ekle-btn');
  const iptalBtn = bolum.querySelector('#ekle-iptal-btn');

  const alanEl = (ad) => bolum.querySelector(`#ekle-${ad}`);

  // hatalariGoster: mesajları ilgili alanların altına yazar; boş nesne temizler.
  function hatalariGoster(hatalar) {
    HATA_ALANLARI.forEach((alan) => {
      bolum.querySelector(`#hata-${alan}`).textContent = hatalar[alan] || '';
    });
  }

  // formuDoldur: bir aracın alanlarını forma yazar (düzenleme moduna geçiş).
  function formuDoldur(arac) {
    ALANLAR.forEach((ad) => {
      alanEl(ad).value = arac[ad] ?? '';
    });
    // status boş kayıtlarda select geçersiz değere düşmesin.
    if (!arac.status) alanEl('status').value = DEFAULT_STATUS;
  }

  function formuTemizle() {
    form.reset();
    hatalariGoster({});
  }

  // Aç/kapa: yalnızca ekleme modunda anlamlı (US-04).
  acBtn.addEventListener('click', () => {
    form.classList.toggle('gizli');
  });

  // İptal: düzenleme modundan çık, formu temizle ve gizle.
  iptalBtn.addEventListener('click', () => {
    formuTemizle();
    form.classList.add('gizli');
    setEditing(null); // ekleme moduna döner; update() gerisini toparlar
  });

  // Gönderim: doğrula, geçerliyse moda göre POST veya PATCH.
  form.addEventListener('submit', async (olay) => {
    olay.preventDefault(); // sayfa yenilenmesin

    // Düzenlenen id form gönderilirken okunur; arada değişmiş olabilir.
    const duzenlenenId = form.dataset.editingId || null;

    const veri = {};
    ALANLAR.forEach((ad) => {
      veri[ad] = alanEl(ad).value.trim();
    });

    // Benzersizlik kontrolünde düzenlenen aracın kendi kaydı hariç tutulur.
    const hatalar = validateForm(veri, activeTools(), duzenlenenId);
    hatalariGoster(hatalar);
    if (!isValid(hatalar)) return;

    const basarili = duzenlenenId
      ? await editTool(duzenlenenId, veri)
      : await addTool(veri);

    // Başarısızsa form açık ve dolu kalır; hata şeritte görünür.
    if (!basarili) return;

    formuTemizle();
    form.classList.add('gizli');
  });

  // Mod yalnızca DEĞİŞTİĞİNDE forma yansıtılır. Her bildirimde `value` yazmak
  // kullanıcı yazarken girdiyi ezerdi (filters.js'teki sonKategoriHtml deseni).
  let sonEditingId = null;

  return {
    update(durum) {
      const editingId = durum.editingId;

      if (String(editingId) !== String(sonEditingId)) {
        sonEditingId = editingId;
        form.dataset.editingId = editingId ?? '';

        if (editingId === null) {
          baslik.textContent = 'Yeni Araç';
          gonderBtn.textContent = 'Ekle';
          acBtn.hidden = false;
          formuTemizle();
          form.classList.add('gizli');
        } else {
          const arac = findTool(editingId);
          if (arac) {
            baslik.textContent = `✏️ Düzenle: ${arac.name}`;
            gonderBtn.textContent = '💾 Kaydet';
            // Ekleme butonu düzenleme sırasında saklanır; aynı formu ikinci bir
            // amaçla açıp kapatmak kafa karıştırırdı.
            acBtn.hidden = true;
            hatalariGoster({});
            formuDoldur(arac);
            form.classList.remove('gizli');
            // Form sayfanın üstünde; karttan/çekmeceden gelen kullanıcı görsün.
            form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            alanEl('name').focus();
          }
        }
      }

      // İstek uçarken kilit. Her bildirimde uygulanır; odak/girdi etkilenmez.
      gonderBtn.disabled = durum.saving;
      iptalBtn.disabled = durum.saving;
      gonderBtn.textContent = durum.saving
        ? 'Kaydediliyor…'
        : durum.editingId
          ? '💾 Kaydet'
          : 'Ekle';
    },
  };
}
