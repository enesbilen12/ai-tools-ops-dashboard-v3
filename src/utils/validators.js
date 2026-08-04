// validators.js: Form doğrulama (saf fonksiyon). v2'deki validateForm'un taşınmış hâli.
//
// data: { name, category, purpose, url, ... } girdileri.
// existingTools: benzersizlik kontrolü için mevcut (aktif) araç listesi.
// currentId: düzenlemede aracın KENDİ id'si; benzersizlik kontrolünden hariç tutulur.
//            Eklemede null bırakılır. Karşılaştırma metin üzerinden yapılır:
//            db.json'daki id'ler sayı, json-server'ın döndürdükleri ve DOM'dan
//            (data-id) gelenler metindir; katı karşılaştırma aracı kendi adına
//            çarptırırdı.
//
// Dönüş: hataların { alan: mesaj } nesnesi. Boş nesne => geçerli.
export function validateForm(data, existingTools = [], currentId = null) {
  const errors = {};

  // Ad: zorunlu ve aynı adlı BAŞKA aktif araç olamaz (harf duyarsız).
  if (!data.name) {
    errors.name = 'Ad alanı zorunludur.';
  } else if (
    existingTools.some(
      (t) =>
        t.name.toLowerCase() === data.name.toLowerCase() &&
        (currentId == null || String(t.id) !== String(currentId))
    )
  ) {
    errors.name = `"${data.name}" adlı bir araç zaten var.`;
  }

  // Kategori ve amaç: boş geçilemez.
  if (!data.category) errors.category = 'Kategori alanı zorunludur.';
  if (!data.purpose) errors.purpose = 'Kullanım amacı zorunludur.';

  // URL: zorunlu ve http:// veya https:// ile başlamalı.
  if (!data.url) {
    errors.url = 'URL alanı zorunludur.';
  } else if (!/^https?:\/\//i.test(data.url)) {
    errors.url = 'URL http:// veya https:// ile başlamalı.';
  }

  return errors;
}

// isValid: hata nesnesi boş mu? (küçük kolaylık)
export function isValid(errors) {
  return Object.keys(errors).length === 0;
}
