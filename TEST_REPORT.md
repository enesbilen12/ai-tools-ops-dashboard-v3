# Test Raporu — v3

Son güncelleme: 2026-08-08 · Dal: `enes/week-3-v3-sprint`

## 1. Birim testleri (vitest)

```
npx vitest run
```

| Dosya | Test | Sonuç |
|---|---|---|
| `tests/filters.test.js` | 7 | ✅ |
| `tests/validators.test.js` | 8 | ✅ |
| `tests/csv.test.js` | 5 | ✅ |
| `tests/toolsApi.test.js` | 14 | ✅ |
| `tests/sorting.test.js` | 11 | ✅ |
| `tests/pagination.test.js` | 18 | ✅ |
| `tests/urlState.test.js` | 12 | ✅ |
| `tests/debounce.test.js` | 4 | ✅ |
| **Toplam** | **79** | **✅ 79/79** |

Gün 3'te `validators.test.js`'e iki regresyon testi eklendi: benzersizlik kontrolünde
`currentId` metin (`"1"`), kayıt id'si sayı (`1`) geldiğinde aracın kendi adının hariç
tutulması ve başka bir aracın adının yine de reddedilmesi.

Gün 4'te dört yeni saf modül test edildi (34 → 79). Öne çıkanlar: sıralamada **Türkçe
harf sırası** (`Analiz · Çizim · İzleme · Şema · Zoom`), girdi dizisinin
değiştirilmediği, sayfa numarasının taşan/negatif/sayı-olmayan değerlerde sınırlanması,
URL'in gidiş-dönüşte (state → params → state) durumu koruması ve bozuk sorgunun
(`?page=abc&sort=xyz&status=Uydurma`) varsayılana düşmesi. `debounce` testleri
`vi.useFakeTimers()` ile çalışır.

`toolsApi.test.js`, `globalThis.fetch`'i taklit eder — çalışan bir json-server
gerektirmez. Kapsadığı: `normalizeError`'ın status 0 / 404 / 4xx / 5xx kolları,
`status`+`url` alanlarının Error üzerinde taşınması, her uç noktanın adresi ve
HTTP metodu, `softDeleteTool`'un `DELETE` değil `PATCH {deleted:true}` yollaması,
`204` yanıtında `json()`'un hiç çağrılmaması.

## 2. Üretim derlemesi

```
npm run build
```

✅ Hatasız. 25 modül dönüştürüldü.
Çıktı: `index.html` 1.11 kB · CSS 7.49 kB · JS 23.44 kB (gzip 7.71 kB).

## 3. Entegrasyon dumanı testi (store + api, tarayıcısız)

`src/state/store.js` gerçek bir json-server örneğine karşı Node üzerinde
çalıştırıldı (`localStorage` ve `document` asgari olarak taklit edildi).
Test, `db.json`'ın bir **kopyası** üzerinde koştu; gerçek veri dosyasına
dokunulmadı (koşu sonrası `diff` ile doğrulandı).

**32 kontrolün 32'si geçti.** Kapsanan davranışlar:

| Alan | Doğrulanan |
|---|---|
| Tema (US-08) | Varsayılan `light`, `toggleTheme` → `dark`, `<html data-theme>` yazılır, `localStorage`'a kaydedilir |
| Yükleme (US-10) | 18 araç json-server'dan geldi, hata yok, çöp kutusu boş |
| Filtreler (US-01/02/03) | Arama `name`+`category`+`purpose` üzerinde çalışır, kategori tam eşleşme ister, veriden 8 kategori üretilir |
| Ekleme (US-04) | Kayıt db'ye düştü, `status` boşsa `Aktif` varsayıldı, yeni kategori menüye yansıdı |
| Düzenleme (US-05) | Ad güncellendi, **favori yeni ada taşındı**, eski ad favoride kalmadı, düzenleme modu kapandı |
| Silme (US-06) | Aktif listeden çıktı, `deleted:true` ile çöpte, favoriden çıkarıldı |
| Geri yükleme (US-06) | Harf duyarsız ad çakışmasında **engellendi** ve mesaj döndü; çakışma kalkınca geri yüklendi |
| CSV (US-09) | `id`/`deleted` dışa aktarılmadı, satır sayısı doğru |
| Abonelik | Her aksiyon aboneleri bilgilendirdi |
| Hata yolu (R4) | `fetch` bozulduğunda `durum.error` "json-server çalışıyor mu?" mesajıyla doldu |

## 3b. Yükleme / hata / retry akışı (Gün 2, tarayıcısız)

Aynı yöntemle, Gün 2'de eklenen durumlar json-server'a karşı denendi.
**17 kontrolün 17'si geçti.**

| Senaryo | Doğrulanan |
|---|---|
| Başarılı yükleme | İlk bildirim `loading:true` + boş liste, son bildirim `loading:false` + 18 kayıt, hata yok |
| Yükleme başarısız | `finally` çalıştı (`loading:false`), mesaj "npm run api" ipucunu içeriyor, liste boşaltıldı |
| Boş durum ayrımı | Hata + boş liste → tablo "Tekrar dene" koşulunda; şerit aynı hatayı **tekrar etmiyor** |
| `clearError` | Şerit kapatma düğmesinin çağırdığı aksiyon hatayı siliyor |
| Retry | Sunucu geri gelince `loadTools()` 18 kaydı geri getirdi, hata temizlendi |
| Aksiyon hatası | `addTool` `false` döndü, hata yazıldı, **liste korundu** (rollback gerekmedi), şerit koşulu sağlandı, tablo hata ekranına düşmedi |

