# Mimari (Architecture)

AI Araçları Paneli v3 — modüler vanilla JavaScript mimarisi. Uygulama katmanlara
ayrılmıştır: **bileşenler (components)** arayüzü çizer, **store** merkezi durumu tutar,
**api** kalıcılığı yönetir ve **utils** saf yardımcı fonksiyonları barındırır.

## Modül Sorumlulukları

Her modülün tek cümlelik sorumluluğu:

### Giriş
- **`src/main.js`** — Uygulamayı başlatır; store'u kurar, ilk veriyi yükler ve `dashboard` bileşenini DOM'a bağlar.
- **`src/constants.js`** — Sabit değerleri tutar (kategoriler, abonelik/durum seçenekleri, API adresi, localStorage anahtarları).

### API Katmanı
- **`src/api/toolsApi.js`** — `db.json` ile HTTP üzerinden konuşarak araçları okuma/ekleme/güncelleme/silme (CRUD) işlemlerini yapar; her başarısızlığı `normalizeError` ile `status` + `url` taşıyan tek bir hata biçimine sokar.

> Uç noktalar, kayıt şeması, yumuşak silme sözleşmesi ve hata biçimi için:
> **[`API_CONTRACT.md`](API_CONTRACT.md)**.

### Durum (State)
- **`src/state/store.js`** — Uygulamanın tek doğruluk kaynağı olan durumu (araçlar, filtreler, favoriler, tema, `editingId`, `drawerId`, `loading`, `saving`, `undo`, `error`) tutar ve değişiklikte abone bileşenleri bilgilendirir.

### Bileşenler (Components)
- **`src/components/dashboard.js`** — Diğer tüm bileşenleri bir araya getiren ana kapsayıcı; store'a abone olur ve genel yerleşimi çizer.
- **`src/components/filters.js`** — Arama kutusu ile kategori ve durum filtrelerini çizer, kullanıcı girdisini store'a iletir.
- **`src/components/toolTable.js`** — Filtrelenmiş araç listesini kart ızgarası olarak çizer; kart aksiyonlarını (favori, düzenle, sil) ve kart gövdesine tıklamayı (detay çekmecesini açar) olay delegasyonuyla yürütür.
- **`src/components/toolForm.js`** — **Tek** araç formunu üretir; `durum.editingId`'ye göre ekleme (POST) veya düzenleme (PATCH) modunda çalışır, girdiyi doğrular ve isteği store'a gönderir.
- **`src/components/toolDrawer.js`** — Sağdan açılan salt-okunur detay çekmecesi; bir aracın tüm alanlarını (`id` dahil) gösterir ve favori/düzenle/sil kısayollarını sunar.
- **`src/components/toast.js`** — Silme sonrası 5 saniyelik "geri al" şeridi; süre dolunca yalnızca kısayol biter, kayıt çöp menüsünde durmaya devam eder.

> **Form tektir.** v3 Gün 3'e kadar ekleme formu sayfanın üstünde, düzenleme
> formu kartın içindeydi; aynı 8 alan iki yerde tekrar ediyordu. Artık düzenleme
> de üstteki formda açılır (`editingId`), kart içi form kaldırıldı.
>
> **Silmede `confirm()` yoktur.** Güvence, geri alınabilir toast'tır. Geri
> yükleme çakışması gibi uyarılar `alert()` yerine toast/şerit üzerinden verilir;
> API hataları `dashboard`'un üstündeki `.durum-mesaji` şeridinde görünür.

### Yardımcılar (Utils — saf fonksiyonlar)
- **`src/utils/validators.js`** — Form alanlarını doğrular (zorunlu alanlar, benzersiz ad, `^https?://` url kuralı) ve hata mesajlarını üretir.
- **`src/utils/filters.js`** — Arama metnine ve seçili kategori/durum filtrelerine göre araç listesini süzer.
- **`src/utils/csv.js`** — Araç listesini CSV metnine dönüştürür ve dosya olarak indirir.
- **`src/utils/formatters.js`** — Görüntüleme için metinleri biçimlendirir (rozet etiketleri, güvenli/escape edilmiş metin, tarih vb.).

## Veri Akışı (Data Flow)

Tek yönlü akış: kullanıcı aksiyonu yukarıdan aşağıya bir isteğe dönüşür, veri değişikliği
ise store üzerinden geri yayılarak arayüzü yeniden çizer.

```
Kullanıcı aksiyonu
      │  (tık / yazma / gönderme)
      ▼
Component  (filters, toolForm, toolTable)
      │  • girdiyi okur, utils/validators ile doğrular
      │  • store aksiyonunu çağırır
      ▼
Store  (state/store.js)
      │  • durumu günceller (iyimser/optimistic DEĞİL: istek dönmeden yazmaz)
      │  • kalıcılık için api'yi çağırır
      ▼
API  (api/toolsApi.js)
      │  • HTTP CRUD isteği (GET/POST/PATCH — silme de PATCH'tir, DELETE yok)
      ▼
db.json  (json-server)
      │  • kalıcı veri
      ▼
Yanıt → Store durumu kesinleşir → abone Component'ler yeniden çizilir → Kullanıcı sonucu görür
```

### Adım adım
1. **Kullanıcı** bir aksiyon yapar (ör. yeni araç ekler, arama yazar, favori işaretler).
2. İlgili **component** girdiyi alır; gerekiyorsa `utils/validators` ve `utils/filters`
   ile işler, ardından **store**'daki bir aksiyonu çağırır.
3. **Store** merkezi durumu günceller ve kalıcı bir değişiklikse **api**'yi çağırır.
4. **api** (`toolsApi.js`) `db.json` üzerinde `json-server` aracılığıyla CRUD işlemini yürütür.
5. İşlem tamamlanınca store durumu kesinleşir ve tek abone olan `dashboard`
   **yeniden çizer**. Sayfanın tamamı silinmez; yalnızca değişen parçalar
   (özet sayıları, tema etiketi, çöp menüsü, durum mesajı, kart listesi)
   güncellenir — aksi hâlde her tuş vuruşunda arama kutusu odağı kaybederdi.

> Notlar
> - **Bileşenler doğrudan api ile konuşmaz**; her zaman store üzerinden geçer.
> - **utils** modülleri saf ve yan etkisizdir (test edilebilir; `tests/` altında birim testleri vardır).
> - Kalıcılık `db.json` + `json-server` iledir; tema/favori gibi bazı UI tercihleri
>   `constants.js`'deki anahtarlarla `localStorage`'da da tutulabilir.
