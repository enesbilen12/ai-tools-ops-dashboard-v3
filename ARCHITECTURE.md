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
- **`src/state/store.js`** — Uygulamanın tek doğruluk kaynağı olan durumu (araçlar, filtreler, favoriler, tema, `loading`, `error`) tutar ve değişiklikte abone bileşenleri bilgilendirir.

### Bileşenler (Components)
- **`src/components/dashboard.js`** — Diğer tüm bileşenleri bir araya getiren ana kapsayıcı; store'a abone olur ve genel yerleşimi çizer.
- **`src/components/filters.js`** — Arama kutusu ile kategori ve durum filtrelerini çizer, kullanıcı girdisini store'a iletir.
- **`src/components/toolTable.js`** — Filtrelenmiş araç listesini kart ızgarası olarak çizer, kart aksiyonlarını (favori, düzenle, sil, kaydet, iptal) olay delegasyonuyla yürütür.
- **`src/components/toolForm.js`** — Hem üstteki araç ekleme formunu hem de kart içi (inline) düzenleme formunu üretir; girdiyi doğrular ve kaydetme isteğini store'a gönderir.

> Ayrı bir yan çekmece (drawer) ve toast bileşeni yoktur: düzenleme kartın
> kendi içinde açılır, onay/uyarı için `confirm()` ve `alert()` kullanılır,
> API hataları ise `dashboard`'un üstündeki `.durum-mesaji` şeridinde görünür.

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
      │  • durumu günceller (iyimser/optimistic olabilir)
      │  • kalıcılık için api'yi çağırır
      ▼
API  (api/toolsApi.js)
      │  • HTTP CRUD isteği (GET/POST/PUT/DELETE)
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
