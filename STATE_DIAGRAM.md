# Durum Şeması (State Diagram)

Panelin tek doğruluk kaynağı `src/state/store.js` içindeki kapalı `durum` nesnesidir.
Bu belge o nesnenin alanlarını, listenin hangi aşamalardan geçip ekrana geldiğini ve
durumun adres çubuğuyla nasıl senkron kaldığını anlatır.

Mimarinin geneli için: [`ARCHITECTURE.md`](ARCHITECTURE.md) ·
API sözleşmesi için: [`API_CONTRACT.md`](API_CONTRACT.md)

## 1. Durum alanları

| Alan | Tip | Varsayılan | Kim yazar | URL'e yansır |
|---|---|---|---|---|
| `tools` | dizi | `[]` | `loadTools`, `addTool`, `editTool`, `removeTool`, `restoreTool` | — |
| `filters.search` | metin | `''` | `setFilter` (arama kutusu, **300 ms gecikmeli**) | `q` |
| `filters.category` | metin | `'all'` | `setFilter` (menü + kategori hizalaması) | `category` |
| `filters.status` | metin | `'all'` | `setFilter` (menü) | `status` |
| `sort` | metin | `'name-asc'` | `setSort` | `sort` |
| `page` | sayı | `1` | `setPage`, filtre/sıralama sıfırlamaları, silme sonrası kırpma | `page` |
| `pageSize` | sayı | `12` | — (sabit) | ✗ |
| `favorites` | dizi | `[]` | `toggleFavorite`, `renameFavorite`, `removeTool`, `undoDelete` | ✗ (localStorage) |
| `theme` | metin | `'light'` | `applyTheme`, `toggleTheme` | ✗ (localStorage) |
| `editingId` | id \| null | `null` | `setEditing`, `editTool` (başarıda sıfırlar) | ✗ (geçici) |
| `drawerId` | id \| null | `null` | `openDrawer`, `closeDrawer` | ✗ (geçici) |
| `loading` | boolean | `false` | `loadTools` | ✗ |
| `saving` | boolean | `false` | dört yazma aksiyonu | ✗ |
| `undo` | nesne \| null | `null` | `removeTool`, `undoDelete`, `clearUndo` | ✗ |
| `error` | metin | `''` | tüm API aksiyonları, `clearError` | ✗ |

**URL'e yalnızca "görünümü" tarif eden alanlar yazılır.** Tema ve favoriler kullanıcıya
özeldir ve `localStorage`'da durur; düzenleme/çekmece/yükleme durumu ise geçicidir —
paylaşılan bir bağlantının karşı tarafta form açması istenmez.

## 2. Listenin ekrana gelene kadarki yolu

```
durum.tools                     db.json'daki HER kayıt (silinenler dahil)
      │
      ▼  deleted !== true
activeTools()                   çöp kutusu dışarıda kalır
      │
      ▼  filterTools(…, durum.filters)          utils/filters.js
   (arama + kategori + durum, AND mantığı)
      │
      ▼  sortTools(…, durum.sort)               utils/sorting.js
   (Türkçe harf sırası; girdi dizisi değişmez)
      │
      ├──────────────► visibleTools()  ◄── store'un dışa açtığı nokta
      │                     │
      │                     ├─► pagination.js : toplam sayı + sayfa sayısı
      │                     │
      ▼                     ▼
  paginateTools(…, durum.page, durum.pageSize)  utils/pagination.js
      │
      ▼
  toolTable : yalnızca geçerli sayfanın kartları çizilir
```

**Sayfalama neden `visibleTools()` içinde değil?** Sayfalama çubuğunun toplam sonuç
sayısını bilmesi gerekiyor (`Sayfa 2 / 5 · 47 araç`). Kesme işlemi bileşende yapılınca
hem tablo hem çubuk aynı filtrelenmiş listeyi görüyor.

**Çöp menüsü ve CSV bu zincirden geçmez.** `deletedTools()` doğrudan `tools`'a bakar,
CSV dışa aktarma ise `activeTools()`'u kullanır — dışa aktarılan dosya ekrandaki
sayfayla değil, tüm aktif listeyle aynıdır.

## 3. Aksiyon → durum → yeniden çizim

