// pagination.js: Listeyi sayfalara bölme (saf fonksiyonlar).
//
// Sayfa numarası iki güvenilmez kaynaktan gelebilir: adres çubuğu (kullanıcı
// elle düzenleyebilir) ve liste küçüldüğünde eskiyen durum (son sayfadaki tek
// kart silinince o sayfa artık yoktur). Bu yüzden her hesap clampPage'den geçer.

// Bir sayfada gösterilecek kart sayısı. Izgara masaüstünde 3 sütun olduğu için
// 12 kayıt tam dört satır eder.
export const DEFAULT_PAGE_SIZE = 12;

// pageCount: toplam kaç sayfa var? Liste boş olsa bile en az 1 sayfa vardır
// (kullanıcı "Sayfa 1 / 0" görmesin).
export function pageCount(total, pageSize = DEFAULT_PAGE_SIZE) {
  const boyut = Number(pageSize) > 0 ? Number(pageSize) : DEFAULT_PAGE_SIZE;
  return Math.max(1, Math.ceil(Math.max(0, total) / boyut));
}

// clampPage: sayfa numarasını 1 ile son sayfa arasına sıkıştırır.
// Sayı olmayan / negatif / NaN değerler 1'e düşer.
export function clampPage(page, total, pageSize = DEFAULT_PAGE_SIZE) {
  const sonSayfa = pageCount(total, pageSize);
  const no = Math.floor(Number(page));
  if (!Number.isFinite(no) || no < 1) return 1;
  return Math.min(no, sonSayfa);
}

// paginateTools: verilen sayfanın kayıtlarını döndürür.
// Sayfa numarasını kendisi sınırlar; çağıran taraf eskimiş bir sayfa verse bile
// boş ızgara yerine mevcut son sayfa gösterilir.
export function paginateTools(tools, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const boyut = Number(pageSize) > 0 ? Number(pageSize) : DEFAULT_PAGE_SIZE;
  const gecerliSayfa = clampPage(page, tools.length, boyut);
  const baslangic = (gecerliSayfa - 1) * boyut;
  return tools.slice(baslangic, baslangic + boyut);
}
