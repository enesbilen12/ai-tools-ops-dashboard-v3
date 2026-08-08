// importPanel.js: JSON içe aktarma akışı.
//
//   dosya seç -> çözümle + doğrula -> önizleme -> onay -> sırayla ekle -> sonuç
//
// Doğrulama kuralları burada yazılmaz; utils/importer.js ekleme formuyla aynı
// validateForm'u kullanır. Sözleşmenin tamamı: IMPORT_REPORT.md

import { escapeHtml } from '../utils/formatters.js';
import { parseImportFile, validateImportRows } from '../utils/importer.js';
import { activeTools, importTools } from '../state/store.js';

export function mountImportPanel(kap) {
  const perde = document.createElement('div');
  perde.className = 'drawer-perde';
  perde.hidden = true;

  const panel = document.createElement('div');
  panel.className = 'import-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'import-baslik');
  panel.hidden = true;

  // Dosya seçici görünmez; kullanıcı düğmeye basar.
  const dosyaGirdisi = document.createElement('input');
  dosyaGirdisi.type = 'file';
  dosyaGirdisi.accept = 'application/json,.json';
  dosyaGirdisi.hidden = true;

  kap.appendChild(perde);
  kap.appendChild(panel);
  kap.appendChild(dosyaGirdisi);

  // Önizlemede bekleyen geçerli kayıtlar (onaya kadar tutulur).
  let bekleyen = [];

  function kapat() {
    panel.hidden = true;
    perde.hidden = true;
    panel.innerHTML = '';
    bekleyen = [];
    dosyaGirdisi.value = ''; // aynı dosya tekrar seçilebilsin
  }

  function ac(icerik) {
    panel.innerHTML = `
      <div class="import-ust">
        <h2 id="import-baslik">İçe Aktar</h2>
        <button class="import-kapat" type="button" aria-label="Kapat">×</button>
      </div>
      ${icerik}
    `;
    panel.hidden = false;
    perde.hidden = false;
    panel.querySelector('.import-kapat').focus();
  }

  // hataGoster: dosya hiç okunamadıysa (bozuk JSON, boş dosya, dizi değil).
  function hataGoster(mesaj) {
    ac(`
      <p class="import-hata">${escapeHtml(mesaj)}</p>
      <p class="import-ipucu">
        Dosya bir kayıt dizisi ya da <code>{ "tools": [ … ] }</code> biçiminde olmalı.
        Panelden indirdiğiniz JSON doğrudan kullanılabilir.
      </p>
      <div class="import-aksiyonlar">
        <button class="import-iptal" type="button">Kapat</button>
      </div>
    `);
  }

  // onizlemeGoster: geçerli / geçersiz ayrımı ve onay düğmesi.
  function onizlemeGoster(valid, invalid) {
    bekleyen = valid;

    const gecerliListe = valid.length
      ? `<ul class="import-liste">${valid
          .map((k) => `<li>${escapeHtml(k.name)} <span class="import-soluk">${escapeHtml(k.category)}</span></li>`)
          .join('')}</ul>`
      : '<p class="import-soluk">Eklenecek geçerli kayıt yok.</p>';

    const gecersizListe = invalid.length
      ? `<ul class="import-liste import-gecersiz">${invalid
          .map(
            (k) =>
              `<li><strong>#${k.index + 1}</strong> ${escapeHtml(k.name || '(adsız)')} — ${escapeHtml(k.errors.join(' · '))}</li>`
          )
          .join('')}</ul>`
      : '';

    ac(`
      <div class="import-bolum">
        <h3>✓ Geçerli (${valid.length})</h3>
        ${gecerliListe}
      </div>
      ${
        invalid.length
          ? `<div class="import-bolum">
               <h3>✗ Geçersiz (${invalid.length})</h3>
               ${gecersizListe}
             </div>`
          : ''
      }
      <div class="import-aksiyonlar">
        <button class="import-onayla" type="button"${valid.length ? '' : ' disabled'}>
          ${valid.length} kaydı ekle
        </button>
        <button class="import-iptal" type="button">İptal</button>
      </div>
    `);
  }

  // sonucGoster: ekleme bittikten sonraki özet.
  function sonucGoster({ added, failed }) {
    const basarisizListe = failed.length
      ? `<div class="import-bolum">
           <h3>Eklenemeyen (${failed.length})</h3>
           <ul class="import-liste import-gecersiz">${failed
             .map((h) => `<li>${escapeHtml(h.name)} — ${escapeHtml(h.message)}</li>`)
             .join('')}</ul>
         </div>`
      : '';

    ac(`
      <p class="import-sonuc"><strong>${added}</strong> kayıt eklendi.</p>
      ${basarisizListe}
      <div class="import-aksiyonlar">
        <button class="import-iptal" type="button">Kapat</button>
      </div>
    `);
  }

  // Dosya seçildiğinde: oku, çözümle, doğrula, önizle.
  dosyaGirdisi.addEventListener('change', async () => {
    const dosya = dosyaGirdisi.files?.[0];
    if (!dosya) return;

    let metin;
    try {
      metin = await dosya.text();
    } catch {
      hataGoster('Dosya okunamadı.');
      return;
    }

    const cozumlenen = parseImportFile(metin);
    if (!cozumlenen.ok) {
      hataGoster(cozumlenen.message);
      return;
    }

    // Benzersizlik mevcut AKTİF araçlara karşı denetlenir; çöpteki bir adla
    // çakışma engel değildir (o kayıt zaten listede görünmüyor).
    const { valid, invalid } = validateImportRows(cozumlenen.rows, activeTools());
    onizlemeGoster(valid, invalid);
  });

  panel.addEventListener('click', async (olay) => {
    if (olay.target.closest('.import-kapat') || olay.target.closest('.import-iptal')) {
      kapat();
      return;
    }

    if (olay.target.closest('.import-onayla')) {
      const kayitlar = bekleyen;
      if (kayitlar.length === 0) return;
      const sonuc = await importTools(kayitlar);
      sonucGoster(sonuc);
    }
  });

  perde.addEventListener('click', () => {
    // Ekleme sürerken kapatma, akışı yarıda kesmiş gibi görünür; engellenir.
    if (panel.querySelector('.import-onayla')?.disabled) return;
    kapat();
  });

  document.addEventListener('keydown', (olay) => {
    if (olay.key === 'Escape' && !panel.hidden) kapat();
  });

  return {
    // Dışa açılan tek davranış: dosya seçiciyi aç (dashboard'daki düğme çağırır).
    open() {
      dosyaGirdisi.click();
    },
    update(durum) {
      const onayBtn = panel.querySelector('.import-onayla');
      if (!onayBtn) return;

      const ilerleme = durum.importProgress;
      if (ilerleme) {
        onayBtn.disabled = true;
        onayBtn.textContent = `${ilerleme.done} / ${ilerleme.total} eklendi…`;
      } else {
        onayBtn.disabled = durum.saving || bekleyen.length === 0;
      }
    },
  };
}
