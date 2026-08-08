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

// --- Sınır ve hatalı tip senaryoları (Gün 6) ---

describe('toolsToCSV — sınırlar', () => {
  it('boş listede yalnızca başlık satırı üretir', () => {
    const csv = toolsToCSV([]);
    expect(csv).toBe(CSV_COLUMNS.join(','));
    expect(csv.split('\n')).toHaveLength(1);
  });

  it('null ve undefined hücreleri boş yazar', () => {
    const csv = toolsToCSV([{ ...araclar[0], owner: null, note: undefined }]);
    expect(csv).not.toContain('null');
    expect(csv).not.toContain('undefined');
  });

  it('özel sütun listesi verilebilir', () => {
    const csv = toolsToCSV(araclar, ['name', 'url']);
    expect(csv.split('\n')[0]).toBe('name,url');
    expect(csv).not.toContain('Freemium');
  });

  it('yalnızca satır sonu içeren hücre tırnağa alınır', () => {
    const csv = toolsToCSV([{ ...araclar[0], note: 'a\nb' }]);
    expect(csv).toContain('"a\nb"');
  });

  it('yalnızca virgül içeren hücre tırnağa alınır', () => {
    expect(toolsToCSV([{ ...araclar[0], note: 'a,b' }])).toContain('"a,b"');
  });

  it('sayı ve boolean değerler metne çevrilir', () => {
    const csv = toolsToCSV([{ ...araclar[0], note: 42, owner: false }]);
    expect(csv).toContain('42');
    expect(csv).toContain('false');
  });
});

// Uygulama Türkçe; dışa aktarılan dosyada harflerin bozulmaması kritik.
describe('toolsToCSV — Türkçe karakterler', () => {
  const turkce = {
    name: 'Şema Çizer',
    category: 'Tasarım',
    purpose: 'İş akışı çizimi',
    owner: 'Ödev A.Ş.',
    note: 'ğüşiöç ĞÜŞİÖÇ',
    url: 'https://ornek.com',
    subscription: 'Ücretsiz',
    status: 'Aktif',
  };

  it('Türkçe harfleri bozmadan yazar', () => {
    const csv = toolsToCSV([turkce]);
    expect(csv).toContain('Şema Çizer');
    expect(csv).toContain('İş akışı çizimi');
    expect(csv).toContain('ğüşiöç ĞÜŞİÖÇ');
    expect(csv).toContain('Ücretsiz');
  });

  it('Türkçe metin gereksiz yere tırnağa alınmaz', () => {
    // Kaçırma yalnızca virgül/tırnak/satır sonu içinse yapılır.
    expect(toolsToCSV([turkce])).not.toContain('"Şema Çizer"');
  });
});
