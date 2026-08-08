// exporters.js: Dışa aktarma biçimleri (saf fonksiyonlar).
//
// JSON, CSV ile AYNI alanları taşır (CSV_COLUMNS): `id` ve `deleted` dışarıda
// kalır. Bu bilinçli — dışa aktarılan dosya doğrudan geri içe aktarılabilmeli
// (round trip). Ayrıntı: IMPORT_REPORT.md

import { CSV_COLUMNS } from './csv.js';

// toolsToJSON: araç listesini içe aktarmaya uygun JSON metnine çevirir.
// Eksik alanlar boş metin olarak yazılır ki dosyanın şeması kayıttan kayda
// değişmesin.
export function toolsToJSON(tools, columns = CSV_COLUMNS) {
  const temiz = tools.map((arac) => {
    const satir = {};
    columns.forEach((alan) => {
      satir[alan] = arac[alan] ?? '';
    });
    return satir;
  });
  return JSON.stringify(temiz, null, 2);
}

// exportFileName: tarih damgalı dosya adı ('ai-araclari-2026-08-08.json').
// Aynı gün birden çok kez indirildiğinde tarayıcı sonuna (1), (2) ekler.
export function exportFileName(uzanti, tarih = new Date()) {
  const gun = [
    tarih.getFullYear(),
    String(tarih.getMonth() + 1).padStart(2, '0'),
    String(tarih.getDate()).padStart(2, '0'),
  ].join('-');
  return `ai-araclari-${gun}.${uzanti}`;
}
