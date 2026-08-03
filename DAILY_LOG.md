# Günlük Çalışma Kaydı (Daily Log)

Her gün ne yaptığımı kısaca not aldığım dosya. En yeni gün en üstte.

---

## Gün 2

- **Tarih:** 2026-08-03
- **Bugünkü hedef:** Mock REST API ve service katmanı.
- **İzlediğim / okuduğum kaynaklar:**
- **Yaptığım değişiklikler:** `toolsApi.js`'e `normalizeError` eklendi: ağ
  hatası, 404, 4xx ve 5xx tek bir mesaj biçimine indirgeniyor ve dönen
  `Error` üzerinde `status` + `url` taşınıyor (çağıran taraf 404 ile 500'ü
  ayırt edebilsin diye). Ortak `istek()` sarmalayıcısı tüm çağrıları buradan
  geçiriyor; 204 gibi gövdesiz yanıtlarda `json()` çağrılmıyor. Store'a
  `loading` bayrağı eklendi; `loadTools` fetch'ten **önce** `loading: true`
  ile bildirim yapıyor, `finally` bloğunda kapatıyor. `toolTable`'daki tek
  "Araç bulunamadı." mesajı dörde ayrıldı: (1) Yükleniyor…, (2) hata +
  "↻ Tekrar dene" butonu, (3) henüz araç eklenmemiş, (4) filtre sonucu boş.
  Böylece kullanıcı "sunucu mu kapalı, filtrem mi tutmadı" ayrımını
  yapabiliyor. Hata şeridi (`dashboard.js`) kapatılabilir hâle getirildi
  (`clearError`) ve ilk yükleme hatasını artık tekrar etmiyor. `API_CONTRACT.md`
  yazıldı: taban adres, kayıt şeması, uç noktalar ve hata biçimi. `index.html`
  içindeki `#app` kabına statik "Yükleniyor…" iskeleti kondu — JS inene kadar
  ekran beyaz kalmasın diye; `mountDashboard` ilk iş olarak üzerine yazıyor.
- **Değişen dosyalar:** index.html, src/api/toolsApi.js, src/state/store.js,
  src/components/{dashboard,toolTable}.js, src/styles/{base,components}.css,
  tests/toolsApi.test.js (yeni), API_CONTRACT.md (yeni), ARCHITECTURE.md,
  CHANGELOG.md, TEST_REPORT.md
- **Claude Code'a verdiğim ana prompt:** "Sayfa açılırken 'Yükleniyor...' metni
  görünmüyor. Network Slow 4G ile test ettim. toolTable.js'de loading state
  neden ekranda gözükmüyor? Kod değiştirmeden önce nedeni açıkla."
- **Test ettiklerim:** `npm test` (yeni `toolsApi` testleriyle birlikte);
  `normalizeError`'ın status 0 / 404 / 4xx / 5xx kollarının ayrı mesaj
  üretmesi; `fetchTools`/`createTool`/`updateTool`/`softDeleteTool`/
  `restoreTool`'un doğru HTTP yöntemini ve gövdeyi göndermesi (GET / POST /
  PATCH); 204 yanıtında `null` dönmesi; tarayıcıda Slow 4G ile ilk açılış
  davranışı.
- **Geçen testler:** `npm test` 32/32 geçti (4 dosya). Gün 1'deki 18 teste
  `tests/toolsApi.test.js` ile 14 test eklendi.
- **Kalan sorunlar:** Loading mesajının tarayıcıda gerçekten çizildiği,
  breakpoint ile doğrulanmadı — Slow 4G'de Vite dev modülleri seri indiği için
  metin ancak birkaç saniyelik beyaz ekranın ardından ve db.json 6.5 KB olduğu
  için çok kısa süre görünüyor. Statik iskelet bu boşluğu kapatıyor ama koyu
  tema kullanıcısında ilk kare açık zeminde çıkıyor (`loadTheme` de JS ile
  çalışıyor).
- **Bugün öğrendiğim kavram:** Hata normalizasyonu (`normalizeError`) — API
  katmanının farklı başarısızlıkları tek bir sözleşmeye indirgemesi ve
  `Error` üzerine ek alan (`status`, `url`, `cause`) iliştirmesi; HTTP
  yöntemlerinin anlamı (GET okuma, POST oluşturma, PATCH kısmi güncelleme,
  DELETE silme — burada gerçek DELETE yerine `deleted: true` ile PATCH
  kullanılıyor); loading state ve "boş liste" ile "veri yolda"nın ayrı durumlar
  olması.