```
Kullanıcı                                    Bileşen
   │  tık / yazma / gönderme                    │
   └───────────────────────────────────────────►│
                                                │ store aksiyonunu çağırır
                                                ▼
                              ┌──────────────────────────────┐
                              │  store.js                    │
                              │   • durumu günceller         │
                              │   • gerekiyorsa api'yi bekler│
                              │   • bildir()  ◄── TEK çıkış  │
                              └───────────────┬──────────────┘
                                              │
                                              ▼
                              dashboard.ciz(durum)  (tek abone)
                                              │
        ┌──────────┬──────────┬───────────────┼──────────┬──────────┐
        ▼          ▼          ▼               ▼          ▼          ▼
     filters   toolForm   toolTable      pagination  toolDrawer   toast
                          .update(durum) — her biri kendi parçasını çizer
```

`bildir()` durumu değiştiren **her** aksiyonun sonunda çağrılır; bileşenler tek tek
abone olmaz, yalnızca `dashboard` abone olur ve alt bileşenlerin `update`'ini sırayla
çağırır. Bu yüzden `update` fonksiyonları **sık** çalışır: her biri "yalnızca gerçekten
değişeni yaz" kuralına uyar (kategori menüsü, çekmece içeriği, form alanları ve URL
yazımı bu yüzden son değerlerini saklar).

## 4. Sayfa sıfırlama kuralları

`page`, sonuç listesinin dışında kalmayacak biçimde korunur:

| Olay | `page` ne olur | Neden |
|---|---|---|
| `setFilter(...)` — değer **gerçekten** değişirse | `1` | Daralan sonuçta 3. sayfa boş kalabilir |
| `setFilter(...)` — aynı değer atanırsa | değişmez | Gereksiz sıfırlama ve yeniden çizim olmasın |
| `resetFilters()` | `1` | Aynı gerekçe |
| `setSort(...)` — değer değişirse | `1` | Sıralama değişince 2. sayfadaki kartlar başka kayıtlar olur |
| `setPage(n)` | `clampPage` ile `1..son` arası | Kullanıcı ya da URL sınır dışına çıkamaz |
| `loadTools()` bittiğinde | kırpılır | URL'den gelen `?page=99` veri gelmeden doğrulanamıyordu |
| `removeTool(...)` başarılıysa | kırpılır | Son sayfadaki tek kart silinince o sayfa artık yok |

`paginateTools` ayrıca **çizim anında** da kırpar: durumdaki sayfa bir an için eskise
bile ekranda boş ızgara değil, mevcut son sayfa görünür.

## 5. Adres çubuğu senkronu

```
   AÇILIŞTA (bir kez)                    HER DEĞİŞİMDE
   ─────────────────                     ──────────────
   window.location.search                    durum
          │                                    │
          ▼  paramsToState()                   ▼  stateToParams()
   { filters, sort, page }                URLSearchParams
          │  (doğrulanmış)                     │
          ▼  applyUrlState()                   ▼  sorgu değiştiyse
        durum  ──► ilk çizim            history.replaceState()
```

**Okuma** `main.js`'te `mountDashboard()`'dan **önce** yapılır; aksi hâlde panel önce
varsayılan listeyi çizer, sonra filtreye atlardı.

**Yazma** `replaceState` iledir, `pushState` değil: her filtre değişikliği geçmişe bir
adım eklerse kullanıcı paneli terk etmek için onlarca kez geri basmak zorunda kalır.
Yazma yalnızca üretilen sorgu dizisi **gerçekten değiştiğinde** yapılır — `bildir()`
favori işaretleme, çekmece açma gibi görünümle ilgisiz aksiyonlarda da çalışıyor.

**Varsayılan değerler yazılmaz.** Temiz açılışta adres çubuğunda hiç sorgu parametresi
olmaz; `?q=&category=all&sort=name-asc&page=1` gibi bir gürültü kalmaz.

**Gelen değerler doğrulanır.** URL elle düzenlenebilir: tanınmayan `sort`, listede
olmayan `status`, sayı olmayan `page` sessizce varsayılana düşer.

### İki incelik

- **Kategori doğrulanmaz.** Geçerli kategoriler veriden üretilir ve URL okunduğunda
  `tools` henüz boştur. Bu yüzden `paramsToState` kategoriyi olduğu gibi geçirir;
  hizalamayı `filters.js` **veri geldikten sonra** (`durum.tools.length > 0`) yapar.
  Bu koşul olmasaydı `?category=Metin` daha ilk çizimde `all`'a düşerdi.
- **`popstate` dinlenmiyor.** Tarayıcının geri tuşu adres çubuğunu değiştirir ama panel
  buna tepki vermez (`replaceState` kullanıldığı için zaten yeni geçmiş girdisi
  oluşmaz). İleri/geri ile filtre gezinmesi bu turun kapsamı dışında.
