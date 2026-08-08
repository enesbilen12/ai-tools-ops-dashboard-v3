import { describe, it, expect } from 'vitest';
import {
  pageCount,
  clampPage,
  paginateTools,
  DEFAULT_PAGE_SIZE,
} from '../src/utils/pagination.js';

// 25 kayıtlık sahte liste: 12'lik sayfalarda 3 sayfa (12 + 12 + 1) eder.
const liste = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Araç ${i + 1}` }));

describe('pageCount', () => {
  it('tam bölünen listede doğru sayfa sayısı verir', () => {
    expect(pageCount(24, 12)).toBe(2);
  });

  it('artan kayıt için fazladan sayfa açar', () => {
    expect(pageCount(25, 12)).toBe(3);
  });

  it('boş listede bile en az 1 sayfa vardır', () => {
    expect(pageCount(0, 12)).toBe(1);
  });

  it('pageSize verilmezse varsayılanı kullanır', () => {
    expect(pageCount(DEFAULT_PAGE_SIZE + 1)).toBe(2);
  });
});

describe('clampPage', () => {
  it('aralıktaki sayfayı olduğu gibi bırakır', () => {
    expect(clampPage(2, 25, 12)).toBe(2);
  });

  it('son sayfayı aşan numarayı son sayfaya çeker', () => {
    expect(clampPage(99, 25, 12)).toBe(3);
  });

  it('sıfır ve negatif sayfayı 1 yapar', () => {
    expect(clampPage(0, 25, 12)).toBe(1);
    expect(clampPage(-4, 25, 12)).toBe(1);
  });

  // URL elle düzenlenebilir: ?page=abc uygulamayı kırmamalı.
  it('sayı olmayan sayfayı 1 yapar', () => {
    expect(clampPage('abc', 25, 12)).toBe(1);
    expect(clampPage(NaN, 25, 12)).toBe(1);
    expect(clampPage(undefined, 25, 12)).toBe(1);
  });

  it('metin olarak gelen geçerli sayfayı okur', () => {
    expect(clampPage('2', 25, 12)).toBe(2);
  });
});

describe('paginateTools', () => {
  it('ilk sayfada pageSize kadar kayıt döndürür', () => {
    const sayfa = paginateTools(liste, 1, 12);
    expect(sayfa).toHaveLength(12);
    expect(sayfa[0].id).toBe(1);
  });

  it('ikinci sayfa doğru dilimden başlar', () => {
    expect(paginateTools(liste, 2, 12)[0].id).toBe(13);
  });

  it('son sayfada yalnızca kalan kayıtlar gelir', () => {
    const sonSayfa = paginateTools(liste, 3, 12);
    expect(sonSayfa).toHaveLength(1);
    expect(sonSayfa[0].id).toBe(25);
  });

  // Son sayfadaki tek kart silinince durumdaki sayfa numarası eskir;
  // boş ızgara yerine mevcut son sayfa gösterilmeli.
  it('taşan sayfa numarasında son sayfayı döndürür', () => {
    expect(paginateTools(liste, 99, 12)).toEqual(paginateTools(liste, 3, 12));
  });

  it('bozuk sayfa numarasında ilk sayfayı döndürür', () => {
    expect(paginateTools(liste, 'abc', 12)).toEqual(paginateTools(liste, 1, 12));
  });

  it('boş listede boş dizi döndürür', () => {
    expect(paginateTools([], 1, 12)).toEqual([]);
  });

  it('girdi dizisini değiştirmez', () => {
    const kopya = [...liste];
    paginateTools(liste, 2, 12);
    expect(liste).toEqual(kopya);
  });
});
