// text.js: Türkçeye uygun metin karşılaştırması (saf fonksiyonlar).
//
// NEDEN AYRI BİR MODÜL: JavaScript'in `toLowerCase()`'i Türkçe için yanlıştır.
//
//   "İzleme".toLowerCase()  ->  "i̇zleme"  (i + birleşen nokta)  !==  "izleme"
//   "IŞIK".toLowerCase()    ->  "işik"                          !==  "ışık"
//
// Bu yüzden aynı araç iki kez eklenebiliyor ve "izleme" araması "İzleme" adlı
// aracı bulamıyordu. Kural artık tek yerde: benzersizlik kontrolü (validators),
// arama (filters) ve geri yükleme çakışması (store) buradan geçer.

// karsilastirmaAnahtari: iki metnin "aynı" sayılıp sayılmayacağını belirleyen
// normalleştirilmiş biçim.
//
// İki adım vardır ve ikincisi şart:
//   1. toLocaleLowerCase('tr') — İ -> i, I -> ı (Türkçe kuralı).
//   2. ı -> i katlaması — 1. adım tek başına bırakılırsa "AI Paneli" -> "aı
//      paneli" olur ve kullanıcının yazdığı "ai" hiçbir şey bulamaz. Nokta
//      farkını tamamen kaldırmak hem bunu çözer hem de kullanıcının "ışık"
//      yerine "isik" yazmasını affeder. ş/s, ö/o gibi gerçek harf farkları
//      korunur — yalnızca i/ı/İ/I tek harfe iner.
export function karsilastirmaAnahtari(metin) {
  return String(metin ?? '')
    .trim()
    .toLocaleLowerCase('tr')
    .replaceAll('ı', 'i');
}

// esitMetin: iki metin (harf durumu ve i/ı farkı gözetilmeden) aynı mı?
// Benzersizlik kontrollerinde kullanılır.
export function esitMetin(a, b) {
  return karsilastirmaAnahtari(a) === karsilastirmaAnahtari(b);
}

// icerirMetin: `metin`, `aranan`ı içeriyor mu? Boş arama her zaman eşleşir.
export function icerirMetin(metin, aranan) {
  const anahtar = karsilastirmaAnahtari(aranan);
  if (!anahtar) return true;
  return karsilastirmaAnahtari(metin).includes(anahtar);
}