- **Yarın yapacağım iş:** Tam CRUD, form state ve detay drawer (Gün 3).
- **Commit mesajları:** feat(api): normalize every request failure into one
  error shape · feat(state): track loading and let errors be dismissed ·
  feat(ui): split the empty state into four and add retry · feat(ui): show a
  loading skeleton before the bundle lands · docs: document the API contract
  and day 2 changes · docs: add day 2 daily log

---

## Gün 1

- **Tarih:** 2026-08-02
- **Bugünkü hedef:** Vite kurulumu, mimari hazırlık ve v2 migration.
- **İzlediğim / okuduğum kaynaklar:**
- **Yaptığım değişiklikler:** Vite projesi kuruldu ve şablon artıkları
  (`counter.js`, `style.css`, `assets/*`, `public/icons.svg`) temizlendi.
  Katmanlı klasör yapısı oluşturuldu: `state/`, `components/`, `utils/`,
  `api/`, `styles/`. v2'nin tek dosyalık 887 satırlık `app.js`'i modüler
  yapıya taşındı: global `let`'ler (`tools`, `silinenAraclar`,
  `duzenlenenArac`) `state/store.js` içine kapatıldı ve aksiyon
  fonksiyonlarıyla dışarı açıldı; sayfa gövdesi `dashboard`, `filters`,
  `toolTable`, `toolForm` bileşenlerine bölündü; `style.css` üçe ayrıldı
  (`base` / `components` / `responsive`). Veri `data.json`'dan `db.json`'a
  taşındı (her kayda `id` + `deleted`), kalıcılık json-server'a geçti.
  18 birim testi yazıldı.
- **Değişen dosyalar:** index.html, db.json, package.json, src/main.js,
  src/constants.js, src/api/toolsApi.js, src/state/store.js,
  src/components/{dashboard,filters,toolTable,toolForm}.js,
  src/utils/{csv,filters,formatters,validators}.js,
  src/styles/{base,components,responsive}.css,
  tests/{csv,filters,validators}.test.js, ARCHITECTURE.md, USER_STORIES.md,
  CHANGELOG.md, TEST_REPORT.md
- **Claude Code'a verdiğim ana prompt:** "v2 projesini v3 Vite yapısına taşımak
  istiyorum. Sadece inceleme yap, dosya değiştirme. Hangi dosyalar taşınacak,
  Vite ile çalışması için ne değişmesi gerekecek, riskli noktalar neler? Önce
  plan ver, onayımı bekle."
- **Test ettiklerim:** `npm test` (filtreler, doğrulama, CSV), `npm run build`,
  json-server + Vite dev sunucusunun birlikte ayağa kalkması, store + API
  zincirinin uçtan uca çalışması (favori taşıma, yumuşak silme, geri yükleme
  çakışması, API kapalıyken hata mesajı).
- **Geçen testler:** `npm test` 18/18 geçti. `npm run build` hatasız
  (JS 14.67 kB, gzip 4.89 kB). json-server :3001 ve Vite :5173 çalışıyor.
  Store/API entegrasyon kontrolü 32/32 geçti.
- **Kalan sorunlar:** Tarayıcıda elle arayüz turu yapılmadı — görsel doğruluk,
  arama kutusunun odağını koruması, `confirm`/`alert` akışı, CSV indirmesi,
  konsolun temizliği ve dar ekran yerleşimi henüz gözle görülmedi
  (`TEST_REPORT.md` §5). Ayrıca v2 klasörünün içinde untracked bir Vite
  iskeleti duruyor, silinmeli.
- **Bugün öğrendiğim kavram:** ES modüllerinde canlı bağlama (imported `let`
  yeniden atanamaz) ve bunun store deseni gerektirmesi, tek yönlü veri akışı,
  abone/bildir (subscribe/notify) yapısı, kısmi yeniden çizimin odak
  korumadaki rolü, json-server ile REST kalıcılık, yumuşak silme (`deleted`).
- **Yarın yapacağım iş:** Mock REST API ve service katmanı (Gün 2).
- **Commit mesajları:** chore: drop Vite template scaffolding and set up the
  real entry HTML · feat(data): move the tool list onto json-server ·
  feat(utils): port v2 helpers as pure functions with unit tests ·
  feat(state): add the central store · feat(ui): rebuild the panel out of
  components · docs: record the v3 migration
