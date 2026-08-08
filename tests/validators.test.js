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

  // currentId formdan/DOM'dan metin olarak gelir, db.json id'leri ise sayıdır.
  // Katı karşılaştırma kullanılırsa araç kendi adına çarpar ve düzenleme kilitlenir.
  it('currentId metin, id sayı olduğunda da aracın kendi adı hariç tutulur', () => {
    const hatalar = validateForm({ ...gecerli, name: 'ChatGPT' }, mevcut, '1');
    expect(hatalar.name).toBeUndefined();
  });

  it('başka bir aracın adı, currentId metin olsa da reddedilir', () => {
    const hatalar = validateForm({ ...gecerli, name: 'Claude' }, mevcut, '1');
    expect(hatalar.name).toBeDefined();
  });

  it('http:// veya https:// ile başlamayan URL reddedilir', () => {
    expect(validateForm({ ...gecerli, url: 'ftp://x.co' }, mevcut).url).toBeDefined();
    expect(validateForm({ ...gecerli, url: 'ornek.com' }, mevcut).url).toBeDefined();
  });

  it('http:// ve https:// kabul edilir', () => {
    expect(validateForm({ ...gecerli, url: 'http://x.co' }, mevcut).url).toBeUndefined();
    expect(validateForm({ ...gecerli, url: 'https://x.co' }, mevcut).url).toBeUndefined();
  });

  it('şema büyük harfle yazılsa da kabul edilir', () => {
    expect(validateForm({ ...gecerli, url: 'HTTPS://X.CO' }, mevcut).url).toBeUndefined();
  });

  it('şema benzeri ama geçersiz adresler reddedilir', () => {
    ['//x.co', 'javascript:alert(1)', 'httpss://x.co', 'http:/x.co'].forEach((url) => {
      expect(validateForm({ ...gecerli, url }, mevcut).url).toBeDefined();
    });
  });

  it('baştaki/sondaki boşluk kırpılır, adres geçerli sayılır', () => {
    expect(validateForm({ ...gecerli, url: '  https://x.co  ' }, mevcut).url).toBeUndefined();
  });
});

// --- Sınır ve hatalı tip senaryoları (Gün 6) ---

describe('validateForm — boş ve hatalı girdiler', () => {
  // K4: doğrulayıcı kendi başına trim etmiyordu; yalnızca çağıranların
  // .trim() yapması sayesinde kurtuluyordu.
  it('yalnızca boşluktan oluşan zorunlu alanlar reddedilir', () => {
    const hatalar = validateForm(
      { name: '   ', category: '\t', purpose: '  ', url: '  ' },
      mevcut
    );
    expect(hatalar.name).toBeDefined();
    expect(hatalar.category).toBeDefined();
    expect(hatalar.purpose).toBeDefined();
    expect(hatalar.url).toBeDefined();
  });

  it('boşluklu ad, kırpılmış hâliyle çakışma sayılır', () => {
    expect(validateForm({ ...gecerli, name: '  ChatGPT  ' }, mevcut).name).toBeDefined();
  });

  it('alanları hiç olmayan nesne çökertmeden dört hata verir', () => {
    const hatalar = validateForm({}, mevcut);
    expect(Object.keys(hatalar).sort()).toEqual(['category', 'name', 'purpose', 'url']);
  });

  it('argümansız çağrı çökmez', () => {
    expect(() => validateForm()).not.toThrow();
    expect(isValid(validateForm())).toBe(false);
  });

  // K3: db.json elle düzenlenip bir kayıttan name düşerse ekleme formu
  // tamamen kilitleniyordu (TypeError).
  it('mevcut listede adsız kayıt varsa çökmez', () => {
    expect(() => validateForm(gecerli, [{ id: 1 }, { id: 2, name: null }])).not.toThrow();
    expect(isValid(validateForm(gecerli, [{ id: 1 }]))).toBe(true);
  });

  it('existingTools verilmezse benzersizlik kontrolü atlanır', () => {
    expect(isValid(validateForm(gecerli))).toBe(true);
  });

  it('listede olmayan bir currentId benzersizliği gevşetmez', () => {
    expect(validateForm({ ...gecerli, name: 'ChatGPT' }, mevcut, 999).name).toBeDefined();
  });
});

// K1: JavaScript'in toLowerCase'i Türkçe İ/ı için yanlış sonuç veriyor —
// "İzleme".toLowerCase() "i̇zleme" (i + birleşen nokta) üretir ve "izleme"ye
// eşit olmaz. Bu yüzden aynı ad iki kez eklenebiliyordu.
describe('validateForm — Türkçe harf duyarsızlığı', () => {
  const turkce = [
    { id: 1, name: 'İzleme' },
    { id: 2, name: 'Ölçüm' },
    { id: 3, name: 'ŞEMA' },
  ];

  it('İ ile i aynı ad sayılır', () => {
    expect(validateForm({ ...gecerli, name: 'izleme' }, turkce).name).toBeDefined();
    expect(validateForm({ ...gecerli, name: 'İZLEME' }, turkce).name).toBeDefined();
  });

  it('ı ile I aynı ad sayılır', () => {
    expect(validateForm({ ...gecerli, name: 'ışık' }, [{ id: 1, name: 'IŞIK' }]).name).toBeDefined();
  });

  it('Ö/ö ve Ş/ş aynı ad sayılır', () => {
    expect(validateForm({ ...gecerli, name: 'ölçüm' }, turkce).name).toBeDefined();
    expect(validateForm({ ...gecerli, name: 'şema' }, turkce).name).toBeDefined();
  });

  it('gerçekten farklı Türkçe adlar çakışmaz', () => {
    expect(validateForm({ ...gecerli, name: 'Ölçek' }, turkce).name).toBeUndefined();
  });

  it('düzenlemede Türkçe kendi adı hariç tutulur', () => {
    expect(validateForm({ ...gecerli, name: 'İzleme' }, turkce, 1).name).toBeUndefined();
  });
});
