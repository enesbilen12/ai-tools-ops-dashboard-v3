import { describe, it, expect } from 'vitest';
import { validateForm, isValid } from '../src/utils/validators.js';

const mevcut = [
  { id: 1, name: 'ChatGPT', category: 'Metin', purpose: 'x', url: 'https://a.co' },
  { id: 2, name: 'Claude', category: 'Metin', purpose: 'y', url: 'https://b.co' },
];

const gecerli = {
  name: 'Yeni Araç',
  category: 'Kod',
  purpose: 'Bir amaç',
  url: 'https://ornek.com',
};

describe('validateForm', () => {
  it('geçerli veride hata döndürmez', () => {
    const hatalar = validateForm(gecerli, mevcut);
    expect(isValid(hatalar)).toBe(true);
  });

  it('zorunlu alanlar boşsa hata verir', () => {
    const hatalar = validateForm({ name: '', category: '', purpose: '', url: '' }, mevcut);
    expect(hatalar.name).toBeDefined();
    expect(hatalar.category).toBeDefined();
    expect(hatalar.purpose).toBeDefined();
    expect(hatalar.url).toBeDefined();
  });

  it('aynı adlı araç varsa (harf duyarsız) hata verir', () => {
    const hatalar = validateForm({ ...gecerli, name: 'chatgpt' }, mevcut);
    expect(hatalar.name).toBeDefined();
  });

  it('düzenlemede aracın kendi adı benzersizlik kontrolünden hariçtir', () => {
    const hatalar = validateForm({ ...gecerli, name: 'ChatGPT' }, mevcut, 1);
    expect(hatalar.name).toBeUndefined();
  });

  it('http:// veya https:// ile başlamayan URL reddedilir', () => {
    expect(validateForm({ ...gecerli, url: 'ftp://x.co' }, mevcut).url).toBeDefined();
    expect(validateForm({ ...gecerli, url: 'ornek.com' }, mevcut).url).toBeDefined();
  });

  it('http:// ve https:// kabul edilir', () => {
    expect(validateForm({ ...gecerli, url: 'http://x.co' }, mevcut).url).toBeUndefined();
    expect(validateForm({ ...gecerli, url: 'https://x.co' }, mevcut).url).toBeUndefined();
  });
});
