# API Sözleşmesi (API Contract)

Panelin veri kaynağı **json-server**'dır. Bu belge, `src/api/toolsApi.js`'in
konuştuğu uç noktaları, kayıt şemasını ve hata biçimini tanımlar.

## Taban adres

| | |
|---|---|
| Taban adres | `http://localhost:3001` (`API_BASE`, `src/constants.js`) |
| Kaynak | `/tools` (`TOOLS_ENDPOINT`) |
| Başlatma | `npm run api` → `json-server db.json --port 3001` |
| Veri dosyası | `db.json` (kök dizinde, `{ "$schema": …, "tools": [...] }`) |

Uygulama ve API **ayrı portlarda** çalışır (Vite `:5173`, API `:3001`).
Her ikisinin de açık olması gerekir; API kapalıyken uygulama çökmez, ekranda
sebebini ve bir **"↻ Tekrar dene"** butonu gösterir.

## Kayıt şeması

```json
{
  "id": "1",
  "name": "ChatGPT",
  "category": "Metin",
  "purpose": "Soru yanıtlama ve metin üretme için sohbet tabanlı yapay zeka.",
  "owner": "OpenAI",
  "note": "Genel amaçlı, başlangıç için popüler.",
  "url": "https://chat.openai.com",
  "subscription": "Freemium",
  "status": "Aktif",
  "deleted": false
}
```

| Alan | Tip | Zorunlu | Kural |
|---|---|---|---|
| `id` | string | sunucu üretir | İstemci **asla** göndermez |
| `name` | string | ✅ | Aktif kayıtlar arasında benzersiz (harf duyarsız) |
| `category` | string | ✅ | Serbest metin; menü mevcut veriden üretilir |
| `purpose` | string | ✅ | |
| `owner` | string | — | |
| `note` | string | — | |
| `url` | string | ✅ | `^https?://` ile başlamalı |
| `subscription` | string | — | `Ücretsiz` / `Freemium` / `Ücretli` |
| `status` | string | — | `Aktif` / `Deneme` / `Pasif`; boşsa `Aktif` sayılır |
| `deleted` | boolean | ✅ | Yumuşak silme işareti |

> **Dikkat — `id` tipi.** `id` her zaman **metindir** ve iki ayrı biçimde gelir:
> `db.json`'daki ilk 18 kayıt sıra numarası taşır (`"1"`, `"2"`…), json-server'ın
> yeni kayıtlara ürettikleri ise rastgele dizgilerdir (`"QAZwfVSgu9o"`). Sayısal
> sıra beklenemez, `Number(id)` ile işlem yapılamaz.
>
> Kod hiçbir yerde `===` ile ham karşılaştırma yapmaz; tek kural
> `String(a.id) === String(id)`'dir ve tek yerde durur: `store.js`'teki `aracBul`.
> Bileşenler bunu tekrar yazmak yerine `findTool(id)` ile çağırır.
> `utils/validators.js` de benzersizlik kontrolünde aynı metin karşılaştırmasını
> kullanır — katı karşılaştırma, düzenlenen aracı kendi adına çarptırıyordu.
>
> **Not:** `db.json` bir kez `npm run api` ile yazıldığında json-server dosyayı
> kendi biçimine çevirir: köke bir `$schema` anahtarı ekler ve sayısal id'leri
> metne dönüştürür. Bu normalleştirme kabul edilmiştir; dosya bu hâliyle
> depoda durur.

## Uç noktalar

