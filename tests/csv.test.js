import { describe, it, expect } from 'vitest';
import { toolsToCSV, CSV_COLUMNS } from '../src/utils/csv.js';

const araclar = [
  {
    id: 1,
    name: 'ChatGPT',
    category: 'Metin',
    purpose: 'sohbet',
    owner: 'OpenAI',
    note: 'popüler',
    url: 'https://chat.openai.com',
    subscription: 'Freemium',
    status: 'Aktif',
    deleted: false,
  },
];

describe('toolsToCSV', () => {
  it('başlık satırı CSV_COLUMNS ile aynıdır', () => {
    const csv = toolsToCSV(araclar);
    const [header] = csv.split('\n');
    expect(header).toBe(CSV_COLUMNS.join(','));
  });

  it('id ve deleted gibi iç alanları dışa aktarmaz', () => {
    const csv = toolsToCSV(araclar);
    expect(csv).not.toContain('deleted');
  });

  it('her araç için bir veri satırı üretir', () => {
    const csv = toolsToCSV(araclar);
    expect(csv.split('\n')).toHaveLength(2); // başlık + 1 satır
    expect(csv).toContain('ChatGPT');
  });

  it('virgül/tırnak/satır sonu içeren hücreyi kaçırır (RFC 4180)', () => {
    const csv = toolsToCSV([{ ...araclar[0], purpose: 'a, b "c"' }]);
    expect(csv).toContain('"a, b ""c"""');
  });

  it('eksik alanı boş string olarak yazar', () => {
    const csv = toolsToCSV([{ name: 'X', category: 'Y', purpose: 'Z', url: 'https://x.co' }]);
    // owner/note/subscription/status yok -> boş hücreler, hata fırlatmaz
    expect(csv.split('\n')).toHaveLength(2);
  });
});
