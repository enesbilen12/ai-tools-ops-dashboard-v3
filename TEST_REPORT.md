# Test Raporu — v3

Son güncelleme: 2026-08-03 · Dal: `enes/week-3-v3-sprint`

## 1. Birim testleri (vitest)

```
npx vitest run
```

| Dosya | Test | Sonuç |
|---|---|---|
| `tests/filters.test.js` | 7 | ✅ |
| `tests/validators.test.js` | 6 | ✅ |
| `tests/csv.test.js` | 5 | ✅ |
| `tests/toolsApi.test.js` | 14 | ✅ |
| **Toplam** | **32** | **✅ 32/32** |

`toolsApi.test.js`, `globalThis.fetch`'i taklit eder — çalışan bir json-server
gerektirmez. Kapsadığı: `normalizeError`'ın status 0 / 404 / 4xx / 5xx kolları,
`status`+`url` alanlarının Error üzerinde taşınması, her uç noktanın adresi ve
HTTP metodu, `softDeleteTool`'un `DELETE` değil `PATCH {deleted:true}` yollaması,
`204` yanıtında `json()`'un hiç çağrılmaması.

## 2. Üretim derlemesi

```
npm run build
```

✅ Hatasız. 18 modül dönüştürüldü.
Çıktı: `index.html` 0.61 kB · CSS 5.05 kB · JS 15.84 kB (gzip 5.27 kB).

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

## 4. Dev sunucusu

`npm run api` + `npm run dev` birlikte ayağa kalktı.
`http://localhost:5173/` doğru `<title>` ve `lang="tr"` ile servis ediliyor;
`/src/main.js` Vite tarafından hatasız dönüştürülüyor.

## 5. Yapılmayanlar

⚠️ **Tarayıcıda elle arayüz turu yapılmadı** — bu oturumda tarayıcı otomasyonu
kullanılamadı. Aşağıdakiler yalnızca kod ve headless katmanda doğrulandı,
gözle görülmedi:

- Kart ızgarasının ve koyu temanın görsel doğruluğu
- Arama kutusunun yeniden çizimde odağını koruması
- `confirm()` / `alert()` diyaloglarının akışı
- CSV indirmesinin tarayıcıda gerçekten dosya olarak inmesi
- Konsolun hatasız olduğu
- Dar ekran (≤480px) yerleşimi
- "Yükleniyor…", "Tekrar dene" butonu ve hata şeridinin kapatma (×) düğmesinin
  ekranda göründüğü — mantıkları doğrulandı, çizimleri görülmedi

Bu maddeler için `npm run api` + `npm run dev` çalıştırılıp
`USER_STORIES.md`'deki US-01…US-10 kabul kriterleri elle geçilmelidir.
