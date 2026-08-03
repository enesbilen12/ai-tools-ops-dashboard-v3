// store.js: Uygulamanın tek doğruluk kaynağı.
//
// v2'de tools / silinenAraclar / duzenlenenArac birer global `let` idi ve ~15
// fonksiyon bunlara doğrudan yazıyordu. ES modülde dışarıdan içe aktarılan bir
// `let`'e atama yapılamaz; bu yüzden durum burada kapalı tutulur ve dışarıya
// yalnızca okuma yardımcıları + aksiyon fonksiyonları açılır.
//
// Bileşenler api'yi doğrudan çağırmaz; her zaman buradan geçer.

import { STORAGE_KEYS, DEFAULT_STATUS } from '../constants.js';
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
  // Favoriler araç ADINA göre tutulur (v2 ile aynı). Bu yüzden yeniden
  // adlandırmada favori kaydının yeni ada taşınması gerekir (renameFavorite).
  favorites: [],
  theme: 'light',
  // Şu an kart içi düzenleme modunda olan aracın adı (yoksa null).
  editingName: null,
  // İlk yükleme sürüyor mu? Boş liste ile "yükleniyor" ayırt edilebilsin diye.
  loading: false,
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

export function isFavorite(isim) {
  return durum.favorites.includes(isim);
}

// aracBul: id ile araç bulur. Karşılaştırma metin üzerinden yapılır; db.json'daki
// sayısal id'ler ile json-server'ın yeni kayıtlara ürettiği id'ler ve DOM'dan
// (data-id) gelen değerler farklı tipte olabilir.
function aracBul(id) {
  return durum.tools.find((arac) => String(arac.id) === String(id));
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
export async function loadTools() {
  durum.favorites = favorileriYukle();
  // Önce yükleniyor durumuna geç: aksi hâlde veri gelene kadar ekranda boş
  // liste mesajı ("Araç bulunamadı.") görünür ve yanıltıcı olur.
  durum.loading = true;
  durum.error = '';
  bildir();

  try {
    const gelen = await fetchTools();
    durum.tools = Array.isArray(gelen) ? gelen : [];
    durum.error = '';
  } catch (hata) {
    durum.tools = [];
    durum.error = hata.message;
  } finally {
    durum.loading = false;
    bildir();
  }
}

// addTool: yeni araç ekler. Doğrulama bileşende yapılır; burada yalnızca
// kaydetme ve durum güncellemesi vardır. Başarıda true döner.
export async function addTool(veri) {
  try {
    const olusan = await createTool({ ...veri, status: veri.status || DEFAULT_STATUS });
    durum.tools.push(olusan);
    durum.error = '';
    bildir();
    return true;
  } catch (hata) {
    durum.error = hata.message;
    bildir();
    return false;
  }
}

// editTool: mevcut aracı günceller. Ad değiştiyse favori kaydını yeni ada taşır
// (isim = kimlik olduğu için favori kaybolmasın diye — US-05 / US-07).
export async function editTool(id, veri) {
  const arac = aracBul(id);
  if (!arac) return false;

  const eskiAd = arac.name;
  try {
    const guncel = await apiUpdateTool(id, {
      ...veri,
      status: veri.status || DEFAULT_STATUS,
    });
    Object.assign(arac, guncel);
    if (eskiAd !== arac.name) renameFavorite(eskiAd, arac.name);
    durum.editingName = null;
    durum.error = '';
    bildir();
    return true;
  } catch (hata) {
    durum.error = hata.message;
    bildir();
    return false;
  }
}

// removeTool: yumuşak silme. Kayıt db.json'da kalır, `deleted: true` olur.
// Hayalet favori kalmaması için favorilerden de çıkarılır (US-06).
export async function removeTool(id) {
  const arac = aracBul(id);
  if (!arac) return false;

  try {
    await softDeleteTool(id);
    arac.deleted = true;
    if (isFavorite(arac.name)) {
      durum.favorites = durum.favorites.filter((ad) => ad !== arac.name);
      favorileriKaydet();
    }
    durum.error = '';
    bildir();
    return true;
  } catch (hata) {
    durum.error = hata.message;
    bildir();
    return false;
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

  try {
    await apiRestoreTool(id);
    arac.deleted = false;
    durum.error = '';
    bildir();
    return { ok: true };
  } catch (hata) {
    durum.error = hata.message;
    bildir();
    return { ok: false, message: hata.message };
  }
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

export function setFilter(alan, deger) {
  if (!(alan in durum.filters)) return;
  durum.filters[alan] = deger;
  bildir();
}

export function resetFilters() {
  durum.filters = { search: '', category: 'all', status: 'all' };
  bildir();
}

// setEditing: kartı form moduna alır (isim) veya form modundan çıkarır (null).
export function setEditing(isim) {
  durum.editingName = isim;
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
