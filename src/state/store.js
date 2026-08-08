// store.js: Uygulamanın tek doğruluk kaynağı.
//
// v2'de tools / silinenAraclar / duzenlenenArac birer global `let` idi ve ~15
// fonksiyon bunlara doğrudan yazıyordu. ES modülde dışarıdan içe aktarılan bir
// `let`'e atama yapılamaz; bu yüzden durum burada kapalı tutulur ve dışarıya
// yalnızca okuma yardımcıları + aksiyon fonksiyonları açılır.
//
// Bileşenler api'yi doğrudan çağırmaz; her zaman buradan geçer.

import { STORAGE_KEYS, DEFAULT_STATUS } from '../constants.js';
import { filterTools } from '../utils/filters.js';
import { sortTools, isSortOption, DEFAULT_SORT } from '../utils/sorting.js';
import { clampPage, DEFAULT_PAGE_SIZE } from '../utils/pagination.js';
import {
  fetchTools,
  createTool,
  updateTool as apiUpdateTool,
  softDeleteTool,
  restoreTool as apiRestoreTool,
} from '../api/toolsApi.js';

// --- DURUM ---

const durum = {
  // db.json'daki TÜM araçlar (silinenler de dahil). Ayrım `deleted` alanıyla yapılır.
  tools: [],
  filters: { search: '', category: 'all', status: 'all' },
  // Sıralama seçeneği (utils/sorting.js -> SORT_OPTIONS).
  sort: DEFAULT_SORT,
  // Görüntülenen sayfa (1'den başlar) ve sayfa başına kart sayısı.
  // Filtre veya sıralama değişince page 1'e döner: kullanıcı 3. sayfadayken
  // filtreleyince sonuç dışı bir sayfada kalmasın.
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  // Favoriler araç ADINA göre tutulur (v2 ile aynı). Bu yüzden yeniden
  // adlandırmada favori kaydının yeni ada taşınması gerekir (renameFavorite).
  favorites: [],
  theme: 'light',
  // Formun düzenlediği aracın id'si (yoksa null = ekleme modu). Ad değil id
  // tutulur: yeniden adlandırma sırasında referans kopmasın diye.
  editingId: null,
  // Detay çekmecesinde açık olan aracın id'si (kapalıysa null).
  drawerId: null,
  // İlk yükleme sürüyor mu? Boş liste ile "yükleniyor" ayırt edilebilsin diye.
  loading: false,
  // Bir yazma isteği (POST/PATCH) uçuyor mu? Butonlar buna bakarak kilitlenir;
  // çift tıklama ikinci bir istek üretmesin.
  saving: false,
  // Son silinen kayıt: { id, name, wasFavorite }. Toast bunu gösterir, geri
  // alma bunu kullanır. Süre dolunca yalnızca bu alan temizlenir — kayıt
  // db.json'da `deleted: true` olarak durmaya devam eder.
  undo: null,
  // İçe aktarma sürerken { done, total }; bitince null. Toplu uç nokta
  // olmadığı için kayıtlar tek tek eklenir ve ilerleme gösterilir.
  importProgress: null,
  // Kullanıcıya gösterilecek son hata metni (json-server kapalıysa vb.).
  error: '',
};

// --- ABONELİK ---

const aboneler = new Set();

// subscribe: durum her değiştiğinde çağrılacak fonksiyonu kaydeder.
// Abonelikten çıkmak için döndürdüğü fonksiyon çağrılır.
export function subscribe(dinleyici) {
  aboneler.add(dinleyici);
  return () => aboneler.delete(dinleyici);
}

function bildir() {
  aboneler.forEach((dinleyici) => dinleyici(durum));
}

// --- OKUMA YARDIMCILARI ---

export function getState() {
  return durum;
}

// Aktif araçlar: `deleted` işaretli olmayanlar. Panelde gösterilen liste budur.
export function activeTools() {
  return durum.tools.filter((arac) => arac.deleted !== true);
}

