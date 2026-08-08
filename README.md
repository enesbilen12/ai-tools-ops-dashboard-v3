# ✦ AI Araçları Paneli — v3

Yapay zeka araçlarını tek ekranda toplayan, arayan, sıralayan ve yöneten bir panel.
Bağımlılıksız (vanilla) JavaScript ile yazıldı; derleme için **Vite**, veri için
**json-server** kullanır.

> **v3 nedir?** v2 tek dosyalık 887 satırlık bir `app.js`'ti ve veriyi
> `localStorage`'da tutuyordu. v3 aynı özellikleri katmanlı bir mimariye taşıdı
> (bileşenler / store / api / saf yardımcılar), veriyi bir REST API'ye aldı ve
> 167 birim testiyle destekledi. Ayrıntı: [`CHANGELOG.md`](CHANGELOG.md)

<!-- Ekran görüntüsü: docs/screenshot.png -->

---

## Hızlı başlangıç

> ⚠️ **İki terminal gerekir.** Panel ile API ayrı süreçlerdir; yalnızca `npm run dev`
> çalıştırırsanız liste yüklenmez ve ekranda
> _"API'ye ulaşılamadı. json-server çalışıyor mu?"_ yazar.

```bash
npm install

# 1. terminal — veri sunucusu (http://localhost:3001)
npm run api

# 2. terminal — panel (http://localhost:5173)
npm run dev
```

### Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Vite geliştirme sunucusu — `:5173` |
| `npm run api` | json-server, `db.json` üzerinden — `:3001` |
| `npm test` | Vitest'i izleme kipinde başlatır |
| `npx vitest run` | Testleri bir kez çalıştırır (167 test) |
| `npm run build` | Üretim derlemesi → `dist/` |
| `npm run preview` | Derlenmiş çıktıyı yerel olarak sunar |

---

## Özellikler

| | Özellik | Hikâye |
|---|---|---|
| 🔍 | Anlık arama (300 ms gecikmeli), kategori ve durum filtresi | US-01 · US-02 · US-03 |
| ↕️ | Sıralama — ad, kategori, durum (**Türkçe harf sırasına uygun**) | US-12 |
| 📄 | Sayfalama — sayfa başına 12 kart | US-13 |
| ➕ | Araç ekleme ve düzenleme — tek form, iki mod | US-04 · US-05 |
| 🗑 | Yumuşak silme + **5 saniyelik geri alma**, çöp kutusu | US-06 |
| ⭐ | Favoriler (yeniden adlandırmada ve geri yüklemede korunur) | US-07 |
| 📋 | Detay çekmecesi — bir aracın tüm alanları | US-11 |
| 🌗 | Açık / koyu tema | US-08 |
| 📊 | Özet sayılar ve kategori dağılımı | US-15 |
| 📤 | Dışa aktarma — **filtrelenmiş** listeyi CSV veya JSON olarak | US-09 |
| 📥 | İçe aktarma — JSON, doğrulamalı önizleme ve onay ile | US-16 |
| 🔗 | Görünüm adres çubuğunda saklanır, yenilemede geri gelir | US-14 |

Kabul kriterlerinin tamamı: [`USER_STORIES.md`](USER_STORIES.md)

---

## Mimari

```
index.html          → boş #app kabı + "Yükleniyor…" iskeleti
  └── src/main.js   → tema + URL durumu, dashboard'u bağlar, veriyi çeker
        │
        ├── components/   arayüzü çizer, store'a abone olur
        │     dashboard · filters · toolForm · toolTable
        │     pagination · toolDrawer · toast · stats · importPanel
        │
        ├── state/store.js   TEK doğruluk kaynağı; tüm aksiyonlar buradan geçer
        │
        ├── api/toolsApi.js  json-server ile REST; hataları tek biçime sokar
        │
        └── utils/    saf fonksiyonlar (testlerin tamamı bunları ölçer)
              filters · sorting · pagination · validators · text
              csv · exporters · importer · stats · urlState · debounce · formatters
```

**Kurallar:** bileşenler `api`'yi doğrudan çağırmaz, her zaman `store` üzerinden
geçer · `utils` saf ve yan etkisizdir · durum yalnızca `store` içinde değişir ve
`bildir()` tek çıkış noktasıdır.

Ayrıntı: [`ARCHITECTURE.md`](ARCHITECTURE.md) ·
Durum alanları ve veri akışı: [`STATE_DIAGRAM.md`](STATE_DIAGRAM.md)

---

## Belgeler

| Belge | İçerik |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Modül sorumlulukları ve veri akışı |
| [`STATE_DIAGRAM.md`](STATE_DIAGRAM.md) | Durum alanları, liste zinciri, URL senkronu |
| [`API_CONTRACT.md`](API_CONTRACT.md) | Uç noktalar, kayıt şeması, hata biçimi |
| [`IMPORT_REPORT.md`](IMPORT_REPORT.md) | İçe aktarma dosya sözleşmesi ve kuralları |
| [`USER_STORIES.md`](USER_STORIES.md) | US-01…US-17, kabul kriterleriyle |
| [`TEST_REPORT.md`](TEST_REPORT.md) | Test sonuçları ve kapsam |
| [`CRUD_MATRIX.md`](CRUD_MATRIX.md) | Elle geçilen 18 tarayıcı senaryosu |
| [`REVIEW.md`](REVIEW.md) | Kod incelemesi, bilinen riskler, refactor önerileri |
| [`CHANGELOG.md`](CHANGELOG.md) | Sürüm geçmişi |
| [`DAILY_LOG.md`](DAILY_LOG.md) | Günlük çalışma kaydı |

---

## Veri

Araçlar kök dizindeki **`db.json`** içinde durur; json-server bunu bir REST API
olarak sunar. Yalnızca kullanıcıya özel iki tercih tarayıcıda (`localStorage`)
saklanır: **tema** ve **favoriler**.

Silme **yumuşaktır** — kayıt `db.json`'da kalır, yalnızca `deleted: true` olur.
Uygulama hiçbir zaman `DELETE` isteği göndermez.

```json
{
  "name": "ChatGPT",
  "category": "Metin",
  "purpose": "Soru yanıtlama ve metin üretme.",
  "owner": "OpenAI",
  "note": "Genel amaçlı.",
  "url": "https://chat.openai.com",
  "subscription": "Freemium",
  "status": "Aktif"
}
```

`name` benzersizdir (Türkçe harf duyarsız) — favoriler ada göre saklandığı için.

---

## Durum

| | |
|---|---|
| Birim testleri | ✅ **167 / 167** (11 dosya) |
| Üretim derlemesi | ✅ hatasız — JS 31.7 kB (gzip 10.2 kB) |
| Elle tarayıcı turu | CRUD 12/12 · veri aktarımı bölümü bekliyor |

---

## Bilinen sınırlar

- **Kimlik doğrulama yok**, tek kullanıcı varsayılır. Favoriler ve tema tarayıcıya
  bağlıdır; başka bir tarayıcıda görünmez.
- **json-server bir geliştirme sunucusudur** — üretim için uygun değildir, eşzamanlı
  yazmalarda kilitleme yapmaz.
- **İçe aktarmada toplu uç nokta yoktur**; her kayıt ayrı bir `POST`'tur, bu yüzden
  büyük dosyalar yavaştır ([`IMPORT_REPORT.md`](IMPORT_REPORT.md)).
- Tarayıcının **geri tuşu** filtre geçmişinde gezinmez (adres `replaceState` ile
  yazılır).
- Açık erişilebilirlik maddeleri ve CSV'nin Excel uyumu için
  [`REVIEW.md`](REVIEW.md) §2.
