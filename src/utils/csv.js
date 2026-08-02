// csv.js: Araç listesini CSV'ye dönüştürme ve indirme.
// (v2 sayfa-içi JSON textarea kullanıyordu; v3'te CSV dosyası indirilir.)

// Dışa aktarılacak alanlar (id ve deleted gibi iç alanlar hariç).
export const CSV_COLUMNS = [
  'name',
  'category',
  'purpose',
  'owner',
  'note',
  'url',
  'subscription',
  'status',
];

// escapeCell: CSV hücresini güvene alır. Virgül, çift tırnak veya satır sonu
// içeriyorsa hücre çift tırnağa alınır ve içteki tırnaklar ikiye katlanır (RFC 4180).
function escapeCell(value) {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

// toolsToCSV: araç listesinden başlık satırı + veri satırlarından oluşan CSV metni üretir.
export function toolsToCSV(tools, columns = CSV_COLUMNS) {
  const header = columns.join(',');
  const rows = tools.map((tool) =>
    columns.map((col) => escapeCell(tool[col])).join(',')
  );
  return [header, ...rows].join('\n');
}

// downloadCSV: verilen CSV metnini bir dosya olarak indirir (tarayıcıda).
export function downloadCSV(csv, filename = 'ai-araclari.csv') {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
