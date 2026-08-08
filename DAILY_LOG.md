# Günlük Çalışma Kaydı (Daily Log)

Her gün ne yaptığımı kısaca not aldığım dosya. En yeni gün en üstte.

---

## Gün 4

- **Tarih:** 2026-08-08
- **Bugünkü hedef:** Sıralama, sayfalama ve adres çubuğunda saklanan görünüm.
- **İzlediğim / okuduğum kaynaklar:**
- **Yaptığım değişiklikler:** Önce saf fonksiyonlar yazıldı, sonra arayüze
  bağlandı. `utils/sorting.js`: dört sıralama seçeneği (Ad A→Z / Z→A, Kategori,
  Durum) ve **Türkçe harf sırası** (`localeCompare(…, 'tr')`) — varsayılan
  sıralamada `Çizim`/`Şema`/`İzleme` yanlış yere düşüyordu. Girdi dizisi
  değiştirilmiyor: `durum.tools` yerinde sıralansaydı çöp menüsünün ve CSV'nin
  sırası da sessizce değişirdi. `utils/pagination.js`: sayfa sayısı, sayfa
  numarasını geçerli aralığa sıkıştırma ve dilimleme. `utils/urlState.js`:
  görünüm ile `URLSearchParams` arasında iki yönlü çeviri; varsayılan değerler
  URL'e yazılmıyor, dışarıdan gelenler doğrulanıyor. `utils/debounce.js`: arama
  kutusu 300 ms bekliyor. Store'a `sort`, `page`, `pageSize` alanları,
  `setSort`/`setPage`/`applyUrlState` aksiyonları ve `visibleTools()` eklendi;
  filtre ve sıralama değişince sayfa 1'e dönüyor, silme ve yükleme sonrası
  sayfa kırpılıyor. Izgaranın altına sayfalama çubuğu (`components/pagination.js`)
  geldi. `main.js` açılışta URL'i okuyup ilk çizimden önce uyguluyor, sonrasında
  `replaceState` ile yalnızca sorgu gerçekten değiştiğinde yazıyor.
  `STATE_DIAGRAM.md` yazıldı.
- **Değişen dosyalar:** src/main.js, src/state/store.js,
  src/components/{filters,toolTable,dashboard}.js,
  src/components/pagination.js (yeni),
  src/utils/{sorting,pagination,urlState,debounce}.js (yeni),
  src/styles/components.css,
  tests/{sorting,pagination,urlState,debounce}.test.js (yeni),
  STATE_DIAGRAM.md (yeni), ARCHITECTURE.md, USER_STORIES.md, CHANGELOG.md,
  TEST_REPORT.md
- **Claude Code'a verdiğim ana prompt:** "Gün 4 görevleri: Store state şemasını
  genişlet (query, filters, sort, page, pageSize) · sortTools ve paginateTools
  saf fonksiyonlarını yaz, testlerini ekle · arama debounce (300ms), sıralama
  dropdown, sayfalama kontrolleri · filtre sonrası sayfa 1'e dönsün ·
  URLSearchParams ile arama/filtre/sayfa adres çubuğuna yansısın, yenileyince
  geri yüklensin · STATE_DIAGRAM.md oluştur. Önce mevcut durumu incele, plan ver,
  onayımı bekle."
- **Test ettiklerim:** `npm test` (dört yeni modülün birim testleri);
  `npm run build`; store + json-server duman testi (29 kontrol): URL'den okunan
  görünümün uygulanması, veri gelince taşan sayfanın kırpılması, sıralamanın
  `durum.tools`'u bozmaması, sayfa sınırları, filtre/sıralama sonrası sayfanın
  1'e dönmesi, aynı değeri yeniden atamanın sayfayı sıfırlamaması, store → URL
  yazımında varsayılanların atlanması, son sayfadaki son kart silininceki geri
  çekilme.
