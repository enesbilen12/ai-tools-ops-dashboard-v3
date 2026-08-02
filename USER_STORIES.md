# AI Araçları Paneli — Kullanıcı Hikayeleri (User Stories)

Bu doküman, panelin (v2 / önceki sürüm) tüm mevcut özelliklerini **kullanıcı hikayesi
formatında** ve **kabul kriterleriyle** belgeler. Amaç, v3 yeniden yazımı için net bir
gereksinim (spec) referansı sağlamaktır.

- **Hikaye formatı:** `Bir <rol> olarak, <istek> istiyorum ki <fayda>.`
- **Kabul kriterleri:** Test edilebilir madde listesi (`- [ ]`).
- **Roller:** _Kullanıcı_ (paneli kullanan kişi). Kimlik doğrulama/çok kullanıcı yoktur;
  araçlar `db.json` içinde (json-server), tema ve favoriler tarayıcının
  `localStorage`'ında tutulur.

## Veri Modeli

Her araç (tool) aşağıdaki alanlara sahiptir. Kayıt kimliği json-server'ın ürettiği
`id` alanıdır; buna ek olarak **`name` de benzersiz olmak zorundadır** (harf duyarsız /
case-insensitive) — favoriler bu ada göre saklanır. Ayrıca yumuşak silme için
`deleted` (boolean) alanı vardır; ikisi de dışa aktarmaya dahil edilmez.

| Alan | Açıklama | Kural |
|------|----------|-------|
| `name` | Araç adı | Zorunlu, benzersiz (harf duyarsız) |
| `category` | Kategori | Zorunlu (Metin, Görsel, Kod, Tasarım, Ses/Müzik, Video, Verimlilik, Araştırma) |
| `purpose` | Amaç / açıklama | Zorunlu |
| `owner` | Sağlayıcı / geliştirici | Opsiyonel |
| `note` | Serbest not | Opsiyonel |
| `url` | Ana sayfa bağlantısı | Zorunlu, `^https?://` ile başlamalı |
| `subscription` | Abonelik tipi | `Ücretsiz` / `Freemium` / `Ücretli` |
| `status` | Durum | `Aktif` / `Deneme` / `Pasif` (boşsa `Aktif` sayılır) |

---

## US-01 — Araç Arama

**Bir kullanıcı olarak**, araçları metinle arayabilmek istiyorum ki aradığım aracı
listede hızlıca bulabileyim.

### Kabul Kriterleri
- [ ] Arama kutusuna (`#arama`) yazdıkça liste **anlık** (her tuş vuruşunda) filtrelenir.
- [ ] Arama `name`, `category` ve `purpose` alanlarında eşleşme arar (`owner` ve `note` dahil değildir).
- [ ] Arama **büyük/küçük harf duyarsızdır**.
- [ ] Arama, kategori ve durum filtreleriyle **VE (AND)** mantığıyla birlikte çalışır.
- [ ] Arama kutusu boşaltıldığında (diğer filtreler nötrse) tüm araçlar yeniden görünür.
- [ ] Hiçbir sonuç yoksa kullanıcıya boş/uygun bir durum gösterilir.

---

## US-02 — Kategoriye Göre Filtreleme

**Bir kullanıcı olarak**, araçları kategoriye göre filtreleyebilmek istiyorum ki yalnızca
ilgilendiğim türdeki araçları görebileyim.

### Kabul Kriterleri
- [ ] Kategori açılır menüsü (`#kategori`) seçenekleri **mevcut veriden dinamik** olarak üretilir.
- [ ] Menüde tüm araçları gösteren bir **"Tüm kategoriler"** (all) seçeneği bulunur.
- [ ] Bir kategori seçildiğinde yalnızca o kategorideki araçlar listelenir.
- [ ] Filtre, arama ve durum filtresiyle birlikte (AND) çalışır.
- [ ] **"Filtreleri Temizle"** butonu arama kutusunu, kategori ve durum menülerini varsayılana döndürür.

---

## US-03 — Duruma (Status) Göre Filtreleme

