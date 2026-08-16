# Değişiklik Günlüğü

## v3.0.0 — 2026-08-16

Panelin v2'den (tek dosyalık, 887 satırlık `app.js`) modüler bir yapıya taşınması
ve altı günlük sprint boyunca yeniden inşası. Etiket: [`v3.0.0`](../../releases/tag/v3.0.0)

**Özet**

- **Mimari:** 9 bileşen, tek doğruluk kaynağı olan bir store, REST katmanı ve
  12 saf yardımcı modül. Bileşenler API'yi doğrudan çağırmaz.
- **Veri:** `localStorage` → **json-server** (`db.json`). Silme yumuşak; uygulama
  hiçbir zaman `DELETE` göndermez. Tarayıcıda yalnızca tema ve favoriler kalır.
- **Özellikler:** arama (300 ms debounce) · kategori/durum filtresi · sıralama
  (Türkçe harf sırası) · sayfalama · tek formda ekleme/düzenleme · detay çekmecesi ·
  geri alınabilir silme · dört ayrı boş durum · iptal edilebilir yükleme ·
  filtrelenmiş CSV/JSON dışa aktarma · doğrulamalı JSON içe aktarma ·
  adres çubuğu senkronu · istatistikler ve kategori dağılımı · açık/koyu tema.
- **Kalite:** 167 birim testi (11 dosya), 152 kontrollük 6 tarayıcısız duman testi,
  10 belge. Yol boyunca **7 kusur** bulunup düzeltildi (aşağıdaki "Düzeltildi"
  bölümlerinde).

Aşağıdaki bölümler bu sürümün gün gün nasıl oluştuğunu gösterir; en yeni gün üstte.

---

### Gün 6 — 2026-08-08 · Test boşlukları, kod incelemesi ve README

Gün 6: test boşluklarının kapatılması, kod incelemesi ve README.

#### Düzeltildi
- **Türkçe İ/ı benzersizlik kontrolünü ve aramayı bozuyordu.** JavaScript'in
  `toLowerCase()`'i `"İzleme"` için `"i̇zleme"` (i + birleşen nokta) üretiyor;
  bu yüzden "İzleme" ve "izleme" **iki ayrı araç olarak eklenebiliyordu** ve
  "izleme" araması "İzleme" adlı aracı bulamıyordu. Kural artık
  `utils/text.js`'te tek yerde: `validators`, `filters` ve `store.restoreTool`
  oradan geçiyor.
- **"undefined" araması eksik alanlı araçları buluyordu.** `toolMatches` alanları
  şablon dizgisiyle birleştirirken eksik alan `"undefined"` metnine dönüşüyordu.
- **`validateForm` adsız kayıtta çöküyordu** (`TypeError`). `db.json`'daki bir
  kayıttan `name` düşerse ekleme ve düzenleme formu tamamen kilitleniyordu.
- **Yalnızca boşluktan oluşan ad geçerli sayılıyordu.** Kırpma artık
  doğrulayıcının içinde; savunma çağırana bağlı değil.
- **Çöp menüsünden geri yüklemede favori kayboluyordu.** Favori bilgisi yalnızca
  5 saniyelik `undo` kaydında tutuluyordu; süre dolduktan sonra çöpten geri
  yükleyen kullanıcı favorisini sessizce kaybediyordu. Bilgi artık kaydın ömrü
  boyunca saklanıyor ve iki geri yükleme yolu aynı sonucu veriyor.

#### Eklendi
- **`utils/text.js`** — Türkçeye uygun karşılaştırma (`esitMetin`, `icerirMetin`).
- **49 yeni test** (118 → 167): boş değer, sınır değer, Türkçe karakter ve hatalı
  tip senaryoları; `validators`, `filters`, `csv`, `sorting`, `pagination`.
- **`README.md`** — kurulum (iki terminal uyarısıyla), komutlar, özellikler,
  mimari haritası, belge dizini, bilinen sınırlar.
