import { describe, it, expect } from 'vitest';
import { toolsToJSON, exportFileName } from '../src/utils/exporters.js';
import { CSV_COLUMNS } from '../src/utils/csv.js';
import { validateImportRows, parseImportFile } from '../src/utils/importer.js';

const araclar = [
  {
    id: 7,
    deleted: false,
    name: 'ChatGPT',
    category: 'Metin',
    purpose: 'sohbet',
    owner: 'OpenAI',
    note: 'not',
    url: 'https://chat.openai.com',
    subscription: 'Freemium',
    status: 'Aktif',
  },
];

describe('toolsToJSON', () => {
  it('CSV ile aynı alanları yazar', () => {
    const cikti = JSON.parse(toolsToJSON(araclar));
    expect(Object.keys(cikti[0])).toEqual(CSV_COLUMNS);
  });

  // Dışa aktarılan dosya geri içe aktarılabilmeli; id/deleted taşınırsa
  // json-server'ın ürettiği kimlikler çakışırdı.
  it('id ve deleted gibi iç alanları dışa aktarmaz', () => {
    const cikti = JSON.parse(toolsToJSON(araclar));
    expect(cikti[0]).not.toHaveProperty('id');
    expect(cikti[0]).not.toHaveProperty('deleted');
  });

  it('eksik alanı boş metin olarak yazar (şema kayıttan kayda değişmesin)', () => {
    const cikti = JSON.parse(toolsToJSON([{ name: 'X' }]));
    expect(cikti[0].note).toBe('');
    expect(Object.keys(cikti[0])).toEqual(CSV_COLUMNS);
  });

  it('boş listede boş dizi üretir', () => {
    expect(JSON.parse(toolsToJSON([]))).toEqual([]);
  });

  it('okunabilir olsun diye girintili yazar', () => {
    expect(toolsToJSON(araclar)).toContain('\n  ');
  });
});

// Gün 5'in temel sözleşmesi: dışa aktar -> içe aktar zinciri kayıpsız olmalı.
describe('dışa aktarma → içe aktarma (round trip)', () => {
  it('dışa aktarılan JSON doğrudan içe aktarılabilir', () => {
    const metin = toolsToJSON(araclar);
    const cozumlenen = parseImportFile(metin);
    expect(cozumlenen.ok).toBe(true);

    // Boş listeye karşı doğrulanır: çakışma yok, kayıt geçerli olmalı.
    const { valid, invalid } = validateImportRows(cozumlenen.rows, []);
    expect(invalid).toHaveLength(0);
    expect(valid[0].name).toBe('ChatGPT');
    expect(valid[0].url).toBe('https://chat.openai.com');
  });

  it('aynı dosya mevcut listeye karşı çakışma verir (çift kayıt oluşmaz)', () => {
    const cozumlenen = parseImportFile(toolsToJSON(araclar));
    const { valid, invalid } = validateImportRows(cozumlenen.rows, araclar);
    expect(valid).toHaveLength(0);
    expect(invalid).toHaveLength(1);
  });
});

describe('exportFileName', () => {
  it('tarih damgalı ad üretir', () => {
    expect(exportFileName('json', new Date(2026, 7, 8))).toBe('ai-araclari-2026-08-08.json');
  });

  it('tek haneli ay ve günü sıfırla doldurur', () => {
    expect(exportFileName('csv', new Date(2026, 0, 5))).toBe('ai-araclari-2026-01-05.csv');
  });
});
