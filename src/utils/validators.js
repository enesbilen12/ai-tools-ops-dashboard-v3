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

// zorunlu: alan dolu mu? Kırpma burada yapılır — çağıranın trim etmesine
// güvenilmez, aksi hâlde yalnızca boşluktan oluşan bir ad geçerli sayılırdı.
function zorunlu(deger) {
  return String(deger ?? '').trim();
}

export function validateForm(data = {}, existingTools = [], currentId = null) {
  const errors = {};

  const name = zorunlu(data.name);
  const category = zorunlu(data.category);
  const purpose = zorunlu(data.purpose);
  const url = zorunlu(data.url);

  // Ad: zorunlu ve aynı adlı BAŞKA aktif araç olamaz.
  // Listedeki kaydın adı eksik olabilir (db.json elle düzenlenmişse); String()
  // olmadan bu çağrı TypeError ile çöküyor ve formu tamamen kilitliyordu.
  if (!name) {
    errors.name = 'Ad alanı zorunludur.';
  } else if (
    existingTools.some(
      (t) =>
        String(t?.name ?? '').toLowerCase() === name.toLowerCase() &&
        (currentId == null || String(t?.id) !== String(currentId))
    )
  ) {
    errors.name = `"${name}" adlı bir araç zaten var.`;
  }

  // Kategori ve amaç: boş geçilemez.
  if (!category) errors.category = 'Kategori alanı zorunludur.';
  if (!purpose) errors.purpose = 'Kullanım amacı zorunludur.';

  // URL: zorunlu ve http:// veya https:// ile başlamalı.
  if (!url) {
    errors.url = 'URL alanı zorunludur.';
  } else if (!/^https?:\/\//i.test(url)) {
    errors.url = 'URL http:// veya https:// ile başlamalı.';
  }

  return errors;
}

// isValid: hata nesnesi boş mu? (küçük kolaylık)
export function isValid(errors) {
  return Object.keys(errors).length === 0;
}
