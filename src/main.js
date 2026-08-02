// main.js: Uygulamanın giriş noktası.
// Stilleri yükler, kayıtlı temayı uygular, dashboard'u DOM'a bağlar ve
// araçları json-server'dan çeker.

import './styles/base.css';
import './styles/components.css';
import './styles/responsive.css';

import { loadTheme, loadTools } from './state/store.js';
import { mountDashboard } from './components/dashboard.js';

// Tema ilk çizimden önce uygulanır ki sayfa açık temayla parlayıp koyuya geçmesin.
loadTheme();

mountDashboard(document.querySelector('#app'));

// Veri yükleme. Hata olursa store durum.error'ı doldurur; dashboard bunu
// sayfanın üstündeki durum şeridinde gösterir (json-server kapalıysa vb.).
loadTools();
