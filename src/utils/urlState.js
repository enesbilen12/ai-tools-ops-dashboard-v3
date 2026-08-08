// urlState.js: Görünüm durumu ile adres çubuğu arasındaki çeviri (saf).
//
// Amaç: bir filtre/sıralama/sayfa görünümünün paylaşılabilir ve yenilemeye
// dayanıklı olması. Yalnızca "görünümü" tarif eden alanlar yazılır; tema ve
// favoriler localStorage'da, düzenleme/çekmece durumu ise geçicidir.

import { STATUSES } from '../constants.js';
import { DEFAULT_SORT, isSortOption } from './sorting.js';

// Durum alanı -> sorgu parametresi adı.
const P = {
  search: 'q',
  category: 'category',
  status: 'status',
  sort: 'sort',
  page: 'page',
};

// stateToParams: görünüm durumundan URLSearchParams üretir.
//
// Varsayılan değerler YAZILMAZ; temiz açılışta adres çubuğunda hiç sorgu
// parametresi olmasın (`?q=&category=all&page=1` gibi bir gürültü kalmasın).
export function stateToParams({ filters = {}, sort = DEFAULT_SORT, page = 1 } = {}) {
  const params = new URLSearchParams();

  const arama = (filters.search || '').trim();
  if (arama) params.set(P.search, arama);
  if (filters.category && filters.category !== 'all') {
    params.set(P.category, filters.category);
  }
  if (filters.status && filters.status !== 'all') {
    params.set(P.status, filters.status);
  }
  if (sort && sort !== DEFAULT_SORT) params.set(P.sort, sort);
  if (Number(page) > 1) params.set(P.page, String(page));

  return params;
}

// paramsToState: adres çubuğundan görünüm durumu okur.
//
// URL kullanıcı tarafından elle düzenlenebilir; tanınmayan her değer sessizce
// varsayılana düşer. Kategori doğrulanmaz çünkü geçerli kategoriler veriden
// üretilir ve URL okunduğunda veri henüz gelmemiş olabilir — o hizalamayı
// filters.js bileşeni veri geldikten sonra yapar.
export function paramsToState(search = '') {
  const params = new URLSearchParams(search);

  const sort = params.get(P.sort);
  const status = params.get(P.status);
  const sayfa = Number.parseInt(params.get(P.page), 10);

  return {
    filters: {
      search: params.get(P.search) || '',
      category: params.get(P.category) || 'all',
      status: STATUSES.includes(status) ? status : 'all',
    },
    sort: isSortOption(sort) ? sort : DEFAULT_SORT,
    page: Number.isFinite(sayfa) && sayfa > 0 ? sayfa : 1,
  };
}

// paramsToSearch: URLSearchParams'ı adres çubuğuna yazılacak metne çevirir.
// Boşsa yalnızca yol döner ki adres sonunda tek başına "?" kalmasın.
export function paramsToSearch(params, pathname = '/') {
  const sorgu = params.toString();
  return sorgu ? `${pathname}?${sorgu}` : pathname;
}
