// importer.js: JSON içe aktarma dosyasını çözümleme ve doğrulama (saf).
//
// Doğrulama kuralları YENİDEN YAZILMAZ: ekleme formuyla aynı validateForm
// kullanılır. Buraya yalnızca dosyaya özgü iki şey eklenir — kök biçimin
// çözümlenmesi ve aynı dosyada tekrar eden adların yakalanması.
//
// Sözleşmenin tamamı: IMPORT_REPORT.md

import { CSV_COLUMNS } from './csv.js';
import { SUBSCRIPTIONS, STATUSES, DEFAULT_STATUS } from '../constants.js';
import { validateForm } from './validators.js';

// parseImportFile: dosya metnini kayıt dizisine çevirir.
// Kabul edilen iki kök biçim: düz dizi ([...]) ve { "tools": [...] }.
// İkincisi hem dışa aktarılan dosyanın hem de db.json'ın biçimidir.
export function parseImportFile(metin) {
  let veri;
  try {
    veri = JSON.parse(metin);
  } catch {
    return { ok: false, message: 'Dosya geçerli bir JSON değil.' };
  }

  const satirlar = Array.isArray(veri) ? veri : veri && Array.isArray(veri.tools) ? veri.tools : null;

  if (!satirlar) {
    return {
      ok: false,
      message: 'JSON bir kayıt dizisi ya da { "tools": [...] } biçiminde olmalı.',
    };
  }

  if (satirlar.length === 0) {
    return { ok: false, message: 'Dosyada hiç kayıt yok.' };
  }

  return { ok: true, rows: satirlar };
}

// normalize: bir satırı yalnızca bilinen alanlara indirger.
// Tanınmayan alanlar (id, deleted, uydurma alanlar) atılır; seçenek listesinde
// olmayan subscription/status varsayılana düşer — bu tek başına kaydı
// geçersiz kılmaz, yalnızca sessizce düzeltilir.
function normalize(satir) {
  const temiz = {};
  CSV_COLUMNS.forEach((alan) => {
    const deger = satir?.[alan];
    temiz[alan] = typeof deger === 'string' ? deger.trim() : deger == null ? '' : String(deger);
  });

  if (!SUBSCRIPTIONS.includes(temiz.subscription)) temiz.subscription = SUBSCRIPTIONS[0];
  if (!STATUSES.includes(temiz.status)) temiz.status = DEFAULT_STATUS;

  return temiz;
}

// validateImportRows: satırları geçerli / geçersiz olarak ayırır.
//
// mevcutAraclar: aktif araç listesi (benzersizlik kontrolü için).
// Dönüş: { valid: [kayıt], invalid: [{ index, row, name, errors }] }
export function validateImportRows(satirlar, mevcutAraclar = []) {
  const valid = [];
  const invalid = [];

  // Benzersizlik iki kaynağa karşı denetlenir: mevcut liste ve DOSYANIN
  // kendisi. İkincisi olmadan aynı dosyada iki kez geçen ad POST edilir ve
  // benzersizlik sessizce bozulurdu.
  const gorulenAdlar = mevcutAraclar.map((arac) => ({ name: arac.name, id: arac.id }));

  satirlar.forEach((hamSatir, index) => {
    // Nesne olmayan girdi (metin, sayı, null) doğrulamaya bile girmemeli.
    if (!hamSatir || typeof hamSatir !== 'object' || Array.isArray(hamSatir)) {
      invalid.push({
        index,
        row: hamSatir,
        name: '',
        errors: ['Kayıt bir nesne değil.'],
      });
      return;
    }

    const satir = normalize(hamSatir);
    const hatalar = validateForm(satir, gorulenAdlar, null);
    const mesajlar = Object.values(hatalar);

    if (mesajlar.length > 0) {
      invalid.push({ index, row: satir, name: satir.name, errors: mesajlar });
      return;
    }

    valid.push(satir);
    // Sonraki satırlar bu adı da çakışma olarak görsün.
    gorulenAdlar.push({ name: satir.name, id: null });
  });

  return { valid, invalid };
}
