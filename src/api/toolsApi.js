// toolsApi.js: json-server (db.json) ile REST üzerinden konuşan katman.
// Bileşenler bu modülü DOĞRUDAN çağırmaz; her zaman store üzerinden geçer.

import { TOOLS_ENDPOINT } from '../constants.js';

// normalizeError: her başarısızlığı tek bir biçime sokar.
//
// Dönen Error'da mesajın yanında `status` ve `url` da taşınır; böylece çağıran
// taraf 404 ile 500'ü ayırt edebilir (ör. 404'te listeyi tazelemek, 5xx'te
// tekrar denemeyi önermek). Ağ hatası için status 0 kullanılır — HTTP yanıtı
// hiç alınamadığı için gerçek bir durum kodu yoktur.
export function normalizeError({ url = '', status = 0, cause } = {}) {
  let mesaj;
  if (status === 0) {
    // Tipik sebep: json-server çalışmıyor (npm run api unutulmuş).
    mesaj = "API'ye ulaşılamadı. json-server çalışıyor mu? (npm run api)";
  } else if (status === 404) {
    mesaj = 'Kayıt bulunamadı (404). Liste güncel olmayabilir, yenileyin.';
  } else if (status >= 500) {
    mesaj = `Sunucu hatası (HTTP ${status}). Birazdan tekrar deneyin.`;
  } else if (status >= 400) {
    mesaj = `İstek reddedildi (HTTP ${status}).`;
  } else {
    mesaj = `Beklenmeyen yanıt (HTTP ${status}).`;
  }

  const hata = new Error(mesaj);
  hata.status = status;
  hata.url = url;
  if (cause) hata.cause = cause;
  return hata;
}

// Ortak yanıt kontrolü: ağ/HTTP hatasında normalize edilmiş bir Error fırlat.
async function istek(url, secenekler) {
  let yanit;
  try {
    yanit = await fetch(url, secenekler);
  } catch (hata) {
    throw normalizeError({ url, status: 0, cause: hata });
  }
  if (!yanit.ok) {
    throw normalizeError({ url, status: yanit.status });
  }
  // 204 gibi gövdesiz yanıtlarda json() patlamasın.
  if (yanit.status === 204) return null;
  return yanit.json();
}

const JSON_BASLIK = { 'Content-Type': 'application/json' };

// fetchTools: tüm araçları getirir (aktif + silinmiş; ayrım store'da yapılır).
export function fetchTools() {
  return istek(TOOLS_ENDPOINT);
}

// createTool: yeni araç ekler. id'yi json-server üretir; deleted:false ile başlar.
export function createTool(tool) {
  return istek(TOOLS_ENDPOINT, {
    method: 'POST',
    headers: JSON_BASLIK,
    body: JSON.stringify({ ...tool, deleted: false }),
  });
}

// updateTool: verilen alanları günceller (PATCH ile kısmi güncelleme).
export function updateTool(id, patch) {
  return istek(`${TOOLS_ENDPOINT}/${id}`, {
    method: 'PATCH',
    headers: JSON_BASLIK,
    body: JSON.stringify(patch),
  });
}

// softDeleteTool: yumuşak silme — kayıt db.json'da kalır, deleted:true olur.
export function softDeleteTool(id) {
  return updateTool(id, { deleted: true });
}

// restoreTool: silinen aracı geri yükler (deleted:false). id ve favori korunur.
export function restoreTool(id) {
  return updateTool(id, { deleted: false });
}