- **`REVIEW.md`** — kod incelemesi: düzeltilen kusurlar, bilinen riskler
  (erişilebilirlik, CSV/Excel, yeniden giriş) ve refactor önerileri.

### Gün 5 — 2026-08-08 · İstatistikler, dışa/içe aktarma, iptal edilebilir yükleme

Gün 5: istatistikler, dışa/içe aktarma ve iptal edilebilir yükleme.

#### Eklendi
- **Panel istatistikleri** — dört sayı (Toplam Araç, Durumu Aktif, Favoriler,
  Kategori) ve **kategori dağılımı** çubukları. Dağılım tek serilik bir büyüklük
  karşılaştırması olduğu için tek hue kullanılır; her kategoriye ayrı renk vermek
  hiçbir şey kodlamazdı. Açık ve koyu tema için ayrı renk adımları seçildi
  (ters çevirme değil), ikisi de kendi zeminine karşı 3:1 kontrastı geçiyor.
  Her değer metin olarak da yazılı — bilgi yalnızca çubuk uzunluğuna bağlı değil.
- **JSON dışa aktarma** — CSV ile aynı alanlar; indirilen dosya **doğrudan geri
  içe aktarılabilir**. Dosya adları tarih damgalı (`ai-araclari-2026-08-08.json`).
- **JSON içe aktarma** — dosya seç → doğrula → **önizleme** (geçerli/geçersiz,
  sebepleriyle) → onay → sırayla ekle. Doğrulama ekleme formuyla aynı kuralları
  kullanır; çakışan ve dosya içinde tekrar eden adlar atlanır, üzerine yazılmaz.
  json-server'da toplu uç nokta olmadığı için kayıtlar tek tek gönderilir ve
  ilerleme gösterilir (`12 / 47 eklendi`).
- **`IMPORT_REPORT.md`** — dosya sözleşmesi, doğrulama sebepleri, çakışma
  politikası, kısmi başarı davranışı ve sınırlar.
- Yeni saf modüller: `utils/stats.js`, `utils/exporters.js`, `utils/importer.js`;
  yeni bileşenler: `components/stats.js`, `components/importPanel.js`.
- **US-15 / US-16 / US-17** (`USER_STORIES.md`) — istatistikler, içe aktarma,
  iptal edilebilir yükleme.

#### Değişti
- **Dışa aktarma artık filtreyi uyguluyor.** CSV tüm aktif araçları veriyordu;
  şimdi ikisi de `visibleTools()` kullanıyor — filtreden geçen tüm kayıtlar,
  sayfalanmadan. Düğme etiketinde kaç kaydın ineceği yazıyor (`📤 CSV (47)`).
- `loadTools` **iptal edilebilir**: her çağrı süren `GET /tools` uçuşunu
  `abort()` eder. "↻ Tekrar dene"ye üst üste basmak veya içe aktarma sonrası
  yenileme, geç dönen eski bir yanıtın yeni listeyi ezmesine yol açıyordu.
- Özet alanı `dashboard.js` içinden `components/stats.js`'e taşındı.
- `downloadCSV`'nin blob/anchor mantığı `downloadFile` olarak ortaklaştırıldı.

#### Düzeltildi
- **İptal edilen istek artık sunucu arızası gibi görünmüyor.** `AbortError`
  `normalizeError`'da `status: 0`'a düşüp "API'ye ulaşılamadı. json-server
  çalışıyor mu?" mesajını üretiyordu — oysa iptali uygulamanın kendisi istemişti.
  Artık `status: -1` + `aborted: true` ile ayrılıyor ve durumu hiç değiştirmiyor.

### Gün 4 — 2026-08-08 · Sıralama, sayfalama ve URL durumu

Gün 4: sıralama, sayfalama ve adres çubuğunda saklanan görünüm.

