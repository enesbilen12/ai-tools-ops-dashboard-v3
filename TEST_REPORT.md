# Test Raporu — v3

Tarih: 2026-08-02 · Dal: `enes/week-3-v3-sprint`

## 1. Birim testleri (vitest)

```
npx vitest run
```

| Dosya | Test | Sonuç |
|---|---|---|
| `tests/filters.test.js` | 7 | ✅ |
| `tests/validators.test.js` | 6 | ✅ |
| `tests/csv.test.js` | 5 | ✅ |
| **Toplam** | **18** | **✅ 18/18** |

## 2. Üretim derlemesi

```
npm run build
```

✅ Hatasız. 18 modül dönüştürüldü.
Çıktı: `index.html` 0.61 kB · CSS 4.69 kB · JS 14.67 kB (gzip 4.89 kB).

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

Bu maddeler için `npm run api` + `npm run dev` çalıştırılıp
`USER_STORIES.md`'deki US-01…US-10 kabul kriterleri elle geçilmelidir.
