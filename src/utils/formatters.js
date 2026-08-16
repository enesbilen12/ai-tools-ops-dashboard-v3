// formatters.js: Görüntüleme için saf yardımcılar (yan etkisiz).

// escapeHtml: HTML özel karakterlerini kaçırır. Araç bilgileri innerHTML ile
// basıldığında XSS ve bozuk nitelik riskini kapatır. (v2: guvenliMetin)
export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// optionsHtml: bir <select> için <option> listesi üretir; `selected` değeri işaretlenir.
export function optionsHtml(values, selected) {
  return values
    .map(
      (v) =>
        `<option value="${escapeHtml(v)}"${v === selected ? ' selected' : ''}>${escapeHtml(v)}</option>`
    )
    .join('');
}
