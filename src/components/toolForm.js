// toolForm.js: Araç ekleme formu + kart içi düzenleme formu.
//
// İkisi de aynı doğrulama kurallarını (utils/validators.js) kullanır.
// Düzenleme formu ayrı bir panel değil, kartın kendi içinde açılır (v2 ile aynı).

import { SUBSCRIPTIONS, STATUSES, DEFAULT_STATUS } from '../constants.js';
import { escapeHtml, optionsHtml } from '../utils/formatters.js';
import { validateForm, isValid } from '../utils/validators.js';
import { activeTools, addTool } from '../state/store.js';

// Doğrulama hatası gösterilen alanlar (ekleme formunda alan altı mesajları).
const HATA_ALANLARI = ['name', 'category', 'purpose', 'url'];

// --- EKLEME FORMU ---

// mountAddForm: "➕ Yeni Araç Ekle" butonu ve açılır formu kaba ekler.
// Dönüş: { update } — formun dinamik parçası olmadığı için update boştur.
export function mountAddForm(kap) {
  const bolum = document.createElement('section');
  bolum.className = 'ekle-alani';
  bolum.innerHTML = `
    <button id="ekle-ac-btn" class="ekle-ac-btn" type="button">➕ Yeni Araç Ekle</button>
    <form id="ekle-form" class="ekle-form gizli">
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
      <select id="ekle-durum" class="ekle-alan">${optionsHtml(STATUSES, DEFAULT_STATUS)}</select>
      <div class="ekle-aksiyonlar">
        <button type="submit" class="ekle-btn">Ekle</button>
        <button type="button" id="ekle-iptal-btn" class="ekle-iptal-btn">İptal</button>
      </div>
    </form>
  `;
  kap.appendChild(bolum);

  const acBtn = bolum.querySelector('#ekle-ac-btn');
  const form = bolum.querySelector('#ekle-form');
  const iptalBtn = bolum.querySelector('#ekle-iptal-btn');

  // hatalariGoster: mesajları ilgili alanların altına yazar; boş nesne temizler.
  function hatalariGoster(hatalar) {
    HATA_ALANLARI.forEach((alan) => {
      bolum.querySelector(`#hata-${alan}`).textContent = hatalar[alan] || '';
    });
  }

  // Aç/kapa: butona basınca form görünür/gizlenir.
  acBtn.addEventListener('click', () => {
    form.classList.toggle('gizli');
  });

  // İptal: formu temizle, hata mesajlarını sil ve gizle.
  iptalBtn.addEventListener('click', () => {
    form.reset();
    hatalariGoster({});
    form.classList.add('gizli');
  });

  // Gönderim: doğrula, geçerliyse store üzerinden kaydet.
  form.addEventListener('submit', async (olay) => {
    olay.preventDefault(); // sayfa yenilenmesin

    const veri = {
      name: form.querySelector('#ekle-name').value.trim(),
      category: form.querySelector('#ekle-category').value.trim(),
      purpose: form.querySelector('#ekle-purpose').value.trim(),
      owner: form.querySelector('#ekle-owner').value.trim(),
      note: form.querySelector('#ekle-note').value.trim(),
      url: form.querySelector('#ekle-url').value.trim(),
      subscription: form.querySelector('#ekle-subscription').value,
      status: form.querySelector('#ekle-durum').value,
    };

    // Eklemede currentId yoktur; benzersizlik aktif araçlara karşı kontrol edilir.
    const hatalar = validateForm(veri, activeTools(), null);
    hatalariGoster(hatalar);
    if (!isValid(hatalar)) return;

    const eklendi = await addTool(veri);
    if (!eklendi) return; // API hatası: durum şeridinde gösterilir, form açık kalır

    form.reset();
    hatalariGoster({});
    form.classList.add('gizli');
  });

  return { update() {} };
}

// --- KART İÇİ DÜZENLEME FORMU ---

// editFormHtml: bir aracı düzenlemek için kart içi form HTML'i üretir.
// Alanlar data-alan ile etiketlenir; readEditForm bunları geri okur.
export function editFormHtml(arac) {
  return `
    <div class="duzenle-form">
      <label>İsim
        <input class="duzenle-alan" data-alan="name" value="${escapeHtml(arac.name)}" />
      </label>
      <label>Kategori
        <input class="duzenle-alan" data-alan="category" value="${escapeHtml(arac.category)}" />
      </label>
      <label>Açıklama
        <input class="duzenle-alan" data-alan="purpose" value="${escapeHtml(arac.purpose)}" />
      </label>
      <label>Geliştiren
        <input class="duzenle-alan" data-alan="owner" value="${escapeHtml(arac.owner)}" />
      </label>
      <label>Not
        <input class="duzenle-alan" data-alan="note" value="${escapeHtml(arac.note)}" />
      </label>
      <label>Site adresi (URL)
        <input class="duzenle-alan" data-alan="url" value="${escapeHtml(arac.url)}" />
      </label>
      <label>Abonelik
        <select class="duzenle-alan" data-alan="subscription">
          ${optionsHtml(SUBSCRIPTIONS, arac.subscription)}
        </select>
      </label>
      <label>Durum
        <select class="duzenle-alan" data-alan="status">
          ${optionsHtml(STATUSES, arac.status || DEFAULT_STATUS)}
        </select>
      </label>
      <p class="duzenle-hata"></p>
      <div class="duzenle-aksiyonlar">
        <button type="button" class="kaydet-btn">💾 Kaydet</button>
        <button type="button" class="iptal-btn">İptal</button>
      </div>
    </div>
  `;
}

// readEditForm: karttaki tüm .duzenle-alan girdilerini { alan: değer } olarak okur.
export function readEditForm(kartEl) {
  const alanlar = {};
  kartEl.querySelectorAll('.duzenle-alan').forEach((girdi) => {
    alanlar[girdi.dataset.alan] = girdi.value.trim();
  });
  return alanlar;
}

// showEditError: düzenleme formundaki tek satırlık hata alanını doldurur.
export function showEditError(kartEl, mesaj) {
  const hataEl = kartEl.querySelector('.duzenle-hata');
  if (hataEl) hataEl.textContent = mesaj || '';
}