**Bir kullanıcı olarak**, araçları durumuna göre filtreleyebilmek istiyorum ki yalnızca
aktif / deneme / pasif araçları görebileyim.

### Kabul Kriterleri
- [ ] Durum açılır menüsü (`#durum`) şu sabit seçenekleri içerir: **Tümü**, `Aktif`, `Deneme`, `Pasif`.
- [ ] Bir durum seçildiğinde yalnızca o duruma sahip araçlar listelenir.
- [ ] `status` alanı boş/eksik olan araçlar **`Aktif`** kabul edilir.
- [ ] Durum filtresi, arama ve kategori filtresiyle birlikte (AND) çalışır.
- [ ] Filtre `change` olayında anında uygulanır.

---

## US-04 — Yeni Araç Ekleme

**Bir kullanıcı olarak**, panele yeni bir araç ekleyebilmek istiyorum ki kendi araç
listemi büyütebileyim.

### Kabul Kriterleri
- [ ] **"➕ Yeni Araç Ekle"** butonu ekleme formunu **açar/kapatır** (varsayılan gizli).
- [ ] Form tüm alanları içerir: name, category, purpose, owner, note, url, subscription, status.
- [ ] Kaydetmede doğrulama yapılır:
  - [ ] `name` zorunludur ve **benzersiz** olmalıdır (harf duyarsız).
  - [ ] `category` zorunludur.
  - [ ] `purpose` zorunludur.
  - [ ] `url` zorunludur ve **`https://` veya `http://`** ile başlamalıdır.
- [ ] Doğrulama hataları ilgili alanın **altında satır içi (inline)** gösterilir.
- [ ] Geçerli kayıtta araç listeye eklenir, **`localStorage`'a kaydedilir**, kategori menüsü güncellenir.
- [ ] Başarılı eklemeden sonra form temizlenir ve gizlenir, liste yeniden çizilir.
- [ ] `status` seçilmezse `Aktif` varsayılanı uygulanır.

---

## US-05 — Araç Düzenleme

**Bir kullanıcı olarak**, mevcut bir aracı düzenleyebilmek istiyorum ki bilgileri güncel
tutabileyim.

### Kabul Kriterleri
- [ ] Her araç kartında **"✏️ Düzenle"** butonu bulunur.
- [ ] Düzenle'ye tıklanınca o kart, **8 alanı da içeren satır içi (inline) düzenleme formuna** dönüşür.
- [ ] Kaydetmede ekleme ile **aynı doğrulama kuralları** uygulanır; benzersizlik kontrolünde
      aracın **kendi mevcut adı hariç** tutulur.
- [ ] Araç adı (`name`) değiştirilirse, o araca ait **favori kaydı yeni ada taşınır** (kaybolmaz).
- [ ] **"💾 Kaydet"** değişiklikleri uygular ve `localStorage`'a yazar.
- [ ] **"İptal"** değişiklikleri atar ve kartı normal görünüme döndürür.

---

## US-06 — Araç Silme ve Geri Yükleme

**Bir kullanıcı olarak**, bir aracı silebilmek (ve yanlışlıkla silersem geri
yükleyebilmek) istiyorum ki listemi güvenle düzenli tutabileyim.

### Kabul Kriterleri
- [ ] Her kartta **"🗑 Sil"** butonu bulunur ve silmeden önce bir **onay (`confirm`) diyaloğu** gösterilir.
- [ ] Silinen araç aktif listeden çıkarılır ancak **çöp listesine (soft delete)** taşınır — kalıcı olarak yok edilmez.
- [ ] Silinen araç varsa favorilerden de çıkarılır.
- [ ] Üst kısımda **"🗑 Silinen Araçlar (N)"** menüsü silinen öğe sayısını ve listesini gösterir.
- [ ] Silinen bir araca tıklanınca aktif listeye **geri yüklenir**.
- [ ] Aynı ada sahip aktif bir araç varsa geri yükleme **engellenir**.
- [ ] Silinen araçlar, sayfa yeniden yüklendiğinde varsayılan verilerden **tekrar geri gelmez**.

