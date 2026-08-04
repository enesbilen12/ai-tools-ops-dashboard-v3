// toast.js: Silme sonrası çıkan "geri al" şeridi.
//
// Silme artık `confirm()` sormuyor (tek tık); güvence bu toast. Süre dolunca
// hiçbir şey yok edilmez — kayıt `deleted: true` olarak çöp menüsünde durur,
// toast yalnızca kısayolun süresidir.

import { escapeHtml } from '../utils/formatters.js';
import { undoDelete, clearUndo } from '../state/store.js';

// Geri alma kısayolunun ekranda kalma süresi.
const SURE_MS = 5000;

export function mountToast(kap) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.hidden = true;
  kap.appendChild(toast);

  // Sayaç bileşende tutulur; store yan etkisiz kalsın diye (test edilebilirlik).
  let sayac = null;
  // Toast yalnızca gösterilen kayıt DEĞİŞTİĞİNDE yeniden çizilir ve sayaç
  // yalnızca o an kurulur. Her bildirimde kurulsaydı toast hiç kapanmazdı.
  let sonUndoId = null;
  // Geri alma engellenirse (aynı adlı aktif araç varsa) sebebi burada durur.
  let hataMetni = '';
  // En son çizilen kayıt; tıklama işleyicisi yeniden çizerken buna bakar.
  let sonuncuUndo = null;

  function sayaciDurdur() {
    if (sayac !== null) {
      clearTimeout(sayac);
      sayac = null;
    }
  }

  function ciz(undo) {
    if (!undo) {
      toast.hidden = true;
      toast.innerHTML = '';
      return;
    }
    toast.innerHTML = `
      <span class="toast-metin">"${escapeHtml(undo.name)}" silindi.</span>
      ${hataMetni ? `<span class="toast-hata">${escapeHtml(hataMetni)}</span>` : ''}
      <button class="toast-geri-btn" type="button">↩︎ Geri al</button>
      <button class="toast-kapat" type="button" aria-label="Kapat">×</button>
    `;
    toast.hidden = false;
  }

  toast.addEventListener('click', async (olay) => {
    if (olay.target.closest('.toast-kapat')) {
      sayaciDurdur();
      clearUndo();
      return;
    }

    if (olay.target.closest('.toast-geri-btn')) {
      // Geri alma sürerken sayaç toast'ı altından çekmesin.
      sayaciDurdur();
      const sonuc = await undoDelete();
      if (!sonuc.ok) {
        // Başarısızsa toast açık kalır ve sebebi gösterir.
        hataMetni = sonuc.message;
        ciz(sonuncuUndo);
      }
    }
  });

  return {
    update(durum) {
      const undo = durum.undo;
      const undoId = undo ? undo.id : null;

      if (String(undoId) !== String(sonUndoId)) {
        sonUndoId = undoId;
        sonuncuUndo = undo;
        hataMetni = '';
        sayaciDurdur();
        ciz(undo);

        if (undo) {
          sayac = setTimeout(() => {
            sayac = null;
            clearUndo(); // yalnızca kısayol biter; kayıt çöpte kalır
          }, SURE_MS);
        }
        return;
      }

      // Aynı kayıt duruyor: yalnızca buton kilidini tazele.
      if (undo) {
        toast.querySelectorAll('button').forEach((btn) => {
          btn.disabled = durum.saving;
        });
      }
    },
  };
}
