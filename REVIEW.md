# Kod İncelemesi (Gün 6)

Salt-okunur bir gözden geçirme: veri kaybı, yarış koşulu, yanlış durum ve
erişilebilirlik riskleri arandı. Bulunanlar üç bölümde toplandı — **düzeltilenler**,
**bilinen ama dokunulmayanlar** ve **refactor önerileri**.

İnceleme tarihi: 2026-08-08 · Kapsam: `src/` (13 modül, 6 bileşen) · Test: 167 birim

---

## 1. Düzeltilen kusurlar

Beşi de `node` ile çalıştırılarak doğrulandı; her biri önce **başarısız olan bir
testle** yazıldı, sonra düzeltildi.

### K1 — Türkçe İ/ı benzersizlik kontrolünü ve aramayı bozuyordu · **veri bütünlüğü**

JavaScript'in `toLowerCase()`'i Türkçe için yanlış sonuç verir:

```
"İzleme".toLowerCase()  ->  "i̇zleme"  (i + birleşen nokta)  !==  "izleme"
"IŞIK".toLowerCase()    ->  "işik"                          !==  "ışık"
```

**Etkisi:** "İzleme" ve "izleme" **iki ayrı araç olarak eklenebiliyordu**. `name`
benzersiz olmak zorunda çünkü favoriler ada göre tutuluyor (US-07) — yani bu, favori
kayıtlarının hangi araca ait olduğunu belirsizleştiren bir veri bütünlüğü sorunuydu.
Aynı hata aramayı da vuruyordu: "izleme" araması "İzleme" adlı aracı bulamıyordu.

**Düzeltme:** `src/utils/text.js` — `karsilastirmaAnahtari` / `esitMetin` /
`icerirMetin`. Kural artık tek yerde; `validators`, `filters` ve `store.restoreTool`
buradan geçiyor.

> **Neden iki adım:** yalnızca `toLocaleLowerCase('tr')` kullanmak yetmiyor —
> "AI Paneli" → "aı paneli" olur ve kullanıcının yazdığı "ai" hiçbir şey bulamaz.
> Bu yüzden `ı → i` katlaması ekleniyor: i/ı/İ/I tek harfe iniyor, ş/s ve ö/o gibi
> gerçek harf farkları korunuyor. Yan fayda: kullanıcı "ışık" yerine "isik"
> yazdığında da buluyor.

### K2 — "undefined" araması eksik alanlı araçları buluyordu · **yanlış sonuç**

`toolMatches` alanları şablon dizgisiyle birleştiriyordu:
`` `${tool.name} ${tool.category} ${tool.purpose}` ``. Alan yoksa dizgeye
**`"undefined"` metni** giriyordu.

```
toolMatches({ name: 'X' }, { search: 'undefined' })  ->  true
```

**Düzeltme:** alanlar `?? ''` ile birleştiriliyor.

### K3 — `validateForm` adsız kayıtta çöküyordu · **kullanılamazlık**

```
validateForm({name:'X',…}, [{ id: 1 }])
  ->  TypeError: Cannot read properties of undefined (reading 'toLowerCase')
```

`db.json` elle düzenlenip bir kayıttan `name` düşerse **ekleme ve düzenleme formu
tamamen kilitleniyordu**. `importer.js` kendi `normalize`'ı sayesinde korunuyordu,
form korunmuyordu.

**Düzeltme:** `esitMetin` içindeki `String(… ?? '')` sağlamlaştırması.

### K4 — Yalnızca boşluktan oluşan ad geçerli sayılıyordu · **veri kalitesi**

`validateForm({ name: '   ', … })` hiç hata döndürmüyordu. Bugüne kadar kurtaran
şey çağıranların `.trim()` yapmasıydı (`toolForm.js`, `importer.js`) — doğrulayıcının
kendisi kabul ediyordu, yani savunma çağırana bağlıydı.

**Düzeltme:** kırpma doğrulayıcının içine alındı.

### D1 — Çöp menüsünden geri yüklemede favori kayboluyordu · **veri kaybı**

Favorili bir aracı silip **5 saniye geçtikten sonra** çöp menüsünden geri
yüklediğinizde favori geri gelmiyordu; toast'tan geri aldığınızda geliyordu. Sebep:
favori bilgisi yalnızca `durum.undo` içinde tutuluyordu ve `clearUndo` onu 5
saniyede siliyordu.

**Düzeltme:** bilgi `silinenFavoriler` haritasında kaydın ömrü boyunca tutuluyor;
`restoreTool` favoriyi geri koyuyor ve `undoDelete` de aynı yolu kullanıyor. İki
geri yükleme yolu artık aynı sonucu veriyor.

---

## 2. Bilinen riskler — bu turda dokunulmadı

