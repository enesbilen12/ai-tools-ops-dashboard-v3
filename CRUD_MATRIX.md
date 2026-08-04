# CRUD Matrisi — Manuel Test Senaryoları

Gün 3'te gelen tam CRUD akışının (tek form, detay çekmecesi, geri alma toast'ı)
tarayıcıda elle geçilecek kabul listesi.

**Son koşu:** 2026-08-04 · tarayıcıda elle · **12/12 geçti**

**Hazırlık**

```bash
npm run api    # json-server :3001
npm run dev    # Vite :5173
```

DevTools **Network** sekmesi açık olsun: her senaryonun beklenen HTTP isteği
sütunda yazıyor. **Hiçbir senaryoda `DELETE` görünmemeli** — silme yumuşaktır
(`API_CONTRACT.md`).

**Sonuç sütunu:** ✅ geçti · ❌ kaldı · — henüz koşulmadı.

---

## Create (Oluşturma)

| # | Senaryo | Adımlar | Beklenen | HTTP | Sonuç |
|---|---|---|---|---|---|
| 1 | Geçerli kayıt eklenir | "➕ Yeni Araç Ekle" → tüm zorunlu alanları doldur → "Ekle" | Kart ızgarada belirir, "Toplam Araç" sayacı +1 olur, kategori menüsüne yeni kategori düşer, form temizlenip kapanır | `POST /tools` → `201` | ✅ |
| 2 | Dört doğrulama kuralı | Formu boş bırak → "Ekle"; sonra `url` alanına `ornek.com` yaz → "Ekle" | Ad/kategori/amaç/url için alan altında satır içi hata; URL için "http:// veya https:// ile başlamalı"; **hiç istek gitmez** | — (ağda istek yok) | ✅ |
| 3 | Harf duyarsız kopya ad | Ad alanına mevcut bir aracın adını farklı harflerle yaz (ör. `chatgpt`) → "Ekle" | `"chatgpt" adlı bir araç zaten var.` hatası, istek gitmez | — | ✅ |
| 4 | API kapalıyken ekleme | `npm run api`'yi durdur → geçerli bir kayıt eklemeyi dene | Üstteki hata şeridinde "API'ye ulaşılamadı… (npm run api)" çıkar, **form açık ve dolu kalır** (girilenler kaybolmaz), liste bozulmaz | `POST` başarısız (ağ hatası) | ✅ |

## Read (Okuma / detay çekmecesi)

| # | Senaryo | Adımlar | Beklenen | HTTP | Sonuç |
|---|---|---|---|---|---|
| 5 | Çekmece tüm alanları gösterir | Bir kartın boş bir yerine tıkla (butona değil) | Sağdan çekmece açılır; kategori, amaç, geliştiren, not, abonelik, tam URL + kartta olmayan **`id`** ve favori durumu görünür; boş alanlar `—` ile gösterilir | — | ✅ |
| 6 | Çekmece üç yoldan kapanır | Çekmeceyi aç → `×`; tekrar aç → arkadaki karartmaya tıkla; tekrar aç → `Esc` | Üçünde de kapanır ve **odak geldiği karta döner** (Tab ile devam edilebilir) | — | ✅ |

## Update (Güncelleme)

| # | Senaryo | Adımlar | Beklenen | HTTP | Sonuç |
|---|---|---|---|---|---|
| 7 | Çekmeceden düzenlemeye geçiş | Çekmeceyi aç → "✏️ Düzenle" | Çekmece kapanır, sayfa üstündeki forma kaydırılır; başlık "✏️ Düzenle: <ad>", buton "💾 Kaydet", **8 alan da dolu** gelir, "➕ Yeni Araç Ekle" butonu gizlenir | — | ✅ |
| 8 | Ad değişince favori taşınır | Bir aracı favorile (★) → düzenle → adını değiştir → "💾 Kaydet" | Kart yeni adla çizilir, **yıldız hâlâ dolu**, "Favoriler" sayacı değişmez | `PATCH /tools/:id` → `200` | ✅ |
| 9 | İptal değişikliği atar | Düzenleme modunda alanları değiştir → "İptal" | Form temizlenip kapanır, başlık "Yeni Araç"a döner, **kart eski hâliyle kalır**, istek gitmez | — | ✅ |
| 10 | İstek sürerken butonlar kilitli | DevTools → Network → **Slow 4G**; "💾 Kaydet"e hızlıca iki kez bas | Buton `Kaydediliyor…` yazıp gri/kilitli olur, kart ve çekmece butonları da kilitlenir; **ağda tek istek** görünür | tek `PATCH` | ✅ |

## Delete (Silme ve geri alma)

| # | Senaryo | Adımlar | Beklenen | HTTP | Sonuç |
|---|---|---|---|---|---|
| 11 | Tek tıkla silme + toast | Bir kartta "🗑 Sil" | **`confirm()` diyaloğu çıkmaz**; kart listeden düşer, altta `"<ad>" silindi.` toast'ı 5 saniye durur, sonra kendiliğinden kapanır. Süre dolduktan sonra kayıt **"🗑 Silinen Araçlar" menüsünde durur** (yok olmaz) | `PATCH /tools/:id {deleted:true}` → `200` | ✅ |
| 12 | 5 saniye içinde geri alma | Favorili bir aracı sil → toast'ta "↩︎ Geri al" | Kart geri gelir, **favori yıldızı da geri gelir**, toast kapanır. (Bu arada aynı adla yeni bir araç eklendiyse geri alma engellenir ve sebebi toast'ta yazar) | `PATCH /tools/:id {deleted:false}` → `200` | ✅ |

---

## Kapsam notu

Bu matris **arayüz davranışını** ölçer. Aynı akışların mantık tarafı tarayıcısız
olarak zaten doğrulandı:

- `npx vitest run` — 34 birim testi (`TEST_REPORT.md` §1)
- store + json-server duman testi — 28 kontrol (`TEST_REPORT.md` §3c): `saving`
  dalgası, `undo` kaydı, favori hatırlama/geri getirme, `clearUndo`'nun kaydı
  yok etmemesi, ad çakışmasında geri almanın engellenmesi