// Çöp kutusu: yumuşak silinmiş araçlar.
export function deletedTools() {
  return durum.tools.filter((arac) => arac.deleted === true);
}

// visibleTools: ekranda gösterilecek listenin sayfalanmamış hâli —
// aktif araçlar, filtreden geçmiş ve sıralanmış. Sayfalama bileşende yapılır
// ki toolTable ve pagination toplam sayıyı da bilsin.
export function visibleTools() {
  return sortTools(filterTools(activeTools(), durum.filters), durum.sort);
}

export function isFavorite(isim) {
  return durum.favorites.includes(isim);
}

// aracBul: id ile araç bulur. Karşılaştırma metin üzerinden yapılır; db.json'daki
// sayısal id'ler ile json-server'ın yeni kayıtlara ürettiği id'ler ve DOM'dan
// (data-id) gelen değerler farklı tipte olabilir.
function aracBul(id) {
  return durum.tools.find((arac) => String(arac.id) === String(id));
}

// findTool: aracBul'un dışa açık hâli. Bileşenler (form, çekmece, kart listesi)
// id ile araç ararken bu kuralı tekrar yazmasın diye.
export function findTool(id) {
  return aracBul(id);
}

// --- localStorage (tema + favoriler) ---
// Araçlar json-server'da; burada yalnızca kullanıcıya özel UI tercihleri tutulur.

function favorileriYukle() {
  try {
    const kayit = localStorage.getItem(STORAGE_KEYS.favorites);
    if (!kayit) return [];
    const liste = JSON.parse(kayit);
    return Array.isArray(liste) ? liste : [];
  } catch (hata) {
    console.warn('Favoriler okunamadı, boş liste kullanılıyor:', hata);
    return [];
  }
}

function favorileriKaydet() {
  try {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(durum.favorites));
  } catch (hata) {
    console.warn('Favoriler kaydedilemedi:', hata);
  }
}

function temayiKaydet() {
  try {
    localStorage.setItem(STORAGE_KEYS.theme, durum.theme);
  } catch (hata) {
    console.warn('Tema kaydedilemedi:', hata);
  }
}

// --- AKSİYONLAR: veri ---

// loadTools: açılışta bir kez çalışır. Favorileri localStorage'dan, araçları
// json-server'dan alır. API kapalıysa durum.error doldurulur (boş ekran yerine
// kullanıcıya sebebi gösterilsin diye).
// Süren yükleme isteğinin denetleyicisi. Yeni bir yükleme başlarken önceki
// iptal edilir: "↻ Tekrar dene"ye üst üste basmak veya içe aktarma sonrası
// yenileme, geç dönen eski bir yanıtın yeni listeyi ezmesine yol açardı.
let yuklemeKontrolu = null;

export async function loadTools() {
  durum.favorites = favorileriYukle();

  yuklemeKontrolu?.abort();
  const kontrol = new AbortController();
  yuklemeKontrolu = kontrol;

  // Önce yükleniyor durumuna geç: aksi hâlde veri gelene kadar ekranda boş
  // liste mesajı ("Araç bulunamadı.") görünür ve yanıltıcı olur.
  durum.loading = true;
  durum.error = '';
  bildir();

  try {
    const gelen = await fetchTools(kontrol.signal);
    durum.tools = Array.isArray(gelen) ? gelen : [];
    durum.error = '';
  } catch (hata) {
    // İptal edilen istek durumu DEĞİŞTİRMEZ: listeyi boşaltmak ve hata yazmak
    // yerine sessizce çekilir; ekranı artık yeni istek yönetiyor.
    if (hata.aborted) return;
    durum.tools = [];
    durum.error = hata.message;
  } finally {
    // Yalnızca güncel istek durumu kapatabilir; iptal edilen eski uçuşun
    // finally'si yeni yüklemenin `loading` bayrağını düşürmemeli.
    if (yuklemeKontrolu === kontrol) {
      yuklemeKontrolu = null;
      durum.loading = false;
      // URL'den gelen sayfa numarası veri gelmeden doğrulanamıyordu; liste
      // elde olduğuna göre şimdi sınırlanır (ör. ?page=99 -> son sayfa).
      durum.page = clampPage(durum.page, visibleTools().length, durum.pageSize);
      bildir();
    }
  }
}