| # | Tür | Bulgu | Neden ertelendi |
|---|---|---|---|
| R1 | Erişilebilirlik | `.kart` `role="button"` taşıyor ama içinde buton ve `<a>` var. ARIA'da bir `button` **etkileşimli çocuk içeremez**; ekran okuyucu kartı tek düğme gibi duyurup içindekileri gizleyebilir. | Doğru çözüm karttan `role`'ü kaldırıp başlığa ayrı bir "detay aç" düğmesi koymak — görünür arayüz değişikliği. |
| R2 | Erişilebilirlik | Çekmece ve içe aktarma paneli `aria-modal="true"` diyor ama **odak tuzağı yok**: `Tab` ile arkadaki sayfaya çıkılabiliyor. Verilen söz tutulmuyor. | Odak tuzağı yeni bir yardımcı ve klavye davranışı değişikliği gerektiriyor. |
| R3 | Erişilebilirlik | `dashboard.js`'de hâlâ bir `alert()` var (geri yükleme çakışması uyarısı). Gün 3'te `confirm()` kaldırılırken bu atlandı. | Toast'a taşınmalı; toast şu an yalnızca silme kısayolunu biliyor, genel mesaj kanalına dönüşmesi gerek. |
| R4 | Veri | CSV `\n` ile ayırıyor (RFC 4180 `CRLF` der) ve **BOM yok** — Excel dosyayı açtığında Türkçe harfler bozuk görünür. Türkçe bir uygulama için pratik bir kayıp. | Düzeltmesi tek satır ama **dışa aktarma çıktısını değiştirir**; ayrı karar. |
| R5 | Yeniden giriş | `filters.js` `update()` içinde `setFilter()` çağırıyor → `bildir()` sürerken yeni `bildir()`. Sonsuz döngü erken `return` ile engellenmiş ama abone listesi çizim sırasında yeniden tetikleniyor. | Kırılgan ama bugün hatasız; hizalamayı çizimden ayırmak orta ölçekli bir değişiklik. |
| R6 | Kaynak | `toolDrawer` ve `importPanel` `document`'e `keydown` bağlıyor ve hiç kaldırmıyor. `mountDashboard` bir kez çağrıldığı için bugün zararsız; ikinci çağrıda dinleyiciler birikir. | Gerçek bir sızıntı yolu yok; `unmount` sözleşmesi eklenmesi gerekir. |
| R7 | Yarış | `importTools` iptal edilemiyor. Sürerken (`saving`) arayüz kilitli, ama uzun bir içe aktarmayı durdurmanın yolu yok. | `loadTools`'taki `AbortController` deseni buraya da taşınabilir. |

### Yarış koşulları — iyi durumda

Gün 5'te kapandı ve bu incelemede yeni bir sorun çıkmadı: `loadTools` önceki uçuşu
iptal ediyor, iptal edilen istek durumu değiştirmiyor, `finally` yalnızca güncel
isteği kapatıyor, `saving` çift gönderimi engelliyor, `setFilter` aynı değerde
hiçbir şey yapmıyor.

---

## 3. Refactor önerileri — davranış değişmez

Uygulanmadı; sıradaki temizlik turu için liste.

1. **Ölü kod:** `toolTable.js` içindeki yerel `aracBul` artık kullanılmıyor
   (`findTool` store'dan geliyor) — kaldırılabilir.
2. **`escapeHtml` + şablon dizgisi** altı bileşende tekrar ediyor; küçük bir
   `html` etiketli şablon yardımcısı hem tekrarı azaltır hem kaçırmayı unutmayı
   zorlaştırır.
3. **`.drawer-perde` iki bileşende ayrı ayrı üretiliyor** (çekmece ve içe aktarma
   paneli); tek bir "perde" yardımcısına çıkarılabilir.
4. **"Yalnızca değiştiyse çiz" deseni** beş bileşende elle tekrarlanıyor
   (`sonKategoriHtml`, `sonEditingId`, `sonDrawerId`, `sonUndoId`, `sonImza`).
   Ortak bir `degistiyseCiz(anahtar, fn)` yardımcısı örüntüyü tek yerde toplar.
5. **`components.css` 750+ satır**; `dashboard / kart / drawer / form` olarak
   bölünebilir (`styles/` zaten bölünmüş bir yapı).
6. **Sihirli sayılar** üç ayrı dosyada: `SURE_MS` (toast), `ARAMA_GECIKMESI`
   (filters), `DEFAULT_PAGE_SIZE` (pagination). `constants.js`'e toplanabilir.
7. **`store.js` 570+ satır** ve dört sorumluluk taşıyor (veri, favoriler, tema,
   görünüm). Bölünebilir ama tek doğruluk kaynağı olma avantajı kaybolur — bilinçli
   bir tercih gerektirir.

---

## 4. Test durumu

Gün 6 öncesi **118**, sonrası **167** test. Eklenen 49 test boş değer, sınır değer,
Türkçe karakter ve hatalı tip senaryolarını kapsıyor.

**Örüntü:** son üç günde yazılan modüller (`urlState`, `stats`, `importer`,
`exporters`) sınır değerleriyle birlikte yazılmıştı; **ilk gün v2'den taşınan üçü**
(`validators`, `filters`, `csv`) yalnızca mutlu yolu ölçüyordu. Beş kusurun dördü
de o üçünde çıktı — taşınan kodun yeni yazılan koddan daha az test edilmiş olması
bu projede gerçek bir risk kaynağıymış.

**Hâlâ test edilmeyen:** store aksiyonları ve bileşenler (DOM). Tarayıcısız duman
testleri bunu kısmen telafi ediyor (`TEST_REPORT.md` §3b–3f) ama jsdom tabanlı
bileşen testleri boşluk olarak duruyor.
