import { describe, it, expect } from 'vitest';
import { stateToParams, paramsToState, paramsToSearch } from '../src/utils/urlState.js';
import { DEFAULT_SORT } from '../src/utils/sorting.js';

const varsayilanDurum = {
  filters: { search: '', category: 'all', status: 'all' },
  sort: DEFAULT_SORT,
  page: 1,
};

describe('stateToParams', () => {
  // Temiz açılışta adres çubuğunda hiç sorgu olmamalı.
  it('varsayılan durumda hiçbir parametre yazmaz', () => {
    expect(stateToParams(varsayilanDurum).toString()).toBe('');
  });

  it('dolu durumu beş parametreye çevirir', () => {
    const params = stateToParams({
      filters: { search: 'chat', category: 'Metin', status: 'Aktif' },
      sort: 'name-desc',
      page: 2,
    });
    expect(params.get('q')).toBe('chat');
    expect(params.get('category')).toBe('Metin');
    expect(params.get('status')).toBe('Aktif');
    expect(params.get('sort')).toBe('name-desc');
    expect(params.get('page')).toBe('2');
  });

  it('yalnızca varsayılandan farklı alanları yazar', () => {
    const params = stateToParams({ ...varsayilanDurum, page: 3 });
    expect(params.toString()).toBe('page=3');
  });

  it('boşlukla dolu aramayı yazmaz', () => {
    const params = stateToParams({ ...varsayilanDurum, filters: { search: '   ' } });
    expect(params.toString()).toBe('');
  });

  it('argümansız çağrıda boş parametre üretir', () => {
    expect(stateToParams().toString()).toBe('');
  });
});

describe('paramsToState', () => {
  it('boş sorguda varsayılan durumu verir', () => {
    expect(paramsToState('')).toEqual(varsayilanDurum);
  });

  it('dolu sorguyu okur', () => {
    expect(paramsToState('?q=chat&category=Metin&status=Aktif&sort=name-desc&page=2')).toEqual({
      filters: { search: 'chat', category: 'Metin', status: 'Aktif' },
      sort: 'name-desc',
      page: 2,
    });
  });

  // URL elle düzenlenebilir; tanınmayan değer uygulamayı kırmamalı.
  it('bilinmeyen sıralamayı varsayılana düşürür', () => {
    expect(paramsToState('?sort=xyz').sort).toBe(DEFAULT_SORT);
  });

  it('listede olmayan durumu "all" yapar', () => {
    expect(paramsToState('?status=Uydurma').filters.status).toBe('all');
  });

  it('sayı olmayan ve sıfır/negatif sayfayı 1 yapar', () => {
    expect(paramsToState('?page=abc').page).toBe(1);
    expect(paramsToState('?page=0').page).toBe(1);
    expect(paramsToState('?page=-3').page).toBe(1);
  });

  // Geçerli kategoriler veriden üretilir ve URL okunduğunda veri henüz
  // gelmemiş olabilir; hizalamayı filters.js bileşeni sonra yapar.
  it('kategoriyi doğrulamadan geçirir', () => {
    expect(paramsToState('?category=Metin').filters.category).toBe('Metin');
  });

  it('gidiş-dönüş (round trip) durumu korur', () => {
    const durum = {
      filters: { search: 'görsel', category: 'Görsel', status: 'Deneme' },
      sort: 'category-asc',
      page: 4,
    };
    expect(paramsToState(`?${stateToParams(durum)}`)).toEqual(durum);
  });
});

describe('paramsToSearch', () => {
  it('boş parametrede yalnızca yolu döndürür (sondaki ? kalmaz)', () => {
    expect(paramsToSearch(new URLSearchParams(), '/panel')).toBe('/panel');
  });

  it('dolu parametreyi yola ekler', () => {
    expect(paramsToSearch(new URLSearchParams({ page: '2' }), '/panel')).toBe('/panel?page=2');
  });
});