// addTool: yeni araç ekler. Doğrulama bileşende yapılır; burada yalnızca
// kaydetme ve durum güncellemesi vardır. Başarıda true döner.
export async function addTool(veri) {
  durum.saving = true;
  bildir();

  try {
    const olusan = await createTool({ ...veri, status: veri.status || DEFAULT_STATUS });
    durum.tools.push(olusan);
    durum.error = '';
    return true;
  } catch (hata) {
    durum.error = hata.message;
    return false;
  } finally {
    durum.saving = false;
    bildir();
  }
}

// importTools: doğrulanmış kayıtları sırayla ekler (US-16).
//
// json-server'da toplu uç nokta yoktur; her kayıt ayrı bir POST'tur. Sıralı
// gönderilir çünkü paralel istekler ilerlemeyi raporlanamaz kılar. Bir kayıt
// başarısız olsa da kalanlar denenir — kısmi başarı normaldir ve dönen rapor
// bunu ayrıntısıyla taşır (IMPORT_REPORT.md).
//
// Dönüş: { added, failed: [{ name, message }] }
export async function importTools(kayitlar = []) {
  if (kayitlar.length === 0) return { added: 0, failed: [] };

  durum.saving = true;
  durum.importProgress = { done: 0, total: kayitlar.length };
  durum.error = '';
  bildir();

  const basarisiz = [];
  let eklenen = 0;

  try {
    for (const kayit of kayitlar) {
      try {
        const olusan = await createTool({
          ...kayit,
          status: kayit.status || DEFAULT_STATUS,
        });
        durum.tools.push(olusan);
        eklenen += 1;
      } catch (hata) {
        basarisiz.push({ name: kayit.name, message: hata.message });
      }
      // İlerleme her kayıttan sonra bildirilir ki çubuk ilerlesin.
      durum.importProgress = { done: eklenen + basarisiz.length, total: kayitlar.length };
      bildir();
    }
  } finally {
    durum.importProgress = null;
    durum.saving = false;
    // Eklenen kayıtlar sayfa sayısını artırmış olabilir; sayfa yine de
    // geçerli aralıkta kalmalı.
    durum.page = clampPage(durum.page, visibleTools().length, durum.pageSize);
    bildir();
  }

  return { added: eklenen, failed: basarisiz };
}

// editTool: mevcut aracı günceller. Ad değiştiyse favori kaydını yeni ada taşır
// (isim = kimlik olduğu için favori kaybolmasın diye — US-05 / US-07).
export async function editTool(id, veri) {
  const arac = aracBul(id);
  if (!arac) return false;

  const eskiAd = arac.name;
  durum.saving = true;
  bildir();

  try {
    const guncel = await apiUpdateTool(id, {
      ...veri,
      status: veri.status || DEFAULT_STATUS,
    });
    Object.assign(arac, guncel);
    if (eskiAd !== arac.name) renameFavorite(eskiAd, arac.name);
    durum.editingId = null;
    durum.error = '';
    return true;
  } catch (hata) {
    durum.error = hata.message;
    return false;
  } finally {
    durum.saving = false;
    bildir();
  }
}

