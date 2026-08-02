// toolsApi.js: json-server (db.json) ile REST üzerinden konuşan katman.
// Bileşenler bu modülü DOĞRUDAN çağırmaz; her zaman store üzerinden geçer.

import { TOOLS_ENDPOINT } from '../constants.js';

// Ortak yanıt kontrolü: ağ/HTTP hatasında anlamlı bir Error fırlat.
async function istek(url, secenekler) {
  let yanit;
  try {
    yanit = await fetch(url, secenekler);
  } catch (hata) {
    // Tipik sebep: json-server çalışmıyor (npm run api unutulmuş).
    throw new Error(
      'API\'ye ulaşılamadı. json-server çalışıyor mu? (npm run api)'
    );
  }
  if (!yanit.ok) {
    throw new Error(`İstek başarısız (HTTP ${yanit.status})`);
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