#### Eklendi
- **Sıralama menüsü** — Ad (A→Z / Z→A), Kategori, Durum. Karşılaştırmalar Türkçe
  harf sırasına göre (`localeCompare(…, 'tr')`); aksi hâlde `Çizim`/`Şema`/`İzleme`
  yanlış yere düşüyordu. Eşit kayıtlar ada göre ikincil sıralanır.
- **Sayfalama** — sayfa başına 12 kart, ızgaranın altında
  `← Önceki · Sayfa N / M · X araç · Sonraki →` çubuğu. Tek sayfaya sığan listede
  çubuk hiç görünmez.
- **Adres çubuğu senkronu** — arama, kategori, durum, sıralama ve sayfa
  `?q=…&category=…&status=…&sort=…&page=…` olarak yazılır; sayfa yenilenince görünüm
  geri yüklenir. Varsayılan değerler yazılmaz, adres temiz kalır. Yazma
  `replaceState` ile: filtre değişiklikleri tarayıcı geçmişini doldurmaz.
- **Arama debounce'ı (300 ms)** — her tuş vuruşunda tüm ızgara yeniden çiziliyordu.
- Yeni saf modüller: `utils/sorting.js`, `utils/pagination.js`, `utils/urlState.js`,
  `utils/debounce.js` — dördü de test edildi (34 → 79 test).
- Store'a `sort`, `page`, `pageSize` alanları; `setSort`, `setPage`, `applyUrlState`
  aksiyonları ve `visibleTools()` okuma yardımcısı.
- **`STATE_DIAGRAM.md`** — durum alanları tablosu, listenin dönüşüm zinciri, sayfa
  sıfırlama kuralları ve URL senkronunun iki yönü.
- **US-12 / US-13 / US-14** (`USER_STORIES.md`) — sıralama, sayfalama, URL kalıcılığı.

#### Değişti
- `setFilter` / `resetFilters` / `setSort` sayfayı **1'e döndürür**; daralan sonuçta
  kullanıcı liste dışı bir sayfada kalmasın.
- `setFilter` aynı değer yeniden atandığında hiçbir şey yapmaz — gereksiz yeniden
  çizim ve sayfa sıfırlaması olmuyor.
- `removeTool` ve `loadTools` bitişte sayfayı geçerli aralığa sıkıştırır: son sayfadaki
  son kart silinince bir önceki sayfa, `?page=99` ile açılışta son sayfa gösterilir.
- Kategori hizalaması artık **yalnızca veri geldikten sonra** çalışıyor; `?category=Metin`
  ile açılışta filtre daha ilk çizimde kaybolmuyor.
- Filtre alanı `flex` sütuna alındı: beş kontrolün arası HTML satır sonlarından gelen
  düzensiz boşluklar yerine eşit `gap` ile ayrılıyor.

### Gün 3 — 2026-08-04 · Tam CRUD, tek form ve detay çekmecesi

Gün 3: tam CRUD, tek form ve geri alınabilir silme.

#### Eklendi
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

#### Değişti
- **Ekleme ve düzenleme tek formda birleşti.** Düzenleme formu kartın içinde
  açılıyordu; aynı 8 alan iki yerde tekrar ediyordu. Artık sayfanın üstündeki tek
  form `editingId`'ye göre POST veya PATCH yapıyor. `editFormHtml`, `readEditForm`
  ve `showEditError` kaldırıldı.
- **Silmede `confirm()` kaldırıldı.** Tek tık siler, güvence geri alma toast'ıdır.
- Kartlar tıklanabilir ve odaklanabilir oldu (`tabindex`, `Enter`/`Space`).
- Store'daki `editingName` → **`editingId`**: yeniden adlandırma sırasında referans
  ada bağlı kalmasın diye.

