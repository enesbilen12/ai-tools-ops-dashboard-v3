# Günlük Çalışma Kaydı (Daily Log)

Her gün ne yaptığımı kısaca not aldığım dosya. En yeni gün en üstte.

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
