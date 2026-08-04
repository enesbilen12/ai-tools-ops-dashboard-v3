# Değişiklik Günlüğü

## Yayınlanmamış — 2026-08-04

Gün 3: tam CRUD, tek form ve geri alınabilir silme.

### Eklendi
- **Detay çekmecesi** (`src/components/toolDrawer.js`) — kart gövdesine tıklayınca
  sağdan açılır; aracın sekiz alanı, kartta görünmeyen `id`'si ve favori durumu
  burada. Salt-okunur; `×`, karartma ve `Esc` ile kapanır, odak geldiği karta döner.
- **Geri alma toast'ı** (`src/components/toast.js`) — silmeden sonra 5 saniye
  görünür. "Geri al" kaydı **ve favoriyi** geri getirir. Süre dolunca hiçbir şey
  yok edilmez; kayıt çöp menüsünde durmaya devam eder.
- **`saving` durumu** — yazma isteği uçarken form, kart ve çekmece butonları
  kilitlenir; çift tık ikinci istek üretmez.
- **`CRUD_MATRIX.md`** — tarayıcıda elle geçilecek 12 senaryo (C/R/U/D).
- Store'a `editingId`, `drawerId`, `undo` alanları ve `openDrawer` / `closeDrawer` /
  `undoDelete` / `clearUndo` / `findTool` aksiyonları.
- **US-11** (`USER_STORIES.md`) — detay çekmecesi hikayesi ve kabul kriterleri.

### Değişti
- **Ekleme ve düzenleme tek formda birleşti.** Düzenleme formu kartın içinde
  açılıyordu; aynı 8 alan iki yerde tekrar ediyordu. Artık sayfanın üstündeki tek
  form `editingId`'ye göre POST veya PATCH yapıyor. `editFormHtml`, `readEditForm`
  ve `showEditError` kaldırıldı.
- **Silmede `confirm()` kaldırıldı.** Tek tık siler, güvence geri alma toast'ıdır.
- Kartlar tıklanabilir ve odaklanabilir oldu (`tabindex`, `Enter`/`Space`).
- Store'daki `editingName` → **`editingId`**: yeniden adlandırma sırasında referans
  ada bağlı kalmasın diye.

### Düzeltildi
- **Düzenlemede "bu ad zaten var" kilidi.** `validateForm` benzersizlik kontrolünü
  `t.id !== currentId` ile, yani katı karşılaştırmayla yapıyordu. `currentId` DOM'dan
  metin (`"5"`), `db.json` id'leri sayı (`5`) geldiği için araç kendi adına çarpıyor
  ve düzenleme kaydedilemiyordu. Karşılaştırma metin üzerinden yapılıyor; iki
  regresyon testi eklendi (32 → 34).

## Yayınlanmamış — 2026-08-03

Gün 2: API katmanının sertleştirilmesi ve yükleme/hata durumlarının ayrıştırılması.

### Eklendi
- **`normalizeError`** (`src/api/toolsApi.js`) — dışa aktarılmış, test edilebilir
  hata normalleştirme. Fırlatılan `Error` artık `status` ve `url` da taşıyor;
  ağ hatası (`status: 0`), 404, 4xx ve 5xx için ayrı mesajlar üretiliyor.
- **`tests/toolsApi.test.js`** — 14 test; `fetch` taklidiyle çalışır, json-server
  gerektirmez. Toplam test sayısı 18 → 32.
- **`loading` durumu** (`src/state/store.js`) — `loadTools()` başında `true`,
  `finally`'de `false`.
- **"↻ Tekrar dene" butonu** — yükleme başarısız olduğunda tabloda görünür,
  `loadTools()` çağırır. Kullanıcı artık sayfayı yenilemek zorunda değil.
- **`API_CONTRACT.md`** — uç noktalar, kayıt şeması, yumuşak silme sözleşmesi,
  hata biçimi ve `id`'nin metin olarak döndüğü uyarısı.
- Hata şeridine **kapatma (×) düğmesi** (`clearError`).

### Değişti
- **Boş durum dörde ayrıldı.** Önceden dört ayrı durum tek bir "Araç bulunamadı."
  mesajına iniyordu (yükleniyor / API kapalı / veri yok / filtre boş). Artık:
  "Yükleniyor…", hata + Tekrar dene, "Henüz araç eklenmemiş.", "Araç bulunamadı."
- Hata gösterimi ikiye bölündü: **yükleme** hatası tabloda retry ile,
  **aksiyon** hatası üstteki kapatılabilir şeritte. Aynı mesaj iki yerde çıkmıyor.
- Durum şeridi `:empty` yerine `hidden` özniteliğiyle gizleniyor (içine düğme girdi).

## v3.0.0 — 2026-08-02

v2'nin (tek dosyalık, 887 satırlık `app.js`) modüler Vite yapısına taşınması.

### Eklendi
- **Vite** derleme zinciri (`npm run dev` / `build` / `preview`) ve **vitest** ile
  18 birim testi (`tests/filters`, `tests/validators`, `tests/csv`).
- **json-server** kalıcılığı: araçlar artık `db.json` içinde, `npm run api` ile servis edilir.
- Katmanlı mimari: `state/store.js` (tek doğruluk kaynağı), `components/`, `utils/`, `api/`.
- Araçlara `id` (json-server kimliği) ve `deleted` (yumuşak silme) alanları.
- json-server kapalıyken sayfanın üstünde görünen `.durum-mesaji` hata şeridi —
  eskiden bu durumda konsola bir uyarı düşüyordu.
- Stiller üçe ayrıldı: `styles/base.css`, `styles/components.css`, `styles/responsive.css`.

### Değişti
- **Dışa aktarma:** sayfa içi salt-okunur JSON textarea yerine **CSV dosya indirme**
  (RFC 4180 kaçışlı). Bkz. US-09.
- **Kalıcılık:** araçlar ve çöp kutusu `localStorage`'dan `db.json`'a taşındı.
  `localStorage`'da yalnızca tema ve favoriler kaldı. Bkz. US-10.
- **Silme:** ayrı bir `:silinenler` listesi yerine kaydın üzerinde `deleted: true`.
- Sayfa iskeleti artık statik `index.html` değil; `dashboard` bileşeni tarafından üretiliyor.
- Yeniden çizim kısmileştirildi: yalnızca değişen parçalar güncelleniyor
  (arama kutusu odağı korunsun diye).

### Kaldırıldı
- `app.js` içindeki 18 kayıtlık `VARSAYILAN_ARACLAR` kopyası — tek kaynak artık `db.json`.
- `fetch("data.json")` ile açılış yüklemesi ve varsayılan/kayıtlı veri birleştirme mantığı.
- Vite şablon artıkları (`counter.js`, `style.css`, `assets/*`, `public/icons.svg`).

### Korundu (v2 ile aynı)
- Tüm sınıf adları ve görsel tasarım; `[data-theme="dark"]` ile tema geçişi.
- Kart içi (inline) düzenleme formu — ayrı bir yan çekmece kullanılmadı.
- Silme onayı için `confirm()`, geri yükleme çakışmasında `alert()`.
- Favorilerin araç **adına** göre saklanması ve yeniden adlandırmada yeni ada taşınması.
- Kullanıcı metninin `escapeHtml` ile kaçırılması (XSS koruması).