// removeTool: yumuşak silme. Kayıt db.json'da kalır, `deleted: true` olur.
// Hayalet favori kalmaması için favorilerden de çıkarılır (US-06).
//
// Silinen kaydın kimliği `durum.undo`'ya yazılır; toast bunu gösterir ve
// `undoDelete` bunu kullanır. Favori olup olmadığı da saklanır: aksi hâlde
// "Geri al" kartı geri getirir ama favoriyi sessizce kaybettirirdi.
export async function removeTool(id) {
  const arac = aracBul(id);
  if (!arac) return false;

  durum.saving = true;
  bildir();

  try {
    await softDeleteTool(id);
    arac.deleted = true;

    const favoriydi = isFavorite(arac.name);
    if (favoriydi) {
      durum.favorites = durum.favorites.filter((ad) => ad !== arac.name);
      favorileriKaydet();
    }

    durum.undo = { id: arac.id, name: arac.name, wasFavorite: favoriydi };
    // Silinen kart düzenleniyorsa veya çekmecesi açıksa arkada kalmasın.
    if (String(durum.editingId) === String(arac.id)) durum.editingId = null;
    if (String(durum.drawerId) === String(arac.id)) durum.drawerId = null;
    // Son sayfadaki tek kart silindiyse o sayfa artık yok; boş ızgara yerine
    // bir önceki sayfaya düşülür.
    durum.page = clampPage(durum.page, visibleTools().length, durum.pageSize);
    durum.error = '';
    return true;
  } catch (hata) {
    durum.error = hata.message;
    return false;
  } finally {
    durum.saving = false;
    bildir();
  }
}

// restoreTool: çöpten geri yükler. Aktif listede aynı adlı (harf duyarsız) bir
// araç varsa geri yükleme engellenir — uyarıyı çağıran bileşen gösterir (US-06).
// Dönüş: { ok: true } veya { ok: false, message: '...' }
export async function restoreTool(id) {
  const arac = aracBul(id);
  if (!arac) return { ok: false, message: 'Araç bulunamadı.' };

  const cakisiyor = activeTools().some(
    (a) => a.name.toLowerCase() === arac.name.toLowerCase()
  );
  if (cakisiyor) {
    return {
      ok: false,
      message: `"${arac.name}" adlı bir araç zaten listede. Geri yüklenemedi.`,
    };
  }

  durum.saving = true;
  bildir();

  try {
    await apiRestoreTool(id);
    arac.deleted = false;
    durum.error = '';
    return { ok: true };
  } catch (hata) {
    durum.error = hata.message;
    return { ok: false, message: hata.message };
  } finally {
    durum.saving = false;
    bildir();
  }
}

// undoDelete: toast'taki "Geri al". Kaydı geri yükler ve silmeden önce favori
// ise favori kaydını da geri koyar. Geri yükleme kuralları restoreTool'da
// olduğu gibi geçerlidir (aynı adlı aktif araç varsa engellenir).
export async function undoDelete() {
  const kayit = durum.undo;
  if (!kayit) return { ok: false, message: 'Geri alınacak bir silme yok.' };

  const sonuc = await restoreTool(kayit.id);
  if (!sonuc.ok) return sonuc;

  // Ad, geri yükleme sonrası kaydın kendi üzerinden okunur.
  const ad = aracBul(kayit.id)?.name ?? kayit.name;
  if (kayit.wasFavorite && !durum.favorites.includes(ad)) {
    durum.favorites = [...durum.favorites, ad];
    favorileriKaydet();
  }

  durum.undo = null;
  bildir();
  return { ok: true };
}

// clearUndo: toast süresi dolduğunda veya kapatıldığında çağrılır.
// Hiçbir şeyi silmez — kayıt `deleted: true` olarak çöp menüsünde durmaya
// devam eder, oradan hâlâ geri yüklenebilir.
export function clearUndo() {
  if (!durum.undo) return;
  durum.undo = null;
  bildir();
}

// --- AKSİYONLAR: favoriler ---

export function toggleFavorite(isim) {
  if (durum.favorites.includes(isim)) {
    durum.favorites = durum.favorites.filter((ad) => ad !== isim);
  } else {
    durum.favorites = [...durum.favorites, isim];
  }
  favorileriKaydet();
  bildir();
}

