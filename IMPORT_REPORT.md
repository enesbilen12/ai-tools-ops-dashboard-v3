# İçe Aktarma Raporu (Import Report)

Panele dışarıdan JSON ile araç eklemenin sözleşmesi: dosyanın nasıl görünmesi
gerektiği, hangi kaydın neden reddedildiği ve kayıtların sunucuya nasıl yazıldığı.

İlgili: [`API_CONTRACT.md`](API_CONTRACT.md) · [`STATE_DIAGRAM.md`](STATE_DIAGRAM.md)

## 1. Dosya biçimi

İki kök biçim kabul edilir:

```json
[ { "name": "…", "category": "…", … } ]
```

```json
{ "tools": [ { "name": "…", … } ] }
```

İkincisi hem **panelden indirilen JSON'un** hem de `db.json`'ın biçimidir — ikisi de
doğrudan kullanılabilir.

| Alan | Zorunlu | Kural |
|---|---|---|
| `name` | ✅ | Aktif araçlar arasında benzersiz (harf duyarsız) |
| `category` | ✅ | Serbest metin |
| `purpose` | ✅ | Serbest metin |
| `url` | ✅ | `http://` veya `https://` ile başlamalı |
| `owner` | — | Serbest metin |
| `note` | — | Serbest metin |
| `subscription` | — | `Ücretsiz` / `Freemium` / `Ücretli`; tanınmazsa `Ücretsiz` |
| `status` | — | `Aktif` / `Deneme` / `Pasif`; tanınmazsa `Aktif` |

**`id` ve `deleted` dosyada bulunmaz.** Bulunsalar bile atılır: `id`'yi json-server
üretir, `deleted` ise panelin kendi çöp kutusu işaretidir. Tanınmayan diğer alanlar da
sessizce atılır — yalnızca yukarıdaki sekiz alan geçer.

### Dışa aktar → içe aktar (round trip)

`📤 JSON` düğmesiyle indirilen dosya **doğrudan geri içe aktarılabilir**; dışa aktarma
tam olarak bu sekiz alanı yazar. Yalnız şunu unutmayın: aynı dosyayı silmeden geri
almaya çalışırsanız her kayıt "bu ad zaten var" diyerek reddedilir — bu bir arıza değil,
çift kayıt oluşmasını engelleyen kuraldır.

**Favoriler dışa/içe aktarılmaz.** Favoriler araç adına göre `localStorage`'da tutulur
(US-07), `db.json`'da değil. Aynı adla geri aktarılan bir araç, tarayıcıda favori kaydı
duruyorsa favori olarak görünmeye devam eder.

## 2. Doğrulama

Kurallar **ekleme formuyla birebir aynıdır** — ikisi de `utils/validators.js`'teki
`validateForm`'u kullanır. İçe aktarmaya özgü tek ek kural, dosyanın kendi içindeki
tekrarların yakalanmasıdır.

| Önizlemedeki sebep | Anlamı |
|---|---|
| `Ad alanı zorunludur.` | `name` boş ya da yok |
| `"X" adlı bir araç zaten var.` | Aktif listede aynı ad var **veya** aynı ad dosyada daha önce geçti |
| `Kategori alanı zorunludur.` | `category` boş |
| `Kullanım amacı zorunludur.` | `purpose` boş |
| `URL alanı zorunludur.` | `url` boş |
| `URL http:// veya https:// ile başlamalı.` | Şema eksik ya da farklı (`ftp://`, `www.` vb.) |
| `Kayıt bir nesne değil.` | Dizide metin/sayı/`null` gibi bir öğe var |

Dosya hiç okunamazsa (bozuk JSON, dizi olmayan kök, boş dizi) tek bir hata gösterilir ve
hiçbir kayıt işlenmez.

**Çakışma politikası: atla.** Adı çakışan kayıt eklenmez ve **mevcut kaydın üzerine
yazılmaz**. Bir aracı güncellemek istiyorsanız panelden düzenleyin; içe aktarma yalnızca
yeni kayıt ekler.

Benzersizlik **aktif** araçlara karşı denetlenir. Çöp kutusundaki bir araçla aynı adı
taşıyan kayıt eklenebilir — o kayıt listede görünmediği için çakışma sayılmaz. (Bu
durumda çöpteki aracı geri yüklemek US-06 kuralıyla engellenir.)

## 3. Kayıtlar nasıl yazılır

**json-server'da toplu ekleme uç noktası yoktur.** Her kayıt ayrı bir
`POST /tools` isteğidir ve istekler **sırayla** gönderilir:

- Paralel gönderim json-server'ın id üretimini yarıştırır.
- Sıralı gönderim ilerlemenin raporlanmasını sağlar (`12 / 47 eklendi`).

Durumdaki karşılığı `importProgress = { done, total }`; işlem bitince `null` olur.

### Kısmi başarı normaldir

Bir kayıt başarısız olursa **kalanlar denenmeye devam eder**. Sonuç ekranı kaç kaydın
eklendiğini ve eklenemeyenlerin sebebini gösterir.

**Yarıda kalan içe aktarma geri alınmaz.** O ana kadar eklenen kayıtlar listede kalır;
işlemi tekrarlarsanız eklenmiş olanlar "bu ad zaten var" diyerek atlanır, yalnızca
eksikler girer. Geri alma toast'ı (US-06) yalnızca **tek** silme içindir, toplu ekleme
için değil.

## 4. Sınırlar

- Dosya bellekte çözümlenir; birkaç bin kayda kadar sorunsuzdur. Her kayıt bir HTTP
  isteği olduğu için **süre kayıt sayısıyla doğru orantılıdır** — 500 kayıt yerel
  json-server'da bile gözle görülür bir bekleme demektir.
- İçe aktarma sürerken panel kilitlenir (`saving`), böylece aynı anda başka bir yazma
  isteği gitmez.
- Yalnızca **JSON** desteklenir. CSV dışa aktarma vardır ama CSV **içe** aktarma yoktur.