#### Düzeltildi
- **Düzenlemede "bu ad zaten var" kilidi.** `validateForm` benzersizlik kontrolünü
  `t.id !== currentId` ile, yani katı karşılaştırmayla yapıyordu. `currentId` DOM'dan
  metin (`"5"`), `db.json` id'leri sayı (`5`) geldiği için araç kendi adına çarpıyor
  ve düzenleme kaydedilemiyordu. Karşılaştırma metin üzerinden yapılıyor; iki
  regresyon testi eklendi (32 → 34).

### Gün 2 — 2026-08-03 · API katmanı ve yükleme/hata durumları

Gün 2: API katmanının sertleştirilmesi ve yükleme/hata durumlarının ayrıştırılması.

#### Eklendi
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

#### Değişti
- **Boş durum dörde ayrıldı.** Önceden dört ayrı durum tek bir "Araç bulunamadı."
  mesajına iniyordu (yükleniyor / API kapalı / veri yok / filtre boş). Artık:
  "Yükleniyor…", hata + Tekrar dene, "Henüz araç eklenmemiş.", "Araç bulunamadı."
- Hata gösterimi ikiye bölündü: **yükleme** hatası tabloda retry ile,
  **aksiyon** hatası üstteki kapatılabilir şeritte. Aynı mesaj iki yerde çıkmıyor.
- Durum şeridi `:empty` yerine `hidden` özniteliğiyle gizleniyor (içine düğme girdi).

### Gün 1 — 2026-08-02 · v2 migration

v2'nin (tek dosyalık, 887 satırlık `app.js`) modüler Vite yapısına taşınması.

#### Eklendi
- **Vite** derleme zinciri (`npm run dev` / `build` / `preview`) ve **vitest** ile
  18 birim testi (`tests/filters`, `tests/validators`, `tests/csv`).
- **json-server** kalıcılığı: araçlar artık `db.json` içinde, `npm run api` ile servis edilir.
- Katmanlı mimari: `state/store.js` (tek doğruluk kaynağı), `components/`, `utils/`, `api/`.
- Araçlara `id` (json-server kimliği) ve `deleted` (yumuşak silme) alanları.
- json-server kapalıyken sayfanın üstünde görünen `.durum-mesaji` hata şeridi —
  eskiden bu durumda konsola bir uyarı düşüyordu.
- Stiller üçe ayrıldı: `styles/base.css`, `styles/components.css`, `styles/responsive.css`.

#### Değişti
- **Dışa aktarma:** sayfa içi salt-okunur JSON textarea yerine **CSV dosya indirme**
  (RFC 4180 kaçışlı). Bkz. US-09.
- **Kalıcılık:** araçlar ve çöp kutusu `localStorage`'dan `db.json`'a taşındı.
  `localStorage`'da yalnızca tema ve favoriler kaldı. Bkz. US-10.
- **Silme:** ayrı bir `:silinenler` listesi yerine kaydın üzerinde `deleted: true`.
- Sayfa iskeleti artık statik `index.html` değil; `dashboard` bileşeni tarafından üretiliyor.
- Yeniden çizim kısmileştirildi: yalnızca değişen parçalar güncelleniyor
  (arama kutusu odağı korunsun diye).

#### Kaldırıldı
- `app.js` içindeki 18 kayıtlık `VARSAYILAN_ARACLAR` kopyası — tek kaynak artık `db.json`.
- `fetch("data.json")` ile açılış yüklemesi ve varsayılan/kayıtlı veri birleştirme mantığı.
- Vite şablon artıkları (`counter.js`, `style.css`, `assets/*`, `public/icons.svg`).

#### Korundu (v2 ile aynı)
- Tüm sınıf adları ve görsel tasarım; `[data-theme="dark"]` ile tema geçişi.
- Kart içi (inline) düzenleme formu — ayrı bir yan çekmece kullanılmadı.
- Silme onayı için `confirm()`, geri yükleme çakışmasında `alert()`.
- Favorilerin araç **adına** göre saklanması ve yeniden adlandırmada yeni ada taşınması.
- Kullanıcı metninin `escapeHtml` ile kaçırılması (XSS koruması).