---

## US-07 — Favoriler

**Bir kullanıcı olarak**, araçları favori olarak işaretleyebilmek istiyorum ki sık
kullandıklarımı öne çıkarabileyim.

### Kabul Kriterleri
- [ ] Her kartta favori durumunu değiştiren bir **yıldız butonu (☆ / ★)** bulunur.
- [ ] Favoriler, `localStorage`'da **isim listesi** olarak saklanır (`ai-araclari-paneli:favoriler` anahtarı).
- [ ] Özet kutusundaki **"Favoriler" sayacı** favori sayısını güncel gösterir.
- [ ] Bir araç yeniden adlandırıldığında favori durumu **korunur** (yeni ada taşınır).
- [ ] Bir araç silindiğinde favorilerden **çıkarılır**.
- [ ] Favoriler oturumlar arasında (sayfa yenilense de) korunur.

---

## US-08 — Tema Değiştirme (Açık / Koyu)

**Bir kullanıcı olarak**, açık ve koyu tema arasında geçiş yapabilmek istiyorum ki
paneli göz konforuma göre kullanabileyim.

### Kabul Kriterleri
- [ ] **Tema butonu** (`#tema-btn`) açık (light) ve koyu (dark) tema arasında geçiş yapar.
- [ ] Tema, `<html>` öğesindeki **`data-theme`** özniteliği ile uygulanır.
- [ ] Seçilen tema `localStorage`'da (`ai-araclari-paneli:tema`) saklanır.
- [ ] Sayfa yeniden yüklendiğinde **kayıtlı tema geri yüklenir**.
- [ ] Buton etiketi aktif temaya göre değişir (ör. **"🌙 Koyu tema" ↔ "☀️ Açık tema"**).

---

## US-09 — CSV Dışa Aktarma

**Bir kullanıcı olarak**, araç listemi CSV dosyası olarak indirebilmek istiyorum ki
verimi yedekleyebileyim veya bir tabloda açabileyim.

### Kabul Kriterleri
- [ ] **"📤 CSV Dışa Aktar"** butonu bir `.csv` dosyası **indirir**.
- [ ] Dosya yalnızca **aktif araçları** içerir (silinenler hariç).
- [ ] Başlık satırı `CSV_COLUMNS` ile aynıdır; `id` ve `deleted` gibi **iç alanlar dışa aktarılmaz**.
- [ ] Virgül, çift tırnak veya satır sonu içeren hücreler **RFC 4180**'e göre kaçırılır.

> v3 değişikliği: v2'de bu özellik sayfa içi salt-okunur bir JSON textarea idi;
> v3'te gerçek bir CSV dosya indirmesine dönüştü.

---

## US-10 — Verilerin Kalıcılığı (json-server + localStorage)

**Bir kullanıcı olarak**, yaptığım değişikliklerin saklanmasını istiyorum ki
sayfayı kapatıp açtığımda verilerim kaybolmasın.

### Kabul Kriterleri
- [ ] Araçlar `db.json` içinde **json-server** üzerinden tutulur; ekleme/düzenleme/silme
      işlemleri REST çağrılarıyla (`POST` / `PATCH`) **anında kaydedilir**.
- [ ] Silme **yumuşaktır**: kayıt `db.json`'da kalır, yalnızca `deleted: true` olur.
- [ ] Yalnızca kullanıcıya özel UI tercihleri `localStorage`'da saklanır:
      favoriler (`ai-araclari-paneli:favoriler`) ve tema (`ai-araclari-paneli:tema`).
- [ ] json-server çalışmıyorsa boş ekran yerine sayfanın üstünde **anlaşılır bir hata
      mesajı** gösterilir.
- [ ] Tüm kullanıcı metni ekranda **güvenli biçimde (escape edilerek)** gösterilir (XSS koruması).

> v3 değişikliği: v2'de araçlar ve çöp kutusu `localStorage`'daydı ve ilk açılışta
> `data.json` ile birleştiriliyordu. v3'te tek kaynak `db.json` olduğu için o
> birleştirme mantığı kalktı.
