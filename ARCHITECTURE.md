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
- **`src/api/toolsApi.js`** — `db.json` ile HTTP üzerinden konuşarak araçları okuma/ekleme/güncelleme/silme (CRUD) işlemlerini yapar.

### Durum (State)
- **`src/state/store.js`** — Uygulamanın tek doğruluk kaynağı olan durumu (araçlar, filtreler, favoriler, tema) tutar ve değişiklikte abone bileşenleri bilgilendirir.

### Bileşenler (Components)
- **`src/components/dashboard.js`** — Diğer tüm bileşenleri bir araya getiren ana kapsayıcı; store'a abone olur ve genel yerleşimi çizer.
- **`src/components/filters.js`** — Arama kutusu ile kategori ve durum filtrelerini çizer, kullanıcı girdisini store'a iletir.
- **`src/components/toolTable.js`** — Filtrelenmiş araç listesini tablo/kart olarak çizer, satır aksiyonlarını (favori, düzenle, sil) yayar.
- **`src/components/toolForm.js`** — Araç ekleme/düzenleme formunu çizer, girdiyi doğrular ve kaydetme isteğini store'a gönderir.
- **`src/components/toolDrawer.js`** — Bir aracın ayrıntılarını/düzenleme panelini yan çekmece (drawer) olarak açıp kapatır.
- **`src/components/toast.js`** — Geçici bildirim (başarı/hata) mesajlarını ekranda gösterir.

### Yardımcılar (Utils — saf fonksiyonlar)
- **`src/utils/validators.js`** — Form alanlarını doğrular (zorunlu alanlar, benzersiz ad, `^https?://` url kuralı) ve hata mesajlarını üretir.
- **`src/utils/filters.js`** — Arama metnine ve seçili kategori/durum filtrelerine göre araç listesini süzer.
- **`src/utils/csv.js`** — Araç listesini dışa aktarma formatına (CSV/JSON metni) dönüştürür.
- **`src/utils/formatters.js`** — Görüntüleme için metinleri biçimlendirir (rozet etiketleri, güvenli/escape edilmiş metin, tarih vb.).

## Veri Akışı (Data Flow)

Tek yönlü akış: kullanıcı aksiyonu yukarıdan aşağıya bir isteğe dönüşür, veri değişikliği
ise store üzerinden geri yayılarak arayüzü yeniden çizer.

```
Kullanıcı aksiyonu
      │  (tık / yazma / gönderme)
      ▼
Component  (filters, toolForm, toolTable …)
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
5. İşlem tamamlanınca store durumu kesinleşir, aboneleri (dashboard/toolTable/filters)
   **yeniden çizilir** ve gerekiyorsa `toast` ile kullanıcıya geri bildirim gösterilir.

> Notlar
> - **Bileşenler doğrudan api ile konuşmaz**; her zaman store üzerinden geçer.
> - **utils** modülleri saf ve yan etkisizdir (test edilebilir; `tests/` altında birim testleri vardır).
> - Kalıcılık `db.json` + `json-server` iledir; tema/favori gibi bazı UI tercihleri
>   `constants.js`'deki anahtarlarla `localStorage`'da da tutulabilir.