- **Geçen testler:** `npm test` **79/79** (Gün 3'teki 34'e 45 test eklendi).
  Duman testi **29/29**. `npm run build` hatasız (25 modül, JS 23.44 kB /
  gzip 7.71 kB). `db.json` 20 kayıtlık hâliyle korundu.
- **Kalan sorunlar:** **Gün 4'ün arayüzü tarayıcıda görülmedi** — debounce'ın
  kutuyu dondurmadığı, sıralama menüsünün ekranda doğru sıraladığı, sayfalama
  çubuğunun görünürlüğü/kilitleri ve adres çubuğunun gerçekten güncellenip
  yenilemede geri geldiği yalnızca mantık düzeyinde doğrulandı
  (`TEST_REPORT.md` §5). Gün 1-2'den devreden görsel maddeler (CSV indirmesi,
  konsolun temizliği, dar ekran yerleşimi) hâlâ açık. Ayrıca tarayıcının geri
  tuşu (`popstate`) dinlenmiyor: adres değişse de panel tepki vermiyor —
  bilinçli olarak kapsam dışı bırakıldı (`STATE_DIAGRAM.md` §5).
- **Bugün öğrendiğim kavram:** Türetilmiş durum (derived state) — `sort`/`page`
  gibi alanların listeyi değil, listenin **görüntüsünü** tarif etmesi ve zincirin
  (`filter → sort → paginate`) her adımının saf kalması; debounce ve bunun
  denetimli girdi (controlled input) ile çakışması (bekleyen çağrı varken kutuya
  geri yazmama); `replaceState` ile `pushState` farkı ve neden filtre
  değişikliklerinin geçmişe eklenmemesi gerektiği; `localeCompare` ile yerelleşmiş
  sıralama; dışarıdan gelen her değerin (URL) doğrulanması gerektiği.
- **Yarın yapacağım iş:** Gün 5 (planlanacak).
- **Commit mesajları:** feat(utils): add sorting with Turkish collation ·
  feat(utils): add pagination helpers · feat(utils): add url state translation
  and debounce · feat(state): track sort, page and url-restored view ·
  feat(ui): add sort menu, debounced search and pagination bar ·
  feat(app): sync the view with the address bar · docs: document day 4 state,
  sorting and pagination

---

## Gün 3

- **Tarih:** 2026-08-04
- **Bugünkü hedef:** Tam CRUD, form state ve detay drawer.
- **İzlediğim / okuduğum kaynaklar:**
- **Yaptığım değişiklikler:** Ekleme ve düzenleme **tek formda** birleştirildi.
  Önceden ekleme formu sayfanın üstünde, düzenleme formu kartın içindeydi ve
  aynı 8 alan iki yerde tekrar ediyordu; artık üstteki form `durum.editingId`'ye
  bakarak ekleme (POST) veya düzenleme (PATCH) modunda çalışıyor. Store'da
  `editingName` yerine **`editingId`** tutuluyor — yeniden adlandırmada referans
  ada bağlı kalmasın diye. Yazma isteği uçarken form/kart/çekmece butonlarını
  kilitleyen **`saving`** bayrağı eklendi (çift tık ikinci istek üretmiyor).
  Karta tıklayınca sağdan açılan salt-okunur **detay çekmecesi** (`toolDrawer.js`)
  yazıldı: sekiz alan + kartta hiç görünmeyen `id` + favori durumu; `×`, karartma
  ve `Esc` ile kapanıyor, odak geldiği karta dönüyor, klavyeyle de açılıyor.
  Silmeden önceki `confirm()` kaldırıldı; yerine 5 saniyelik **geri alma toast'ı**
  (`toast.js`) geldi. Geri alma yeni bir uç nokta getirmiyor, mevcut `restoreTool`'u
  (`PATCH {deleted:false}`) çağırıyor; süre dolunca hiçbir şey yok edilmiyor, kayıt
  çöp menüsünde duruyor. `removeTool` artık silinen kaydın favori olup olmadığını
  hatırlıyor ve geri alma favoriyi de geri getiriyor. `CRUD_MATRIX.md` yazıldı.