// renameFavorite: araç yeniden adlandırılınca favori kaydını yeni ada taşır.
// editTool bunu kendisi çağırır; dışarıdan ayrıca çağırmak gerekmez.
export function renameFavorite(eskiAd, yeniAd) {
  if (!durum.favorites.includes(eskiAd)) return;
  const guncel = durum.favorites.filter((ad) => ad !== eskiAd);
  if (!guncel.includes(yeniAd)) guncel.push(yeniAd);
  durum.favorites = guncel;
  favorileriKaydet();
}

// --- AKSİYONLAR: filtreler ve düzenleme modu ---

// setFilter / resetFilters / setSort sayfayı 1'e döndürür: filtre daraldığında
// kullanıcının bulunduğu sayfa sonuç listesinin dışında kalabilir.
export function setFilter(alan, deger) {
  if (!(alan in durum.filters)) return;
  if (durum.filters[alan] === deger) return; // gereksiz çizim ve sayfa sıfırlaması olmasın
  durum.filters[alan] = deger;
  durum.page = 1;
  bildir();
}

export function resetFilters() {
  durum.filters = { search: '', category: 'all', status: 'all' };
  durum.page = 1;
  bildir();
}

// --- AKSİYONLAR: sıralama ve sayfalama ---

// setSort: tanınmayan değer varsayılana düşer (URL elle düzenlenebilir).
export function setSort(deger) {
  const yeni = isSortOption(deger) ? deger : DEFAULT_SORT;
  if (durum.sort === yeni) return;
  durum.sort = yeni;
  durum.page = 1;
  bildir();
}

// setPage: sayfa numarası mevcut sonuç sayısına göre sınırlanır.
export function setPage(no) {
  const yeni = clampPage(no, visibleTools().length, durum.pageSize);
  if (durum.page === yeni) return;
  durum.page = yeni;
  bildir();
}

// applyUrlState: adres çubuğundan okunan görünümü uygular (açılışta bir kez).
// Tek bir bildirim yapar; alan alan setFilter çağırmak birden çok çizim ve
// aradaki sayfa sıfırlamaları yüzünden URL'deki sayfayı kaybettirirdi.
export function applyUrlState({ filters, sort, page } = {}) {
  if (filters) durum.filters = { ...durum.filters, ...filters };
  if (sort !== undefined) durum.sort = isSortOption(sort) ? sort : DEFAULT_SORT;
  if (page !== undefined) {
    const no = Math.floor(Number(page));
    durum.page = Number.isFinite(no) && no > 0 ? no : 1;
  }
  bildir();
}

// setEditing: formu düzenleme moduna alır (id) veya ekleme moduna döndürür (null).
export function setEditing(id) {
  durum.editingId = id ?? null;
  bildir();
}

// --- AKSİYONLAR: detay çekmecesi (drawer) ---

export function openDrawer(id) {
  durum.drawerId = id ?? null;
  bildir();
}

export function closeDrawer() {
  if (durum.drawerId === null) return;
  durum.drawerId = null;
  bildir();
}

// --- AKSİYONLAR: tema ---

// applyTheme: <html data-theme> özniteliğini yazar. Koyu tema değişkenleri
// styles/base.css içinde [data-theme="dark"] ile devreye girer (US-08).
export function applyTheme(tema) {
  durum.theme = tema === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', durum.theme);
}

// loadTheme: kayıtlı temayı okur ve uygular. main.js'te ilk çizimden önce çalışır.
export function loadTheme() {
  let tema = 'light';
  try {
    tema = localStorage.getItem(STORAGE_KEYS.theme) || 'light';
  } catch (hata) {
    console.warn('Tema okunamadı:', hata);
  }
  applyTheme(tema);
}

export function toggleTheme() {
  applyTheme(durum.theme === 'dark' ? 'light' : 'dark');
  temayiKaydet();
  bildir();
}

// --- HATA MESAJI ---

// clearError: kullanıcı hata şeridini kapattığında çağrılır. Hata aksi hâlde
// ancak sonraki başarılı işlemde silinirdi.
export function clearError() {
  durum.error = '';
  bildir();
}