| İşlem | Metot | Yol | Gövde | Yanıt |
|---|---|---|---|---|
| Tüm araçlar | `GET` | `/tools` | — | `200` + dizi (silinenler **dahil**) |
| Ekle | `POST` | `/tools` | Kayıt (id'siz) + `deleted: false` | `201` + oluşan kayıt (`id` ile) |
| Güncelle | `PATCH` | `/tools/:id` | Yalnızca değişen alanlar | `200` + güncel kayıt |
| Yumuşak sil | `PATCH` | `/tools/:id` | `{ "deleted": true }` | `200` |
| Geri yükle | `PATCH` | `/tools/:id` | `{ "deleted": false }` | `200` |

Tüm yazma isteklerinde `Content-Type: application/json`.

### Aktif / silinmiş ayrımı

`GET /tools` **her şeyi** döndürür; süzme sunucuda değil istemcide yapılır:

- Aktif liste → `deleted !== true` (`store.activeTools()`)
- Çöp kutusu → `deleted === true` (`store.deletedTools()`)

**`DELETE` hiç kullanılmaz.** Silme her zaman `deleted: true` yamasıdır; kayıt
`db.json`'da durur, `id`'si korunur ve geri yüklenebilir.

### Geri yükleme kuralı

Geri yükleme **istemcide** engellenebilir: aktif listede aynı adlı (harf
duyarsız) bir kayıt varsa istek hiç gönderilmez, kullanıcıya uyarı gösterilir.
Sunucu tarafında benzersizlik kontrolü **yoktur**.

## Hata biçimi

`src/api/toolsApi.js` her başarısızlığı `normalizeError()` ile tek bir biçime
sokar. Fırlatılan `Error` üç ek alan taşır:

```js
{ message: string, status: number, url: string, cause?: Error }
```

| `status` | Ne zaman | Mesaj |
|---|---|---|
| `0` | Yanıt hiç alınamadı (sunucu kapalı, ağ hatası) | "API'ye ulaşılamadı. json-server çalışıyor mu? (npm run api)" |
| `404` | Kayıt yok (ör. başka sekmede silinmiş) | "Kayıt bulunamadı (404). Liste güncel olmayabilir, yenileyin." |
| `4xx` | İstek reddedildi | "İstek reddedildi (HTTP …)." |
| `5xx` | Sunucu hatası | "Sunucu hatası (HTTP …). Birazdan tekrar deneyin." |

`204 No Content` hata değildir; `null` döner (gövdesiz yanıtta `json()`
patlamasın diye).

## İstemci sözleşmesi

- **Bileşenler `toolsApi`'yi doğrudan çağırmaz**; her zaman `store` üzerinden geçer.
- **İyimser (optimistic) güncelleme yoktur.** `store` yerel durumu yalnızca
  `await` başarıyla döndükten sonra değiştirir; başarısız istek sonrası geri
  alınacak bir şey kalmaz.
- Hata store'da `durum.error`'a yazılır. Liste boşsa tabloda "Tekrar dene" ile,
  liste doluysa sayfa üstündeki kapatılabilir şeritte gösterilir.
- **Tek uçuş kuralı.** Her yazma aksiyonu (`addTool` / `editTool` / `removeTool` /
  `restoreTool`) isteğin önünde `durum.saving = true` yapıp `finally` içinde
  kapatır. Form, kart ve çekmece butonları bu bayrağa bakarak kilitlenir; çift
  tıklama ikinci bir istek üretmez.
- **Geri alma yeni uç nokta getirmez.** Silme sonrası çıkan toast'ın "Geri al"
  düğmesi `undoDelete()` üzerinden mevcut `restoreTool`'u — yani
  `PATCH { deleted: false }` — çağırır. Toast'ın 5 saniyesi yalnızca kısayolun
  süresidir: dolduğunda `clearUndo()` çalışır, **kayda dokunulmaz** ve çöp
  menüsünden hâlâ geri yüklenebilir.
- `removeTool`, silinen kaydın favori olup olmadığını `durum.undo.wasFavorite`
  içinde saklar; geri alma favoriyi de geri koyar (aksi hâlde kart geri gelir,
  favori sessizce kaybolurdu).

## Test

`tests/toolsApi.test.js`, `globalThis.fetch`'i taklit ederek uç nokta adresini,
HTTP metotlarını, gövdeleri ve `normalizeError` çıktılarını doğrular — çalışan
bir json-server gerektirmez.