- **Değişen dosyalar:** src/state/store.js, src/utils/validators.js,
  src/components/{toolForm,toolTable,dashboard}.js,
  src/components/{toolDrawer,toast}.js (yeni),
  src/styles/{components,responsive}.css, tests/validators.test.js,
  CRUD_MATRIX.md (yeni), ARCHITECTURE.md, USER_STORIES.md, API_CONTRACT.md,
  CHANGELOG.md, TEST_REPORT.md
- **Claude Code'a verdiğim ana prompt:** "Gün 3 görevleri: Create/Edit modlarını
  tek formda birleştir (editingId store'da) · POST ve PATCH akışlarını tamamla,
  butonları istek sırasında disable et · Karta tıklayınca sağdan drawer açılsın ·
  Silme sonrası 5 saniyelik undo toast ekle · CRUD_MATRIX.md oluştur, 12 manuel
  senaryo listele. Önce mevcut durumu incele, plan ver, onayımı bekle."
- **Test ettiklerim:** `npm test`; `npm run build`; store + json-server duman
  testi (28 kontrol): `saving` dalgası, POST/PATCH akışları, `undo` kaydının
  favoriyi hatırlaması, `undoDelete`'in kartı **ve** favoriyi geri getirmesi,
  `clearUndo`'nun kaydı yok etmemesi, ad çakışmasında geri almanın engellenmesi,
  silinen kaydın açık çekmecesinin/formunun kapanması.
- **Geçen testler:** `npm test` **34/34** geçti (Gün 2'deki 32'ye iki regresyon
  testi eklendi). Duman testi **28/28**. Tarayıcıda elle CRUD turu **12/12**
  (`CRUD_MATRIX.md`). `npm run build` hatasız (20 modül, JS 19.39 kB / gzip 6.37 kB).
- **Kalan sorunlar:** **Tarayıcı turu yapıldı: `CRUD_MATRIX.md`'deki 12 senaryonun
  12'si de geçti** — çekmecenin açılışı, `Esc`/karartma ile kapanışı, odak dönüşü,
  toast'ın 5 saniye sonra kendiliğinden kapanması ve butonların istek sırasında
  kilitlenmesi gözle doğrulandı. Gün 1-2'den devreden görsel maddeler (CSV
  indirmesi, konsolun temizliği, dar ekran yerleşimi, arama kutusu odağı) hâlâ
  açık (`TEST_REPORT.md` §5). Ayrıca `npm run api` ilk yazmada `db.json`'ı kendi biçimine
  çeviriyor (id'leri metne, `$schema` ekliyor); bu koşuda geri alındı ama her
  API kullanımında tekrar edecek — bir kez kabul edip commit'lemek gerekebilir.
- **Bugün öğrendiğim kavram:** Tek formun iki modda çalışması (create/edit) ve
  modun **id** ile tutulması; yeniden çizimde girdiyi ezmemek için "yalnızca mod
  değiştiğinde doldur" deseni; `saving` gibi bir uçuş bayrağıyla çift gönderimi
  engelleme; yumuşak silme üzerine kurulu geri alma (undo) akışı ve toast
  sayacının store'da değil bileşende durmasının nedeni (store yan etkisiz kalsın);
  `role="dialog"` / `aria-modal` ve odak dönüşü gibi erişilebilirlik gerekleri.
- **Yarın yapacağım iş:** Gün 4 (planlanacak).
- **Commit mesajları:** fix(validators): compare ids as text so editing never
  hits its own name · feat(state): track editing id, drawer, saving and undo ·
  feat(ui): merge create and edit into one form, add drawer and undo toast ·
  style: dress the drawer, toast and locked buttons · chore(data): accept
  json-server's db.json format, add Mistral and Qwen · docs: document the day 3
  CRUD flow · docs: add day 3 daily log

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
