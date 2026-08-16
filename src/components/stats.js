// stats.js: Sayfanın üstündeki özet alanı — dört sayı kutusu ve kategori dağılımı.
//
// Biçim seçimi:
//   • Dört başlık sayısı bir "KPI satırı"dır, grafik değil — tek değerli bir
//     çubuk grafiği bilgiyi taşımaz, yer kaplar.
//   • Kategori dağılımı büyüklük karşılaştırmasıdır -> yatay çubuk. Yatay,
//     çünkü kategori adları uzun ("Verimlilik", "Ses/Müzik") ve dikeyde
//     etiketleri eğmek gerekirdi.
//
// Renk: TEK hue. Bu tek serilik bir büyüklük karşılaştırması; uzunluk zaten
// değeri kodluyor ve kategori adı doğrudan yazılı. Her kategoriye ayrı renk
// vermek hiçbir şey kodlamaz, yalnızca süs olurdu. Açık ve koyu tema için ayrı
// ayrı seçilmiş iki adım kullanılır (ters çevirme değil); ikisi de kendi kart
// zeminine karşı 3:1 kontrastı geçer.
//
// Sayılar araç listesinin TAMAMINI (silinmemişler) anlatır, ekrandaki filtreyi
// değil: bu bir özet, filtre sonucu değil.

import { escapeHtml } from '../utils/formatters.js';
import { computeStats } from '../utils/stats.js';
import { activeTools } from '../state/store.js';

// yuzde: oranı okunur bir tam sayıya çevirir.
function yuzde(oran) {
  return Math.round(oran * 100);
}

// dagilimHtml: kategori çubukları. Değerler metin olarak da yazılır — çubuk
// yalnızca karşılaştırmayı kolaylaştırır, bilgiyi taşıyan tek şey değildir.
// Bu yüzden çubuk aria-hidden: ekran okuyucu aynı sayıyı iki kez okumasın.
function dagilimHtml(byCategory) {
  if (byCategory.length === 0) {
    return '<p class="dagilim-bos">Gösterilecek kategori yok.</p>';
  }

  // Çubuk genişliği en büyük kategoriye göre ölçeklenir; aksi hâlde tüm
  // çubuklar kısacık kalır ve karşılaştırma zorlaşır.
  const enBuyuk = byCategory[0].count;

  return byCategory
    .map((kategori) => {
      const oran = enBuyuk > 0 ? (kategori.count / enBuyuk) * 100 : 0;
      const etiket = escapeHtml(kategori.name);
      return `
        <div class="dagilim-satir" title="${etiket}: ${kategori.count} araç (%${yuzde(kategori.ratio)})">
          <span class="dagilim-ad">${etiket}</span>
          <span class="dagilim-yuva" aria-hidden="true">
            <span class="dagilim-cubuk" style="width: ${oran.toFixed(1)}%"></span>
          </span>
          <span class="dagilim-sayi">${kategori.count} <span class="dagilim-oran">%${yuzde(kategori.ratio)}</span></span>
        </div>
      `;
    })
    .join('');
}

export function mountStats(kap) {
  const bolum = document.createElement('section');
  bolum.className = 'ozet-alani';
  bolum.innerHTML = `
    <div class="ozet-kutular">
      <div class="ozet-kutu">Toplam Araç <strong id="ozet-toplam">0</strong></div>
      <div class="ozet-kutu">Durumu Aktif <strong id="ozet-aktif">0</strong></div>
      <div class="ozet-kutu">Favoriler <strong id="ozet-favori">0</strong></div>
      <div class="ozet-kutu">Kategori <strong id="ozet-kategori">0</strong></div>
    </div>
    <div class="dagilim">
      <h2 class="dagilim-baslik">Kategori dağılımı</h2>
      <div class="dagilim-liste"></div>
    </div>
  `;
  kap.appendChild(bolum);

  const toplamEl = bolum.querySelector('#ozet-toplam');
  const aktifEl = bolum.querySelector('#ozet-aktif');
  const favoriEl = bolum.querySelector('#ozet-favori');
  const kategoriEl = bolum.querySelector('#ozet-kategori');
  const liste = bolum.querySelector('.dagilim-liste');

  // Dağılım yalnızca gerçekten değiştiğinde yeniden çizilir; bildir() favori
  // işaretleme, çekmece açma gibi her aksiyonda da çalışıyor.
  let sonImza = '';

  return {
    update(durum) {
      const araclar = activeTools();
      const istatistik = computeStats(araclar, durum.favorites);

      toplamEl.textContent = istatistik.total;
      aktifEl.textContent = istatistik.active;
      favoriEl.textContent = istatistik.favorites;
      kategoriEl.textContent = istatistik.categoryCount;

      const imza = istatistik.byCategory.map((k) => `${k.name}:${k.count}`).join('|');
      if (imza !== sonImza) {
        sonImza = imza;
        liste.innerHTML = dagilimHtml(istatistik.byCategory);
      }
    },
  };
}