## 3c. Tam CRUD / geri alma akışı (Gün 3, tarayıcısız)

Aynı yöntemle, çalışan json-server'a karşı. **28 kontrolün 28'i geçti.**
Koşu sonunda eklenen kayıtlar `DELETE` ile temizlendi ve `db.json`'ın 18 kayıtlık
hâli korundu (`git checkout db.json` ile doğrulandı).

| Senaryo | Doğrulanan |
|---|---|
| `addTool` (POST) | Kayıt listeye girdi; `saving` **true → false** dalgası bildirimlerde görüldü |
| `editTool` (PATCH) | Alanlar güncellendi, başarıda `editingId` sıfırlandı |
| Yeniden adlandırma | Favori yeni ada taşındı (US-05/US-07) |
| `removeTool` | `undo` kaydı oluştu (`id`, `name`, `wasFavorite`), favori listeden çıktı, kayıt çöpe düştü |
| `undoDelete` | Kart **ve favori** geri geldi, `undo` temizlendi |
| `clearUndo` | `undo` temizlendi ama **kayıt çöpte kaldı** — hiçbir şey yok edilmedi |
| Ad çakışması | Aynı adla aktif kayıt varken geri yükleme reddedildi (`ok: false`) |
| Çekmece durumu | `openDrawer` / `closeDrawer` `drawerId`'yi doğru yazdı |
| Silinen kaydın açık ekranları | Silinen araç düzenleniyorsa/çekmecesi açıksa `editingId` ve `drawerId` sıfırlandı |

## 3d. Sıralama / sayfalama / URL akışı (Gün 4, tarayıcısız)

Aynı yöntemle, çalışan json-server'a karşı. **29 kontrolün 29'u geçti.**
Koşu sonunda silinen kayıtlar geri yüklendi; `db.json` 20 kayıtlık hâliyle korundu.

| Senaryo | Doğrulanan |
|---|---|
| Varsayılan durum | `sort='name-asc'`, `page=1`, `pageSize=12` |
| URL → store | Beş alan da uygulandı; **veri gelmeden sayfa sıfırlanmadı** |
| Veri gelince kırpma | `?page=2` ile açılan dar filtrede sayfa 1'e indi |
| Sıralama | A→Z ile Z→A birbirinin tersi; `durum.tools` sırası **bozulmadı** |
| Sayfalama | 2. sayfaya geçiş; taşan sayfa son sayfaya, negatif sayfa 1'e sıkıştı |
| Sayfa sıfırlama | `setFilter`, `setSort`, `resetFilters` sonrası `page=1` |
| Gereksiz sıfırlama yok | Aynı değeri yeniden atamak sayfayı korudu |
| store → URL | Varsayılan görünümde sorgu boş; `q`/`page` yazıldı, varsayılanlar yazılmadı |
| Tek sayfalık sonuç | `setPage(2)` 1'e sıkıştı, URL'e `page` girmedi |
| Son karttaki silme | Sayfa bir öncekine düştü, hiçbir zaman 0/negatif olmadı |

## 4. Dev sunucusu

`npm run api` + `npm run dev` birlikte ayağa kalktı.
`http://localhost:5173/` doğru `<title>` ve `lang="tr"` ile servis ediliyor;
`/src/main.js` Vite tarafından hatasız dönüştürülüyor.

## 5. Manuel tarayıcı turu

✅ **CRUD turu geçildi — 12/12** (2026-08-04, elle).
Kapsam ve adımlar: **[`CRUD_MATRIX.md`](CRUD_MATRIX.md)**. Böylece Gün 3'ün arayüz
tarafı (çekmecenin açılışı ve `Esc`/karartma ile kapanışı, odağın karta dönmesi,
toast'ın 5 saniye sonra kendiliğinden kapanması, butonların istek sırasında
kilitlenmesi, formun düzenleme moduna geçişi) gözle doğrulanmış oldu.

### Hâlâ gözle görülmeyenler

Aşağıdakiler CRUD matrisinin kapsamı dışında; Gün 1-2'den devrediyor ve yalnızca
kod/headless katmanda doğrulandı:

- Kart ızgarasının ve koyu temanın görsel doğruluğu
- Arama kutusunun yeniden çizimde odağını koruması
- CSV indirmesinin tarayıcıda gerçekten dosya olarak inmesi
- Konsolun hatasız olduğu
- Dar ekran (≤480px) yerleşimi
- "Yükleniyor…", "Tekrar dene" butonu ve hata şeridinin kapatma (×) düğmesinin
  ekranda göründüğü — mantıkları doğrulandı, çizimleri görülmedi

**Gün 4 arayüzü de gözle görülmedi:** arama debounce'ının kutuyu dondurmadığı,
sıralama menüsünün ekranda doğru sıraladığı, sayfalama çubuğunun görünürlüğü ve
buton kilitleri, sayfa değişiminde ızgaranın başına kaydırma, adres çubuğunun
gerçekten güncellendiği ve yenilemede görünümün geri geldiği — mantıkları
`§3d`'de doğrulandı, çizimleri görülmedi.

Bu maddeler için `npm run api` + `npm run dev` çalıştırılıp
`USER_STORIES.md`'deki US-01…US-14 kabul kriterleri elle geçilmelidir.
