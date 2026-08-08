import { describe, it, expect } from 'vitest';
import { parseImportFile, validateImportRows } from '../src/utils/importer.js';

const mevcut = [{ id: 1, name: 'ChatGPT' }, { id: 2, name: 'Claude' }];

const gecerliSatir = {
  name: 'Yeni Araç',
  category: 'Kod',
  purpose: 'Bir amaç',
  owner: 'Biri',
  note: '',
  url: 'https://ornek.com',
  subscription: 'Ücretsiz',
  status: 'Aktif',
};

describe('parseImportFile', () => {
  it('düz diziyi kabul eder', () => {
    const sonuc = parseImportFile(JSON.stringify([gecerliSatir]));
    expect(sonuc.ok).toBe(true);
    expect(sonuc.rows).toHaveLength(1);
  });

  // Dışa aktarılan dosya ve db.json bu biçimde.
  it('{ tools: [...] } kökünü kabul eder', () => {
    const sonuc = parseImportFile(JSON.stringify({ tools: [gecerliSatir] }));
    expect(sonuc.ok).toBe(true);
    expect(sonuc.rows).toHaveLength(1);
  });

  it('bozuk JSON için anlaşılır hata verir', () => {
    const sonuc = parseImportFile('{ bu json değil');
    expect(sonuc.ok).toBe(false);
    expect(sonuc.message).toMatch(/JSON/);
  });

  it('dizi olmayan JSON reddedilir', () => {
    expect(parseImportFile(JSON.stringify({ ad: 'x' })).ok).toBe(false);
  });

  it('boş dizi reddedilir', () => {
    const sonuc = parseImportFile('[]');
    expect(sonuc.ok).toBe(false);
    expect(sonuc.message).toMatch(/hiç kayıt/);
  });
});

describe('validateImportRows', () => {
  it('geçerli kaydı valid listesine koyar', () => {
    const { valid, invalid } = validateImportRows([gecerliSatir], mevcut);
    expect(valid).toHaveLength(1);
    expect(invalid).toHaveLength(0);
  });

  it('zorunlu alanı eksik kaydı sebebiyle ayırır', () => {
    const { invalid } = validateImportRows([{ ...gecerliSatir, name: '' }], mevcut);
    expect(invalid).toHaveLength(1);
    expect(invalid[0].errors.join(' ')).toMatch(/Ad/);
    expect(invalid[0].index).toBe(0);
  });

  it('http(s) ile başlamayan url reddedilir', () => {
    const { invalid } = validateImportRows([{ ...gecerliSatir, url: 'ornek.com' }], mevcut);
    expect(invalid[0].errors.join(' ')).toMatch(/http/);
  });

  // Onaylanan politika: çakışan ad eklenmez, üzerine yazılmaz.
  it('mevcut listedeki adla çakışan kayıt geçersiz sayılır (harf duyarsız)', () => {
    const { valid, invalid } = validateImportRows(
      [{ ...gecerliSatir, name: 'chatgpt' }],
      mevcut
    );
    expect(valid).toHaveLength(0);
    expect(invalid[0].errors.join(' ')).toMatch(/zaten var/);
  });

  // validateForm yalnızca mevcut listeye bakar; bu kontrol importer'da.
  it('aynı dosyada tekrar eden adın ikincisi geçersiz sayılır', () => {
    const { valid, invalid } = validateImportRows(
      [gecerliSatir, { ...gecerliSatir, purpose: 'başka amaç' }],
      mevcut
    );
    expect(valid).toHaveLength(1);
    expect(invalid).toHaveLength(1);
    expect(invalid[0].index).toBe(1);
  });

  it('geçerli ve geçersiz kayıtları birlikte ayırır', () => {
    const { valid, invalid } = validateImportRows(
      [gecerliSatir, { ...gecerliSatir, name: 'İkinci', url: 'bozuk' }],
      mevcut
    );
    expect(valid).toHaveLength(1);
    expect(invalid).toHaveLength(1);
  });

  it('tanınmayan alanları atar, yalnızca bilinen alanları geçirir', () => {
    const { valid } = validateImportRows(
      [{ ...gecerliSatir, id: 99, deleted: true, uydurma: 'x' }],
      mevcut
    );
    expect(valid[0]).not.toHaveProperty('id');
    expect(valid[0]).not.toHaveProperty('deleted');
    expect(valid[0]).not.toHaveProperty('uydurma');
  });

  it('listede olmayan subscription/status varsayılana düşer, kayıt geçerli kalır', () => {
    const { valid } = validateImportRows(
      [{ ...gecerliSatir, subscription: 'Uydurma', status: 'Uydurma' }],
      mevcut
    );
    expect(valid).toHaveLength(1);
    expect(valid[0].status).toBe('Aktif');
    expect(valid[0].subscription).toBe('Ücretsiz');
  });

  it('nesne olmayan girdiyi çökmeden geçersiz sayar', () => {
    const { invalid } = validateImportRows(['metin', 42, null, []], mevcut);
    expect(invalid).toHaveLength(4);
  });

  it('boşlukları kırpar', () => {
    const { valid } = validateImportRows([{ ...gecerliSatir, name: '  Boşluklu  ' }], mevcut);
    expect(valid[0].name).toBe('Boşluklu');
  });
});
