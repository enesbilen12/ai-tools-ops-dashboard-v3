// main.js: Uygulamanın giriş noktası.
// Stilleri yükler, kayıtlı temayı ve adres çubuğundaki görünümü uygular,
// dashboard'u DOM'a bağlar ve araçları json-server'dan çeker.

import './styles/base.css';
import './styles/components.css';
import './styles/responsive.css';

import { loadTheme, loadTools, subscribe, getState, applyUrlState } from './state/store.js';
import { stateToParams, paramsToState, paramsToSearch } from './utils/urlState.js';
import { mountDashboard } from './components/dashboard.js';

// Tema ilk çizimden önce uygulanır ki sayfa açık temayla parlayıp koyuya geçmesin.
loadTheme();

// Adres çubuğundaki görünüm (arama, kategori, durum, sıralama, sayfa) ilk
// çizimden ÖNCE uygulanır: aksi hâlde panel önce varsayılan listeyi çizer,
// sonra filtreye atlardı.
applyUrlState(paramsToState(window.location.search));

mountDashboard(document.querySelector('#app'));

// Durum değiştikçe adres çubuğunu güncelle.
//
// pushState değil replaceState: her filtre değişikliği geri tuşuna bir adım
// eklerse kullanıcı paneli terk etmek için onlarca kez geri basmak zorunda
// kalır. Yazma yalnızca sorgu gerçekten değiştiğinde yapılır — bildir() favori
// işaretleme, çekmece açma gibi görünümle ilgisiz her aksiyonda da çalışıyor.
let sonSorgu = window.location.search.replace(/^\?/, '');

subscribe((durum) => {
  const sorgu = stateToParams(durum).toString();
  if (sorgu === sonSorgu) return;
  sonSorgu = sorgu;
  window.history.replaceState(
    null,
    '',
    paramsToSearch(new URLSearchParams(sorgu), window.location.pathname)
  );
});

// Veri yükleme. Hata olursa store durum.error'ı doldurur; dashboard bunu
// sayfanın üstündeki durum şeridinde gösterir (json-server kapalıysa vb.).
loadTools();
