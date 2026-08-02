// constants.js: Uygulama genelinde kullanılan sabit değerler.
// (API adresi, dropdown seçenekleri, localStorage anahtarları.)

// json-server'ın çalıştığı taban adres. `npm run api` bu portu açar.
export const API_BASE = 'http://localhost:3001';

// Araç kaynağının uç noktası: json-server db.json içindeki "tools" dizisini sunar.
export const TOOLS_ENDPOINT = `${API_BASE}/tools`;

// Abonelik tipi seçenekleri (ekleme/düzenleme dropdown'ında kullanılır).
export const SUBSCRIPTIONS = ['Ücretsiz', 'Freemium', 'Ücretli'];

// Durum seçenekleri. Bir aracın status'u boşsa varsayılan DEFAULT_STATUS sayılır.
export const STATUSES = ['Aktif', 'Deneme', 'Pasif'];
export const DEFAULT_STATUS = 'Aktif';

// localStorage anahtarları. Araçlar json-server'da tutulur; yalnızca kullanıcıya
// özel UI tercihleri (tema + favoriler) tarayıcıda saklanır.
export const STORAGE_KEYS = {
  favorites: 'ai-araclari-paneli:favoriler',
  theme: 'ai-araclari-paneli:tema',
};
